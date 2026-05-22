export default function HubsListTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,2.4fr)_160px_1fr_160px_220px] gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 border-b border-gray-200 bg-white">
      <div>Hub Name</div>
      <div>Logo</div>
      <div>Industry</div>
      <div>Created</div>
      <div className="text-right">Actions</div>
    </div>
  );
}
