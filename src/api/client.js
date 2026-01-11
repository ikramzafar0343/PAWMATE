import axios from 'axios';

const getBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:5000/api';
  envUrl = String(envUrl).trim();
  if (!envUrl.startsWith('http')) {
    let host = envUrl;
    if (!host.includes('.')) {
      host = `${host}.onrender.com`;
    }
    envUrl = `https://${host}`;
  }
  // If a full URL was provided but missing TLD (e.g., https://pawmate-backend-fwo0), fix it
  try {
    const match = envUrl.match(/^https?:\/\/([^/]+)/);
    if (match) {
      const host = match[1];
      if (host && !host.includes('.')) {
        envUrl = envUrl.replace(host, `${host}.onrender.com`);
      }
    }
  } catch {}
  let url = envUrl.replace(/\/+$/, '');
  if (!/\/api($|\/)/.test(url)) {
    url = `${url}/api`;
  }
  return url;
};

const API = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor - Add token to headers
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Response interceptor - Handle 401 errors globally and suppress 404s for DELETE
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress console errors for 404s on DELETE requests (idempotent deletes)
    if (error.config?.method?.toLowerCase() === 'delete' && error.response?.status === 404) {
      // Don't log 404s for DELETE - these are expected when item is already deleted
      // Just return the error so the calling code can handle it gracefully
      error.isIdempotentDelete = true; // Mark so callers know it's expected
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      const errorCode = error.response.data?.code;
      
      // Only redirect if it's an auth error (not a validation error)
      if (errorCode === 'USER_NOT_FOUND' || errorCode === 'TOKEN_INVALID' || errorCode === 'NO_TOKEN' || errorCode === 'AUTH_FAILED') {
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        localStorage.removeItem('userName');
        localStorage.removeItem('userImage');
        
        // Only redirect if not already on login/welcome page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/welcome') && !currentPath.includes('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
