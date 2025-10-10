// components/ui/Table.jsx
export function TableShell({ children, className = "" }) {
  return (
    <div className={`relative overflow-x-auto ${className}`}>
      {/* Horizontal scroll on small screens */}
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ children, className = "", ...props }) {
  return (
    <table
      className={`w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400" ${className}`}
      {...props}
    >
      {children}
    </table>
  );
}

export function Thead({ children, className = "", ...props }) {
  // z-20 keeps header above row content (logos, buttons, etc.)
  return (
    <thead
      className={`text-sm bg-background  text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function Th({ children, className = "", ...props }) {
  // Baseline padding; can be overridden per usage with className
  return (
    <th
      scope="col"
      className={`text-sm text-left font-normal px-6 py-3 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function Tr({ children, className = "", ...props }) {
  return (
    <tr
      className={`bg-white border-b border-gray-200 last:border-b-0 hover:bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = "", ...props }) {
  return (
    <td className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </td>
  );
}
