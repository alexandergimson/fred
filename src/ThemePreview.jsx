// ThemePreview.jsx
import React from "react";

/* fallback + migration-friendly */
const FALLBACK_THEME = {
  sidebarBgMode: "solid",
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

const cssGradient = (g) => {
  if (!g || !Array.isArray(g.stops) || g.stops.length < 2) return null;
  const angle = typeof g.angle === "number" ? `${g.angle}deg` : "135deg";
  const parts = g.stops.map(
    (s) => `${s.color}${typeof s.at === "number" ? ` ${s.at}%` : ""}`
  );
  return `linear-gradient(${angle}, ${parts.join(", ")})`;
};

const bgVal = (mode, solid, gradient) =>
  mode === "gradient" ? cssGradient(gradient) || solid : solid;

export default function ThemePreview({
  theme,
  logoUrl,
  anchorClass = "relative",
  className = "w-full aspect-[16/9]",
  label,
}) {
  const t = { ...FALLBACK_THEME, ...(theme || {}) };

  const sidebarBg = bgVal(t.sidebarBgMode, t.sidebarBg, t.sidebarGradient);
  const headerBg = bgVal(t.headerBgMode, t.headerBg, t.headerGradient);
  const contentBg = bgVal(t.contentBgMode, t.contentBg, t.contentGradient);

  return (
    <div className={anchorClass}>
      {label && <div className="mb-2 text-[11px] text-gray-500">{label}</div>}

      <div
        className={`shadow-lg border border-gray-200 overflow-hidden bg-white ${className}`}
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <aside
            className="w-[110px] flex flex-col"
            style={{ background: sidebarBg, color: t.sidebarText }}
          >
            <div
              className="h-12 mb-3 flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: t.logoBg }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-4 object-contain" />
              ) : (
                <div className="text-[10px] opacity-70">Logo</div>
              )}
            </div>
            <div className="space-y-1 text-[11px] leading-5 px-4">
              <div
                className="rounded-md px-2 py-1"
                style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
              >
                Content 1
              </div>
              <div className="px-2 py-1">Content 2</div>
              <div className="px-2 py-1">Content 3</div>
            </div>
          </aside>

          {/* Main */}
          <div
            className="flex-1 flex flex-col"
            style={{ background: contentBg }}
          >
            <header
              className="h-12 flex items-center justify-between px-4"
              style={{ background: headerBg, color: t.headerText }}
            >
              <div className="font-medium text-[12px] tracking-wide">
                HUB NAME
              </div>
              <div
                className="h-7 px-3 rounded-md text-[12px] grid place-items-center"
                style={{ backgroundColor: t.buttonBg, color: t.buttonText }}
              >
                Contact Us
              </div>
            </header>

            <div className="flex-1 grid place-items-center">
              <div className="w-4/5 h-3/4 border border-gray-300 rounded-lg grid place-items-center text-[11px] text-gray-500 bg-white/70">
                Content 1
              </div>
            </div>

            {/* half-height centered control bar */}
            <div className="h-4.5 flex items-center justify-center">
              <div
                className="h-[18px] px-2 rounded-md flex items-center gap-2"
                style={{ backgroundColor: t.buttonBg, color: t.buttonText }}
              >
                <div className="w-4 h-4 rounded-sm bg-white/20" />
                <div className="text-[10px]">1–2 / 14</div>
                <div className="w-4 h-4 rounded-sm bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
