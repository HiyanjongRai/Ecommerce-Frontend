import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  addToCart,
  addToWishlist,
  getReviewsForProduct,
  removeFromWishlist,
  getProductById,
} from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import { getProductLink } from '../../../shared/utils/slugHelper';
import { Heart, ShoppingCart, ChevronRight } from 'lucide-react';

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
  if (variants.length > 1) return true;
  if (variants.length === 1 && variants[0]?.attributes && Object.keys(variants[0].attributes).length > 0) return true;
  return false;
};

// Simple in-memory cache for fetched product details to avoid repeated network calls.
// NOTE: this is a module-level cache shared across all ProductCard instances. It is not
// bounded or evicted; consider moving to a proper data layer (React Query/SWR) if the
// catalog grows large enough for this to matter.
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

// Find the variant matching every currently-selected option (across all attribute keys
// the variant defines), used to surface variant-specific price/stock once a full
// selection is made.
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

/* ─── Brand logo (Apple SVG or letter fallback) ───────────────────── */
const BrandLogo = ({ brandName }) => {
  if (!brandName) return null;
  const lower = String(brandName).toLowerCase();
  if (lower.includes('apple')) {
    return (
      <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.56 2.98-1.42z" />
      </svg>
    );
  }
  return (
    <span className="w-[15px] h-[15px] rounded-sm bg-slate-900 text-white text-[7px] font-bold flex items-center justify-center flex-shrink-0 uppercase">
      {brandName.charAt(0)}
    </span>
  );
};

/* ─── Star rating ─────────────────────────────────────────────────── */
const StarRating = ({ value, count, productId }) => {
  const display = value > 0 ? value : 5;
  const rounded = Math.round(display * 2) / 2;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-[2px]">
        {[1, 2, 3, 4, 5].map((i) => {
          const gradId = `sg-${productId || 'x'}-${i}`;
          const full  = i <= Math.floor(rounded);
          const half  = !full && i === Math.ceil(rounded) && rounded % 1 !== 0;
          return (
            <svg key={i} className="w-[15px] h-[15px]" viewBox="0 0 20 20">
              {half && (
                <defs>
                  <linearGradient id={gradId}>
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="50%" stopColor="#D1D5DB" />
                  </linearGradient>
                </defs>
              )}
              <polygon
                points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
                fill={full ? '#FBBF24' : half ? `url(#${gradId})` : '#D1D5DB'}
              />
            </svg>
          );
        })}
      </div>
      <span className="text-[13px] text-gray-400">
        ({count > 0 ? count.toLocaleString() : '0'})
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ProductCard
══════════════════════════════════════════════════════════════════ */
const ProductCard = ({ product, onAddToCartSuccess, isSmall = false, variant = 'default', badge = null }) => {
  const isFlash       = variant === 'flash';
  const isRecommended = variant === 'recommended';

  const { user, refreshCart, wishlistIds, refreshWishlist } = useCustomer();
  const [adding, setAdding]           = useState(false);
  const [added, setAdded]             = useState(false);
  const [wishing, setWishing]         = useState(false);
  const [optimisticWished, setOptimisticWished] = useState(null); // null = defer to server state
  const [reviewCount, setReviewCount] = useState(product.totalReviews ?? product.reviewCount ?? 0);
  const [selectedOptions, setSelectedOptions] = useState({});

  const productId = product.productId || product.id;
  const isWished  = optimisticWished ?? (wishlistIds?.has(productId) ?? false);
  const brand     = product.brand || product.brandName || '';
  const category  = product.categoryName || product.category || 'Electronics';
  const seller    = product.storeName || product.sellerStoreName || product.sellerName || product.sellerProfile?.storeName || product.sellerProfile?.name || 'Jhapcham Seller';

  // Stabilize the array reference so the lazy-fetch effect below doesn't re-run on
  // every render just because `product.variants` is missing (a fresh `[]` literal
  // would otherwise be a new reference each render and re-trigger the effect).
  const variants = useMemo(
    () => (Array.isArray(product.variants) ? product.variants : []),
    [product.variants]
  );
  const hasAttributeOptions = Boolean(product?.attributeOptions && Object.keys(product.attributeOptions).length > 0);
  const variantProduct = isVariantProduct(product, variants) || hasAttributeOptions;

  const [fetchedVariants, setFetchedVariants] = useState(variants);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    let alive = true;
    const needsFetch = variantProduct && variants.length === 0 && productId;
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
      .catch(() => { /* falls back to the "Select on product page" notice below */ })
      .finally(() => { if (alive) setLoadingVariants(false); });

    return () => { alive = false; };
  }, [productId, variantProduct, variants]);

  // Build option groups from variants when available, falling back to the
  // lazily-fetched variants.
  const effectiveVariants = variants.length > 0 ? variants : fetchedVariants;
  const optionGroups = variantProduct ? buildOptionGroups(effectiveVariants) : [];
  const showChoose = variantProduct;

  // Once every option group has a selection, resolve the matching real variant so
  // price/stock can reflect that exact combination instead of the generic min price.
  const selectedVariant = variantProduct ? matchVariant(effectiveVariants, selectedOptions, optionGroups) : null;

  // Carry the user's swatch/pill selection into the product page link as
  // query params, so picking "Black / 512GB" on the card and clicking
  // "Choose Options" lands on the product page pre-filtered to that combo.
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

  // Prefer the selected variant's own price once we know exactly which one is chosen.
  const variantPrice = selectedVariant ? toNum(selectedVariant.salePrice || selectedVariant.finalPrice || selectedVariant.price) : 0;
  const price    = variantPrice || directSale || pctPrice || inferredSale || minPrice || original;
  const discount = pctSale > 0 ? pctSale : original > 0 && price > 0 && price < original
    ? Math.round((1 - price / original) * 100) : 0;

  /* image */
  const rawImg  = product.imagePaths?.[0] ?? product.imagePath ?? product.thumbnail ?? product.images?.[0]?.imagePath ?? null;
  const apiBase = BASE_URL || 'http://localhost:8080';
  const imgUrl  = rawImg ? (rawImg.startsWith('http') ? rawImg : `${apiBase}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : null;

  /* stock — reflect the selected variant's stock once one is fully chosen */
  const qty        = selectedVariant
    ? (selectedVariant.stockQuantity ?? selectedVariant.quantity ?? null)
    : (variantProduct ? null : (product.stockQuantity ?? product.quantity ?? null));
  const outOfStock = qty !== null && qty <= 0;
  const lowStock   = !outOfStock && qty !== null && qty <= 10;

  const effectivePrice  = price || minPrice || original;
  const hasFreeShipping = product.freeShipping || effectivePrice >= 2000;

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!productId) return;
      // Skip the network call entirely if the list endpoint already gave us a count.
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
    setOptimisticWished(next); // instant feedback; reconciled by refreshWishlist below
    setWishing(true);
    try {
      if (isWished) { await removeFromWishlist(user.id, productId); toast.success('Removed from wishlist'); }
      else          { await addToWishlist(user.id, productId);      toast.success('Added to wishlist'); }
      await refreshWishlist();
      setOptimisticWished(null);
    } catch (err) {
      setOptimisticWished(null); // roll back to server truth on failure
      toast.error(err.response?.data?.message || 'Could not update wishlist');
    } finally {
      setWishing(false);
    }
  };

  const handleCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (variantProduct) return;
    if (!user) { toast.warning('Sign in to add items to your cart.'); return; }
    if (String(productId).startsWith('mock-')) {
      setAdded(true); setTimeout(() => setAdded(false), 2000); toast.success('Added to cart!'); return;
    }
    setAdding(true);
    try {
      await addToCart(user.id, productId, { productId, variantId: null, quantity: 1 });
      setAdded(true); refreshCart(); onAddToCartSuccess?.(productId);
      setTimeout(() => setAdded(false), 2000); toast.success('Added to cart!');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not add to cart'); }
    finally { setAdding(false); }
  };

  const toggleOption = (groupKey, value) =>
    setSelectedOptions((prev) => ({ ...prev, [groupKey]: prev[groupKey] === value ? null : value }));

  const ratingVal = Number(product.averageRating || product.rating || 0);

  /* ── badge label + colour ── */
  const badgeColorMap = {
    'Best Seller': 'bg-orange-500 text-white',
    New:           'bg-[#15803d] text-white',
    Trending:      'bg-blue-500 text-white',
    'Top Rated':   'bg-purple-500 text-white',
    'Hot Deal':    'bg-[#dc2626] text-white',
    Premium:       'bg-slate-800 text-white',
  };

  /* ── top-left badge ── */
  const TopBadge = () => {
    if (outOfStock) {
      return (
        <span className="absolute top-4 left-4 z-10 bg-slate-600 text-white text-[11px] font-bold px-2.5 py-[5px] rounded-md leading-none">
          Out of Stock
        </span>
      );
    }
    if (discount > 0) {
      return (
        <span className="absolute top-4 left-4 z-10 bg-[#dc2626] text-white text-[11px] font-bold px-2.5 py-[5px] rounded-md leading-none">
          -{Math.round(discount)}%
        </span>
      );
    }
    if (product.isNew || badge === 'New') {
      return (
        <span className="absolute top-4 left-4 z-10 bg-[#15803d] text-white text-[11px] font-bold px-2.5 py-[5px] rounded-md leading-none">
          New
        </span>
      );
    }
    if (badge) {
      return (
        <span className={`absolute top-4 left-4 z-10 text-[11px] font-bold px-2.5 py-[5px] rounded-md leading-none ${badgeColorMap[badge] || 'bg-[#15803d] text-white'}`}>
          {badge}
        </span>
      );
    }
    return null;
  };

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div
      className="
        group relative flex flex-col bg-white/95
        border border-slate-200/80 rounded-[18px]
        overflow-hidden
        shadow-[0_8px_30px_rgba(2,6,23,0.06)]
        transition-all duration-300
        hover:shadow-[0_18px_40px_rgba(2,6,23,0.12)]
        hover:-translate-y-1
        hover:z-20
        select-none
        w-full max-w-[420px] mx-auto p-2
      "
    >

      {/* ── Top-left badge ── */}
      <TopBadge />

      {/* ── Wishlist heart ── */}
      <button
        type="button"
        onClick={handleWishlist}
        disabled={wishing}
        aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={isWished}
        className={`
          absolute top-4 right-4 z-10
          w-10 h-10 flex items-center justify-center
          rounded-full border border-slate-100 bg-white
          shadow-md backdrop-blur-sm
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]
          disabled:opacity-60
          ${isWished
            ? 'text-red-500'
            : 'text-gray-400 hover:text-gray-600'
          }
        `}
      >
        <Heart
          className="w-4 h-4"
          strokeWidth={1.8}
          fill={isWished ? 'currentColor' : 'none'}
        />
      </button>

      {/* ── Product image ── */}
      <Link
        to={productLink}
        className="relative flex items-center justify-center w-full mb-1 overflow-hidden rounded-xl border border-slate-100 p-1"
        style={{ height: isSmall ? '100px' : '120px' }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <img
          src={imgUrl || '/Assets/Banners/homepage_hero_headphones.png'}
          alt={product.name || 'Product'}
          className="relative max-h-full max-w-[80%] object-contain transition-transform duration-500 group-hover:scale-[1.06]"
          loading="lazy"
        />
      </Link>

      {/* ── Card body ── */}
      <div className="flex flex-col gap-0.5 flex-1">

        {/* Brand / category / seller row */}
        <div className="flex flex-col gap-0.5 mb-0.5 text-slate-500">
          {brand && (
            <div className="flex items-center gap-1 flex-wrap text-[11px]">
              <BrandLogo brandName={brand} />
              <span className="font-semibold text-slate-700">{brand}</span>
            </div>
          )}

        </div>

        <Link
          to={productLink}
          onClick={(e) => e.stopPropagation()}
          className="block mb-0"
        >
          <h4
            className="
              font-extrabold text-slate-900 leading-snug
              line-clamp-2
              hover:text-[#15803d] transition-colors duration-150
              text-[14px] sm:text-[15px]
            "
          >
            {fmtTitle(product.name)}
          </h4>
        </Link>

        <div className="mb-0.5">
          <StarRating value={ratingVal} count={reviewCount} productId={productId} />
        </div>

        {/* Price block: if options are available but not fully chosen, show a stable
            “From Rs.” price hint. Once a variant is selected or no option selection is
            required, show the actual product price in the same block. */}
        {((!showChoose || selectedVariant) || (showChoose && !selectedVariant && minPrice > 0)) && (
          <div className="flex items-center justify-between gap-1 flex-wrap mb-1 rounded-xl px-3 py-2">
            <div className="flex items-baseline gap-1 flex-wrap">
              {showChoose && !selectedVariant && (
                <span className="text-[11px] text-gray-500">From</span>
              )}
              <span className={`font-bold text-[15px] ${isFlash && discount > 0 ? 'text-[#dc2626]' : 'text-slate-900'}`}>
                Rs.&nbsp;{(showChoose && !selectedVariant ? minPrice : price).toLocaleString()}
              </span>
              {(!showChoose || selectedVariant) && original > price && (
                <span className="text-[10px] line-through text-gray-400">
                  Rs.&nbsp;{original.toLocaleString()}
                </span>
              )}
            </div>
            {hasFreeShipping && !outOfStock && isRecommended && (!showChoose || selectedVariant) && (
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Free Delivery
              </span>
            )}
          </div>
        )}

        {!variantProduct && (
          <div className="flex flex-col gap-2 mb-3 text-[10px] text-slate-700">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-bold text-slate-800 min-w-[55px]">Category:</span>
              <span className="text-slate-700 font-semibold">
                {category}
              </span>
            </div>
            {seller && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] font-bold text-slate-800 min-w-[55px]">Seller:</span>
                <span className="text-slate-700 font-semibold">
                  {seller}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Free shipping */}
        {hasFreeShipping && !outOfStock && isRecommended && !variantProduct && (
          <span className="text-[9px] font-semibold text-[#15803d] mb-1 block">FREE Delivery</span>
        )}

        {/* ── Variant selectors ── */}
        {!outOfStock && variantProduct && (
          <div className="flex flex-col gap-2 mb-3">
            {optionGroups.length > 0 && optionGroups.map((group) => (
              <div key={group.key} className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] font-bold text-slate-800 min-w-[55px]">{group.label}:</span>

                {group.isColor ? (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {group.options.slice(0, 5).map((opt) => {
                      const sel = selectedOptions[group.key] === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          title={opt.label}
                          aria-label={`${group.label}: ${opt.label}`}
                          aria-pressed={sel}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleOption(group.key, opt.label); }}
                          className={`w-[22px] h-[22px] rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] ${sel ? 'ring-2 ring-[#15803d] ring-offset-2' : 'ring-1 ring-gray-200 hover:ring-gray-400'}`}
                          style={{ backgroundColor: resolveColorHex(opt.label, opt.hex) }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-wrap">
                    {group.options.slice(0, 4).map((opt) => {
                      const sel = selectedOptions[group.key] === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          aria-pressed={sel}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleOption(group.key, opt.label); }}
                          className={`px-2 py-[2px] text-[9px] font-semibold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] ${sel ? 'border-2 border-[#15803d] text-[#15803d] bg-white' : 'border border-gray-200 text-slate-700 bg-white hover:border-gray-400'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {optionGroups.length === 0 && (
              <div className="text-xs text-gray-500 px-2 py-1 bg-white border border-gray-100 rounded-md">
                {loadingVariants ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 a8 8 0 018-8v8z" />
                    </svg>
                    Loading options…
                  </span>
                ) : effectiveVariants.length > 0 ? (
                  <>
                    <span>Variants available — </span>
                    <span className="font-semibold text-slate-800">{effectiveVariants.length}</span>
                    <span>. Select on product page.</span>
                  </>
                ) : (
                  <span>Multiple options available. Select on product page.</span>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── CTA button ── */}
        <div className="pt-0.5 mt-auto">
            {showChoose && !outOfStock ? (
            /* Outlined "Choose Options" */
            <Link
              to={productLink}
              className="
                relative flex items-center justify-center
                w-full px-3 py-2.5 rounded-xl
                border-2 border-[#15803d]
                text-[#15803d] text-[13px] font-bold
                bg-white shadow-sm
                hover:bg-green-50 hover:shadow-md
                active:scale-[0.98]
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]
              "
              onClick={(e) => e.stopPropagation()}
            >
              Choose Options
              <ChevronRight className="absolute right-3 w-[12px] h-[12px]" strokeWidth={2.5} />
            </Link>
            ) : (
            /* Solid "Add to Cart" */
            <button
              type="button"
              onClick={handleCart}
              disabled={adding || outOfStock}
              className={`
                relative flex items-center justify-center gap-2
                w-full px-3 py-2.5 rounded-xl
                text-[13px] font-bold shadow-sm
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]
                ${outOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : added
                  ? 'bg-[#14532d] text-white shadow-md'
                  : 'bg-[#15803d] hover:bg-[#166534] hover:shadow-md active:scale-[0.98] text-white'
                }
              `}
            >
              <ShoppingCart className="w-[14px] h-[14px]" strokeWidth={2} />
              {adding ? 'Adding…' : added ? 'Added ✓' : outOfStock ? 'Unavailable' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;