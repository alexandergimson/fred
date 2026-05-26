export default function ContentViewerLayout({
  header,
  hero,
  toolbar,
  content,
  sidebar,
}) {
  return (
    <div className="min-h-screen text-white">
      {header}
      {toolbar}

      <main>
        {hero}

        <div className="mx-auto flex max-w-[1600px] gap-8">
          <div className="min-w-0 flex-1">{content}</div>

          {sidebar ? (
            <aside className="hidden w-[320px] xl:block">
              <div className="sticky top-24">{sidebar}</div>
            </aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}
