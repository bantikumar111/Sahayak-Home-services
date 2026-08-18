import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getWorkerUnreadCounts } from "../services/api";

export default function WorkerBottomNav() {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    const checkUnread = () => {
      getWorkerUnreadCounts(user._id)
        .then((res) => {
          const hasAny = res.data && res.data.length > 0 && res.data.some((item) => item.count > 0);
          setHasUnread(hasAny);
        })
        .catch(() => setHasUnread(false));
    };
    checkUnread();
    const interval = setInterval(checkUnread, 5000);
    return () => clearInterval(interval);
  }, [user?._id]);

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
        <span className="nav-icon">🏠</span>
        Home
      </NavLink>
      <NavLink to="/worker" end className={({ isActive }) => (isActive ? "active" : "")}>
        <span className="nav-icon">📋</span>
        Requests
      </NavLink>
      <NavLink to="/bookings" className={({ isActive }) => (isActive ? "active" : "")} style={{ position: "relative" }}>
        <span className="nav-icon">💬</span>
        Messages
        {hasUnread && <span className="nav-notification-dot" />}
      </NavLink>
      <NavLink to="/bookings" className={({ isActive }) => (isActive ? "active" : "")}>
        <span className="nav-icon">👤</span>
        Profile
      </NavLink>
    </nav>
  );
}
