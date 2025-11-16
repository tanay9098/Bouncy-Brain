const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

let token = null;
export function setToken(t){ token = t; }

async function req(path, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  if(token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { ...opts, headers, credentials: 'include' });
  if(res.status === 204) return null;
  const data = await res.json().catch(()=>null);
  if(!res.ok) throw new Error(data?.error || 'API error');
  return data;
}

export const api = {
  get: (p) => req(p, { method: 'GET' }),
  post: (p,b) => req(p, { method: 'POST', body: JSON.stringify(b) }),
  put: (p,b) => req(p, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (p) => req(p, { method: 'DELETE' })
};
export default api;
