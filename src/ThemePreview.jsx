// ThemePreview.jsx — simplified brand preview for Hub Design
import { Twitter, Linkedin, Facebook, Instagram } from "./icons";

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
  rightSidebarText: "#374151",

  buttonBg: "#1F50AF",
  buttonText: "#FFFFFF",
  buttonHoverColor: "#1F50AF",
};

const clamp01 = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));

const hexToRgb = (hex = "#000000") => {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2) || "00", 16),
    g: parseInt(h.slice(2, 4) || "00", 16),
    b: parseInt(h.slice(4, 6) || "00", 16),
  };
};

const withAlpha = (hex, alphaPct) => {
  const a = clamp01(alphaPct ?? 100) / 100;
  if (a >= 0.999) return hex || "#000000";

  const { r, g, b } = hexToRgb(hex || "#000000");
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
};

const cssGradient = (gradient) => {
  if (
    !gradient ||
    !Array.isArray(gradient.stops) ||
    gradient.stops.length === 0
  ) {
    return null;
  }

  let stops = gradient.stops
    .filter((stop) => stop && stop.color)
    .map((stop, index) => ({
      color: stop.color,
      alpha: clamp01(stop.alpha ?? 100),
      at:
        stop.at == null
          ? gradient.stops.length === 1
            ? index
              ? 100
              : 0
            : Math.round((index / (gradient.stops.length - 1)) * 100)
          : clamp01(stop.at),
    }))
    .sort((a, b) => a.at - b.at);

  if (stops.length === 1) {
    const only = stops[0];
    stops = [
      { ...only, at: 0 },
      { ...only, at: 100 },
    ];
  }

  if (stops[0].at > 0) stops.unshift({ ...stops[0], at: 0 });
  if (stops[stops.length - 1].at < 100) {
    stops.push({ ...stops[stops.length - 1], at: 100 });
  }

  const angle =
    typeof gradient.angle === "number" ? `${gradient.angle}deg` : "135deg";

  return `linear-gradient(${angle}, ${stops
    .map((stop) => `${withAlpha(stop.color, stop.alpha)} ${stop.at}%`)
    .join(", ")})`;
};

const getBackground = (theme) => {
  if (theme.sidebarBgMode === "image" && theme.sidebarBgImage) {
    const url =
      typeof theme.sidebarBgImage === "string"
        ? theme.sidebarBgImage
        : theme.sidebarBgImage.url;

    return {
      backgroundImage: `url("${url}")`,
      backgroundSize: theme.sidebarBgImageFit || "cover",
      backgroundPosition: theme.sidebarBgImagePosition || "center",
      backgroundRepeat: "no-repeat",
    };
  }

  if (theme.sidebarBgMode === "gradient") {
    return {
      background: cssGradient(theme.sidebarGradient) || theme.sidebarBg,
    };
  }

  return {
    background: theme.sidebarBg || "#F7F8FC",
  };
};

export default function ThemePreview({
  theme,
  logoUrl,
  hubName,
  contentName,
  anchorClass = "relative",
  className = "w-full",
  label,
}) {
  const t = { ...FALLBACK_THEME, ...(theme || {}) };

  const nameHub = (hubName && hubName.trim()) || "Hub name";
  const nameContent = (contentName && contentName.trim()) || "Content name";

  const sidebarStyle = {
    ...getBackground(t),
    color: t.sidebarText || "#374151",
  };

  return (
    <div className={anchorClass}>
      {label ? (
        <div className="mb-2 text-[11px] text-gray-700">{label}</div>
      ) : null}

      <div
        className={[
          "overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm",
          className,
        ].join(" ")}
      >
        <div className="grid min-h-[420px] grid-cols-[180px_minmax(0,1fr)]">
          <aside
            className="flex min-h-full flex-col justify-between p-5"
            style={sidebarStyle}
          >
            <div>
              <div className="flex h-12 items-center">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    className="max-h-10 max-w-[130px] object-contain"
                  />
                ) : (
                  <div className="text-sm font-semibold">{nameHub}</div>
                )}
              </div>

              <div className="mt-8 space-y-2 text-sm">
                <div className="rounded-md bg-white/20 px-3 py-2 font-medium">
                  Overview
                </div>
                <div className="px-3 py-2 opacity-80">Content</div>
                <div className="px-3 py-2 opacity-80">Next steps</div>
              </div>
            </div>

            <button
              type="button"
              className="h-9 rounded-md px-3 text-sm font-medium shadow-sm"
              style={{
                backgroundColor: t.buttonBg || "#1F50AF",
                color: t.buttonText || "#FFFFFF",
              }}
            >
              Contact us
            </button>
          </aside>

          <section className="bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400">
                  Prospect hub
                </div>
                <div
                  className="mt-2 text-2xl font-semibold"
                  style={{ color: t.rightSidebarText || "#111827" }}
                >
                  {nameHub}
                </div>
              </div>

              <div
                className="flex gap-3"
                style={{ color: t.rightSidebarText || t.sidebarText }}
              >
                <Twitter size={14} />
                <Linkedin size={14} />
                <Facebook size={14} />
                <Instagram size={14} />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {[contentName || "Intro deck", "Case study", "Pricing guide"].map(
                (item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {item}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Content item preview
                        </div>
                      </div>

                      <div
                        className="h-8 w-8 rounded-md"
                        style={{
                          backgroundColor:
                            index === 0 ? t.buttonBg || "#1F50AF" : "#E5E7EB",
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="mt-8 rounded-lg border border-dashed border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400">
                Selected content
              </div>
              <div
                className="mt-2 text-lg font-semibold"
                style={{ color: t.rightSidebarText || "#111827" }}
              >
                {nameContent}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
