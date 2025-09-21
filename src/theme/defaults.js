import { normalizeStops } from "./GradientUtils";

export const defaultProspectTheme = {
  // Sidebar
  sidebarBgMode: "solid",
  sidebarBg: "#F7F8FC",
  sidebarGradient: {
    angle: 135,
    stops: [
      { color: "#F7F8FC", at: 0, to: 50, alpha: 100 },
      { color: "#E5EAF3", at: 50, to: 100, alpha: 100 },
    ],
  },
  sidebarText: "#374151",
  logoBg: "#FFFFFF",

  // Header
  headerBgMode: "solid",
  headerBg: "#FFFFFF",
  headerGradient: {
    angle: 135,
    stops: [
      { color: "#FFFFFF", at: 0, to: 50, alpha: 100 },
      { color: "#F3F4F6", at: 50, to: 100, alpha: 100 },
    ],
  },
  headerText: "#111827",

  // Buttons
  buttonBg: "#1F50AF",
  buttonText: "#FFFFFF",

  // Content
  contentBgMode: "solid",
  contentBg: "#FFFFFF",
  contentGradient: {
    angle: 135,
    stops: [
      { color: "#FFFFFF", at: 0, to: 50, alpha: 100 },
      { color: "#F9FAFB", at: 50, to: 100, alpha: 100 },
    ],
  },
};

export function migrateTheme(t = {}) {
  const merged = { ...defaultProspectTheme, ...t };
  if (merged.sidebarGradient) merged.sidebarGradient.stops = normalizeStops(merged.sidebarGradient.stops);
  if (merged.headerGradient) merged.headerGradient.stops = normalizeStops(merged.headerGradient.stops);
  if (merged.contentGradient) merged.contentGradient.stops = normalizeStops(merged.contentGradient.stops);
  return merged;
}
