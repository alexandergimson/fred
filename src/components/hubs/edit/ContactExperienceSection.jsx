import SettingsCard from "./SettingsCard";

export default function ContactExperienceSection({
  form,
  update,
  Field,
  TextInput,
  TextArea,
}) {
  return (
    <SettingsCard
      id="contact-experience"
      title="Contact experience"
      description="Copy and call-to-action shown in the slide-out contact panel."
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Panel headline">
          <TextInput
            value={form.contactHeadline || ""}
            onChange={(e) => update("contactHeadline", e.target.value)}
            placeholder="Ready to talk?"
          />
        </Field>

        <Field label="CTA label">
          <TextInput
            value={form.ctaLabel || ""}
            onChange={(e) => update("ctaLabel", e.target.value)}
            placeholder="Book a meeting"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Panel body">
            <TextArea
              value={form.contactBody || ""}
              onChange={(e) => update("contactBody", e.target.value)}
              placeholder="Book time with our team or use the links below."
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="CTA URL">
            <TextInput
              type="url"
              value={form.ctaUrl || ""}
              onChange={(e) => update("ctaUrl", e.target.value)}
              placeholder="https://calendly.com/..."
            />
          </Field>
        </div>
      </div>
    </SettingsCard>
  );
}
