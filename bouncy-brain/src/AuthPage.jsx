import React, { useState } from "react";
import { auth, provider, popup } from "./firebaseConfig";
//import { signInWithPopup } from "firebase/auth";

import "./AuthPage.css";

const AuthPage = () => {
  const [user, setUser] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const result = await popup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
  };

  return (
    <div className="auth-container">
      {!user ? (
        <div className="auth-card">
          <h2>Welcome</h2>
          <p>Login or Signup with Google</p>
          <button onClick={handleGoogleLogin} className="google-btn">
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
            />
            Continue with Google
          </button>
        </div>
      ) : (
        <div className="auth-card">
          <img src={user.photoURL} alt="user" className="profile-pic" />
          <h3>Hello, {user.displayName}</h3>
          <p>{user.email}</p>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
