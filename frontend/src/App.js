import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Home from "./pages/Home";
import WorkerList from "./pages/WorkerList";
import Booking from "./pages/Booking";
import Chat from "./pages/Chat";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import WorkerDashboard from "./pages/WorkerDashboard";
import WorkerChat from "./pages/WorkerChat";
import WorkerProfile from "./pages/WorkerProfile";
import PublicProfile from "./pages/PublicProfile";

// Gate a route to a logged-in user with a specific role.
// - not logged in           -> /login
// - logged in, wrong role   -> their own home ("/" for customer, "/worker" for worker)
// - logged in, right role   -> render the page
function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Allow workers to access user routes
  if (role === "user" && user.role !== "user" && user.role !== "worker") return <Navigate to="/" replace />;
  if (role === "worker" && user.role !== "worker") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Customer side */}
      <Route path="/" element={<RequireRole role="user"><Home /></RequireRole>} />
      <Route path="/workers/:service" element={<RequireRole role="user"><WorkerList /></RequireRole>} />
      <Route path="/booking/:workerId" element={<RequireRole role="user"><Booking /></RequireRole>} />
      <Route path="/chat/:workerId" element={<RequireRole role="user"><Chat /></RequireRole>} />
      <Route path="/bookings" element={<RequireRole role="user"><Bookings /></RequireRole>} />
      <Route path="/profile" element={<RequireRole role="user"><Profile /></RequireRole>} />

      {/* Worker side */}
      <Route path="/worker" element={<RequireRole role="worker"><WorkerDashboard /></RequireRole>} />
      <Route path="/worker/chat/:userId" element={<RequireRole role="worker"><WorkerChat /></RequireRole>} />
      <Route path="/worker/profile" element={<RequireRole role="worker"><WorkerProfile /></RequireRole>} />

      {/* Public Profile */}
      <Route path="/public/:role/:id" element={<PublicProfile />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
