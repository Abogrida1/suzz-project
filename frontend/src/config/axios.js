import axios from 'axios';

// Create axios instance with base configuration
const getBaseURL = () => {
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    // In production, use the current domain
    return window.location.origin;
  }
  // In development, use localhost
  return process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
