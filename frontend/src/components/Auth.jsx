import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Auth() {
  const { setUser, setToken } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Initialise Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
  }, [isLogin]);

  const handleGoogleCredential = useCallback(async (response) => {
    setGoogleLoading(true);
    setError("");
    setErrorCode("");
    try {
      const data = await api.post("/auth/google", { idToken: response.credential });
      setUser(data.user);
      setToken(data.token);
      navigate("/");
    } catch (err) {
      const code = err.response?.data?.code || "";
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Google sign-in failed";
      setError(msg);
      setErrorCode(code);
    } finally {
      setGoogleLoading(false);
    }
  }, [isLogin]);

  function launchGoogleOneTap() {
    if (!window.google) {
      setError("Google Sign-In is not available. Please try again later.");
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.prompt();
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setErrorCode("");
    try {
      const path = isLogin ? "/auth/login" : "/auth/signup";
      const body = isLogin
        ? { email: email.trim(), password }
        : { email: email.trim(), password, name: name.trim() };
      const data = await api.post(path, body);
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

  function switchMode() {
    setIsLogin(!isLogin);
    setError("");
    setErrorCode("");
  }

  const isEmailAccountExists = errorCode === "EMAIL_ACCOUNT_EXISTS";

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

        {/* Google Sign-In Button */}
        {GOOGLE_CLIENT_ID && (
          <>
            <button
              type="button"
              onClick={launchGoogleOneTap}
              disabled={googleLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 600,
                cursor: googleLoading ? "not-allowed" : "pointer",
                opacity: googleLoading ? 0.6 : 1,
                marginBottom: 12,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {googleLoading
                ? "Signing in..."
                : isLogin
                ? "Continue with Google"
                : "Sign up with Google"}
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                color: "var(--text-muted)",
                fontSize: 12,
              }}
            >
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
              or
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
            </div>
          </>
        )}

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
            {isEmailAccountExists && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(""); setErrorCode(""); }}
                  style={{
                    background: "var(--red)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Go to Sign In
                </button>
                <a
                  href="mailto:?subject=Reset Password"
                  style={{ color: "var(--red)", fontSize: 12, textDecoration: "underline" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setError("Please use the email you registered with and your password to sign in, then visit account settings to reset your password.");
                    setErrorCode("");
                  }}
                >
                  Reset Password
                </a>
              </div>
            )}
          </div>
        )}

        <button className="btn btn-primary w-full" type="submit">
          {isLogin ? "Log in" : "Create account"}
        </button>

        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span className="auth-link" onClick={switchMode}>
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </div>
      </form>
    </div>
  );
}
