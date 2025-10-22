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

  // replace downloadFile with this:
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
      {/* ✅ Padded top logo area */}
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
        <div className="flex flex-col items-stretch px-4">
          {items.map((item) => {
            const isActive = activeId === item.id;
            const label = item.name || "Untitled";
            const canDownload = isActive && downloadableById.get(item.id);
            const showIcon = canDownload && hoveredId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                title={label}
                className={`nav-item w-full max-w-[280px] h-10 my-1 flex items-center px-2 rounded-lg text-sm ${
                  isActive ? "nav-item--active" : ""
                }`}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => {
                  setHoveredId(null);
                  setIconHoverId(null);
                }}
              >
                <span className="truncate pr-3">{label}</span>

                {showIcon && (
                  <span
                    role="button"
                    aria-label={`Download ${label}`}
                    title={`Download ${label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(item.fileUrl, filenameFor(item));
                    }}
                    onMouseEnter={() => setIconHoverId(item.id)}
                    onMouseLeave={() => setIconHoverId(null)}
                    className="ml-auto relative inline-flex items-center justify-center cursor-pointer select-none"
                    style={{
                      width: 28,
                      height: 28,
                      color: "var(--pv-btn-text)",
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full transition-opacity"
                      style={{
                        background: "currentColor",
                        opacity: iconHoverId === item.id ? 0.12 : 0,
                      }}
                    />
                    <Download className="relative z-10 w-4 h-4 pointer-events-none" />
                  </span>
                )}
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
