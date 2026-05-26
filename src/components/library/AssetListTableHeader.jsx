export default function AssetListTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,2.4fr)_120px_150px_140px_1.4fr_160px_120px] gap-4 border-b border-gray-200 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
      <div>Name</div>
      <div>Type</div>
      <div>Category</div>
      <div>Status</div>
      <div>Tags</div>
      <div>Updated</div>
      <div className="text-right">Actions</div>
    </div>
  );
}
