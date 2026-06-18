/**
 * refundV2Api.js
 * Consolidated API client for the V2 Refund Management System.
 * Three role-scoped endpoint trees:
 *   Customer  → /api/v2/refunds/**
 *   Seller    → /api/v2/seller/refunds/**
 *   Admin     → /api/v2/admin/refunds/**
 */
import apiClient from './apiClient';

// ─── CUSTOMER ────────────────────────────────────────────────────────────────

/**
 * Open a new refund request.
 * @param {Object} data - { orderItemId, reason, description, refundType, requestedAmount }
 */
export const v2CreateRefund = (data) =>
  apiClient.post('/v2/refunds', data);

/** List own refunds (paginated). page and size are 0-indexed Spring Page params. */
export const v2GetCustomerRefunds = (page = 0, size = 50) =>
  apiClient.get('/v2/refunds', { params: { page, size, sort: 'createdAt,desc' } });

/** Full refund detail for a single refund. */
export const v2GetCustomerRefund = (refundId) =>
  apiClient.get(`/v2/refunds/${refundId}`);

/** Upload evidence files (multipart). files: File[], description: string */
export const v2UploadCustomerEvidence = (refundId, files, description = '') => {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  if (description) form.append('description', description);
  return apiClient.post(`/v2/refunds/${refundId}/evidence`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** Accept the current seller / admin offer. */
export const v2AcceptOffer = (refundId) =>
  apiClient.post(`/v2/refunds/${refundId}/accept-offer`);

/** Reject current offer → escalates to admin. */
export const v2RejectOffer = (refundId) =>
  apiClient.post(`/v2/refunds/${refundId}/reject-offer`);

/** Escalate a seller rejection to admin for independent review. */
export const v2EscalateToAdmin = (refundId) =>
  apiClient.post(`/v2/refunds/${refundId}/escalate`);

/** Accept seller rejection and close the case (no further action). */
export const v2AcceptRejection = (refundId) =>
  apiClient.post(`/v2/refunds/${refundId}/accept-rejection`);

/** Submit return shipment tracking info. data: { courier, trackingNumber } */
export const v2SubmitReturn = (refundId, data) =>
  apiClient.post(`/v2/refunds/${refundId}/return`, data);

/** Get message thread for a refund. */
export const v2GetCustomerMessages = (refundId) =>
  apiClient.get(`/v2/refunds/${refundId}/messages`);

/** Send a message on the refund thread. */
export const v2CustomerSendMessage = (refundId, message) =>
  apiClient.post(`/v2/refunds/${refundId}/messages`, { message });

/** Get audit timeline for a refund (read-only for customer). */
export const v2GetTimeline = (refundId) =>
  apiClient.get(`/v2/refunds/${refundId}/timeline`);

/** Confirm replacement received (customer). */
export const v2ConfirmReplacement = (refundId) =>
  apiClient.post(`/v2/refunds/${refundId}/confirm-replacement`);

// ─── SELLER ──────────────────────────────────────────────────────────────────

/** List seller's refunds (paginated). */
export const v2GetSellerRefunds = (page = 0, size = 50) =>
  apiClient.get('/v2/seller/refunds', { params: { page, size, sort: 'createdAt,desc' } });

/** Full refund detail — seller view. */
export const v2GetSellerRefund = (refundId) =>
  apiClient.get(`/v2/seller/refunds/${refundId}`);

/** Approve full refund. data: { note } */
export const v2SellerApprove = (refundId, data) =>
  apiClient.post(`/v2/seller/refunds/${refundId}/approve`, data);

/** Reject refund. data: { note } */
export const v2SellerReject = (refundId, data) =>
  apiClient.post(`/v2/seller/refunds/${refundId}/reject`, data);

/** Propose a partial refund amount. data: { offeredAmount, reason } */
export const v2SellerOfferPartial = (refundId, data) =>
  apiClient.post(`/v2/seller/refunds/${refundId}/offer-partial`, data);

/** Propose an exchange/replacement. data: { exchangeDetails, reason } */
export const v2SellerOfferExchange = (refundId, data) =>
  apiClient.post(`/v2/seller/refunds/${refundId}/offer-exchange`, data);

/** Verify a customer return (accept or reject). data: { condition, notes, accepted } */
export const v2SellerVerifyReturn = (refundId, data) =>
  apiClient.post(`/v2/seller/refunds/${refundId}/verify-return`, data);

/** Upload seller evidence. */
export const v2UploadSellerEvidence = (refundId, files, description = '') => {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  if (description) form.append('description', description);
  return apiClient.post(`/v2/seller/refunds/${refundId}/evidence`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** Get seller messages for a refund. */
export const v2GetSellerMessages = (refundId) =>
  apiClient.get(`/v2/seller/refunds/${refundId}/messages`);

/** Send a message on the refund thread (seller). */
export const v2SellerSendMessage = (refundId, message) =>
  apiClient.post(`/v2/seller/refunds/${refundId}/messages`, { message });

/** Ship replacement product (seller). data: { courier, trackingNumber } */
export const v2SellerShipReplacement = (refundId, data) =>
  apiClient.post(`/v2/seller/refunds/${refundId}/ship-replacement`, data);

// ─── ADMIN ───────────────────────────────────────────────────────────────────

/** List all refunds optionally filtered by status (paginated). */
export const v2AdminGetRefunds = (status = '', page = 0, size = 20) => {
  const params = { page, size, sort: 'createdAt,desc' };
  if (status) params.status = status;
  return apiClient.get('/v2/admin/refunds', { params });
};

/** Full refund detail — admin view. */
export const v2AdminGetRefund = (refundId) =>
  apiClient.get(`/v2/admin/refunds/${refundId}`);

/** Get immutable audit log for a refund. */
export const v2AdminGetAuditLog = (refundId) =>
  apiClient.get(`/v2/admin/refunds/${refundId}/audit`);

/** Force a full refund. data: { note, holdSellerLiable } */
export const v2AdminForceFullRefund = (refundId, data) =>
  apiClient.post(`/v2/admin/refunds/${refundId}/force-full-refund`, data);

/** Force a partial refund. data: { note, approvedAmount, holdSellerLiable } */
export const v2AdminForcePartialRefund = (refundId, data) =>
  apiClient.post(`/v2/admin/refunds/${refundId}/force-partial-refund`, data);

/** Force an exchange. data: { note, holdSellerLiable } */
export const v2AdminForceExchange = (refundId, data) =>
  apiClient.post(`/v2/admin/refunds/${refundId}/force-exchange`, data);

/** Reject the customer's claim (favour seller). data: { note } */
export const v2AdminRejectClaim = (refundId, data) =>
  apiClient.post(`/v2/admin/refunds/${refundId}/reject-claim`, data);

/** Approve a disputed return. data: { note } */
export const v2AdminApproveReturn = (refundId, data) =>
  apiClient.post(`/v2/admin/refunds/${refundId}/approve-return`, data);

/** Reject a disputed return. data: { note } */
export const v2AdminRejectReturn = (refundId, data) =>
  apiClient.post(`/v2/admin/refunds/${refundId}/reject-return`, data);

/** Send an admin message on the thread. */
export const v2AdminSendMessage = (refundId, message) =>
  apiClient.post(`/v2/admin/refunds/${refundId}/messages`, { message });

/** Get analytics summary for the admin dashboard. */
export const v2AdminGetAnalytics = () =>
  apiClient.get('/v2/admin/refunds/analytics');
