const HubDesignIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Artboard */}
    <rect x="4" y="4" width="16" height="16" rx="3" />
    {/* Diagonal designer tool (ruler/pencil line) */}
    <path d="M8 16l8-8" />
    {/* Ticks along the tool to imply measurement/design */}
    <path d="M14 10l1 1" />
    <path d="M12 12l1 1" />
    <path d="M10 14l1 1" />
  </svg>
);

export default HubDesignIcon;
