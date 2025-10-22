// src/components/CtaButton.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function CtaButton({
  variant = "primary", // "primary" | "secondary"
  to, // internal route
  href, // external URL
  onClick, // button action
  icon,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}) {
  const base =
    // layout
    "inline-flex items-center justify-center gap-2 " +
    // sizing (match your CSS)
    "w-20 h-10 rounded-lg text-sm " +
    // transitions/transform
    "transform-gpu transition-all duration-[600ms] ease-out " +
    // cursor + disable
    "cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ";

  const variants = {
    primary:
      base +
      // colours + shadows
      "bg-primary text-white border border-transparent shadow-sm hover:shadow-md " +
      // hover states
      "hover:bg-background hover:text-primary hover:border-primary hover:-translate-y-[2px] " +
      // responsive widths (exactly as before)
      "sm:w-10 md:w-10 lg:w-40",
    secondary:
      base +
      // start on your secondary colour but flip to outlined on hover
      "bg-secondary text-white border border-transparent shadow-sm hover:shadow-md " +
      "hover:bg-background hover:text-primary hover:border-secondary hover:-translate-y-[2px] " +
      "sm:w-10 md:w-10 lg:w-40",
  };

  const classes = `${variants[variant]} ${className}`.trim();

  // External link (non-internal href)
  if (href && !href.startsWith("/")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...props}
      >
        {icon ?? null}
        <span className="hidden lg:inline">{children}</span>
      </a>
    );
  }

  // Internal link
  if (to || (href && href.startsWith("/"))) {
    const dest = to ?? href;
    return (
      <Link to={dest} className={classes} {...props}>
        {icon ?? null}
        <span className="hidden lg:inline">{children}</span>
      </Link>
    );
  }

  // Plain button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {icon ?? null}
      <span className="hidden lg:inline">{children}</span>
    </button>
  );
}
