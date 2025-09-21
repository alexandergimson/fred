// GradientPicker.jsx
import { useMemo, useRef, useState } from "react";
import ColorInput from "./ColorInput";
import NumberInput from "./NumberInput";
import { cssGradient, clamp01 } from "./GradientUtils";

/** -------- Angle Dial (circular knob) -------- */
function AngleDial({ value = 135, onChange }) {
  const ref = useRef(null);

  const setFromEvent = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = (e.clientX ?? 0) - cx;
    const y = (e.clientY ?? 0) - cy;
    // atan2 gives angle from X axis; convert to CSS gradient angle (clockwise from 0deg at right).
    let deg = (Math.atan2(y, x) * 180) / Math.PI; // -180..180
    deg = (deg + 360) % 360; // 0..359.999
    onChange?.(Math.round(deg));
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    setFromEvent(e);
    const move = (ev) => setFromEvent(ev);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={onPointerDown}
      title="Drag to change angle"
      aria-label="Gradient angle"
      className="relative shrink-0 w-14 h-14 rounded-full border border-gray-300 bg-white shadow-sm grid place-items-center"
      style={{ touchAction: "none" }}
    >
      {/* tick mark */}
      <div
        className="absolute left-1/2 top-1/2 origin-left w-1/2 h-[2px] bg-gray-800 rounded"
        style={{ transform: `rotate(${value}deg)` }}
      />
      <div className="absolute w-2 h-2 rounded-full bg-gray-800" />
    </button>
  );
}

/** -------- Stop editor row -------- */
function GradientStopEditor({ stop, onChange, onRemove, disableRemove }) {
  const set = (patch) => {
    const next = { ...stop, ...patch };
    next.at = clamp01(next.at ?? 0);
    next.alpha = clamp01(next.alpha ?? 100);
    onChange(next);
  };

  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-600 block">
          <NumberInput
            value={stop.at ?? 0}
            min={0}
            max={100}
            onChange={(n) => set({ at: n })}
            className="border rounded-md"
          />
        </label>
        <div className="flex flex-row border rounded-md px-4">
          <ColorInput value={stop.color} onChange={(c) => set({ color: c })} />

          <label className="text-xs text-gray-600 block">
            <NumberInput
              value={stop.alpha ?? 100}
              min={0}
              max={100}
              onChange={(n) => set({ alpha: n })}
            />
          </label>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            className="w-auto px-3 py-1 cursor-pointer"
            onClick={onRemove}
            title="Remove stop"
            disabled={disableRemove}
          >
            –
          </button>
        </div>
      </div>
    </div>
  );
}

/** -------- Draggable bar + handles -------- */
function GradientBar({ gradient, selected, onSelect, onChangeAt, onAddAt }) {
  const trackRef = useRef(null);
  const bg = useMemo(() => cssGradient(gradient) || "transparent", [gradient]);

  const pctFromEvent = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    return Math.round((x / rect.width) * 100);
  };

  const onTrackClick = (e) => {
    if (!trackRef.current) return;
    const at = pctFromEvent(e);
    onAddAt?.(at);
  };

  const onHandlePointerDown = (idx) => (e) => {
    e.preventDefault();
    onSelect?.(idx);
    const move = (ev) => onChangeAt?.(idx, pctFromEvent(ev));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        className="relative h-8 rounded-md border border-gray-200 cursor-crosshair"
        style={{ backgroundImage: bg }}
        onClick={onTrackClick}
      >
        {gradient.stops.map((s, i) => (
          <button
            key={i}
            type="button"
            title={`${s.at}%`}
            onPointerDown={onHandlePointerDown(i)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(i);
            }}
            className={`absolute -top-1.5 -translate-x-1/2 w-6 h-6 rounded border shadow-sm ring-2 ${
              selected === i ? "ring-blue-500" : "ring-white"
            } `}
            style={{
              left: `${s.at}%`,
              background: s.color,
              opacity: (s.alpha ?? 100) / 100,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function GradientPicker({ value, onChange }) {
  const g = value || {
    angle: 135,
    stops: [
      { color: "#D9D9D9", at: 0, alpha: 100 },
      { color: "#737373", at: 100, alpha: 100 },
    ],
  };

  const [selected, setSelected] = useState(0);

  const set = (patch) => onChange?.({ ...g, ...patch });

  const setSortedStops = (stops) =>
    set({ stops: stops.slice().sort((a, b) => (a.at ?? 0) - (b.at ?? 0)) });

  const updateStop = (idx, next) => {
    const stops = g.stops.slice();
    stops[idx] = next;
    setSortedStops(stops);
  };

  const updateStopAt = (idx, at) =>
    updateStop(idx, { ...g.stops[idx], at: clamp01(at) });

  const addStopAt = (at) => {
    const base = g.stops[selected] ?? g.stops[0];
    const stops = g.stops.concat([
      { color: base.color, at: clamp01(at), alpha: base.alpha ?? 100 },
    ]);
    setSortedStops(stops);
    // select the newly added one
    setTimeout(() => setSelected(stops.length), 0);
  };

  const addStop = () => addStopAt(50);

  const removeStop = (idx) => {
    if (g.stops.length <= 2) return; // keep at least two
    const stops = g.stops.slice();
    stops.splice(idx, 1);
    setSortedStops(stops);
    setSelected(0);
  };

  const preview = cssGradient(g) || "transparent";

  return (
    <div className="space-y-3">
      {/* Top row: angle dial + number + preview swatch */}
      <div className="flex items-center gap-3 ">
        <AngleDial value={g.angle} onChange={(n) => set({ angle: n })} />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Angle</span>
          <NumberInput
            value={g.angle}
            min={0}
            max={360}
            onChange={(n) => set({ angle: n })}
          />
        </div>
        <GradientBar
          gradient={g}
          selected={selected}
          onSelect={setSelected}
          onChangeAt={updateStopAt}
          onAddAt={addStopAt}
        />
      </div>

      {/* Gradient bar + actions */}
      <div className="flex items-center justify-between px-3">
        <span className="text-sm font-medium text-gray-700">Stops</span>
        <button
          type="button"
          onClick={addStop}
          className="w-auto px-3 py-1 text-base cursor-pointer"
        >
          +
        </button>
      </div>

      {/* Stacked editors */}
      <div className="grid grid-cols-1 gap-3 ">
        {g.stops.map((s, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${
              selected === i ? "ring-2 ring-blue-500 rounded-lg" : ""
            }`}
          >
            <div className="flex-1">
              <GradientStopEditor
                stop={s}
                onChange={(ns) => updateStop(i, ns)}
                onRemove={() => removeStop(i)}
                disableRemove={g.stops.length <= 2}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
