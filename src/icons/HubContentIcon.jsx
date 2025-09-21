const HubContentIcon = ({ className = "w-5 h-5", ...props }) => (
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
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M21 12l-9 5-9-5" />
    <path d="M21 16l-9 5-9-5" />
  </svg>
);
export default HubContentIcon;
