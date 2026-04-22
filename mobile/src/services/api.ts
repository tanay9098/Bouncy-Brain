import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { token: refresh });
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  signup: (name: string, email: string, password: string) =>
    apiClient.post('/auth/signup', { name, email, password }),
  refresh: (token: string) =>
    apiClient.post('/auth/refresh', { token }),
};

// ---------- Tasks ----------
export const tasksApi = {
  getAll: () => apiClient.get('/tasks').then((r) => ({ ...r, data: r.data.tasks ?? [] })),
  create: (payload: { title: string; dueAt?: string; estimateMins?: number; dreadScore?: number }) =>
    apiClient.post('/tasks', payload),
  update: (id: string, payload: Partial<{ title: string; dueAt: string; estimateMins: number; dreadScore: number; completed: boolean }>) =>
    apiClient.put(`/tasks/${id}`, payload),
  complete: (id: string) => apiClient.post(`/tasks/${id}/complete`),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
  brainDump: (text: string) => apiClient.post('/tasks/brain-dump', { text }),
  autoChunk: (id: string) => apiClient.post(`/tasks/${id}/auto-chunk`),
  whatNext: (energyLevel: number) =>
    apiClient.get(`/tasks/what-next?energyLevel=${energyLevel}`),
  aiSuggestions: () => apiClient.get('/tasks/ai/suggestions'),
};

// ---------- Sessions ----------
export const sessionsApi = {
  log: (payload: { type: string; subject?: string; durationMins: number }) =>
    apiClient.post('/sessions', payload),
};

// ---------- Stats ----------
export const statsApi = {
  daily: () => apiClient.get('/stats/daily'),
  weekly: () => apiClient.get('/stats/weekly'),
  monthly: () => apiClient.get('/stats/monthly'),
};

// ---------- Habits ----------
export const habitsApi = {
  getAll: () => apiClient.get('/habits'),
  create: (payload: { name: string; frequency: string }) =>
    apiClient.post('/habits', payload),
  complete: (id: string) => apiClient.post(`/habits/${id}/complete`),
};
