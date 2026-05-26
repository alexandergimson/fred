import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

type BaseParams = {
  hubId: string;
  shareId?: string | null;
};

type ContentParams = BaseParams & {
  contentId: string;
};

type EngagementParams = ContentParams & {
  durationSec: number;
};

type HubEngagementParams = BaseParams & {
  durationSec: number;
};

const DIRECT_SHARE_ID = "direct";

function safeSessionStorage() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDeviceType() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

function getVisitContext({ hubId, shareId }: BaseParams) {
  const sid = shareId || DIRECT_SHARE_ID;
  const storage = safeSessionStorage();
  const key = `fred:visit:${hubId}:${sid}`;

  let visitId = storage?.getItem(key);

  if (!visitId) {
    visitId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    storage?.setItem(key, visitId);
  }

  return { sid, visitId };
}

function hasSessionFlag(key: string) {
  return safeSessionStorage()?.getItem(key) === "1";
}

function setSessionFlag(key: string) {
  safeSessionStorage()?.setItem(key, "1");
}

function eventPayload({
  type,
  hubId,
  shareId,
  visitId,
  contentId = null,
  durationSec = null,
}: {
  type: string;
  hubId: string;
  shareId?: string | null;
  visitId: string;
  contentId?: string | null;
  durationSec?: number | null;
}) {
  return {
    type,
    hubId,
    shareId: shareId || null,
    visitId,
    contentId,
    durationSec,
    ts: serverTimestamp(),
    day: getDayKey(),
    path: typeof location !== "undefined" ? location.pathname : null,
    ref: typeof document !== "undefined" ? document.referrer || null : null,
    ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
    deviceType: getDeviceType(),
  };
}

async function writeEvent({
  hubId,
  shareId,
  payload,
}: {
  hubId: string;
  shareId?: string | null;
  payload: Record<string, unknown>;
}) {
  await addDoc(collection(db, "hubs", hubId, "events"), payload);
  if (shareId) {
    await addDoc(collection(db, "shares", shareId, "events"), payload);
  }
}

async function mergeShareSummary(
  shareId: string | null | undefined,
  patch: Record<string, unknown>,
) {
  if (!shareId) return;
  await setDoc(doc(db, "shares", shareId, "analytics", "summary"), patch, {
    merge: true,
  });
}

export async function trackHubOpened({ hubId, shareId }: BaseParams) {
  if (!hubId) return;

  const { sid, visitId } = getVisitContext({ hubId, shareId });
  const dedupeKey = `fred:tracked:hub-opened:${hubId}:${sid}:${visitId}`;
  const firstThisVisit = !hasSessionFlag(dedupeKey);

  if (!firstThisVisit) return;

  const summaryRef = doc(db, "hubs", hubId, "analytics", "summary");
  const dailyRef = doc(db, "hubs", hubId, "dailyAnalytics", getDayKey());
  const shareDailyRef = shareId
    ? doc(db, "shares", shareId, "dailyAnalytics", getDayKey())
    : null;

  const summaryPatch = {
    hubViews: increment(1),
    uniqueVisits: increment(1),
    lastViewed: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const dailyPatch = {
    day: getDayKey(),
    hubViews: increment(1),
    uniqueVisits: increment(1),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(summaryRef, summaryPatch, { merge: true });
    await setDoc(dailyRef, dailyPatch, { merge: true });
    await mergeShareSummary(shareId, summaryPatch);
    if (shareDailyRef) await setDoc(shareDailyRef, dailyPatch, { merge: true });

    await writeEvent({
      hubId,
      shareId,
      payload: eventPayload({
        type: "hub_opened",
        hubId,
        shareId,
        visitId,
      }),
    });

    setSessionFlag(dedupeKey);
  } catch (err) {
    console.error("[TRACK] Hub open failed", err);
  }
}

export async function trackHubEngagement({
  hubId,
  shareId,
  durationSec,
}: HubEngagementParams) {
  if (!hubId || !Number.isFinite(durationSec) || durationSec <= 0) return;

  const { visitId } = getVisitContext({ hubId, shareId });
  const roundedSec = Math.max(1, Math.round(durationSec));
  const patch = {
    totalEngagementSec: increment(roundedSec),
    lastEngaged: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const dailyPatch = {
    day: getDayKey(),
    totalEngagementSec: increment(roundedSec),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, "hubs", hubId, "analytics", "summary"), patch, {
      merge: true,
    });
    await setDoc(doc(db, "hubs", hubId, "dailyAnalytics", getDayKey()), dailyPatch, {
      merge: true,
    });
    await mergeShareSummary(shareId, patch);

    if (shareId) {
      await setDoc(
        doc(db, "shares", shareId, "dailyAnalytics", getDayKey()),
        dailyPatch,
        { merge: true },
      );
    }

    await writeEvent({
      hubId,
      shareId,
      payload: eventPayload({
        type: "hub_engagement",
        hubId,
        shareId,
        visitId,
        durationSec: roundedSec,
      }),
    });
  } catch (err) {
    console.error("[TRACK] Hub engagement failed", err);
  }
}

export async function trackContentView({
  hubId,
  contentId,
  shareId,
}: ContentParams) {
  if (!hubId || !contentId) {
    console.warn("[TRACK] Missing hubId or contentId", { hubId, contentId });
    return;
  }

  const { sid, visitId } = getVisitContext({ hubId, shareId });
  const dedupeKey = `fred:tracked:content-view:${hubId}:${sid}:${visitId}:${contentId}`;
  const firstThisVisit = !hasSessionFlag(dedupeKey);

  const hubRollupRef = doc(db, "hubs", hubId, "contentAnalytics", contentId);
  const shareRollupRef = shareId
    ? doc(db, "shares", shareId, "contentAnalytics", contentId)
    : null;

  const base = { lastViewed: serverTimestamp(), updatedAt: serverTimestamp() };
  const withCount = firstThisVisit
    ? {
        ...base,
        views: increment(1),
        uniqueVisits: increment(1),
      }
    : base;

  try {
    await setDoc(hubRollupRef, withCount, { merge: true });
    if (shareRollupRef) await setDoc(shareRollupRef, withCount, { merge: true });

    if (firstThisVisit) {
      await setDoc(
        doc(db, "hubs", hubId, "dailyAnalytics", getDayKey()),
        {
          day: getDayKey(),
          contentViews: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await writeEvent({
        hubId,
        shareId,
        payload: eventPayload({
          type: "content_opened",
          hubId,
          shareId,
          visitId,
          contentId,
        }),
      });

      setSessionFlag(dedupeKey);
    }
  } catch (err) {
    console.error("[TRACK] Content view failed", err);
  }
}

export async function trackContentEngagement({
  hubId,
  contentId,
  shareId,
  durationSec,
}: EngagementParams) {
  if (
    !hubId ||
    !contentId ||
    !Number.isFinite(durationSec) ||
    durationSec <= 0
  ) {
    return;
  }

  const { visitId } = getVisitContext({ hubId, shareId });
  const roundedSec = Math.max(1, Math.round(durationSec));
  const patch = {
    totalEngagementSec: increment(roundedSec),
    lastEngaged: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, "hubs", hubId, "contentAnalytics", contentId), patch, {
      merge: true,
    });

    if (shareId) {
      await setDoc(
        doc(db, "shares", shareId, "contentAnalytics", contentId),
        patch,
        { merge: true },
      );
    }

    await writeEvent({
      hubId,
      shareId,
      payload: eventPayload({
        type: "content_engagement",
        hubId,
        shareId,
        visitId,
        contentId,
        durationSec: roundedSec,
      }),
    });
  } catch (err) {
    console.error("[TRACK] Content engagement failed", err);
  }
}
