export const clamp01 = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const is3 = h.length === 3;
  const r = parseInt(is3 ? h[0] + h[0] : h.slice(0, 2), 16);
  const g = parseInt(is3 ? h[1] + h[1] : h.slice(2, 4), 16);
  const b = parseInt(is3 ? h[2] + h[2] : h.slice(4, 6), 16);
  return { r, g, b };
}
export function withAlpha(hex, alphaPct) {
  const a = clamp01(alphaPct ?? 100) / 100;
  if (a >= 0.999) return hex;
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

/** Build CSS linear-gradient from stops that support ranges (at..to) + opacity */
export function cssGradient(g) {
  if (!g || !Array.isArray(g.stops) || g.stops.length < 2) return null;
  const angle = typeof g.angle === "number" ? `${g.angle}deg` : "135deg";

  const parts = [];
  [...g.stops]
    .map((s) => ({
      color: withAlpha(s.color, s.alpha),
      at: clamp01(s.at),
      to: s.to == null ? null : clamp01(s.to),
    }))
    .sort((a, b) => a.at - b.at)
    .forEach((s) => {
      if (s.to != null && s.to !== s.at) {
        parts.push(`${s.color} ${s.at}%`, `${s.color} ${s.to}%`);
      } else {
        parts.push(`${s.color} ${s.at}%`);
      }
    });

  return `linear-gradient(${angle}, ${parts.join(", ")})`;
}

/** Normalise legacy / partial stop objects */
export function normalizeStops(stops = []) {
  return stops.map((s, i) => ({
    color: s.color || "#FFFFFF",
    at: clamp01(s.at ?? (i === 0 ? 0 : 50)),
    to: s.to == null ? (i === stops.length - 1 ? 100 : clamp01(s.at ?? 50)) : clamp01(s.to),
    alpha: clamp01(s.alpha ?? 100),
  }));
}
