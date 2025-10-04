// src/lib/track.ts
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

type Params = {
  hubId: string;
  contentId: string;
  shareId?: string | null;
};

/**
 * Tracks a content view.
 * - Always updates lastViewed (server time)
 * - Increments views once per (hubId, shareId|direct, contentId) per browser session
 * - Writes hub-level rollups + events; also per-share if shareId provided
 */
export async function trackContentView({ hubId, contentId, shareId }: Params) {
  if (!hubId || !contentId) {
    console.warn("[TRACK] Missing hubId or contentId", { hubId, contentId });
    return;
  }

  const sid = shareId || "direct";
  const dedupeKey = `viewed:${hubId}:${sid}:${contentId}`;
  const firstThisSession = !sessionStorage.getItem(dedupeKey);

  const hubRollupRef = doc(db, "hubs", hubId, "contentAnalytics", contentId);
  const shareRollupRef = shareId
    ? doc(db, "shares", shareId, "contentAnalytics", contentId)
    : null;

  // Always bump lastViewed; bump views only on first view this session
  const base = { lastViewed: serverTimestamp() };
  const withCount = firstThisSession ? { ...base, views: increment(1) } : base;

  try {
    await setDoc(hubRollupRef, withCount, { merge: true });
    if (shareRollupRef) await setDoc(shareRollupRef, withCount, { merge: true });
    // Mark de-dupe only after rollup succeeds
    if (firstThisSession) sessionStorage.setItem(dedupeKey, "1");
  } catch (err) {
    console.error("[TRACK] Rollup write failed", err);
  }

  // Write immutable events only on first view this session
  if (firstThisSession) {
    const payload = {
      type: "page_view" as const,
      hubId,
      shareId: shareId || null,
      contentId,
      ts: serverTimestamp(),
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
      ref: typeof document !== "undefined" ? document.referrer || null : null,
    };
    try {
      await addDoc(collection(db, "hubs", hubId, "events"), payload);
      if (shareId) await addDoc(collection(db, "shares", shareId, "events"), payload);
    } catch (err) {
      console.error("[TRACK] Event write failed", err);
    }
  }
}
