export default function AssetTileGrid({ children }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
    >
      {children}
    </div>
  );
}
