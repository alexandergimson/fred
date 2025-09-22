// App.jsx
import "./App.css";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import ProfileScreen from "./ProfileScreen";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="hubs/new" element={<CreateHubScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="hubs/:hubId/edit" element={<EditHubScreen />} />
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
