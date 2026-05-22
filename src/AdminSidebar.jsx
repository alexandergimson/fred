import { NavLink, useLocation, matchPath } from "react-router-dom";
import { useMemo } from "react";
import Logo from "./logo";
import SidebarUserFooter from "./SidebarUserFooter";
import HubsIcon from "./icons/HubsIcon";
import AnalyticsIcon from "./icons/AnalyticsIcon";
import HubOverviewIcon from "./icons/HubOverviewIcon";
import AddContent from "./icons/AddContent";
import HubDesignIcon from "./icons/HubDesignIcon";

const LibraryIcon = AddContent;

function getItems(hubId) {
  const baseItems = [
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

  if (!hubId) return baseItems;

  return [
    ...baseItems,
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
      label: "Hub Analytics",
      to: `/admin/analytics/hubs/${hubId}`,
      icon: AnalyticsIcon,
    },
  ];
}

const baseLinkClasses =
  "w-44 h-9 mx-2 my-1 flex items-center gap-2.5 px-3 rounded-md text-sm font-poppins transition-colors cursor-pointer";

const activeClasses = "bg-[#EEF3FF] text-[#1F50AF] shadow-none";

const inactiveClasses =
  "text-[#8A8FA3] hover:bg-[#F5F7FB] hover:text-[#1F50AF]";

function SidebarItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink
      to={to}
      end={!!exact}
      className={({ isActive }) =>
        `${baseLinkClasses} ${isActive ? activeClasses : inactiveClasses}`
      }
    >
      {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function AdminSidebar() {
  const { pathname } = useLocation();

  const hubId = useMemo(() => {
    const match = [
      matchPath({ path: "/admin/hubs/:hubId/*" }, pathname),
      matchPath({ path: "/admin/analytics/hubs/:hubId" }, pathname),
    ].find(Boolean);

    return match?.params?.hubId ?? null;
  }, [pathname]);

  const items = useMemo(() => getItems(hubId), [hubId]);

  return (
    <aside
      className="h-screen w-52 flex flex-col bg-white overflow-hidden"
      aria-label="Admin navigation"
    >
      <div className="flex items-center justify-center mt-6 mb-6 shrink-0">
        <Logo className="w-36 h-8" />
      </div>

      <div
        className="flex items-center justify-center shrink-0"
        role="separator"
        aria-hidden="true"
      >
        <hr className="w-44 h-px border-t-0 bg-gray-100" />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto mt-5 scrollbar-thin">
        <ul className="flex flex-col items-center">
          {items.map((item) => {
            if (item.type === "separator") {
              return (
                <li
                  key={item.key || "separator"}
                  aria-hidden="true"
                  className="my-5"
                >
                  <hr className="w-44 h-px border-t-0 bg-gray-100" />
                </li>
              );
            }

            return (
              <li key={item.to}>
                <SidebarItem
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  exact={item.exact}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      <SidebarUserFooter />
    </aside>
  );
}
