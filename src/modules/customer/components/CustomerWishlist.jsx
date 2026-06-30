import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Share2, MoreVertical, Bell, Clock, Eye, Tag, PackageCheck } from 'lucide-react';
import { getWishlist, removeFromWishlist, addToCart } from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../contexts/CustomerContext';
import { getProductLink } from '../../../shared/utils/slugHelper';

const SIDEBAR_LINKS = [
  { id: 'wishlist', label: 'My Wishlist', icon: Heart, active: true },
  { id: 'recent', label: 'Recently Viewed', icon: Clock },
  { id: 'pricedrop', label: 'Price Drop', icon: Tag },
  { id: 'backinstock', label: 'Back In Stock', icon: PackageCheck },
];

const CustomerWishlist = () => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { user, refreshCart } = useCustomer();
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); setItems([]); return; }
    setLoading(true);
    try {
      const res = await getWishlist(userId);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch { setItems([]); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (productId) => {
    setBusyId(productId);
    try { await removeFromWishlist(userId, productId); await load(); } catch { /* ignore */ }
    setBusyId(null);
  };

  const handleAddToCart = async (productId) => {
    setBusyId(productId);
    try {
      await addToCart(userId, { productId, quantity: 1 });
      refreshCart();
      alert('Added to cart!');
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    setBusyId(null);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Remove all items from your wishlist?')) return;
    setBulkBusy(true);
    try {
      await Promise.allSettled(items.map(item => removeFromWishlist(userId, (item.product || item).id)));
      await load();
    } catch { /* ignore */ }
    setBulkBusy(false);
  };

  const handleMoveAllToCart = async () => {
    setBulkBusy(true);
    try {
      await Promise.allSettled(items.map(item => addToCart(userId, { productId: (item.product || item).id, quantity: 1 })));
      refreshCart();
      alert('All items added to cart!');
    } catch { /* ignore */ }
    setBulkBusy(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Wishlist', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Wishlist link copied to clipboard!');
      }
    } catch { /* ignore */ }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
      <svg className="animate-spin w-6 h-6 text-[#16A34A] mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading wishlist...</p>
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-2xl animate-in fade-in duration-300 font-sans">
      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Heart className="w-8 h-8 text-red-500 fill-red-100" />
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
      <p className="text-xs text-gray-500 font-medium mb-6 max-w-sm mx-auto">
        Save items you love while browsing the store and keep track of them here.
      </p>
      <Link to="/" className="inline-flex items-center gap-2 bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-colors">
        Browse Products
      </Link>
    </div>
  );

  return (
    <div className="pb-10 animate-in fade-in duration-300 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Wishlist ({items.length})</h1>
          <p className="text-sm text-slate-500 mt-1">Save your favorite products and buy them later.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleShare} className="flex items-center gap-1.5 border border-gray-300 hover:border-slate-400 text-slate-600 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share Wishlist
          </button>
          <button onClick={handleClearAll} disabled={bulkBusy} className="flex items-center gap-1.5 border border-gray-300 hover:border-red-300 hover:text-red-500 text-slate-600 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
          <button onClick={handleMoveAllToCart} disabled={bulkBusy} className="flex items-center gap-1.5 border border-[#16A34A] text-[#16A34A] hover:bg-green-50 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <ShoppingCart className="w-3.5 h-3.5" /> Move All to Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 items-start">

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 px-2 mb-2">Wishlist Options</h3>
            <nav className="space-y-1">
              {SIDEBAR_LINKS.map(({ id, label, icon: Icon, active }) => (
                <div
                  key={id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                    active ? 'bg-green-50 text-[#16A34A]' : 'text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" /> {label}
                  </span>
                  {active && <span className="text-xs font-bold bg-[#16A34A] text-white rounded-full px-2 py-0.5">{items.length}</span>}
                </div>
              ))}
            </nav>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="flex items-start gap-2.5 mb-3">
              <Bell className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Price Drop Alerts</p>
                <p className="text-xs text-slate-500 mt-0.5">Get notified when items in your wishlist go on sale.</p>
              </div>
            </div>
            <button className="w-full bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg transition-colors">
              Enable Alerts
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {items.map(item => {
              const p = item.product || item;
              const img = p.imagePaths?.[0] || p.images?.[0]?.imagePath || p.imagePath || null;
              const price = p.salePrice || p.price || 0;
              const originalPrice = p.salePrice && p.price && p.price > p.salePrice ? p.price : null;
              const discountPercent = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : (p.salePercentage || 0);
              const inStock = (p.stockQuantity ?? 1) > 0;

              return (
                <div
                  key={item.id || p.id}
                  className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-green-100 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square w-full bg-gray-50/50 flex items-center justify-center overflow-hidden border-b border-gray-50 p-4">
                    {discountPercent > 0 && (
                      <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">-{discountPercent}%</span>
                    )}
                    {p.isBestSeller && discountPercent <= 0 && (
                      <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">Best Seller</span>
                    )}
                    {p.isNew && discountPercent <= 0 && !p.isBestSeller && (
                      <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">New</span>
                    )}

                    <button
                      onClick={() => handleRemove(p.id)}
                      disabled={busyId === p.id}
                      className="absolute top-2.5 right-2.5 z-10"
                      title="Remove from wishlist"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-red-500 hover:scale-110 transition-transform" />
                    </button>

                    <Link to={getProductLink(p)} className="w-full h-full flex items-center justify-center">
                      {img ? (
                        <img
                          src={img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`}
                          alt={p.name}
                          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
                          <span className="text-4xl text-gray-300 select-none">🛍️</span>
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <Link to={getProductLink(p)} className="block">
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#16A34A] transition-colors line-clamp-2 leading-snug mb-1.5">
                          {p.name}
                        </h4>
                      </Link>
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-base font-bold text-slate-900">${price.toLocaleString()}</span>
                        {originalPrice && (
                          <span className="text-xs text-slate-400 line-through">${originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                      <span className={`inline-block text-[11px] font-semibold ${inStock ? 'text-[#16A34A]' : 'text-red-500'}`}>
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-70"
                        disabled={busyId === p.id || !inStock}
                        onClick={() => handleAddToCart(p.id)}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>
                      <button className="w-9 h-9 flex-shrink-0 border border-gray-300 hover:border-slate-400 rounded-lg flex items-center justify-center text-slate-500 transition-colors">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-9 h-9 flex-shrink-0 border border-gray-300 hover:border-slate-400 rounded-lg flex items-center justify-center text-slate-500 transition-colors">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 mt-5">Showing all {items.length} item{items.length !== 1 ? 's' : ''} in your wishlist</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerWishlist;