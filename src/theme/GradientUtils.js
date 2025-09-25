// GradientUtils.js
export const clamp01 = (n) =>
  Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));

export function hexToRgb(hex) {
  const h = (hex || "").replace("#", "");
  const is3 = h.length === 3;
  const r = parseInt(is3 ? h[0] + h[0] : h.slice(0, 2), 16);
  const g = parseInt(is3 ? h[1] + h[1] : h.slice(2, 4), 16);
  const b = parseInt(is3 ? h[2] + h[2] : h.slice(4, 6), 16);
  return { r, g, b };
}

export function withAlpha(hex, alphaPct) {
  const a = clamp01(alphaPct ?? 100) / 100;
  if (a >= 0.999) return hex || "#000000";
  const { r, g, b } = hexToRgb(hex || "#000000");
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

/** Fill any missing fields & clamp. Keeps order (sorting happens in cssGradient). */
export function normalizeStops(stops = []) {
  const len = stops.length;
  return stops.map((s, i) => {
    const at = clamp01(s?.at ?? (i === 0 ? 0 : i === len - 1 ? 100 : 50));
    const to =
      s?.to == null
        ? (i === len - 1 ? 100 : at)
        : clamp01(s.to);
    const alpha = clamp01(s?.alpha ?? 100);
    const color = s?.color || "#FFFFFF";
    return { color, at, to, alpha };
  });
}

/** Return a SAFE, always-renderable linear-gradient string (or null if g missing). */
export function cssGradient(g) {
  if (!g) return null;

  const angle = typeof g.angle === "number" ? `${g.angle}deg` : "135deg";
  let stops = Array.isArray(g.stops) ? [...g.stops] : [];
  if (stops.length === 0) return null;

  // If there is only one stop, duplicate to both ends.
  if (stops.length === 1) {
    const s = stops[0] || {};
    stops = [
      { ...s, at: 0, to: 0 },
      { ...s, at: 100, to: 100 },
    ];
  }

  // Normalize + sort by "at"
  const norm = normalizeStops(stops).sort((a, b) => a.at - b.at);

  // Ensure at least two entries after normalization
  if (norm.length === 1) {
    const s = norm[0];
    norm.push({ ...s, at: 100, to: 100 });
  }

  // If all stops collapse to same color/pos, still produce a valid gradient
  const allSame =
    norm.every((s) => s.color === norm[0].color) &&
    norm.every((s) => s.at === norm[0].at && s.to === norm[0].to);

  if (allSame) {
    const c = withAlpha(norm[0].color, norm[0].alpha);
    return `linear-gradient(${angle}, ${c} 0%, ${c} 100%)`;
  }

  // Build color-stops (support hard stops via "to")
  const parts = norm.flatMap((s) => {
    const c = withAlpha(s.color, s.alpha);
    return s.to != null && s.to !== s.at
      ? [`${c} ${s.at}%`, `${c} ${s.to}%`]
      : [`${c} ${s.at}%`];
  });

  return `linear-gradient(${angle}, ${parts.join(", ")})`;
}
