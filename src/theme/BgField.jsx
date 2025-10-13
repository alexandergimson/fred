import { useRef, useState } from "react";
import BgPopover from "./BgPopover";

// Simple checkerboard for image preview swatch
const checker = {
  backgroundImage:
    "linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
};

function toGradientString(g) {
  if (!g || !Array.isArray(g.stops) || g.stops.length === 0) return null;
  const len = g.stops.length;
  let stops = g.stops
    .filter((s) => s && s.color)
    .map((s, i) => ({
      color: s.color,
      alpha: Math.max(0, Math.min(100, s.alpha ?? 100)),
      at:
        s.at == null
          ? len === 1
            ? 0
            : Math.round((i / (len - 1)) * 100)
          : Math.max(0, Math.min(100, s.at)),
    }));

  if (stops.length === 0) return null;
  if (stops.length === 1)
    stops = [
      { ...stops[0], at: 0 },
      { ...stops[0], at: 100 },
    ];
  stops.sort((a, b) => a.at - b.at);
  if (stops[0].at > 0) stops.unshift({ ...stops[0], at: 0 });
  if (stops[stops.length - 1].at < 100)
    stops.push({ ...stops[stops.length - 1], at: 100 });

  const parts = stops.map((s) => {
    const a = (s.alpha ?? 100) / 100;
    const hex = s.color?.replace("#", "");
    const r = parseInt(hex?.slice(0, 2) || "00", 16);
    const g2 = parseInt(hex?.slice(2, 4) || "00", 16);
    const b = parseInt(hex?.slice(4, 6) || "00", 16);
    return `rgba(${r}, ${g2}, ${b}, ${a.toFixed(3)}) ${s.at}%`;
  });
  const angle = typeof g.angle === "number" ? `${g.angle}deg` : "135deg";
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
  image, // NEW
  setImage, // NEW
}) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  const gradientCss = toGradientString(gradient);

  const previewStyle =
    mode === "gradient"
      ? { background: gradientCss || solid }
      : mode === "image"
      ? checker
      : { background: solid };

  const previewLabel =
    mode === "gradient" ? "Gradient…" : mode === "image" ? "Image…" : solid;

  return (
    <div>
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-1">
        <button
          ref={ref}
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-xs hover:border-gray-300 transition cursor-pointer"
        >
          <div
            className="h-7 w-7 rounded-md border border-gray-200 overflow-hidden"
            style={previewStyle}
          />
          <div className="flex-1 px-3 text-left text-gray-800 truncate">
            {previewLabel}
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
        image={image} // NEW
        onImage={(v) => {
          // Always enforce cover/center whenever an image is chosen
          setImage(v);
        }}
      />
    </div>
  );
}
