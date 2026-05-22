import SettingsCard from "./SettingsCard";

export default function BrandingSection({
  form,
  update,
  logoPreview,
  setLogoModalOpen,
  Field,
  TextInput,
}) {
  return (
    <SettingsCard
      id="branding"
      title="Branding"
      description="Logo, hub name and industry shown across the admin area and prospect experience."
    >
      <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Logo</h3>

            <p className="mt-1 text-sm text-gray-500">
              Used in the prospect hub and hub list.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-16 w-44 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt=""
                  className="max-h-10 max-w-[140px] object-contain"
                />
              ) : (
                <span className="text-sm text-gray-400">No logo</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLogoModalOpen(true)}
              className="h-10 transform-gpu cursor-pointer rounded-lg border border-transparent bg-primary px-4 text-sm font-medium text-white shadow-sm transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:border-primary hover:bg-background hover:text-primary hover:shadow-md"
            >
              {logoPreview ? "Replace" : "Upload"}
            </button>

            {logoPreview ? (
              <button
                type="button"
                onClick={() => update("logo", null)}
                className="h-10 transform-gpu cursor-pointer rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition-all duration-[600ms] ease-out hover:-translate-y-[2px] hover:bg-red-50 hover:shadow-md"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Hub name" required>
          <TextInput
            value={form.name || ""}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Coca-Cola"
          />
        </Field>

        <Field label="Industry">
          <TextInput
            value={form.industry || ""}
            onChange={(e) => update("industry", e.target.value)}
            placeholder="e.g. Financial services"
          />
        </Field>
      </div>
    </SettingsCard>
  );
}
