export default function BrandedButton({ href, children, styles }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
      style={{
        backgroundColor: styles.brand,
        color: styles.buttonText,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = styles.brandHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = styles.brand;
      }}
    >
      {children}
    </a>
  );
}
