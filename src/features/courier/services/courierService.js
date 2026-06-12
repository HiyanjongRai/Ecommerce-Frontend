import axios from 'axios';
import { API_BASE_URL } from '../../../shared/api/apiConfig';
import { attachApiErrorMessage } from '../../../shared/api/errorHandler';
import { toast } from '../../../shared/contexts/ToastContext';

// Courier JWT is stored separately from user JWT
const COURIER_TOKEN_KEY = 'courier_token';
const COURIER_INFO_KEY = 'courier_info';

export const getCourierToken = () => localStorage.getItem(COURIER_TOKEN_KEY);
export const setCourierToken = (token) => localStorage.setItem(COURIER_TOKEN_KEY, token);
export const clearCourierToken = () => {
  localStorage.removeItem(COURIER_TOKEN_KEY);
  localStorage.removeItem(COURIER_INFO_KEY);
};
export const getCourierInfo = () => {
  try { return JSON.parse(localStorage.getItem(COURIER_INFO_KEY)); } catch { return null; }
};
export const setCourierInfo = (info) => localStorage.setItem(COURIER_INFO_KEY, JSON.stringify(info));

// Dedicated axios instance for courier endpoints
const courierClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

courierClient.interceptors.request.use((config) => {
  const token = getCourierToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

courierClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = attachApiErrorMessage(error);
    toast(normalizedError.userMessage, 'error');
    return Promise.reject(normalizedError);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const courierLogin = (email, password) =>
  courierClient.post('/courier/login', { email, password });

// ── Shipments ─────────────────────────────────────────────────────────────────
export const getCourierAssignedShipments = () =>
  courierClient.get('/courier/assigned');

// ── Tracking / Status Update ──────────────────────────────────────────────────
export const updateTrackingStatus = (payload) =>
  courierClient.put('/tracking/update', payload);
// payload: { trackingId, status, location, note, otp?, collectedAmount? }

export const resendDeliveryOtp = (trackingId) =>
  courierClient.post(`/tracking/${trackingId}/resend-otp`);



