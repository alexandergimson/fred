// src/AddAssetsToHubModal.jsx
import { useMemo, useState } from "react";
import { addAssetsToHub } from "./lib/hubItems";

function StatusBadge({ status }) {
  if (!status) return null;

  const cls =
    status === "ready"
      ? "bg-green-100 text-green-700"
      : status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${cls}`}>{status}</span>
  );
}

function SelectableAssetCard({ asset, selected, disabled, onToggle }) {
  const thumb =
    asset.thumbnailUrl ||
    (asset.fileMimeType?.startsWith("image/") ? asset.fileUrl : null);

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(asset.id)}
      disabled={disabled}
      className={[
        "text-left rounded-xl border overflow-hidden bg-white transition",
        selected
          ? "border-[#1F50AF] ring-2 ring-[#1F50AF]/20"
          : "border-gray-200",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-sm",
      ].join(" ")}
    >
      <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={asset.name || "Asset"}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-sm text-gray-400">
            {asset.kind === "embed" ? "Embed" : "File"}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {asset.name || "Untitled"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {asset.kind === "embed"
                ? "Embed"
                : asset.fileMimeType === "application/pdf"
                  ? "PDF"
                  : asset.fileMimeType?.startsWith("image/")
                    ? "Image"
                    : "File"}
            </div>
          </div>

          <StatusBadge status={asset.processingStatus} />
        </div>
      </div>
    </button>
  );
}

export default function AddAssetsToHubModal({
  open,
  onClose,
  hubId,
  assets = [],
  existingAssetIds = [],
  onAdded,
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const existingSet = useMemo(
    () => new Set(existingAssetIds || []),
    [existingAssetIds],
  );

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (assets || []).filter((asset) => {
      if (asset.archived) return false;

      if (!q) return true;

      const haystack = [
        asset.name || "",
        asset.kind || "",
        asset.fileMimeType || "",
        ...(Array.isArray(asset.tags) ? asset.tags : []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [assets, query]);

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
    setSelectedIds([]);
    setQuery("");
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

        <div className="px-6 py-4 border-b border-gray-100">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search content library..."
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1F50AF]"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-6">
          {filteredAssets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              No assets found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => {
                const disabled = existingSet.has(asset.id);

                return (
                  <SelectableAssetCard
                    key={asset.id}
                    asset={asset}
                    selected={selectedIds.includes(asset.id)}
                    disabled={disabled}
                    onToggle={toggleAsset}
                  />
                );
              })}
            </div>
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
