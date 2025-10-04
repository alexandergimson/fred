// HubScreenHeader.jsx
import { Link } from "react-router-dom";
import PreviewIcon from "./icons/PreviewIcon";

export default function HubScreenHeader({
  title,
  action, // { label, to?, onClick?, icon?, disabled? }
  secondaryAction, // { label?, href }  <-- NEW
  className = "",
}) {
  const baseBtn = "UserPrimaryCta";
  const secondaryBtn = "UserSecondaryCta";

  return (
    <header
      className={`py-4 ml-8 mr-8 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-xl font-semibold tracking-wide uppercase text-[#1F50AF] font-display">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Secondary action: Preview */}
        {secondaryAction?.href && (
          <a
            href={secondaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${secondaryBtn} shrink-0 w-auto px-3`}
            title={secondaryAction.label || "Preview"}
          >
            <PreviewIcon className="w-5 h-5" />
            <span>{secondaryAction.label || "Preview"}</span>
          </a>
        )}

        {/* Primary action (unchanged) */}
        {action ? (
          action.to ? (
            <Link to={action.to} className="shrink-0">
              <button className={baseBtn} disabled={action.disabled}>
                {action.icon ? action.icon : null}
                {action.label}
              </button>
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action?.disabled}
              className={baseBtn + " shrink-0"}
            >
              {action.icon ? action.icon : null}
              {action.label}
            </button>
          )
        ) : (
          <div /> // keeps spacing if no action
        )}
      </div>
    </header>
  );
}
