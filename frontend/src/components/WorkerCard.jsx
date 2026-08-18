import React from "react";
import { useNavigate } from "react-router-dom";

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function WorkerCard({ worker, service, variant = "grid", style = {} }) {
  const navigate = useNavigate();
  const skill = worker.skills.find((s) => s.service === service) || worker.skills[0];

  if (variant === "list") {
    return (
      <div className="card animate-slide-up" style={{ padding: "20px", display: "flex", gap: "16px", alignItems: "flex-start", borderRadius: "20px", border: "1px solid var(--border)", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", cursor: "pointer", transition: "all 0.3s ease", ...style }} onClick={() => navigate(`/public/worker/${worker._id}`)}>
        <div 
          style={{ 
            width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0,
            backgroundImage: worker.avatar ? `url(http://localhost:8000${worker.avatar})` : "none",
            backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--bg-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "800", color: "var(--primary)"
          }}
        >
          {!worker.avatar && initials(worker.name)}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text)", fontWeight: "800" }}>{worker.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", marginBottom: "8px" }}>
                <span style={{ color: "var(--warning)", fontWeight: "700", fontSize: "0.85rem" }}>★ {worker.rating?.toFixed(1) ?? "New"}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>({worker.total_reviews} reviews)</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>{skill?.service}</div>
              <div style={{ fontSize: "1.1rem", color: "var(--primary)", fontWeight: "800" }}>₹{skill?.price || "100"}</div>
            </div>
          </div>
          
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.5" }}>
            {worker.description || "Experienced professional ready to help you with your home service needs."}
          </p>
          
          <button
            className="btn btn-primary"
            style={{ padding: "8px 20px", borderRadius: "99px", fontSize: "0.9rem" }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/booking/${worker._id}`, { state: { service } });
            }}
          >
            Book Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-slide-up" style={{ padding: "0", display: "flex", flexDirection: "column", minWidth: "240px", borderRadius: "24px", overflow: "hidden", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", cursor: "pointer", transition: "all 0.3s ease", ...style }} onClick={() => navigate(`/public/worker/${worker._id}`)}>
      
      {/* Top Image Section */}
      <div style={{ height: "140px", position: "relative", backgroundColor: "var(--bg-gradient)" }}>
        <div 
          style={{ 
            width: "100%", height: "100%", 
            backgroundImage: worker.avatar ? `url(http://localhost:8000${worker.avatar})` : "none",
            backgroundSize: "cover", backgroundPosition: "center"
          }}
        >
          {!worker.avatar && (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "800", color: "white", background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>
              {initials(worker.name)}
            </div>
          )}
        </div>
      </div>
      
      {/* Info Section */}
      <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>
            From ₹{skill?.price || "100"}
          </div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text)", fontWeight: "800" }}>
            {worker.name}
          </h3>
        </div>
        
        <button
          style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)" }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/booking/${worker._id}`, { state: { service } });
          }}
        >
          ➔
        </button>
      </div>
    </div>
  );
}
