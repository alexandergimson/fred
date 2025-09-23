// prospect_sidebar.jsx
import Logo from "./logo";

export default function SideBar({ logoUrl, items, activeId, onSelect }) {
  return (
    <aside
      className="h-screen w-60 flex flex-col overflow-hidden"
      style={{
        background: "var(--pv-sidebar-bg)",
        color: "var(--pv-sidebar-text)",
      }}
    >
      {/* Top logo area (same height as header) */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          height: "var(--pv-header-height)",
          background: "var(--pv-logo-bg)",
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
        ) : (
          <Logo className="w-40 h-8" />
        )}
      </div>

      {/* Scrollable menu */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-6 scrollbar-thin">
        <div className="flex flex-col items-center">
          {items.map((item) => {
            const isActive = activeId === item.id;
            const label = item.name || "Untitled";
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                title={label}
                className="w-40 h-10 m-2 flex items-center pl-4 rounded-lg text-base transition-colors cursor-pointer"
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
            <div className="w-40 text-center text-sm text-gray-500 mt-4">
              No content yet.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
