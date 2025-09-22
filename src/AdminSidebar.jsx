// AdminSidebar.jsx
import { NavLink, useLocation, matchPath } from "react-router-dom";
import { useMemo } from "react";
import Logo from "./logo";
import SidebarUserFooter from "./SidebarUserFooter";
import HubsIcon from "./icons/HubsIcon";
import AnalyticsIcon from "./icons/AnalyticsIcon";
import HubOverviewIcon from "./icons/HubOverviewIcon";
import HubContentIcon from "./icons/HubContentIcon";

// logic to handle what items to show
function getItems(hubId) {
  if (!hubId) {
    return [
      { label: "Hubs", to: "/admin/hubs", icon: HubsIcon, exact: true },
      { label: "Analytics", to: "/admin/analytics", icon: AnalyticsIcon },
    ];
  }
  return [
    { label: "Hubs", to: "/admin/hubs", icon: HubsIcon, exact: true },
    {
      label: "Analytics",
      to: `/admin/hubs/${hubId}/analytics`,
      icon: AnalyticsIcon,
    },
    {
      label: "Hub Content",
      to: `/admin/hubs/${hubId}/content`,
      icon: HubContentIcon,
    },
    {
      label: "Hub Overview",
      to: `/admin/hubs/${hubId}/edit`,
      icon: HubOverviewIcon,
    },
  ];
}

const baseLinkClasses =
  "w-40 h-10 m-2 flex items-center gap-3 pl-3 rounded-lg text-base font-poppins transition-colors cursor-pointer";
const activeClasses = "bg-background text-primary shadow-sm";
const inactiveClasses =
  "text-textinactive hover:bg-buttonhover hover:text-primaryvariant";

function SidebarItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink
      to={to}
      end={!!exact} // exact match for items like /admin/hubs
      className={({ isActive }) =>
        `${baseLinkClasses} ${isActive ? activeClasses : inactiveClasses}`
      }
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

const AdminSidebar = () => {
  const { pathname } = useLocation();

  // Extract hubId via router-aware matching
  const hubId = useMemo(() => {
    const match = matchPath({ path: "/admin/hubs/:hubId/*" }, pathname);
    return match?.params?.hubId ?? null;
  }, [pathname]);

  const items = useMemo(() => getItems(hubId), [hubId]);

  return (
    <aside
      className="h-screen w-60 flex flex-col bg-white overflow-hidden"
      aria-label="Admin navigation"
    >
      {/* Top logo */}
      <div className="flex items-center justify-center mt-8 mb-8 shrink-0">
        <Logo className="w-40 h-8" />
      </div>

      {/* Divider */}
      <div
        className="flex items-center justify-center shrink-0"
        role="separator"
        aria-hidden="true"
      >
        <hr className="w-40 h-0.5 border-t-0 bg-gray-100" />
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto mt-8 scrollbar-thin">
        <ul className="flex flex-col items-center">
          {items.map(({ to, icon, label, exact }) => (
            <li key={to}>
              <SidebarItem to={to} icon={icon} label={label} exact={exact} />
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <SidebarUserFooter />
    </aside>
  );
};

export default AdminSidebar;
