// src/HubItemsScreen.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { listHubItems, removeHubItem } from "./lib/hubItems";
import { subscribeToAssets } from "./lib/assets";
import AddAssetsToHubModal from "./AddAssetsToHubModal";

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

function HubItemCard({ item, onRemove }) {
  const asset = item.asset;
  const thumb =
    asset?.thumbnailUrl ||
    (asset?.fileMimeType?.startsWith("image/") ? asset.fileUrl : null);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-24 h-20 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
        {thumb ? (
          <img
            src={thumb}
            alt={asset?.name || "Asset"}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-xs text-gray-400">
            {asset?.kind === "embed" ? "Embed" : "File"}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <div className="font-medium text-gray-900 truncate">
            {asset?.name || "Missing asset"}
          </div>
          <StatusBadge status={asset?.processingStatus} />
        </div>

        <div className="text-sm text-gray-500 mt-1">
          {asset?.kind === "embed"
            ? "Embed"
            : asset?.fileMimeType === "application/pdf"
              ? "PDF"
              : asset?.fileMimeType?.startsWith("image/")
                ? "Image"
                : "File"}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="text-sm text-red-600 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
}

export default function HubItemsScreen() {
  const { hubId } = useParams();

  const [items, setItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const nextItems = await listHubItems(hubId);
      setItems(nextItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [hubId]);

  useEffect(() => {
    const unsub = subscribeToAssets(setAssets);
    return () => unsub?.();
  }, []);

  async function handleRemove(itemId) {
    try {
      await removeHubItem(hubId, itemId);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to remove item from hub");
    }
  }

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Hub Content"
            action={{
              label: "Add from library",
              onClick: () => setIsAddOpen(true),
            }}
          />

          <div className="flex-1 min-h-0 overflow-auto p-8">
            {loading ? (
              <div className="p-6 text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold text-gray-900">
                    This hub doesn’t have any content yet
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Add assets from your library to start building it.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(true)}
                    className="inline-flex mt-6 px-4 py-2 rounded-md bg-[#1F50AF] text-white"
                  >
                    Add from library
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <HubItemCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddAssetsToHubModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        hubId={hubId}
        assets={assets}
        existingAssetIds={items.map((item) => item.assetId)}
        onAdded={load}
      />
    </main>
  );
}
