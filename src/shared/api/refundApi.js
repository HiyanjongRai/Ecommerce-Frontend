import apiClient from './apiClient';

// ─── CUSTOMER APIs ───────────────────────────────────────────────────────────

export const createRefund = (data) =>
  apiClient.post('/refunds', data);

export const uploadEvidence = (refundId, data) =>
  apiClient.post(`/refunds/${refundId}/evidence`, data);

export const uploadTracking = (refundId, data) =>
  apiClient.post(`/refunds/${refundId}/tracking`, data);

export const appealDecision = (refundId, data) =>
  apiClient.post(`/refunds/${refundId}/appeal`, data);

export const acceptOffer = (refundId) =>
  apiClient.post(`/refunds/${refundId}/accept-offer`);

export const submitPayoutDetails = (refundId, data) =>
  apiClient.post(`/refunds/${refundId}/payout-details`, data);

export const rejectOffer = (refundId) =>
  apiClient.post(`/refunds/${refundId}/reject-offer`);

export const negotiateOffer = (refundId, notes, amount) =>
  apiClient.post(`/refunds/${refundId}/negotiate?notes=${encodeURIComponent(notes)}${amount ? `&amount=${encodeURIComponent(amount)}` : ''}`);

export const escalateOffer = (refundId) =>
  apiClient.post(`/refunds/${refundId}/escalate-offer`);

export const acceptExchange = (refundId) =>
  apiClient.post(`/refunds/${refundId}/accept-exchange`);

export const rejectExchange = (refundId, data) =>
  apiClient.post(`/refunds/${refundId}/reject-exchange`, data);

export const getMyRefunds = () =>
  apiClient.get('/refunds/my');

export const getRefundDetails = (refundId) =>
  apiClient.get(`/refunds/${refundId}`);

export const uploadRefundFile = (file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post('/refunds/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ─── SELLER APIs ─────────────────────────────────────────────────────────────

export const getSellerRefunds = () =>
  apiClient.get('/seller/refunds');

export const approveSellerRefund = (refundId, returnRequired = true) =>
  apiClient.post(`/seller/refunds/${refundId}/approve?returnRequired=${returnRequired}`);

export const acceptNegotiation = (refundId) =>
  apiClient.post(`/seller/refunds/${refundId}/accept-negotiation`);

export const rejectSellerRefund = (refundId, notes) =>
  apiClient.post(`/seller/refunds/${refundId}/reject?notes=${encodeURIComponent(notes || '')}`);

export const escalateSellerRefund = (refundId) =>
  apiClient.post(`/seller/refunds/${refundId}/escalate`);

export const requestSellerEvidence = (refundId) =>
  apiClient.post(`/seller/refunds/${refundId}/request-evidence`);

export const confirmReturnReceived = (refundId) =>
  apiClient.post(`/seller/refunds/${refundId}/received`);

export const submitInspection = (refundId, data) =>
  apiClient.post(`/seller/refunds/${refundId}/inspection`, data);

export const offerPartialRefund = (refundId, data) =>
  apiClient.post(`/seller/refunds/${refundId}/partial-refund`, data);

export const offerFullRefund = (refundId, data) =>
  apiClient.post(`/seller/refunds/${refundId}/full-refund`, data);

export const offerExchange = (refundId, data) =>
  apiClient.post(`/seller/refunds/${refundId}/exchange`, data);

export const processRefundAfterInspection = (refundId) =>
  apiClient.post(`/seller/refunds/${refundId}/process-refund`);

export const processExchangeAfterInspection = (refundId) =>
  apiClient.post(`/seller/refunds/${refundId}/process-exchange`);

export const shipReplacement = (refundId, data) =>
  apiClient.post(`/seller/refunds/${refundId}/ship-replacement`, data);

// ─── ADMIN APIs ──────────────────────────────────────────────────────────────

export const getAdminRefunds = () =>
  apiClient.get('/admin/refunds');

export const getDisputes = () =>
  apiClient.get('/admin/refunds/disputes');

export const adminApproveRefund = (refundId) =>
  apiClient.post(`/admin/refunds/${refundId}/approve`);

export const adminRejectRefund = (refundId) =>
  apiClient.post(`/admin/refunds/${refundId}/reject`);

export const adminRequestEvidence = (refundId) =>
  apiClient.post(`/admin/refunds/${refundId}/request-evidence`);

export const processPayment = (refundId) =>
  apiClient.post(`/admin/refunds/${refundId}/process-payment`);

export const submitPayoutProof = (refundId, data) =>
  apiClient.post(`/seller/refunds/${refundId}/submit-payout`, data);

export const rejectPayoutProof = (refundId, reason) =>
  apiClient.post(`/admin/refunds/${refundId}/reject-payout?reason=${encodeURIComponent(reason)}`);
