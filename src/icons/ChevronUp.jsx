// src/icons/ChevronUp.jsx
const ChevronUp = ({ className = "w-6 h-6", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    {/* Heroicons-style chevron-up */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 15.75 12 8.25l7.5 7.5"
    />
  </svg>
);
export default ChevronUp;
