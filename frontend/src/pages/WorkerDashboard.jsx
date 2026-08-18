import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import WorkerBottomNav from "../components/WorkerBottomNav";
import { getWorkerBookings, updateBookingStatus, getWorkerUnreadCounts } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NEXT_ACTIONS = {
  pending: [
    { status: "accepted", label: "Accept", cls: "btn-primary" },
    { status: "rejected", label: "Decline", cls: "btn-outline" },
  ],
  accepted: [
    { status: "completed", label: "Mark completed", cls: "btn-primary" },
    { status: "cancelled", label: "Cancel", cls: "btn-outline" },
  ],
};

export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const load = () => {
    setLoading(true);
    getWorkerBookings(user._id)
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
    getWorkerUnreadCounts(user._id).then((res) => {
      const map = {};
      res.data.forEach((item) => {
        map[item.user_id] = item.count;
      });
      setUnreadCounts(map);
    }).catch(() => setUnreadCounts({}));
  };

  useEffect(load, [user._id]);

  const handleStatus = async (bookingId, status) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="screen screen-pt">
        <div className="container" style={{ padding: "0 20px" }}>
          <div style={{ marginBottom: 24 }}>
            <span style={{ 
              display: "inline-block", 
              background: "rgba(99, 102, 241, 0.1)", 
              color: "var(--primary)",
              padding: "4px 12px", 
              borderRadius: "20px", 
              fontSize: "0.85rem", 
              fontWeight: "600",
              marginBottom: "12px",
            }}>Worker Dashboard</span>
            <h1 style={{ fontSize: "2rem", color: "var(--text)", margin: "0 0 4px 0" }}>Hi {user?.name?.split(" ")[0]} 👋</h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Requests from customers near you</p>
          </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No requests yet</h3>
            <p>New bookings from customers will show up here.</p>
          </div>
        ) : (
          <div className="responsive-grid">
            {bookings.map((b, i) => (
              <div key={b._id} className="card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="worker-name-row" style={{ marginBottom: 12 }}>
                  <div 
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                    onClick={() => navigate(`/public/user/${b.user_id}`)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: "var(--bg-gradient)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold",
                      backgroundImage: b.customer?.avatar ? `url(http://localhost:8000${b.customer.avatar})` : "none",
                      backgroundSize: "cover", backgroundPosition: "center"
                    }}>
                      {!b.customer?.avatar && (b.customer?.name?.[0] || "U").toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{b.customer?.name || "Customer"}</h3>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-light)" }}>
                        {b.customer?.address ? `📍 ${b.customer.address}` : "No address provided"}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge status-${b.status}`}>{b.status}</span>
                </div>
                
                <div style={{ background: "rgba(0,0,0,0.02)", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{b.service}</span>
                    <span className="price-tag">₹{b.price}</span>
                  </div>
                  {b.scheduled_date && (
                    <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "var(--text)" }}>
                      🗓️ {b.scheduled_date} at {b.scheduled_time}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: "0.9rem", fontStyle: "italic", color: "var(--text)" }}>
                    "{b.notes || "No notes added"}"
                  </p>
                </div>

                <div className="worker-actions flex gap-2">
                  {(NEXT_ACTIONS[b.status] || []).map((action) => (
                    <button
                      key={action.status}
                      className={`btn ${action.cls}`}
                      style={{ flex: 1, padding: "10px 0" }}
                      disabled={updatingId === b._id}
                      onClick={() => handleStatus(b._id, action.status)}
                    >
                      {updatingId === b._id ? <span className="spinner" /> : action.label}
                    </button>
                  ))}
                  <button
                    className="btn btn-outline btn-chat"
                    style={{ flex: 1, padding: "10px 0" }}
                    onClick={() => navigate(`/worker/chat/${b.user_id}`)}
                  >
                    💬 Chat
                    {unreadCounts[b.user_id] > 0 && <span className="notification-dot" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      <div className="hide-on-desktop">
        <WorkerBottomNav />
      </div>
    </>
  );
}
