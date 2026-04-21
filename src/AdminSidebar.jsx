import { NavLink, useLocation, matchPath } from "react-router-dom";
import { useMemo } from "react";
import Logo from "./logo";
import SidebarUserFooter from "./SidebarUserFooter";
import HubsIcon from "./icons/HubsIcon";
import AnalyticsIcon from "./icons/AnalyticsIcon";
import HubOverviewIcon from "./icons/HubOverviewIcon";
import AddContent from "./icons/AddContent";
import HubDesignIcon from "./icons/HubDesignIcon";

// Reusing AddContent icon for library until a dedicated library icon exists
const LibraryIcon = AddContent;

function getItems(hubId) {
  if (!hubId) {
    return [
      { label: "Hubs", to: "/admin/hubs", icon: HubsIcon, exact: true },
      {
        label: "Content Library",
        to: "/admin/library",
        icon: LibraryIcon,
        exact: true,
      },
      {
        label: "Analytics",
        to: "/admin/analytics",
        icon: AnalyticsIcon,
        exact: true,
      },
    ];
  }

  return [
    { label: "Hubs", to: "/admin/hubs", icon: HubsIcon, exact: true },
    {
      label: "Content Library",
      to: "/admin/library",
      icon: LibraryIcon,
      exact: true,
    },
    {
      label: "Analytics",
      to: `/admin/analytics`,
      icon: AnalyticsIcon,
      exact: true,
    },
    { type: "separator", key: "hub-section" },
    {
      label: "Hub Details",
      to: `/admin/hubs/${hubId}/edit`,
      icon: HubOverviewIcon,
    },
    {
      label: "Hub Content",
      to: `/admin/hubs/${hubId}/items`,
      icon: AddContent,
    },
    {
      label: "Hub Design",
      to: `/admin/hubs/${hubId}/design`,
      icon: HubDesignIcon,
    },
    {
      label: "Hub Analytics",
      to: `/admin/analytics/hubs/${hubId}`,
      icon: AnalyticsIcon,
    },
  ];
}

const baseLinkClasses =
  "w-40 h-10 m-2 flex items-center gap-3 pl-3 rounded-lg text-sm font-poppins transition-colors cursor-pointer";
const activeClasses = "bg-background text-primary shadow-sm";
const inactiveClasses =
  "text-textinactive hover:bg-buttonhover hover:text-primaryvariant";

function SidebarItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink
      to={to}
      end={!!exact}
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

  const hubId = useMemo(() => {
    const match = [
      matchPath({ path: "/admin/hubs/:hubId/*" }, pathname),
      matchPath({ path: "/admin/analytics/hubs/:hubId" }, pathname),
    ].find((m) => m !== null);

    return match?.params?.hubId ?? null;
  }, [pathname]);

  const items = useMemo(() => getItems(hubId), [hubId]);

  return (
    <aside
      className="h-screen w-60 flex flex-col bg-white overflow-hidden"
      aria-label="Admin navigation"
    >
      <div className="flex items-center justify-center mt-8 mb-8 shrink-0">
        <Logo className="w-40 h-8" />
      </div>

      <div
        className="flex items-center justify-center shrink-0"
        role="separator"
        aria-hidden="true"
      >
        <hr className="w-40 h-0.5 border-t-0 bg-gray-100" />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto mt-8 scrollbar-thin">
        <ul className="flex flex-col items-center">
          {items.map((item) => {
            if (item.type === "separator") {
              return (
                <li
                  key={item.key || "separator"}
                  aria-hidden="true"
                  className="my-8"
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    role="separator"
                    aria-hidden="true"
                  >
                    <hr className="w-40 h-0.5 border-t-0 bg-gray-100" />
                  </div>
                </li>
              );
            }

            const { to, icon, label, exact } = item;
            return (
              <li key={to}>
                <SidebarItem to={to} icon={icon} label={label} exact={exact} />
              </li>
            );
          })}
        </ul>
      </nav>

      <SidebarUserFooter />
    </aside>
  );
};

export default AdminSidebar;
