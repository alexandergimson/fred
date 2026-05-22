export default function ContentViewerToolbar({
  hubTitle,
  assetTitle,
  description,
  contentTypeLabel,
  onBack,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1020]/80 px-4 py-3 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-9 rounded-full border border-white/10 px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            ← Back
          </button>

          <div className="hidden h-6 w-px bg-white/10 sm:block" />

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {assetTitle || "Content"}
            </div>

            <div className="truncate text-xs text-white/45">
              {hubTitle || "Hub"}
              {description ? ` | ${description}` : ""}
              {contentTypeLabel ? ` | ${contentTypeLabel}` : ""}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
