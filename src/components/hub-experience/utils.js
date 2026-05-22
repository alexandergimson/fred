export const DEFAULT_HERO = {
  enabled: true,
  eyebrow: "Featured",
  eyebrowVisible: true,
  title: "Solutions tailored for your success",
  titleVisible: true,
  body: "Explore hand-picked content designed to help you achieve your goals.",
  bodyVisible: true,
  ctaUrl: "",
  ctaLabel: "View featured content",
  ctaVisible: true,
  imageVisible: true,
  imageMode: "asset",
  imageUrl: "",
  imagePosition: "center",
};

export function normaliseHero(hero) {
  return {
    ...DEFAULT_HERO,
    ...(hero || {}),
  };
}
export function normaliseSections(sections = {}) {
  return {
    guidedTrack: {
      visible:
        sections.guidedTrack?.visible ??
        sections.guidedTrackVisible ??
        true,
      headerVisible: sections.guidedTrack?.headerVisible ?? true,
      descriptionVisible: sections.guidedTrack?.descriptionVisible ?? true,
    },
    allContent: {
      visible:
        sections.allContent?.visible ??
        sections.allContentVisible ??
        true,
      headerVisible: sections.allContent?.headerVisible ?? true,
      descriptionVisible: sections.allContent?.descriptionVisible ?? true,
    },
  };
}
export function getAssetType(asset) {
  if (asset?.kind === "embed") return "Embed";
  if (asset?.fileMimeType === "application/pdf") return "PDF";
  if (asset?.fileMimeType?.startsWith("image/")) return "Image";
  return "File";
}

export function getThumb(asset) {
  if (asset?.thumbnailUrl) return asset.thumbnailUrl;

  if (asset?.fileMimeType?.startsWith("image/")) {
    return asset.fileUrl;
  }

  if (asset?.kind === "embed" && asset?.embedUrl) {
    return getEmbedThumb(asset.embedUrl);
  }

  return null;
}

function getEmbedThumb(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.split("/")[1];
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      let id = "";

      if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/")[2] || "";
      } else if (u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/")[2] || "";
      } else {
        id = u.searchParams.get("v") || "";
      }

      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }

    return null;
  } catch {
    return null;
  }
}
export function getThemeStyles(theme = {}) {
  const brand = theme.buttonBg || "#1F50AF";
  const brandHover = theme.buttonHoverColor || brand;

  const mutedText = theme.mutedText || theme.sidebarMutedText || "#6B7280";
  const buttonText = theme.buttonText || "#FFFFFF";

  const pageBg =
    theme.sidebarBgMode === "solid" ? theme.sidebarBg || "#F4F7FE" : "#F4F7FE";
  const pageGradient =
    theme.sidebarBgMode === "gradient"
      ? cssGradient(theme.sidebarGradient)
      : theme.pageGradient ||
        `radial-gradient(circle at top right, ${theme.secondary || "#A855F7"}22, transparent 34%), linear-gradient(180deg, ${pageBg} 0%, #FFFFFF 100%)`;

  const heroText = theme.sidebarText || theme.text || "#111827";
  const secondary = theme.secondary || "#A855F7";
  const lightText = isLightColor(heroText);
  const contactBorder = lightText
    ? "rgba(255, 255, 255, 0.16)"
    : "rgba(17, 24, 39, 0.12)";
  const contactSurface = lightText
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(255, 255, 255, 0.72)";
  const contactHover = lightText
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(255, 255, 255, 0.88)";

  const buttonGradient =
    theme.buttonGradient ||
    `linear-gradient(135deg, ${brand} 0%, ${secondary} 100%)`;

  const buttonShadow = theme.buttonShadow || `0 12px 30px ${brand}40`;

  return {
    brand,
    brandHover,
    buttonText,
    buttonGradient,
    buttonShadow,
    pageBg,
    pageGradient,

    secondary,

    text: theme.text || theme.sidebarText || "#111827",
    mutedText: theme.mutedText || theme.sidebarMutedText || "#6B7280",
    heroText,
    viewerChrome: theme.viewerChrome || "rgba(0,0,0,0.35)",
    viewerBorder: theme.viewerBorder || "rgba(255,255,255,0.10)",
    viewerMuted: theme.viewerMuted || mutedText,
    categoryPill: {
      activeBackground: theme.categoryPillActiveBackground || buttonGradient,

      activeText: theme.categoryPillActiveText || "#FFFFFF",

      inactiveBackground:
        theme.categoryPillInactiveBackground || "rgba(255,255,255,0.06)",

      inactiveBorder:
        theme.categoryPillInactiveBorder || "rgba(255,255,255,0.12)",

      inactiveText: theme.categoryPillInactiveText || mutedText,
    },
    sectionTitle: theme.sectionTitle || theme.sidebarText || theme.text || "#111827",
    sectionDescription:
      theme.sectionDescription ||
      theme.sidebarMutedText ||
      theme.mutedText ||
      "#6B7280",
    contactPanel: {
      background: pageBg,
      backgroundImage: pageGradient,
      text: heroText,
      mutedText,
      surface: contactSurface,
      surfaceHover: contactHover,
      border: contactBorder,
      iconBackground: lightText
        ? "rgba(255, 255, 255, 0.82)"
        : "rgba(17, 24, 39, 0.08)",
      iconText: lightText ? "#111827" : heroText,
    },

    cardGlass: {
      background: theme.cardGlassBackground || "rgba(0, 0, 0, 0.35)",
      border: theme.cardGlassBorder || "rgba(255, 255, 255, 0.14)",
      text: theme.cardGlassText || "#FFFFFF",
      mutedText: theme.cardGlassMutedText || "rgba(255,255,255,0.72)",
      accent: theme.cardGlassAccent || secondary,
    },

    sectionIcon: {
      background: theme.sectionIconBackground || `${secondary}22`,
      color: theme.sectionIconColor || secondary,
    },
  };
}

function isLightColor(value) {
  const hex = String(value || "").trim();
  const match = hex.match(/^#?([a-f\d]{3}|[a-f\d]{6})$/i);

  if (!match) return false;

  const raw = match[1];
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
}
import { cssGradient } from "../../theme/GradientUtils";
