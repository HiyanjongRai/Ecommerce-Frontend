/**
 * Homepage API Service
 * Integrates all dynamic data endpoints for the homepage
 * Includes caching, error handling, and fallback mechanisms
 */

import apiClient from '../../../shared/api/apiClient';

export const getHomePage = async (limit = 12) => {
  const response = await apiClient.get('/homepage', {
    params: { limit: Math.min(limit, 60) },
  });
  return response.data;
};

/**
 * PRODUCT ENDPOINTS
 */

/**
 * Get best-selling products
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20, max: 60)
 * @returns {Promise} Paginated best-seller products
 */
export const getBestSellers = async (page = 0, size = 20) => {
  try {
    const response = await apiClient.get('/products/best-sellers', {
      params: { page, size: Math.min(size, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch best sellers:', error);
    throw error;
  }
};

/**
 * Get top-rated products
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20, max: 60)
 * @returns {Promise} Paginated top-rated products
 */
export const getTopRated = async (page = 0, size = 20) => {
  try {
    const response = await apiClient.get('/products/top-rated', {
      params: { page, size: Math.min(size, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch top-rated products:', error);
    throw error;
  }
};

export const getTopSellers = getBestSellers;
export const getTopRatedSellers = getTopRated;

/**
 * Get most wishlisted products
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20, max: 60)
 * @returns {Promise} Paginated most-wishlisted products
 */
export const getMostWishlisted = async (page = 0, size = 20) => {
  try {
    const response = await apiClient.get('/products/most-wishlisted', {
      params: { page, size: Math.min(size, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch most-wishlisted products:', error);
    throw error;
  }
};

/**
 * Get trending products
 * Trending score = (recentViews * 0.7) + (averageRating * 0.3)
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20, max: 60)
 * @returns {Promise} Paginated trending products
 */
export const getTrendingProducts = async (page = 0, size = 20) => {
  try {
    const response = await apiClient.get('/products/trending', {
      params: { page, size: Math.min(size, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch trending products:', error);
    throw error;
  }
};

/**
 * Get recommended products
 * @param {number} limit - Number of recommendations (default: 20, max: 100)
 * @param {string} category - Optional category filter
 * @returns {Promise} List of recommended products
 */
export const getRecommendations = async (limit = 20, category = null) => {
  try {
    const params = { limit: Math.min(limit, 100) };
    if (category) {
      params.category = category;
    }
    const response = await apiClient.get('/products/recommendations', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    throw error;
  }
};

/**
 * ANALYTICS ENDPOINTS
 */

/**
 * Get popular search keywords
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20, max: 60)
 * @returns {Promise} Paginated popular searches
 */
export const getPopularSearches = async (page = 0, size = 20) => {
  try {
    const response = await apiClient.get('/analytics/popular-searches', {
      params: { page, size: Math.min(size, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch popular searches:', error);
    throw error;
  }
};

/**
 * Get top popular searches
 * @param {number} limit - Number of results (default: 10)
 * @returns {Promise} Top popular searches
 */
export const getTopPopularSearches = async (limit = 10) => {
  try {
    const response = await apiClient.get('/analytics/popular-searches/top', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch top popular searches:', error);
    throw error;
  }
};

/**
 * Get recently searched keywords
 * @param {number} limit - Number of results (default: 10)
 * @returns {Promise} Recently searched keywords
 */
export const getRecentSearches = async (limit = 10) => {
  try {
    const response = await apiClient.get('/analytics/popular-searches/recent', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recent searches:', error);
    throw error;
  }
};

/**
 * Get searches with highest conversion rate
 * @param {number} limit - Number of results (default: 10)
 * @returns {Promise} High-conversion searches
 */
export const getHighConversionSearches = async (limit = 10) => {
  try {
    const response = await apiClient.get('/analytics/popular-searches/conversion', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch high-conversion searches:', error);
    throw error;
  }
};

/**
 * ADMIN ENDPOINTS
 */

/**
 * Get dashboard statistics (Admin only)
 * @returns {Promise} Dashboard statistics
 */
export const getDashboardStatistics = async () => {
  try {
    const response = await apiClient.get('/admin/statistics/dashboard');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard statistics:', error);
    throw error;
  }
};

/**
 * Force refresh dashboard statistics cache (Admin only)
 * @returns {Promise} Refresh result
 */
export const refreshDashboardStatistics = async () => {
  try {
    const response = await apiClient.post('/admin/statistics/dashboard/refresh');
    return response.data;
  } catch (error) {
    console.error('Failed to refresh dashboard statistics:', error);
    throw error;
  }
};

/**
 * ANNOUNCEMENT ENDPOINTS
 */

/**
 * Get active announcements
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20, max: 60)
 * @returns {Promise} Paginated announcements
 */
export const getAnnouncements = async (page = 0, size = 20) => {
  try {
    const response = await apiClient.get('/announcements', {
      params: { page, size: Math.min(size, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    throw error;
  }
};

/**
 * Get all active announcements as list
 * @returns {Promise} List of announcements
 */
export const getAnnouncementsList = async () => {
  try {
    const response = await apiClient.get('/announcements/list');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch announcements list:', error);
    throw error;
  }
};

/**
 * Get latest announcements
 * @param {number} limit - Number of results (default: 10)
 * @returns {Promise} Latest announcements
 */
export const getLatestAnnouncements = async (limit = 10) => {
  try {
    const response = await apiClient.get('/announcements/latest', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch latest announcements:', error);
    throw error;
  }
};

/**
 * Get announcements by priority
 * @param {string} priority - Priority level (HIGH, MEDIUM, LOW)
 * @returns {Promise} Announcements with specified priority
 */
export const getAnnouncementsByPriority = async (priority) => {
  try {
    const response = await apiClient.get(`/announcements/priority/${priority}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${priority} priority announcements:`, error);
    throw error;
  }
};

/**
 * Get announcements by type
 * @param {string} type - Announcement type (PROMOTION, NEWS, ALERT, etc.)
 * @returns {Promise} Announcements with specified type
 */
export const getAnnouncementsByType = async (type) => {
  try {
    const response = await apiClient.get(`/announcements/type/${type}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${type} announcements:`, error);
    throw error;
  }
};

/**
 * CAMPAIGN ENDPOINTS
 */

/**
 * Get active/upcoming campaigns for homepage display
 * @returns {Promise} List of active campaigns with images
 */
export const getActiveCampaigns = async () => {
  try {
    const response = await apiClient.get('/campaigns');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return [];
  }
};

/**
 * Get active banners for homepage
 */
export const getActiveBanners = async () => {
  try {
    const response = await apiClient.get('/banners/active');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch banners:', error);
    return [];
  }
};

/**
 * Get active promo codes
 */
export const getActivePromos = async () => {
  try {
    const response = await apiClient.get('/promos/active');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch promos:', error);
    return [];
  }
};

/**
 * Get categories
 */
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
};

/**
 * NEW AGGREGATED HOMEPAGE ENDPOINTS
 */

/**
 * Get complete homepage data in one call
 * Combines banners, campaigns, top-selling, most-loved, and trending products
 * @param {number} limit - Number of products per section (default: 12, max: 60)
 * @returns {Promise} Complete homepage data
 */
export const getHomepageAggregated = async (limit = 12) => {
  try {
    const response = await apiClient.get('/homepage', {
      params: { limit: Math.min(limit, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch aggregated homepage data:', error);
    return {};
  }
};

/**
 * Get homepage banners
 * @returns {Promise} Array of banners
 */
export const getHomepageBanners = async () => {
  try {
    const response = await apiClient.get('/homepage/banners');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch homepage banners:', error);
    return [];
  }
};

/**
 * Get top-selling products
 * @param {number} limit - Number of products (default: 12, max: 60)
 * @returns {Promise} List of top-selling products
 */
export const getTopSellingProducts = async (limit = 12) => {
  try {
    const response = await apiClient.get('/homepage/top-selling-products', {
      params: { limit: Math.min(limit, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch top-selling products:', error);
    return [];
  }
};

/**
 * Get most-loved products
 * @param {number} limit - Number of products (default: 12, max: 60)
 * @returns {Promise} List of most-loved products
 */
export const getMostLovedProducts = async (limit = 12) => {
  try {
    const response = await apiClient.get('/homepage/most-loved-products', {
      params: { limit: Math.min(limit, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch most-loved products:', error);
    return [];
  }
};

/**
 * Get highest discount products
 * @param {number} limit - Number of products (default: 12, max: 60)
 * @returns {Promise} List of highest discount products
 */
export const getHighestDiscountProducts = async (limit = 12) => {
  try {
    const response = await apiClient.get('/homepage/highest-discount-products', {
      params: { limit: Math.min(limit, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch highest discount products:', error);
    return [];
  }
};

/**
 * Get sale products
 * @param {number} limit - Number of products (default: 12, max: 60)
 * @returns {Promise} List of sale products
 */
export const getSaleProducts = async (limit = 12) => {
  try {
    const response = await apiClient.get('/homepage/sale-products', {
      params: { limit: Math.min(limit, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sale products:', error);
    return [];
  }
};

/**
 * Get new arrival products
 * @param {number} limit - Number of products (default: 12, max: 60)
 * @returns {Promise} List of new arrival products
 */
export const getNewArrivalProducts = async (limit = 12) => {
  try {
    const response = await apiClient.get('/homepage/new-arrival-products', {
      params: { limit: Math.min(limit, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch new arrival products:', error);
    return [];
  }
};

/**
 * Get featured products
 * @param {number} limit - Number of products (default: 12, max: 60)
 * @returns {Promise} List of featured products
 */
export const getFeaturedProducts = async (limit = 12) => {
  try {
    const response = await apiClient.get('/homepage/featured-products', {
      params: { limit: Math.min(limit, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return [];
  }
};

/**
 * Get homepage trending products
 * @param {number} limit - Number of products (default: 12, max: 60)
 * @returns {Promise} List of trending products
 */
export const getHomepageTrendingProducts = async (limit = 12) => {
  try {
    const response = await apiClient.get('/homepage/trending-products', {
      params: { limit: Math.min(limit, 60) },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch homepage trending products:', error);
    return [];
  }
};

/**
 * Get homepage active promo codes
 * @returns {Promise} List of active promo codes
 */
export const getHomepagePromoCodes = async () => {
  try {
    const response = await apiClient.get('/homepage/promocodes');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch homepage promo codes:', error);
    return [];
  }
};

/**
 * Get specific promo code by ID
 * @param {number} id - Promo code ID
 * @returns {Promise} Promo code details
 */
export const getHomepagePromoCode = async (id) => {
  try {
    const response = await apiClient.get(`/homepage/promocodes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch promo code ${id}:`, error);
    return null;
  }
};

/**
 * Get homepage active campaigns
 * @returns {Promise} List of active campaigns
 */
export const getHomepageCampaigns = async () => {
  try {
    const response = await apiClient.get('/homepage/campaigns');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch homepage campaigns:', error);
    return [];
  }
};

/**
 * Get specific campaign by ID
 * @param {number} id - Campaign ID
 * @returns {Promise} Campaign details
 */
export const getHomepageCampaign = async (id) => {
  try {
    const response = await apiClient.get(`/homepage/campaigns/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch campaign ${id}:`, error);
    return null;
  }
};

/**
 * UTILITY FUNCTIONS
 */

/**
 * Batch fetch multiple homepage sections
 * Useful for parallel loading of multiple sections
 * @param {Object} options - Options for which sections to fetch
 * @returns {Promise} Object with all fetched data
 */
export const fetchHomepageSections = async (options = {}) => {
  const {
    fetchBestSellers = true,
    fetchTopRated = true,
    fetchTrending = true,
    fetchMostWishlisted = false,
    fetchRecommendations = true,
    fetchPopularSearches = true,
    fetchAnnouncements = true,
  } = options;

  const requests = [];

  if (fetchBestSellers) {
    requests.push(
      getBestSellers(0, 20)
        .then((data) => ({ bestSellers: data }))
        .catch((error) => ({ bestSellers: null, error: error.message }))
    );
  }

  if (fetchTopRated) {
    requests.push(
      getTopRated(0, 20)
        .then((data) => ({ topRated: data }))
        .catch((error) => ({ topRated: null, error: error.message }))
    );
  }

  if (fetchTrending) {
    requests.push(
      getTrendingProducts(0, 20)
        .then((data) => ({ trending: data }))
        .catch((error) => ({ trending: null, error: error.message }))
    );
  }

  if (fetchMostWishlisted) {
    requests.push(
      getMostWishlisted(0, 20)
        .then((data) => ({ mostWishlisted: data }))
        .catch((error) => ({ mostWishlisted: null, error: error.message }))
    );
  }

  if (fetchRecommendations) {
    requests.push(
      getRecommendations(20)
        .then((data) => ({ recommendations: data }))
        .catch((error) => ({ recommendations: null, error: error.message }))
    );
  }

  if (fetchPopularSearches) {
    requests.push(
      getPopularSearches(0, 10)
        .then((data) => ({ popularSearches: data }))
        .catch((error) => ({ popularSearches: null, error: error.message }))
    );
  }

  if (fetchAnnouncements) {
    requests.push(
      getAnnouncements(0, 5)
        .then((data) => ({ announcements: data }))
        .catch((error) => ({ announcements: null, error: error.message }))
    );
  }

  const results = await Promise.all(requests);
  return results.reduce((acc, result) => ({ ...acc, ...result }), {});
};

/**
 * Cache management utilities
 */
const CACHE_KEYS = {
  BEST_SELLERS: 'homepage_best_sellers',
  TOP_RATED: 'homepage_top_rated',
  TRENDING: 'homepage_trending',
  MOST_WISHLISTED: 'homepage_most_wishlisted',
  RECOMMENDATIONS: 'homepage_recommendations',
  POPULAR_SEARCHES: 'homepage_popular_searches',
  ANNOUNCEMENTS: 'homepage_announcements',
};

const CACHE_DURATION = {
  BEST_SELLERS: 10 * 60 * 1000, // 10 minutes
  TOP_RATED: 10 * 60 * 1000,
  TRENDING: 10 * 60 * 1000,
  MOST_WISHLISTED: 10 * 60 * 1000,
  RECOMMENDATIONS: 30 * 60 * 1000, // 30 minutes
  POPULAR_SEARCHES: 10 * 60 * 1000,
  ANNOUNCEMENTS: 5 * 60 * 1000, // 5 minutes
};

/**
 * Get cached data if available and not expired
 * @param {string} key - Cache key
 * @returns {any} Cached data or null
 */
export const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const duration = CACHE_DURATION[key] || 5 * 60 * 1000;

    if (Date.now() - timestamp > duration) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCachedData = (key, data) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Cache storage error:', error);
  }
};

/**
 * Clear specific cache
 * @param {string} key - Cache key
 */
export const clearCache = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

/**
 * Clear all homepage cache
 */
export const clearAllHomepageCache = () => {
  Object.values(CACHE_KEYS).forEach((key) => {
    clearCache(key);
  });
};

const homepageApi = {
  // Product endpoints
  getBestSellers,
  getTopRated,
  getMostWishlisted,
  getTrendingProducts,
  getRecommendations,

  // Analytics endpoints
  getPopularSearches,
  getTopPopularSearches,
  getRecentSearches,
  getHighConversionSearches,

  // Admin endpoints
  getDashboardStatistics,
  refreshDashboardStatistics,

  // Announcement endpoints
  getAnnouncements,
  getAnnouncementsList,
  getLatestAnnouncements,
  getAnnouncementsByPriority,
  getAnnouncementsByType,

  // Utility functions
  fetchHomepageSections,
  getCachedData,
  setCachedData,
  clearCache,
  clearAllHomepageCache,
  CACHE_KEYS,
};

export default homepageApi;


