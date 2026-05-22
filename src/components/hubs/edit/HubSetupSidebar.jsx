const items = [
  {
    id: "branding",
    title: "Branding",
    description: "Logo, name, industry",
  },
  {
    id: "contact-experience",
    title: "Contact experience",
    description: "Panel copy and CTA",
  },
  {
    id: "team-contacts",
    title: "Team contacts",
    description: "People in contact panel",
  },
  {
    id: "social-links",
    title: "Social links",
    description: "External profiles",
  },
];

export default function HubSetupSidebar({
  activeSection,
  onNavigate,
  sidebarRef,
}) {
  return (
    <aside
      ref={sidebarRef}
      className="sticky top-0 self-start overflow-hidden rounded-md border border-gray-200 bg-white"
    >
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#1F50AF]">
          Hub setup
        </div>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Jump to the section you want to edit.
        </p>
      </div>

      <nav className="space-y-1 p-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate?.(item.id)}
            className={[
              "group flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-background",
              activeSection === item.id ? "bg-background" : "",
            ].join(" ")}
          >
            <div
              className={[
                "h-1.5 w-1.5 shrink-0 rounded-full bg-current transition-colors group-hover:text-[#1F50AF]",
                activeSection === item.id ? "text-[#1F50AF]" : "text-gray-300",
              ].join(" ")}
            />

            <div className="min-w-0">
              <div
                className={[
                  "truncate font-medium group-hover:text-[#1F50AF]",
                  activeSection === item.id ? "text-[#1F50AF]" : "text-gray-900",
                ].join(" ")}
              >
                {item.title}
              </div>

              <div className="truncate text-xs text-gray-500">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
}
