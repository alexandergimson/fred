function GridIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M3 3h6v6H3V3Zm8 0h6v6h-6V3ZM3 11h6v6H3v-6Zm8 0h6v6h-6v-6Z" />
    </svg>
  );
}

function ListIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M4 5.5A1.5 1.5 0 1 1 4 2.5a1.5 1.5 0 0 1 0 3ZM7 3.25h10v1.5H7v-1.5ZM4 11.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM7 9.25h10v1.5H7v-1.5ZM4 17.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM7 15.25h10v1.5H7v-1.5Z" />
    </svg>
  );
}

export default function ViewToggle({ viewMode, onChange }) {
  const base =
    "h-10 w-10 inline-flex items-center justify-center rounded-md border transition-colors ";
  const active = "bg-white border-gray-300 text-gray-900 cursor-pointer";
  const inactive =
    "bg-transparent border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60 cursor-pointer";

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md bg-gray-100 p-1 cursor-pointer
"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Tile view"
        title="Tile view"
        className={`${base} ${viewMode === "grid" ? active : inactive}`}
      >
        <GridIcon className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="List view"
        title="List view"
        className={`${base} ${viewMode === "list" ? active : inactive}`}
      >
        <ListIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
