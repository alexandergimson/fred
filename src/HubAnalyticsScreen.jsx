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
import { TableShell, Table, Thead, Th, Tr, Td } from "./components/ui/Table";

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

          <div className="flex-1 overflow-auto ml-8 mr-8 mb-5">
            <div className="max-w-screen-2xl mx-auto space-y-8">
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
              {/* Content Analytics */}
              <section className="rounded-lg rounded-b-none overflow-hidden">
                <div className="overflow-x-auto">
                  <TableShell>
                    <Table>
                      <colgroup>
                        <col className="w-[44%]" />
                        <col className="w-[14%]" />
                        <col className="w-[12%]" />
                        <col className="w-[14%]" />
                        <col className="w-[16%]" />
                      </colgroup>

                      <Thead>
                        <tr>
                          <Th>Content</Th>
                          <Th>Type</Th>
                          <Th>Views</Th>
                          <Th>Completion</Th>
                          <Th className="0 text-right">Last viewed</Th>
                        </tr>
                      </Thead>

                      <tbody>
                        {rows.map((r, idx) => (
                          <Tr
                            key={r.id}
                            className={`transition-colors border-b border-gray-100 ${
                              idx % 2 === 1 ? "bg-white" : "bg-gray-50/30"
                            }`}
                          >
                            <Td className="px-6 py-3">
                              <div title={r.title || r.id}>
                                {r.title || r.id}
                              </div>
                            </Td>

                            <Td className="px-6 py-3 text-gray-700">
                              <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-xs bg-white">
                                {r.type || "—"}
                              </span>
                            </Td>

                            <Td>
                              {r._metrics.viewCount?.toLocaleString?.() ?? 0}
                            </Td>

                            <Td className="px-6 py-3 text-right tabular-nums">
                              {formatPct(r._metrics.completionRate)}
                            </Td>

                            <Td className="px-6 py-3 text-right text-gray-700">
                              <span title={formatDate(r._metrics.lastViewedAt)}>
                                {formatDate(r._metrics.lastViewedAt)}
                              </span>
                            </Td>
                          </Tr>
                        ))}

                        {rows.length === 0 && (
                          <Tr>
                            <Td
                              colSpan={5}
                              className="px-6 py-10 text-center text-gray-500"
                            >
                              No content yet — add items to this hub to see
                              analytics.
                            </Td>
                          </Tr>
                        )}
                      </tbody>
                    </Table>
                  </TableShell>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
