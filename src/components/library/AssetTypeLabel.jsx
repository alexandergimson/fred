// src/components/library/AssetTypeLabel.jsx
export default function AssetTypeLabel({ asset }) {
  return asset.kind === "embed"
    ? "Embed"
    : asset.fileMimeType === "application/pdf"
      ? "PDF"
      : asset.fileMimeType?.startsWith("image/")
        ? "Image"
        : "File";
}
