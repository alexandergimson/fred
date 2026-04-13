// ProspectLayout.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { db } from "./lib/firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import ProspectMetaSidebar from "./ProspectSidebarRight";
import SideBar from "./ProspectSidebarLeft"; // left list
import Main from "./ProspectContentViewer"; // center PDF/Image/Embed
import "./prospect.css";

// contrast util
function getContrastColor(hex) {
  if (!hex) return "#fff";
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

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

const bgValue = (
  mode,
  solid,
  gradient,
  image,
  fit = "cover",
  position = "center"
) => {
  if (mode === "image" && image) {
    const url = typeof image === "string" ? image : image.url;
    // CSS background shorthand: image URL + position / size + no-repeat
    return `url("${url}") ${position} / ${fit} no-repeat`;
  }
  return mode === "gradient" ? cssGradient(gradient) || solid : solid;
};

export default function ProspectLayout() {
  const { hubId, shareId } = useParams(); // shareId is optional depending on your route
  const [hub, setHub] = useState(null);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookSize, setBookSize] = useState(null);

  // hub
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snap = await getDoc(doc(db, "hubs", hubId));
      if (!cancelled && snap.exists()) setHub({ id: snap.id, ...snap.data() });
    })();
    return () => { cancelled = true; };
  }, [hubId]);

  // content list
  useEffect(() => {
    const colRef = collection(db, "hubs", hubId, "content");
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(list);
      setLoading(false);
    });
    return () => unsub();
  }, [hubId]);

  const sortedItems = useMemo(() => {
    const BIG = 9e15;
    return [...items].sort((a, b) => {
      const pa = typeof a.position === "number" ? a.position : BIG;
      const pb = typeof b.position === "number" ? b.position : BIG;
      if (pa !== pb) return pa - pb;
      const ca = a.createdAt?.toMillis?.() ?? 0;
      const cb = b.createdAt?.toMillis?.() ?? 0;
      if (ca !== cb) return cb - ca;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [items]);

  useEffect(() => {
    if (hub?.name) {
      document.title = `${hub.name} Content Hub`;
    } else {
      document.title = `Loading...`;
    }
  }, [hub]);

  // Set favicon based on hub favicon/logo
  useEffect(() => {
    // Try to find the main favicon link tag
    const link =
      document.querySelector("link[rel='icon']") ||
      document.querySelector("link[rel='shortcut icon']");

    if (!link) return;

    // Remember the original href once so we can restore it later
    const originalHref =
      link.getAttribute("data-original-href") ||
      link.getAttribute("href") ||
      "/vite.svg";

    if (!link.getAttribute("data-original-href")) {
      link.setAttribute("data-original-href", originalHref);
    }

    if (hub?.faviconUrl) {
      // Prefer the dedicated favicon if set
      link.setAttribute("href", hub.faviconUrl);
    } else if (hub?.logoUrl) {
      // Fallback to the hub logo if no favicon is uploaded
      link.setAttribute("href", hub.logoUrl);
    } else {
      // Fallback to whatever was originally there
      link.setAttribute("href", originalHref);
    }

    // Optional: restore the original favicon when this component unmounts
    return () => {
      const orig = link.getAttribute("data-original-href") || "/vite.svg";
      link.setAttribute("href", orig);
    };
  }, [hub?.faviconUrl, hub?.logoUrl]);

  useEffect(() => {
    if (!activeId && sortedItems.length > 0) setActiveId(sortedItems[0].id);
  }, [sortedItems, activeId]);

  const activeItem = useMemo(
    () => sortedItems.find((x) => x.id === activeId) || null,
    [sortedItems, activeId]
  );

  if (loading) return <div className="p-6">Loading…</div>;

  // ---- theme → CSS vars ----
  const t = hub?.prospectTheme || {};
  const primaryFallback = hub?.colors?.primary || "#1F50AF";

  const sidebarSolid = t.sidebarBg ?? hub?.colors?.tertiary ?? "#F7F8FC";
  const sidebarBg = bgValue(
    t.sidebarBgMode || "solid",
    sidebarSolid,
    t.sidebarGradient,
    t.sidebarBgImage, // NEW
    t.sidebarBgImageFit || "cover", // NEW
    t.sidebarBgImagePosition || "center" // NEW
  );

  const headerSolid = t.headerBg ?? "#FFFFFF";
  const headerBg = bgValue(t.headerBgMode, headerSolid, t.headerGradient);

  const contentSolid = t.contentBg ?? "#FFFFFF";
  const contentBg = bgValue(t.contentBgMode, contentSolid, t.contentGradient);

  const btnBg = t.buttonBg ?? primaryFallback;
  const btnText = t.buttonText ?? getContrastColor(btnBg);

  const cssVars = {
    "--pv-sidebar-bg": sidebarBg,
    "--pv-sidebar-text": t.sidebarText ?? "#374151",
    "--pv-sidebar-meta-text": t.rightSidebarText ?? t.sidebarText ?? "#374151", // NEW
    "--pv-logo-bg": t.logoBg ?? "#FFFFFF",

    "--pv-header-bg": headerBg,
    "--pv-header-text": t.headerText ?? "#111827",

    "--pv-btn-bg": btnBg,
    "--pv-btn-text": btnText,
    "--pv-btn-hover-bg": t.buttonHoverColor,

    "--pv-content-bg": contentBg,
    "--pv-header-height": "5rem", // used as a vertical rhythm unit

    "--brand": t.buttonBg ?? primaryFallback, // base button colour (user-picked)
    "--brand-hover": t.buttonHoverColor || t.buttonBg || primaryFallback, // hover colour (user-picked) or fallback
    "--btn-text":
      t.buttonText ?? getContrastColor(t.buttonBg ?? primaryFallback), // readable text
  };

  // shared width + safeguard for both sidebars
  const sidebarStyle = { width: "16vw", minWidth: "200px" };

  return (
    <div
      className="flex h-screen overflow-hidden page-fade-in"
      style={{ ...cssVars, background: "var(--pv-sidebar-bg)" }}
    >
      {/* LEFT: list */}
      <SideBar
        logoUrl={hub?.logoUrl}
        items={sortedItems}
        activeId={activeId}
        onSelect={setActiveId}
        style={sidebarStyle}
      />

      {/* CENTER: viewer — fills remaining space */}
      <div
        className="flex-1 min-w-0 mt-1"
        style={{ background: "transparent", width: "100%" }}
      >
        <div className="h-full w-full overflow-hidden">
          <Main
            hubTitle={hub?.name || "Hub"}
            content={activeItem}
            contactHref={hub?.contactLink || null}
            onMeasure={setBookSize}
            hubId={hubId}
            shareId={shareId ?? null}
            containerStyle={{
              width: bookSize?.bookWidth
                ? `min(100%, ${bookSize.bookWidth}px)`
                : "100%",
            }}
          />
        </div>
      </div>

      {/* RIGHT: meta sidebar (CTA + names) */}
      <ProspectMetaSidebar
        hub={hub}
        hubTitle={hub?.name || "Hub"}
        contentName={activeItem?.name || "—"}
        contactHref={hub?.contactLink || null}
        onSelect={setActiveId}
        style={sidebarStyle}
        activeItem={activeItem}
      />
    </div>
  );
}
