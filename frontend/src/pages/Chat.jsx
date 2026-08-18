import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getChatThread, sendMessage, uploadImage, markThreadRead } from "../services/api";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 4000; // low-bandwidth friendly polling interval

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

  useEffect(() => {
    getChatThread(user._id, workerId).then((res) => {
      setMessages(res.data);
      markThreadRead(user._id, workerId, "user").catch(() => {});
    });
    
    // Determine WS URL based on current host to support various environments
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If backend is on 8000 (local dev), use it. Otherwise assume same origin.
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const socket = new WebSocket(`${wsProtocol}//${wsHost}/messages/ws/${user._id}/${workerId}`);
    
    socket.onmessage = (event) => {
      const newMsg = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMsg]);
    };
    
    setWs(socket);
    
    return () => {
      socket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() && !imageFile) return;
    
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
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ sender: "user", message: text, image: imageUrl }));
        setSending(false);
      } else {
        // Fallback to REST API if WS is disconnected
        const res = await sendMessage({ user_id: user._id, worker_id: workerId, sender: "user", message: text, image: imageUrl });
        if (res.data && res.data.data) {
          setMessages((prev) => [...prev, res.data.data]);
        }
        setSending(false);
      }
    } catch (err) {
      console.error(err);
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
            <div key={m._id} className={`msg-bubble ${m.sender === "user" ? "me" : "them"}`}>
              {m.image && (
                <div style={{ marginBottom: 4 }}>
                  <img src={`http://localhost:8000${m.image}`} alt="Attachment" style={{ maxWidth: "100%", borderRadius: "8px" }} />
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
