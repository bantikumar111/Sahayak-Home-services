import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { getUserBookings, createReview, uploadImage, getUserUnreadCounts, cancelBooking } from "../services/api";
import { useAuth } from "../context/AuthContext";

function ReviewForm({ booking, onDone }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let imageUrl = null;
    
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await uploadImage(formData);
        imageUrl = res.data.url;
      }
      
      await createReview({
        user_id: user._id,
        worker_id: booking.worker_id,
        booking_id: booking._id,
        rating,
        comment,
        image: imageUrl,
      });
      onDone();
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
      <div className="field">
        <label>Rate this service</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Comment (optional)</label>
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was it?" />
      </div>
      <div className="field">
        <label>Attach Photo (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
      </div>
      <button className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? <span className="spinner" /> : "Submit review"}
      </button>
    </form>
  );
}

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewed, setReviewed] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    getUserBookings(user._id).then((res) => setBookings(res.data));
    getUserUnreadCounts(user._id).then((res) => {
      const map = {};
      res.data.forEach((item) => {
        map[item.worker_id] = item.count;
      });
      setUnreadCounts(map);
    }).catch(() => setUnreadCounts({}));
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings((prev) => 
        prev.map((b) => b._id === bookingId ? { ...b, status: "cancelled" } : b)
      );
      alert("Booking cancelled successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(load, [user._id]);

  return (
    <>
      <Navbar title="My Bookings" showBack />
      <div className="screen screen-pt">
        <div className="container" style={{ padding: "0 20px" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: "2rem", color: "var(--text)", marginTop: 16 }}>My Bookings</h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>View your service history</p>
          </div>
          {bookings.length === 0 && (
            <div className="empty-state">
              <div className="icon">📅</div>
              <h3>No bookings yet</h3>
              <p>Book a service from the home screen to see it here.</p>
            </div>
          )}
          <div className="responsive-grid">
            {bookings.map((b, i) => (
              <div key={b._id} className="card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="worker-name-row" style={{ marginBottom: 12 }}>
                  <div 
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                    onClick={() => navigate(`/public/worker/${b.worker_id}`)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: "var(--bg-gradient)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold",
                      backgroundImage: b.worker?.avatar ? `url(http://localhost:8000${b.worker.avatar})` : "none",
                      backgroundSize: "cover", backgroundPosition: "center"
                    }}>
                      {!b.worker?.avatar && (b.worker?.name?.[0] || "W").toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{b.worker?.name || "Worker"}</h3>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-light)" }}>
                        ★ {b.worker?.rating?.toFixed(1) || "New"} • {b.worker?.experience || 0} yrs
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

                <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                  <button
                    className="btn btn-outline btn-chat"
                    onClick={() => navigate(`/chat/${b.worker_id}`, { state: { workerName: b.worker?.name } })}
                  >
                    💬 Chat
                    {unreadCounts[b.worker_id] > 0 && <span className="notification-dot" />}
                  </button>

                  {(b.status === "pending" || b.status === "accepted") && (
                    <button
                      className="btn btn-outline btn-danger"
                      onClick={() => handleCancelBooking(b._id)}
                      disabled={cancellingId === b._id}
                    >
                      {cancellingId === b._id ? "Cancelling..." : "❌ Cancel Booking"}
                    </button>
                  )}

                  {b.status === "completed" && !reviewed[b._id] && (
                    reviewingId === b._id ? (
                      <ReviewForm
                        booking={b}
                        onDone={() => {
                          setReviewed((r) => ({ ...r, [b._id]: true }));
                          setReviewingId(null);
                        }}
                      />
                    ) : (
                      <button className="btn btn-outline" onClick={() => setReviewingId(b._id)}>
                        ⭐ Leave a review
                      </button>
                    )
                  )}
                  {reviewed[b._id] && <p style={{ color: "var(--success)", margin: "0", textAlign: "center" }}>Thanks for your review!</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hide-on-desktop">
        <BottomNav />
      </div>
    </>
  );
}
