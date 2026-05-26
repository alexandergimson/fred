export function AdminPage({ children }) {
  return (
    <main className="flex h-screen flex-1 flex-col overflow-hidden bg-[#F4F7FE]">
      {children}
    </main>
  );
}

export function AdminPageHeader({ children }) {
  return <div className="shrink-0 px-6 pt-2">{children}</div>;
}

export function AdminPageContent({ children, className = "", scrollRef }) {
  return (
    <div
      ref={scrollRef}
      className={[
        "min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function AdminLoadingState({ children = "Loading…" }) {
  return (
    <main className="flex h-screen flex-1 items-center justify-center overflow-hidden bg-[#F4F7FE]">
      <div className="text-sm text-gray-500">{children}</div>
    </main>
  );
}
