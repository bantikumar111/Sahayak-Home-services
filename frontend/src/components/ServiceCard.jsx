import React from "react";

// Category -> icon + accent color, used to tint the service tag
const CATEGORY_META = {
  plumber: { icon: "🔧", color: "#1b6b63", label: "Plumber" },
  electrician: { icon: "⚡", color: "#f4a300", label: "Electrician" },
  "ac-repair": { icon: "❄️", color: "#1c7ed6", label: "AC Repair" },
  carpenter: { icon: "🪚", color: "#a0522d", label: "Carpenter" },
  painter: { icon: "🎨", color: "#9c36b5", label: "Painter" },
  cleaning: { icon: "🧹", color: "#2f9e44", label: "Cleaning" },
};

export default function ServiceCard({ service, selected, onClick }) {
  // Backwards compatibility: if service is a string, it's just the ID
  const isString = typeof service === 'string';
  const id = isString ? service : service.id;
  const meta = isString 
    ? (CATEGORY_META[service] || { icon: "🧰", color: "#1b6b63", label: service }) 
    : { icon: service.icon, color: service.color || "#1b6b63", label: service.name };

  return (
    <button
      type="button"
      className={`service-card${selected ? " selected" : ""}`}
      style={{ width: "100%", height: "100%", padding: "16px 8px", background: "var(--surface)", border: "none", borderRadius: "20px", boxShadow: "0 8px 24px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      onClick={() => onClick(id)}
    >
      <div style={{
        background: `rgba(${parseInt(meta.color.slice(1,3),16)}, ${parseInt(meta.color.slice(3,5),16)}, ${parseInt(meta.color.slice(5,7),16)}, 0.1)`,
        width: "48px",
        height: "48px",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "12px",
        fontSize: "1.6rem"
      }}>
        {meta.icon}
      </div>
      <span className="label font-semibold" style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.5px" }}>{meta.label}</span>
    </button>
  );
}

export { CATEGORY_META };
