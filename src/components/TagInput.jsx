import { useState } from "react";

export default function TagInput({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function addTag(raw) {
    const tag = raw.trim();
    if (!tag) return;

    const existing = value.map((t) => t.toLowerCase());
    if (existing.includes(tag.toLowerCase())) return;

    onChange?.([...value, tag]);
    setDraft("");
  }

  function removeTag(tagToRemove) {
    onChange?.(value.filter((tag) => tag !== tagToRemove));
  }

  function handleKeyDown(e) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(draft);
    }

    if (e.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className="min-h-10 w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm outline-none transition-colors focus-within:border-[#1F50AF]">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[#EEF3FF] px-2.5 py-1 text-xs font-medium text-[#1F50AF]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-[#1F50AF]/60 hover:text-[#1F50AF]"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
