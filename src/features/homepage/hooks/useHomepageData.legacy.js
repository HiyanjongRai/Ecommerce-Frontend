import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHomepageAggregated,
  getHighestDiscountProducts,
  getRecommendations,
  getCategories,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivalProducts,
} from '../api/homepageApi';
import { getProducts } from '../../customer/api/customerApi';

/**
 * Cache configuration with TTL (Time To Live)
 * Reduces redundant API calls within cache duration
 */
const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 50, // items
};

class SimpleCache {
  constructor(ttl = CACHE_CONFIG.TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value) {
    if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  clear() {
    this.cache.clear();
  }
}

const dataCache = new SimpleCache();

/**
 * Normalize products from various API response formats
 * Filters out test/invalid products
 */
const normalizeProducts = (res, limit = 6) => {
  const list = Array.isArray(res) ? res : res?.content || res?.data?.content || res?.data || [];
  return (Array.isArray(list) ? list : []).filter(p => !isTestProduct(p)).slice(0, limit);
};

/**
 * Identify test/placeholder products to filter them out
 */
const isTestProduct = (p) => {
  const name = String(p.name || '').trim();
  if (!name || name.length < 3) return true;
  if (/^(.)\1{2,}$/i.test(name)) return true;
  // Don't filter based on price - legitimate products can be cheap
  return false;
};

/**
 * Custom hook for fetching and managing homepage data
 * Handles loading, error states, and caching
 * 
 * @returns {Object} Homepage data with loading and error states
 */
export function useHomepageData() {
  const [state, setState] = useState({
    flashDeals: [],
    featuredProducts: [],
    bestSellers: [],
    newArrivals: [],
    recommended: [],
    categories: [],
    loading: {
      flash: true,
      featured: true,
      bestSellers: true,
      newArrivals: true,
      recommended: true,
      categories: true,
    },
    errors: {},
  });

  const isMountedRef = useRef(true);

  /**
   * Fill products array with fallback data if needed
   */
  const fillProducts = useCallback((items, count, fallback) => {
    let list = normalizeProducts(items, count);
    if (list.length < count) {
      const seen = new Set(list.map(p => p.productId || p.id));
      for (const p of fallback) {
        const id = p.productId || p.id;
        if (id && !seen.has(id)) {
          list.push(p);
          seen.add(id);
        }
        if (list.length >= count) break;
      }
    }
    return list.slice(0, count);
  }, []);

  /**
   * Fetch homepage data with error handling and caching
   */
  useEffect(() => {
    let isMounted = true;
    isMountedRef.current = true;

    const fetchData = async () => {
      try {
        // Check cache first
        const cacheKey = 'homepage-data';
        const cachedData = dataCache.get(cacheKey);
        if (cachedData) {
          if (isMounted) setState(cachedData);
          return;
        }

        // Fetch all data in parallel
        const [aggregated, discountRes, featuredRes, bestRes, newRes, recRes, catRes, allRes] = await Promise.all([
          getHomepageAggregated(8).catch(err => {
            console.error('Failed to fetch aggregated data:', err);
            return {};
          }),
          getHighestDiscountProducts(6).catch(err => {
            console.error('Failed to fetch flash deals:', err);
            return [];
          }),
          getFeaturedProducts(6).catch(err => {
            console.error('Failed to fetch featured products:', err);
            return [];
          }),
          getBestSellers(0, 6).catch(err => {
            console.error('Failed to fetch best sellers:', err);
            return [];
          }),
          getNewArrivalProducts(4).catch(err => {
            console.error('Failed to fetch new arrivals:', err);
            return [];
          }),
          getRecommendations(6).catch(err => {
            console.error('Failed to fetch recommendations:', err);
            return [];
          }),
          getCategories().catch(err => {
            console.error('Failed to fetch categories:', err);
            return [];
          }),
          getProducts({ page: 0, size: 12 }).catch(err => {
            console.error('Failed to fetch products:', err);
            return { data: { content: [] } };
          }),
        ]);

        const fallback = normalizeProducts(allRes.data?.content || allRes.data || [], 12);

        const newState = {
          flashDeals: fillProducts(discountRes, 6, fallback),
          featuredProducts: fillProducts(featuredRes, 6, fallback),
          bestSellers: fillProducts(bestRes, 3, fallback),
          newArrivals: fillProducts(newRes, 4, fallback),
          recommended: fillProducts(recRes, 6, fallback),
          categories: Array.isArray(catRes) ? catRes : catRes?.data || [],
          loading: {
            flash: false,
            featured: false,
            bestSellers: false,
            newArrivals: false,
            recommended: false,
            categories: false,
          },
          errors: {},
        };

        // Cache the successful response
        dataCache.set(cacheKey, newState);

        if (isMounted) {
          setState(newState);
        }
      } catch (err) {
        console.error('Critical error loading homepage:', err);
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: {
              flash: false,
              featured: false,
              bestSellers: false,
              newArrivals: false,
              recommended: false,
              categories: false,
            },
            errors: { global: 'Failed to load homepage data' },
          }));
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      isMountedRef.current = false;
    };
  }, [fillProducts]);

  return state;
}

export default useHomepageData;
