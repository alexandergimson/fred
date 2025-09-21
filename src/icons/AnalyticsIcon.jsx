const AnalyticsIcon = ({ className = "w-5 h-5", ...props }) => (
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
    <path d="M3 19.5V4.5" />
    <path d="M3 19.5H21" />
    <path d="M6 16l4-5 4 4 6-7" />
  </svg>
);
export default AnalyticsIcon;
