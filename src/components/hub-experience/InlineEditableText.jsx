import { useEffect, useRef, useState } from "react";

export default function InlineEditableText({
  value,
  onSave,
  placeholder = "Click to edit",
  multiline = false,
  className = "",
  inputClassName = "",
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function save() {
    const next = draft.trim();
    setEditing(false);
    if (next !== (value || "")) onSave?.(next);
  }

  function cancel() {
    setDraft(value || "");
    setEditing(false);
  }

  if (editing) {
    const sharedProps = {
      ref: inputRef,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: save,
      onKeyDown: (e) => {
        if (e.key === "Escape") cancel();
        if (!multiline && e.key === "Enter") save();
      },
      className:
        inputClassName ||
        "w-full rounded-md border border-[#1F50AF] bg-white/95 px-2 py-1 text-gray-900 outline-none",
    };

    return multiline ? (
      <textarea {...sharedProps} rows={3} />
    ) : (
      <input {...sharedProps} />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={[
        "block w-full rounded-md text-left transition hover:ring-2 hover:ring-white/40",
        className,
      ].join(" ")}
    >
      {value || <span className="opacity-50">{placeholder}</span>}
    </button>
  );
}
