import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import HubScreenHeader from "./HubScreenHeader";
import HubsIcon from "./icons/HubsIcon";
import PreviewIcon from "./icons/PreviewIcon";
import AnalyticsIcon from "./icons/AnalyticsIcon";
import ActionButton from "./components/ActionButton";
import {
  AdminPage,
  AdminPageContent,
  AdminPageHeader,
} from "./components/admin/AdminPage";
import ViewToggle from "./components/library/ViewToggle";

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
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function onPreview(id) {
  window.open(`/prospect/${id}`, "_blank", "noopener,noreferrer");
}

function AnalyticsListTable({ rows, onOpen }) {
  return (
    <div class="pt-2">
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="grid grid-cols-[minmax(0,2.4fr)_160px_130px_130px_170px_180px] gap-4 border-b border-gray-200 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          <div>Hub Name</div>
          <div>Logo</div>
          <div>Hub views</div>
          <div>Unique views</div>
          <div>Avg. time</div>
          <div className="text-right">Actions</div>
        </div>

        <div>
          {rows.map((hub) => (
            <div
              key={hub.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(hub.id)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && onOpen(hub.id)
              }
              className="grid cursor-pointer grid-cols-[minmax(0,2.4fr)_160px_130px_130px_170px_180px] items-center gap-4 border-b border-gray-100 px-6 py-4 text-sm text-gray-900 transition-colors hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-gray-900">
                  {hub.name || "Untitled hub"}
                </div>
                <div className="mt-0.5 truncate text-xs text-gray-500">
                  Last viewed {formatDate(hub.summary.lastViewed)}
                </div>
              </div>

              <div>
                {hub.logoUrl ? (
                  <div className="h-6 w-[104px] overflow-hidden">
                    <img
                      src={hub.logoUrl}
                      alt=""
                      className="block h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>

              <div className="tabular-nums text-gray-700">
                {hub.hubViews.toLocaleString()}
              </div>

              <div className="tabular-nums text-gray-700">
                {hub.uniqueViews.toLocaleString()}
              </div>

              <div className="text-gray-600">
                {formatDuration(hub.avgTimeSec)}
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <ActionButton
                    title="View analytics"
                    onClick={() => onOpen(hub.id)}
                  >
                    <AnalyticsIcon className="h-4 w-4" />
                  </ActionButton>
                  <ActionButton
                    title="Preview"
                    onClick={() => onPreview(hub.id)}
                  >
                    <PreviewIcon className="h-4 w-4" />
                  </ActionButton>
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              No hubs match your search.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AnalyticsTileGrid({ rows, onOpen }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
        No hubs match your search.
      </div>
    );
  }

  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
    >
      {rows.map((hub) => (
        <div
          key={hub.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(hub.id)}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && onOpen(hub.id)
          }
          className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(16,24,40,0.10)]"
        >
          <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gray-50">
            {hub.logoUrl ? (
              <img
                src={hub.logoUrl}
                alt=""
                className="max-h-16 max-w-[70%] object-contain"
              />
            ) : (
              <div className="text-sm text-gray-400">No logo</div>
            )}

            <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
              <div className="flex translate-y-[120%] items-center justify-center gap-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                <ActionButton
                  title="View analytics"
                  onClick={() => onOpen(hub.id)}
                >
                  <AnalyticsIcon className="h-4 w-4" />
                </ActionButton>
                <ActionButton title="Preview" onClick={() => onPreview(hub.id)}>
                  <PreviewIcon className="h-4 w-4" />
                </ActionButton>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="truncate text-[15px] font-semibold text-gray-900">
              {hub.name || "Untitled hub"}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Hub views</div>
                <div className="mt-1 font-semibold tabular-nums text-gray-900">
                  {hub.hubViews.toLocaleString()}
                </div>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Unique views</div>
                <div className="mt-1 font-semibold tabular-nums text-gray-900">
                  {hub.uniqueViews.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              Avg. time {formatDuration(hub.avgTimeSec)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsScreen() {
  const navigate = useNavigate();
  const [hubs, setHubs] = useState([]);
  const [summaries, setSummaries] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("fred-analytics-view") || "list",
  );

  useEffect(() => {
    localStorage.setItem("fred-analytics-view", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const qy = query(collection(db, "hubs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qy, (snap) => {
      setHubs(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubs = hubs.map((hub) =>
      onSnapshot(
        doc(db, "hubs", hub.id, "analytics", "summary"),
        (snap) => {
          setSummaries((prev) => {
            const next = new Map(prev);
            next.set(hub.id, snap.exists() ? snap.data() : {});
            return next;
          });
        },
        (err) => console.error("[analytics] hub summary read error", err),
      ),
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, [hubs]);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return hubs
      .map((hub) => {
        const summary = summaries.get(hub.id) || {};
        const uniqueViews = Number(summary.uniqueVisits || 0);
        const totalEngagementSec = Number(summary.totalEngagementSec || 0);
        return {
          ...hub,
          summary,
          hubViews: Number(summary.hubViews || 0),
          uniqueViews,
          avgTimeSec:
            uniqueViews > 0
              ? Math.round(totalEngagementSec / uniqueViews)
              : null,
        };
      })
      .filter((hub) => {
        if (!q) return true;
        return [hub.name, hub.industry]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q));
      });
  }, [hubs, summaries, searchQuery]);

  function goToHubAnalytics(id) {
    navigate(`/admin/analytics/hubs/${id}`);
  }

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <AdminPage>
      <AdminPageHeader>
        <HubScreenHeader
          title="Analytics"
          action={{
            label: "Hubs",
            to: "/admin/hubs",
            icon: <HubsIcon className="h-5 w-5" />,
          }}
        />
      </AdminPageHeader>

      <AdminPageContent>
        <div className="sticky top-0 z-10 bg-[#F4F7FE]/95 pb-4 backdrop-blur supports-[backdrop-filter]:bg-[#F4F7FE]/80">
          <div className="flex flex-wrap items-center gap-3">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hub name or industry"
              className="h-10 min-w-[260px] max-w-xl flex-1 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-[#1F50AF]"
            />

            <button
              type="button"
              onClick={() => setSearchQuery("")}
              disabled={!hasSearch}
              className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              Clear
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <AnalyticsTileGrid rows={rows} onOpen={goToHubAnalytics} />
        ) : (
          <AnalyticsListTable rows={rows} onOpen={goToHubAnalytics} />
        )}
      </AdminPageContent>
    </AdminPage>
  );
}
