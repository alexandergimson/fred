import { useEffect, useMemo, useState } from "react";
import { addAssetsToHub } from "./lib/hubItems";
import { subscribeToAssets } from "./lib/assets";
import ViewToggle from "./components/library/ViewToggle";
import AssetTileGrid from "./components/library/AssetTileGrid";
import AssetTypeLabel from "./components/library/AssetTypeLabel";
import StatusBadge from "./components/library/StatusBadge";

function SelectableAssetTile({ asset, selected, disabled, onToggle }) {
  const thumb =
    asset.thumbnailUrl ||
    (asset.fileMimeType?.startsWith("image/") ? asset.fileUrl : null);

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(asset.id)}
      disabled={disabled}
      className={[
        "group relative text-left overflow-hidden rounded-lg border bg-white transition-all",
        selected
          ? "border-[#1F50AF] ring-2 ring-[#1F50AF]/20"
          : "border-gray-200 hover:shadow-[0_12px_36px_rgba(16,24,40,0.10)]",
        disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <div className="relative aspect-[16/10] bg-gray-50 flex items-center justify-center overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={asset.name || "Asset"}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="text-sm text-gray-400">
            {asset.kind === "embed" ? "Embed" : "File"}
          </div>
        )}

        {selected ? (
          <div className="absolute right-3 top-3 h-7 w-7 rounded-full bg-[#1F50AF] text-white grid place-items-center text-sm">
            ✓
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="truncate text-[15px] font-semibold text-gray-900">
          {asset.name || "Untitled"}
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          <AssetTypeLabel asset={asset} />
          <StatusBadge status={asset.processingStatus} />
        </div>

        {disabled ? (
          <div className="mt-3 text-xs text-gray-400">Already in hub</div>
        ) : null}
      </div>
    </button>
  );
}
function getAssetType(asset) {
  if (asset?.kind === "embed") return "embed";
  if (asset?.fileMimeType === "application/pdf") return "pdf";
  if (asset?.fileMimeType?.startsWith("image/")) return "image";
  if (asset?.kind === "file") return "file";
  return "unknown";
}

function FilterSelect({ value, onChange, options, ariaLabel }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-10 cursor-pointer appearance-none rounded-md border border-gray-200 bg-white px-3 pr-9 text-sm font-medium text-gray-500 outline-none transition-colors hover:bg-gray-50 focus:border-[#1F50AF]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
function SelectableAssetTable({ assets, selectedIds, existingSet, onToggle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="grid grid-cols-[44px_minmax(0,2.4fr)_120px_140px_1.4fr] gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 border-b border-gray-200 bg-white">
        <div />
        <div>Name</div>
        <div>Type</div>
        <div>Status</div>
        <div>Tags</div>
      </div>

      {assets.map((asset) => {
        const selected = selectedIds.includes(asset.id);
        const disabled = existingSet.has(asset.id);

        return (
          <button
            key={asset.id}
            type="button"
            onClick={() => !disabled && onToggle(asset.id)}
            disabled={disabled}
            className={[
              "w-full grid grid-cols-[44px_minmax(0,2.4fr)_120px_140px_1.4fr] items-center gap-4 px-6 py-4 text-left text-sm border-b border-gray-100 transition-colors",
              selected ? "bg-blue-50" : "bg-white hover:bg-gray-50",
              disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <div>
              <span
                className={[
                  "h-5 w-5 rounded border grid place-items-center text-xs",
                  selected
                    ? "bg-[#1F50AF] border-[#1F50AF] text-white"
                    : "border-gray-300 bg-white text-transparent",
                ].join(" ")}
              >
                ✓
              </span>
            </div>

            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900">
                {asset.name || "Untitled"}
              </div>
              {disabled ? (
                <div className="mt-1 text-xs text-gray-400">Already in hub</div>
              ) : null}
            </div>

            <div className="text-gray-600">
              <AssetTypeLabel asset={asset} />
            </div>

            <div>
              <StatusBadge status={asset.processingStatus} />
            </div>

            <div className="truncate text-gray-500">
              {Array.isArray(asset.tags) && asset.tags.length > 0
                ? asset.tags.slice(0, 3).join(", ")
                : "—"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function AddAssetsToHubModal({
  open,
  onClose,
  hubId,
  existingAssetIds = [],
  onAdded,
}) {
  const [assets, setAssets] = useState([]);
  const [assetsError, setAssetsError] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("fred-add-assets-view") || "grid",
  );

  useEffect(() => {
    if (!open) return;

    const unsub = subscribeToAssets(
      (nextAssets) => {
        setAssetsError(null);
        setAssets(nextAssets);
      },
      (error) => {
        setAssetsError(error);
      },
    );

    return () => unsub?.();
  }, [open]);

  useEffect(() => {
    localStorage.setItem("fred-add-assets-view", viewMode);
  }, [viewMode]);

  const existingSet = useMemo(
    () => new Set(existingAssetIds || []),
    [existingAssetIds],
  );

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
    const q = query.trim().toLowerCase();

    return (assets || []).filter((asset) => {
      if (asset.archived) return false;

      const matchesSearch =
        !q ||
        [
          asset.name || "",
          asset.kind || "",
          asset.fileMimeType || "",
          asset.category || "",
          ...(Array.isArray(asset.tags) ? asset.tags : []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

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
  }, [assets, query, selectedType, selectedStatus, selectedTag]);

  function toggleAsset(assetId) {
    setSelectedIds((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId],
    );
  }

  async function handleAdd() {
    try {
      await addAssetsToHub(hubId, selectedIds);
      setSelectedIds([]);
      setQuery("");
      onClose?.();
      await onAdded?.();
    } catch (e) {
      console.error(e);
      alert("Failed to add assets to hub");
    }
  }

  function handleClose() {
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedTag("all");
    setSelectedIds([]);
    setQuery("");
    setAssetsError(null);
    onClose?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="absolute inset-x-8 inset-y-8 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Add from library
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select one or more assets to add to this hub.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search content library..."
              className="h-10 min-w-[260px] max-w-xl flex-1 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#1F50AF]"
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
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-6">
          {assetsError ? (
            <div className="h-full flex items-center justify-center text-sm text-red-600">
              Failed to load assets.
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              No assets found.
            </div>
          ) : viewMode === "grid" ? (
            <AssetTileGrid>
              {filteredAssets.map((asset) => {
                const disabled = existingSet.has(asset.id);

                return (
                  <SelectableAssetTile
                    key={asset.id}
                    asset={asset}
                    selected={selectedIds.includes(asset.id)}
                    disabled={disabled}
                    onToggle={toggleAsset}
                  />
                );
              })}
            </AssetTileGrid>
          ) : (
            <SelectableAssetTable
              assets={filteredAssets}
              selectedIds={selectedIds}
              existingSet={existingSet}
              onToggle={toggleAsset}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            {selectedIds.length} selected
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-md border border-gray-200 text-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAdd}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 rounded-md bg-[#1F50AF] text-white text-sm disabled:opacity-50"
            >
              Add to hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
