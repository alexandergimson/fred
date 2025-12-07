// ProspectSidebarLeft.jsx
import { useState, useMemo } from "react";
import Download from "./icons/Download";

export default function SideBar({ logoUrl, items, activeId, onSelect, style }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [iconHoverId, setIconHoverId] = useState(null);

  // Which items can be downloaded? (not embeds + has a fileUrl)
  const downloadableById = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const downloadable =
        it?.kind !== "embed" &&
        typeof it?.fileUrl === "string" &&
        it.fileUrl.length > 0;
      map.set(it.id, downloadable);
    });
    return map;
  }, [items]);

  // Download helper
  async function downloadFile(url, filename = "download") {
    try {
      const res = await fetch(url, { credentials: "omit", mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      const a = document.createElement("a");
      a.href = url + (url.includes("?") ? "&" : "?") + "download=1";
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  function filenameFor(item) {
    try {
      const u = new URL(item.fileUrl);
      const last = u.pathname.split("/").filter(Boolean).pop() || "";
      const hasExt = /\.[a-z0-9]+$/i.test(last);
      const base = (item.name || last || "download")
        .replace(/[^\w.\- ]+/g, "_")
        .trim();
      return hasExt ? base : `${base}${last ? "" : ".file"}`;
    } catch {
      const base = (item.name || "download").replace(/[^\w.\- ]+/g, "_").trim();
      return base;
    }
  }

  // NEW: derive file type from fileUrl (e.g. "PDF", "DOCX")
  function fileTypeFor(item) {
    if (!item?.fileUrl || item.kind === "embed") return null;
    try {
      const u = new URL(item.fileUrl);
      const last = u.pathname.split("/").filter(Boolean).pop() || "";
      const match = last.match(/\.([a-z0-9]+)$/i);
      if (!match) return null;
      return match[1].toUpperCase();
    } catch {
      return null;
    }
  }

  return (
    <aside
      className="h-screen flex flex-col overflow-hidden shrink-0 page-fade-in"
      style={{
        width: "10vw",
        minWidth: "200px",
        background: "transparent",
        color: "var(--pv-sidebar-text)",
        ...(style || {}),
      }}
    >
      <div
        className="shrink-0 flex items-center justify-start px-4 py-2"
        style={{
          height: "var(--pv-header-height)",
          background: "transparent",
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
        ) : (
          <div
            className="rounded-md text-xs px-2 py-1 opacity-70"
            style={{ background: "var(--pv-logo-bg)" }}
          >
            Logo
          </div>
        )}
      </div>

      {/* Scrollable menu */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-4">
        <div className="flex flex-col items-stretch">
          {items.map((item) => {
            const isActive = activeId === item.id;
            const label = item.name || "Untitled";

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                title={label}
                className={`nav-item w-full max-w-[280px]
                  flex items-start justify-between
                  px-3 py-3 min-h-[56px] text-sm text-left
                  rounded-none
                  ${isActive ? "nav-item--active" : ""}`}
              >
                <div className="flex flex-col items-start gap-1 w-full pr-2">
                  <span className="text-sm font-medium leading-snug break-words">
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="w-full text-center text-sm opacity-60 mt-4">
              No content yet.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
