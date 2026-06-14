import apiClient from '../../../shared/api/apiConfig';

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

// ── REFUNDS ───────────────────────────────────────────────────────────────────
export const respondToRefund = (refundId, action, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/seller-response`, null, { params: { action, comment } });

export const updateRefundStatus = (refundId, status, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/status`, null, { params: { status, comment } });

export const requestRefundEvidence = (refundId, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/request-evidence`, null, { params: { comment } });

export const requestRefundReturn = (refundId, data) =>
  apiClient.put(`/v1/refunds/${refundId}/return-request`, null, { params: data });

export const confirmSellerRefundCompletion = (refundId, data) => {
  if (data?.proof) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });
    return apiClient.put(`/v1/refunds/${refundId}/seller-confirm-completion`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return apiClient.put(`/v1/refunds/${refundId}/seller-confirm-completion`, null, { params: data });
};

export const inspectRefundReturn = (refundId, data) =>
  apiClient.put(`/v1/refunds/${refundId}/inspection`, data);

export const getSellerRefundRequests = (sellerId) =>
  apiClient.get('/v1/refunds', { params: { sellerId } });

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
