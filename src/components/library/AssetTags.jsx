export default function AssetTags({ asset, className = "" }) {
  if (!Array.isArray(asset.tags) || asset.tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {asset.tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="text-[11px] px-2.5 py-1 rounded-full border border-[#E6EAF0] bg-[#FCFCFD] text-[#475467]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
