export default function SettingsCard({
  id,
  title,
  description,
  action,
  children,
}) {
  return (
    <section
      id={id}
      className="overflow-hidden rounded-md border border-gray-200 bg-white"
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#1F50AF]">
            {title}
          </h2>

          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}
