import { ArrowRight, Sparkles } from "lucide-react";

export default function PremiumButton({
  children,
  styles = {},
  onClick,
  href,
  type = "button",
  icon = "arrow",
  className = "",
}) {
  const content = (
    <>
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute inset-y-0 -left-1/2 w-1/2 rotate-12 bg-white/25 blur-xl transition-transform duration-700 group-hover:translate-x-[260%]" />
      </span>

      <span className="relative z-10 flex items-center gap-2">
        <span>{children}</span>
      </span>
    </>
  );

  const sharedProps = {
    className: [
      "group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-xl px-5 text-sm font-semibold transition-all duration-300 ease-out hover:-translate-y-[1px] active:translate-y-[1px] cursor-pointer",
      className,
    ].join(" "),
    style: {
      background: styles.buttonGradient || styles.brand || "#1F50AF",
      color: styles.buttonText || "#FFFFFF",
      boxShadow:
        styles.buttonShadow || `0 12px 30px ${styles.brand || "#1F50AF"}40`,
    },
  };

  if (href) {
    return (
      <a href={href} {...sharedProps}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} {...sharedProps}>
      {content}
    </button>
  );
}
