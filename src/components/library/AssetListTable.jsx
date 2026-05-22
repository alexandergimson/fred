import AssetListTableHeader from "./AssetListTableHeader";
import AssetListTableRow from "./AssetListTableRow";

export default function AssetListTable({
  assets,
  confirmDeleteId,
  onSetConfirmDelete,
  onDelete,
  onEdit,
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <AssetListTableHeader />

      <div>
        {assets.map((asset) => (
          <AssetListTableRow
            key={asset.id}
            asset={asset}
            confirmDeleteId={confirmDeleteId}
            onSetConfirmDelete={onSetConfirmDelete}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
