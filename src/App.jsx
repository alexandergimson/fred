// App.jsx
import "./App.css";
import "./index.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import ProspectLayout from "./ProspectLayout";
import HubScreenLayout from "./HubScreenLayout";
import HubsScreen from "./HubsScreen";
import CreateHubScreen from "./CreateHubScreen";
import EditHubScreen from "./EditHubScreen";
import AuthProvider from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";
import SignIn from "./auth/SignIn";
import HubContentScreen from "./HubContentScreen";
import CreateContentScreen from "./CreateContentScreen";
import EditContentScreen from "./EditContentScreen";
import ProfileScreen from "./UserProfileScreen";
import HubDesign from "./HubDesign";
import AnalyticsScreen from "./AnalyticsScreen";
import HubAnalyticsScreen from "./HubAnalyticsScreen";

/** 1) Central, static titles */
const TITLES = {
  "/signin": "Sign in | Fred",
  "/prospect/:hubId": "Prospect hub | Fred",
  "/admin": "Admin | Fred",
  "/admin/hubs": "Hubs | Fred",
  "/admin/hubs/new": "Create Hub | Fred",
  "/admin/profile": "Profile | Fred",
  "/admin/hubs/:hubId/edit": "Edit Details | Fred",
  "/admin/hubs/:hubId/design": "Edit Design | Fred",
  "/admin/hubs/:hubId/content": "Content | Fred",
  "/admin/hubs/:hubId/content/new": "New Content | Fred",
  "/admin/hubs/:hubId/content/:contentId/edit": "Edit Content | Fred",
  "/admin/analytics": "Analytics | Fred",
  "/admin/analytics/hubs/:hubId": "Hub Analytics | Fred",
};

/** 2) Minimal normaliser to map dynamic paths to the keys above */
function useStaticTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Normalise dynamic segments to our map keys
    let key = pathname;

    key = key.replace(
      /^\/admin\/hubs\/[^/]+\/content\/[^/]+\/edit$/,
      "/admin/hubs/:hubId/content/:contentId/edit"
    );
    key = key.replace(
      /^\/admin\/hubs\/[^/]+\/content\/new$/,
      "/admin/hubs/:hubId/content/new"
    );
    key = key.replace(
      /^\/admin\/hubs\/[^/]+\/content$/,
      "/admin/hubs/:hubId/content"
    );
    key = key.replace(
      /^\/admin\/hubs\/[^/]+\/design$/,
      "/admin/hubs/:hubId/design"
    );
    key = key.replace(
      /^\/admin\/hubs\/[^/]+\/edit$/,
      "/admin/hubs/:hubId/edit"
    );
    key = key.replace(/^\/prospect\/[^/]+$/, "/prospect/:hubId");

    key = key.replace(
      /^\/admin\/analytics\/hubs\/[^/]+$/,
      "/admin/analytics/hubs/:hubId"
    );

    // Fallbacks for parent/admin index
    if (key === "/admin/" || key === "/admin") key = "/admin";

    document.title = TITLES[key] || "Fred";
  }, [pathname]);
}

function App() {
  /** 3) Set the title for every route change, statically */
  const TitleSetter = () => {
    useStaticTitle();
    return null;
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <TitleSetter />
        <Routes>
          <Route path="/signin" element={<SignIn />} />

          {/* Prospect-facing hub */}
          <Route path="/prospect/:hubId" element={<ProspectLayout />} />

          {/* Admin (protected) */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <HubScreenLayout />
              </RequireAuth>
            }
          >
            {/* Admin index */}
            <Route index element={<Navigate to="hubs" replace />} />
            {/* Global admin pages */}
            <Route path="hubs" element={<HubsScreen />} />
            <Route path="analytics" element={<AnalyticsScreen />} />
            <Route
              path="analytics/hubs/:hubId"
              element={<HubAnalyticsScreen />}
            />

            <Route path="hubs/new" element={<CreateHubScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="hubs/:hubId/edit" element={<EditHubScreen />} />
            <Route path="hubs/:hubId/design" element={<HubDesign />} />
            <Route path="hubs/:hubId/content" element={<HubContentScreen />} />
            <Route
              path="hubs/:hubId/content/new"
              element={<CreateContentScreen />}
            />
            <Route
              path="hubs/:hubId/content/:contentId/edit"
              element={<EditContentScreen />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/admin/hubs" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
