import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="flex items-center gap-2 py-6 text-gray-400 text-xs">
      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Loading wishlist…
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-12 bg-white border border-gray-200 rounded-sm">
      <div className="text-4xl mb-3 select-none">❤️</div>
      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-1">Your wishlist is empty</h3>
      <p className="text-[10px] text-gray-400 mb-5">Save items you love while browsing the store.</p>
      <Link
        to="/product-list"
        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors duration-150"
      >
        Browse Products →
      </Link>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">My Wishlist</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {items.map(item => {
          const p = item.product || item;
          const img = p.imagePaths?.[0] || p.images?.[0]?.imagePath || p.imagePath || null;
          const price = p.salePrice || p.price || 0;

          return (
            <div
              key={item.id || p.id}
              className="group relative bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow duration-200 text-xs"
            >
              {/* Image Wrap */}
              <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
                <Link to={getProductLink(p)} className="w-full h-full block">
                  {img ? (
                    <img
                      src={img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`}
                      alt={p.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <span className="text-3xl text-gray-300 select-none">🛍️</span>
                    </div>
                  )}
                </Link>

                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={busyId === p.id}
                  className="absolute top-1.5 right-1.5 bg-red-500/95 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[8px] font-black shadow transition-colors active:scale-95 z-10"
                >
                  ✕
                </button>
              </div>

              {/* Details */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <Link to={getProductLink(p)} className="block">
                    <h4 className="text-[10px] font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1 min-h-[26px] leading-tight">
                      {p.name}
                    </h4>
                  </Link>
                  <div className="text-[11px] font-extrabold text-gray-900 mb-2">
                    Rs. {price.toLocaleString()}
                  </div>
                </div>

                <button
                  className="w-full bg-[#222529] hover:bg-black text-white text-[8px] font-black uppercase tracking-wider py-1.5 rounded-sm border border-[#222529] transition-colors duration-150"
                  disabled={busyId === p.id}
                  onClick={() => handleAddToCart(p.id)}
                >
                  Move to Cart
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
