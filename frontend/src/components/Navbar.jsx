import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Top navbar. Pass `title` and optionally `showBack` to render a back button
 * (used on every screen except Home).
 */
export default function Navbar({ title, showBack = false, transparent = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWorker = user?.role === "worker";

  return (
    <div className={`navbar ${transparent ? "transparent" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {showBack ? (
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            ←
          </button>
        ) : (
          <span className="brand" style={{ fontSize: "1.3rem", fontWeight: "bold" }}>🛠️ Sahayak</span>
        )}
        {showBack && <span className="brand" style={{ fontSize: "1.2rem", fontWeight: "600" }}>{title}</span>}
      </div>

      <div className="desktop-nav-links">
        {isWorker ? (
          <>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
            <NavLink to="/worker" end className={({ isActive }) => (isActive ? "active" : "")}>Requests</NavLink>
            <NavLink to="/bookings" end className={({ isActive }) => (isActive ? "active" : "")}>Bookings</NavLink>
            <NavLink to="/worker/profile" end className={({ isActive }) => (isActive ? "active" : "")}>Profile</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
            <NavLink to="/bookings" end className={({ isActive }) => (isActive ? "active" : "")}>Bookings</NavLink>
            <NavLink to="/profile" end className={({ isActive }) => (isActive ? "active" : "")}>Profile</NavLink>
          </>
        )}
      </div>

      {!showBack && <div style={{ width: 44, display: "none" /* spacer for centering if needed on mobile */ }} className="mobile-only" />}
    </div>
  );
}
