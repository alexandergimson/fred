// src/components/AnalyticsCard.jsx
import React from "react";

export default function AnalyticsCard({ label, value, icon, className = "" }) {
  return (
    <div
      className={`relative   p-4
      bg-background text-primary shadow-md               
      ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-md"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.04))",
          mixBlendMode: "normal",
        }}
      />

      <div className="relative flex items-center gap-4">
        {icon && (
          <div className="relative shrink-0">
            {/* icon puck */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-secondary shadow-inner">
              <span aria-hidden="true" className="text-white opacity-90">
                {icon}
              </span>
            </div>
          </div>
        )}

        {/* Texts */}
        <div className="min-w-0">
          <div className="text-[13px] leading-5">{label}</div>
          <div className="mt-0.5 text-[28px] leading-7 font-semibold tabular-nums">
            {value}
          </div>
        </div>
      </div>

      {/* faint corner sheen (kept from your version) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        aria-hidden="true"
        style={{
          WebkitMaskImage:
            "radial-gradient(220px 160px at 0% 0%, rgba(0,0,0,1) 20%, transparent 60%)",
          maskImage:
            "radial-gradient(220px 160px at 0% 0%, rgba(0,0,0,1) 20%, transparent 60%)",
        }}
      >
        <div className="absolute left-0 top-0 h-24 w-24 rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}
