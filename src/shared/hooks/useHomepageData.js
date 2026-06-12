/**
 * Custom Hook: useHomepageData
 * Manages fetching, caching, and state management for homepage sections
 * Includes error handling, loading states, and retry logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getBestSellers,
  getTopRated,
  getTrendingProducts,
  getMostWishlisted,
  getRecommendations,
  getPopularSearches,
  getAnnouncements,
  getCachedData,
  setCachedData,
  CACHE_KEYS,
} from '../services/homepageApi';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Hook to fetch a single homepage section with caching and retry logic
 * @param {string} sectionName - Name of the section
 * @param {Function} fetchFn - Function to fetch the data
 * @param {string} cacheKey - Cache key for localStorage
 * @param {Object} options - Additional options
 * @returns {Object} { data, loading, error, retry }
 */
const useSectionData = (sectionName, fetchFn, cacheKey, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const { params = {}, enabled = true } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = getCachedData(cacheKey);
      if (cachedData && isMountedRef.current) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const result = await fetchFn(params);

      if (isMountedRef.current) {
        setData(result);
        setCachedData(cacheKey, result);
        setError(null);
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error(`Error fetching ${sectionName}:`, err);

      // Retry logic
      if (retryCountRef.current < RETRY_ATTEMPTS) {
        retryCountRef.current += 1;
        setTimeout(() => {
          fetchData();
        }, RETRY_DELAY * retryCountRef.current);
      } else {
        setError({
          message: `Failed to load ${sectionName}`,
          details: err.message,
          retry: () => {
            retryCountRef.current = 0;
            fetchData();
          },
        });
        setLoading(false);
      }
    }
  }, [sectionName, fetchFn, cacheKey, params, enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    fetchData();
  }, [fetchData]);

  return { data, loading, error, retry };
};

/**
 * Main hook to fetch all homepage sections
 * @param {Object} options - Configuration options
 * @returns {Object} All section data with loading and error states
 */
export const useHomepageData = (options = {}) => {
  const {
    fetchBestSellers = true,
    fetchTopRated = true,
    fetchTrending = true,
    fetchMostWishlisted = false,
    fetchRecommendations = true,
    fetchPopularSearches = true,
    fetchAnnouncements = true,
  } = options;

  // Fetch individual sections
  const bestSellers = useSectionData(
    'Best Sellers',
    () => getBestSellers(0, 20),
    CACHE_KEYS.BEST_SELLERS,
    { enabled: fetchBestSellers }
  );

  const topRated = useSectionData(
    'Top Rated',
    () => getTopRated(0, 20),
    CACHE_KEYS.TOP_RATED,
    { enabled: fetchTopRated }
  );

  const trending = useSectionData(
    'Trending',
    () => getTrendingProducts(0, 20),
    CACHE_KEYS.TRENDING,
    { enabled: fetchTrending }
  );

  const mostWishlisted = useSectionData(
    'Most Wishlisted',
    () => getMostWishlisted(0, 20),
    CACHE_KEYS.MOST_WISHLISTED,
    { enabled: fetchMostWishlisted }
  );

  const recommendations = useSectionData(
    'Recommendations',
    () => getRecommendations(20),
    CACHE_KEYS.RECOMMENDATIONS,
    { enabled: fetchRecommendations }
  );

  const popularSearches = useSectionData(
    'Popular Searches',
    () => getPopularSearches(0, 10),
    CACHE_KEYS.POPULAR_SEARCHES,
    { enabled: fetchPopularSearches }
  );

  const announcements = useSectionData(
    'Announcements',
    () => getAnnouncements(0, 5),
    CACHE_KEYS.ANNOUNCEMENTS,
    { enabled: fetchAnnouncements }
  );

  // Calculate overall loading and error states
  const sections = [
    bestSellers,
    topRated,
    trending,
    mostWishlisted,
    recommendations,
    popularSearches,
    announcements,
  ].filter((section) => section !== null);

  const isLoading = sections.some((section) => section.loading);
  const hasError = sections.some((section) => section.error);
  const errors = sections
    .filter((section) => section.error)
    .map((section) => section.error);

  return {
    // Individual sections
    bestSellers,
    topRated,
    trending,
    mostWishlisted,
    recommendations,
    popularSearches,
    announcements,

    // Overall states
    isLoading,
    hasError,
    errors,

    // Utility functions
    retryAll: () => {
      if (fetchBestSellers) bestSellers.retry();
      if (fetchTopRated) topRated.retry();
      if (fetchTrending) trending.retry();
      if (fetchMostWishlisted) mostWishlisted.retry();
      if (fetchRecommendations) recommendations.retry();
      if (fetchPopularSearches) popularSearches.retry();
      if (fetchAnnouncements) announcements.retry();
    },
  };
};

/**
 * Hook to fetch a single section with pagination
 * @param {string} sectionType - Type of section (bestSellers, topRated, etc.)
 * @param {number} initialPage - Initial page number
 * @param {number} pageSize - Page size
 * @returns {Object} { data, loading, error, page, pageSize, goToPage, nextPage, prevPage }
 */
export const usePaginatedSection = (sectionType, initialPage = 0, pageSize = 20) => {
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchFn = {
    bestSellers: getBestSellers,
    topRated: getTopRated,
    trending: getTrendingProducts,
    mostWishlisted: getMostWishlisted,
  }[sectionType];

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const result = await fetchFn(page, pageSize);
        if (isMountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [page, pageSize, fetchFn]);

  const goToPage = useCallback((newPage) => {
    setPage(Math.max(0, newPage));
  }, []);

  const nextPage = useCallback(() => {
    if (data?.totalPages && page < data.totalPages - 1) {
      setPage((prev) => prev + 1);
    }
  }, [page, data?.totalPages]);

  const prevPage = useCallback(() => {
    if (page > 0) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: data?.totalPages ? page < data.totalPages - 1 : false,
    hasPrevPage: page > 0,
  };
};

/**
 * Hook to search and filter products
 * @param {string} searchQuery - Search query
 * @param {Object} filters - Filter options
 * @returns {Object} { results, loading, error }
 */
export const useProductSearch = (searchQuery, filters = {}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Simulate search - in real app, would call backend search endpoint
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        // This is a placeholder - implement actual search logic
        setResults([]);
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, [searchQuery, filters]);

  return { results, loading, error };
};

export default useHomepageData;
