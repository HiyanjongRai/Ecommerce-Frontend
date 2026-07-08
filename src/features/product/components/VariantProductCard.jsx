import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  addToWishlist,
  getReviewsForProduct,
  removeFromWishlist,
  getProductById,
} from '../../customer/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import { getProductLink } from '../../../shared/utils/slugHelper';
import { Heart, ChevronRight, Truck } from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────────────────── */
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

const fmtTitle = (str) => {
  if (!str) return '';
  const preserve = { pro: 'Pro', max: 'Max', hd: 'HD', tv: 'TV', gb: 'GB', usb: 'USB', ai: 'AI', m2: 'M2', m3: 'M3', m4: 'M4' };
  return str.split(' ').map((w) => preserve[w.toLowerCase()] ?? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ');
};

const fmtAttrLabel = (key) => {
  const lower = String(key).toLowerCase();
  if (lower.includes('color') || lower.includes('colour')) return 'Color';
  if (lower.includes('storage') || lower.includes('memory')) return 'Storage';
  if (lower.includes('size')) return 'Size';
  return key.charAt(0).toUpperCase() + key.slice(1);
};

const isColorKey = (key) => /color|colour/i.test(key);
const isPillKey  = (key) => /storage|memory|size|capacity|gb|tb/i.test(key);

const COLOR_HEX = {
  midnight: '#1e293b', starlight: '#f5f0e8', silver: '#d1d5db',
  spacegray: '#8c8c8c', spacegrey: '#8c8c8c',
  black: '#111827', white: '#f9fafb', gold: '#d4af37',
  blue: '#2563eb', red: '#dc2626', green: '#16a34a',
  gray: '#6b7280', grey: '#6b7280',
};

const resolveColorHex = (label, hex) => {
  if (hex) return hex;
  const key = String(label).toLowerCase().replace(/\s+/g, '');
  return COLOR_HEX[key] || '#cbd5e1';
};

const isVariantProduct = (product, variants) => {
  if (product?.hasVariants === true) return true;
  if (Array.isArray(variants) && variants.length > 1) return true;
  if (Array.isArray(variants) && variants.length === 1 && variants[0]?.attributes && Object.keys(variants[0].attributes).length > 0) return true;
  return false;
};

const variantDetailsCache = new Map();

const buildOptionGroups = (variants) => {
  const groupMap = {};
  variants.forEach((v) => {
    const entries = {
      ...(v.attributes || {}),
      ...(v.color   ? { color: v.color }     : {}),
      ...(v.storage ? { storage: v.storage } : {}),
      ...(v.size    ? { size: v.size }       : {}),
    };
    Object.entries(entries).forEach(([key, val]) => {
      if (!val) return;
      const norm = key.toLowerCase();
      if (!groupMap[norm]) groupMap[norm] = { key: norm, label: fmtAttrLabel(key), values: new Map() };
      groupMap[norm].values.set(String(val), { label: String(val), hex: v.colorHex || v.attributes?.colorHex || null });
    });
  });
  return Object.values(groupMap)
    .map((g) => ({ ...g, options: [...g.values.values()], isColor: isColorKey(g.key), isPill: isPillKey(g.key) }))
    .sort((a, b) => (a.isColor && !b.isColor ? -1 : !a.isColor && b.isColor ? 1 : 0))
    .slice(0, 2);
};

const matchVariant = (variants, selectedOptions, optionGroups) => {
  if (!variants?.length || optionGroups.length === 0) return null;
  const requiredKeys = optionGroups.map((g) => g.key);
  const allChosen = requiredKeys.every((k) => selectedOptions[k]);
  if (!allChosen) return null;
  return variants.find((v) => {
    const attrs = { ...(v.attributes || {}), color: v.color, storage: v.storage, size: v.size };
    return requiredKeys.every((k) => {
      const val = attrs[k] ?? attrs[Object.keys(attrs).find((ak) => ak.toLowerCase() === k) || ''];
      return String(val) === String(selectedOptions[k]);
    });
  }) || null;
};

/* ─── Single star with partial-fill support (for fractional ratings) ── */
const Star = ({ fill }) => {
  const gradId = `star-fill-${Math.round(fill * 100)}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg className="w-[13px] h-[13px] flex-shrink-0" viewBox="0 0 20 20">
      <defs>
        <linearGradient id={gradId}>
          <stop offset={`${fill * 100}%`} stopColor="#FBBF24" />
          <stop offset={`${fill * 100}%`} stopColor="#E5E7EB" />
        </linearGradient>
      </defs>
      <polygon
        points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
};

/* ─── Star rating row - 5 stars (partial fill) + review count ───────── */
const StarRating = ({ value, count }) => {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} fill={Math.max(0, Math.min(1, clamped - i))} />
        ))}
      </div>
      <span className="text-[11px] text-gray-500">
        ({count > 0 ? count.toLocaleString() : '0'})
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   VariantProductCard - For products with variants
   ─ Color swatches & storage/size pills
   ─ "Select Options" button
   ─ Price ranges
   ─ Compact layout, small type scale
══════════════════════════════════════════════════════════════════ */
const VariantProductCard = ({ product, onAddToCartSuccess, isSmall = false, variant = 'default', badge = null }) => {
  const { user, wishlistIds, refreshWishlist } = useCustomer();
  const [wishing, setWishing]         = useState(false);
  const [optimisticWished, setOptimisticWished] = useState(null);
  const [reviewCount, setReviewCount] = useState(product.totalReviews ?? product.reviewCount ?? 0);
  const [selectedOptions, setSelectedOptions] = useState({});

  const productId = product.productId || product.id;
  const isWished  = optimisticWished ?? (wishlistIds?.has(productId) ?? false);
  const brand     = product.brand || product.brandName || '';

  const variants = useMemo(
    () => (Array.isArray(product.variants) ? product.variants : []),
    [product.variants]
  );

  const [fetchedVariants, setFetchedVariants] = useState(variants);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    let alive = true;
    const needsFetch = isVariantProduct(product, variants) && variants.length === 0 && productId;
    if (!needsFetch) return;

    if (variantDetailsCache.has(productId)) {
      setFetchedVariants(variantDetailsCache.get(productId));
      return;
    }

    setLoadingVariants(true);
    getProductById(productId)
      .then((res) => {
        const full = res.data;
        variantDetailsCache.set(productId, full.variants || []);
        if (alive) setFetchedVariants(full.variants || []);
      })
      .catch(() => { /* fallback */ })
      .finally(() => { if (alive) setLoadingVariants(false); });

    return () => { alive = false; };
  }, [productId, product, variants]);

  const effectiveVariants = variants.length > 0 ? variants : fetchedVariants;
  const optionGroups = isVariantProduct(product, variants) ? buildOptionGroups(effectiveVariants) : [];
  const selectedVariant = matchVariant(effectiveVariants, selectedOptions, optionGroups);

  const productLink = (() => {
    const base = getProductLink(product);
    const chosen = Object.entries(selectedOptions).filter(([, v]) => v);
    if (chosen.length === 0) return base;
    const params = new URLSearchParams(chosen);
    return `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`;
  })();

  /* price math */
  let minPrice = toNum(product.minPrice);
  if (variants.length > 0) {
    const prices = variants.map((v) => toNum(v.salePrice || v.finalPrice || v.price)).filter((p) => p > 0);
    if (prices.length > 0 && minPrice === 0) minPrice = Math.min(...prices);
  }
  const original   = toNum(product.price || product.originalPrice || minPrice);
  const directSale = toNum(product.salePrice || product.finalPrice);
  const pctSale    = toNum(product.salePercentage || product.discountPercentage);
  const pctPrice   = pctSale > 0 && original > 0 ? original - (original * pctSale) / 100 : 0;
  const fallbackAmt   = toNum(product.discountPrice);
  const inferredSale  = fallbackAmt > 0 && original > fallbackAmt ? original - fallbackAmt : 0;

  const variantPrice = selectedVariant ? toNum(selectedVariant.salePrice || selectedVariant.finalPrice || selectedVariant.price) : 0;
  const price    = variantPrice || directSale || pctPrice || inferredSale || minPrice || original;
  const discount = pctSale > 0 ? pctSale : original > 0 && price > 0 && price < original
    ? Math.round((1 - price / original) * 100) : 0;

  /* image */
  const rawImg  = product.imagePaths?.[0] ?? product.imagePath ?? product.thumbnail ?? product.images?.[0]?.imagePath ?? null;
  const apiBase = BASE_URL || 'http://localhost:8080';
  const imgUrl  = rawImg ? (rawImg.startsWith('http') ? rawImg : `${apiBase}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : null;

  /* stock */
  const qty        = selectedVariant ? (selectedVariant.stockQuantity ?? selectedVariant.quantity ?? null) : null;
  const outOfStock = qty !== null && qty <= 0;
  const hasFreeShipping = product.freeShipping || (price && price >= 2000);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!productId) return;
      if (product.totalReviews != null || product.reviewCount != null) return;
      try {
        const res = await getReviewsForProduct(productId);
        if (alive) setReviewCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, [productId, product.totalReviews, product.reviewCount]);

  /* handlers */
  const handleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.warning('Sign in to manage your wishlist.'); return; }
    if (String(productId).startsWith('mock-')) { toast.success('Added to wishlist!'); return; }

    const next = !isWished;
    setOptimisticWished(next);
    setWishing(true);
    try {
      if (isWished) { await removeFromWishlist(user.id, productId); toast.success('Removed from wishlist'); }
      else          { await addToWishlist(user.id, productId);      toast.success('Added to wishlist'); }
      await refreshWishlist();
      setOptimisticWished(null);
    } catch (err) {
      setOptimisticWished(null);
      toast.error(err.response?.data?.message || 'Could not update wishlist');
    } finally {
      setWishing(false);
    }
  };

  const ratingVal = Number(product.averageRating || product.rating || 0);

  /* ── single top-left badge (discount takes priority) ── */
  const renderTopBadge = () => {
    if (outOfStock) {
      return (
        <span className="bg-slate-600/95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md leading-none tracking-wide">
          Out of stock
        </span>
      );
    }
    if (discount > 0) {
      return (
        <span className="bg-[#15803d] text-white text-[11px] font-bold px-2.5 py-1 rounded-md leading-none">
          -{Math.round(discount)}%
        </span>
      );
    }
    return null;
  };

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div
      className="
        group relative flex flex-col bg-white
        border border-gray-200 rounded-xl
        overflow-hidden
        shadow-sm
        transition-all duration-300 ease-out
        hover:shadow-md hover:border-gray-300
        hover:-translate-y-0.5
        hover:z-20
        select-none
        w-full max-w-[230px] mx-auto
      "
    >
      {/* ── Image Container with Badge & Wishlist ── */}
      <div className="relative">
        {/* Top-left badge */}
        <div className="absolute top-2 left-2 z-10">
          {renderTopBadge()}
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishing}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWished}
          className={`
            absolute top-2 right-2 z-10
            w-8 h-8 flex items-center justify-center
            rounded-full border border-gray-200/80 bg-white/90 backdrop-blur-sm
            shadow-sm
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]
            disabled:opacity-60
            ${isWished ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}
          `}
        >
          <Heart
            className="w-4 h-4"
            strokeWidth={1.75}
            fill={isWished ? 'currentColor' : 'none'}
          />
        </button>

        {/* Product Image */}
        <Link
          to={productLink}
          className="relative flex items-center justify-center w-full bg-gray-50 overflow-hidden"
          style={{ height: '160px' }}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <img
            src={imgUrl || '/Assets/Banners/homepage_hero_headphones.png'}
            alt={product.name || 'Product'}
            className="max-h-full max-w-[82%] object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Brand */}
        {brand && (
          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
            {brand}
          </span>
        )}

        {/* Product Title */}
        <Link
          to={productLink}
          onClick={(e) => e.stopPropagation()}
          className="block"
        >
          <h3
            className="
              font-semibold text-gray-900 leading-tight
              line-clamp-2
              hover:text-[#15803d] transition-colors duration-150
              text-[13px]
              min-h-[34px]
            "
          >
            {fmtTitle(product.name)}
          </h3>
        </Link>

        {/* Rating */}
        <StarRating value={ratingVal} count={reviewCount} />

        {/* Price Section */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[16px] font-bold text-gray-900">
            Rs.{Math.round(price)}
          </span>
          {original > price && (
            <span className="text-[11px] line-through text-gray-400">
              Rs.{Math.round(original)}
            </span>
          )}
        </div>

        {/* Stock & Shipping Info */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] text-gray-600">
            <span className={`w-2 h-2 rounded-full ${outOfStock ? 'bg-gray-400' : 'bg-green-500'}`}></span>
            <span className="font-medium">{!outOfStock ? 'In stock' : 'Out of stock'}</span>
          </div>
          {hasFreeShipping && !outOfStock && (
            <div className="flex items-center gap-0.5 text-[11px] font-medium text-[#15803d]">
              <Truck className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Free delivery</span>
            </div>
          )}
        </div>

        {/* Select Options Button */}
        <Link
          to={productLink}
          className="
            w-full mt-1 px-3 py-2 rounded-lg
            text-[12px] font-semibold
            border border-[#15803d] text-[#15803d] bg-white
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#15803d]
            flex items-center justify-center gap-1
            hover:bg-green-50 active:bg-green-100
          "
          onClick={(e) => e.stopPropagation()}
        >
          Select options
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
};

export default VariantProductCard;