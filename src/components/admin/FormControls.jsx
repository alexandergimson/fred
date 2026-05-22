export function FormField({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>

      <div className="mt-2">{children}</div>

      {hint ? <p className="mt-2 text-xs text-gray-400">{hint}</p> : null}
    </label>
  );
}

export function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-[#1F50AF]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-24 w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-[#1F50AF]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
