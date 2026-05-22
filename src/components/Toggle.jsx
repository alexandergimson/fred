export default function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={[
        "relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#1F50AF]" : "bg-gray-300",
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
