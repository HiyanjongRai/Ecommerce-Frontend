import apiClient from '../../../shared/api/apiConfig';
import {
  v2GetSellerRefunds,
  v2GetSellerRefund,
  v2SellerApprove,
  v2SellerReject,
  v2SellerOfferPartial,
  v2SellerOfferExchange,
  v2SellerVerifyReturn,
  v2UploadSellerEvidence,
  v2GetSellerMessages,
  v2SellerSendMessage,
  v2SellerShipReplacement,
} from '../../../shared/api/refundV2Api';

export const getSellerProfile = () => {
  return apiClient.get('/seller/me');
};

export const updateSellerProfile = (formData) => {
  return apiClient.put('/seller/me', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getSellerDashboardStats = () => {
  return apiClient.get('/seller/me/stats');
};

export const getSellerIncome = () => {
  return apiClient.get('/seller/me/income');
};

export const getSellerCommissions = () => {
  return apiClient.get('/seller/me/commissions');
};

export const getEsewaCommissionSignature = (data) => {
  return apiClient.post('/payment/esewa/commission/signature', data);
};

export const initiateKhaltiCommissionPayment = (data) => {
  return apiClient.post('/payment/khalti/commission/initiate', data);
};

export const getSellerProducts = (sellerUserId) => {
  return apiClient.get(`/products/seller/${sellerUserId}/all`);
};

export const getSellerInventory = () => {
  return apiClient.get('/products/my-inventory');
};

export const createSellerProduct = (formData) => {
  return apiClient.post('/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateSellerProductStatus = (productId, status) => {
  return apiClient.put(`/products/${productId}/status`, null, { params: { status } });
};

export const updateSellerProduct = (productId, formData) => {
  return apiClient.put(`/products/${productId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteSellerProduct = (productId) => {
  return apiClient.delete(`/products/${productId}/hard`);
};

export const getProductDetail = (productId) => {
  return apiClient.get(`/products/${productId}`);
};


export const getSellerOrders = (sellerUserId) => {
  return apiClient.get(`/orders/seller/${sellerUserId}`);
};

export const getSellerOrderDetail = (orderId) => {
  return apiClient.get(`/orders/${orderId}`);
};

export const processSellerOrder = (sellerUserId, orderId) => {
  return apiClient.put(`/orders/seller/${sellerUserId}/process/${orderId}`);
};

export const cancelSellerOrder = (sellerUserId, orderId, reason) => {
  return apiClient.put(`/orders/seller/${sellerUserId}/cancel/${orderId}`, null, { params: { reason } });
};

export const assignSellerOrderBranch = (sellerUserId, orderId, branch) => {
  return apiClient.put(`/orders/seller/${sellerUserId}/assign/${orderId}`, { branch });
};

export const expressDispatchSellerOrder = (sellerUserId, orderId, branch) => {
  return apiClient.put(`/orders/seller/${sellerUserId}/express-dispatch/${orderId}`, { branch });
};

export const getSellerCampaigns = () => {
  return apiClient.get('/seller/campaigns/upcoming');
};

export const joinSellerCampaign = (payload) => {
  return apiClient.post('/seller/campaigns/join', payload);
};

export const getSellerConversations = () => {
  return apiClient.get('/messages/inbox');
};

export const getSellerSentMessages = () => {
  return apiClient.get('/messages/sent');
};

export const sendSellerMessage = (payload) => {
  return apiClient.post('/messages', payload);
};

export const getUnreadMessageCount = () => {
  return apiClient.get('/messages/unread-count', { suppressGlobalErrorToast: true });
};

export const markSellerMessagesRead = (senderId) => {
  return apiClient.post(`/messages/mark-read/${senderId}`);
};

export const getSellerApplicationStatus = (userId) => {
  return apiClient.get(`/auth/seller/${userId}/application-status`);
};

export const submitSellerApplication = (formData) => {
  return apiClient.post('/sellers/application', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateSellerOrderStatus = (orderId, status) => {
  return apiClient.put(`/orders/${orderId}/status`, { status });
};

export const getSellerPromos = (sellerId) => {
  return apiClient.get(`/promos/seller/${sellerId}`);
};

export const createSellerPromo = (promoData) => {
  return apiClient.post('/promos', promoData);
};

export const getSellerInventoryAlerts = () => {
  return apiClient.get('/inventory-alerts/my-alerts');
};

export const getSellerUnacknowledgedAlerts = () => {
  return apiClient.get('/inventory-alerts/unacknowledged');
};

export const acknowledgeSellerInventoryAlert = (alertId) => {
  return apiClient.post(`/inventory-alerts/${alertId}/acknowledge`);
};

export const createSellerShipment = (orderId) => {
  return apiClient.post(`/shipment/create/${orderId}`);
};

// ── REFUNDS (V2) ──────────────────────────────────────────────────────────
/** List seller's refunds (up to 200 for client-side filtering). */
export const getSellerRefundRequests = () => v2GetSellerRefunds(0, 200);

/** Full detail of a single refund — seller view. */
export const getSellerRefundDetail = (refundId) => v2GetSellerRefund(refundId);

/** Approve and process full refund. data: { note } */
export const approveRefund = (refundId, data) => v2SellerApprove(refundId, data);

/** Reject refund request. data: { note } */
export const rejectRefund = (refundId, data) => v2SellerReject(refundId, data);

/** Propose a partial refund to the customer. data: { offeredAmount, reason } */
export const offerPartialRefund = (refundId, data) => v2SellerOfferPartial(refundId, data);

/** Propose an exchange / replacement. data: { exchangeDetails, reason } */
export const offerExchange = (refundId, data) => v2SellerOfferExchange(refundId, data);

/** Verify a returned item. data: { condition, notes, accepted } */
export const verifyReturn = (refundId, data) => v2SellerVerifyReturn(refundId, data);

/** Ship replacement product (seller). data: { courier, trackingNumber } */
export const shipReplacement = (refundId, data) => v2SellerShipReplacement(refundId, data);

/** Upload seller-side evidence files. */
export const uploadSellerEvidence = (refundId, files, description = '') =>
  v2UploadSellerEvidence(refundId, Array.isArray(files) ? files : [files], description);

/** Get message thread. */
export const getRefundMessages = (refundId) => v2GetSellerMessages(refundId);

/** Send a message on the refund thread. */
export const sendRefundMessage = (refundId, message) =>
  v2SellerSendMessage(refundId, message);

// ── LEGACY STUBS (deprecated in v2) ─────────────────────────────────────
/** @deprecated Use approveRefund or rejectRefund instead. */
export const respondToRefund = () =>
  Promise.reject(new Error('respondToRefund: use approveRefund / rejectRefund in v2.'));
export const updateRefundStatus = () =>
  Promise.reject(new Error('updateRefundStatus: not supported in v2.'));
export const requestRefundEvidence = () =>
  Promise.reject(new Error('requestRefundEvidence: use seller message thread in v2.'));
export const requestRefundReturn = () =>
  Promise.reject(new Error('requestRefundReturn: return is customer-initiated in v2.'));
export const confirmSellerRefundCompletion = () =>
  Promise.reject(new Error('confirmSellerRefundCompletion: not supported in v2.'));
export const inspectRefundReturn = (refundId, data) => v2SellerVerifyReturn(refundId, data);
export const assignReturnPickup   = () => Promise.resolve();
export const confirmReturnReceived = () => Promise.resolve();
export const assignReplacementPickup  = () => Promise.resolve();
export const markReplacementShipped   = () => Promise.resolve();
export const markOldItemCollected     = () => Promise.resolve();
export const markReplacementDelivered = () => Promise.resolve();

// ── DISPUTES ──────────────────────────────────────────────────────────────────
export const submitDisputeEvidence = (disputeId, data) =>
  apiClient.put(`/v1/disputes/${disputeId}/seller-evidence`, data);

export const getSellerDisputeList = (sellerId) =>
  apiClient.get('/v1/disputes', { params: { sellerId } });

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const reportCustomer = (data) =>
  apiClient.post('/v1/reports/customer', data);

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
// Uses suppressGlobalErrorToast so a 401 (role mismatch) is handled gracefully
export const getSellerNotifications = () =>
  apiClient.get('/notifications', { suppressGlobalErrorToast: true });

export const markSellerNotifRead = (notifId) =>
  apiClient.put(`/notifications/${notifId}/read`, null, { suppressGlobalErrorToast: true });
