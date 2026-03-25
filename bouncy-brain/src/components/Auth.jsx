import { useState } from "react";
import api from "../services/api";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const { setUser, setToken } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const path = isLogin ? "/auth/login" : "/auth/signup";
      const body = isLogin
        ? { email: email.trim(), password }
        : { email: email.trim(), password, name: name.trim() };
      const { data } = await api.post(path, body);
      setUser(data.user);
      setToken(data.token);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--violet), #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
              color: "#fff",
              margin: "0 auto 12px",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}
          >
            BB
          </div>
          <div className="auth-title">Bouncy Brain</div>
          <div className="auth-subtitle">
            {isLogin ? "Welcome back" : "Create your account"}
          </div>
        </div>

        {!isLogin && (
          <input
            className="input mb-3"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          className="input mb-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="input mb-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--red-dim)",
              color: "var(--red)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <button className="btn btn-primary w-full" type="submit">
          {isLogin ? "Log in" : "Create account"}
        </button>

        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span className="auth-link" onClick={() => { setIsLogin(!isLogin); setError(""); }}>
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </div>
      </form>
    </div>
  );
}
