import { Twitter, Linkedin, Facebook, Instagram } from "../../../icons";

export default function SocialLinks({ hub, styles }) {
  const socialLinks = [
    { label: "Twitter", href: hub?.twitter, Icon: Twitter },
    { label: "LinkedIn", href: hub?.linkedin, Icon: Linkedin },
    { label: "Facebook", href: hub?.facebook, Icon: Facebook },
    { label: "Instagram", href: hub?.instagram, Icon: Instagram },
  ].filter((item) => item.href);

  if (socialLinks.length === 0) return null;

  const contactStyles = styles.contactPanel;

  return (
    <div
      className="mt-auto border-t pt-5"
      style={{ borderColor: contactStyles.border }}
    >
      <div
        className="text-xs font-medium uppercase tracking-[0.12em]"
        style={{ color: contactStyles.mutedText }}
      >
        Follow us
      </div>

      <div className="mt-3 flex gap-2">
        {socialLinks.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 place-items-center rounded-full border transition-colors"
            style={{
              borderColor: contactStyles.border,
              backgroundColor: contactStyles.surface,
              color: contactStyles.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                contactStyles.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = contactStyles.surface;
            }}
            title={label}
          >
            <Icon size={16} />
          </a>
        ))}
      </div>
    </div>
  );
}
