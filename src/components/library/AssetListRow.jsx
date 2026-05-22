// src/components/library/AssetListRow.jsx
import AssetThumb from "./AssetThumb";
import StatusBadge from "./StatusBadge";
import AssetTypeLabel from "./AssetTypeLabel";
import AssetTags from "./AssetTags";

export default function AssetListRow({ asset }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 hover:shadow-sm transition-all">
      <div className="flex items-center gap-6">
        <AssetThumb asset={asset} className="w-20 h-16 rounded-lg shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-900 truncate">
            {asset.name || "Untitled"}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            <AssetTypeLabel asset={asset} />
          </div>
          <AssetTags asset={asset} className="mt-2" />
        </div>

        <div className="shrink-0">
          <StatusBadge status={asset.processingStatus} />
        </div>
      </div>
    </div>
  );
}
