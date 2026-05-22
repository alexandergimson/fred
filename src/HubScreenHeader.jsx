// HubScreenHeader.jsx
import PreviewIcon from "./icons/PreviewIcon";
import CtaButton from "./components/CtaButton";

const isInternal = (url) => typeof url === "string" && url.startsWith("/");

export default function HubScreenHeader({
  title,
  action,
  secondaryAction,
  className = "",
}) {
  return (
    <header className={`py-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        <span className="text-xl font-semibold tracking-wide uppercase text-[#1F50AF] font-display">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Secondary CTA (Preview) */}
        {secondaryAction?.href && (
          <CtaButton
            variant="secondary"
            {...(isInternal(secondaryAction.href)
              ? { to: secondaryAction.href }
              : { href: secondaryAction.href })}
            aria-label={secondaryAction.label || "Preview"}
            className="shrink-0"
            icon={<PreviewIcon className="w-5 h-5" />}
            title={secondaryAction.label || "Preview"}
          >
            <span className="hidden lg:inline">
              {secondaryAction.label || "Preview"}
            </span>
          </CtaButton>
        )}

        {/* Primary CTA (Action) */}
        {action ? (
          action.to ? (
            <CtaButton
              variant="primary"
              to={action.to}
              disabled={action.disabled}
              className="shrink-0"
              icon={action.icon}
              aria-label={action.label}
              title={action.label}
            >
              <span className="hidden lg:inline">{action.label}</span>
            </CtaButton>
          ) : (
            <CtaButton
              variant="primary"
              onClick={action.onClick}
              disabled={action?.disabled}
              className="shrink-0"
              icon={action.icon}
              aria-label={action.label}
              title={action.label}
            >
              <span className="hidden lg:inline">{action.label}</span>
            </CtaButton>
          )
        ) : (
          <div />
        )}
      </div>
    </header>
  );
}
