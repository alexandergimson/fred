import AssetThumb from "./AssetThumb";
import StatusBadge from "./StatusBadge";
import AssetTypeLabel from "./AssetTypeLabel";
import AssetTags from "./AssetTags";
import EditIcon from "../../icons/EditIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import ActionButton from "../ActionButton";

function IconButton({ title, children, intent = "default", onClick }) {
  const cls =
    intent === "danger"
      ? "text-red-600 hover:bg-red-50"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      className={`h-10 w-10 shrink-0 cursor-pointer inline-flex items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(16,24,40,0.14)] border border-gray-200 transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}

export default function AssetTile({
  asset,
  confirmDeleteId,
  onSetConfirmDelete,
  onDelete,
  onEdit,
}) {
  const isConfirming = confirmDeleteId === asset.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(asset.id)}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onEdit(asset.id)
      }
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(16,24,40,0.10)]"
    >
      <div className="relative">
        <AssetThumb asset={asset} className="aspect-[16/10] bg-[#F5F7FA]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="flex items-center justify-center gap-2 translate-y-[120%] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <ActionButton
              title="Asset details"
              onClick={() => onEdit(asset.id)}
            >
              <EditIcon className="w-4 h-4" />
            </ActionButton>

            {isConfirming ? (
              <ActionButton
                title="Confirm delete"
                intent="danger"
                confirm
                label="Confirm?"
                onClick={() => onDelete(asset.id)}
              />
            ) : (
              <ActionButton
                title="Delete asset"
                intent="danger"
                onClick={() => onSetConfirmDelete(asset.id)}
              >
                <DeleteIcon className="w-4 h-4" />
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="truncate text-[15px] font-semibold text-gray-900">
          {asset.name || "Untitled"}
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          <AssetTypeLabel asset={asset} />
          <StatusBadge status={asset.processingStatus} />
        </div>

        <AssetTags asset={asset} className="mt-3" />
      </div>
    </div>
  );
}
