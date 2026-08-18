import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

/**
 * Holds the logged-in user's id/name/token in memory + localStorage
 * (localStorage is fine here — this is a real deployed app, not an
 * in-browser Claude artifact sandbox).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("hs_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("hs_user", JSON.stringify(user));
    else localStorage.removeItem("hs_user");
  }, [user]);

  // role = "user" (customer) or "worker" — determines which app the person sees
  const login = (userData, token, role) => setUser({ ...userData, token, role });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
