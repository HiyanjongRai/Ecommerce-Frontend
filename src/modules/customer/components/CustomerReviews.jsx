import React, { useEffect, useState, useCallback } from 'react';
import { getMyReviews, deleteReview } from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../contexts/CustomerContext';

const Stars = ({ rating }) => (
  <span className="text-yellow-500 tracking-wider font-semibold select-none">
    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
  </span>
);

const CustomerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);
  const { user } = useCustomer();
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); setReviews([]); return; }
    setLoading(true);
    try {
      const res = await getMyReviews(userId);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch { setReviews([]); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    setBusyId(reviewId);
    try { await deleteReview(reviewId); await load(); } catch { alert('Delete failed'); }
    setBusyId(null);
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-8 text-gray-400 text-sm">
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Loading reviews…
    </div>
  );

  if (reviews.length === 0) return (
    <div className="text-center py-16 bg-white border border-gray-200 rounded-sm">
      <div className="text-5xl mb-4 select-none">⭐</div>
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2">No reviews yet</h3>
      <p className="text-xs text-gray-400">After receiving orders, you can leave product reviews.</p>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-800">My Reviews</h2>
      </div>

      <div className="space-y-4">
        {reviews.map(r => {
          const img = r.images?.[0]?.imagePath || r.imagePath || null;
          return (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-sm p-5 flex gap-4 items-start hover:shadow-sm transition-shadow"
            >
              {img && (
                <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                  <img
                    src={img.startsWith('http') ? img : `${BASE_URL}${img}`}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                  <Stars rating={r.rating} />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : ''}
                  </span>
                </div>
                <h4 className="text-xs font-black text-gray-900 mb-1.5">
                  {r.productName || `Product #${r.productId}`}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {r.comment}
                </p>
              </div>

              <button
                className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 border border-red-100 rounded-sm transition-colors duration-150 disabled:opacity-50 flex-shrink-0"
                disabled={busyId === r.id}
                onClick={() => handleDelete(r.id)}
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerReviews;
