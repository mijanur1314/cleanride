import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'x-xsrf-token',
});

api.interceptors.request.use(async (config) => {
  if (typeof document !== 'undefined') {
    let match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    
    // If we're making a POST/PUT/PATCH/DELETE request and we don't have a CSRF token yet, fetch one
    if (!match && config.method && config.method.toLowerCase() !== 'get') {
      try {
        // Use a simple GET request to any endpoint to receive the CSRF cookie from the middleware
        await axios.get(`${config.baseURL}/health`, { withCredentials: true });
        match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
      } catch (error) {
        console.error('Failed to pre-fetch CSRF token:', error);
      }
    }

    if (match) {
      config.headers['x-xsrf-token'] = match[2];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      import('@/store/useAuthStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      });
    }
    return Promise.reject(error);
  }
);

export default api;
