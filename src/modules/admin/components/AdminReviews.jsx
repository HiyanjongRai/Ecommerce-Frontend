import React, { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, Star, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { getAdminReviews, deleteAdminReview } from '../services/adminService';

const date = v => v ? new Date(v).toLocaleString() : 'N/A';

export default function AdminReviews() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const [working, setWorking] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews();
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setReviews([]);
      showToast('❌ Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    const reviewId = reviewToDelete.reviewId || reviewToDelete.id;
    setWorking(reviewId);
    try {
      await deleteAdminReview(reviewId);
      setReviews(prev => prev.filter(r => (r.reviewId || r.id) !== reviewId));
      showToast('✅ Review deleted successfully');
      setShowDeleteModal(false);
      setReviewToDelete(null);
    } catch (err) {
      showToast('❌ Failed to delete review');
    } finally {
      setWorking(null);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const rVal = r.rating || r.ratingValue || 0;
    const matchRating = ratingFilter === 'ALL' || Number(rVal) === Number(ratingFilter);
    const q = search.toLowerCase();
    const matchSearch = !search || [
      String(r.reviewId || r.id),
      r.productName,
      r.userName,
      r.customerName,
      r.comment,
      r.reviewText
    ].some(f => f?.toLowerCase().includes(q));
    return matchRating && matchSearch;
  });

  const StarRating = ({ count }) => {
    const val = Number(count || 0);
    return (
      <div className="flex items-center gap-0.5">
        {Array(5).fill(0).map((_, idx) => (
          <Star
            key={idx}
            size={13}
            className={idx < val ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout pageTitle="Reviews Management" pageSubtitle={`${reviews.length} product reviews active`}>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 backdrop-blur-md text-sm font-bold px-4 py-3 rounded-xl shadow-xl transition-all duration-300 ${themeClasses.bg.primary} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      {/* Top filter bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 transition-colors ${themeClasses.card}`}>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-sm">
            <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${themeClasses.text.tertiary}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID, product name, customer..."
              className={`w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
            />
          </div>
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            className={`px-3 py-2 text-sm border rounded-lg font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        <button
          onClick={loadReviews}
          className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-colors ${themeClasses.button.outline}`}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className={`p-6 transition-colors ${themeClasses.bg.primary}`}>
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Review ID', 'Product', 'Customer', 'Rating', 'Comment', 'Date', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.secondary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`text-center py-16 font-medium transition-colors ${themeClasses.text.secondary}`}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <MessageSquare size={28} className={`transition-colors ${themeClasses.text.tertiary}`} />
                        <p>No reviews matching current criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredReviews.map(r => {
                  const rId = r.reviewId || r.id;
                  const commentText = r.comment || r.reviewText || '—';
                  return (
                    <tr key={rId} className={`border-b transition-colors ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`}>
                      <td className={`px-4 py-3 font-mono font-bold transition-colors ${themeClasses.text.accent}`}>
                        #{rId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[200px] truncate">
                          <p className={`font-semibold truncate transition-colors ${themeClasses.text.primary}`} title={r.productName}>{r.productName || 'Unknown Product'}</p>
                          <span className={`text-[10px] font-mono transition-colors ${themeClasses.text.tertiary}`}>ID: {r.productId || 'N/A'}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 font-semibold transition-colors ${themeClasses.text.primary}`}>
                        {r.userName || r.customerName || 'Anonymous'}
                      </td>
                      <td className="px-4 py-3">
                        <StarRating count={r.rating || r.ratingValue} />
                      </td>
                      <td className={`px-4 py-3 max-w-xs relative group cursor-pointer text-xs transition-colors ${themeClasses.text.secondary} hover:${themeClasses.text.accent}`}>
                        <div className="truncate max-w-xs transition-colors">
                          {commentText}
                        </div>
                        {commentText.length > 40 && (
                          <div className={`absolute left-0 bottom-full mb-1 z-30 hidden group-hover:block rounded-lg p-3 w-64 shadow-xl pointer-events-none text-xs transition-colors ${themeClasses.bg.primary} ${themeClasses.text.primary}`}>
                            {commentText}
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.tertiary}`}>
                        {date(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setReviewToDelete(r);
                            setShowDeleteModal(true);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${themeClasses.status.danger}`}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 backdrop-blur-xs transition-colors ${darkMode ? 'bg-black/50' : 'bg-black/40'}`} onClick={() => setShowDeleteModal(false)} />
          <div className={`relative rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-zoom-in transition-colors ${themeClasses.bg.primary}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className={`font-black text-base flex items-center gap-2 transition-colors ${themeClasses.text.primary}`}>
                <AlertCircle size={20} className="text-red-500" />
                Delete Review?
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <p className={`text-sm leading-relaxed transition-colors ${themeClasses.text.secondary}`}>
                Are you sure you want to delete the review by <span className={`font-bold transition-colors ${themeClasses.text.primary}`}>{reviewToDelete.userName || reviewToDelete.customerName || 'Anonymous'}</span>?
              </p>
              <div className={`text-xs p-3 rounded-xl border transition-colors ${themeClasses.status.danger}`}>
                ⚠️ This action is permanent and cannot be undone. It will remove the review comment and recalculate the product rating averages.
              </div>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 border rounded-xl text-xs font-bold transition-colors ${themeClasses.button.outline}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={working === (reviewToDelete.reviewId || reviewToDelete.id)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {working === (reviewToDelete.reviewId || reviewToDelete.id) ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
