import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import WorkerBottomNav from "../components/WorkerBottomNav";
import { useAuth } from "../context/AuthContext";
import { getWorkerById, getWorkerReviews, updateWorkerSkills, getServices, createService, updateWorkerProfile, uploadWorkerAvatar } from "../services/api";

const DEFAULT_SERVICES = [
  { id: "plumber", name: "Plumber", icon: "🔧", description: "Plumbing repairs and installations", color: "#3b82f6" },
  { id: "electrician", name: "Electrician", icon: "⚡", description: "Electrical repairs and installations", color: "#f59e0b" },
  { id: "ac-repair", name: "AC Repair", icon: "❄️", description: "Air conditioning repair and maintenance", color: "#06b6d4" },
  { id: "carpenter", name: "Carpenter", icon: "🪛", description: "Carpentry and woodwork", color: "#8b5cf6" },
  { id: "painter", name: "Painter", icon: "🎨", description: "Painting services", color: "#ec4899" },
  { id: "cleaning", name: "Cleaning", icon: "🧹", description: "Home and office cleaning", color: "#10b981" },
  { id: "washing-machine-repair", name: "Washing Machine Repair", icon: "🧺", description: "Washing machine repair", color: "#f97316" },
  { id: "refrigerator-repair", name: "Refrigerator Repair", icon: "❄️", description: "Fridge repair and maintenance", color: "#0ea5e9" },
  { id: "microwave-repair", name: "Microwave Repair", icon: "🍕", description: "Microwave repair services", color: "#f59e0b" },
  { id: "geyser-repair", name: "Geyser Repair", icon: "🚿", description: "Water heater repair", color: "#ef4444" },
  { id: "water-purifier", name: "Water Purifier (RO) Service", icon: "💧", description: "Water purifier maintenance", color: "#3b82f6" },
  { id: "cctv", name: "CCTV Installation", icon: "📹", description: "CCTV camera installation", color: "#64748b" },
  { id: "pest-control", name: "Pest Control", icon: "🐛", description: "Pest control services", color: "#059669" },
  { id: "gardening", name: "Gardening", icon: "🌱", description: "Garden maintenance", color: "#84cc16" },
  { id: "packers-movers", name: "Packers & Movers", icon: "📦", description: "Packing and moving services", color: "#d97706" },
  { id: "laptop-repair", name: "Laptop Repair", icon: "💻", description: "Laptop repair and maintenance", color: "#1f2937" },
  { id: "wifi-setup", name: "WiFi Setup", icon: "📊", description: "WiFi router setup and installation", color: "#8b5cf6" },
  { id: "home-tutor", name: "Home Tutor", icon: "📚", description: "Home tutoring services", color: "#dc2626" },
  { id: "beauty-services", name: "Beauty Services", icon: "💄", description: "Beauty and grooming services", color: "#ec4899" },
  { id: "personal-trainer", name: "Personal Trainer", icon: "💪", description: "Fitness training services", color: "#f97316" },
  { id: "driver", name: "Driver Service", icon: "🚗", description: "Professional driver services", color: "#0ea5e9" },
  { id: "dog-walking", name: "Dog walking", icon: "🐕", description: "Dog walking and pet care", color: "#d97706" },
];

function getDefaultServices() {
  return DEFAULT_SERVICES;
}

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function WorkerProfile() {
  const { user, login, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  
  // States for adding new service
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Custom service fields
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  
  // Editing profile fields
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        const workerRes = await getWorkerById(user._id);
        const reviewsRes = await getWorkerReviews(user._id);
        const servicesRes = await getServices();

        if (!mounted) return;

        setProfile(workerRes.data);
        setNewAddress(workerRes.data?.address || "");
        setNewDesc(workerRes.data?.description || "");
        setReviews(reviewsRes.data);

        const services = servicesRes.data && servicesRes.data.length > 0 ? servicesRes.data : getDefaultServices();
        setServicesList(services);
      } catch (err) {
        console.error("Failed to load profile/reviews/services", err);
        const status = err?.response?.status;
        if (status === 404) {
          alert("Worker profile not found. Please log in again.");
          try { logout(); } catch (e) {}
          navigate("/login");
          return;
        }
        setServicesList(getDefaultServices());
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, [user._id, navigate, logout]);

  const handleSaveSkill = async () => {
    if (!newService || !newPrice) return;
    
    // Check if service already added
    if (newService !== "custom_new" && profile?.skills?.find((s) => s.service === newService)) {
      alert("You already provide this service! Please select another.");
      return;
    }
    
    setUpdating(true);
    try {
      let finalServiceId = newService;
      
      // If they selected to create a new one
      if (newService === "custom_new") {
        if (!customName || !customIcon) {
          alert("Please fill name and icon for the new service");
          setUpdating(false);
          return;
        }
        finalServiceId = customName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await createService({
          id: finalServiceId,
          name: customName,
          icon: customIcon,
          description: customDesc || "Custom service",
          color: "#4caf50"
        });
        
        // Refetch services list so it's available globally now
        const res = await getServices();
        setServicesList(res.data);
      }

      const workerIdToUse = profile?._id || user._id;
      const updatedSkills = [...(profile?.skills || []), { service: finalServiceId, price: Number(newPrice) }];
      await updateWorkerSkills(workerIdToUse, updatedSkills);
      setProfile({ ...(profile || {}), skills: updatedSkills });
      setIsAdding(false);
      setNewService("");
      setNewPrice("");
      setCustomName("");
      setCustomIcon("");
      setCustomDesc("");
    } catch (err) {
      console.error("Error adding service:", err.response?.data || err.message);
      const serverMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.response?.data || err.message;
      alert(`Failed to add service: ${serverMsg}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveSkill = async (serviceName) => {
    setUpdating(true);
    try {
      const workerIdToUse = profile?._id || user._id;
      const updatedSkills = (profile?.skills || []).filter(s => s.service !== serviceName);
      await updateWorkerSkills(workerIdToUse, updatedSkills);
      setProfile({ ...(profile || {}), skills: updatedSkills });
    } catch (err) {
      console.error(err);
      alert("Failed to remove service");
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      setUpdating(true);
      const workerIdToUse = profile?._id || user._id;
      const res = await uploadWorkerAvatar(workerIdToUse, formData);
      const updatedProfile = { ...(profile || {}), avatar: res.data.avatar_url };
      setProfile(updatedProfile);
      login(updatedProfile, localStorage.getItem("token"), "worker"); // Update auth context
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.trim()) return;
    try {
      setUpdating(true);
      const workerIdToUse = profile?._id || user._id;
      await updateWorkerProfile(workerIdToUse, { address: newAddress });
      const updatedProfile = { ...(profile || {}), address: newAddress };
      setProfile(updatedProfile);
      login(updatedProfile, localStorage.getItem("token"), "worker"); // Update auth context
      setIsEditingAddress(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update address");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveDesc = async () => {
    try {
      setUpdating(true);
      const workerIdToUse = profile?._id || user._id;
      await updateWorkerProfile(workerIdToUse, { description: newDesc });
      const updatedProfile = { ...(profile || {}), description: newDesc };
      setProfile(updatedProfile);
      login(updatedProfile, localStorage.getItem("token"), "worker"); // Update auth context
      setIsEditingDesc(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update description");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Navbar title="Profile" showBack />
      <div className="screen screen-pt">
        <div className="container">
          <div className="card animate-slide-up" style={{ textAlign: "center", padding: 24, position: "relative" }}>
            <div 
              className="avatar" 
              style={{ 
                margin: "0 auto 16px", 
                width: 80, 
                height: 80, 
                fontSize: "2rem", 
                cursor: "pointer", 
                position: "relative",
                overflow: "hidden",
                backgroundImage: profile?.avatar ? `url(http://localhost:8000${profile.avatar})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Click to change photo"
            >
              {!profile?.avatar && initials(profile?.name)}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", color: "white", fontSize: "0.6rem", padding: "2px 0" }}>
                EDIT
              </div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleAvatarChange} />
            
            <h2>{profile?.name}</h2>
            <p style={{ marginBottom: 4 }}>{profile?.email || profile?.phone}</p>
            
            {isEditingAddress ? (
              <div style={{ margin: "12px 0" }}>
                <input 
                  type="text" 
                  value={newAddress} 
                  onChange={(e) => setNewAddress(e.target.value)} 
                  placeholder="Enter new address"
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "8px" }}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button className="btn btn-primary" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={handleSaveAddress} disabled={updating}>Save</button>
                  <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setIsEditingAddress(false)} disabled={updating}>Cancel</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "0.85rem", color: "var(--text-light)", marginBottom: 12 }}>
                📍 {profile?.address || "No address added"}{" "}
                <button 
                  onClick={() => setIsEditingAddress(true)}
                  style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.75rem", cursor: "pointer", padding: "0 4px" }}
                >
                  (Edit)
                </button>
              </p>
            )}
            
            {isEditingDesc ? (
              <div style={{ margin: "12px 0" }}>
                <textarea 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)} 
                  placeholder="Tell customers about yourself..."
                  rows={3}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "8px", fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button className="btn btn-primary" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={handleSaveDesc} disabled={updating}>Save</button>
                  <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setIsEditingDesc(false)} disabled={updating}>Cancel</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "0.9rem", color: "var(--text)", marginBottom: 16 }}>
                {profile?.description || "No description added."}
                <button 
                  onClick={() => setIsEditingDesc(true)}
                  style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.75rem", cursor: "pointer", padding: "0 4px" }}
                >
                  (Edit Bio)
                </button>
              </p>
            )}

            <div style={{ margin: "16px 0", borderTop: "1px solid var(--border)", paddingTop: "16px", textAlign: "left" }}>
              <div className="flex justify-between items-center mb-2">
                <h4 style={{ margin: 0 }}>Availability</h4>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text)", margin: "0 0 4px 0" }}>
                <strong>Days:</strong> {profile?.available_days?.join(", ") || "Mon-Fri (Default)"}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text)", margin: 0 }}>
                <strong>Hours:</strong> {profile?.available_hours || "10:00 - 18:00 (Default)"}
              </p>
              <button 
                onClick={() => {
                  const days = prompt("Enter available days (e.g. Mon,Tue,Wed):", profile?.available_days?.join(",") || "");
                  const hours = prompt("Enter available hours (e.g. 10:00-18:00):", profile?.available_hours || "");
                  if (days !== null || hours !== null) {
                    const payload = {};
                    if (days !== null) payload.available_days = days.split(",").map(d => d.trim()).filter(d => d);
                    if (hours !== null) payload.available_hours = hours.trim();
                    
                    setUpdating(true);
                    const workerIdToUse = profile?._id || user._id;
                    updateWorkerProfile(workerIdToUse, payload)
                      .then(() => {
                        const updatedProfile = { ...(profile || {}), ...payload };
                        setProfile(updatedProfile);
                        login(updatedProfile, localStorage.getItem("token"), "worker");
                      })
                      .catch(() => alert("Failed to save availability"))
                      .finally(() => setUpdating(false));
                  }
                }}
                className="btn btn-outline"
                style={{ padding: "4px 12px", fontSize: "0.75rem", marginTop: "8px" }}
                disabled={updating}
              >
                ✏️ Edit Availability
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "var(--primary)",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                👷 Worker Account
              </span>
            </div>
            <span className="rating-pill">★ {profile?.rating?.toFixed(1) ?? "New"} · {profile?.total_reviews ?? 0} reviews</span>
          </div>

          <div className="card animate-slide-up stagger-1">
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0 }}>Your services</h3>
              {!isAdding && (
                <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.85rem" }} onClick={() => setIsAdding(true)}>
                  + Add Service
                </button>
              )}
            </div>

            {(profile?.skills || []).length === 0 ? (
              <p style={{ color: "var(--text-light)", textAlign: "center", padding: "16px 0" }}>
                No services added yet. Click "+ Add Service" to get started! 👆
              </p>
            ) : (
              (profile?.skills || []).map((s) => (
                <div key={s.service} className="worker-name-row" style={{ marginBottom: 12 }}>
                  <div>
                    <span style={{ textTransform: "capitalize", fontWeight: "500", display: "block" }}>{s.service}</span>
                    <button 
                      onClick={() => handleRemoveSkill(s.service)} 
                      style={{ background: "transparent", border: "none", color: "var(--danger)", fontSize: "0.75rem", cursor: "pointer", padding: 0, marginTop: 4 }}
                      disabled={updating || (profile?.skills?.length || 0) <= 1}
                    >
                      Remove
                    </button>
                  </div>
                  <span className="price-tag">₹{s.price}</span>
                </div>
              ))
            )}

            {isAdding && (
              <div style={{ background: "var(--bg-gradient)", padding: 16, borderRadius: "12px", marginTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0" }}>Add New Service</h4>
                <div className="field">
                  <label>Choose Service Type</label>
                  <select value={newService} onChange={(e) => setNewService(e.target.value)}>
                    <option value="">-- Select from available services --</option>
                    {servicesList.length > 0 ? (
                      servicesList.map(c => {
                        const isAlreadyAdded = profile?.skills?.find((s) => s.service === c.id);
                        return (
                          <option key={c.id} value={c.id} disabled={isAlreadyAdded}>
                            {c.icon} {c.name} {isAlreadyAdded ? "(Already added)" : ""}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>(Loading services...)</option>
                    )}
                    <option value="custom_new" style={{ fontWeight: "bold", color: "var(--primary)" }}>➕ Create Your Own Service</option>
                  </select>
                </div>
                {newService === "custom_new" && (
                  <div style={{ background: "rgba(76, 175, 80, 0.1)", padding: 12, borderRadius: 8, marginBottom: 12, border: "1px solid rgba(76, 175, 80, 0.3)" }}>
                    <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", color: "var(--text-light)" }}>📝 Create a new custom service</p>
                    <div className="field">
                      <label>Service Name</label>
                      <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Dog Walking, House Cleaning" />
                    </div>
                    <div className="field">
                      <label>Emoji Icon</label>
                      <input type="text" value={customIcon} onChange={(e) => setCustomIcon(e.target.value)} placeholder="e.g. 🐕 or 🧹" maxLength="2" />
                    </div>
                    <div className="field">
                      <label>Description (optional)</label>
                      <input type="text" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="What does this service include?" />
                    </div>
                  </div>
                )}
                <div className="field">
                  <label>Your Price (₹)</label>
                  <input type="number" min="10" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Enter price in rupees" />
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveSkill} disabled={updating || !newService || !newPrice}>
                    {updating ? "Saving..." : "✅ Add Service"}
                  </button>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                    setIsAdding(false);
                    setNewService("");
                    setNewPrice("");
                    setCustomName("");
                    setCustomIcon("");
                    setCustomDesc("");
                  }} disabled={updating}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card animate-slide-up stagger-2">
            <h3 className="mb-4">Recent Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-muted">No reviews yet.</p>
            ) : (
              reviews.map((r, i) => (
                <div key={r._id} style={{ 
                  borderBottom: i === reviews.length - 1 ? "none" : "1px solid var(--border)", 
                  padding: "12px 0",
                  marginBottom: i === reviews.length - 1 ? 0 : 4 
                }}>
                  <div style={{ color: "#d97706", fontWeight: "700" }}>{"★".repeat(r.rating)}</div>
                  {r.comment && <p style={{ fontStyle: "italic", margin: "8px 0 0 0", color: "var(--text)" }}>"{r.comment}"</p>}
                  {r.image && (
                    <div style={{ marginTop: "8px" }}>
                      <img src={`http://localhost:8000${r.image}`} alt="Review attachment" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", objectFit: "cover" }} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <button className="btn btn-danger btn-block" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
      <div className="hide-on-desktop">
        <WorkerBottomNav />
      </div>
    </>
  );
}
