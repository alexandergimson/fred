// HubScreenHeader.jsx
import { Link } from "react-router-dom";

export default function HubScreenHeader({ title, action, className = "" }) {
  const baseBtn = "UserPrimaryCta";

  return (
    <header
      className={`py-4 ml-8 mr-8 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-xl font-semibold tracking-wide uppercase text-[#1F50AF] font-display">
          {title}
        </span>
      </div>

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
    </header>
  );
}
