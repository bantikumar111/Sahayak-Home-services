import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  registerUser, loginUser,
  registerWorker, loginWorker,
  getServices, createService,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [role, setRole] = useState(null); // null | "user" | "worker"
  const [mode, setMode] = useState("register"); // register | login

  // shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");

  // worker-only fields
  const [skillService, setSkillService] = useState("");
  const [price, setPrice] = useState("");
  const [experience, setExperience] = useState("");
  const [servicesList, setServicesList] = useState([]);

  // custom service fields
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  useEffect(() => {
    getServices().then(res => {
      setServicesList(res.data);
      if (res.data.length > 0) {
        setSkillService(res.data[0].id);
      }
    }).catch(console.error);
  }, []);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const resetToRoleSelect = () => {
    setRole(null);
    setMode("register");
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (role === "user") {
        await registerUser({ name, email, password, address });
        const res = await loginUser({ email, password });
        login(res.data.user, res.data.access_token, "user");
        navigate("/");
      } else {
        const coords = await new Promise((resolve) => {
          if (!navigator.geolocation) return resolve({ lat: 28.6692, lng: 77.4538 });
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve({ lat: 28.6692, lng: 77.4538 }),
            { timeout: 6000 }
          );
        });
        let finalServiceId = skillService;
        
        if (skillService === "custom_new") {
          if (!customName || !customIcon) {
            setError("Please provide a name and icon for the new service");
            setLoading(false);
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
        }

        await registerWorker({
          name,
          email,
          password,
          address,
          skills: [{ service: finalServiceId, price: Number(price) }],
          experience: Number(experience) || 0,
          location: coords,
        });
        const res = await loginWorker({ email, password });
        login(res.data.worker, res.data.access_token, "worker");
        navigate("/worker");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (role === "user") {
        const res = await loginUser({ email, password });
        login(res.data.user, res.data.access_token, "user");
        navigate("/");
      } else {
        const res = await loginWorker({ email, password });
        login(res.data.worker, res.data.access_token, "worker");
        navigate("/worker");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="screen login-select">
        <div style={{ textAlign: "center", margin: "24px 0" }}>
          <div style={{ fontSize: "2.5rem" }}>🛠️</div>
          <h1>Sahayak</h1>
          <p>Trusted help, right around the corner</p>
        </div>
        <p style={{ textAlign: "center", marginBottom: 16 }}>How do you want to use the app?</p>
        <button className="btn btn-primary btn-block" style={{ marginBottom: 12, padding: "18px" }} onClick={() => setRole("user")}>
          🔍 I need a service — Customer
        </button>
        <button className="btn btn-outline btn-block" style={{ padding: "18px" }} onClick={() => setRole("worker")}>
          🧰 I provide services — Worker
        </button>
      </div>
    );
  }

  return (
    <div className="screen login-form-screen">
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <div style={{ fontSize: "2.5rem" }}>{role === "user" ? "🔍" : "🧰"}</div>
        <h1>{role === "user" ? "Customer login" : "Worker login"}</h1>
        <p>{role === "user" ? "Find trusted help nearby" : "Get bookings from customers near you"}</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={`btn ${mode === "register" ? "btn-primary" : "btn-outline"} btn-block`}
          onClick={() => setMode("register")}
          type="button"
        >
          New here
        </button>
        <button
          className={`btn ${mode === "login" ? "btn-primary" : "btn-outline"} btn-block`}
          onClick={() => setMode("login")}
          type="button"
        >
          I have an account
        </button>
      </div>

      <form onSubmit={mode === "register" ? handleRegister : handleLogin}>
        {mode === "register" && (
          <>
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="address">Full Address</label>
              <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required minLength={5} placeholder="e.g. 123 Main St, New York" />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {mode === "register" && role === "worker" && (
          <>
            <div className="field">
              <label htmlFor="skillService">Primary service</label>
              <select id="skillService" value={skillService} onChange={(e) => setSkillService(e.target.value)}>
                {servicesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="custom_new" style={{ fontWeight: "bold", color: "var(--primary)" }}>+ Create Custom Service</option>
              </select>
            </div>
            
            {skillService === "custom_new" && (
              <div style={{ background: "rgba(255,255,255,0.5)", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                <div className="field">
                  <label>New Service Name</label>
                  <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Dog Walking" required />
                </div>
                <div className="field">
                  <label>Icon (Emoji)</label>
                  <input type="text" value={customIcon} onChange={(e) => setCustomIcon(e.target.value)} placeholder="e.g. 🐕" required />
                </div>
                <div className="field">
                  <label>Description</label>
                  <input type="text" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="Short description" />
                </div>
              </div>
            )}

            <div className="field">
              <label htmlFor="price">Price for this service (₹)</label>
              <input id="price" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="experience">Years of experience</label>
              <input id="experience" type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} />
            </div>
            <p style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: 16 }}>
              We'll use your current location so nearby customers can find you. You can add more services later.
            </p>
          </>
        )}

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : (mode === "register" ? "Sign up" : "Log in")}
        </button>
      </form>

      <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={resetToRoleSelect}>
        ← Change role
      </button>
    </div>
  );
}
