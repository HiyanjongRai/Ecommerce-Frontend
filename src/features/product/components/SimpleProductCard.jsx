import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  addToCart,
  addToWishlist,
  getReviewsForProduct,
  removeFromWishlist,
} from '../../customer/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import { getProductLink } from '../../../shared/utils/slugHelper';
import { Heart, ShoppingCart, Truck } from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────────────────── */
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

const fmtTitle = (str) => {
  if (!str) return '';
  const preserve = { pro: 'Pro', max: 'Max', hd: 'HD', tv: 'TV', gb: 'GB', usb: 'USB', ai: 'AI', m2: 'M2', m3: 'M3', m4: 'M4' };
  return str.split(' ').map((w) => preserve[w.toLowerCase()] ?? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ');
};

/* ─── Brand logo (Apple SVG or letter fallback) ───────────────────── */
const BrandLogo = ({ brandName }) => {
  if (!brandName) return null;
  const lower = String(brandName).toLowerCase();
  if (lower.includes('apple')) {
    return (
      <svg className="w-[13px] h-[13px] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.56 2.98-1.42z" />
      </svg>
    );
  }
  return (
    <span className="w-[13px] h-[13px] rounded-sm bg-slate-900 text-white text-[6px] font-bold flex items-center justify-center flex-shrink-0 uppercase">
      {brandName.charAt(0)}
    </span>
  );
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
   SimpleProductCard - For non-variant products only
   ─ Direct "Add to Cart" button
   ─ Fixed pricing
   ─ Category & Seller info
   ─ Compact layout, small type scale (matches VariantProductCard)
══════════════════════════════════════════════════════════════════ */
const SimpleProductCard = ({ product, onAddToCartSuccess, isSmall = false, variant = 'default', badge = null }) => {
  const isFlash       = variant === 'flash';
  const isRecommended = variant === 'recommended';

  const { user, refreshCart, wishlistIds, refreshWishlist } = useCustomer();
  const [adding, setAdding]           = useState(false);
  const [added, setAdded]             = useState(false);
  const [wishing, setWishing]         = useState(false);
  const [optimisticWished, setOptimisticWished] = useState(null);
  const [reviewCount, setReviewCount] = useState(product.totalReviews ?? product.reviewCount ?? 0);

  const productId = product.productId || product.id;
  const isWished  = optimisticWished ?? (wishlistIds?.has(productId) ?? false);
  const brand     = product.brand || product.brandName || '';
  const category  = product.categoryName || product.category || 'Electronics';
  const seller    = product.storeName || product.sellerStoreName || product.sellerName || product.sellerProfile?.storeName || product.sellerProfile?.name || 'Jhapcham Seller';

  /* price math */
  const minPrice = toNum(product.minPrice);
  const original   = toNum(product.price || product.originalPrice || minPrice);
  const directSale = toNum(product.salePrice || product.finalPrice);
  const pctSale    = toNum(product.salePercentage || product.discountPercentage);
  const pctPrice   = pctSale > 0 && original > 0 ? original - (original * pctSale) / 100 : 0;
  const fallbackAmt   = toNum(product.discountPrice);
  const inferredSale  = fallbackAmt > 0 && original > fallbackAmt ? original - fallbackAmt : 0;

  const price    = directSale || pctPrice || inferredSale || minPrice || original;
  const discount = pctSale > 0 ? pctSale : original > 0 && price > 0 && price < original
    ? Math.round((1 - price / original) * 100) : 0;

  /* image */
  const rawImg  = product.imagePaths?.[0] ?? product.imagePath ?? product.thumbnail ?? product.images?.[0]?.imagePath ?? null;
  const apiBase = BASE_URL || 'http://localhost:8080';
  const imgUrl  = rawImg ? (rawImg.startsWith('http') ? rawImg : `${apiBase}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : null;

  /* stock */
  const qty        = product.stockQuantity ?? product.quantity ?? null;
  const outOfStock = qty !== null && qty <= 0;
  const lowStock   = !outOfStock && qty !== null && qty <= 10;

  const effectivePrice  = price || minPrice || original;
  const hasFreeShipping = product.freeShipping || effectivePrice >= 2000;

  const productLink = getProductLink(product);

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

  const handleCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
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

  const ratingVal = Number(product.averageRating || product.rating || 0);

  /* ── badge label + colour (used only when no discount is present) ── */
  const badgeColorMap = {
    'Best Seller': 'bg-orange-500 text-white',
    New:           'bg-[#15803d] text-white',
    Trending:      'bg-blue-500 text-white',
    'Top Rated':   'bg-purple-500 text-white',
    'Hot Deal':    'bg-[#dc2626] text-white',
    Premium:       'bg-slate-800 text-white',
  };

  /* ── single top-left badge: priority = out of stock > discount > new > custom badge ── */
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
    if (product.isNew || badge === 'New') {
      return (
        <span className="bg-[#15803d] text-white text-[11px] font-bold px-2.5 py-1 rounded-md leading-none">
          New
        </span>
      );
    }
    if (badge) {
      return (
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md leading-none ${badgeColorMap[badge] || 'bg-[#15803d] text-white'}`}>
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
          <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
            <BrandLogo brandName={brand} />
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
              Rs.{(original / 100).toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock & Shipping Info */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] text-gray-600">
            <span className={`w-2 h-2 rounded-full ${outOfStock ? 'bg-gray-400' : 'bg-green-500'}`}></span>
            <span className="font-medium">
              {outOfStock ? 'Out of stock' : lowStock ? `Only ${qty} left` : 'In stock'}
            </span>
          </div>
          {hasFreeShipping && !outOfStock && (
            <div className="flex items-center gap-0.5 text-[11px] font-medium text-[#15803d]">
              <Truck className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Free delivery</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleCart}
          disabled={adding || outOfStock}
          className={`
            w-full mt-1 px-3 py-2 rounded-lg
            text-[12px] font-semibold
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#15803d]
            flex items-center justify-center gap-1
            ${outOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : added
              ? 'bg-[#14532d] text-white'
              : 'bg-[#15803d] hover:bg-[#166534] active:bg-[#14532d] text-white shadow-sm'
            }
          `}
        >
          <ShoppingCart className="w-4 h-4" strokeWidth={2} />
          {adding ? 'Adding…' : added ? 'Added' : outOfStock ? 'Unavailable' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
};

export default SimpleProductCard;