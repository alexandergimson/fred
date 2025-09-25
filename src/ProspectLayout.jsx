// ProspectLayout.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { db } from "./lib/firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import ProspectMetaSidebar from "./ProspectSidebarRight";
import SideBar from "./ProspectSidebarLeft"; // left list
import Main from "./ProspectContentViewer"; // center PDF/Image/Embed

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

const cssGradient = (g) => {
  if (!g || !Array.isArray(g.stops) || g.stops.length < 2) return null;
  const angle = typeof g.angle === "number" ? `${g.angle}deg` : "135deg";
  const parts = g.stops.map(
    (s) => `${s.color}${typeof s.at === "number" ? ` ${s.at}%` : ""}`
  );
  return `linear-gradient(${angle}, ${parts.join(", ")})`;
};

const bgValue = (mode, solid, gradient) =>
  mode === "gradient" ? cssGradient(gradient) || solid : solid;

export default function ProspectLayout() {
  const { hubId } = useParams();
  const [hub, setHub] = useState(null);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookSize, setBookSize] = useState(null);

  // hub
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId));
        if (snap.exists()) setHub({ id: snap.id, ...snap.data() });
      } finally {
      }
    })();
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
  const sidebarBg = bgValue(t.sidebarBgMode, sidebarSolid, t.sidebarGradient);

  const headerSolid = t.headerBg ?? "#FFFFFF";
  const headerBg = bgValue(t.headerBgMode, headerSolid, t.headerGradient);

  const contentSolid = t.contentBg ?? "#FFFFFF";
  const contentBg = bgValue(t.contentBgMode, contentSolid, t.contentGradient);

  const btnBg = t.buttonBg ?? primaryFallback;
  const btnText = t.buttonText ?? getContrastColor(btnBg);

  const cssVars = {
    "--pv-sidebar-bg": sidebarBg,
    "--pv-sidebar-text": t.sidebarText ?? "#374151",
    "--pv-logo-bg": t.logoBg ?? "#FFFFFF",

    "--pv-header-bg": headerBg,
    "--pv-header-text": t.headerText ?? "#111827",

    "--pv-btn-bg": btnBg,
    "--pv-btn-text": btnText,
    "--pv-btn-hover-bg": t.buttonHoverColor,

    "--pv-content-bg": contentBg,
    "--pv-header-height": "5rem", // used as a vertical rhythm unit
  };

  // shared width + safeguard for both sidebars
  const sidebarStyle = { width: "16vw", minWidth: "200px" };

  return (
    <div
      className="flex h-screen overflow-hidden"
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
        className="flex-1 min-w-0"
        style={{ background: "transparent", width: "100%" }}
      >
        <div className="h-full w-full overflow-hidden">
          <Main
            hubTitle={hub?.name || "Hub"}
            content={activeItem}
            contactHref={hub?.contactLink || null}
            onMeasure={setBookSize}
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
        hubTitle={hub?.name || "Hub"}
        contentName={activeItem?.name || "—"}
        contactHref={hub?.contactLink || null}
        onSelect={setActiveId}
        style={sidebarStyle}
      />
    </div>
  );
}
