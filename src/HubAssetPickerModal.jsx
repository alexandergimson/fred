import { useEffect, useMemo, useState } from "react";
import { subscribeToAssets } from "./lib/assets";

function getAssetType(asset) {
  if (asset?.kind === "embed") return "Embed";
  if (asset?.fileMimeType === "application/pdf") return "PDF";
  if (asset?.fileMimeType?.startsWith("image/")) return "Image";
  return "File";
}

function getThumb(asset) {
  return (
    asset?.thumbnailUrl ||
    (asset?.fileMimeType?.startsWith("image/") ? asset.fileUrl : null)
  );
}

export default function HubAssetPickerModal({
  open,
  onClose,
  onSelect,
  existingAssetIds = [],
}) {
  const [assets, setAssets] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const unsub = subscribeToAssets(setAssets);
    return () => unsub?.();
  }, [open]);

  const existingSet = useMemo(
    () => new Set(existingAssetIds),
    [existingAssetIds],
  );

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();

    return assets.filter((asset) => {
      if (asset.archived) return false;
      if (!q) return true;

      return [
        asset.name || "",
        asset.kind || "",
        asset.fileMimeType || "",
        ...(Array.isArray(asset.tags) ? asset.tags : []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [assets, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-x-8 inset-y-8 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Choose content
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pick one asset from your content library.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="border-b border-gray-100 px-6 py-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search content library..."
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-[#1F50AF]"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {filteredAssets.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No assets found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredAssets.map((asset) => {
                const disabled = existingSet.has(asset.id);
                const thumb = getThumb(asset);

                return (
                  <button
                    key={asset.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onSelect(asset.id)}
                    className={[
                      "overflow-hidden rounded-xl border bg-white text-left transition-all",
                      disabled
                        ? "cursor-not-allowed border-gray-200 opacity-40"
                        : "cursor-pointer border-gray-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(16,24,40,0.10)]",
                    ].join(" ")}
                  >
                    <div className="aspect-[16/10] bg-gray-50">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={asset.name || "Asset"}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          {getAssetType(asset)}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {asset.name || "Untitled"}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {disabled ? "Already in hub" : getAssetType(asset)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
