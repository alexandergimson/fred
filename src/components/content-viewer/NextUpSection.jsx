import { getAssetType, getThumb } from "../hub-experience/utils";

export default function NextUpSection({ items = [], onOpen }) {
  if (!items.length) return null;

  return (
    <section className="mt-12 border-t border-white/10 pt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
            Continue exploring
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
            Next up
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const asset = item.asset || item;
          const thumb = getThumb(asset);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen?.(item)}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              <div className="h-36 overflow-hidden bg-white/10">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={asset?.name || "Content"}
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/40">
                    {getAssetType(asset)}
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                  {getAssetType(asset)}
                </div>

                <div className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-white">
                  {asset?.name || "Untitled"}
                </div>

                {asset?.description ? (
                  <div className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                    {asset.description}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
