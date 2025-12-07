// src/components/ActionButton.jsx
import React from "react";

/**
 * Icon-first action button for row/card controls.
 *
 * Props:
 * - intent: "default" | "danger"    (colours/hover)
 * - confirm: boolean                 (expanded confirm style)
 * - label: string                    (text when confirm=true, defaults "Confirm?")
 * - title: string                    (tooltip + aria-label)
 * - size: "sm" | "md"                (button size)
 * - stopPropagation: boolean         (default true; stops row click)
 */
export default function ActionButton({
  intent = "default",
  confirm = false,
  label = "Confirm?",
  title,
  onClick,
  disabled = false,
  className = "",
  size = "md",
  stopPropagation = true,
  children,
  ...props
}) {
  // Base (mirrors .UserIconBtn)
  const base =
    "inline-flex items-center justify-center rounded-full shrink-0 cursor-pointer " +
    "ring-1 ring-black/5 shadow-sm " +
    "transform-gpu transition-[width,background-color,color,border-color,box-shadow,transform] " +
    "duration-[600ms] ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 " +
    "hover:-translate-y-[2px] " +
    "bg-background text-gray-700 ";

  const sizes = {
    sm: "h-8 w-8 text-[13px]",
    md: "h-8 w-8 text-sm",
  };

  // Intent styles (hover behaviours)
  const intents = {
    default: "hover:bg-primary hover:text-white",
    danger: "hover:bg-danger hover:text-white",
  };

  // Expanded confirm style (mirrors .UserDanger + wider pill)
  const expanded = confirm
    ? "w-28 px-4 bg-danger text-white shadow-md hover:shadow-lg focus-visible:ring-red-500/40"
    : "";

  // Ensure child SVGs default to 16px like your CSS rule:
  // .UserIconBtn svg { @apply w-4 h-4; }
  const svgDefaults = "[&>svg]:w-4 [&>svg]:h-4";

  const classes = [base, sizes[size], intents[intent], expanded, className]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e) => {
    if (stopPropagation) e.stopPropagation();
    onClick?.(e);
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-expanded={confirm || undefined}
      onClick={handleClick}
      disabled={disabled}
      className={`${classes} ${svgDefaults}`}
      {...props}
    >
      {confirm ? <span className="font-medium">{label}</span> : children}
    </button>
  );
}
