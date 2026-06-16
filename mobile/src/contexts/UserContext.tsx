import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { queryClient } from '../../App';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        const stored = await SecureStore.getItemAsync('user');
        if (token && stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Connect socket when user logs in, disconnect on logout
  useEffect(() => {
    if (!user) return;
    let socket: ReturnType<typeof connectSocket> | null = null;

    (async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;
      socket = connectSocket(token);
      socket.on('task:created', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
      socket.on('task:updated', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
      socket.on('tasks:refetch', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
      socket.on('habit:created', () => queryClient.invalidateQueries({ queryKey: ['habits'] }));
      socket.on('habit:updated', () => queryClient.invalidateQueries({ queryKey: ['habits'] }));
      socket.on('habit:deleted', () => queryClient.invalidateQueries({ queryKey: ['habits'] }));
    })();

    return () => {
      disconnectSocket();
    };
  }, [user]);

  async function persistSession(data: any, fallbackEmail?: string) {
    await SecureStore.setItemAsync('accessToken', data.token || data.accessToken);
    if (data.refreshToken) {
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    }
    const userData: User = {
      id: data.user?.id || data.userId || '',
      name: data.user?.name || data.name || '',
      email: data.user?.email || fallbackEmail || '',
    };
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    setUser(userData);
  }

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    await persistSession(data, email);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await authApi.signup(name, email, password);
    await persistSession(data, email);
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const { data } = await authApi.googleAuth(idToken);
    await persistSession(data);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, login, signup, googleLogin, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
