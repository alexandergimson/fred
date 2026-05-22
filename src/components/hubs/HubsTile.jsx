import AddContent from "../../icons/AddContent";
import PreviewIcon from "../../icons/PreviewIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import HubDesignIcon from "../../icons/HubDesignIcon";
import HubOverviewIcon from "../../icons/HubOverviewIcon";
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

function formatDate(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date) return "—";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HubsTile({
  hub,
  confirmDeleteId,
  onConfirmDelete,
  onSetConfirmDelete,
  onOpen,
  onEdit,
  onDesign,
  onPreview,
}) {
  const isConfirming = confirmDeleteId === hub.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(hub.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onEdit(hub.id)}
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(16,24,40,0.10)]"
    >
      <div className="relative aspect-[16/10] bg-gray-50 flex items-center justify-center overflow-hidden">
        {hub.logoUrl ? (
          <img
            src={hub.logoUrl}
            alt=""
            className="max-h-16 max-w-[70%] object-contain"
          />
        ) : (
          <div className="text-sm text-gray-400">No logo</div>
        )}

        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="flex items-center justify-center gap-2 translate-y-[120%] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            {" "}
            <ActionButton title="Edit details" onClick={() => onEdit(hub.id)}>
              <HubOverviewIcon className="w-4 h-4" />
            </ActionButton>
            <ActionButton title="Hub content" onClick={() => onOpen(hub.id)}>
              <AddContent className="w-4 h-4" />
            </ActionButton>
            <ActionButton title="Preview" onClick={() => onPreview(hub.id)}>
              <PreviewIcon className="w-4 h-4" />
            </ActionButton>
            {isConfirming ? (
              <ActionButton
                title="Confirm delete"
                intent="danger"
                confirm
                label="Confirm?"
                onClick={() => onConfirmDelete(hub.id)}
              />
            ) : (
              <ActionButton
                title="Delete"
                intent="danger"
                onClick={() => onSetConfirmDelete(hub.id)}
              >
                <DeleteIcon className="w-4 h-4" />
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="truncate text-[15px] font-semibold text-gray-900">
          {hub.name || "Untitled hub"}
        </div>

        <div className="mt-1 text-sm text-gray-500">
          {hub.industry || "No industry"}
        </div>

        <div className="mt-3 text-xs text-gray-400">
          Created {formatDate(hub.createdAt)}
        </div>
      </div>
    </div>
  );
}
