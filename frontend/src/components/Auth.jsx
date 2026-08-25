import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Auth() {
  const { setUser, setToken } = useUser();
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleCredential = useCallback(async (response) => {
    setGoogleLoading(true);
    setError("");
    try {
      const data = await api.post("/auth/google", { idToken: response.credential });
      setUser(data.user);
      setToken(data.token);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Google sign-in failed";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate, setUser, setToken]);

  const gsiInitializedRef = useRef(false);

  const initGoogleIdentity = useCallback(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return false;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    gsiInitializedRef.current = true;
    return true;
  }, [handleGoogleCredential]);

  // Initialise Google Identity Services as soon as the script is ready.
  // The script tag loads with `async defer`, so it may not be available yet
  // on mount — poll briefly instead of giving up after a single check.
  useEffect(() => {
    if (initGoogleIdentity()) return;
    const interval = setInterval(() => {
      if (initGoogleIdentity()) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [initGoogleIdentity]);

  function launchGoogleOneTap() {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google Sign-In is not configured. Please contact support.");
      return;
    }
    if (!window.google) {
      setError("Google Sign-In is not available. Please try again later.");
      return;
    }
    // Fall back to a just-in-time init in case the polling above hasn't
    // caught up yet (e.g. the script finished loading between renders).
    if (!gsiInitializedRef.current && !initGoogleIdentity()) {
      setError("Google Sign-In is not available. Please try again later.");
      return;
    }
    setError("");
    setGoogleLoading(true);
    // The One Tap UI itself has redirect/render latency, so show the loading
    // state right away; reset it if Google never actually displays a prompt
    // (no credential callback will fire in that case).
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.() || notification.isDismissedMoment?.()) {
        setGoogleLoading(false);
      }
    });
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <Logo size={28} variant="icon" />
          </div>
          <h1 className="auth-title">JumpyBrain</h1>
          <p className="auth-subtitle">Sign in to continue</p>
          <p className="auth-value">
            Focus timers, habits, and gentle nudges that turn scattered days into steady progress.
          </p>
        </div>

        <div className="auth-status" role="status" aria-live="polite">
          {error && <div className="auth-error">{error}</div>}
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={launchGoogleOneTap}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Redirecting…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="auth-legal">
          By continuing you agree to our{" "}
          <a href="/terms" className="text-link">Terms of Service</a> and{" "}
          <a href="/privacy" className="text-link">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
