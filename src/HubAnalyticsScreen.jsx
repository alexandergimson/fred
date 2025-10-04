// HubAnalyticsScreen.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import HubScreenHeader from "./HubScreenHeader";
import AnalyticsIcon from "./icons/AnalyticsIcon";

/* helpers */
function formatDuration(sec) {
  if (sec === undefined || sec === null) return "—";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}m ${r}s` : `${r}s`;
}
function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
function formatPct(v) {
  if (v === undefined || v === null) return "—";
  return `${Math.round(v * 100)}%`;
}

// Same comparator as ProspectLayout (position → createdAt desc → name)
function sortLikeProspect(content) {
  const BIG = 9e15;
  return [...content].sort((a, b) => {
    const pa = typeof a.position === "number" ? a.position : BIG;
    const pb = typeof b.position === "number" ? b.position : BIG;
    if (pa !== pb) return pa - pb;

    const ca = a.createdAt?.toMillis?.() ?? 0;
    const cb = b.createdAt?.toMillis?.() ?? 0;
    if (ca !== cb) return cb - ca;

    return (a.name || "").localeCompare(b.name || "");
  });
}

export default function HubAnalyticsScreen() {
  const { hubId } = useParams();

  const [loadingHub, setLoadingHub] = useState(true);
  const [hubName, setHubName] = useState("Analytics");

  // Source collections
  const [contentDocs, setContentDocs] = useState([]); // [{id, ...data}]
  const [analyticsById, setAnalyticsById] = useState(new Map()); // contentId -> {views, lastViewed, ...}

  // Load hub name for header
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId));
        if (active && snap.exists()) {
          const d = snap.data();
          setHubName(d.name || "Analytics");
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoadingHub(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [hubId]);

  // Subscribe to content (server-ordered by createdAt desc; we’ll re-sort locally)
  useEffect(() => {
    if (!hubId) return;
    const qContent = query(
      collection(db, `hubs/${hubId}/content`),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      qContent,
      (snap) => {
        setContentDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error(err)
    );
    return () => unsub();
  }, [hubId]);

  // Subscribe to contentAnalytics (rollup)
  useEffect(() => {
    if (!hubId) return;
    const colRef = collection(db, `hubs/${hubId}/contentAnalytics`);
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const map = new Map();
        snap.forEach((d) => {
          map.set(d.id, d.data());
        });
        setAnalyticsById(map);
      },
      (err) => {
        console.error("[analytics] contentAnalytics read error", err);
        setAnalyticsById(new Map());
      }
    );
    return () => unsub();
  }, [hubId]);

  // Prospect-order rows: sort content like prospect, then merge analytics
  const rows = useMemo(() => {
    const ordered = sortLikeProspect(contentDocs);
    return ordered.map((c) => {
      const a = analyticsById.get(c.id) || {};
      return {
        id: c.id,
        title: c.title || c.name || c.filename || c.id,
        type: c.type || c.kind || "—",
        _metrics: {
          viewCount: a.views ?? 0,
          avgEngagementSec: a.avgEngagementSec ?? null,
          completionRate: a.completionRate ?? null,
          lastViewedAt: a.lastViewed ?? null,
        },
      };
    });
  }, [contentDocs, analyticsById]);

  // Overview cards (sum views, latest lastViewed, mean of per-content avgEngagementSec if present)
  const overview = useMemo(() => {
    let totalViews = 0;
    let lastViewedLatest = null;
    let totalEngSec = 0;
    let engCount = 0;

    analyticsById.forEach((a) => {
      totalViews += Number(a?.views || 0);

      const lv = a?.lastViewed;
      if (lv) {
        if (!lastViewedLatest) lastViewedLatest = lv;
        else {
          const lvDate = lv.toDate ? lv.toDate() : new Date(lv);
          const curDate = lastViewedLatest.toDate
            ? lastViewedLatest.toDate()
            : new Date(lastViewedLatest);
          if (lvDate > curDate) lastViewedLatest = lv;
        }
      }

      if (typeof a?.avgEngagementSec === "number") {
        totalEngSec += a.avgEngagementSec;
        engCount += 1;
      }
    });

    const avgEngagementSec =
      engCount > 0 ? Math.round(totalEngSec / engCount) : null;

    return {
      viewCount: totalViews,
      avgEngagementSec,
      lastViewedAt: lastViewedLatest,
    };
  }, [analyticsById]);

  if (loadingHub) return <div className="p-6">Loading…</div>;

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title={`${hubName} | analytics`}
            secondaryAction={{
              label: "Preview Hub",
              href: `/prospect/${hubId}`,
            }}
            action={{
              label: "Analytics",
              href: `/admin/analytics`,
              icon: <AnalyticsIcon className="w-5 h-5" />,
            }}
          />

          <div className="flex-1 overflow-auto px-6 pb-6">
            <div className="max-w-screen-2xl mx-auto space-y-8">
              {/* Hub Overview */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="text-sm text-gray-500">Total views</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {overview.viewCount?.toLocaleString?.() ?? 0}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="text-sm text-gray-500">Avg. engagement</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {formatDuration(overview.avgEngagementSec)}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="text-sm text-gray-500">Last viewed</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {formatDate(overview.lastViewedAt)}
                  </div>
                </div>
              </section>

              {/* Content Analytics */}
              <section className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-base table-auto">
                    <colgroup>
                      <col className="w-[40%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[16%]" />
                      <col className="w-[10%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-3">Content</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">Views</th>
                        <th className="text-left px-4 py-3">Avg. engagement</th>
                        <th className="text-left px-4 py-3">Completion</th>
                        <th className="text-left px-4 py-3">Last viewed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.id}
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <div
                              className="truncate font-medium"
                              title={r.title || r.id}
                            >
                              {r.title || r.id}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {r.type || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {r._metrics.viewCount?.toLocaleString?.() ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            {formatDuration(r._metrics.avgEngagementSec)}
                          </td>
                          <td className="px-4 py-3">
                            {formatPct(r._metrics.completionRate)}
                          </td>
                          <td className="px-4 py-3">
                            {formatDate(r._metrics.lastViewedAt)}
                          </td>
                        </tr>
                      ))}

                      {rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-10 text-center text-gray-500"
                          >
                            No content yet — add items to this hub to see
                            analytics.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
