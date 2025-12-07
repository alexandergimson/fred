// HubsScreen.jsx
import HubScreenHeader from "./HubScreenHeader";
import AddContent from "./icons/AddContent";
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
import ActionButton from "./components/ActionButton";

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

  const onOpen = (id) => navigate(`/admin/hubs/${id}/content`);
  const onPreview = (id) =>
    window.open(`/prospect/${id}`, "_blank", "noopener,noreferrer");
  const onDesign = (id) => navigate(`/admin/hubs/${id}/design`);
  const onEdit = (id) => navigate(`/admin/hubs/${id}/edit`);

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
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col page-fade-in">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl overflow-hidden flex flex-col">
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
                <Table>
                  <Thead className="text-gray-600">
                    <tr>
                      <Th>Hub Name</Th>
                      <Th>Logo</Th>
                      <Th>Industry</Th>
                      <Th>Created</Th>
                      <Th className="text-right"></Th>
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
                        <Td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpen(r.id);
                            }}
                            title={r.name}
                          >
                            {r.name}
                          </button>
                        </Td>

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
                          {r.industry || "—"}
                        </Td>

                        <Td className="text-sm hidden sm:table-cell min-w-[160px] truncate">
                          {r.createdAt?.toDate
                            ? r.createdAt.toDate().toLocaleDateString()
                            : "…"}
                        </Td>

                        <Td>
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              title="Edit details"
                              onClick={() => onEdit(r.id)}
                            >
                              <HubOverviewIcon className="w-4 h-4" />
                            </ActionButton>

                            <ActionButton
                              title="Add content"
                              onClick={() => onOpen(r.id)}
                            >
                              <AddContent className="w-4 h-4" />
                            </ActionButton>

                            <ActionButton
                              title="Edit design"
                              onClick={() => onDesign(r.id)}
                            >
                              <HubDesignIcon className="w-4 h-4" />
                            </ActionButton>

                            <ActionButton
                              title="Preview"
                              onClick={() => onPreview(r.id)}
                            >
                              <PreviewIcon className="w-4 h-4" />
                            </ActionButton>

                            {confirmDeleteId === r.id ? (
                              <ActionButton
                                title="Confirm delete"
                                intent="danger"
                                confirm
                                label="Confirm?"
                                onClick={() => handleDelete(r.id)}
                              />
                            ) : (
                              <ActionButton
                                title="Delete"
                                intent="danger"
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
        </div>
      </div>
    </main>
  );
}
