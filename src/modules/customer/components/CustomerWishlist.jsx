import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { getWishlist, removeFromWishlist, addToCart } from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../contexts/CustomerContext';
import { getProductLink } from '../../../shared/utils/slugHelper';

const CustomerWishlist = () => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
      <svg className="animate-spin w-6 h-6 text-[#10B981] mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading wishlist...</p>
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-20 px-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] animate-in fade-in duration-300 font-sans">
      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
        <Heart className="w-8 h-8 text-red-500 fill-red-100" />
      </div>
      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">Your wishlist is empty</h3>
      <p className="text-xs text-gray-500 font-semibold mb-6 max-w-sm mx-auto">
        Save items you love while browsing the store and keep track of them here.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-sm"
      >
        Browse Products
      </Link>
    </div>
  );

  return (
    <div className="pb-10 animate-in fade-in duration-300 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[22px] font-black text-gray-900 tracking-tight leading-tight mb-1">
            My Wishlist
          </h2>
          <p className="text-xs text-gray-500 font-semibold">
            {items.length} saved item{items.length !== 1 ? 's' : ''} in your collection.
          </p>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
        {items.map(item => {
          const p = item.product || item;
          const img = p.imagePaths?.[0] || p.images?.[0]?.imagePath || p.imagePath || null;
          const price = p.salePrice || p.price || 0;

          return (
            <div
              key={item.id || p.id}
              className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-emerald-100 transition-all duration-300"
            >
              {/* Image Wrap */}
              <div className="relative aspect-square w-full bg-gray-50/50 flex items-center justify-center overflow-hidden border-b border-gray-50 p-3">
                <Link to={getProductLink(p)} className="w-full h-full flex items-center justify-center">
                  {img ? (
                    <img
                      src={img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`}
                      alt={p.name}
                      className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
                      <span className="text-4xl text-gray-300 select-none">🛍️</span>
                    </div>
                  )}
                </Link>

                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={busyId === p.id}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur border border-gray-100 hover:bg-red-50 hover:border-red-100 hover:text-red-500 text-gray-400 rounded-full w-8 h-8 flex items-center justify-center shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all active:scale-95 z-10"
                  title="Remove from wishlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Details */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <Link to={getProductLink(p)} className="block">
                    <h4 className="text-[13px] font-bold text-gray-800 group-hover:text-[#10B981] transition-colors line-clamp-2 leading-snug mb-1.5">
                      {p.name}
                    </h4>
                  </Link>
                  <div className="text-[15px] font-black text-gray-900">
                    Rs. {price.toLocaleString()}
                  </div>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                  disabled={busyId === p.id}
                  onClick={() => handleAddToCart(p.id)}
                >
                  <ShoppingCart size={14} />
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerWishlist;
