// ProspectLayout.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { db } from "./lib/firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";

import SideBar from "./prospect_sidebar";
import Main from "./prospect_main";

// decide white vs black text based on primary
function getContrastColor(hex) {
  if (!hex) return "#fff";
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

/** Build a CSS linear-gradient from { angle, stops: [{color, at}] } */
function cssGradient(g) {
  if (!g || !Array.isArray(g.stops) || g.stops.length < 2) return null;
  const angle = typeof g.angle === "number" ? `${g.angle}deg` : "135deg";
  const parts = g.stops.map(
    (s) => `${s.color}${typeof s.at === "number" ? ` ${s.at}%` : ""}`
  );
  return `linear-gradient(${angle}, ${parts.join(", ")})`;
}

/** Choose solid vs gradient */
function bgValue(mode, solid, gradient) {
  return mode === "gradient" ? cssGradient(gradient) || solid : solid;
}

export default function ProspectLayout() {
  const { hubId } = useParams();
  const [hub, setHub] = useState(null);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hubs", hubId));
        if (snap.exists()) setHub({ id: snap.id, ...snap.data() });
      } finally {
        /* no-op */
      }
    })();
  }, [hubId]);

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

  // ---- theme -> CSS variables (supports solid or gradient) ----
  const t = hub?.prospectTheme || {};
  const primaryFallback = hub?.colors?.primary || "#1F50AF";

  // sidebar
  const sidebarSolid = t.sidebarBg ?? hub?.colors?.tertiary ?? "#F7F8FC";
  const sidebarBg = bgValue(t.sidebarBgMode, sidebarSolid, t.sidebarGradient);

  // header
  const headerSolid = t.headerBg ?? "#FFFFFF";
  const headerBg = bgValue(t.headerBgMode, headerSolid, t.headerGradient);

  // content
  const contentSolid = t.contentBg ?? "#FFFFFF";
  const contentBg = bgValue(t.contentBgMode, contentSolid, t.contentGradient);

  // buttons
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

    "--pv-content-bg": contentBg,

    // header = logo area (kept from your version)
    "--pv-header-height": "6rem",

    // legacy vars (unchanged)
    "--color-primary": btnBg,
    "--color-secondary": hub?.colors?.secondary ?? "#9DC0BC",
    "--color-tertiary": hub?.colors?.tertiary ?? "#EBF2FF",
    "--text-on-primary": btnText,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={cssVars}>
      <SideBar
        logoUrl={hub?.logoUrl}
        items={sortedItems}
        activeId={activeId}
        onSelect={setActiveId}
      />
      <div className="flex-1 min-w-0">
        <div
          className="h-full overflow-hidden flex flex-col"
          style={{ background: "var(--pv-content-bg)" }}
        >
          <Main
            hubTitle={hub?.name || "Hub"}
            content={activeItem}
            contactHref={hub?.contactLink || null}
          />
        </div>
      </div>
    </div>
  );
}
