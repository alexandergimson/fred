function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-[#1F50AF]"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-28 w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-[#1F50AF]"
    />
  );
}

const DEFAULT_HERO = {
  enabled: true,
  eyebrow: "Featured",
  title: "Solutions tailored for your success",
  body: "Explore hand-picked content designed to help you achieve your goals.",
  ctaLabel: "View featured content",
};

export default function HubHeroEditor({ open, onClose, value, onSave }) {
  if (!open) return null;

  const hero = {
    ...DEFAULT_HERO,
    ...(value || {}),
  };

  function update(field, nextValue) {
    onSave({
      ...hero,
      [field]: nextValue,
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="absolute right-0 top-0 flex h-full w-[440px] max-w-[calc(100vw-2rem)] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Featured section
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Control the copy that introduces the first resource.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Show featured hero
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  If hidden, the first resource moves into Start here.
                </div>
              </div>

              <button
                type="button"
                onClick={() => update("enabled", !hero.enabled)}
                className={[
                  "relative h-6 w-11 rounded-full transition-colors",
                  hero.enabled ? "bg-[#1F50AF]" : "bg-gray-300",
                ].join(" ")}
                aria-pressed={hero.enabled}
              >
                <span
                  className={[
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                    hero.enabled ? "translate-x-6" : "translate-x-1",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <Field label="Eyebrow">
              <TextInput
                value={hero.eyebrow}
                onChange={(e) => update("eyebrow", e.target.value)}
                placeholder="Featured"
              />
            </Field>

            <Field label="Headline">
              <TextInput
                value={hero.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Solutions tailored for your success"
              />
            </Field>

            <Field label="Body">
              <TextArea
                value={hero.body}
                onChange={(e) => update("body", e.target.value)}
                placeholder="Explore hand-picked content designed to help you achieve your goals."
              />
            </Field>

            <Field label="CTA label">
              <TextInput
                value={hero.ctaLabel}
                onChange={(e) => update("ctaLabel", e.target.value)}
                placeholder="View featured content"
              />
            </Field>
          </div>
        </div>
      </aside>
    </div>
  );
}
