import Header from "./prospect_main_header";

const ContentLayout = ({
  hubTitle,
  contentName,
  children,
  controls,
  rightSlot,
  style,
}) => {
  return (
    <main className="flex-1 flex flex-col h-screen" style={style}>
      <Header
        hubTitle={hubTitle}
        contentName={contentName}
        rightSlot={rightSlot}
      />
      <section className="flex-1 min-h-0 flex flex-col mt-8 px-6">
        <div className="flex-1 min-h-0 rounded-lg">
          <div className="h-full min-h-0">
            <div className="h-full min-h-0 rounded-lg overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </section>
      <div className="shrink-0 w-full flex justify-center pb-4">{controls}</div>
    </main>
  );
};

export default ContentLayout;
