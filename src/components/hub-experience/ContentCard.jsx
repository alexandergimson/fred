import { getAssetType, getThumb } from "./utils";

export default function ContentCard({
  item,
  featured,
  compact = false,
  mode,
  onOpen,
  onRemove,
  onReplace,
  styles = {},
  viewed,
}) {
  const asset = item.asset;
  const thumb = getThumb(asset);
  const isBuilder = mode === "builder";
  const assetType = getAssetType(asset);

  const glass = {
    background: styles.cardGlass?.background || "rgba(0,0,0,0.38)",
    border: styles.cardGlass?.border || "rgba(255,255,255,0.14)",
    text: styles.cardGlass?.text || "#FFFFFF",
    mutedText: styles.cardGlass?.mutedText || "rgba(255,255,255,0.72)",
    accent: styles.cardGlass?.accent || styles.brand || "#A855F7",
  };

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.(item);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(item)}
      onKeyDown={handleKeyDown}
      className={[
        "group isolate flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-transparent text-left transition-all",
        compact ? "min-h-[220px]" : "min-h-[260px]",
        featured
          ? "md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
          : "",
      ].join(" ")}
      style={{
        borderColor: featured ? `${styles.brand || "#1F50AF"}33` : glass.border,
        boxShadow: featured
          ? `0 14px 40px ${styles.brand || "#1F50AF"}22`
          : "0 14px 35px rgba(15,23,42,0.16)",
      }}
    >
      <div
        className={[
          "relative flex flex-1 overflow-hidden",
          compact ? "min-h-[220px]" : "min-h-[260px]",
        ].join(" ")}
      >
        {" "}
        {thumb ? (
          <img
            src={thumb}
            alt={asset?.name || "Content"}
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-sm text-white/50">
            {assetType}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
        {isBuilder ? (
          <div
            className="absolute right-3 top-3 z-20 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onReplace?.(item)}
              className="h-8 rounded-full bg-white/95 px-3 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Replace
            </button>

            <button
              type="button"
              onClick={() => onRemove?.(item.id)}
              className="h-8 rounded-full bg-white/95 px-3 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ) : null}
        {viewed ? (
          <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
            <span>✓</span>
            <span>Viewed</span>
          </div>
        ) : null}
        <div
          className={[
            "relative z-10 mt-auto w-full rounded-b-2xl border-t backdrop-blur-md",
            compact ? "px-3 py-3" : "px-4 py-4",
          ].join(" ")}
          style={{
            background: glass.background,
            borderColor: glass.border,
            color: glass.text,
          }}
        >
          <div
            className="truncate text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: glass.mutedText }}
          >
            {assetType}
          </div>

          <div
            className="mt-2 line-clamp-2 text-base font-semibold leading-6"
            style={{ color: glass.text }}
          >
            {asset?.name || "Untitled"}
          </div>

          <div className="mt-2 min-h-6">
            {asset?.description ? (
              <div
                className="truncate text-sm leading-6"
                style={{ color: glass.mutedText }}
              >
                {asset.description}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
