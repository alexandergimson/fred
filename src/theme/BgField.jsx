import { useRef, useState } from "react";
import BgPopover from "./BgPopover";

// === Same idea as ThemePreview's cssGradient, but tolerant while editing ===
function clamp01(n) {
  const x = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, x));
}
function hexToRgb(hex = "#000000") {
  const h = hex.replace("#", "");
  const is3 = h.length === 3;
  const r = parseInt(is3 ? h[0] + h[0] : h.slice(0, 2), 16) || 0;
  const g = parseInt(is3 ? h[1] + h[1] : h.slice(2, 4), 16) || 0;
  const b = parseInt(is3 ? h[2] + h[2] : h.slice(4, 6), 16) || 0;
  return { r, g, b };
}
function withAlpha(hex, alphaPct) {
  const a = clamp01(alphaPct ?? 100) / 100;
  if (a >= 0.999) return hex || "#000000";
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

// Build a linear-gradient string even if some fields are missing during edit.
function toGradientString(g) {
  if (!g || !Array.isArray(g.stops) || g.stops.length === 0) return null;

  // Normalize (color, alpha, at). If 'at' missing, distribute evenly.
  const len = g.stops.length;
  let stops = g.stops
    .filter((s) => s && s.color)
    .map((s, i) => ({
      color: s.color,
      alpha: clamp01(s.alpha ?? 100),
      at:
        s.at == null
          ? len === 1
            ? 0
            : Math.round((i / (len - 1)) * 100)
          : clamp01(s.at),
    }));

  if (stops.length === 0) return null;

  // If only one stop, duplicate to show a flat (but valid) gradient.
  if (stops.length === 1) {
    const s = stops[0];
    stops = [
      { ...s, at: 0 },
      { ...s, at: 100 },
    ];
  }

  // Sort by position and ensure coverage [0,100]
  stops.sort((a, b) => a.at - b.at);
  if (stops[0].at > 0) stops.unshift({ ...stops[0], at: 0 });
  if (stops[stops.length - 1].at < 100)
    stops.push({ ...stops[stops.length - 1], at: 100 });

  const angle = typeof g.angle === "number" ? `${g.angle}deg` : "135deg";
  const parts = stops.map((s) => `${withAlpha(s.color, s.alpha)} ${s.at}%`);
  return `linear-gradient(${angle}, ${parts.join(", ")})`;
}

export default function BgField({
  label,
  mode,
  setMode,
  solid,
  setSolid,
  gradient,
  setGradient,
}) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  // EXACT same decision as ThemePreview: gradient when mode === "gradient", else solid.
  const gradientCss = toGradientString(gradient);
  const previewStyle =
    mode === "gradient"
      ? {
          background: gradientCss || solid, // unified background like preview
          backgroundImage: gradientCss || "none",
          backgroundClip: "padding-box",
        }
      : {
          background: solid,
          backgroundImage: "none",
          backgroundClip: "padding-box",
        };

  return (
    <div>
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-1">
        <button
          ref={ref}
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm hover:border-gray-300 transition cursor-pointer"
        >
          <div
            className="h-7 w-7 rounded-md border border-gray-200 overflow-hidden"
            style={previewStyle}
          />
          <div className="flex-1 px-3 text-left text-gray-800 truncate">
            {mode === "gradient" ? "Gradient…" : solid}
          </div>
          <div className="text-xs text-gray-500">Edit</div>
        </button>
      </div>

      <BgPopover
        anchorRef={ref}
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        onMode={setMode}
        solid={solid}
        onSolid={setSolid}
        gradient={gradient}
        onGradient={setGradient}
      />
    </div>
  );
}
