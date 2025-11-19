import React, { createContext, useContext, useState, useEffect } from "react";
import { setToken as setApiToken } from "../api";

const ctx = createContext();
export const useUser = () => useContext(ctx);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage on app start
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
      setApiToken(storedToken);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // Save token whenever it changes
  function saveToken(t) {
    setToken(t);
    setApiToken(t);
    localStorage.setItem("token", t);
  }

  // Save user whenever it changes
  function saveUser(u) {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  }

  return (
    <ctx.Provider value={{ user, setUser: saveUser, token, setToken: saveToken, loading }}>
      {children}
    </ctx.Provider>
  );
}

