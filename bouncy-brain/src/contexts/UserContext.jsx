import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const ctx = createContext();
export const useUser = () => useContext(ctx);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage on app start
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  // Save token whenever it changes
  function saveToken(t) {
    setToken(t);
    localStorage.setItem("accessToken", t);
  }

  // Save user whenever it changes
  function saveUser(u) {
    setUser(u);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
    } else {
      localStorage.removeItem("user");
    }
  }

  return (
    <ctx.Provider value={{ user, setUser: saveUser, token, setToken: saveToken, loading }}>
      {children}
    </ctx.Provider>
  );
}

