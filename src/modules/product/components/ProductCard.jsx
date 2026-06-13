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
      <div className="group relative bg-white border border-gray-200 rounded-xl p-1.5 transition-all duration-300 hover:shadow-[0_5px_15px_rgba(16,185,129,0.05)] hover:-translate-y-0.5 flex flex-col justify-between text-left h-full select-none w-full">
        
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-white rounded-lg mb-1 overflow-hidden flex items-center justify-center border border-gray-150">
          {showSaleBadge && (
            <span className="absolute top-1 left-1 border border-red-200 bg-white text-red-600 text-[6.5px] font-black uppercase tracking-wider px-1 py-0.2 rounded-xs z-10 shadow-sm">
              {saleLabel || 'SALE'}
            </span>
          )}
          {showDiscountBadge && (
            <span className="absolute top-1 left-1 border border-emerald-200 bg-white text-emerald-600 text-[6.5px] font-black uppercase tracking-wider px-1 py-0.2 rounded-xs z-10 shadow-sm">
              -{Math.round(discount)}%
            </span>
          )}

          {/* Persistent Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            disabled={wishing}
            className={`absolute top-1 right-1 z-20 p-0.5 rounded-full shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isWished
                ? 'bg-emerald-600 text-white'
                : 'bg-white/90 text-gray-500 hover:bg-emerald-600 hover:text-white'
            }`}
            title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className="w-2 h-2" />
          </button>
          
          {resolvedImageUrl ? (
            <img 
              src={resolvedImageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <span className="text-lg select-none">📦</span>
          )}

        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="text-[6.5px] font-bold uppercase tracking-widest mb-0.5 block text-gray-400">
              {hasVariantOptions ? 'Variant Options' : product.brand || product.category || 'Product'}
            </span>
            <Link to={getProductLink(product)} className="block">
              <h4 className="font-sans font-bold text-[9.5px] text-slate-800 leading-tight line-clamp-2 min-h-[22px] mb-0.5">
                {product.name}
              </h4>
            </Link>

            {/* Ratings */}
            {((product.averageRating || product.rating) > 0) ? (
              <div className="flex items-center gap-0.5 text-[7px] font-bold text-amber-500 mb-0.5">
                <span>★</span> {(product.averageRating || product.rating).toFixed(1)}
                <span className="font-normal text-gray-400 text-[6.5px]">({liveReviewCount})</span>
              </div>
            ) : (
              <div className="h-1.5" />
            )}

            {/* Pricing */}
            <div className="flex items-baseline gap-0.5 mb-1 flex-wrap">
              <span className="text-[9.5px] font-bold text-emerald-600">
                {showPriceRange
                  ? `Rs. ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
                  : `Rs. ${price.toLocaleString()}`}
              </span>
              {hasDiscount && original && (
                <span className="text-[7px] font-bold line-through text-gray-400">
                  Rs. {original.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          {hasVariantOptions ? (
            <Link
              to={getProductLink(product)}
              className="w-full mt-0.5 py-0.5 border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[8px] font-bold rounded-pill text-center transition-colors duration-250 focus:ring-2 focus:ring-emerald-500/20 outline-none block"
            >
              Select Options
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`w-full mt-0.5 py-0.5 border text-[8px] font-bold rounded-pill transition-colors duration-250 flex items-center justify-center gap-0.5 focus:ring-2 focus:ring-emerald-500/20 outline-none ${
                added 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50' 
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700'
              }`}
            >
              <ShoppingBag className="w-2 h-2" />
              <span>{adding ? '…' : added ? '✓ Added' : 'Add to Cart'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'} border rounded-xl ${isSmall ? 'p-1' : 'p-1.5'} flex flex-col justify-between transition-all duration-200 ${darkMode ? 'text-gray-100' : 'text-slate-900'} text-[9.5px] shadow-sm w-full`}>
      
      {/* Product Image */}
      <Link 
        to={getProductLink(product)} 
        className={`relative aspect-square w-full ${darkMode ? 'bg-zinc-950' : 'bg-white'} flex items-center justify-center overflow-hidden ${darkMode ? 'border-zinc-800' : 'border-gray-100'} border-b ${isSmall ? 'mb-0.5' : 'mb-1'} block`}
      >
        {showSaleBadge && (
          <span className="absolute top-1 left-1 border border-red-200 bg-white text-red-600 text-[6.5px] font-black uppercase tracking-wider px-1 py-0.2 rounded-xs z-10 shadow-sm">
            {saleLabel || 'SALE'}
          </span>
        )}
        {showDiscountBadge && (
          <span className="absolute top-1 left-1 border border-red-200 bg-white text-red-600 text-[6.5px] font-black uppercase tracking-wider px-1 py-0.2 rounded-xs z-10 shadow-sm">
            -{Math.round(discount)}%
          </span>
        )}
        
        {/* Wishlist Icon — high-contrast background for visibility over any image */}
        <button
          onClick={handleToggleWishlist}
          disabled={wishing}
          className={`absolute top-1 right-1 z-10 p-0.5 rounded-full shadow-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isWished
              ? darkMode
                ? 'bg-red-500/90 border-red-400 text-white focus:ring-red-400'
                : 'bg-red-50 border-red-200 text-red-500 focus:ring-red-300'
              : darkMode
                ? 'bg-zinc-800 border-zinc-600 text-gray-300 hover:bg-red-500 hover:border-red-400 hover:text-white focus:ring-zinc-500'
                : 'bg-white border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 focus:ring-gray-300'
          }`}
          title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {isWished ? (
            <svg className={`w-2.5 h-2.5 ${darkMode ? 'text-red-400' : 'text-red-500'} fill-current animate-in zoom-in`} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5 transition-transform group-hover/wishlist:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
        {resolvedImageUrl ? (
          <img 
            src={resolvedImageUrl} 
            alt={product.name} 
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <span className={`text-xl select-none ${darkMode ? 'text-zinc-700' : 'text-gray-300'}`}>🛍️</span>
        )}
      </Link>
 
      {/* Product Metadata */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className={`text-[6px] font-black uppercase tracking-widest mb-0.5 block ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {hasVariantOptions ? 'Variant product' : product.brand || product.category || 'Shop'}
          </span>
          <Link to={getProductLink(product)} className="block">
            <h4 className={`text-[9.5px] font-bold ${darkMode ? 'text-gray-100 group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'} transition-colors line-clamp-2 ${isSmall ? 'mb-0.5 min-h-[18px]' : 'mb-1 min-h-[22px]'} leading-tight`}>
              {product.name}
            </h4>
          </Link>
 
          {/* Ratings */}
          {((product.averageRating || product.rating) > 0) ? (
            <div className={`flex items-center gap-0.5 text-[7px] font-semibold text-[#e0a800] ${isSmall ? 'mb-0.5' : 'mb-1'}`}>
              <span className="text-[9px]">★</span> {(product.averageRating || product.rating).toFixed(1)}
              <span className={`font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>( {liveReviewCount} )</span>
            </div>
          ) : (
            <div className={isSmall ? "h-1" : "h-1.5"} />
          )}
 
          {/* Pricing */}
          <div className={`flex items-baseline gap-0.5 ${isSmall ? 'mb-1' : 'mb-1.5'} flex-wrap`}>
            <span className={`text-[9.5px] font-extrabold ${darkMode ? 'text-emerald-400' : 'text-slate-900'}`}>
              {showPriceRange
                ? `Rs. ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
                : `Rs. ${price.toLocaleString()}`}
            </span>
            {hasDiscount && original && (
              <span className={`text-[7px] font-bold line-through ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Rs. {original.toLocaleString()}
              </span>
            )}
          </div>
        </div>
 
        {/* Action Button */}
        {hasVariantOptions ? (
          <Link
            to={getProductLink(product)}
            className={`w-full text-[7px] font-black uppercase tracking-wider ${isSmall ? 'py-0.5' : 'py-1'} rounded-lg border transition-colors duration-150 flex items-center justify-center font-bold ${
              darkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                : 'border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
            }`}
          >
            Select Options
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-full text-[7px] font-black uppercase tracking-wider ${isSmall ? 'py-0.5' : 'py-1'} rounded-lg border transition-colors duration-150 ${
              added 
                ? darkMode 
                  ? 'bg-emerald-900 text-emerald-300 border-emerald-700 hover:bg-emerald-800' 
                  : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                : darkMode
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700'
                  : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
            }`}
          >
            {adding ? '…' : added ? '✓ Added' : 'Add to Cart'}
          </button>
        )}
      </div>

    </div>
  );
};

export default ProductCard;
