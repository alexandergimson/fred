// AnalyticsScreen.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ⬅️ add
import { db } from "./lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import HubScreenHeader from "./HubScreenHeader";
import HubsIcon from "./icons/HubsIcon";
import PreviewIcon from "./icons/PreviewIcon";
import { TableShell, Table, Thead, Th, Tr, Td } from "./components/ui/Table";

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
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col page-fade-in">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Analytics"
            action={{
              label: "Hubs",
              to: "/admin/hubs",
              icon: <HubsIcon className="w-5 h-5" />,
            }}
          />
          <div className="flex-1 min-h-0 overflow-auto ml-8 mr-8 pb-6">
            <div className="rounded-lg rounded-b-none overflow-hidden">
              <TableShell>
                <Table>
                  <Thead className="text-gray-600">
                    <tr>
                      <Th>Hub Name</Th>
                      <Th>Logo</Th>
                      <Th>Avg. engagement time</Th>
                      <Th></Th>
                    </tr>
                  </Thead>

                  <tbody>
                    {rows.map((r) => (
                      <Tr
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => goToHubAnalytics(r.id)}
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") &&
                          goToHubAnalytics(r.id)
                        }
                        role="button"
                        tabIndex={0}
                      >
                        <Td title={r.name}>{r.name}</Td>

                        <Td>
                          {r.logoUrl ? (
                            <div className="h-5 w-[88px] overflow-hidden">
                              <img
                                src={r.logoUrl}
                                alt=""
                                className="h-full w-auto object-contain block"
                              />
                            </div>
                          ) : (
                            "—"
                          )}
                        </Td>

                        <Td className="px-4 py-4 text-sm hidden sm:table-cell">
                          {formatDuration(r.metrics?.avgEngagementSec)}
                        </Td>

                        <Td className="px-4 py-4 w-[220px] sm:w-[260px] md:w-[320px]">
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            <ActionButton
                              title="Preview"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreview(r.id);
                              }}
                            >
                              <PreviewIcon className="w-4 h-4" />
                            </ActionButton>
                          </div>
                        </Td>
                      </Tr>
                    ))}

                    {rows.length === 0 && (
                      <Tr>
                        <Td
                          colSpan={4}
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          No hubs yet — usage data will appear here.
                        </Td>
                      </Tr>
                    )}
                  </tbody>
                </Table>
              </TableShell>
            </div>
          </div>
          {/* /Table */}
        </div>
      </div>
    </main>
  );
}
