import apiClient from '../../../shared/api/apiConfig';

export const getAdminAnalytics = () =>
  apiClient.get('/admin/analytics');

export const getAdminOrders = () =>
  apiClient.get('/admin/orders');

export const updateAdminOrderStatus = (orderId, status) =>
  apiClient.put(`/admin/orders/${orderId}/status`, null, { params: { status } });

export const deliverAdminOrder = (orderId) =>
  apiClient.put(`/admin/orders/${orderId}/deliver-manually`);

export const getAdminUsers = () =>
  apiClient.get('/admin/users');

export const getAdminUser = (userId) =>
  apiClient.get(`/admin/users/${userId}`);

export const blockAdminUser = (userId) =>
  apiClient.put(`/admin/users/${userId}/block`);

export const unblockAdminUser = (userId) =>
  apiClient.put(`/admin/users/${userId}/unblock`);

export const getAdminSellers = () =>
  apiClient.get('/admin/sellers');

export const getAdminProducts = (page = 0, size = 50) =>
  apiClient.get('/admin/products', { params: { page, size } });

export const setAdminProductVisibility = (productId, visible) =>
  apiClient.put(`/admin/products/${productId}/visibility`, null, { params: { visible } });

export const getAdminBanners = () =>
  apiClient.get('/admin/banners');

export const uploadAdminBannerImage = (formData) =>
  apiClient.post('/admin/banners/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const createAdminBanner = (payload) => {
  const fd = new FormData();
  Object.keys(payload).forEach(key => {
    if (payload[key] !== null && payload[key] !== undefined) {
      fd.append(key, payload[key]);
    }
  });
  return apiClient.post('/admin/banners', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateAdminBanner = (bannerId, payload) => {
  const fd = new FormData();
  Object.keys(payload).forEach(key => {
    if (payload[key] !== null && payload[key] !== undefined) {
      fd.append(key, payload[key]);
    }
  });
  return apiClient.put(`/admin/banners/${bannerId}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const toggleAdminBanner = (bannerId) =>
  apiClient.patch(`/admin/banners/${bannerId}/toggle`);

export const deleteAdminBanner = (bannerId) =>
  apiClient.delete(`/admin/banners/${bannerId}`);

export const attachAdminBannerProduct = (bannerId, productId) =>
  apiClient.post(`/admin/banners/${bannerId}/products`, { productId });

export const detachAdminBannerProduct = (bannerId, productId) =>
  apiClient.delete(`/admin/banners/${bannerId}/products/${productId}`);

export const getAdminCampaigns = () =>
  apiClient.get('/admin/campaigns');

export const createAdminCampaign = (payload) =>
  apiClient.post('/admin/campaigns', payload);

export const createAdminCampaignWithImage = (formData) =>
  apiClient.post('/admin/campaigns/with-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteAdminCampaign = (campaignId) =>
  apiClient.delete(`/admin/campaigns/${campaignId}`);

export const getAdminCampaignProducts = (campaignId) =>
  apiClient.get(`/admin/campaigns/${campaignId}/products`);

export const getAdminCampaignPendingProducts = (campaignId) =>
  apiClient.get(`/admin/campaigns/${campaignId}/pending-products`);

export const approveAdminCampaignProduct = (productCampaignId) =>
  apiClient.post(`/admin/campaigns/approve-product/${productCampaignId}`);

export const rejectAdminCampaignProduct = (productCampaignId) =>
  apiClient.post(`/admin/campaigns/reject-product/${productCampaignId}`);

export const getAdminPayments = () =>
  apiClient.get('/admin/payments');

export const getAdminPaymentEvents = (paymentId) =>
  apiClient.get(`/admin/payments/${paymentId}/events`);

export const getAdminCommissions = () =>
  apiClient.get('/admin/commissions');

export const sendCommissionReminder = (orderId) =>
  apiClient.post(`/admin/commissions/${orderId}/remind`);

export const getPendingSellerApplications = () =>
  apiClient.get('/admin/sellers/applications/pending');

export const approveSellerApplication = (appId, note) =>
  apiClient.post(`/admin/sellers/applications/${appId}/approve`, { note });

export const rejectSellerApplication = (appId, note) =>
  apiClient.post(`/admin/sellers/applications/${appId}/reject`, { note });

export const getSellerOrders = (sellerId) =>
  apiClient.get(`/admin/sellers/${sellerId}/orders`);

export const getAdminAuditLogs = (q = '', page = 0, size = 50) => {
  const params = { page, size };
  if (q) params.q = q;
  return apiClient.get('/admin/audit-logs', { params });
};

// ── ADMIN REPORTS ─────────────────────────────────────────────────────────────
export const getAdminReports = (type, status = '') => {
  const params = { type };
  if (status) params.status = status;
  return apiClient.get('/v1/admin/reports', { params });
};

export const resolveProductReport = (reportId, data) =>
  apiClient.put(`/v1/reports/product/${reportId}`, data);

export const resolveSellerReport = (reportId, data) =>
  apiClient.put(`/v1/reports/seller/${reportId}`, data);

export const resolveCustomerReport = (reportId, data) =>
  apiClient.put(`/v1/reports/customer/${reportId}`, data);

export const getProductReportByReference = (publicReferenceId) =>
  apiClient.get(`/v1/reports/product/ref/${publicReferenceId}`);

export const getSellerReportByReference = (publicReferenceId) =>
  apiClient.get(`/v1/reports/seller/ref/${publicReferenceId}`);

export const getCustomerReportByReference = (publicReferenceId) =>
  apiClient.get(`/v1/reports/customer/ref/${publicReferenceId}`);

// ── ADMIN REFUNDS ─────────────────────────────────────────────────────────────
export const getAdminRefunds = (status = '') => {
  const params = {};
  if (status) params.status = status;
  return apiClient.get('/v1/refunds', { params });
};

export const getRefundByReference = (publicReferenceId) =>
  apiClient.get(`/v1/refunds/ref/${publicReferenceId}`);

// Admin review helpers
export const getAdminReviews = () =>
  apiClient.get('/admin/reviews');

export const deleteAdminReview = (reviewId) =>
  apiClient.delete(`/admin/reviews/${reviewId}`);

// Admin promo helpers
export const getAdminPromos = () =>
  apiClient.get('/promos');

export const createAdminPromo = (payload) =>
  apiClient.post('/promos', payload);

export const updateAdminPromo = (promoId, payload) =>
  apiClient.put(`/promos/${promoId}`, payload);

export const deleteAdminPromo = (promoId) =>
  apiClient.delete(`/promos/${promoId}`);

export const adminFinalizeRefund = (refundId, approve, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/admin-finalize`, null, { params: { approve, comment } });

export const adminConfirmRefundCompletion = (refundId, providerReference, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/confirm-completion`, null, { params: { providerReference, comment } });

export const adminRequestRefundEvidence = (refundId, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/request-evidence`, null, { params: { comment } });

export const adminUpdateRefundStatus = (refundId, status, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/status`, null, { params: { status, comment } });

export const adminConfirmRefundCompletionWithAmount = (refundId, providerReference, refundAmount, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/confirm-completion`, null, { params: { providerReference, refundAmount, comment } });

export const adminInspectRefundReturn = (refundId, data) =>
  apiClient.put(`/v1/refunds/${refundId}/inspection`, data);

export const adminRecordRefundPaymentEvent = (refundId, data) =>
  apiClient.put(`/v1/refunds/${refundId}/payment-event`, data);

// ── ADMIN DISPUTES ────────────────────────────────────────────────────────────
export const getAdminDisputes = (status = '') => {
  const params = {};
  if (status) params.status = status;
  return apiClient.get('/v1/disputes', { params });
};

export const getDisputeByReference = (publicReferenceId) =>
  apiClient.get(`/v1/disputes/ref/${publicReferenceId}`);

export const adminArbitrateDispute = (disputeId, data) =>
  apiClient.put(`/v1/disputes/${disputeId}/arbitrate`, data);

// ── ADMIN MESSAGING / INBOX ───────────────────────────────────────────────────
export const getAdminInbox = () =>
  apiClient.get('/admin/messages/inbox');

export const getAdminSentMessages = () =>
  apiClient.get('/admin/messages/sent');

export const sendAdminMessage = (payload) =>
  apiClient.post('/admin/messages/send', payload);

export const broadcastAdminMessage = (content) =>
  apiClient.post('/admin/messages/broadcast', { content });


