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
        ) : (
          <GradientPicker value={gradient} onChange={onGradient} />
        )}
      </div>
    </div>
  );
}
