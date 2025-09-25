// ThemePreview.jsx — unified background like Prospect view
import React from "react";

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

  const sidebarBg = bgVal(t.sidebarBgMode, t.sidebarBg, t.sidebarGradient);

  const nameHub = (hubName && hubName.trim()) || "Hub name";
  const nameContent = (contentName && contentName.trim()) || "Content name";

  const itemHoverBg = t.buttonHoverColor || t.buttonBg;
  const itemHoverText = getContrastColor(itemHoverBg);

  return (
    <div className={anchorClass}>
      {label && <div className="mb-2 text-[11px] text-gray-700">{label}</div>}

      <style>{`
        .tp-item {
          transition: background-color .15s ease, color .15s ease;
          cursor: pointer;
        }
        .tp-item:hover {
          background: ${itemHoverBg} !important;
          color: ${itemHoverText} !important;
        }
      `}</style>

      <div
        className={`shadow-lg border border-gray-200 overflow-hidden ${className}`}
      >
        {/* Single background wrapper */}
        <div
          className="flex h-full"
          style={{ background: sidebarBg, color: t.sidebarText }}
        >
          {/* LEFT sidebar */}
          <aside
            className="flex flex-col overflow-hidden"
            style={{ width: "16%" }}
          >
            <div
              className="shrink-0 flex items-center justify-center"
              style={{ height: "5rem" }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-8 object-contain" />
              ) : (
                <div className="text-[10px] opacity-70">Logo</div>
              )}
            </div>
            <div className="px-3 pt-4 space-y-2 text-[11px]">
              <div
                className="h-8 px-2 grid place-items-center rounded tp-item"
                style={{ background: t.buttonBg, color: t.buttonText }}
              >
                Item A
              </div>
              <div className="h-8 px-2 grid place-items-center rounded tp-item">
                Item B
              </div>
              <div className="h-8 px-2 grid place-items-center rounded tp-item">
                Item C
              </div>
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

          {/* RIGHT sidebar */}
          <aside
            className="flex flex-col overflow-hidden "
            style={{ width: "16%" }}
          >
            <div className="px-3 pt-4 space-y-2 text-[11px]">
              <div
                className="h-8 px-2 grid place-items-center rounded tp-item"
                style={{ background: t.buttonBg, color: t.buttonText }}
              >
                Contact Us
              </div>
            </div>
            <div className="px-4 py-3 space-y-3 text-[11px] leading-5">
              <div>
                <div className="uppercase tracking-wide opacity-60 text-[10px]">
                  Hub
                </div>
                <div className="font-bold text-lg">{nameHub}</div>
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
