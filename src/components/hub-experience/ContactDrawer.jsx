import { X } from "lucide-react";
import SocialLinks from "./contact/SocialLinks";
import TeamMemberCard from "./contact/TeamMemberCard";

export default function ContactDrawer({ hub, styles, open, onClose }) {
  const panel = hub?.contactPanel || {};
  const headline = panel.headline || "Ready to talk?";
  const body = panel.body || "Book time with our team or use the links below.";
  const contactStyles = styles.contactPanel;

  const teamMembers = Array.isArray(hub?.teamMembers)
    ? hub.teamMembers
    : hub?.contactPerson
      ? [hub.contactPerson]
      : [];

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-black/20 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={[
          "fixed right-0 top-0 z-50 flex h-screen w-[400px] max-w-[calc(100vw-2rem)] flex-col shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        style={{
          backgroundColor: contactStyles.background,
          backgroundImage: contactStyles.backgroundImage,
          color: contactStyles.text,
        }}
      >
        <div
          className="shrink-0 px-6 py-5"
          style={{ borderBottom: `1px solid ${contactStyles.border}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] opacity-60">
                Contact
              </div>
              <div className="mt-2 text-xl font-semibold">{headline}</div>
              {body ? (
                <p className="mt-2 text-sm leading-6 opacity-70">{body}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer grid h-9 w-9 shrink-0 place-items-center rounded-full p-0 transition-transform hover:-translate-y-[1px] active:translate-y-0"
              style={{
                background: styles.buttonGradient || styles.brand,
                color: styles.buttonText,
                boxShadow: styles.buttonShadow,
              }}
              aria-label="Close contact panel"
            >
              <X aria-hidden="true" size={18} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-6">
          <div className="space-y-4 overflow-auto pr-1">
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <TeamMemberCard
                  key={member.id || member.email || index}
                  name={member.name}
                  role={member.role || member.title}
                  email={member.email}
                  avatarUrl={member.avatarUrl}
                  calendarUrl={member.calendarUrl}
                  linkedin={member.linkedin}
                  styles={styles}
                />
              ))
            ) : (
              <TeamMemberCard
                name={hub?.name || "Your contact"}
                role={hub?.industry || "Sales contact"}
                email={null}
                avatarUrl={null}
                styles={styles}
              />
            )}
          </div>

          <SocialLinks hub={hub} styles={styles} />
        </div>
      </aside>
    </>
  );
}
