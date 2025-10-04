// HubContentScreen.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import AddContent from "./icons/AddContent";
import EditIcon from "./icons/EditIcon";
import PreviewIcon from "./icons/PreviewIcon";
import DeleteIcon from "./icons/DeleteIcon";
import { db } from "./lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  deleteDoc,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";

function ActionButton({ children, title, onClick, confirm, label, danger }) {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(e);
  };

  const expanded = Boolean(confirm && danger); // same behaviour as HubsScreen

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-expanded={expanded}
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

export default function HubContentScreen() {
  const { hubId } = useParams();
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]); // raw docs from Firestore
  const [rows, setRows] = useState([]); // UI rows (mutated during drag)

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const confirmTimerRef = useRef(null);

  const [dragId, setDragId] = useState(null);

  const [hubName, setHubName] = useState("Content");
  // Fetch hub name
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId));
        if (snap.exists()) setHubName(snap.data().name || "Content");
      } catch {}
    })();
  }, [hubId]);

  // Subscribe to content (no orderBy; we sort client-side)
  useEffect(() => {
    const q = query(collection(db, "hubs", hubId, "content"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDocs(list);
    });
    return () => unsub();
  }, [hubId]);

  // Compute sorted baseline list
  const sorted = useMemo(() => {
    const BIG = 9e15;
    return [...docs].sort((a, b) => {
      const pa = typeof a.position === "number" ? a.position : BIG;
      const pb = typeof b.position === "number" ? b.position : BIG;
      if (pa !== pb) return pa - pb;

      const ca = a.createdAt?.toMillis?.() ?? 0;
      const cb = b.createdAt?.toMillis?.() ?? 0;
      if (ca !== cb) return cb - ca;

      return (a.name || "").localeCompare(b.name || "");
    });
  }, [docs]);

  // Keep rows in sync with sorted unless actively dragging
  useEffect(() => {
    if (dragId == null) setRows(sorted);
  }, [sorted, dragId]);

  // Auto-reset delete confirmation after 5s
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

  function onPreview(contentId) {
    window.open(
      `/prospect/${hubId}?c=${contentId}`,
      "_blank",
      "noopener,noreferrer"
    );
  }
  function onEdit(contentId) {
    navigate(`/admin/hubs/${hubId}/content/${contentId}/edit`);
  }
  async function handleDelete(contentId) {
    try {
      await deleteDoc(doc(db, "hubs", hubId, "content", contentId));
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete content");
    }
  }

  // ------- Drag & drop handlers (auto-save on drop) -------
  function handleDragStart(e, id) {
    setDragId(id);
    e.dataTransfer.setData("text/plain", id); // Firefox
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, overId) {
    e.preventDefault(); // allow drop
    if (!dragId || dragId === overId) return;

    setRows((curr) => {
      const from = curr.findIndex((r) => r.id === dragId);
      const to = curr.findIndex((r) => r.id === overId);
      if (from === -1 || to === -1 || from === to) return curr;

      const next = [...curr];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  async function handleDrop(e) {
    e.preventDefault();
    try {
      const batch = writeBatch(db);
      rows.forEach((r, idx) => {
        const ref = doc(db, "hubs", hubId, "content", r.id);
        batch.update(ref, { position: idx * 100 }); // spaced for future inserts
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
      alert("Failed to save new order");
    } finally {
      setDragId(null);
    }
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title={`${hubName} | Content`}
            secondaryAction={{
              label: "Preview Hub",
              href: `/prospect/${hubId}`,
            }}
            action={{
              label: "Add content",
              to: `/admin/hubs/${hubId}/content/new`,
              icon: <AddContent className="w-5 h-5" />,
            }}
          />

          <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
            <div className="rounded-lg border border-gray-400 overflow-hidden">
              <table className="w-full text-sm border-separate border-spacing-0 table-fixed">
                <colgroup>
                  <col className="w-[44px]" /> {/* Drag handle */}
                  <col /> {/* Name (flex) */}
                  <col className="w-[140px]" /> {/* Type */}
                  <col className="w-[140px]" /> {/* Created */}
                  <col className="w-[320px]" /> {/* Actions (fixed) */}
                </colgroup>

                <thead className="sticky top-0 bg-background text-base">
                  <tr>
                    <th className="text-left px-6 py-4 text-base w-10"></th>
                    <th className="text-left px-6 py-4 text-base">Name</th>
                    <th className="text-left px-6 py-4 text-base">Type</th>
                    <th className="text-left px-6 py-4 text-base">Created</th>
                    <th className="text-right px-6 py-4 text-base"></th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="bg-white border-b border-gray-400"
                      draggable
                      onDragStart={(e) => handleDragStart(e, r.id)}
                      onDragOver={(e) => handleDragOver(e, r.id)}
                      onDrop={handleDrop}
                    >
                      {/* Drag handle */}
                      <td
                        className="px-6 py-4 cursor-grab select-none text-gray-400"
                        title="Drag to reorder"
                      >
                        <span className="text-lg leading-none">☰</span>
                      </td>

                      <td className="px-6 py-4 text-base">
                        {r.name || "Untitled"}
                      </td>

                      <td className="px-6 py-4 text-base">{r.kind || "—"}</td>

                      <td className="px-6 py-4 text-base text-gray-500">
                        {r.createdAt?.toDate
                          ? r.createdAt.toDate().toLocaleDateString()
                          : "…"}
                      </td>

                      <td className="px-6 py-4 w-[320px]">
                        <div className="flex items-center justify-end gap-2 flex-nowrap">
                          <ActionButton
                            title="Preview"
                            onClick={() => onPreview(r.id)}
                          >
                            <PreviewIcon className="w-5 h-5" />
                          </ActionButton>

                          <ActionButton
                            title="Edit"
                            onClick={() => onEdit(r.id)}
                          >
                            <EditIcon className="w-5 h-5" />
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
                        No content yet — add your first item.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Auto-saves on drop */}
          </div>
        </div>
      </div>
    </main>
  );
}
