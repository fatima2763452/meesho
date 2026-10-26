import axios from 'axios';
import { getCookie, clearAllAuthData } from '../utils/cookies';

const api = axios.create({
  baseURL: import.meta.env.VITE_URL || 'http://localhost:5001/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.cloaked) {
      clearAllAuthData();
      localStorage.setItem('flipkartSecurity', 'ON');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/secret-admin') && window.location.pathname !== '/login') {
        window.location.replace('https://www.flipkart.com');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
