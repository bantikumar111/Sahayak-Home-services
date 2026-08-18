import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import ServiceCard from "../components/ServiceCard";
import WorkerCard from "../components/WorkerCard";
import SearchBar from "../components/SearchBar";
import { getServices, getWorkers } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useGeolocation from "../hooks/useGeolocation";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status } = useGeolocation();
  const [categories, setCategories] = useState([]);
  const [recommendedWorkers, setRecommendedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getServices(),
      getWorkers("", 0, 0, 100, 4) // Fetch some highly-rated workers globally
    ])
      .then(([servicesRes, workersRes]) => {
        setCategories(servicesRes.data);
        setRecommendedWorkers(workersRes.data.slice(0, 5)); // Limit to top 5
      })
      .catch((err) => console.error("Failed to load home data", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="screen">
        <div className="container" style={{ padding: "24px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                className="avatar"
                style={{
                  width: 48, height: 48, fontSize: "1rem", cursor: "pointer",
                  backgroundImage: user?.avatar ? `url(http://localhost:8000${user.avatar})` : "none",
                  backgroundSize: "cover", backgroundPosition: "center"
                }}
                onClick={() => {
                  if (user?.role === "worker") navigate("/worker/profile");
                  else navigate("/profile");
                }}
              >
                {!user?.avatar && (user?.name?.substring(0, 2).toUpperCase() || "U")}
              </div>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600" }}>Hello, {user?.name?.split(" ")[0] || "User"}</div>
                <div style={{ color: "var(--text)", fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ color: "var(--primary)" }}>📍</span> {status === "locating" ? "Locating..." : "Gurugram, India"}
                </div>
              </div>
            </div>
            <div 
              style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--surface-solid)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer" }}
              onClick={() => {
                if (user?.role === "worker") navigate("/worker");
                else navigate("/bookings");
              }}
            >
              🔔
            </div>
          </div>

          <h1 style={{ fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-1px", lineHeight: "1.2", marginBottom: "24px", color: "var(--text)", maxWidth: "80%" }}>
            Which services would you like to use
          </h1>

          <div style={{ marginBottom: "24px" }}>
            <SearchBar />
          </div>

          <div style={{
            background: "linear-gradient(135deg, #ccfbf1, #d1fae5)",
            borderRadius: "24px",
            padding: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
            marginBottom: "32px"
          }}>
            <div style={{ position: "relative", zIndex: 2, maxWidth: "60%" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#064e3b", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>45% OFF</h2>
              <p style={{ color: "#065f46", fontSize: "0.9rem", margin: "0 0 16px 0", fontWeight: "500", lineHeight: "1.4" }}>Exclusive discounts on home service</p>
              <span style={{ display: "inline-block", background: "rgba(6, 95, 70, 0.1)", color: "#064e3b", padding: "6px 16px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "700", border: "1px solid rgba(6, 95, 70, 0.2)" }}>
                Limited Time Offer
              </span>
            </div>
            <div style={{ position: "absolute", right: "-10px", bottom: "-20px", zIndex: 1, fontSize: "8rem", opacity: 0.9 }}>
              👨‍🔧
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0 }}>Service Category</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}><span className="spinner" style={{ borderTopColor: "var(--primary)" }} /></div>
          ) : (
            <div className="service-grid">
              {categories.map((service, i) => (
                <div key={service.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-slide-up">
                  <ServiceCard
                    service={service}
                    onClick={(id) => navigate(`/workers/${id}`)}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && recommendedWorkers.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginTop: "24px", marginBottom: "20px" }}>Popular Service</h2>
              <div style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "24px", margin: "0 -20px", paddingLeft: "20px", paddingRight: "20px" }}>
                {recommendedWorkers.map((worker, i) => (
                  <div key={worker._id} style={{ animationDelay: `${i * 0.1}s` }} className="animate-slide-up">
                    <WorkerCard worker={worker} service={worker.skills[0]?.service} style={{ marginBottom: 0 }} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="hide-on-desktop">
        <BottomNav />
      </div>
    </>
  );
}
