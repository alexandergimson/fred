export default function EmptySlot({ label, onClick, styles }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white/70 p-5 text-center transition-all hover:bg-white hover:shadow-sm"
      style={{ borderColor: "#D1D5DB" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = styles.brand;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#D1D5DB";
      }}
    >
      <div
        className="grid h-11 w-11 place-items-center rounded-full text-xl transition-transform group-hover:scale-105"
        style={{
          backgroundColor: `${styles.brand}14`,
          color: styles.brand,
        }}
      >
        +
      </div>

      <div className="mt-4 text-sm font-semibold text-gray-900">{label}</div>
      <div className="mt-1 text-sm text-gray-500">
        Choose from your content library
      </div>
    </button>
  );
}
