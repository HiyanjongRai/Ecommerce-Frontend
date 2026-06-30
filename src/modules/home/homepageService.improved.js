/**
 * Homepage Service
 * Centralized API calls for all homepage data
 * Includes error handling, timeout management, and request logging
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * API Request wrapper with timeout and error handling
 * 
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Request timeout: ${endpoint}`);
      throw new Error('Request timeout - please try again');
    }
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Get homepage aggregated data
 * Includes banners, recommendations, and general homepage data
 * 
 * @param {number} limit - Number of items to return
 * @returns {Promise<object>} Aggregated homepage data
 */
export async function getHomepageAggregated(limit = 8) {
  return apiRequest(`/api/homepage/aggregated?limit=${limit}`);
}

/**
 * Get products with highest discounts (Flash Deals)
 * 
 * @param {number} limit - Number of products
 * @returns {Promise<array>} Products with highest discounts
 */
export async function getHighestDiscountProducts(limit = 6) {
  return apiRequest(`/api/products/highest-discount?limit=${limit}`);
}

/**
 * Get featured/promoted products
 * 
 * @param {number} limit - Number of products
 * @returns {Promise<array>} Featured products
 */
export async function getFeaturedProducts(limit = 6) {
  return apiRequest(`/api/products/featured?limit=${limit}`);
}

/**
 * Get best-selling products
 * 
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Items per page
 * @returns {Promise<object>} Best sellers with pagination
 */
export async function getBestSellers(page = 0, size = 6) {
  return apiRequest(`/api/products/bestsellers?page=${page}&size=${size}`);
}

/**
 * Get new arrival products
 * Products added in last 30 days
 * 
 * @param {number} limit - Number of products
 * @returns {Promise<array>} New arrival products
 */
export async function getNewArrivalProducts(limit = 4) {
  return apiRequest(`/api/products/new-arrivals?limit=${limit}`);
}

/**
 * Get personalized product recommendations
 * Based on user browsing history and purchases
 * 
 * @param {number} limit - Number of recommendations
 * @param {string} userId - Optional user ID for personalization
 * @returns {Promise<array>} Recommended products
 */
export async function getRecommendations(limit = 6, userId = null) {
  let url = `/api/products/recommendations?limit=${limit}`;
  if (userId) {
    url += `&userId=${userId}`;
  }
  return apiRequest(url);
}

/**
 * Get all product categories
 * Includes category names, slugs, and product counts
 * 
 * @returns {Promise<array>} All categories
 */
export async function getCategories() {
  return apiRequest('/api/categories');
}

/**
 * Get category details with products
 * 
 * @param {string} categorySlug - Category slug/identifier
 * @param {number} limit - Number of products to return
 * @returns {Promise<object>} Category with products
 */
export async function getCategoryDetails(categorySlug, limit = 12) {
  return apiRequest(`/api/categories/${categorySlug}?limit=${limit}`);
}

/**
 * Get promotional banners for homepage
 * 
 * @param {string} position - Banner position (hero, middle, bottom)
 * @returns {Promise<array>} Promotional banners
 */
export async function getPromotionalBanners(position = 'all') {
  return apiRequest(`/api/banners?position=${position}`);
}

/**
 * Get testimonials/reviews for homepage
 * 
 * @param {number} limit - Number of testimonials
 * @returns {Promise<array>} Customer testimonials
 */
export async function getTestimonials(limit = 3) {
  return apiRequest(`/api/testimonials?limit=${limit}`);
}

/**
 * Subscribe email to newsletter
 * Requires email validation on backend
 * 
 * @param {string} email - Customer email
 * @returns {Promise<object>} Subscription confirmation
 */
export async function subscribeToNewsletter(email) {
  return apiRequest('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Get flash deal information
 * Includes timing and deal details
 * 
 * @returns {Promise<object>} Flash deal details
 */
export async function getFlashDealInfo() {
  return apiRequest('/api/flash-deals/info');
}

/**
 * Track section view event
 * For analytics and insights
 * 
 * @param {string} sectionName - Name of the section viewed
 * @param {object} metadata - Additional tracking data
 * @returns {Promise<void>}
 */
export async function trackSectionView(sectionName, metadata = {}) {
  try {
    await apiRequest('/api/analytics/section-view', {
      method: 'POST',
      body: JSON.stringify({
        section: sectionName,
        timestamp: new Date().toISOString(),
        ...metadata,
      }),
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience for analytics
    console.warn('Failed to track section view:', error);
  }
}

/**
 * Track product interaction
 * For analytics and recommendation engine
 * 
 * @param {string} productId - Product ID
 * @param {string} action - Action type (view, click, wishlist, etc)
 * @returns {Promise<void>}
 */
export async function trackProductInteraction(productId, action = 'view') {
  try {
    await apiRequest('/api/analytics/product-interaction', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        action,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.warn('Failed to track product interaction:', error);
  }
}

/**
 * Get homepage meta data
 * For SEO, analytics, and configuration
 * 
 * @returns {Promise<object>} Meta data
 */
export async function getHomepageMetadata() {
  return apiRequest('/api/homepage/metadata');
}

/**
 * Batch get multiple products by IDs
 * For cross-selling or bundles
 * 
 * @param {array<string>} productIds - Array of product IDs
 * @returns {Promise<array>} Products
 */
export async function getProductsByIds(productIds) {
  return apiRequest('/api/products/batch', {
    method: 'POST',
    body: JSON.stringify({ ids: productIds }),
  });
}

/**
 * Search products by query
 * 
 * @param {string} query - Search query
 * @param {number} limit - Number of results
 * @returns {Promise<array>} Search results
 */
export async function searchProducts(query, limit = 20) {
  return apiRequest(
    `/api/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

/**
 * Get related products
 * For cross-selling
 * 
 * @param {string} productId - Base product ID
 * @param {number} limit - Number of related products
 * @returns {Promise<array>} Related products
 */
export async function getRelatedProducts(productId, limit = 6) {
  return apiRequest(`/api/products/${productId}/related?limit=${limit}`);
}

/**
 * Validate promo code
 * 
 * @param {string} code - Promo code
 * @returns {Promise<object>} Promo code details and discount
 */
export async function validatePromoCode(code) {
  return apiRequest(`/api/promo/validate?code=${encodeURIComponent(code)}`);
}

/**
 * Rate limit wrapper for API calls
 * Prevents hammering the server
 * 
 * @param {function} apiCall - API function to call
 * @param {number} delayMs - Delay between calls
 * @returns {Promise} API response
 */
export async function rateLimitedCall(apiCall, delayMs = 500) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      apiCall().then(resolve).catch(reject);
    }, delayMs);
  });
}

export default {
  getHomepageAggregated,
  getHighestDiscountProducts,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivalProducts,
  getRecommendations,
  getCategories,
  getCategoryDetails,
  getPromotionalBanners,
  getTestimonials,
  subscribeToNewsletter,
  getFlashDealInfo,
  trackSectionView,
  trackProductInteraction,
  getHomepageMetadata,
  getProductsByIds,
  searchProducts,
  getRelatedProducts,
  validatePromoCode,
  rateLimitedCall,
};
