import AssetTypeLabel from "./AssetTypeLabel";
import EditIcon from "../../icons/EditIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import ActionButton from "../ActionButton";

function StatusText({ status }) {
  if (!status) return <span className="text-gray-400">—</span>;

  const cls =
    status === "ready"
      ? "text-green-600"
      : status === "failed"
        ? "text-red-600"
        : "text-amber-600";

  return <span className={`font-medium ${cls}`}>{status}</span>;
}

function formatUpdatedAt(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date) return "—";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AssetListTableRow({
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
      className="grid grid-cols-[minmax(0,2.4fr)_120px_150px_140px_1.4fr_160px_120px] items-center gap-4 border-b border-gray-100 px-6 py-4 text-sm text-gray-900 transition-colors hover:bg-gray-50 cursor-pointer"
    >
      <div className="min-w-0">
        <div className="truncate font-medium text-gray-900">
          {asset.name || "Untitled"}
        </div>
      </div>

      <div className="text-gray-600">
        <AssetTypeLabel asset={asset} />
      </div>

      <div>
        {asset.category ? (
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            {asset.category}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </div>

      <div>
        <StatusText status={asset.processingStatus} />
      </div>

      <div className="truncate text-gray-500">
        {Array.isArray(asset.tags) && asset.tags.length > 0
          ? asset.tags.slice(0, 3).join(", ")
          : "—"}
      </div>

      <div className="text-gray-500">
        {formatUpdatedAt(asset.updatedAt || asset.createdAt)}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <ActionButton title="Asset details" onClick={() => onEdit(asset.id)}>
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
  );
}
