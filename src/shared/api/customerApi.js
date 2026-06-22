import apiClient from './apiClient';

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const getCurrentUser = () =>
  apiClient.get('/auth/me');

export const customerLogin = (data) =>
  apiClient.post('/auth/login', { usernameOrEmail: data.identifier, password: data.password });

export const customerRegister = (data) =>
  apiClient.post('/auth/register', data);

export const refreshToken = () =>
  apiClient.post('/auth/refresh');

export const logout = () =>
  apiClient.post('/auth/logout');

export const upgradeToSeller = () =>
  apiClient.post('/auth/upgrade-to-seller');

export const requestPasswordReset = (email) =>
  apiClient.post('/auth/forgot-password', { email });

export const resetPasswordWithOtp = (data) =>
  apiClient.post('/auth/reset-password', data);

// ── PROFILE ───────────────────────────────────────────────────────────────────
export const getProfile = (userId) =>
  apiClient.get(`/users/${userId}`);

export const updateProfile = (userId, data) =>
  apiClient.put(`/users/${userId}`, data);

export const uploadProfileImage = (userId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post(`/users/${userId}/profile-image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// ── ADDRESSES ─────────────────────────────────────────────────────────────────
export const getAddresses = (userId) =>
  apiClient.get(`/addresses/user/${userId}`);

export const addAddress = (userId, data) =>
  apiClient.post(`/addresses/${userId}`, data);

export const updateAddress = (id, data) =>
  apiClient.put(`/addresses/${id}`, data);

export const deleteAddress = (id) =>
  apiClient.delete(`/addresses/${id}`);

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
export const getProducts = (params) =>
  apiClient.get('/products/page', { params });

export const getActiveBanners = () =>
  apiClient.get('/banners/active');

export const getActivePromos = () =>
  apiClient.get('/promos/active');

export const getProductById = (id) =>
  apiClient.get(`/products/${id}`);

export const getProductBySlug = (slug) =>
  apiClient.get(`/products/slug/${slug}`);

export const searchProducts = (query, params) =>
  apiClient.get('/products/search', { params: { keyword: query, ...params } });

export const getProductsByCategory = (categoryId, params) =>
  apiClient.get(`/products/category/${categoryId}`, { params });

export const getCategories = () =>
  apiClient.get('/categories');

// ── CART ──────────────────────────────────────────────────────────────────────
export const getCart = (userId) =>
  apiClient.get(`/cart/${userId}`);

export const addToCart = (userId, productId, data) =>
  apiClient.post(`/cart/${userId}/add/${productId}`, data);

export const updateCartQty = (userId, cartItemId, quantity) =>
  apiClient.put(`/cart/${userId}/update/${cartItemId}?qty=${quantity}`);

export const removeCartItem = (userId, cartItemId) =>
  apiClient.put(`/cart/${userId}/update/${cartItemId}?qty=0`);

export const clearCart = async (userId) => {
  // Since the backend doesn't have a direct /clear endpoint, we fetch and clear items by setting qty to 0
  try {
    const res = await getCart(userId);
    const items = res.data?.items || res.data || [];
    for (const item of items) {
      await removeCartItem(userId, item.cartItemId);
    }
  } catch (err) {
    console.error("Failed to clear cart", err);
    throw err;
  }
};

// ── WISHLIST ──────────────────────────────────────────────────────────────────
export const getWishlist = (userId) =>
  apiClient.get(`/wishlist/user/${userId}`);

export const addToWishlist = (userId, productId) =>
  apiClient.post(`/wishlist/${userId}/${productId}`);

export const removeFromWishlist = (userId, productId) =>
  apiClient.delete(`/wishlist/${userId}/${productId}`);

// ── ORDERS ───────────────────────────────────────────────────────────────────
export const getUserOrders = () =>
  apiClient.get(`/orders/my-orders`);

export const getUserOrdersSimple = () =>
  apiClient.get(`/orders/my-orders/list`);

export const getOrderDetail = (orderId) =>
  apiClient.get(`/orders/${orderId}`);

export const cancelOrder = (orderId) =>
  apiClient.put(`/orders/my-orders/cancel/${orderId}`);

export const previewOrder = (data) =>
  apiClient.post('/orders/preview', data);

export const placeOrder = (data) =>
  apiClient.post('/orders', data);

export const placeOrderFromCart = (data) =>
  apiClient.post('/orders/cart', data);

export const retryPayment = (orderId) =>
  apiClient.post(`/orders/${orderId}/retry-payment`);

export const changePaymentMethod = (orderId, method) =>
  apiClient.put(`/orders/${orderId}/payment-method?method=${method}`);

export const getEsewaSignature = (data) =>
  apiClient.post('/payment/esewa/signature', data);

export const verifyEsewaPayment = (data) =>
  apiClient.post('/payment/esewa/verify', { data });

export const initiateKhaltiPayment = (data) =>
  apiClient.post('/payment/khalti/initiate', data);

// ── REVIEWS ──────────────────────────────────────────────────────────────────
export const getReviewsForProduct = (productId) =>
  apiClient.get(`/reviews/product/${productId}`);

export const getMyReviews = (userId) =>
  apiClient.get(`/reviews/user/${userId}`);

export const submitReview = (data) =>
  apiClient.post('/reviews', data);

export const updateReview = (reviewId, data) =>
  apiClient.put(`/reviews/${reviewId}`, data);

export const deleteReview = (reviewId) =>
  apiClient.delete(`/reviews/${reviewId}`);

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export const getNotifications = (userId) =>
  apiClient.get(`/notifications`);

export const markNotifRead = (notifId) =>
  apiClient.put(`/notifications/${notifId}/read`);

// ── LOYALTY ───────────────────────────────────────────────────────────────────
export const getLoyaltyPoints = (userId) =>
  apiClient.get(`/loyalty/my-points`);

export const getLoyaltyWallet = () =>
  apiClient.get('/loyalty/wallet');

export const getLoyaltyTransactions = (params = {}) =>
  apiClient.get('/loyalty/transactions', { params });

export const quoteLoyaltyRedemption = (data) =>
  apiClient.post('/loyalty/redemption/quote', data);

// ── MESSAGES ──────────────────────────────────────────────────────────────────
export const getConversations = (userId) =>
  // Backend derives the user from JWT; there is no /messages/user/{id} endpoint.
  apiClient.get('/messages/inbox');

export const getSentMessages = () =>
  apiClient.get('/messages/sent');

export const sendMessage = (data) =>
  apiClient.post('/messages', data);

export const getSellerProfileById = (id) =>
  apiClient.get(`/seller-profiles/${id}`);

export const validatePromoCode = (code, items) => {
  return apiClient.post('/promos/validate', { code, items });
};

// ── REFUNDS ──────────────────────────────────────────────────────────────────

/** Open a new refund. data must include: { orderItemId, reason, description, refundType, requestedAmount } */
export const requestRefund = (_orderId, data) => apiClient.post('/refunds', data);

/** List own refunds. */
export const getCustomerRefunds = () => apiClient.get('/refunds/my');

/** Full detail for a single refund. */
export const getRefundDetails = (refundId) => apiClient.get(`/refunds/${refundId}`);

/** Upload additional evidence files. */
export const uploadRefundEvidence = (refundId, files, description = '') => {
  if (files && files.length > 0) {
    const file = Array.isArray(files) ? files[0] : files;
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/refunds/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => {
      const fileUrl = res.data?.fileUrl;
      return apiClient.post(`/refunds/${refundId}/evidence`, { fileUrl, note: description });
    });
  }
  return apiClient.post(`/refunds/${refundId}/evidence`, { fileUrl: '', note: description });
};

/** Submit return shipment tracking. data: { courier, trackingNumber } */
export const submitRefundReturnShipment = (refundId, data) =>
  apiClient.post(`/refunds/${refundId}/tracking`, data);

/** Escalate seller rejection to admin. */
export const escalateRefundToAdmin = (refundId, _comment) =>
  apiClient.post(`/refunds/${refundId}/escalate-offer`);

/** Accept current partial/exchange offer. */
export const acceptRefundOffer = (refundId) => apiClient.post(`/refunds/${refundId}/accept-offer`);

/** Reject current offer → escalates automatically to admin. */
export const rejectRefundOffer = (refundId) => apiClient.post(`/refunds/${refundId}/reject-offer`);

/** Confirm receipt of the replacement item (customer). */
export const confirmReplacementReceipt = (refundId) => apiClient.post(`/refunds/${refundId}/accept-exchange`);

/** Accept seller rejection and close case (customer chooses not to escalate). */
export const closeCustomerRejectedCase = (refundId, data) => apiClient.post(`/refunds/${refundId}/reject-exchange`, data);

/** Get message thread for a refund. */
export const getRefundMessages = (refundId) => Promise.resolve({ data: [] });

/** Send a message on the refund thread. */
export const sendRefundMessage = (refundId, message) => Promise.resolve({ data: {} });

/** Get the immutable audit/timeline log. */
export const getRefundTimeline = (refundId) => Promise.resolve({ data: [] });

// ── LEGACY STUBS (no-op in v2 — kept to avoid import errors) ──────────────
/** @deprecated v2 does not support cancel via customer. */
export const cancelRefund = () =>
  Promise.reject(new Error('Cancel not supported in v2. Close case instead.'));

/** @deprecated v2 does not support arbitrary status updates from customer. */
export const updateCustomerRefundStatus = () =>
  Promise.reject(new Error('updateCustomerRefundStatus is not supported in v2.'));

/** @deprecated Replacement flow is handled by exchange offer in v2. */
export const completeCustomerReplacement = () =>
  Promise.reject(new Error('completeCustomerReplacement is not supported in v2.'));

// ── DISPUTES ──────────────────────────────────────────────────────────────────
export const openDispute = async (data) => {
  const orderRes = await getOrderDetail(data.orderId);
  const order = orderRes.data;
  if (!order || !order.items || order.items.length === 0) {
    throw new Error('No items found in this order to dispute.');
  }
  const payload = {
    orderId: data.orderId,
    type: 'REFUND',
    reason: data.type || 'OTHER',
    description: data.description || '',
    fileUrls: [],
    items: order.items.map(item => ({
      orderItemId: item.id,
      quantity: item.quantity
    }))
  };
  return apiClient.post('/refunds', payload);
};

export const getCustomerDisputes = (buyerId) =>
  apiClient.get('/refunds/my');

export const getDisputeDetails = (disputeId) =>
  apiClient.get(`/refunds/${disputeId}`);

export const getDisputeMessages = (disputeId) =>
  Promise.resolve({ data: [] });

export const sendDisputeMessage = (disputeId, data) =>
  Promise.resolve({ data: {} });

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const reportProduct = (data) =>
  apiClient.post('/v1/reports/product', data);

export const reportSeller = (data) =>
  apiClient.post('/v1/reports/seller', data);

// ── TOP SELLERS ──────────────────────────────────────────────────────────────
export const getTopSellers = (limit = 24) =>
  apiClient.get('/homepage/top-sellers', { params: { limit } });

export const getTopRatedSellers = (limit = 24) =>
  apiClient.get('/homepage/top-rated-sellers', { params: { limit } });


