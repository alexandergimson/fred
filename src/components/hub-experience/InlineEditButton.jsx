export default function InlineEditButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      className="grid h-8 w-8 place-items-center rounded-full bg-white/95 text-sm text-gray-700 shadow-sm transition-opacity hover:bg-gray-50 cursor-pointer"
      title={label}
      aria-label={label}
    >
      ✎
    </button>
  );
}
