// ProspectMetaSidebar.jsx
export default function ProspectMetaSidebar({
  hubTitle,
  contentName,
  contactHref,
}) {
  return (
    <aside
      className="h-screen w-64 flex flex-col overflow-hidden"
      style={{
        background: "var(--pv-sidebar-bg)",
        color: "var(--pv-sidebar-text)",
      }}
    >
      {/* Top: CTA */}
      <div
        className="p-4 shrink-0 flex items-center justify-center"
        style={{ background: "var(--pv-logo-bg)" }}
      >
        {contactHref ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 inline-flex items-center justify-center rounded-lg text-base no-underline cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background: "var(--pv-btn-bg)",
              color: "var(--pv-btn-text)",
            }}
          >
            Contact Us
          </a>
        ) : null}
      </div>

      {/* Meta */}
      <div className="p-5 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
            Hub
          </div>
          <div className="text-lg font-semibold leading-snug">
            {hubTitle || "—"}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
            Content
          </div>
          <div className="text-base leading-snug">{contentName || "—"}</div>
        </div>
      </div>

      {/* Filler */}
      <div className="flex-1" />
    </aside>
  );
}
