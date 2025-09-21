// prospect_main_header.jsx
const Header = ({ hubTitle, contentName, rightSlot, cta }) => {
  const ctaNode =
    rightSlot ??
    (cta?.href ? (
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-40 h-10 inline-flex items-center justify-center rounded-lg text-base no-underline cursor-pointer transition-opacity hover:opacity-90"
        style={{
          background: "var(--pv-btn-bg)",
          color: "var(--pv-btn-text)",
        }}
      >
        {cta.label ?? "Contact Us"}
      </a>
    ) : null);

  return (
    <header
      className="px-6 flex items-center justify-between"
      style={{
        background: "var(--pv-header-bg)",
        color: "var(--pv-header-text)",
        height: "var(--pv-header-height)", // ← matches logo strip
      }}
    >
      <div className="flex h-full items-center gap-4">
        <span className="text-xl font-semibold tracking-wide uppercase leading-none">
          {hubTitle}
        </span>
        <span
          className="h-5 w-px mx-1"
          style={{ background: "currentColor", opacity: 0.2 }}
        />
        <span className="text-xl leading-none" style={{ opacity: 0.8 }}>
          {contentName}
        </span>
      </div>

      {ctaNode ? (
        <div className="flex h-full items-center">{ctaNode}</div>
      ) : null}
    </header>
  );
};

export default Header;
