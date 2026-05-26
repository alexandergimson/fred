import AddContent from "../../icons/AddContent";
import PreviewIcon from "../../icons/PreviewIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import HubDesignIcon from "../../icons/HubDesignIcon";
import HubOverviewIcon from "../../icons/HubOverviewIcon";
import ActionButton from "../ActionButton";

function formatDate(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date) return "—";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HubsListTableRow({
  hub,
  confirmDeleteId,
  onConfirmDelete,
  onSetConfirmDelete,
  onOpen,
  onEdit,
  onDesign,
  onPreview,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(hub.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onEdit(hub.id)}
      className="grid grid-cols-[minmax(0,2.4fr)_160px_1fr_160px_220px] items-center gap-4 px-6 py-4 text-sm text-gray-900 border-b border-gray-100 transition-colors hover:bg-gray-50 cursor-pointer"
    >
      <div className="min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(hub.id);
          }}
          className="block max-w-full truncate text-left text-sm font-medium leading-5 text-gray-900 hover:text-[#1F50AF] cursor-pointer"
          title={hub.name}
        >
          {hub.name || "Untitled hub"}
        </button>
      </div>

      <div>
        {hub.logoUrl ? (
          <div className="h-6 w-[104px] overflow-hidden">
            <img
              src={hub.logoUrl}
              alt=""
              className="h-full w-auto object-contain block"
            />
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </div>

      <div className="truncate text-gray-600">{hub.industry || "—"}</div>

      <div className="text-gray-500">{formatDate(hub.createdAt)}</div>

      <div onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end gap-2">
          <ActionButton title="Edit details" onClick={() => onEdit(hub.id)}>
            <HubOverviewIcon className="w-4 h-4" />
          </ActionButton>

          <ActionButton title="Hub content" onClick={() => onOpen(hub.id)}>
            <AddContent className="w-4 h-4" />
          </ActionButton>

          <ActionButton title="Preview" onClick={() => onPreview(hub.id)}>
            <PreviewIcon className="w-4 h-4" />
          </ActionButton>

          {confirmDeleteId === hub.id ? (
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
  );
}
