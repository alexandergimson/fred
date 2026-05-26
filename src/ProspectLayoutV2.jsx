import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./lib/firebase";
import { listHubItems } from "./lib/hubItems";
import HubExperience from "./HubExperience";
import { trackHubEngagement, trackHubOpened } from "./lib/track";
import { getShareLink } from "./lib/shares";

export default function ProspectLayoutV2() {
  const { hubId } = useParams();
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("s") || searchParams.get("share") || null;

  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState(null);
  const [items, setItems] = useState([]);
  const [validShareId, setValidShareId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const hubSnap = await getDoc(doc(db, "hubs", hubId));

        if (!hubSnap.exists()) {
          setHub(null);
          return;
        }

        const nextItems = await listHubItems(hubId);
        const share = shareId ? await getShareLink(shareId) : null;
        const nextShareId =
          share && share.hubId === hubId && share.status !== "revoked"
            ? share.id
            : null;

        setHub({ id: hubSnap.id, ...hubSnap.data() });
        setItems(nextItems);
        setValidShareId(nextShareId);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hubId, shareId]);

  useEffect(() => {
    if (!hubId || !hub) return;

    trackHubOpened({ hubId, shareId: validShareId });

    let lastTick = Date.now();

    function flushEngagement({ force = false } = {}) {
      if (!force && document.visibilityState === "hidden") {
        lastTick = Date.now();
        return;
      }

      const now = Date.now();
      const durationSec = Math.round((now - lastTick) / 1000);
      lastTick = now;

      if (durationSec > 0) {
        trackHubEngagement({ hubId, shareId: validShareId, durationSec });
      }
    }

    const intervalId = window.setInterval(flushEngagement, 15000);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushEngagement({ force: true });
      } else {
        lastTick = Date.now();
      }
    }

    function handlePageHide() {
      flushEngagement({ force: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      flushEngagement({ force: true });
    };
  }, [hubId, hub, validShareId]);

  const sortedItems = useMemo(() => {
    const BIG = 9e15;

    return [...items].sort((a, b) => {
      const pa = typeof a.position === "number" ? a.position : BIG;
      const pb = typeof b.position === "number" ? b.position : BIG;
      return pa - pb;
    });
  }, [items]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F4F7FE]">
        <div className="text-sm text-gray-500">Loading hub…</div>
      </main>
    );
  }

  if (!hub) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F4F7FE]">
        <div className="text-sm text-gray-500">Hub not found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {" "}
      <HubExperience
        hub={hub}
        hubId={hubId}
        items={sortedItems}
        mode="public"
        shareId={validShareId}
      />
    </main>
  );
}
