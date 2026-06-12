import axios from 'axios';
import { getAccessToken, setAccessToken, clearAuthStorage } from './authStorage';
import { toast } from '../contexts/ToastContext';
import { attachApiErrorMessage } from './errorHandler';

export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
export const API_BASE_URL = `${BASE_URL}/api`;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search',
  },
  CART: '/cart',
  ORDERS: '/orders',
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post(ENDPOINTS.AUTH.REFRESH)
      .then((res) => {
        const newToken = res?.data?.accessToken;
        if (newToken) setAccessToken(newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;

    if (status === 401 && originalRequest && !originalRequest.__isRetryRequest) {
      originalRequest.__isRetryRequest = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(originalRequest);
        }
      } catch (refreshError) {
        // ignore refresh failures, fall through to normal error handling
      }
      clearAuthStorage();
    }

    const normalizedError = attachApiErrorMessage(error);
    const shouldToast = !originalRequest?.suppressGlobalErrorToast;
    if (shouldToast && normalizedError.userMessage) {
      toast(normalizedError.userMessage, 'error');
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;

