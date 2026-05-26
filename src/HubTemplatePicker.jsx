import { TEMPLATE_PRESETS } from "./data/templates";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

function TemplateCard({ preset, selected, onClick, onEdit }) {
  return (
    <button
      type="button"
      onClick={() => onClick(preset)}
      className={[
        "rounded-xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
        selected
          ? "border-[#1F50AF] ring-2 ring-[#1F50AF]/15"
          : "border-gray-200 hover:border-gray-300",
      ].join(" ")}
    >
      <div className="flex items-center gap-1.5">
        {preset.swatches.map((colour) => (
          <span
            key={colour}
            className="h-5 w-5 rounded-full border border-black/5"
            style={{ backgroundColor: colour }}
          />
        ))}
      </div>

      <div className="mt-4 text-sm font-semibold text-gray-900">
        {preset.label}
      </div>
      <div className="mt-1 text-xs leading-5 text-gray-500">
        {preset.description}
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(preset);
          }}
          className="mt-3 h-8 rounded-md border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
      ) : null}
    </button>
  );
}

function buildCustomTemplate({
  template,
  label,
  primary,
  secondary,
  background,
  titleText,
  mutedText,
}) {
  return {
    id: template?.id,
    label: label.trim() || "Custom template",
    description: "Custom template",
    custom: true,
    swatches: [background, primary, secondary],
    theme: {
      sidebarBgMode: "solid",
      sidebarBg: background,
      sidebarText: titleText,
      rightSidebarText: titleText,

      buttonBg: primary,
      buttonText: "#FFFFFF",
      buttonHoverColor: primary,
      buttonGradient: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,

      secondary,

      text: titleText,
      mutedText,
      sectionTitle: titleText,
      sectionDescription: mutedText,

      pageGradient: `radial-gradient(circle at top right, ${secondary}33, transparent 34%), linear-gradient(180deg, ${background} 0%, ${background} 100%)`,

      cardGlassBackground: "rgba(15,23,42,0.45)",
      cardGlassBorder: "rgba(255,255,255,0.12)",
      cardGlassAccent: secondary,
    },
  };
}

function ColourRow({ label, description, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-1 text-xs leading-5 text-white/50">
          {description}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#FFFFFF"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-white/5"
        />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-28 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-violet-400"
        />
      </div>
    </label>
  );
}

function CustomTemplateEditor({ template, onBack, onSave, onChangePreview }) {
  const [label, setLabel] = useState(template?.label || "Custom template");
  const [primary, setPrimary] = useState(
    template?.theme?.buttonBg || "#2563EB",
  );
  const [secondary, setSecondary] = useState(
    template?.theme?.secondary || "#7C3AED",
  );
  const [background, setBackground] = useState(
    template?.theme?.sidebarBg || "#020617",
  );
  const [titleText, setTitleText] = useState(
    template?.theme?.sectionTitle || "#FFFFFF",
  );
  const [mutedText, setMutedText] = useState(
    template?.theme?.sectionDescription || "rgba(255,255,255,0.72)",
  );

  const templateDraft = buildCustomTemplate({
    template,
    label,
    primary,
    secondary,
    background,
    titleText,
    mutedText,
  });

  useEffect(() => {
    onChangePreview?.(templateDraft);
  }, [label, primary, secondary, background, titleText, mutedText]);

  return (
    <div className="flex h-full flex-col bg-[#0B1020] text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 text-sm font-medium text-white/55 hover:text-white"
        >
          ← Back to templates
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {template ? "Edit custom template" : "Create custom template"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-white/55">
              Design a unique look for this hub. Changes preview in real time.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <label className="block">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              Template name
            </span>
            <span className="text-xs text-white/35">{label.length}/40</span>
          </div>

          <input
            value={label}
            maxLength={40}
            onChange={(e) => setLabel(e.target.value)}
            className="h-11 w-full rounded-xl border border-violet-400/50 bg-white/5 px-3 text-sm text-white outline-none ring-2 ring-violet-500/10 focus:border-violet-300"
          />
        </label>

        <div className="mt-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
            Colour palette
          </div>

          <ColourRow
            label="Primary"
            description="Buttons, links, highlights"
            value={primary}
            onChange={setPrimary}
          />

          <ColourRow
            label="Secondary"
            description="Accents and gradients"
            value={secondary}
            onChange={setSecondary}
          />

          <ColourRow
            label="Background"
            description="Main page background"
            value={background}
            onChange={setBackground}
          />

          <ColourRow
            label="Title text"
            description="Headings and section titles"
            value={titleText}
            onChange={setTitleText}
          />

          <ColourRow
            label="Muted text"
            description="Descriptions and supporting copy"
            value={mutedText}
            onChange={setMutedText}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-sm font-semibold text-violet-200">Tip</div>
          <p className="mt-1 text-sm leading-6 text-white/55">
            Keep strong contrast between background and text. Use secondary
            colour for glow and accent, not body copy.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 p-6">
        <button
          type="button"
          onClick={() => onSave(templateDraft)}
          className="h-11 w-full rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#1D4ED8]"
        >
          Save template
        </button>
      </div>
    </div>
  );
}

export default function HubTemplatePicker({
  open,
  onClose,
  currentTemplateId,
  onSelect,
  customTemplates = [],
  onSaveCustomTemplate,
  onPreviewCustomTemplate,
}) {
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const allTemplates = [...TEMPLATE_PRESETS, ...customTemplates];

  function openNewTemplate() {
    setEditingTemplate(null);
    setTemplateEditorOpen(true);
  }

  function openEditTemplate(template) {
    setEditingTemplate(template);
    setTemplateEditorOpen(true);
  }
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="absolute right-0 top-0 flex h-full w-[440px] max-w-[calc(100vw-2rem)] flex-col bg-white shadow-2xl">
        {templateEditorOpen ? (
          <CustomTemplateEditor
            template={editingTemplate}
            onBack={() => setTemplateEditorOpen(false)}
            onChangePreview={onPreviewCustomTemplate}
            onSave={(template) => {
              onSaveCustomTemplate?.(template);
              setTemplateEditorOpen(false);
            }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Choose template
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Pick a curated style for this hub.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 transform-gpu cursor-pointer place-items-center rounded-full border border-transparent bg-primary p-0 text-white shadow-sm transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:border-primary hover:bg-background hover:text-primary hover:shadow-md"
                aria-label="Close"
              >
                <X aria-hidden="true" size={18} strokeWidth={2.25} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 gap-3">
                {allTemplates.map((preset) => (
                  <TemplateCard
                    key={preset.id}
                    preset={preset}
                    selected={currentTemplateId === preset.id}
                    onClick={onSelect}
                    onEdit={preset.custom ? openEditTemplate : undefined}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={openNewTemplate}
                className="mt-4 w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                + Add custom template
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export { TEMPLATE_PRESETS };
