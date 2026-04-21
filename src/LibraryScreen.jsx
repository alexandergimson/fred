import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HubScreenHeader from "./HubScreenHeader";
import { subscribeToAssets } from "./lib/assets";

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

function AssetCard({ asset }) {
  const thumb =
    asset.thumbnailUrl ||
    (asset.fileMimeType?.startsWith("image/") ? asset.fileUrl : null);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
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

        {Array.isArray(asset.tags) && asset.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LibraryScreen() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const unsub = subscribeToAssets(setAssets);
    return () => unsub?.();
  }, []);

  return (
    <main className="flex-1 h-screen bg-[#F4F7FE] overflow-hidden flex flex-col">
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <HubScreenHeader
            title="Content Library"
            action={{
              label: "Upload content",
              to: "/admin/library/new",
            }}
          />

          <div className="flex-1 min-h-0 overflow-auto p-8">
            {assets.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Upload your first piece of content
                  </h2>
                  <p className="text-gray-500 mt-2">
                    PDFs, images, and embeds live here and can be reused across
                    hubs.
                  </p>
                  <Link
                    to="/admin/library/new"
                    className="inline-flex mt-6 px-4 py-2 rounded-md bg-[#1F50AF] text-white"
                  >
                    Upload content
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {assets.map((asset) => (
                  <Link key={asset.id} to={`/admin/library/${asset.id}`}>
                    <AssetCard asset={asset} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
