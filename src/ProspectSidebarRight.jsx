// ProspectSidebarRight.jsx
export default function ProspectMetaSidebar({
  hubTitle,
  contentName,
  contactHref,
  style,
}) {
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
      <div
        className="p-4 shrink-0 flex items-center justify-center"
        style={{ background: "transparent" }}
      >
        {contactHref ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 inline-flex items-center justify-center rounded-lg text-sm no-underline cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background: "var(--pv-btn-bg)",
              color: "var(--pv-btn-text)",
            }}
          >
            Contact us
          </a>
        ) : null}
      </div>

      <div className="p-4 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
            Hub
          </div>
          <div className="text-base font-semibold leading-snug">
            {hubTitle || "—"}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
            Content
          </div>
          <div className="text-sm leading-snug">{contentName || "—"}</div>
        </div>
      </div>

      <div className="flex-1" />
    </aside>
  );
}
