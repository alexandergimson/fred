export default function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-sm ${
              active ? "bg-[#6D28D9] text-white" : "bg-white text-gray-700"
            } ${i > 0 ? "border-l border-gray-200" : ""}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
