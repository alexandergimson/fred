// ProspectSidebarLeft.jsx
export default function SideBar({ logoUrl, items, activeId, onSelect, style }) {
  return (
    <aside
      className="h-screen flex flex-col overflow-hidden shrink-0"
      style={{
        width: "16vw",
        minWidth: "200px",
        background: "transparent",
        color: "var(--pv-sidebar-text)",
        ...(style || {}),
      }}
    >
      {/* Top logo area (same height as header) */}
      <div
        className="shrink-0 flex items-center justify-center"
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
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                title={label}
                className="w-full h-10 my-1 flex items-center px-2 rounded-lg text-sm transition-colors cursor-pointer"
                style={{
                  background: isActive ? "var(--pv-btn-bg)" : "transparent",
                  color: isActive
                    ? "var(--pv-btn-text)"
                    : "var(--pv-sidebar-text)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "var(--pv-btn-hover-bg)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <span className="truncate w-full pr-3">{label}</span>
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
