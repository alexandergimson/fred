import { useRef, useState } from "react";
import BgPopover from "./BgPopover";
import { cssGradient } from "./GradientUtils";

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

  const previewStyle =
    mode === "gradient"
      ? { backgroundImage: cssGradient(gradient) }
      : { backgroundColor: solid };

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
            className="h-7 w-7 rounded-md border border-gray-200"
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
