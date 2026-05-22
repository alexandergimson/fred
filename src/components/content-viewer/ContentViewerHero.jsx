import { getThumb } from "../hub-experience/utils";

export default function ContentViewerHero({
  asset,
  hubTitle,
  contentTypeLabel,
  onStart,
}) {
  const thumb = getThumb(asset);

  const description =
    asset?.description ||
    "Explore this curated resource to understand the opportunity, evaluate next steps, and move faster.";

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0B1020]" />

      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1020]/20 to-[#0B1020]" />
    </section>
  );
}
