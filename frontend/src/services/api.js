import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retrying
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // If the refresh call itself failed, log out immediately to avoid loops
      if (originalRequest.url === '/api/v1/auth/refresh') {
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Hit refresh endpoint to get new access token (backend reads HTTP-only refresh cookie)
        const response = await refreshClient.post('/api/v1/auth/refresh', {});
        const { accessToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, revoked, or expired -> force logout
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
