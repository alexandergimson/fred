import SettingsCard from "./SettingsCard";

export default function SocialLinksSection({ form, update, Field, TextInput }) {
  return (
    <SettingsCard
      id="social-links"
      title="Social links"
      description="Optional links shown in the prospect experience where supported."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Twitter URL">
          <TextInput
            type="url"
            value={form.twitter || ""}
            onChange={(e) => update("twitter", e.target.value)}
            placeholder="https://twitter.com/yourhandle"
          />
        </Field>

        <Field label="LinkedIn URL">
          <TextInput
            type="url"
            value={form.linkedin || ""}
            onChange={(e) => update("linkedin", e.target.value)}
            placeholder="https://linkedin.com/company/yourcompany"
          />
        </Field>

        <Field label="Facebook URL">
          <TextInput
            type="url"
            value={form.facebook || ""}
            onChange={(e) => update("facebook", e.target.value)}
            placeholder="https://facebook.com/yourpage"
          />
        </Field>

        <Field label="Instagram URL">
          <TextInput
            type="url"
            value={form.instagram || ""}
            onChange={(e) => update("instagram", e.target.value)}
            placeholder="https://instagram.com/yourhandle"
          />
        </Field>
      </div>
    </SettingsCard>
  );
}
