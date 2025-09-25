// HubsScreen.jsx
import HubScreenHeader from "./HubScreenHeader";
import AddContent from "./icons/AddContent";
import EditIcon from "./icons/EditIcon";
import PreviewIcon from "./icons/PreviewIcon";
import DeleteIcon from "./icons/DeleteIcon";
import HubDesignIcon from "./icons/HubDesignIcon";
import HubOverviewIcon from "./icons/HubOverviewIcon";
import { useEffect, useRef, useState } from "react";
import { db } from "./lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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
          ? "UserIconBtn UserDanger w-28 px-4 shadow-md hover:shadow-lg"
          : "UserIconBtn"
      }
    >
      {expanded ? label ?? "Confirm?" : children}
    </button>
  );
}

export default function HubsScreen() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const confirmTimerRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "hubs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRows(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    if (confirmDeleteId) {
      confirmTimerRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
        confirmTimerRef.current = null;
      }, 5000);
    }
    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
    };
  }, [confirmDeleteId]);

  function onOpen(id) {
    navigate(`/admin/hubs/${id}/content`);
  }
  function onPreview(id) {
    window.open(`/prospect/${id}`, "_blank", "noopener,noreferrer");
  }
  function onDesign(id) {
    navigate(`/admin/hubs/${id}/design`);
  }
  function onEdit(id) {
    navigate(`/admin/hubs/${id}/edit`);
  }

  async function handleDelete(id) {
    try {
      await deleteDoc(doc(db, "hubs", id));
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete hub");
    }
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Hubs"
            action={{
              label: "Create a Hub",
              to: "/admin/hubs/new",
              icon: <AddContent className="w-5 h-5" />,
            }}
          />

          <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
            <div className="rounded-lg border border-gray-400 overflow-hidden">
              <table className="w-full text-base border-spacing-0 table-auto">
                <colgroup>
                  <col className="w-[60%] sm:w-[20%] md:w-[45%] lg:w-[20%]" />{" "}
                  <col className="w-[120px]" /> <col className="w-[180px]" />{" "}
                  <col className="w-[120px]" /> {/* Created */}
                  <col className="w-[220px] sm:w-[260px] md:w-[320px]" />{" "}
                  {/* Actions */}
                </colgroup>
                <thead className="sticky top-0 bg-background text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-4 text-base">Name</th>
                    <th className="text-left px-4 py-4 text-base hidden md:table-cell">
                      Logo
                    </th>
                    <th className="text-left px-4 py-4 text-base hidden sm:table-cell">
                      Industry
                    </th>
                    <th className="text-left px-4 py-4 text-base">Created</th>
                    <th className="text-right px-4 py-4 text-base"></th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="bg-white border-b border-gray-400 hover:bg-gray-50 cursor-pointer"
                      onClick={() => onOpen(r.id)}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") && onOpen(r.id)
                      }
                      role="button"
                      tabIndex={0}
                    >
                      {/* Name — truncate on small so it doesn't overflow */}
                      <td className="px-4 py-4 text-base">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpen(r.id);
                          }}
                          className="block max-w-[180px] sm:max-w-none truncate text-left"
                          title={r.name}
                        >
                          {r.name}
                        </button>
                      </td>

                      {/* Logo — hidden on < md */}
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

                      {/* Industry — hidden on < sm */}
                      <td className="px-4 py-4 text-base hidden sm:table-cell">
                        {r.industry || "—"}
                      </td>

                      {/* Created — always visible */}
                      <td className="px-4 py-4 text-base">
                        {r.createdAt?.toDate
                          ? r.createdAt.toDate().toLocaleDateString()
                          : "…"}
                      </td>

                      {/* Actions — width scales with breakpoint */}
                      <td className="px-4 py-4 w-[220px] sm:w-[260px] md:w-[320px]">
                        <div className="flex items-center justify-end gap-2 flex-nowrap">
                          <ActionButton
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(r.id);
                            }}
                          >
                            <HubOverviewIcon className="w-5 h-5" />
                          </ActionButton>
                          <ActionButton
                            title="Open"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpen(r.id);
                            }}
                          >
                            <AddContent className="w-5 h-5" />
                          </ActionButton>
                          <ActionButton
                            title="Edit Design"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDesign(r.id);
                            }}
                          >
                            <HubDesignIcon className="w-5 h-5" />
                          </ActionButton>
                          <ActionButton
                            title="Preview"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(r.id);
                            }}
                          >
                            <PreviewIcon className="w-5 h-5" />
                          </ActionButton>

                          {confirmDeleteId === r.id ? (
                            <ActionButton
                              title="Confirm delete"
                              danger
                              confirm
                              label="Confirm?"
                              onClick={() => handleDelete(r.id)}
                            />
                          ) : (
                            <ActionButton
                              title="Delete"
                              onClick={() => setConfirmDeleteId(r.id)}
                            >
                              <DeleteIcon className="w-5 h-5" />
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No hubs yet — create your first one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* /Table */}
        </div>
        {/* /Card */}
      </div>
    </main>
  );
}
