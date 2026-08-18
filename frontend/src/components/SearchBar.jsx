import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { search } from "../services/api";

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ services: [], workers: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ services: [], workers: [] });
      setShowDropdown(false);
      return;
    }
    
    setLoading(true);
    setShowDropdown(true);

    const timer = setTimeout(() => {
      search(query)
        .then((res) => setResults(res.data))
        .catch(() => setResults({ services: [], workers: [] }))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Highlight matched text helper
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <b key={i} style={{ color: "var(--primary)" }}>{part}</b>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="search-container" ref={dropdownRef} style={{ position: "relative", zIndex: 100, maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1.2rem", zIndex: 2 }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search Service..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 20px 16px 52px",
            borderRadius: "99px",
            border: "none",
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
            fontSize: "1rem",
            fontWeight: "500",
            outline: "none",
            transition: "all 0.3s ease",
            background: "var(--surface-solid)"
          }}
          onFocus={() => {
            if (query.trim()) setShowDropdown(true);
          }}
        />
        <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>
          🎛️
        </div>
      </div>
      {loading && <div style={{ position: "absolute", right: "60px", top: "20px" }}><span className="spinner" style={{ borderTopColor: "var(--primary)" }} /></div>}

      {showDropdown && (query.trim() !== "") && !loading && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "var(--surface-solid)",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          border: "1px solid var(--border)",
          marginTop: "12px",
          maxHeight: "400px",
          overflowY: "auto",
          animation: "slideUpFade 0.2s ease-out"
        }}>
          {results.services.length === 0 && results.workers.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontWeight: "500" }}>
              No results found for "{query}"
            </div>
          ) : (
            <>
              {results.services.length > 0 && (
                <div>
                  <div style={{ padding: "12px 20px", background: "#f8f9fa", fontWeight: "700", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>Services</div>
                  {results.services.map(s => (
                    <div 
                      key={s.id} 
                      style={{ padding: "16px 20px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "16px", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      onClick={() => navigate(`/workers/${s.id}`)}
                    >
                      <span style={{ fontSize: "1.8rem" }}>{s.icon}</span>
                      <div>
                        <div style={{ fontWeight: "600", color: "var(--text)" }}>{highlightText(s.name, query)}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{s.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.workers.length > 0 && (
                <div>
                  <div style={{ padding: "12px 20px", background: "#f8f9fa", fontWeight: "700", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>Workers</div>
                  {results.workers.map(w => (
                    <div 
                      key={w._id} 
                      style={{ padding: "16px 20px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "16px", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      onClick={() => navigate(`/public/worker/${w._id}`)}
                    >
                      <div className="avatar" style={{ width: 44, height: 44, fontSize: "1rem", backgroundImage: w.avatar ? `url(http://localhost:8000${w.avatar})` : "none", backgroundSize: "cover", backgroundPosition: "center" }}>
                        {!w.avatar && w.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", display: "flex", justifyContent: "space-between", color: "var(--text)" }}>
                          {highlightText(w.name, query)}
                          <span style={{ color: "var(--warning)", fontWeight: "700" }}>★ {w.rating?.toFixed(1) || "New"}</span>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {w.skills.map(sk => sk.service).join(", ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
