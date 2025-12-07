// ThemePreview.jsx — unified background like Prospect view (CSS-driven buttons/nav)
import { Twitter, Linkedin, Facebook, Instagram } from "lucide-react";

const FALLBACK_THEME = {
  sidebarBgMode: "solid",
  sidebarBgImage: null,
  sidebarBgImageFit: "cover",
  sidebarBgImagePosition: "center",

  sidebarBg: "#F7F8FC",
  sidebarGradient: {
    angle: 135,
    stops: [
      { color: "#F7F8FC", at: 0 },
      { color: "#E5EAF3", at: 100 },
    ],
  },
  sidebarText: "#374151",
  logoBg: "#FFFFFF",
  headerBgMode: "solid",
  headerBg: "#FFFFFF",
  headerGradient: {
    angle: 135,
    stops: [
      { color: "#FFFFFF", at: 0 },
      { color: "#F3F4F6", at: 100 },
    ],
  },
  headerText: "#111827",
  buttonBg: "#1F50AF",
  buttonText: "#FFFFFF",
  buttonHoverColor: "#1F50AF",
  contentBgMode: "solid",
  contentBg: "#FFFFFF",
  contentGradient: {
    angle: 135,
    stops: [
      { color: "#FFFFFF", at: 0 },
      { color: "#F9FAFB", at: 100 },
    ],
  },
};

const clamp01 = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
const hexToRgb = (hex = "#000000") => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2) || "00", 16);
  const g = parseInt(h.slice(2, 4) || "00", 16);
  const b = parseInt(h.slice(4, 6) || "00", 16);
  return { r, g, b };
};
const withAlpha = (hex, alphaPct) => {
  const a = clamp01(alphaPct ?? 100) / 100;
  if (a >= 0.999) return hex || "#000000";
  const { r, g, b } = hexToRgb(hex || "#000000");
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
};

const cssGradient = (g) => {
  if (!g || !Array.isArray(g.stops) || g.stops.length === 0) return null;

  let stops = g.stops
    .filter((s) => s && s.color)
    .map((s, i) => ({
      color: s.color,
      alpha: clamp01(s.alpha ?? 100),
      at:
        s.at == null
          ? g.stops.length === 1
            ? i
              ? 100
              : 0
            : Math.round((i / (g.stops.length - 1)) * 100)
          : clamp01(s.at),
    }))
    .sort((a, b) => a.at - b.at);

  if (stops.length === 1) {
    const s = stops[0];
    stops = [
      { ...s, at: 0 },
      { ...s, at: 100 },
    ];
  }

  if (stops[0].at > 0) stops.unshift({ ...stops[0], at: 0 });
  if (stops[stops.length - 1].at < 100)
    stops.push({ ...stops[stops.length - 1], at: 100 });

  const angle = typeof g.angle === "number" ? `${g.angle}deg` : "135deg";
  const parts = stops.map((s) => `${withAlpha(s.color, s.alpha)} ${s.at}%`);
  return `linear-gradient(${angle}, ${parts.join(", ")})`;
};

const bgVal = (
  mode,
  solid,
  gradient,
  image,
  fit = "cover",
  position = "center"
) => {
  if (mode === "image" && image) {
    const url = typeof image === "string" ? image : image.url;
    return `url("${url}") ${position} / ${fit} no-repeat`;
  }
  return mode === "gradient" ? cssGradient(gradient) || solid : solid;
};

function getContrastColor(hex) {
  if (!hex || typeof hex !== "string") return "#fff";
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#fff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

export default function ThemePreview({
  theme,
  logoUrl,
  hubName,
  contentName,
  anchorClass = "relative",
  className = "w-full aspect-[16/9]",
  label,
}) {
  const t = { ...FALLBACK_THEME, ...(theme || {}) };

  const sidebarBg = bgVal(
    t.sidebarBgMode,
    t.sidebarBg,
    t.sidebarGradient,
    t.sidebarBgImage,
    t.sidebarBgImageFit,
    t.sidebarBgImagePosition
  );

  const nameHub = (hubName && hubName.trim()) || "Hub name";
  const nameContent = (contentName && contentName.trim()) || "Content name";

  // Set the same CSS variables Prospect view uses (prospect.css).
  // Buttons/Nav take their look purely from CSS classes + these vars.
  const previewVars = {
    "--brand": t.buttonBg || "#1F50AF",
    "--brand-hover": t.buttonHoverColor || t.buttonBg || "#1F50AF",
    "--btn-text": t.buttonText || getContrastColor(t.buttonBg || "#1F50AF"),
    "--pv-sidebar-text": t.sidebarText || "#374151",
    "--pv-sidebar-meta-text": t.rightSidebarText || t.sidebarText || "#374151",
  };
  return (
    <div className={anchorClass}>
      {label && <div className="mb-2 text-[11px] text-gray-700">{label}</div>}

      <div
        className={`shadow-lg border border-gray-200 rounded-md overflow-hidden ${className}`}
        style={previewVars}
      >
        <div
          className="flex h-full"
          style={{ background: sidebarBg, color: t.sidebarText }}
        >
          <aside
            className="flex flex-col overflow-hidden"
            style={{ width: "20%" }}
          >
            <div
              className="shrink-0 flex items-center justify-start px-2"
              style={{ height: "5rem" }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-8 object-contain" />
              ) : (
                <div className="text-[10px] opacity-70">Logo</div>
              )}
            </div>

            <div className="px-3 pt-4 text-sm">
              {/* Selected item matches Prospect left-rail */}
              <div className="h-8 px-2 grid place-items-center  font-medium nav-item nav-item--active">
                Item A
              </div>

              {/* Other items pick up hover from CSS (no JS) */}
              {["Item B", "Item C"].map((label) => (
                <div
                  key={label}
                  className="h-8 px-2 grid place-items-center nav-item"
                >
                  {label}
                </div>
              ))}
            </div>
          </aside>

          {/* CENTER viewer */}
          <div className="flex-1 min-w-0 flex items-center justify-center overflow-hidden">
            <div className="flex gap-0 h-[78%]">
              <div
                className="bg-white border border-gray-300 grid place-items-center text-gray-400 text-[11px] rounded-sm ml-0"
                style={{ aspectRatio: "1", height: "100%" }}
              >
                Content area
              </div>
            </div>
          </div>

          {/* RIGHT sidebar CTA uses the same button class */}
          <aside
            className="flex flex-col overflow-hidden"
            style={{ width: "20%" }}
          >
            <div className="px-3 pt-4 space-y-2 text-sm">
              <div className="h-8 px-2 grid place-items-center rounded btn-brand w-full">
                Contact Us
              </div>
            </div>
            {/* NEW: social icons preview (always show all four) */}
            <div className="px-4 py-4 pb-4 flex justify-center">
              <div
                className="flex gap-3 text-[11px]"
                style={{ color: "var(--pv-sidebar-meta-text)" }}
              >
                <Twitter size={14} />
                <Linkedin size={14} />
                <Facebook size={14} />
                <Instagram size={14} />
              </div>
            </div>

            {/* Info block uses right-sidebar text colour */}
            <div
              className="px-4 py-3 space-y-3 text-sm leading-5"
              style={{ color: "var(--pv-sidebar-meta-text)" }}
            >
              <div>
                <div className="uppercase tracking-wide opacity-60 text-[10px]">
                  Hub
                </div>
                <div className="font-bold text-md">{nameHub}</div>
              </div>
              <div>
                <div className="uppercase tracking-wide opacity-60 text-[10px]">
                  Content
                </div>
                <div>{nameContent}</div>
              </div>
            </div>

            <div className="flex-1" />
          </aside>
        </div>
      </div>
    </div>
  );
}
