import { useEffect, useMemo, useState } from "react";
import ProspectContentViewer from "./ProspectContentViewer";
import { getViewState } from "./lib/viewState";
import {
  getThemeStyles,
  normaliseHero,
  normaliseSections,
} from "./components/hub-experience/utils";
import SectionEditPanel from "./components/hub-experience/SectionEditPanel";

import ContactDrawer from "./components/hub-experience/ContactDrawer";
import HeroEditPanel from "./components/hub-experience/HeroEditPanel";
import HubPageLayout from "./components/hub-experience/HubPageLayout";

export default function HubExperience({
  hub,
  hubId,
  shareId = null,
  items = [],
  mode = "public",
  onAddSlot,
  onRemoveItem,
  onReplaceItem,
  onUpdateHero,
  onUploadHeroImage,
  onUpdateSections,
}) {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [heroEditorField, setHeroEditorField] = useState(null);
  const [viewState, setViewState] = useState({});
  const isBuilder = mode === "builder";
  const styles = getThemeStyles(hub?.prospectTheme);
  const hero = normaliseHero(hub?.hero);
  const [editingSection, setEditingSection] = useState(null);
  useEffect(() => {
    setViewState(getViewState(hubId));
  }, [hubId]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId],
  );

  useEffect(() => {
    if (!selectedItemId) return;

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    });
  }, [selectedItemId]);

  useEffect(() => {
    setViewState(getViewState(hubId));
  }, [hubId]);

  const heroEnabled = hero.enabled !== false;
  const featured = heroEnabled && items.length > 0 ? items[0] : null;
  const sections = normaliseSections(hub?.sections);
  const guidedItems = items.filter((item) => item.guided !== false);

  const startHere = guidedItems.slice(0, 12);
  const allResources = items;
  const slots = useMemo(() => {
    if (!isBuilder) return [];

    const minSlots = 6;
    const slotCount = Math.max(minSlots, items.length + 1);

    return Array.from({ length: slotCount }, (_, index) => ({
      index,
      item: items[index] || null,
    }));
  }, [items, isBuilder]);
  const selectedIndex = selectedItem
    ? items.findIndex((item) => item.id === selectedItem.id)
    : -1;

  const nextItems =
    selectedIndex === -1
      ? []
      : [...items.slice(selectedIndex + 1), ...items.slice(0, selectedIndex)]
          .filter((item) => item.id !== selectedItem.id)
          .slice(0, 3);
  if (selectedItem) {
    return (
      <>
        <ContactDrawer
          hub={hub}
          styles={styles}
          open={contactOpen}
          onClose={() => setContactOpen(false)}
        />

        <ProspectContentViewer
          key={selectedItem.id}
          hub={hub}
          styles={styles}
          hubTitle={hub?.name || "Hub"}
          content={selectedItem.asset || selectedItem}
          contactHref={hub?.contactLink || null}
          hubId={hubId}
          shareId={shareId}
          onBack={() => setSelectedItemId(null)}
          onContactClick={() => setContactOpen(true)}
          nextItems={nextItems}
          onOpenNext={(item) => setSelectedItemId(item.id)}
        />
      </>
    );
  }

  return (
    <>
      <ContactDrawer
        hub={hub}
        styles={styles}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />

      {isBuilder ? (
        <HeroEditPanel
          open={!!heroEditorField}
          hero={hero}
          onClose={() => setHeroEditorField(null)}
          onSave={(nextHero) => onUpdateHero?.(nextHero)}
          onUploadImage={onUploadHeroImage}
        />
      ) : null}
      {isBuilder ? (
        <SectionEditPanel
          open={!!editingSection}
          sectionKey={editingSection}
          value={sections?.[editingSection]}
          onClose={() => setEditingSection(null)}
          onChange={(nextValue) =>
            onUpdateSections?.({
              ...sections,
              [editingSection]: nextValue,
            })
          }
        />
      ) : null}
      <HubPageLayout
        hub={hub}
        mode={mode}
        styles={styles}
        hero={hero}
        featured={featured}
        startHere={startHere}
        allResources={allResources}
        slots={slots}
        items={items}
        viewState={viewState}
        onOpenItem={(item) => setSelectedItemId(item.id)}
        onAddSlot={onAddSlot}
        onRemoveItem={onRemoveItem}
        onReplaceItem={onReplaceItem}
        onEditHero={setHeroEditorField}
        onUpdateHero={onUpdateHero}
        setContactOpen={setContactOpen}
        sections={sections}
        onUpdateSections={onUpdateSections}
        onEditSection={setEditingSection}
      />
    </>
  );
}
