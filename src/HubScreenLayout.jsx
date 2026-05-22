// HubScreenLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function HubScreenLayout() {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
