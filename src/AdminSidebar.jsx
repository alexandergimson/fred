// AdminSidebar.jsx
import { Link, useLocation } from "react-router-dom";
import Logo from "./logo";
import SidebarUserFooter from "./SidebarUserFooter";

import HubsIcon from "./icons/HubsIcon";
import AnalyticsIcon from "./icons/AnalyticsIcon";
import HubOverviewIcon from "./icons/HubOverviewIcon";
import HubContentIcon from "./icons/HubContentIcon";

const globalItems = [
  { label: "Hubs", to: "/admin/hubs", icon: HubsIcon },
  { label: "Analytics", to: "/admin/analytics", icon: AnalyticsIcon },
];

const AdminSidebar = () => {
  const { pathname } = useLocation();

  // Detect hub context and extract hubId
  const hubMatch = pathname.match(/^\/admin\/hubs\/([^/]+)(?:\/.*)?$/);
  const hubId = hubMatch ? hubMatch[1] : null;

  const hubItems = hubId
    ? [
        { label: "Hubs", to: "/admin/hubs", icon: HubsIcon },
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
      ]
    : null;

  const itemsToRender = hubItems || globalItems;

  return (
    <aside className="h-screen w-60 flex flex-col bg-white overflow-hidden">
      {/* Top logo */}
      <div className="flex items-center justify-center mt-8 mb-8 shrink-0">
        <Logo className="w-40 h-8" />
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center shrink-0">
        <hr className="w-40 h-0.5 border-t-0 bg-gray-100" />
      </div>

      {/* Nav */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-8 scrollbar-thin">
        <nav className="flex flex-col items-center">
          {itemsToRender.map((item) => {
            const isActive =
              item.to === "/admin/hubs"
                ? pathname === "/admin/hubs"
                : pathname.startsWith(item.to);

            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`w-40 h-10 m-2 flex items-center gap-3 pl-3 rounded-lg text-base font-poppins transition-colors cursor-pointer
                  ${
                    isActive
                      ? "bg-background text-primary shadow-sm"
                      : "text-textinactive hover:bg-buttonhover hover:text-primaryvariant"
                  }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User footer */}
      <SidebarUserFooter />
    </aside>
  );
};

export default AdminSidebar;
