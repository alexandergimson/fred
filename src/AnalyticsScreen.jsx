// AnalyticsScreen.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ⬅️ add
import { db } from "./lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import HubScreenHeader from "./HubScreenHeader";
import HubsIcon from "./icons/HubsIcon";
import PreviewIcon from "./icons/PreviewIcon";

import { style } from "framer-motion/client";

function ActionButton({ children, title, onClick, confirm, label, danger }) {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(e);
  };
  const expanded = Boolean(confirm && danger);

  return (
    <button
      type="button"
      title={title}
      aria-expanded={expanded}
      onClick={handleClick}
      className={
        expanded
          ? "UserIconBtnDanger UserDanger w-28 px-4 shadow-md hover:shadow-lg"
          : danger
          ? "UserIconBtnDanger"
          : "UserIconBtn"
      }
    >
      {expanded ? label ?? "Confirm?" : children}
    </button>
  );
}

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

function onPreview(id) {
  window.open(`/prospect/${id}`, "_blank", "noopener,noreferrer");
}

export default function AnalyticsScreen() {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate(); // ⬅️ add

  useEffect(() => {
    const q = query(collection(db, "hubs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const withMetrics = list.map((r) => ({
        ...r,
        metrics: r.metrics ?? {
          viewCount: Math.floor(Math.random() * 200),
          avgEngagementSec: Math.floor(Math.random() * 400),
          lastViewedAt: r.createdAt,
        },
      }));
      setRows(withMetrics);
    });
    return () => unsub();
  }, []);

  function goToHubAnalytics(id) {
    // ⬅️ add
    navigate(`/admin/analytics/hubs/${id}`);
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Analytics"
            action={{
              label: "Hubs",
              to: "/admin/hubs",
              icon: <HubsIcon className="w-5 h-5" />,
            }}
          />
          <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
            <div className="rounded-lg border border-gray-400 overflow-hidden">
              <table className="w-full text-base border-spacing-0 table-auto">
                <colgroup>
                  <col className="w-[45%]" />
                  <col className="w-[15%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="sticky top-0 bg-background text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-4 text-base">Hub name</th>
                    <th className="text-left px-4 py-4 text-base">Logo</th>
                    <th className="text-left px-4 py-4 text-base">
                      Avg. engagement time
                    </th>
                    <th className="text-left px-4 py-4 text-base"></th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="bg-white border-b border-gray-400 hover:bg-gray-50 cursor-pointer"
                      onClick={() => goToHubAnalytics(r.id)} // ⬅️ add
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        goToHubAnalytics(r.id)
                      }
                      role="button"
                      tabIndex={0}
                    >
                      <td
                        className="px-4 py-4 text-base truncate"
                        title={r.name}
                      >
                        {r.name}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        {r.logoUrl ? (
                          <img
                            src={r.logoUrl}
                            alt=""
                            className="h-5 object-contain"
                          />
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-4 w-[220px] sm:w-[260px] md:w-[320px]">
                        {formatDuration(r.metrics?.avgEngagementSec)}
                      </td>
                      <td className="px-4 py-4 w-[220px] sm:w-[260px] md:w-[320px]">
                        <div className="flex items-center justify-end gap-2 flex-nowrap">
                          <ActionButton
                            title="Preview"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(r.id);
                            }}
                          >
                            <PreviewIcon className="w-5 h-5" />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No hubs yet — usage data will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* /Table */}
        </div>
      </div>
    </main>
  );
}
