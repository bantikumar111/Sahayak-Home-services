import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getWorkerById, getUserProfile, getWorkerReviews } from "../services/api";

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function PublicProfile() {
  const { role, id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (role === "worker") {
          const res = await getWorkerById(id);
          setProfile(res.data);
          // Fetch reviews for worker
          const reviewRes = await getWorkerReviews(id);
          setReviews(reviewRes.data || []);
        } else {
          const res = await getUserProfile(id);
          setProfile(res.data);
        }
      } catch (err) {
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [role, id]);

  if (loading) {
    return (
      <div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="screen">
        <Navbar title="Profile" showBack />
        <div className="container" style={{ textAlign: "center", marginTop: 40 }}>
          <div className="icon">😕</div>
          <h2>{error}</h2>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const isWorker = role === "worker" || profile.role === "worker";

  return (
    <>
      <Navbar title={`${profile.name}'s Profile`} showBack />
      
      <div className="screen screen-pt">
        <div className="container">
          {/* Main Card */}
          <div className="card animate-slide-up" style={{ textAlign: "center", padding: 24, position: "relative" }}>
            <div 
              className="avatar" 
              style={{ 
                margin: "0 auto 16px", 
                width: 80, 
                height: 80, 
                fontSize: "2rem",
                backgroundImage: profile?.avatar ? `url(http://localhost:8000${profile.avatar})` : "none",
                backgroundSize: "cover", 
                backgroundPosition: "center"
              }}
            >
              {!profile?.avatar && initials(profile?.name)}
            </div>
            <h2>{profile.name}</h2>
            <p style={{ marginBottom: 4 }}>{profile.email}</p>
            {profile.address && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-light)", marginBottom: 12 }}>
                📍 {profile.address}
              </p>
            )}
            
            {profile.description && (
              <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: "12px 0", lineHeight: "1.5" }}>
                "{profile.description}"
              </p>
            )}
            
            <div style={{ marginBottom: 16 }}>
              {isWorker ? (
                <span style={{
                  background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)",
                  padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem",
                  fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px"
                }}>
                  👷 Worker Account
                </span>
              ) : (
                <span style={{
                  background: "rgba(16, 185, 129, 0.1)", color: "var(--success)",
                  padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem",
                  fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px"
                }}>
                  👤 Customer Account
                </span>
              )}
            </div>

            {isWorker && (
              <span className="rating-pill">★ {profile.rating?.toFixed(1) ?? "New"} · {profile.total_reviews ?? 0} reviews</span>
            )}
            
            <div className="flex gap-2" style={{ marginTop: 24 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/chat/${profile._id}`, { state: { workerName: profile.name } })}>
                💬 Message
              </button>
            </div>
          </div>

          {/* Services Offered (Workers Only) */}
          {isWorker && profile.skills && profile.skills.length > 0 && (
            <div className="card animate-slide-up stagger-1">
              <h3 className="mb-4">Services Offered</h3>
              {profile.skills.map((s) => (
                <div key={s.service} className="worker-name-row" style={{ marginBottom: 12 }}>
                  <div>
                    <span style={{ textTransform: "capitalize", fontWeight: "500", display: "block" }}>{s.service}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span className="price-tag">₹{s.price}</span>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                      onClick={() => navigate(`/booking/${profile._id}`, { state: { service: s.service } })}
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Availability (Read-only) */}
          {isWorker && (profile.available_days || profile.available_hours) && (
            <div className="card animate-slide-up stagger-2">
              <h3 className="mb-4">Availability</h3>
              <div style={{ display: "grid", gap: "16px" }}>
                {profile.available_days && profile.available_days.length > 0 && (
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Days Available</label>
                    <p style={{ margin: "4px 0 0 0", fontSize: "1rem", color: "var(--text)", fontWeight: "500" }}>
                      {profile.available_days.join(", ") || "Not specified"}
                    </p>
                  </div>
                )}
                {profile.available_hours && (
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Hours</label>
                    <p style={{ margin: "4px 0 0 0", fontSize: "1rem", color: "var(--text)", fontWeight: "500" }}>
                      {profile.available_hours}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Reviews */}
          {isWorker && reviews.length > 0 && (
            <div className="card animate-slide-up stagger-3">
              <h3 className="mb-4">Recent Reviews</h3>
              <div style={{ display: "grid", gap: "20px" }}>
                {reviews.slice(0, 3).map((review) => (
                  <div key={review._id} style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "var(--bg-gradient)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.9rem",
                            fontWeight: "700"
                          }}
                        >
                          {review.customer_name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "var(--text)" }}>
                            {review.customer_name || "Customer"}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: "1rem", color: "var(--warning)" }}>
                        {"★".repeat(review.rating || 0)}
                      </span>
                    </div>
                    {review.comment && (
                      <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.5", fontStyle: "italic" }}>
                        "{review.comment}"
                      </p>
                    )}
                    {review.image && (
                      <img 
                        src={`http://localhost:8000${review.image}`} 
                        alt="Review" 
                        style={{ marginTop: "8px", maxWidth: "100%", borderRadius: "8px", maxHeight: "150px" }}
                      />
                    )}
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px 0" }}>
                    No reviews yet
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
