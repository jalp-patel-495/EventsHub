import axios from 'axios';

const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    // If running in browser production (e.g. Vercel) without explicit VITE_API_URL
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/api/`;
    }
  }
  return 'http://127.0.0.1:8000/api/';
};

const API_URL = getBaseApiUrl();

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || API_URL.replace(/\/api\/?$/, '');
export const WS_URL = import.meta.env.VITE_WS_URL || BACKEND_URL.replace(/^http/, 'ws');



const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle expired tokens and refresh them
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error status is 401 and it's not a retry already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Attempt to refresh the access token
          const response = await axios.post(`${API_URL}accounts/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('accessToken', access);
          
          // Retry original request with new access token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token expired or invalid; clear everything
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // Dispatch a custom logout event so components (like AuthContext) can respond
          window.dispatchEvent(new Event('auth-logout'));
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
