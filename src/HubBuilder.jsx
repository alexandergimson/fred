import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./lib/firebase";
import {
  addAssetsToHub,
  listHubItems,
  removeHubItem,
  reorderHubItems,
} from "./lib/hubItems";
import HubAssetPickerModal from "./HubAssetPickerModal";
import HubExperience from "./HubExperience";
import HubTemplatePicker from "./HubTemplatePicker";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./lib/firebase";
import DropzoneModal from "./DropzoneModal";

export default function HubBuilder() {
  const { hubId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState(null);
  const [items, setItems] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [targetSlotIndex, setTargetSlotIndex] = useState(null);
  const [replaceItemId, setReplaceItemId] = useState(null);
  const [heroImageModalOpen, setHeroImageModalOpen] = useState(false);
  async function handleUpdateHero(nextHero) {
    try {
      setHub((prev) => ({
        ...prev,
        hero: nextHero,
      }));

      await updateDoc(doc(db, "hubs", hubId), {
        hero: nextHero,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      alert("Failed to update featured section");
    }
  }

  async function load() {
    const hubSnap = await getDoc(doc(db, "hubs", hubId));

    if (!hubSnap.exists()) {
      navigate("/admin/hubs");
      return;
    }

    const nextItems = await listHubItems(hubId);

    setHub({ id: hubSnap.id, ...hubSnap.data() });
    setItems(nextItems);
  }
  async function handleHeroImageSelect(file) {
    try {
      const path = `hubs/${hubId}/hero/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, path);
      const metadata = { contentType: file.type || "image/png" };
      const task = uploadBytesResumable(fileRef, file, metadata);

      await new Promise((resolve, reject) =>
        task.on("state_changed", null, reject, resolve),
      );

      const imageUrl = await getDownloadURL(fileRef);

      const nextHero = {
        ...(hub?.hero || {}),
        imageVisible: true,
        imageMode: "custom",
        imageUrl,
      };

      await handleUpdateHero(nextHero);
      setHeroImageModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to upload hero image");
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        console.error(e);
        alert("Failed to load hub builder");
      } finally {
        setLoading(false);
      }
    })();
  }, [hubId]);

  const sortedItems = useMemo(() => {
    const BIG = 9e15;

    return [...items].sort((a, b) => {
      const pa = typeof a.position === "number" ? a.position : BIG;
      const pb = typeof b.position === "number" ? b.position : BIG;
      return pa - pb;
    });
  }, [items]);

  function openPicker(slotIndex) {
    setReplaceItemId(null);
    setTargetSlotIndex(slotIndex);
    setPickerOpen(true);
  }

  function openReplacePicker(item) {
    const slotIndex = sortedItems.findIndex((row) => row.id === item.id);
    setReplaceItemId(item.id);
    setTargetSlotIndex(slotIndex === -1 ? null : slotIndex);
    setPickerOpen(true);
  }

  async function handleSaveCustomTemplate(template) {
    try {
      const existing = hub?.customTemplates || [];

      const nextTemplates = template.id
        ? existing.map((t) => (t.id === template.id ? template : t))
        : [
            ...existing,
            {
              ...template,
              id: `custom-${Date.now()}`,
              custom: true,
            },
          ];

      setHub((prev) => ({
        ...prev,
        customTemplates: nextTemplates,
      }));

      await updateDoc(doc(db, "hubs", hubId), {
        customTemplates: nextTemplates,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      alert("Failed to save custom template");
    }
  }

  async function handleSelectTemplate(preset) {
    try {
      const nextTheme = {
        ...preset.theme,
        templateId: preset.id,
      };

      setHub((prev) => ({
        ...prev,
        prospectTheme: nextTheme,
      }));

      await updateDoc(doc(db, "hubs", hubId), {
        prospectTheme: nextTheme,
        updatedAt: serverTimestamp(),
      });

      setTemplateOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to update template");
    }
  }
  async function handleUpdateSections(nextSections) {
    try {
      setHub((prev) => ({
        ...prev,
        sections: nextSections,
      }));

      await updateDoc(doc(db, "hubs", hubId), {
        sections: nextSections,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      alert("Failed to update hub sections");
    }
  }
  async function handleSelectAsset(assetId) {
    try {
      if (replaceItemId) {
        await removeHubItem(hubId, replaceItemId);
      }

      await addAssetsToHub(hubId, [assetId]);

      const nextItems = await listHubItems(hubId);
      const BIG = 9e15;
      const ordered = [...nextItems].sort((a, b) => {
        const pa = typeof a.position === "number" ? a.position : BIG;
        const pb = typeof b.position === "number" ? b.position : BIG;
        return pa - pb;
      });

      const addedIndex = ordered.findIndex((item) => item.assetId === assetId);

      if (addedIndex !== -1 && targetSlotIndex != null) {
        const next = [...ordered];
        const [added] = next.splice(addedIndex, 1);
        next.splice(targetSlotIndex, 0, added);

        const repositioned = next.map((item, index) => ({
          ...item,
          position: index * 100,
        }));

        await reorderHubItems(hubId, repositioned);
      }

      setPickerOpen(false);
      setTargetSlotIndex(null);
      setReplaceItemId(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to add content to hub");
    }
  }

  async function handleRemove(itemId) {
    try {
      await removeHubItem(hubId, itemId);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to remove content from hub");
    }
  }

  if (loading) {
    return (
      <main className="grid h-screen place-items-center bg-[#F4F7FE]">
        <div className="text-sm text-gray-500">Loading builder…</div>
      </main>
    );
  }

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-[#F4F7FE]">
      {" "}
      <header className="pointer-events-none fixed left-0 right-0 top-4 z-40 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={() => navigate("/admin/hubs")}
            className="cursor-pointer h-9 rounded-xl px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ← Back
          </button>

          <div className="mx-2 h-6 w-px bg-gray-200" />

          <div className="max-w-[220px] truncate px-2 text-sm font-semibold text-gray-900">
            {hub?.name || "Untitled hub"}
          </div>

          <div className="mx-2 h-6 w-px bg-gray-200" />

          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="h-9 transform-gpu cursor-pointer rounded-xl border border-transparent bg-secondary px-3 text-sm font-medium text-white shadow-sm transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:border-secondary hover:bg-background hover:text-primary hover:shadow-md"
          >
            Template
          </button>

          <a
            href={`/prospect/${hubId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 transform-gpu cursor-pointer items-center justify-center rounded-xl border border-transparent bg-primary px-3 text-sm font-medium text-white shadow-sm transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:border-primary hover:bg-background hover:text-primary hover:shadow-md"
          >
            Preview
          </a>
        </div>
      </header>
      <section className="min-h-0 flex-1 overflow-auto">
        {" "}
        <HubExperience
          hub={hub}
          hubId={hubId}
          items={sortedItems}
          mode="builder"
          onAddSlot={openPicker}
          onRemoveItem={handleRemove}
          onReplaceItem={openReplacePicker}
          onUpdateHero={handleUpdateHero}
          onUploadHeroImage={() => setHeroImageModalOpen(true)}
          onUpdateSections={handleUpdateSections}
        />
      </section>
      <HubAssetPickerModal
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setTargetSlotIndex(null);
          setReplaceItemId(null);
        }}
        onSelect={handleSelectAsset}
        existingAssetIds={sortedItems
          .filter((item) => item.id !== replaceItemId)
          .map((item) => item.assetId)}
      />
      <HubTemplatePicker
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        currentTemplateId={hub?.prospectTheme?.templateId}
        customTemplates={hub?.customTemplates || []}
        onSelect={handleSelectTemplate}
        onSaveCustomTemplate={handleSaveCustomTemplate}
        onPreviewCustomTemplate={(template) => {
          setHub((prev) => ({
            ...prev,
            prospectTheme: {
              ...template.theme,
              templateId: template.id || "custom-preview",
            },
          }));
        }}
      />
      <DropzoneModal
        open={heroImageModalOpen}
        onClose={() => setHeroImageModalOpen(false)}
        onSelect={handleHeroImageSelect}
        accept="image/*"
        maxBytes={8 * 1024 * 1024}
        title="Upload hero image"
        subtitle="PNG, JPG, SVG or WebP"
        helper="Max 8MB"
      />
    </main>
  );
}
