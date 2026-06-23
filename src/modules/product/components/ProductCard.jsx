import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  addToCart,
  addToWishlist,
  getReviewsForProduct,
  removeFromWishlist,
} from '../../../shared/api/customerApi';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import { useHomeTheme } from '../../home/hooks/useHomeTheme';
import { getProductLink } from '../../../shared/utils/slugHelper';
import {
  ArrowRight,
  Heart,
  Package,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Eye,
} from 'lucide-react';

const toMoneyNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatTitle = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => {
      const lower = word.toLowerCase();
      if (lower === 'pro') return 'Pro';
      if (lower === 'max') return 'Max';
      if (lower === 'hd') return 'HD';
      if (lower === 'tv') return 'TV';
      if (word !== lower && word !== word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const pickBadge = (product, isOnSale, reviewCount) => {
  if (product.bestSeller || product.isBestSeller) return 'Best Seller';
  if (product.newArrival || product.isNewArrival) return 'New Arrival';
  if (product.trending || product.isTrending) return 'Trending';
  if (isOnSale) return 'Sale';
  if (reviewCount === 0) return 'Just Added';
  return 'Trending'; // Premium fallback badge
};

const ProductCard = ({ product, onAddToCartSuccess, isSmall = false, variant = 'default' }) => {
  const { user, refreshCart, wishlistIds, refreshWishlist } = useCustomer();
  const { darkMode } = useHomeTheme();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishing, setWishing] = useState(false);
  const [liveReviewCount, setLiveReviewCount] = useState(product.totalReviews || product.reviewCount || 0);

  const productId = product.productId || product.id;
  const isWished = wishlistIds?.has(productId) || false;

  const hasVariantOptions = product.hasVariants
    || (Array.isArray(product.variants) && product.variants.length > 0)
    || (product.minPrice != null && product.maxPrice != null && product.minPrice !== product.maxPrice);

  const colorOptions = useMemo(() => {
    if (!product.attributeOptions) return null;
    const colorKey = Object.keys(product.attributeOptions).find(key => key.toLowerCase().includes('color'));
    if (!colorKey) return null;
    return product.attributeOptions[colorKey];
  }, [product.attributeOptions]);

  const minPrice = toMoneyNumber(product.minPrice);
  const maxPrice = toMoneyNumber(product.maxPrice);
  const showPriceRange = hasVariantOptions && minPrice > 0 && maxPrice > 0 && minPrice !== maxPrice;
  const original = toMoneyNumber(product.price || product.originalPrice || (showPriceRange ? maxPrice : minPrice));
  const directSalePrice = toMoneyNumber(product.salePrice || product.finalPrice);
  const salePercentage = toMoneyNumber(product.salePercentage || product.discountPercentage);
  const percentageSalePrice = salePercentage > 0 && original > 0
    ? original - (original * salePercentage) / 100
    : 0;
  const fallbackDiscountAmount = toMoneyNumber(product.discountPrice);
  const inferredSalePrice = fallbackDiscountAmount > 0 && original > fallbackDiscountAmount
    ? original - fallbackDiscountAmount
    : 0;
  const price = directSalePrice || percentageSalePrice || inferredSalePrice || minPrice || original;

  const isOnSale = Boolean(product.onSale || product.isOnSale || (price > 0 && original > 0 && price < original));
  const discount = salePercentage > 0
    ? salePercentage
    : original > 0 && price > 0 && price < original
      ? Math.round((1 - price / original) * 100)
      : 0;
  const hasDiscount = discount > 0 && !showPriceRange;
  const showDiscountBadge = discount > 0;
  const badgeText = pickBadge(product, isOnSale || showDiscountBadge, liveReviewCount);

  const rawImg = product.imagePaths && product.imagePaths.length > 0
    ? product.imagePaths[0]
    : (product.imagePath || product.thumbnail || product.images?.[0]?.imagePath || null);

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const resolvedImageUrl = rawImg
    ? (rawImg.startsWith('http') ? rawImg : `${apiBaseUrl}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`)
    : null;

  // Spacing and sizing based on isSmall prop
  const cardPadding = isSmall ? 'p-2' : 'p-3';
  const cardWidth = isSmall ? 'w-full max-w-[230px]' : 'w-full max-w-[300px]';
  const titleSize = isSmall ? 'text-xs' : 'text-sm';
  const priceSize = isSmall ? (showPriceRange ? 'text-[11px]' : 'text-xs') : (showPriceRange ? 'text-[13px]' : 'text-base');
  const buttonHeight = isSmall ? 'h-8' : 'h-9';
  const buttonTextSize = isSmall ? 'text-[9px]' : 'text-[10px]';



  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      if (!productId) return;
      try {
        const res = await getReviewsForProduct(productId);
        if (isMounted) {
          const revs = Array.isArray(res.data) ? res.data : [];
          setLiveReviewCount(revs.length);
        }
      } catch {
        // silently ignore to keep cards snappy
      }
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.warning('Please login first to manage your wishlist.');
      return;
    }
    setWishing(true);
    try {
      if (isWished) {
        await removeFromWishlist(user.id, productId);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(user.id, productId);
        toast.success('Added to wishlist');
      }
      refreshWishlist();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update wishlist');
    } finally {
      setWishing(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.warning('Please login first to add items to your cart.');
      return;
    }
    setAdding(true);
    try {
      await addToCart(user.id, product.productId || product.id, {
        productId: product.productId || product.id,
        variantId: null,
        quantity: 1,
      });
      setAdded(true);
      refreshCart();
      if (onAddToCartSuccess) onAddToCartSuccess(product.productId || product.id);
      setTimeout(() => setAdded(false), 2000);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const trustNotes = [
    product.freeShipping ? 'Free Shipping' : 'Fast Shipping',
    product.warranty || product.warrantyPeriod ? `${product.warranty || product.warrantyPeriod} Warranty` : 'Warranty Included',
  ];

  const mainCta = hasVariantOptions ? 'Select Options' : (added ? 'Added' : 'Add to Cart');

  const stockInfo = useMemo(() => {
    const qty = product.stockQuantity ?? product.quantity ?? 12;
    if (qty <= 0) return { label: 'Out of Stock', cls: 'text-rose-500 bg-rose-50 border-rose-100/50' };
    if (qty <= 5) return { label: `Only ${qty} Left`, cls: 'text-amber-600 bg-amber-50 border-amber-100/50 animate-pulse' };
    return { label: 'Selling Fast', cls: 'text-green-700 bg-green-50 border-green-100/30' };
  }, [product]);

  return (
    <div
      className={`group relative flex flex-col justify-between h-full w-full mx-auto overflow-hidden rounded-[16px] border duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] ${cardWidth} ${
        darkMode
          ? 'border-white/10 bg-[#0d1117] text-white shadow-none'
          : 'border-[#E2E8F0] bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
      } ${cardPadding}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.01),transparent_30%)] pointer-events-none" />

      <div className="flex flex-col flex-1">
        {/* Top Badges / Wishlist row */}
        <div className="mb-1.5 flex items-center justify-between gap-1.5 relative z-20">
          <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border border-green-100/50">
            {badgeText}
          </span>

          <button
            onClick={handleToggleWishlist}
            disabled={wishing}
            className={`flex h-7.5 w-7.5 items-center justify-center rounded-full border shadow-[0_2px_6px_rgba(15,23,42,0.03)] transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/25 ${
              isWished
                ? 'border-rose-100 bg-rose-50 text-rose-500'
                : darkMode
                  ? 'border-white/10 bg-[#1e293b]/80 text-white/70 hover:bg-rose-50 hover:text-rose-500'
                  : 'border-slate-100 bg-white/90 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
            }`}
            title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`h-3.5 w-3.5 transition-colors duration-200 ${isWished ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Image Container */}
        <div className={`relative w-full ${isSmall ? 'h-[125px]' : 'h-[170px]'} overflow-hidden rounded-lg border bg-white flex items-center justify-center p-0 ${
          darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/15'
        }`}>
          {resolvedImageUrl ? (
            <img
              src={resolvedImageUrl}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 scale-[1.18] group-hover:scale-[1.23]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Package className="h-6 w-6 stroke-[1.2]" />
            </div>
          )}

          {/* Quick View Hover Overlay */}
          <Link 
            to={getProductLink(product)}
            className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10 rounded-lg"
          >
            <span className="bg-white/95 text-slate-900 text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg shadow-xs hover:scale-105 hover:bg-white transition-all flex items-center gap-1">
              <Eye className="h-2.5 w-2.5 text-slate-800" />
              Quick View
            </span>
          </Link>

          {/* Stock Urgency Status Overlay on bottom-left of the image wrapper */}
          <span className={`absolute bottom-1.5 left-1.5 z-10 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-sm ${stockInfo.cls}`}>
            {stockInfo.label}
          </span>
        </div>

        {/* Category & Stock Row */}
        <div className="mt-1.5 flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
            {product.category || 'eCommerce'}
          </span>
        </div>

        {/* Title */}
        <Link to={getProductLink(product)} className="block mt-0.5">
          <h4 className={`font-bold tracking-tight leading-snug truncate hover:text-green-600 transition-colors duration-200 ${titleSize} ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {formatTitle(product.name)}
          </h4>
        </Link>

        {/* Color Swatches if variants exist - Place directly below product title */}
        {colorOptions && colorOptions.length > 0 && (
          <div className="flex gap-1.5 mt-1 mb-0.5">
            {colorOptions.slice(0, 4).map((opt) => {
              const colorVal = opt.value.trim().toLowerCase();
              return (
                <span
                  key={opt.id || opt.value}
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs cursor-pointer hover:scale-125 transition-transform duration-200"
                  style={{ backgroundColor: colorVal }}
                  title={opt.value}
                />
              );
            })}
          </div>
        )}

        {/* Rating Section - Display dynamic reviews only if present in the database */}
        {(liveReviewCount > 0 || (product.averageRating || product.rating) > 0) && (
          <div className="mt-1 flex items-center gap-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 stroke-0" />
              <span className={`${darkMode ? 'text-slate-200' : 'text-slate-800'} font-bold`}>
                {Number(product.averageRating || product.rating).toFixed(1)}
              </span>
              <span className="text-slate-400 font-normal">({liveReviewCount || product.totalReviews || 0})</span>
            </div>
          </div>
        )}

        {/* Description (Hidden for Small cards to save space) */}
        {!isSmall && (
          <p className={`mt-1 text-[11px] leading-[1.4] line-clamp-2 overflow-hidden ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {product.shortDescription || product.description || 'High-quality marketplace product.'}
          </p>
        )}

        {/* Price Row */}
        <div className="mt-auto flex flex-col gap-0.5 pt-2">
          <span className={`font-bold text-green-600 font-mono tracking-tight ${priceSize}`}>
            {showPriceRange
              ? `Rs. ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
              : `Rs. ${price.toLocaleString()}`}
          </span>
          {hasDiscount && original && original > price && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium line-through text-slate-400 font-mono">
                Rs. {original.toLocaleString()}
              </span>
              <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.2 text-[9px] font-semibold text-rose-600 border border-rose-100">
                {Math.round(discount)}% OFF
              </span>
            </div>
          )}
        </div>

        {/* Features Section (Hidden for Small cards) */}
        {!isSmall && (
          <div className={`border-t pt-1.5 mt-2 flex items-center justify-between text-[9px] font-semibold ${
            darkMode ? 'border-white/10 text-slate-400' : 'border-[#E2E8F0] text-slate-500'
          }`}>
            <div className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-green-600" strokeWidth={2} />
              <span>Free Shipping</span>
            </div>
            <div className={`w-px h-3.5 ${darkMode ? 'bg-white/10' : 'bg-slate-250'}`} />
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" strokeWidth={2} />
              <span>Warranty Included</span>
            </div>
          </div>
        )}
      </div>

      {/* Button Row */}
      {hasVariantOptions ? (
        <Link
          to={getProductLink(product)}
          className={`mt-2 flex ${buttonHeight} w-full items-center justify-center gap-1.5 rounded-lg border-2 ${buttonTextSize} font-bold tracking-wider transition-all duration-200 hover:shadow-[0_2px_6px_rgba(16,185,129,0.08)] active:scale-[0.98] ${
            darkMode
              ? 'border-green-500 bg-[#0d1117] text-green-400 hover:bg-slate-900'
              : 'border-green-600 bg-white text-green-700 hover:bg-green-50'
          }`}
        >
          <span>Select Options</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className={`mt-2 flex ${buttonHeight} w-full items-center justify-center gap-1.5 rounded-lg text-white ${buttonTextSize} font-bold tracking-wider transition-all duration-200 hover:shadow-[0_2px_6px_rgba(16,185,129,0.15)] disabled:opacity-60 active:scale-[0.98] ${
            darkMode
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <ShoppingBag className="h-3 w-3" />
          <span>{adding ? 'Adding...' : added ? 'Added' : 'Add to Cart'}</span>
        </button>
      )}
    </div>
  );
};

export default ProductCard;
