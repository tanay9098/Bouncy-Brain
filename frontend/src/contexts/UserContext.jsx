import React, { createContext, useContext, useState, useEffect } from "react";
import api, { updateProfile } from "../services/api";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import { queryClient } from "../providers/QueryProvider";

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

  // Connect socket when we have a token, disconnect on logout
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    socket.on('task:created', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    socket.on('task:updated', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    socket.on('tasks:refetch', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    socket.on('habit:created', () => queryClient.invalidateQueries({ queryKey: ['habits'] }));
    socket.on('habit:updated', () => queryClient.invalidateQueries({ queryKey: ['habits'] }));
    socket.on('habit:deleted', () => queryClient.invalidateQueries({ queryKey: ['habits'] }));

    return () => {
      disconnectSocket();
    };
  }, [token]);

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

  // Update user profile via API and sync local state
  async function updateUser(data) {
    const updated = await updateProfile(data);
    saveUser({ ...user, ...updated });
    return updated;
  }

  return (
    <ctx.Provider value={{ user, setUser: saveUser, updateUser, token, setToken: saveToken, loading }}>
      {children}
    </ctx.Provider>
  );
}

