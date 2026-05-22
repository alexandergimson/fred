import "./App.css";
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
import ProfileScreen from "./UserProfileScreen";
import AnalyticsScreen from "./AnalyticsScreen";
import HubAnalyticsScreen from "./HubAnalyticsScreen";
import LibraryScreen from "./LibraryScreen";
import CreateAssetScreen from "./CreateAssetScreen";
import EditAssetScreen from "./EditAssetScreen";
import HubItemsScreen from "./HubItemsScreen";
import HubBuilder from "./HubBuilder";
import ProspectLayoutV2 from "./ProspectLayoutV2";

const TITLES = {
  "/signin": "Sign in | Fred",
  "/prospect/:hubId": "Prospect hub | Fred",
  "/admin": "Admin | Fred",
  "/admin/hubs": "Hubs | Fred",
  "/admin/hubs/new": "Create Hub | Fred",
  "/admin/profile": "Profile | Fred",
  "/admin/hubs/:hubId/edit": "Edit Details | Fred",
  "/admin/hubs/:hubId/design": "Edit Design | Fred",
  "/admin/hubs/:hubId/items": "Hub Content | Fred",
  "/admin/hubs/:hubId/builder": "Hub Builder | Fred",
  "/admin/analytics": "Analytics | Fred",
  "/admin/analytics/hubs/:hubId": "Hub Analytics | Fred",
  "/admin/library": "Content Library | Fred",
  "/admin/library/new": "Upload Content | Fred",
  "/admin/library/:assetId": "Edit Asset | Fred",
  "/prospect-v2/:hubId": "Prospect hub preview | Fred",
};

function useStaticTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    let key = pathname;

    key = key.replace(
      /^\/admin\/hubs\/[^/]+\/builder$/,
      "/admin/hubs/:hubId/builder",
    );
    key = key.replace(
      /^\/admin\/hubs\/[^/]+\/items$/,
      "/admin/hubs/:hubId/items",
    );

    key = key.replace(
      /^\/admin\/hubs\/[^/]+\/edit$/,
      "/admin/hubs/:hubId/edit",
    );
    key = key.replace(
      /^\/admin\/analytics\/hubs\/[^/]+$/,
      "/admin/analytics/hubs/:hubId",
    );
    key = key.replace(/^\/admin\/library\/new$/, "/admin/library/new");
    key = key.replace(/^\/admin\/library\/[^/]+$/, "/admin/library/:assetId");
    key = key.replace(/^\/admin\/library$/, "/admin/library");
    key = key.replace(/^\/prospect\/[^/]+$/, "/prospect/:hubId");
    key = key.replace(/^\/prospect-v2\/[^/]+$/, "/prospect-v2/:hubId");

    if (key === "/admin/" || key === "/admin") key = "/admin";

    document.title = TITLES[key] || "Fred";
  }, [pathname]);
}

function App() {
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
          <Route path="/prospect/:hubId" element={<ProspectLayoutV2 />} />

          <Route
            path="/admin/hubs/:hubId/builder"
            element={
              <RequireAuth>
                <HubBuilder />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <HubScreenLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="hubs" replace />} />

            <Route path="hubs" element={<HubsScreen />} />
            <Route path="hubs/new" element={<CreateHubScreen />} />
            <Route path="hubs/:hubId/edit" element={<EditHubScreen />} />
            <Route path="hubs/:hubId/items" element={<HubItemsScreen />} />

            <Route path="library" element={<LibraryScreen />} />
            <Route path="library/new" element={<CreateAssetScreen />} />
            <Route path="library/:assetId" element={<EditAssetScreen />} />

            <Route path="analytics" element={<AnalyticsScreen />} />
            <Route
              path="analytics/hubs/:hubId"
              element={<HubAnalyticsScreen />}
            />

            <Route path="profile" element={<ProfileScreen />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin/hubs" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
