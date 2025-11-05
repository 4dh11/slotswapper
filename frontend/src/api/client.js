import axios from 'axios';

const raw = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const origin = raw.replace(/\/+$/, '');           // strip trailing slashes
const base = origin.endsWith('/api') ? origin : `${origin}/api`;

export const api = axios.create({
  baseURL: base,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
