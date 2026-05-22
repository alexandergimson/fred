// src/components/library/AssetThumb.jsx
export default function AssetThumb({ asset, className = "" }) {
  const thumb =
    asset.thumbnailUrl ||
    (asset.fileMimeType?.startsWith("image/") ? asset.fileUrl : null);

  return (
    <div
      className={`bg-gray-50 flex items-center justify-center overflow-hidden ${className}`}
    >
      {thumb ? (
        <img
          src={thumb}
          alt={asset.name || "Asset"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-sm text-gray-400">
          {asset.kind === "embed" ? "Embed" : "File"}
        </div>
      )}
    </div>
  );
}
