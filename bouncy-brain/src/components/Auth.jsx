import React, { useState } from "react";
import { api } from "../api";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const { setUser, setToken } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const path = isLogin ? "/auth/login" : "/auth/signup";
      const body = isLogin ? { email, password } : { email, password, name };

      const res = await api.post(path, body);

      setUser(res.user);
      setToken(res.token);

      // 🔥 Redirect here
      navigate("/");
    } catch (err) {
      alert(err.message || "Error");
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card card" onSubmit={submit}>
        <h2>{isLogin ? "Login" : "Create account"}</h2>

        {!isLogin && (
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="btn" type="submit">
          {isLogin ? "Login" : "Sign up"}
        </button>

        <div className="switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            className="link-like"
            style={{ marginLeft: 8 }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Create" : "Login"}
          </span>
        </div>
      </form>
    </div>
  );
}
