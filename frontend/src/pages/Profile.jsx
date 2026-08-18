import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile, uploadUserAvatar, getUserProfile } from "../services/api";

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function Profile() {
  const { user, login, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(user?.address || "");
  const [updating, setUpdating] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      getUserProfile(user._id).then(res => setProfile(res.data)).catch(console.error);
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      setUpdating(true);
      const res = await uploadUserAvatar(user._id, formData);
      const updatedProfile = { ...(profile || {}), avatar: res.data.avatar_url };
      setProfile(updatedProfile);
      login(updatedProfile, localStorage.getItem("token"), "user"); // Update auth context
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
      await updateUserProfile(user._id, { address: newAddress });
      const updatedProfile = { ...(profile || {}), address: newAddress };
      setProfile(updatedProfile);
      login(updatedProfile, localStorage.getItem("token"), "user"); // Update auth context
      setIsEditingAddress(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update address");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Navbar title="Profile" showBack />
      <div className="screen screen-pt">
        <div className="container" style={{ padding: "0 20px" }}>
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
          <div style={{ marginBottom: 4 }}>
            <span style={{
              background: "rgba(16, 185, 129, 0.1)",
              color: "var(--success)",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              👤 Customer Account
            </span>
          </div>
        </div>
        <button className="btn btn-danger btn-block" onClick={logout}>
          Log out
        </button>
        </div>
      </div>
      <div className="hide-on-desktop">
        <BottomNav />
      </div>
    </>
  );
}
