import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getWorkerById, createBooking } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Booking() {
  const { workerId } = useParams();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [worker, setWorker] = useState(null);
  const [service, setService] = useState(routerLocation.state?.service || "");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [bargainPrice, setBargainPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getWorkerById(workerId).then((res) => {
      setWorker(res.data);
      if (!service && res.data.skills?.length) {
        setService(res.data.skills[0].service);
        setBargainPrice(res.data.skills[0].price);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const selectedSkill = worker?.skills.find((s) => s.service === service);

  const handleBook = async (e) => {
    e.preventDefault();
    setError("");

    const userId = user?._id || user?.id;
    if (!userId) {
      setError("You must be logged in to book a service. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    setLoading(true);
    try {
      await createBooking({
        user_id: userId,
        worker_id: workerId,
        service,
        price: bargainPrice ? Number(bargainPrice) : selectedSkill?.price,
        notes,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
      });
      setSuccess(true);
      setTimeout(() => navigate("/bookings"), 1200);
    } catch (err) {
      const serverDetail = err.response?.data?.detail;
      if (serverDetail === "User not found") {
        setError("Your account or session was not found in the database. Please log in or sign up again.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(serverDetail || "Booking failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!worker) return <><Navbar title="Booking" showBack /><div className="screen">Loading…</div></>;

  return (
    <>
      <Navbar title="Confirm booking" showBack />
      <div className="screen screen-pt">
        <div className="container" style={{ padding: "0 20px" }}>
          <div className="card" style={{ marginBottom: 24 }}>
          <h2>{worker.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", marginBottom: "8px" }}>
            <span style={{ color: "var(--warning)", fontWeight: "700", fontSize: "0.9rem" }}>★ {worker.rating?.toFixed(1) ?? "New"}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>({worker.experience} yrs experience)</span>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: "8px 0 0 0", lineHeight: "1.5" }}>
            {worker.description || "Experienced professional ready to help you with your home service needs."}
          </p>
        </div>

        {success ? (
          <div className="success-banner">Booking sent! The worker will confirm shortly.</div>
        ) : (
          <form onSubmit={handleBook}>
            {error && (
              <div className="error-banner" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                <div>⚠️ {error}</div>
                {(error.includes("log in") || error.includes("User") || error.includes("session") || error.includes("registered")) && (
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ padding: "8px 16px", fontSize: "0.85rem", marginTop: "4px", borderRadius: "8px" }}
                    onClick={() => navigate("/login")}
                  >
                    🔑 Click here to Login or Register
                  </button>
                )}
              </div>
            )}

            <div className="field">
              <label htmlFor="service">Service</label>
              <select id="service" value={service} onChange={(e) => {
                setService(e.target.value);
                const skill = worker.skills.find(s => s.service === e.target.value);
                if (skill) setBargainPrice(skill.price);
              }}>
                {worker.skills.map((s) => (
                  <option key={s.service} value={s.service}>
                    {s.service} — ₹{s.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="notes">Describe the issue (optional)</label>
              <textarea
                id="notes"
                rows={3}
                placeholder="e.g. Kitchen tap leaking since morning"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="card" style={{ marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0" }}>Schedule Appointment</h4>
              <div style={{ marginBottom: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Worker's Availability: {worker.available_days?.join(", ") || "Mon-Fri"}, {worker.available_hours || "10:00 - 18:00"}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="scheduledDate">Date</label>
                  <input
                    type="date"
                    id="scheduledDate"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="scheduledTime">Time</label>
                  <input
                    type="time"
                    id="scheduledTime"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Your offer (₹) (optional)</span>
              <input 
                type="number" 
                min="1" 
                placeholder={selectedSkill?.price}
                value={bargainPrice} 
                onChange={(e) => setBargainPrice(e.target.value)} 
                style={{ width: "100px", padding: "4px 8px", textAlign: "right" }}
              />
            </div>

            <button className="btn btn-primary btn-block" disabled={loading} style={{ padding: "14px", borderRadius: "12px", fontSize: "1rem", marginTop: "16px" }}>
              {loading ? <span className="spinner" /> : "Request booking"}
            </button>
          </form>
        )}
        </div>
      </div>
    </>
  );
}
