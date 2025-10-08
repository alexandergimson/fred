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
        <div className="h-full bg-white rounded-xl  overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Hubs"
            action={{
              label: "Create a Hub",
              to: "/admin/hubs/new",
              icon: <AddContent className="w-5 h-5" />,
            }}
          />

          <div className="flex-1 min-h-0 overflow-auto ml-8 mr-8 pb-6">
            <div className="rounded-lg rounded-b-none overflow-hidden">
              <TableShell>
                <Table className="table-auto">
                  <colgroup>
                    <col className="w-[60%] sm:w-[20%] md:w-[45%] lg:w-[20%]" />
                    <col className="w-[120px]" />
                    <col className="w-[180px]" />
                    <col className="w-[120px]" /> {/* Created */}
                    <col className="w-[220px] sm:w-[260px] md:w-[320px]" />{" "}
                    {/* Actions */}
                  </colgroup>

                  <Thead className="text-gray-600">
                    <tr>
                      <Th className="px-4 py-4 text-sm">Name</Th>
                      <Th className="px-4 py-4 text-sm hidden md:table-cell">
                        Logo
                      </Th>
                      <Th className="px-4 py-4 text-sm hidden sm:table-cell">
                        Industry
                      </Th>
                      <Th className="px-4 py-4 text-sm">Created</Th>
                      <Th className="px-4 py-4 text-sm text-right"></Th>
                    </tr>
                  </Thead>

                  <tbody>
                    {rows.map((r) => (
                      <Tr
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => onEdit(r.id)}
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") && onEdit(r.id)
                        }
                        role="button"
                        tabIndex={0}
                      >
                        <Td className="px-4 py-4 text-sm">
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
                        </Td>

                        <Td className="px-4 py-4 hidden md:table-cell">
                          {r.logoUrl ? (
                            <img
                              src={r.logoUrl}
                              alt=""
                              className="h-5 object-contain"
                            />
                          ) : (
                            "—"
                          )}
                        </Td>

                        <Td className="px-4 py-4 text-sm hidden sm:table-cell">
                          {r.industry || "—"}
                        </Td>

                        <Td className="px-4 py-4 text-sm">
                          {r.createdAt?.toDate
                            ? r.createdAt.toDate().toLocaleDateString()
                            : "…"}
                        </Td>

                        <Td className="px-4 py-4 w-[220px] sm:w-[260px] md:w-[320px]">
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            <ActionButton
                              title="Edit details"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(r.id);
                              }}
                            >
                              <HubOverviewIcon className="w-4 h-4" />
                            </ActionButton>

                            <ActionButton
                              title="Add content"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpen(r.id);
                              }}
                            >
                              <AddContent className="w-4 h-4" />
                            </ActionButton>

                            <ActionButton
                              title="Edit design"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDesign(r.id);
                              }}
                            >
                              <HubDesignIcon className="w-4 h-4" />
                            </ActionButton>

                            <ActionButton
                              title="Preview"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreview(r.id);
                              }}
                            >
                              <PreviewIcon className="w-4 h-4" />
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
                                danger
                                onClick={() => setConfirmDeleteId(r.id)}
                              >
                                <DeleteIcon className="w-4 h-4" />
                              </ActionButton>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    ))}

                    {rows.length === 0 && (
                      <Tr>
                        <Td
                          colSpan={5}
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          No hubs yet — create your first one.
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
        {/* /Card */}
      </div>
    </main>
  );
}
