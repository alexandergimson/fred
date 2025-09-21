const HubOverviewIcon = ({ className = "w-5 h-5", ...props }) => (
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
    <rect x="3" y="4" width="6" height="16" rx="2" />
    <rect x="10" y="4" width="4" height="16" rx="2" />
    <rect x="15" y="4" width="6" height="16" rx="2" />
  </svg>
);
export default HubOverviewIcon;
