import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { subscribeToAssets, deleteAsset } from "./lib/assets";
import AssetTile from "./components/library/AssetTile";
import AssetTileGrid from "./components/library/AssetTileGrid";
import AssetListTable from "./components/library/AssetListTable";
import ViewToggle from "./components/library/ViewToggle";

function getAssetType(asset) {
  if (asset.kind === "embed") return "embed";
  if (asset.fileMimeType === "application/pdf") return "pdf";
  if (asset.fileMimeType?.startsWith("image/")) return "image";
  if (asset.kind === "file") return "file";
  return "unknown";
}

function FilterSelect({ value, onChange, options, ariaLabel }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="cursor-pointer h-10 appearance-none rounded-md border border-gray-200 bg-white px-3 pr-9 text-sm font-medium text-gray-400 outline-none transition-colors hover:bg-gray-50 focus:border-[#1F50AF]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-gray-400"
      >
        <path
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}

export default function LibraryScreen() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("fred-library-view") || "grid",
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    const unsub = subscribeToAssets(setAssets);
    return () => unsub?.();
  }, []);

  useEffect(() => {
    localStorage.setItem("fred-library-view", viewMode);
  }, [viewMode]);

  function handleEdit(assetId) {
    navigate(`/admin/library/${assetId}`);
  }

  async function handleDelete(assetId) {
    try {
      await deleteAsset(assetId);
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete asset");
    }
  }

  const tagOptions = useMemo(() => {
    const set = new Set();

    assets.forEach((asset) => {
      (asset.tags || []).forEach((tag) => {
        if (tag) set.add(tag);
      });
    });

    return [
      { value: "all", label: "All tags" },
      ...Array.from(set)
        .sort((a, b) => a.localeCompare(b))
        .map((tag) => ({ value: tag, label: tag })),
    ];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch = !q || (asset.name || "").toLowerCase().includes(q);
      const matchesType =
        selectedType === "all" || getAssetType(asset) === selectedType;
      const matchesStatus =
        selectedStatus === "all" ||
        (asset.processingStatus || "none") === selectedStatus;
      const matchesTag =
        selectedTag === "all" ||
        (Array.isArray(asset.tags) && asset.tags.includes(selectedTag));

      return matchesSearch && matchesType && matchesStatus && matchesTag;
    });
  }, [assets, searchQuery, selectedType, selectedStatus, selectedTag]);

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedType !== "all" ||
    selectedStatus !== "all" ||
    selectedTag !== "all";

  function clearFilters() {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedTag("all");
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="shrink-0 px-6 pt-2">
        <HubScreenHeader
          title="Content Library"
          action={{
            label: "Upload content",
            to: "/admin/library/new",
          }}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        {assets.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900">
                Upload your first piece of content
              </h2>
              <p className="text-gray-500 mt-3">
                PDFs, images, and embeds live here and can be reused across
                hubs.
              </p>
              <Link
                to="/admin/library/new"
                className="inline-flex mt-6 px-4 py-2 rounded-lg bg-[#1F50AF] text-white"
              >
                Upload content
              </Link>
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
                  placeholder="Search by name"
                  className="h-10 min-w-[220px] flex-1 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-400 outline-none transition-colors focus:border-[#1F50AF]"
                />

                <FilterSelect
                  value={selectedType}
                  onChange={setSelectedType}
                  ariaLabel="Filter by type"
                  options={[
                    { value: "all", label: "All types" },
                    { value: "pdf", label: "PDF" },
                    { value: "image", label: "Image" },
                    { value: "embed", label: "Embed" },
                    { value: "file", label: "File" },
                  ]}
                />

                <FilterSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  ariaLabel="Filter by status"
                  options={[
                    { value: "all", label: "All statuses" },
                    { value: "ready", label: "Ready" },
                    { value: "pending", label: "Pending" },
                    { value: "processing", label: "Processing" },
                    { value: "failed", label: "Failed" },
                    { value: "none", label: "No status" },
                  ]}
                />

                <FilterSelect
                  value={selectedTag}
                  onChange={setSelectedTag}
                  ariaLabel="Filter by tag"
                  options={tagOptions}
                />

                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-400 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  Clear
                </button>
              </div>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="pt-10 text-sm text-gray-500">
                No content matches your filters.
              </div>
            ) : viewMode === "grid" ? (
              <div className="pt-2">
                <AssetTileGrid>
                  {filteredAssets.map((asset) => (
                    <AssetTile
                      key={asset.id}
                      asset={asset}
                      confirmDeleteId={confirmDeleteId}
                      onSetConfirmDelete={setConfirmDeleteId}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </AssetTileGrid>
              </div>
            ) : (
              <div className="pt-2">
                <AssetListTable
                  assets={filteredAssets}
                  confirmDeleteId={confirmDeleteId}
                  onSetConfirmDelete={setConfirmDeleteId}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
