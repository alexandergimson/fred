// ProspectThemePreview.jsx
export default function ProspectThemePreview({
  theme,
  logoUrl,
  className = "",
}) {
  const t = {
    sidebarBg: theme?.sidebarBg || "#F7F8FC",
    sidebarText: theme?.sidebarText || "#374151",
    logoBg: theme?.logoBg || "#FFFFFF",
    headerBg: theme?.headerBg || "#FFFFFF",
    headerText: theme?.headerText || "#111827",
    btnBg: theme?.btnBg || "#1F50AF",
    btnText: theme?.btnText || "#FFFFFF",
    contentBg: theme?.contentBg || "#FFFFFF",
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 shadow-sm p-3 ${className}`}
      style={{ background: "#fff" }}
      aria-label="Prospect theme preview"
    >
      {/* Frame */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ height: 220 }}
      >
        {/* Sidebar */}
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: 84, background: t.sidebarBg, color: t.sidebarText }}
        >
          {/* Logo block */}
          <div
            className="m-3 rounded-md flex items-center justify-center overflow-hidden"
            style={{ height: 44, background: t.logoBg }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="logo"
                className="max-h-full max-w-[60px] object-contain"
              />
            ) : (
              <div
                className="text-[10px] uppercase tracking-wide"
                style={{ color: t.sidebarText }}
              >
                Logo
              </div>
            )}
          </div>

          {/* Nav pills */}
          <div className="mt-2 space-y-2 px-3">
            <div
              className="h-6 rounded-md"
              style={{ background: `${t.sidebarText}22` }}
              title="Active item"
            />
            <div
              className="h-6 rounded-md"
              style={{ background: `${t.sidebarText}11` }}
            />
            <div
              className="h-6 rounded-md"
              style={{ background: `${t.sidebarText}11` }}
            />
          </div>
        </div>

        {/* Header */}
        <div
          className="absolute left-[84px] right-0 top-0 h-12 flex items-center justify-between px-4"
          style={{ background: t.headerBg, color: t.headerText }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-32 rounded"
              style={{ background: `${t.headerText}22` }}
            />
            <span
              className="h-3 w-40 rounded ml-2"
              style={{ background: `${t.headerText}11` }}
            />
          </div>
          <div
            className="h-7 w-24 rounded-md text-center text-[12px] grid place-items-center"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            Contact
          </div>
        </div>

        {/* Content */}
        <div
          className="absolute left-[84px] right-0 top-12 bottom-0"
          style={{ background: t.contentBg }}
        >
          {/* Fake pdf pages */}
          <div className="h-full flex items-center justify-center gap-4 px-4">
            <div
              className="h-[120px] w-[90px] rounded-sm"
              style={{ background: "#e9e9e9" }}
            />
            <div
              className="h-[120px] w-[90px] rounded-sm"
              style={{ background: "#e9e9e9" }}
            />
          </div>

          {/* Controls bar */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-3 rounded-md px-3 py-1 flex items-center gap-2 shadow ring-1 ring-black/5"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            <div className="h-4 w-4 rounded-sm bg-current/20" />
            <div className="text-[11px] tabular-nums">1–2 / 14</div>
            <div className="h-4 w-px bg-current/30" />
            <div className="h-4 w-4 rounded-sm bg-current/20" />
            <div className="h-4 w-4 rounded-sm bg-current/20" />
            <div className="h-4 w-px bg-current/30" />
            <div className="h-4 w-4 rounded-sm bg-current/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
