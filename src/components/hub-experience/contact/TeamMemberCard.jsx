export default function TeamMemberCard({
  name,
  role,
  email,
  avatarUrl,
  calendarUrl,
  linkedin,
  styles,
}) {
  const initial = (name || "Contact").slice(0, 1).toUpperCase();
  const contactStyles = styles.contactPanel;
  const linkStyle = {
    borderColor: contactStyles.border,
    backgroundColor: contactStyles.surface,
    color: contactStyles.text,
  };

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: contactStyles.border,
        backgroundColor: contactStyles.surface,
        color: contactStyles.text,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full text-lg font-semibold"
          style={{
            backgroundColor: `${styles.brand}16`,
            color: styles.brand,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-base font-semibold">
            {name || "Your contact"}
          </div>
          <div
            className="mt-1 truncate text-sm"
            style={{ color: contactStyles.mutedText }}
          >
            {role || "Sales contact"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {calendarUrl ? (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: styles.brand,
              color: styles.buttonText,
            }}
          >
            Book a meeting
          </a>
        ) : null}

        {email ? (
          <a
            href={`mailto:${email}`}
            className="inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                contactStyles.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = contactStyles.surface;
            }}
          >
            {email}
          </a>
        ) : null}

        {linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                contactStyles.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = contactStyles.surface;
            }}
          >
            LinkedIn
          </a>
        ) : null}
      </div>
    </div>
  );
}
