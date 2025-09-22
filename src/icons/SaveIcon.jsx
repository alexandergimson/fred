// ./icons/SaveIcon.jsx
export default function SaveIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* floppy-style save icon */}
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21V13a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v8" />
      <path d="M7 3v4h8V3" />
    </svg>
  );
}
