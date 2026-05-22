import { useMemo, useState } from "react";
import FeaturedHeroPanel from "./FeaturedHeroPanel";
import ContentCard from "./ContentCard";
import GuidedContentTrack from "./GuidedContentTrack";
import PremiumButton from "../PremiumButton";
import InlineEditButton from "./InlineEditButton";

function ResourceSection({ className = "", children }) {
  return <div className={className}>{children}</div>;
}

const RESOURCE_GRID =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4";

export default function HubPageLayout({
  hub,
  mode,
  styles,
  hero,
  featured,
  startHere = [],
  allResources = [],
  slots = [],
  items = [],
  onOpenItem,
  onAddSlot,
  onRemoveItem,
  onReplaceItem,
  onEditHero,
  onUpdateHero,
  setContactOpen,
  viewState = {},
  sections = {},
  onUpdateSections,
  onEditSection,
}) {
  const isBuilder = mode === "builder";
  const [activeCategory, setActiveCategory] = useState("All");

  const guidedTrackVisible = sections?.guidedTrack?.visible !== false;
  const allContentVisible = sections?.allContent?.visible !== false;

  const categories = useMemo(() => {
    const unique = new Set();

    allResources.forEach((item) => {
      const category = item.asset?.category || item.category;
      if (category) unique.add(category);
    });

    return ["All", ...Array.from(unique).sort()];
  }, [allResources]);

  const filteredResources =
    activeCategory === "All"
      ? allResources
      : allResources.filter(
          (item) => (item.asset?.category || item.category) === activeCategory,
        );

  return (
    <div className="w-full">
      <div
        className="min-h-screen"
        style={{
          backgroundColor: styles.pageBg,
          backgroundImage: styles.pageGradient,
        }}
      >
        {" "}
        <header className="px-6 py-5 md:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div className="flex h-10 items-center justify-start">
              {hub?.logoUrl ? (
                <img
                  src={hub.logoUrl}
                  alt=""
                  className="max-h-10 max-w-[180px] object-contain"
                />
              ) : null}
            </div>

            <PremiumButton
              styles={styles}
              onClick={() => setContactOpen(true)}
              icon="sparkle"
            >
              Contact
            </PremiumButton>
          </div>
        </header>
        <section className="py-10">
          <div className="mx-auto max-w-7xl">
            {featured ? (
              <FeaturedHeroPanel
                item={featured}
                hero={hero}
                mode={mode}
                styles={styles}
                onOpen={onOpenItem}
                onEdit={isBuilder ? onEditHero : undefined}
                onUpdateHero={isBuilder ? onUpdateHero : undefined}
              />
            ) : isBuilder ? (
              <ResourceSection>
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
                  <div className="text-sm font-semibold text-gray-900">
                    Featured section is hidden
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Turn it back on to show the first content slot as a featured
                    panel.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateHero?.({
                        ...hero,
                        enabled: true,
                      })
                    }
                    className="mt-4 h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Show featured section
                  </button>
                </div>
              </ResourceSection>
            ) : null}

            {guidedTrackVisible ? (
              <ResourceSection className={featured ? "mt-10" : ""}>
                {isBuilder ? (
                  <>
                    <GuidedContentTrack
                      items={startHere}
                      onEdit={() => onEditSection?.("guidedTrack")}
                      mode="builder"
                      styles={styles}
                      viewState={viewState}
                      onOpenItem={onOpenItem}
                      headerVisible={
                        sections?.guidedTrack?.headerVisible !== false
                      }
                      descriptionVisible={
                        sections?.guidedTrack?.descriptionVisible !== false
                      }
                    />
                  </>
                ) : startHere.length > 0 ? (
                  <GuidedContentTrack
                    items={startHere}
                    mode="public"
                    styles={styles}
                    viewState={viewState}
                    onOpenItem={onOpenItem}
                  />
                ) : items.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-sm text-gray-500">
                    No content has been added to this hub yet.
                  </div>
                ) : null}
              </ResourceSection>
            ) : isBuilder ? (
              <ResourceSection className={featured ? "mt-10" : ""}>
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
                  <div className="text-sm font-semibold text-gray-900">
                    Guided content track is hidden
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Turn it back on to show the recommended content journey.
                  </p>
                  <button
                    type="button"
                    onClick={() => onEditSection?.("guidedTrack")}
                    className="mt-4 h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Edit section
                  </button>
                </div>
              </ResourceSection>
            ) : null}

            {isBuilder ? (
              <ResourceSection className="mt-10">
                {!allContentVisible ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
                    <div className="text-sm font-semibold text-gray-900">
                      All content is hidden
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Turn it back on to show the browseable content section.
                    </p>
                    <button
                      type="button"
                      onClick={() => onEditSection?.("allContent")}
                      className="mt-4 h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Show all content
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        {sections?.allContent?.headerVisible !== false ? (
                          <h2
                            className="text-base font-semibold"
                            style={{ color: styles.sectionTitle }}
                          >
                            All content
                          </h2>
                        ) : null}

                        {sections?.allContent?.descriptionVisible !== false ? (
                          <p
                            className="mt-1 text-sm"
                            style={{ color: styles.sectionDescription }}
                          >
                            Optional browseable content section for this hub.
                          </p>
                        ) : null}
                      </div>
                      <InlineEditButton
                        label="Edit all content section"
                        onClick={() => onEditSection?.("allContent")}
                        alwaysVisible
                      />
                    </div>

                    {allResources.length === 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-sm text-gray-500">
                        No additional resources yet.
                      </div>
                    ) : (
                      <>
                        {categories.length > 1 ? (
                          <div className="mb-5 flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <button
                                key={category}
                                type="button"
                                onClick={() => setActiveCategory(category)}
                                className="h-10 rounded-full px-5 text-sm font-medium transition-all hover:opacity-100 cursor-pointer"
                                style={{
                                  background: styles.buttonGradient,
                                  color: styles.buttonText,
                                  borderColor: "transparent",
                                  boxShadow: styles.buttonShadow,
                                  opacity:
                                    activeCategory === category ? 1 : 0.55,
                                }}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <div className={RESOURCE_GRID}>
                          {" "}
                          {filteredResources.map((item) => (
                            <ContentCard
                              key={item.id}
                              item={item}
                              mode="builder"
                              styles={styles}
                              viewed={
                                !!viewState[item.asset?.id || item.id]?.viewed
                              }
                              onOpen={onOpenItem}
                              onRemove={onRemoveItem}
                              onReplace={onReplaceItem}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </ResourceSection>
            ) : allContentVisible ? (
              <ResourceSection
                className={featured || startHere.length > 0 ? "mt-10" : ""}
              >
                {sections?.allContent?.headerVisible !== false ? (
                  <div
                    className="mb-1 text-sm font-semibold"
                    style={{ color: styles.sectionTitle }}
                  >
                    All resources
                  </div>
                ) : null}

                {sections?.allContent?.descriptionVisible !== false ? (
                  <p
                    className="mb-4 text-sm"
                    style={{ color: styles.sectionDescription }}
                  >
                    Browse all resources available in this hub.
                  </p>
                ) : null}

                {allResources.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-sm text-gray-500">
                    No additional resources yet.
                  </div>
                ) : (
                  <>
                    {categories.length > 1 ? (
                      <div className="mb-5 flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            className="h-10 rounded-full px-5 text-sm font-medium transition-all cursor-pointer"
                            style={
                              activeCategory === category
                                ? {
                                    background:
                                      styles.categoryPill.activeBackground,
                                    color: styles.categoryPill.activeText,
                                    borderColor: "transparent",
                                    boxShadow: styles.buttonShadow,
                                  }
                                : {
                                    background: styles.buttonGradient,
                                    color: styles.buttonText,
                                    borderColor: "transparent",
                                    boxShadow: styles.buttonShadow,
                                    opacity: 0.55,
                                  }
                            }
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {filteredResources.length === 0 ? (
                      <div className="rounded-xl bg-gray-50 p-8 text-sm text-gray-500">
                        No content in this category yet.
                      </div>
                    ) : (
                      <div className={RESOURCE_GRID}>
                        {filteredResources.map((item) => (
                          <ContentCard
                            key={item.id}
                            item={item}
                            mode="public"
                            styles={styles}
                            compact
                            viewed={
                              !!viewState[item.asset?.id || item.id]?.viewed
                            }
                            onOpen={onOpenItem}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </ResourceSection>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
