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
  buttonHoverColor: "#1F50AF", // <- used for content item hover

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

// simple contrast helper (black/white)
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
  logoUrl, // shows at top of right list in this preview
  hubName,
  contentName,
  anchorClass = "relative",
  className = "w-full aspect-[16/9]",
  label,
}) {
  const t = { ...FALLBACK_THEME, ...(theme || {}) };

  const sidebarBg = bgVal(t.sidebarBgMode, t.sidebarBg, t.sidebarGradient);
  const contentBg = bgVal(t.contentBgMode, t.contentBg, t.contentGradient);

  const nameHub = (hubName && hubName.trim()) || "Hub name";
  const nameContent = (contentName && contentName.trim()) || "Content name";

  // Hover styling for content items
  const itemHoverBg = t.buttonHoverColor || t.buttonBg;
  const itemHoverText = getContrastColor(itemHoverBg);

  return (
    // Paint the gradient ONCE here so everything inside shares one continuous background
    <div className={anchorClass} style={{ background: sidebarBg }}>
      {label && <div className="mb-2 text-[11px] text-gray-700">{label}</div>}

      {/* Inline styles to preview hover without external CSS */}
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
        // No background here—keep it transparent so the outer gradient shows through
      >
        {/* Three-pane preview: RIGHT list / CENTER viewer / LEFT meta */}
        <div className="flex h-full">
          {/* RIGHT: simple list to suggest content panel */}
          <aside
            className="w-[110px] border-l border-gray-200"
            // transparent so it doesn't restart the gradient
            style={{ background: "transparent" }}
          >
            <div
              className="h-12 shrink-0 flex items-center justify-center overflow-hidden"
              // transparent so the gradient doesn't restart in the logo strip
              style={{ background: "transparent" }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-5 object-contain" />
              ) : (
                <div className="text-[10px] opacity-70">Logo</div>
              )}
            </div>
            <div className="p-3 space-y-2 text-[11px] text-gray-700">
              <div
                className="h-6 px-2 text-[10px] grid place-items-center rounded"
                style={{ background: t.buttonBg, color: t.buttonText }}
              >
                Item A
              </div>
              <div
                className="h-6 px-2 text-[10px] grid place-items-center rounded"
                style={{
                  background: t.buttonHoverColor,
                  color: getContrastColor(t.buttonHoverColor || t.buttonBg),
                }}
              >
                Item B
              </div>
              <div className="h-6 px-2 text-[10px] grid place-items-center rounded">
                Item C
              </div>
            </div>
          </aside>

          {/* CENTER: viewer area */}
          <div
            className="flex-1 min-w-0 flex items-stretch justify-center overflow-hidden"
            style={{ background: "transparent" }}
          >
            <div className="h-full max-w-full flex items-center justify-center">
              <div className="h-full flex gap-0">
                <div
                  className="h-full bg-white border border-gray-300 aspect-[0.707] grid place-items-center text-gray-400 text-xs select-none"
                  style={{ aspectRatio: "0.707" }}
                >
                  <span className="opacity-70">Content Area</span>
                </div>
              </div>
            </div>
          </div>

          {/* LEFT: meta sidebar (CTA + meta) */}
          <aside
            className="w-[120px] flex flex-col"
            style={{ background: "transparent", color: t.sidebarText }}
          >
            {/* Contact CTA */}
            <div
              className="p-2 shrink-0 flex items-center justify-center"
              style={{ background: "transparent" }}
            >
              <div
                className="h-6 px-2 text-[10px] grid place-items-center rounded"
                style={{ background: t.buttonBg, color: t.buttonText }}
              >
                Contact Us
              </div>
            </div>

            {/* Meta */}
            <div className="px-3 py-3 space-y-3 text-[11px] leading-5">
              <div>
                <div className="uppercase tracking-wide opacity-60 text-[10px]">
                  Hub
                </div>
                <div className="font-medium">{nameHub}</div>
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
