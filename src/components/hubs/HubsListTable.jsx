import HubsListTableHeader from "./HubsListTableHeader";
import HubsListTableRow from "./HubsListTableRow";

export default function HubsListTable({
  hubs,
  confirmDeleteId,
  onConfirmDelete,
  onSetConfirmDelete,
  onOpen,
  onEdit,
  onDesign,
  onPreview,
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <HubsListTableHeader />

      <div>
        {hubs.map((hub) => (
          <HubsListTableRow
            key={hub.id}
            hub={hub}
            confirmDeleteId={confirmDeleteId}
            onConfirmDelete={onConfirmDelete}
            onSetConfirmDelete={onSetConfirmDelete}
            onOpen={onOpen}
            onEdit={onEdit}
            onDesign={onDesign}
            onPreview={onPreview}
          />
        ))}

        {hubs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No hubs yet — create your first one.
          </div>
        ) : null}
      </div>
    </div>
  );
}
