import Toggle from "../Toggle";

const COPY = {
  guidedTrack: {
    title: "Guided content track",
    description: "Control how the guided content track appears on the hub.",
    visibleLabel: "Show section",
    headerLabel: "Header",
    descriptionLabel: "Description",
  },
  allContent: {
    title: "All content",
    description:
      "Control how the browseable content section appears on the hub.",
    visibleLabel: "Show section",
    headerLabel: "Header",
    descriptionLabel: "Description",
  },
};

export default function SectionEditPanel({
  open,
  sectionKey,
  value,
  onChange,
  onClose,
}) {
  if (!open || !sectionKey) return null;

  const copy = COPY[sectionKey];

  function update(patch) {
    onChange?.({
      visible: value?.visible !== false,
      headerVisible: value?.headerVisible !== false,
      descriptionVisible: value?.descriptionVisible !== false,
      ...value,
      ...patch,
    });
  }

  return (
    <aside className="fixed bottom-0 right-0 top-0 z-50 w-[410px] border-l border-gray-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-gray-100 p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{copy.title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            {copy.description}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-6 border-b border-gray-100 pb-6">
          <div className="max-w-[280px]">
            <div className="text-sm font-semibold text-gray-900">
              {copy.visibleLabel}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Toggle whether this section appears on the prospect hub.
            </p>
          </div>

          <Toggle
            checked={value?.visible !== false}
            onChange={(checked) => update({ visible: checked })}
            label={copy.visibleLabel}
          />
        </div>

        <div className="flex items-start justify-between gap-6 border-b border-gray-100 pb-6">
          <div className="max-w-[280px]">
            <div className="text-sm font-semibold text-gray-900">
              {copy.headerLabel}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Show or hide the section heading.
            </p>
          </div>

          <Toggle
            checked={value?.headerVisible !== false}
            onChange={(checked) => update({ headerVisible: checked })}
            label={copy.headerLabel}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          {" "}
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {copy.descriptionLabel}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Show or hide the supporting description text.
            </p>
          </div>
          <Toggle
            checked={value?.descriptionVisible !== false}
            onChange={(checked) => update({ descriptionVisible: checked })}
            label={copy.descriptionLabel}
          />
        </div>
      </div>
    </aside>
  );
}
