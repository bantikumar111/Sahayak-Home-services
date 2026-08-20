import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import WorkerCard from "../components/WorkerCard";
import { getWorkers, getServices } from "../services/api";
import useGeolocation from "../hooks/useGeolocation";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

// Fix default Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});

export default function WorkerList() {
  const { service } = useParams();
  const { location, status } = useGeolocation();
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [radiusKm, setRadiusKm] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [servicesList, setServicesList] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getServices().then(res => setServicesList(res.data)).catch(console.error);
  }, []);

  const currentServiceObj = servicesList.find(s => s.id === service);
  const meta = currentServiceObj 
    ? { label: currentServiceObj.name, icon: currentServiceObj.icon }
    : { label: service, icon: "🧰" };

  useEffect(() => {
    setLoading(true);
    setError("");
    const maxP = maxPrice ? Number(maxPrice) : undefined;

    // Use location if available; otherwise fetch global (no $near) results from backend
    const lat = location?.lat;
    const lng = location?.lng;

    getWorkers(service, lat, lng, radiusKm, minRating, maxP)
      .then((res) => {
        // Exclude the current user so they can't book themselves
        const filteredWorkers = (res.data || []).filter((w) => w._id !== user?._id);
        setWorkers(filteredWorkers);
      })
      .catch(() => setError("Couldn't load workers. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [service, location, radiusKm, minRating, maxPrice, user?._id]);

  return (
    <>
      <Navbar title={`${meta.icon} ${meta.label}`} showBack />
      <div className="screen screen-pt">
        <div className="container">
          <div style={{ marginBottom: 24, padding: "0 20px" }}>
            <h1 style={{ fontSize: "2rem", color: "var(--text)", marginTop: 16 }}>{meta.label}</h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Find the best {meta.label.toLowerCase()}s nearby</p>
          </div>
          
          {error && (
            <div style={{ color: "var(--danger)", margin: "0 20px 16px 20px", background: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", fontSize: "0.9rem" }}>
              ⚠️ {error}
            </div>
          )}
          
          <div className="card" style={{ marginBottom: 16, padding: 16, margin: "0 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem" }}>Filters</h3>
              <button 
                className={`btn ${showMap ? 'btn-primary' : 'btn-outline'}`} 
                style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? "📍 List View" : "📍 Map View"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="radius">Search radius: {radiusKm} km</label>
                <input
                  id="radius"
                  type="range"
                  min="1"
                  max="20"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="rating">Min Rating: {minRating}★</label>
                <input
                  id="rating"
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                />
              </div>
              <div className="field" style={{ margin: 0, gridColumn: "1 / -1" }}>
                <label htmlFor="price">Max Price (₹)</label>
                <input
                  id="price"
                  type="number"
                  placeholder="Any price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

        {status === "locating" && <p>Getting your location…</p>}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" style={{ borderTopColor: "var(--primary)" }} /></div>
        ) : (
          <div className="responsive-grid" style={{ padding: "0 20px" }}>
            {workers.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🔍</div>
                <h3>No {meta.label.toLowerCase()}s found</h3>
                <p>Try increasing your search radius or check back later.</p>
              </div>
            ) : showMap && location ? (
              <div style={{ height: "400px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
                <MapContainer center={[location.lat, location.lng]} zoom={11} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {workers.map((w) => {
                    const lat = w.location?.coordinates?.[1];
                    const lng = w.location?.coordinates?.[0];
                    if (!lat || !lng) return null;
                    return (
                      <Marker key={w._id} position={[lat, lng]}>
                        <Popup>
                          <div style={{ textAlign: "center" }}>
                            <strong style={{ display: "block", marginBottom: "4px" }}>{w.name}</strong>
                            <p style={{ margin: "0 0 8px 0" }}>★ {w.rating?.toFixed(1) || "New"}</p>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                              onClick={() => navigate(`/public/worker/${w._id}`)}
                            >
                              View Profile
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            ) : (
              workers.map((w) => (
                <WorkerCard key={w._id} worker={w} service={service} variant="list" />
              ))
            )}
          </div>
        )}
        </div>
      </div>
      <div className="hide-on-desktop">
        <BottomNav />
      </div>
    </>
  );
}
