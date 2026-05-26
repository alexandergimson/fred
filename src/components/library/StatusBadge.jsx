export default function StatusBadge({ status }) {
  if (!status) return null;

  const cls =
    status === "ready"
      ? "bg-green-50 text-green-700 border-green-100"
      : status === "failed"
        ? "bg-red-50 text-red-700 border-red-100"
        : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${cls}`}
    >
      {status}
    </span>
  );
}
