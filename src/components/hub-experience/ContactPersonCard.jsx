export default function ContactPersonCard({
  name,
  role,
  email,
  avatarUrl,
  styles,
}) {
  const initial = (name || "Contact").slice(0, 1).toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
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
          <div className="truncate text-base font-semibold text-gray-900">
            {name || "Your contact"}
          </div>
          <div className="mt-1 truncate text-sm text-gray-500">
            {role || "Sales contact"}
          </div>
        </div>
      </div>

      {email ? (
        <a
          href={`mailto:${email}`}
          className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {email}
        </a>
      ) : null}
    </div>
  );
}
