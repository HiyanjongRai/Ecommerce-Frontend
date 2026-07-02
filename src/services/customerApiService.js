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
  apiClient.post('/reviews', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateReview = (reviewId, data) =>
  apiClient.put(`/reviews/${reviewId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

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

// ── REFUNDS ───────────────────────────────────────────────────────────────────
export const requestRefund = (orderId, data, evidencePhoto) => {
  if (evidencePhoto) {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    formData.append('evidencePhoto', evidencePhoto);
    return apiClient.post(`/v1/refunds/order/${orderId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return apiClient.post(`/v1/refunds/order/${orderId}`, data);
};

export const getCustomerRefunds = () =>
  apiClient.get('/v1/refunds'); // Filters by user implicitly if not admin

export const getRefundDetails = (refundId) =>
  apiClient.get(`/v1/refunds/${refundId}`);

export const uploadRefundEvidence = (refundId, evidencePhotos, note = '') => {
  const formData = new FormData();
  const files = Array.isArray(evidencePhotos) ? evidencePhotos : [evidencePhotos];
  files.filter(Boolean).forEach((file) => {
    formData.append('evidencePhotos', file);
  });
  if (note) formData.append('note', note);
  return apiClient.post(`/v1/refunds/${refundId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const submitRefundReturnShipment = (refundId, data) =>
  apiClient.put(`/v1/refunds/${refundId}/return-shipment`, null, { params: data });

export const escalateRefundToAdmin = (refundId, comment) =>
  apiClient.put(`/v1/refunds/${refundId}/status`, null, {
    params: { status: 'ESCALATED_TO_DISPUTE', comment },
  });

export const completeCustomerReplacement = (refundId) =>
  apiClient.put(`/v1/refunds/${refundId}/replacement-complete`);

export const closeCustomerRejectedCase = (refundId) =>
  apiClient.put(`/v1/refunds/${refundId}/close`);

// ── DISPUTES ──────────────────────────────────────────────────────────────────
export const openDispute = (data) =>
  apiClient.post('/v1/disputes', data);

export const getCustomerDisputes = (buyerId) =>
  apiClient.get('/v1/disputes', { params: { buyerId } });

export const getDisputeDetails = (disputeId) =>
  apiClient.get(`/v1/disputes/${disputeId}`);

export const getDisputeMessages = (disputeId) =>
  apiClient.get(`/v1/disputes/${disputeId}/messages`);

export const sendDisputeMessage = (disputeId, data) =>
  apiClient.post(`/v1/disputes/${disputeId}/messages`, data);

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const reportProduct = (data) =>
  apiClient.post('/v1/reports/product', data);

export const reportSeller = (data) =>
  apiClient.post('/v1/reports/seller', data);
