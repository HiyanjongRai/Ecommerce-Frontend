import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addToCart, addToWishlist, removeFromWishlist, getReviewsForProduct } from '../../../shared/api/customerApi';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import { useHomeTheme } from '../../home/hooks/useHomeTheme';
import { getProductLink } from '../../../shared/utils/slugHelper';
import { Heart, ShoppingBag } from 'lucide-react';

const toMoneyNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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

  const hasVariantOptions = product.hasVariants || (Array.isArray(product.variants) && product.variants.length > 0) || (
    product.minPrice != null && product.maxPrice != null && product.minPrice !== product.maxPrice
  );
  const minPrice = toMoneyNumber(product.minPrice);
  const maxPrice = toMoneyNumber(product.maxPrice);
  const showPriceRange = hasVariantOptions && minPrice > 0 && maxPrice > 0 && minPrice !== maxPrice;
  const original = toMoneyNumber(product.price || product.originalPrice || (showPriceRange ? maxPrice : minPrice));
  const directSalePrice = toMoneyNumber(product.salePrice || product.finalPrice);
  const isOnSale = Boolean(product.onSale);
  const salePercentage = toMoneyNumber(product.salePercentage || product.discountPercentage);
  const percentageSalePrice = !directSalePrice && salePercentage > 0 && original > 0
    ? original - (original * salePercentage) / 100
    : 0;
  const fallbackDiscountAmount = toMoneyNumber(product.discountPrice);
  const legacyCardFinalPrice = !directSalePrice && !percentageSalePrice && isOnSale && fallbackDiscountAmount > 0 && original > fallbackDiscountAmount
    ? fallbackDiscountAmount
    : 0;
  const inferredFinalPrice = !directSalePrice && !percentageSalePrice && !legacyCardFinalPrice && fallbackDiscountAmount > 0 && original > fallbackDiscountAmount
    ? original - fallbackDiscountAmount
    : 0;
  const price = directSalePrice || percentageSalePrice || legacyCardFinalPrice || inferredFinalPrice || minPrice || original;
  const saleLabel = String(product.saleLabel || '').trim();
  const normalizedSaleLabel = saleLabel.toUpperCase();
  const discount = salePercentage > 0
    ? salePercentage
    : original > 0 && price > 0 && price < original
      ? Math.round((1 - price / original) * 100)
      : 0;
  const hasDiscount = discount > 0 && !showPriceRange;
  const discountBadgeMode = normalizedSaleLabel.includes('DISCOUNT') || normalizedSaleLabel.includes('OFF') || normalizedSaleLabel.includes('%') || salePercentage > 0 || legacyCardFinalPrice > 0;
  const showDiscountBadge = discount > 0 && discountBadgeMode;
  const showSaleBadge = isOnSale && !showDiscountBadge;
  
  // Resolve Image Path
  const rawImg = product.imagePaths && product.imagePaths.length > 0 
    ? product.imagePaths[0] 
    : (product.imagePath || product.thumbnail || product.images?.[0]?.imagePath || null);
    
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const resolvedImageUrl = rawImg
    ? (rawImg.startsWith('http') ? rawImg : `${apiBaseUrl}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`)
    : null;

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
      } catch (err) {
        // silently ignore to prevent console spam
      }
    };
    fetchReviews();
    return () => { isMounted = false; };
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
        quantity: 1
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

  if (variant === 'verdant') {
    return (
      <div className="group relative bg-white border border-gray-150 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(16,185,129,0.08)] hover:-translate-y-1 flex flex-col justify-between text-left h-full select-none w-full">
        
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-white rounded-xl mb-3 overflow-hidden flex items-center justify-center border border-gray-100">
          {showSaleBadge && (
            <span className="absolute top-2 left-2 border border-red-200 bg-white text-red-600 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg z-10 shadow-sm">
              {saleLabel || 'SALE'}
            </span>
          )}
          {showDiscountBadge && (
            <span className="absolute top-2 left-2 border border-emerald-250 bg-white text-emerald-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg z-10 shadow-sm">
              -{Math.round(discount)}%
            </span>
          )}

          {/* Persistent Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            disabled={wishing}
            className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full shadow-md border bg-white/90 backdrop-blur-xs flex items-center justify-center transition-all duration-200 focus:outline-none hover:scale-105 focus:ring-2 focus:ring-emerald-500 ${
              isWished
                ? 'border-emerald-200 text-red-500 bg-emerald-50'
                : 'border-gray-200 text-gray-400 hover:bg-emerald-50 hover:text-red-500'
            }`}
            title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isWished ? 'fill-current text-red-500' : ''}`} />
          </button>
          
          {resolvedImageUrl ? (
            <img 
              src={resolvedImageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <span className="text-2xl select-none">📦</span>
          )}

        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-gray-400">
              {hasVariantOptions ? 'Variant Options' : product.brand || product.category || 'Product'}
            </span>
            <Link to={getProductLink(product)} className="block">
              <h4 className="font-sans font-bold text-sm text-slate-800 leading-tight line-clamp-2 min-h-[38px] mb-1.5 hover:text-emerald-600 transition-colors">
                {product.name}
              </h4>
            </Link>

            {/* Ratings */}
            {((product.averageRating || product.rating) > 0) ? (
              <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-500 mb-1.5">
                <span className="text-[14px]">★</span> {(product.averageRating || product.rating).toFixed(1)}
                <span className="font-normal text-gray-400 text-[11px] ml-1">({liveReviewCount})</span>
              </div>
            ) : (
              <div className="h-4" />
            )}

            {/* Pricing */}
            <div className="flex items-baseline gap-1.5 mb-2.5 flex-wrap">
              <span className="text-[15px] font-extrabold text-emerald-600">
                {showPriceRange
                  ? `Rs. ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
                  : `Rs. ${price.toLocaleString()}`}
              </span>
              {hasDiscount && original && (
                <span className="text-xs font-semibold line-through text-gray-400">
                  Rs. {original.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          {hasVariantOptions ? (
            <Link
              to={getProductLink(product)}
              className="w-full mt-1.5 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold rounded-xl text-center transition-colors duration-250 focus:ring-2 focus:ring-emerald-500/20 outline-none block"
            >
              Select Options
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`w-full mt-1.5 py-2 border text-xs font-bold rounded-xl transition-all duration-250 flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-emerald-500/20 outline-none ${
                added 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50' 
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 shadow-sm hover:shadow'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{adding ? '…' : added ? '✓ Added' : 'Add to Cart'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative ${darkMode ? 'bg-zinc-950 border-zinc-800 text-gray-105' : 'bg-white border-gray-200 text-slate-900'} border rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 w-full`}>
      
      {/* Product Image */}
      <Link 
        to={getProductLink(product)} 
        className={`relative aspect-square w-full ${darkMode ? 'bg-zinc-950' : 'bg-white'} flex items-center justify-center overflow-hidden rounded-xl ${darkMode ? 'border-zinc-800' : 'border-gray-100'} border mb-2 block`}
      >
        {showSaleBadge && (
          <span className="absolute top-2 left-2 border border-red-205 bg-white text-red-600 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg z-10 shadow-sm">
            {saleLabel || 'SALE'}
          </span>
        )}
        {showDiscountBadge && (
          <span className="absolute top-2 left-2 border border-red-205 bg-white text-red-650 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg z-10 shadow-sm">
            -{Math.round(discount)}%
          </span>
        )}
        
        {/* Wishlist Icon — high-contrast background for visibility over any image */}
        <button
          onClick={handleToggleWishlist}
          disabled={wishing}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full shadow-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center ${
            isWished
              ? darkMode
                ? 'bg-red-500/95 border-red-400 text-white focus:ring-red-400'
                : 'bg-red-50 border-red-200 text-red-500 focus:ring-red-300'
              : darkMode
                ? 'bg-zinc-900/90 border-zinc-700 text-gray-300 hover:bg-red-500 hover:border-red-400 hover:text-white focus:ring-zinc-500'
                : 'bg-white/90 border-gray-205 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 focus:ring-gray-305'
          }`}
          title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
        </button>
        {resolvedImageUrl ? (
          <img 
            src={resolvedImageUrl} 
            alt={product.name} 
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-350" 
          />
        ) : (
          <span className={`text-2xl select-none ${darkMode ? 'text-zinc-700' : 'text-gray-300'}`}>🛍️</span>
        )}
      </Link>
 
      {/* Product Metadata */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {hasVariantOptions ? 'Variant product' : product.brand || product.category || 'Shop'}
          </span>
          <Link to={getProductLink(product)} className="block">
            <h4 className={`text-sm font-bold ${darkMode ? 'text-gray-100 group-hover:text-emerald-400' : 'text-slate-800 group-hover:text-[#16A34A]'} transition-colors line-clamp-2 mb-1.5 min-h-[38px] leading-tight`}>
              {product.name}
            </h4>
          </Link>
 
          {/* Ratings */}
          {((product.averageRating || product.rating) > 0) ? (
            <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-500 mb-1.5">
              <span className="text-[14px]">★</span> {(product.averageRating || product.rating).toFixed(1)}
              <span className={`font-normal text-[11px] ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>({liveReviewCount})</span>
            </div>
          ) : (
            <div className="h-4" />
          )}
 
          {/* Pricing */}
          <div className="flex items-baseline gap-1.5 mb-2.5 flex-wrap">
            <span className={`text-[15px] font-extrabold ${darkMode ? 'text-emerald-400' : 'text-slate-900'}`}>
              {showPriceRange
                ? `Rs. ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
                : `Rs. ${price.toLocaleString()}`}
            </span>
            {hasDiscount && original && (
              <span className={`text-xs font-semibold line-through ${darkMode ? 'text-gray-650' : 'text-gray-400'}`}>
                Rs. {original.toLocaleString()}
              </span>
            )}
          </div>
        </div>
 
        {/* Action Button */}
        {hasVariantOptions ? (
          <Link
            to={getProductLink(product)}
            className={`w-full py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors duration-150 flex items-center justify-center ${
              darkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' 
                : 'border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white shadow-2xs'
            }`}
          >
            Select Options
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-full py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 ${
              added 
                ? darkMode 
                  ? 'bg-emerald-900 text-emerald-300 border-emerald-700 hover:bg-emerald-800' 
                  : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                : darkMode
                  ? 'bg-[#16A34A] text-white border-transparent hover:bg-[#15803D]'
                  : 'bg-slate-900 text-white border-transparent hover:bg-slate-800 shadow-sm'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{adding ? '…' : added ? '✓ Added' : 'Add to Cart'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
