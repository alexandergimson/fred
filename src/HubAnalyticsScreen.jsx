import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Clock3, Layers3, Users } from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import HubScreenHeader from "./HubScreenHeader";
import AnalyticsIcon from "./icons/AnalyticsIcon";
import PreviewIcon from "./icons/PreviewIcon";
import HubShareLinksSection from "./components/analytics/HubShareLinksSection";
import {
  AdminLoadingState,
  AdminPage,
  AdminPageContent,
  AdminPageHeader,
} from "./components/admin/AdminPage";

function formatDuration(sec) {
  if (sec === undefined || sec === null) return "—";
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;

  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${r}s`;
  return `${r}s`;
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

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

function dayLabel(day) {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function InsightCard({
  label,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  tone = "blue",
  icon,
}) {
  const tones = {
    blue: {
      icon: "bg-[#1F50AF] text-white shadow-[0_10px_22px_rgba(31,80,175,0.24)]",
    },
    green: {
      icon: "bg-[#9ABFBC] text-white shadow-[0_10px_22px_rgba(154,191,188,0.28)]",
    },
    amber: {
      icon: "bg-[#F59E0B] text-white shadow-[0_10px_22px_rgba(245,158,11,0.22)]",
    },
    slate: {
      icon: "bg-gray-900 text-white shadow-[0_10px_22px_rgba(17,24,39,0.18)]",
    },
  };

  const style = tones[tone] || tones.blue;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(16,24,40,0.08)]">
      <div className="flex items-center gap-3">
        {icon ? (
          <div
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${style.icon}`}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 truncate text-base font-semibold text-gray-900">
          {label}
        </div>
      </div>
      <div className="mt-5 h-px bg-gray-200" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold tracking-normal text-gray-950 tabular-nums">
            {primaryValue}
          </div>
          <div className="mt-1 truncate text-xs text-gray-500">
            {primaryLabel}
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold tracking-normal text-gray-950 tabular-nums">
            {secondaryValue}
          </div>
          <div className="mt-1 truncate text-xs text-gray-500">
            {secondaryLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionShell({ title, description, children, aside, className = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-gray-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function PerformanceOverview({ points }) {
  const width = 760;
  const height = 260;
  const paddingX = 48;
  const paddingTop = 26;
  const paddingBottom = 42;
  const chartHeight = height - paddingTop - paddingBottom;
  const recentPoints = points.slice(-6);
  const maxValue = Math.max(
    1,
    ...recentPoints.flatMap((point) => [
      Number(point.hubViews || 0),
      Number(point.uniqueVisits || 0),
      Number(point.contentViews || 0),
    ]),
  );
  const gap = 42;
  const barWidth = 44;
  const totalWidth =
    recentPoints.length * barWidth + (recentPoints.length - 1) * gap;
  const startX = (width - totalWidth) / 2;
  const peakPoint = [...recentPoints].sort(
    (a, b) => Number(b.hubViews || 0) - Number(a.hubViews || 0),
  )[0];

  const legend = (
    <div className="flex flex-wrap items-center gap-5 text-sm">
      <span className="text-gray-500">
        Last {recentPoints.length || 0} active days
      </span>
      <span className="inline-flex items-center gap-2 text-gray-600">
        <span className="h-2.5 w-2.5 rounded-full bg-[#EFEAFE]" />
        Unique visits
      </span>
      <span className="inline-flex items-center gap-2 text-gray-600">
        <span className="h-2.5 w-2.5 rounded-full bg-[#6554F4]" />
        Hub views
      </span>
      <span className="inline-flex items-center gap-2 text-gray-600">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
        Content views
      </span>
    </div>
  );

  return (
    <SectionShell
      title="Performance overview"
      description="Recent hub traffic and content activity."
      aside={legend}
    >
      <div className="p-6">
        {recentPoints.length === 0 ? (
          <div className="grid h-64 place-items-center rounded-md bg-gray-50 text-sm text-gray-500">
            Traffic data will appear once prospects open this hub.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-72 w-full overflow-visible"
            role="img"
            aria-label="Hub performance bar chart"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const y = paddingTop + chartHeight - tick * chartHeight;
              return (
                <g key={tick}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray="8 10"
                  />
                  <text
                    x={paddingX - 16}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-gray-400 text-[11px]"
                  >
                    {Math.round(maxValue * tick)}
                  </text>
                </g>
              );
            })}

            {recentPoints.map((point, index) => {
              const x = startX + index * (barWidth + gap);
              const uniqueHeight =
                (Number(point.uniqueVisits || 0) / maxValue) * chartHeight;
              const hubHeight =
                (Number(point.hubViews || 0) / maxValue) * chartHeight;
              const contentHeight =
                (Number(point.contentViews || 0) / maxValue) * chartHeight;
              const uniqueY = paddingTop + chartHeight - uniqueHeight;
              const hubY = paddingTop + chartHeight - hubHeight;
              const contentY = paddingTop + chartHeight - contentHeight;
              const isPeak = peakPoint && point.day === peakPoint.day;

              return (
                <g key={point.day || index}>
                  <rect
                    x={x}
                    y={uniqueY}
                    width={barWidth}
                    height={Math.max(8, uniqueHeight)}
                    rx="10"
                    fill="#EFEAFE"
                  />
                  <rect
                    x={x + 4}
                    y={hubY}
                    width={barWidth - 8}
                    height={Math.max(8, hubHeight)}
                    rx="10"
                    fill="#6554F4"
                  />
                  <rect
                    x={x + barWidth - 9}
                    y={contentY}
                    width="5"
                    height={Math.max(8, contentHeight)}
                    rx="2.5"
                    fill="#F59E0B"
                    opacity="0.85"
                  />
                  {isPeak ? (
                    <>
                      <line
                        x1={x + barWidth / 2}
                        y1={hubY - 4}
                        x2={x + barWidth / 2}
                        y2={paddingTop + chartHeight}
                        stroke="#6554F4"
                        strokeOpacity="0.16"
                        strokeDasharray="4 6"
                      />
                      <circle
                        cx={x + barWidth / 2}
                        cy={hubY}
                        r="6"
                        fill="#6554F4"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                      />
                    </>
                  ) : null}
                  <text
                    x={x + barWidth / 2}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-gray-700 text-[12px]"
                  >
                    {dayLabel(point.day || point.id)}
                  </text>
                  <title>{`${dayLabel(point.day || point.id)}: ${Number(point.hubViews || 0)} hub views, ${Number(point.uniqueVisits || 0)} unique visits, ${Number(point.contentViews || 0)} content views`}</title>
                </g>
              );
            })}

            {peakPoint ? (
              <g>
                <rect
                  x="410"
                  y="44"
                  width="190"
                  height="76"
                  rx="6"
                  fill="white"
                  stroke="#EEF2F7"
                  filter="drop-shadow(0 14px 22px rgba(16,24,40,0.12))"
                />
                <text
                  x="428"
                  y="72"
                  className="fill-gray-950 text-[13px] font-semibold"
                >
                  {dayLabel(peakPoint.day || peakPoint.id)}
                </text>
                <circle cx="430" cy="93" r="4" fill="#6554F4" />
                <text x="442" y="97" className="fill-gray-500 text-[12px]">
                  Hub views
                </text>
                <text
                  x="582"
                  y="97"
                  textAnchor="end"
                  className="fill-gray-950 text-[12px] font-semibold"
                >
                  {Number(peakPoint.hubViews || 0)}
                </text>
              </g>
            ) : null}
          </svg>
        )}
      </div>
    </SectionShell>
  );
}

function BarList({ rows, labelFor, valueFor, valueLabel, emptyLabel }) {
  const maxValue = Math.max(1, ...rows.map(valueFor));

  if (rows.length === 0) {
    return (
      <div className="grid h-48 place-items-center rounded-md bg-gray-50 text-sm text-gray-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {rows.map((row) => {
        const value = valueFor(row);
        return (
          <div key={row.id || labelFor(row)}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="truncate font-medium text-gray-900">
                {labelFor(row)}
              </span>
              <span className="shrink-0 text-gray-500">
                {valueLabel(value, row)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#1F50AF]"
                style={{ width: `${Math.max(4, (value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContentPerformance({ rows }) {
  const ranked = [...rows].sort((a, b) => b.views - a.views).slice(0, 6);

  return (
    <SectionShell
      title="Content performance"
      description="The content that is getting opened most often."
    >
      <div className="p-6">
        <BarList
          rows={ranked}
          labelFor={(row) => row.title}
          valueFor={(row) => row.views}
          valueLabel={(value) => `${value.toLocaleString()} views`}
          emptyLabel="Content performance will appear once prospects open items."
        />
      </div>
    </SectionShell>
  );
}

function DeviceBreakdown({ rows }) {
  return (
    <SectionShell
      title="Device mix"
      description="Derived from cookie-less event metadata."
    >
      <div className="p-6">
        <BarList
          rows={rows}
          labelFor={(row) => row.label}
          valueFor={(row) => row.count}
          valueLabel={(value, row) =>
            `${value.toLocaleString()} ${row.percent}%`
          }
          emptyLabel="Device data will appear once hub events are recorded."
        />
      </div>
    </SectionShell>
  );
}

function GeographyPanel({ rows }) {
  return (
    <SectionShell
      title="Geography"
      description="Country and region rollups for this hub."
    >
      <div className="p-6">
        {rows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {rows.slice(0, 6).map((row) => (
              <div
                key={row.id}
                className="rounded-md border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(16,24,40,0.08)]"
              >
                <div className="text-sm font-medium text-gray-900">
                  {row.label}
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-normal text-gray-950 tabular-nums">
                  {row.count.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-gray-500">visits</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-5">
            <div className="text-sm font-medium text-gray-900">
              Geography is ready for the next tracking step
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              The browser tracker cannot reliably know visitor location without
              IP enrichment. The privacy-friendly route is a small server
              endpoint or Cloud Function that resolves country or region, writes
              aggregate rollups, and avoids storing raw IP addresses.
            </p>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

function ContentAnalyticsTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,2.4fr)_120px_120px_160px_180px] gap-4 border-b border-gray-200 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        <div>Content</div>
        <div>Type</div>
        <div>Views</div>
        <div>Avg time</div>
        <div className="text-right">Last viewed</div>
      </div>

      <div>
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,2.4fr)_120px_120px_160px_180px] items-center gap-4 border-b border-gray-100 px-6 py-4 text-sm text-gray-900"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900">
                {row.title}
              </div>
            </div>
            <div className="text-gray-600">{row.type}</div>
            <div className="tabular-nums text-gray-700">
              {row.views.toLocaleString()}
            </div>
            <div className="text-gray-700">
              {formatDuration(row.avgEngagementSec)}
            </div>
            <div className="truncate text-right text-gray-500">
              {formatDate(row.lastViewedAt)}
            </div>
          </div>
        ))}

        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No content yet. Add content to this hub to see analytics.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function HubAnalyticsScreen() {
  const { hubId } = useParams();

  const [loadingHub, setLoadingHub] = useState(true);
  const [hubName, setHubName] = useState("Analytics");
  const [contentDocs, setContentDocs] = useState([]);
  const [analyticsById, setAnalyticsById] = useState(new Map());
  const [summary, setSummary] = useState({});
  const [dailyDocs, setDailyDocs] = useState([]);
  const [eventDocs, setEventDocs] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId));
        if (active && snap.exists()) {
          const data = snap.data();
          setHubName(data.name || "Analytics");
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

  useEffect(() => {
    if (!hubId) return;

    let active = true;

    const unsub = onSnapshot(
      collection(db, "hubs", hubId, "items"),
      async (snap) => {
        const items = snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        const enriched = await Promise.all(
          items.map(async (item) => {
            if (!item.assetId) return item;

            try {
              const assetSnap = await getDoc(doc(db, "assets", item.assetId));
              return assetSnap.exists()
                ? { ...item, asset: { id: assetSnap.id, ...assetSnap.data() } }
                : item;
            } catch (err) {
              console.error("[analytics] asset read error", err);
              return item;
            }
          }),
        );

        if (active) setContentDocs(enriched);
      },
      (err) => console.error("[analytics] content read error", err),
    );

    return () => {
      active = false;
      unsub();
    };
  }, [hubId]);

  useEffect(() => {
    if (!hubId) return;

    const unsub = onSnapshot(
      collection(db, "hubs", hubId, "contentAnalytics"),
      (snap) => {
        const map = new Map();
        snap.forEach((item) => map.set(item.id, item.data()));
        setAnalyticsById(map);
      },
      (err) => {
        console.error("[analytics] contentAnalytics read error", err);
        setAnalyticsById(new Map());
      },
    );

    return () => unsub();
  }, [hubId]);

  useEffect(() => {
    if (!hubId) return;

    const unsubSummary = onSnapshot(
      doc(db, "hubs", hubId, "analytics", "summary"),
      (snap) => setSummary(snap.exists() ? snap.data() : {}),
      (err) => console.error("[analytics] summary read error", err),
    );

    const unsubDaily = onSnapshot(
      collection(db, "hubs", hubId, "dailyAnalytics"),
      (snap) => {
        setDailyDocs(
          snap.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .sort((a, b) => (a.day || a.id).localeCompare(b.day || b.id)),
        );
      },
      (err) => console.error("[analytics] daily read error", err),
    );

    const unsubEvents = onSnapshot(
      query(
        collection(db, "hubs", hubId, "events"),
        orderBy("ts", "desc"),
        limit(500),
      ),
      (snap) => {
        setEventDocs(
          snap.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
      },
      (err) => console.error("[analytics] events read error", err),
    );

    return () => {
      unsubSummary();
      unsubDaily();
      unsubEvents();
    };
  }, [hubId]);

  const rows = useMemo(() => {
    return sortLikeProspect(contentDocs).map((content) => {
      const contentId = content.assetId || content.id;
      const analytics =
        analyticsById.get(contentId) || analyticsById.get(content.id) || {};
      const views = Number(analytics.views || 0);
      const totalEngagementSec = Number(analytics.totalEngagementSec || 0);

      return {
        id: content.id,
        title:
          content.asset?.name ||
          content.name ||
          content.title ||
          content.filename ||
          content.id,
        type: content.asset?.kind || content.kind || content.type || "—",
        views,
        totalEngagementSec,
        avgEngagementSec:
          views > 0 ? Math.round(totalEngagementSec / views) : null,
        lastViewedAt: analytics.lastViewed || null,
      };
    });
  }, [contentDocs, analyticsById]);

  const overview = useMemo(() => {
    const hubViews = Number(summary.hubViews || 0);
    const uniqueVisits = Number(summary.uniqueVisits || 0);
    const totalEngagementSec = Number(summary.totalEngagementSec || 0);
    const contentViews = rows.reduce((sum, row) => sum + row.views, 0);

    return {
      hubViews,
      uniqueVisits,
      contentViews,
      avgHubTimeSec:
        uniqueVisits > 0 ? Math.round(totalEngagementSec / uniqueVisits) : null,
      totalEngagementSec,
      lastViewedAt: summary.lastViewed || null,
    };
  }, [summary, rows]);

  const chartPoints = useMemo(() => dailyDocs.slice(-30), [dailyDocs]);

  const deviceRows = useMemo(() => {
    const counts = new Map();
    eventDocs.forEach((event) => {
      if (event.type !== "hub_opened") return;
      const key = event.deviceType || "unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    return [...counts.entries()]
      .map(([device, count]) => ({
        id: device,
        label: device.charAt(0).toUpperCase() + device.slice(1),
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [eventDocs]);

  const geographyRows = useMemo(() => {
    const counts = new Map();
    eventDocs.forEach((event) => {
      if (event.type !== "hub_opened") return;
      const label = event.country || event.region || event.city;
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return [...counts.entries()]
      .map(([label, count]) => ({ id: label, label, count }))
      .sort((a, b) => b.count - a.count);
  }, [eventDocs]);

  if (loadingHub) {
    return <AdminLoadingState>Loading analytics…</AdminLoadingState>;
  }

  return (
    <AdminPage>
      <AdminPageHeader>
        <HubScreenHeader
          title={`${hubName} | Analytics`}
          secondaryAction={{
            label: "Preview Hub",
            href: `/prospect/${hubId}`,
          }}
          action={{
            label: "Analytics",
            href: `/admin/analytics`,
            icon: <AnalyticsIcon className="h-5 w-5" />,
          }}
        />
      </AdminPageHeader>

      <AdminPageContent>
        <div className="mx-auto max-w-[1450px] space-y-6">
          <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-4">
            <InsightCard
              label="Hub traffic"
              primaryValue={overview.hubViews.toLocaleString()}
              primaryLabel="Views"
              secondaryValue={overview.uniqueVisits.toLocaleString()}
              secondaryLabel="Unique"
              tone="blue"
              icon={<PreviewIcon className="h-5 w-5" />}
            />
            <InsightCard
              label="Audience"
              primaryValue={overview.uniqueVisits.toLocaleString()}
              primaryLabel="Visitors"
              secondaryValue={eventDocs.length.toLocaleString()}
              secondaryLabel="Events"
              tone="green"
              icon={<Users className="h-5 w-5" strokeWidth={1.8} />}
            />
            <InsightCard
              label="Engagement"
              primaryValue={formatDuration(overview.avgHubTimeSec)}
              primaryLabel="Avg. time"
              secondaryValue={formatDuration(overview.totalEngagementSec)}
              secondaryLabel="Total time"
              tone="slate"
              icon={<Clock3 className="h-5 w-5" strokeWidth={1.8} />}
            />
            <InsightCard
              label="Content"
              primaryValue={overview.contentViews.toLocaleString()}
              primaryLabel="Views"
              secondaryValue={rows.length.toLocaleString()}
              secondaryLabel="Items"
              tone="amber"
              icon={<Layers3 className="h-5 w-5" strokeWidth={1.8} />}
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
            <PerformanceOverview points={chartPoints} />
            <GeographyPanel rows={geographyRows} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <ContentPerformance rows={rows} />
            <DeviceBreakdown rows={deviceRows} />
          </div>

          <HubShareLinksSection hubId={hubId} />
        </div>
      </AdminPageContent>
    </AdminPage>
  );
}
