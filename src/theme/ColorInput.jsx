// theme/ColorInput.jsx
import { useEffect, useRef, useState } from "react";

/* ---- kill the native inner swatch border/padding (once) ---- */
let _ciCssInjected = false;
function injectColorInputCss() {
  if (_ciCssInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = `
    .color-swatch{appearance:none;-webkit-appearance:none;-moz-appearance:none;}
    .color-swatch::-webkit-color-swatch-wrapper{padding:0;}
    .color-swatch::-webkit-color-swatch{border:none;border-radius:0.375rem;}
    .color-swatch::-moz-color-swatch{border:none;border-radius:0.375rem;}
  `;
  document.head.appendChild(style);
  _ciCssInjected = true;
}

/* ---- helpers ---- */
function normalizeHex(input) {
  let s = (input || "").trim().replace(/[^#a-fA-F0-9]/g, "");
  if (!s.startsWith("#")) s = "#" + s;
  const hex = s.slice(1).toUpperCase();
  if (hex.length > 6) s = "#" + hex.slice(0, 6);
  return s;
}
function expandShortHex(hex) {
  const h = (hex || "").replace("#", "");
  if (h.length === 3)
    return ("#" + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]).toUpperCase();
  return ("#" + h.padStart(6, "0")).slice(0, 7).toUpperCase();
}

/* ---- the inline row ---- */
function HexRow({ value = "#1F50AF", onChange }) {
  const [hex, setHex] = useState(value);

  useEffect(() => {
    injectColorInputCss();
    setHex(value || "#000000");
  }, [value]);

  const onSwatch = (e) => {
    const v = (e.target.value || "#000000").toUpperCase();
    setHex(v);
    onChange?.(v);
  };
  const onHexTyping = (e) => setHex(normalizeHex(e.target.value));
  const commit = () => {
    const h = hex.toUpperCase();
    const ok3 = /^#[0-9A-F]{3}$/.test(h);
    const ok6 = /^#[0-9A-F]{6}$/.test(h);
    if (ok3 || ok6) onChange?.(expandShortHex(h));
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={hex.length === 7 ? hex : "#000000"}
        onChange={onSwatch}
        className="color-swatch h-7 w-7 rounded-md border border-gray-200 p-0"
        title="Pick colour"
      />
      <input
        value={hex}
        onChange={onHexTyping}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        inputMode="text"
        spellCheck={false}
        placeholder="#RRGGBB"
        className="py-2 text-sm outline-none focus:border-[#1F50AF] tracking-wider"
        title="Enter hex (e.g. #1F50AF or #1FA)"
      />
    </div>
  );
}

/* ---- solid-only popover used when withModal === true ---- */
function SolidColorPopover({ anchorRef, open, onClose, value, onChange }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 120, left: 120 });

  useEffect(() => {
    if (!open) return;
    const M = 8,
      W = 360;

    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelH = panelRef.current?.offsetHeight ?? 0;
      let left = Math.min(Math.max(M, rect.left), window.innerWidth - W - M);
      let top = rect.bottom + M; // prefer below
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
    const raf = requestAnimationFrame(place);
    const re = () => place();
    window.addEventListener("resize", re);
    window.addEventListener("scroll", re, true);
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", re);
      window.removeEventListener("scroll", re, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, anchorRef, onClose]);

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
        className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 w-[360px] p-4"
        style={{
          top: pos.top,
          left: pos.left,
          maxHeight: "calc(100vh - 24px)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-800">Solid colour</div>
          <button
            className="UserIconBtn w-auto px-3"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <HexRow value={value} onChange={onChange} />

        <div className="mt-3 flex justify-end">
          <button
            className="UserPrimaryCta w-auto px-4"
            onClick={onClose}
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- exported: same API, plus optional `withModal` ---- */
export default function ColorInput({
  value = "#1F50AF",
  onChange,
  withModal = false,
}) {
  const [hex, setHex] = useState(value || "#000000");
  useEffect(() => {
    injectColorInputCss();
    setHex(value || "#000000");
  }, [value]);

  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  const commit = (v) => {
    setHex(v);
    onChange?.(v);
  };

  if (!withModal) {
    return <HexRow value={hex} onChange={commit} />;
  }

  return (
    <div>
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm hover:border-gray-300 transition cursor-pointer"
        aria-label="Edit colour"
      >
        {/* Full-bleed swatch */}
        <div
          className="h-7 w-7 rounded-md border border-gray-200 shrink-0"
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
        <div className="flex-1 px-3 text-left text-gray-800 truncate">
          {hex}
        </div>
        <div className="text-xs text-gray-500">Edit</div>
      </button>

      <SolidColorPopover
        anchorRef={ref}
        open={open}
        onClose={() => setOpen(false)}
        value={hex}
        onChange={commit}
      />
    </div>
  );
}
