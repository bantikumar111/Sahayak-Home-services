import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getChatThread, sendMessage, uploadImage, markThreadRead, getWsUrl, getImageUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 3000;

export default function Chat() {
  const { workerId } = useParams();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const [ws, setWs] = useState(null);

  const workerName = routerLocation.state?.workerName || "Worker";

  const fetchThread = useCallback(() => {
    if (!user?._id || !workerId) return;
    getChatThread(user._id, workerId)
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const newMsgs = res.data.filter((m) => !existingIds.has(m._id));
            if (newMsgs.length === 0 && prev.length === res.data.length) return prev;
            return res.data;
          });
        }
        markThreadRead(user._id, workerId, "user").catch(() => {});
      })
      .catch((err) => console.error("Error fetching chat thread:", err));
  }, [user?._id, workerId]);

  useEffect(() => {
    if (!user?._id || !workerId) return;

    fetchThread();

    // Setup polling fallback for robust real-time updates across environments
    const interval = setInterval(fetchThread, POLL_MS);

    // Setup WebSocket connection to backend
    let socket = null;
    try {
      const wsUrl = getWsUrl(`/messages/ws/${user._id}/${workerId}`);
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const newMsg = JSON.parse(event.data);
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
          markThreadRead(user._id, workerId, "user").catch(() => {});
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      setWs(socket);
    } catch (e) {
      console.error("WebSocket setup error:", e);
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.close();
    };
  }, [user?._id, workerId, fetchThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() && !imageFile) return;
    if (!user?._id) return;
    
    setSending(true);
    let imageUrl = null;
    
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await uploadImage(formData);
        imageUrl = res.data.url;
      }
      
      const text = draft;
      setDraft("");
      setImageFile(null);
      
      let sentViaWs = false;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ sender: "user", message: text, image: imageUrl }));
          sentViaWs = true;
        } catch (err) {
          console.warn("WebSocket send failed, falling back to REST API:", err);
        }
      }
      
      if (!sentViaWs) {
        const res = await sendMessage({ user_id: user._id, worker_id: workerId, sender: "user", message: text, image: imageUrl });
        if (res.data && res.data.data) {
          const newMsg = res.data.data;
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar 
        title={
          <span 
            style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}
            onClick={() => navigate(`/public/worker/${workerId}`)}
          >
            {workerName}
          </span>
        } 
        showBack 
      />
      <div className="container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="icon">💬</div>
              <p>Say hello to get started.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m._id || m.timestamp} className={`msg-bubble ${m.sender === "user" ? "me" : "them"}`}>
              {m.image && (
                <div style={{ marginBottom: 4 }}>
                  <img src={getImageUrl(m.image)} alt="Attachment" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                </div>
              )}
              {m.message && <div style={{ marginBottom: 4 }}>{m.message}</div>}
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        
        {imageFile && (
          <div style={{ padding: "8px", background: "var(--bg)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "600" }}>📎 {imageFile.name}</span>
            <button onClick={() => setImageFile(null)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>✕</button>
          </div>
        )}
        
        <form className="chat-input" onSubmit={handleSend} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ padding: "8px", borderRadius: "50%" }}
            onClick={() => fileInputRef.current?.click()}
          >
            📎
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => setImageFile(e.target.files[0])} />
          
          <input
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" disabled={sending} aria-label="Send message">
            {sending ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "➤"}
          </button>
        </form>
      </div>
      </div>
    </>
  );
}

