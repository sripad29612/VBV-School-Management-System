import axios from 'axios';
import { store } from '../store';

// Base backend URL - adjust if host is different
const API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://192.168.1.9:5001/api'
    : 'https://vbv-school-backend.onrender.com/api';
    
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      // In a real mobile app, we might use SecureStore or AsyncStorage.
      // For web/Redux support, we will fetch token from localStorage or Redux.
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        const state = store.getState();
        token = state.auth ? state.auth.token : null;
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
