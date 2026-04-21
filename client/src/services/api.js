import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* Request interceptor */
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

/* Response interceptor — handle token refresh */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    /* Show error toast for actual server errors only (not connection refused) */
    if (error.response?.status >= 500 && error.response?.status < 600) {
      // Only toast once per 5 seconds to avoid spam
      if (!api._lastErrorToast || Date.now() - api._lastErrorToast > 5000) {
        api._lastErrorToast = Date.now();
        toast.error('Server error. Please try again later.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
