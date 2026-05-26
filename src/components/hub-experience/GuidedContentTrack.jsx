import { useRef } from "react";
import ContentCard from "./ContentCard";
import InlineEditButton from "./InlineEditButton";

export default function GuidedContentTrack({
  title = "Your guided content track",
  description = "Follow these resources in order.",
  showHeader = true,
  headerVisible = true,
  descriptionVisible = true,
  items = [],
  mode,
  styles,
  viewState = {},
  onOpenItem,
  onRemoveItem,
  onReplaceItem,
  onEdit,
}) {
  const railRef = useRef(null);

  function scrollBy(direction) {
    railRef.current?.scrollBy({
      left: direction * 420,
      behavior: "smooth",
    });
  }

  if (!items.length) return null;

  return (
    <section>
      {showHeader ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            {headerVisible ? (
              <h2
                className="text-base font-semibold"
                style={{ color: styles.sectionTitle }}
              >
                {title}
              </h2>
            ) : null}

            {descriptionVisible ? (
              <p
                className="mt-1 text-sm"
                style={{ color: styles.sectionDescription }}
              >
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="cursor-pointer grid h-11 w-11 place-items-center rounded-full transition-all hover:scale-105"
              style={{
                background: styles.buttonGradient,
                color: styles.buttonText,
                borderColor: "rgba(255,255,255,0.12)",
                boxShadow: styles.buttonShadow,
                boxShadow: `${styles.buttonShadow}, 0 0 30px ${styles.secondary}55`,
              }}
              aria-label="Scroll left"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="cursor-pointer grid h-11 w-11 place-items-center rounded-full transition-all hover:scale-105"
              style={{
                background: styles.buttonGradient,
                color: styles.buttonText,
                borderColor: "rgba(255,255,255,0.12)",
                boxShadow: styles.buttonShadow,
                boxShadow: `${styles.buttonShadow}, 0 0 30px ${styles.secondary}55`,
              }}
              aria-label="Scroll right"
            >
              →
            </button>
            {onEdit ? (
              <InlineEditButton
                label="Edit section"
                onClick={onEdit}
                alwaysVisible
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        ref={railRef}
        className="scrollbar-hide flex snap-x gap-4 scroll-smooth pb-2 overflow-hidden"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="relative w-[280px] shrink-0 snap-start sm:w-[320px]"
          >
            <ContentCard
              item={item}
              mode={mode}
              styles={styles}
              viewed={!!viewState[item.asset?.id || item.id]?.viewed}
              onOpen={onOpenItem}
              onRemove={onRemoveItem}
              onReplace={onReplaceItem}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
