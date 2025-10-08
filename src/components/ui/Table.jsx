export function TableShell({ children, className = "" }) {
  return (
    <div className={`rounded-t-lg rounded-b-none overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function Table({ children, className = "", ...props }) {
  return (
    <table className={`w-full text-sm table-fixed ${className}`} {...props}>
      {children}
    </table>
  );
}

export function Thead({ children, className = "", ...props }) {
  return (
    <thead
      className={`sticky top-0 bg-background text-sm text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function Th({ children, className = "", ...props }) {
  return (
    <th className={`text-left px-6 py-4 font-normal ${className}`} {...props}>
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
