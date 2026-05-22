import Toggle from "../Toggle";

function FieldRow({ label, description, children, toggle }) {
  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-800">{label}</div>

          {description ? (
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {description}
            </p>
          ) : null}

          {children ? <div className="mt-3">{children}</div> : null}
        </div>

        {toggle ? <div className="pt-1">{toggle}</div> : null}
      </div>
    </div>
  );
}

function PositionButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-9 rounded-md border px-3 text-sm font-medium",
        active
          ? "border-[#1F50AF] bg-[#EEF3FF] text-[#1F50AF]"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function HeroEditPanel({
  open,
  hero,
  onClose,
  onSave,
  onUploadImage,
}) {
  if (!open) return null;

  function update(patch) {
    onSave({
      ...hero,
      ...patch,
    });
  }

  const imageMode = hero.imageMode || "asset";
  const imagePosition = hero.imagePosition || "center";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="absolute right-0 top-0 flex h-full w-[420px] max-w-[calc(100vw-2rem)] flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Featured settings
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Control what appears in the featured section. Edit text directly
              on the page.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6">
          <FieldRow
            label="Show featured section"
            description="If hidden, the first asset still appears in Start here."
            toggle={
              <Toggle
                checked={hero.enabled !== false}
                onChange={(checked) => update({ enabled: checked })}
                label="Show featured section"
              />
            }
          />

          <FieldRow
            label="Eyebrow"
            toggle={
              <Toggle
                checked={hero.eyebrowVisible !== false}
                onChange={(checked) => update({ eyebrowVisible: checked })}
                label="Show eyebrow"
              />
            }
          />

          <FieldRow
            label="Headline"
            toggle={
              <Toggle
                checked={hero.titleVisible !== false}
                onChange={(checked) => update({ titleVisible: checked })}
                label="Show headline"
              />
            }
          />

          <FieldRow
            label="Body"
            toggle={
              <Toggle
                checked={hero.bodyVisible !== false}
                onChange={(checked) => update({ bodyVisible: checked })}
                label="Show body"
              />
            }
          />

          <FieldRow
            label="CTA"
            description="The button text is edited directly on the featured section."
            toggle={
              <Toggle
                checked={hero.ctaVisible !== false}
                onChange={(checked) => update({ ctaVisible: checked })}
                label="Show CTA"
              />
            }
          >
            <input
              type="url"
              value={hero.ctaUrl || ""}
              onChange={(e) => update({ ctaUrl: e.target.value })}
              placeholder="https://example.com"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-[#1F50AF]"
            />
          </FieldRow>

          <FieldRow
            label="Image"
            description="Use the featured asset thumbnail or upload a custom hero image."
            toggle={
              <Toggle
                checked={hero.imageVisible !== false}
                onChange={(checked) => update({ imageVisible: checked })}
                label="Show image"
              />
            }
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => update({ imageMode: "asset" })}
                className={[
                  "h-10 rounded-md border px-3 text-sm font-medium",
                  imageMode === "asset"
                    ? "border-[#1F50AF] bg-[#EEF3FF] text-[#1F50AF]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                Featured asset
              </button>

              <button
                type="button"
                onClick={() => update({ imageMode: "custom" })}
                className={[
                  "h-10 rounded-md border px-3 text-sm font-medium",
                  imageMode === "custom"
                    ? "border-[#1F50AF] bg-[#EEF3FF] text-[#1F50AF]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                Custom image
              </button>
            </div>

            {imageMode === "custom" ? (
              <div className="mt-4">
                {hero.imageUrl ? (
                  <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img
                      src={hero.imageUrl}
                      alt=""
                      className="h-40 w-full object-cover"
                      style={{ objectPosition: imagePosition }}
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                    No custom image uploaded
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onUploadImage}
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {hero.imageUrl ? "Replace image" : "Upload image"}
                  </button>

                  {hero.imageUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          imageUrl: "",
                          imageMode: "asset",
                          imagePosition: "center",
                        })
                      }
                      className="h-9 rounded-md border border-red-200 bg-white px-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </FieldRow>

          <FieldRow
            label="Image position"
            description="Adjust how the hero image is cropped."
          >
            <div className="flex flex-wrap gap-2">
              <PositionButton
                active={imagePosition === "top"}
                onClick={() => update({ imagePosition: "top" })}
              >
                ↑ Top
              </PositionButton>

              <PositionButton
                active={imagePosition === "center"}
                onClick={() => update({ imagePosition: "center" })}
              >
                ↕ Centre
              </PositionButton>

              <PositionButton
                active={imagePosition === "bottom"}
                onClick={() => update({ imagePosition: "bottom" })}
              >
                ↓ Bottom
              </PositionButton>
            </div>
          </FieldRow>
        </div>
      </aside>
    </div>
  );
}
