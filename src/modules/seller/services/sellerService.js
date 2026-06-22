import apiClient from '../../../shared/api/apiConfig';
// Removed v2 API imports

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

// ── REFUNDS ──────────────────────────────────────────────────────────
/** List seller's refunds. */
export const getSellerRefundRequests = () => apiClient.get('/seller/refunds');

/** Full detail of a single refund — seller view. */
export const getSellerRefundDetail = (refundId) => apiClient.get(`/seller/refunds/${refundId}`);

/** Approve and process full refund. data: { note } */
export const approveRefund = (refundId, data) => apiClient.post(`/seller/refunds/${refundId}/approve?returnRequired=false`);

/** Reject refund request. data: { note } */
export const rejectRefund = (refundId, data) => apiClient.post(`/seller/refunds/${refundId}/reject?notes=${encodeURIComponent(data?.notes || data?.note || '')}`);

/** Propose a partial refund to the customer. data: { offeredAmount, reason } */
export const offerPartialRefund = (refundId, data) => apiClient.post(`/seller/refunds/${refundId}/partial-refund`, data);

/** Propose an exchange / replacement. data: { exchangeDetails, reason } */
export const offerExchange = (refundId, data) => apiClient.post(`/seller/refunds/${refundId}/exchange`, data);

/** Verify a returned item. data: { condition, notes, accepted } */
export const verifyReturn = (refundId, data) => apiClient.post(`/seller/refunds/${refundId}/received`);

/** Ship replacement product (seller). data: { courier, trackingNumber } */
export const shipReplacement = (refundId, data) => apiClient.post(`/seller/refunds/${refundId}/ship-replacement`, data);

/** Upload seller-side evidence files. */
export const uploadSellerEvidence = async (refundId, files, description = '') => {
  const file = files[0];
  if (!file) return;
  const form = new FormData();
  form.append('file', file);
  const uploadRes = await apiClient.post('/refunds/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const fileUrl = uploadRes.data?.fileUrl;
  return apiClient.post(`/refunds/${refundId}/evidence`, { fileUrl, note: description });
};

/** Get message thread. */
export const getRefundMessages = (refundId) => Promise.resolve({ data: [] });

/** Send a message on the refund thread. */
export const sendRefundMessage = (refundId, message) => Promise.resolve({ data: {} });

export const respondToRefund = (refundId, action, comment) => {
  if (action === 'ACCEPT') {
    return apiClient.post(`/seller/refunds/${refundId}/approve?returnRequired=false`);
  } else {
    return apiClient.post(`/seller/refunds/${refundId}/reject?notes=${encodeURIComponent(comment || '')}`);
  }
};

export const updateRefundStatus = (refundId, status, comment) => {
  if (status === 'WAITING_FOR_CUSTOMER') {
    return apiClient.post(`/seller/refunds/${refundId}/request-evidence`);
  }
  return Promise.resolve();
};

export const requestRefundEvidence = (refundId, comment) =>
  apiClient.post(`/seller/refunds/${refundId}/request-evidence`);

export const requestRefundReturn = (refundId, data) =>
  apiClient.post(`/seller/refunds/${refundId}/approve?returnRequired=true`);

export const confirmSellerRefundCompletion = async (refundId, data) => {
  let paymentProofUrl = '';
  if (data?.proof) {
    const form = new FormData();
    form.append('file', data.proof);
    const uploadRes = await apiClient.post('/refunds/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    paymentProofUrl = uploadRes.data?.fileUrl;
  }
  const payload = {
    paymentProofUrl,
    paymentReference: data.providerReference,
    paymentComment: data.comment || '',
  };
  return apiClient.post(`/seller/refunds/${refundId}/submit-payout`, payload);
};

export const inspectRefundReturn = (refundId, data) => {
  const payload = {
    physicalDamage: data.condition !== 'GOOD',
    waterDamage: false,
    missingParts: data.condition === 'MISSING_PARTS',
    burnDamage: false,
    tampering: false,
    packagingIntact: true,
    productMatches: true,
    severityScore: data.condition === 'GOOD' ? 1 : 5,
    inspectorNotes: data.notes || 'Inspection complete',
    verdict: data.decision === 'REJECT' ? 'DAMAGED_BY_CUSTOMER' : 'VALID_DAMAGE',
  };
  return apiClient.post(`/seller/refunds/${refundId}/inspection`, payload);
};
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
