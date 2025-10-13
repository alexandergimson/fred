import { useEffect, useRef, useState } from "react";
import Segmented from "./Segmented";
import ColorInput from "./ColorInput";
import GradientPicker from "./GradientPicker";

function XIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImageUploadInline({ value, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = () => inputRef.current?.click();
  const take = (files) => {
    const file = files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ file, url });
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files);
        }}
        onClick={pick}
        className={`border-2 rounded-lg px-4 py-6 text-center cursor-pointer transition
          ${
            dragging
              ? "border-blue-600 bg-blue-50"
              : "border-dashed border-gray-300 hover:border-gray-400"
          }`}
      >
        <div className="text-sm text-gray-800">
          Drag an image here or{" "}
          <span className="underline text-blue-600">click to upload</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          PNG, JPG, SVG, WebP • up to ~8MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => take(e.target.files)}
        />
      </div>

      {value && (
        <div className="flex items-start gap-3">
          <img
            src={typeof value === "string" ? value : value.url}
            alt="Background preview"
            className="w-24 h-16 object-cover rounded border"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs border rounded px-2 py-1 border-gray-200 hover:border-red-300 text-red-600"
          >
            Remove
          </button>
        </div>
      )}

      <div className="text-[11px] text-gray-500">
        Images are displayed as <strong>cover</strong> and{" "}
        <strong>center</strong> by default.
      </div>
    </div>
  );
}

export default function BgPopover({
  anchorRef,
  open,
  onClose,
  mode,
  onMode,
  solid,
  onSolid,
  gradient,
  onGradient,
  image, // NEW
  onImage, // NEW
}) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 120, left: 120 });

  useEffect(() => {
    if (!open) return;
    const M = 8;
    const W = 420;
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelH = panelRef.current?.offsetHeight ?? 0;

      let left = Math.min(Math.max(M, rect.left), window.innerWidth - W - M);
      let top = rect.bottom + M;
      if (top + panelH > window.innerHeight - M) {
        const aboveTop = rect.top - panelH - M;
        top =
          aboveTop >= M
            ? aboveTop
            : Math.max(M, window.innerHeight - panelH - M);
      }
      setPos({ top, left });
    };

    place();
    const re = () => place();
    window.addEventListener("resize", re);
    window.addEventListener("scroll", re, true);
    return () => {
      window.removeEventListener("resize", re);
      window.removeEventListener("scroll", re, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target))
          onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 w-[420px] p-4 overflow-auto"
        style={{
          top: pos.top,
          left: pos.left,
          maxHeight: "calc(100vh - 24px)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <Segmented
            value={mode}
            onChange={onMode}
            options={[
              { value: "solid", label: "Solid colour" },
              { value: "gradient", label: "Gradient" },
              { value: "image", label: "Image" }, // NEW
            ]}
          />
          <button
            onClick={onClose}
            className="UserIconBtn w-8 h-8 grid place-items-center"
            type="button"
            aria-label="Close"
            title="Close"
          >
            <XIcon />
          </button>
        </div>

        {mode === "solid" ? (
          <div className="space-y-2">
            <ColorInput value={solid} onChange={onSolid} />
          </div>
        ) : mode === "gradient" ? (
          <GradientPicker value={gradient} onChange={onGradient} />
        ) : (
          // IMAGE MODE: upload directly inside the popover
          <ImageUploadInline value={image} onChange={onImage} />
        )}
      </div>
    </div>
  );
}
