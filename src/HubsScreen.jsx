import HubScreenHeader from "./HubScreenHeader";
import AddContent from "./icons/AddContent";
import { useEffect, useMemo, useRef, useState } from "react";
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
import HubsListTable from "./components/hubs/HubsListTable";
import HubsTileGrid from "./components/hubs/HubsTileGrid";
import HubsTile from "./components/hubs/HubsTile";
import ViewToggle from "./components/library/ViewToggle";

export default function HubsScreen() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("fred-hubs-view") || "list",
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const confirmTimerRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "hubs"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRows(list);
      },
      (error) => {
        console.error("HubsScreen hubs listener failed:", error);
      },
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem("fred-hubs-view", viewMode);
  }, [viewMode]);

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

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((hub) => {
      const searchable = [
        hub.name || "",
        hub.industry || "",
        ...(Array.isArray(hub.tags) ? hub.tags : []),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [rows, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  const onOpen = (id) => navigate(`/admin/hubs/${id}/builder`);
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
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="shrink-0 px-6 pt-2">
        <HubScreenHeader
          title="Hubs"
          action={{
            label: "Create a Hub",
            to: "/admin/hubs/new",
            icon: <AddContent className="w-5 h-5" />,
          }}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        {rows.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900">
                Create your first hub
              </h2>
              <p className="text-gray-500 mt-3">
                Hubs let you package content into tailored prospect experiences.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 bg-[#F4F7FE]/95 backdrop-blur supports-[backdrop-filter]:bg-[#F4F7FE]/80 pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <ViewToggle viewMode={viewMode} onChange={setViewMode} />

                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, industry, or tag"
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

            {filteredRows.length === 0 ? (
              <div className="pt-10 text-sm text-gray-500">
                No hubs match your search.
              </div>
            ) : viewMode === "grid" ? (
              <div className="pt-2">
                <HubsTileGrid>
                  {filteredRows.map((hub) => (
                    <HubsTile
                      key={hub.id}
                      hub={hub}
                      confirmDeleteId={confirmDeleteId}
                      onConfirmDelete={handleDelete}
                      onSetConfirmDelete={setConfirmDeleteId}
                      onOpen={onOpen}
                      onEdit={onEdit}
                      onDesign={onDesign}
                      onPreview={onPreview}
                    />
                  ))}
                </HubsTileGrid>
              </div>
            ) : (
              <div className="pt-2">
                <HubsListTable
                  hubs={filteredRows}
                  confirmDeleteId={confirmDeleteId}
                  onConfirmDelete={handleDelete}
                  onSetConfirmDelete={setConfirmDeleteId}
                  onOpen={onOpen}
                  onEdit={onEdit}
                  onDesign={onDesign}
                  onPreview={onPreview}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
