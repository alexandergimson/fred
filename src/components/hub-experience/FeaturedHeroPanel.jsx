import InlineEditButton from "./InlineEditButton";
import { getAssetType, getThumb } from "./utils";
import InlineEditableText from "./InlineEditableText";
import PremiumButton from "../PremiumButton";

export default function FeaturedHeroPanel({
  item,
  hero,
  mode,
  styles,
  onOpen,
  onEdit,
  onUpdateHero,
}) {
  const asset = item?.asset;
  const assetThumb = getThumb(asset);
  const heroImage =
    hero.imageMode === "custom" && hero.imageUrl ? hero.imageUrl : assetThumb;
  const isBuilder = mode === "builder";
  const hasImage = hero.imageVisible && heroImage;

  if (!item) return null;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-3xl border",
        hasImage ? "bg-gray-950" : "bg-white",
      ].join(" ")}
      style={{
        borderColor: `${styles.brand}33`,
        boxShadow: `0 18px 50px ${styles.brand}14`,
      }}
    >
      {hasImage ? (
        <>
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: hero.imagePosition || "center" }}
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        </>
      ) : null}

      {isBuilder ? (
        <div className="absolute right-3 top-3 z-20">
          <InlineEditButton
            label="Edit featured section"
            onClick={() => onEdit?.("section")}
          />
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-[300px] flex-col justify-center p-8 md:p-10">
        {hero.eyebrowVisible ? (
          <div
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: hasImage ? "#FFFFFF" : styles.brand }}
          >
            {isBuilder ? (
              <InlineEditableText
                value={hero.eyebrow}
                onSave={(value) => onUpdateHero?.({ ...hero, eyebrow: value })}
                placeholder="Eyebrow"
              />
            ) : (
              hero.eyebrow
            )}
          </div>
        ) : null}

        {hero.titleVisible ? (
          <h2
            className={[
              "mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl",
              hasImage ? "text-white" : "text-gray-950",
            ].join(" ")}
          >
            {isBuilder ? (
              <InlineEditableText
                value={hero.title}
                onSave={(value) => onUpdateHero?.({ ...hero, title: value })}
                placeholder="Headline"
              />
            ) : (
              hero.title
            )}
          </h2>
        ) : null}

        {hero.bodyVisible ? (
          <div
            className={[
              "mt-4 max-w-xl text-base leading-7",
              hasImage ? "text-white/80" : "text-gray-500",
            ].join(" ")}
          >
            {isBuilder ? (
              <InlineEditableText
                value={hero.body}
                multiline
                onSave={(value) => onUpdateHero?.({ ...hero, body: value })}
                placeholder="Body text"
                inputClassName="min-h-[120px] resize-none rounded-2xl border-white/15 bg-white/10 p-4 text-white placeholder:text-white/50  focus:border-white/30"
              />
            ) : (
              hero.body
            )}
          </div>
        ) : null}

        {hero.ctaVisible ? (
          <div className="mt-7">
            {isBuilder ? (
              <div
                className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold"
                style={{
                  background: styles.buttonGradient || styles.brand,
                  color: styles.buttonText,
                  boxShadow: styles.buttonShadow,
                }}
              >
                <InlineEditableText
                  value={hero.ctaLabel}
                  onSave={(value) =>
                    onUpdateHero?.({ ...hero, ctaLabel: value })
                  }
                  placeholder="CTA label"
                />
              </div>
            ) : (
              <PremiumButton styles={styles} onClick={() => onOpen?.(item)}>
                {hero.ctaLabel || "View featured content"}
              </PremiumButton>
            )}
          </div>
        ) : null}

        {!hasImage && hero.imageVisible ? (
          <div className="mt-6 text-sm text-gray-400">
            {getAssetType(asset)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
