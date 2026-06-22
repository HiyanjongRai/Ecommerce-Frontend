import React, { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, Star, RefreshCw, AlertCircle, MessageSquare, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
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
            size={12}
            className={idx < val ? 'fill-amber-400 text-amber-400' : darkMode ? 'text-gray-700' : 'text-gray-200'}
          />
        ))}
      </div>
    );
  };

  /* KPI statistics calculation */
  const stats = React.useMemo(() => {
    const total = reviews.length;
    let sum = 0;
    let positive = 0;
    let critical = 0;
    reviews.forEach(r => {
      const rate = Number(r.rating || r.ratingValue || 0);
      sum += rate;
      if (rate >= 4) positive++;
      if (rate <= 2) critical++;
    });
    const avg = total > 0 ? (sum / total) : 0;
    return { total, avg, positive, critical };
  }, [reviews]);

  return (
    <AdminLayout pageTitle="Reviews Management" pageSubtitle={`${reviews.length} product reviews active`}>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-[20px] shadow-2xl border transition-all ${themeClasses.bg.secondary} ${themeClasses.border.accent} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      <div className="p-4 lg:p-6 space-y-6">
        
        {/* Dynamic Statistics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          
          {/* Total Reviews */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Total Reviews</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-2xs">
                <MessageSquare size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.total}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.tertiary}`}>Submissions received</p>
            </div>
          </div>

          {/* Average Rating */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Average Rating</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-2xs">
                <Star size={15} className="fill-amber-400" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.avg.toFixed(2)}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.warning}`}>Out of 5 stars</p>
            </div>
          </div>

          {/* Positive Reviews */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Positive Reviews</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                <ThumbsUp size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.positive}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.success}`}>4 & 5 Star feedback</p>
            </div>
          </div>

          {/* Critical Reviews */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Critical Feedback</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-2xs">
                <ThumbsDown size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.critical}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.danger}`}>1 & 2 Star feedback</p>
            </div>
          </div>

        </div>

        {/* Top filter bar */}
        <div className={`rounded-[20px] border p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search reviews, products, users..."
                className={`w-full pl-9 pr-4 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
              />
            </div>
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              className={`appearance-none pl-4 pr-8 py-2.5 text-xs font-black uppercase tracking-wider border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
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
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.outline}`}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Table container */}
        <div className={`rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Review ID', 'Product', 'Customer', 'Rating', 'Comment', 'Date', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${themeClasses.border.primary}`}>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`text-center py-16 font-semibold transition-colors ${themeClasses.text.secondary}`}>
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
                    <tr key={rId} className={`transition-colors hover:${themeClasses.bg.secondary}`}>
                      <td className={`px-5 py-4 font-mono font-black transition-colors ${themeClasses.text.accent}`}>
                        #{rId}
                      </td>
                      <td className="px-5 py-4">
                        <div className="max-w-[200px] truncate">
                          <p className={`font-bold truncate transition-colors ${themeClasses.text.primary}`} title={r.productName}>{r.productName || 'Unknown Product'}</p>
                          <span className={`text-[10px] font-semibold transition-colors ${themeClasses.text.tertiary}`}>ID: {r.productId || 'N/A'}</span>
                        </div>
                      </td>
                      <td className={`px-5 py-4 font-bold transition-colors ${themeClasses.text.primary}`}>
                        {r.userName || r.customerName || 'Anonymous'}
                      </td>
                      <td className="px-5 py-4">
                        <StarRating count={r.rating || r.ratingValue} />
                      </td>
                      <td className={`px-5 py-4 max-w-xs relative group cursor-pointer font-semibold transition-colors ${themeClasses.text.secondary} hover:${themeClasses.text.accent}`}>
                        <div className="truncate max-w-xs transition-colors">
                          {commentText}
                        </div>
                        {commentText.length > 40 && (
                          <div className={`absolute left-0 bottom-full mb-2 z-30 hidden group-hover:block rounded-xl p-3 w-64 shadow-xl border text-[11px] font-semibold transition-all ${themeClasses.card} ${themeClasses.border.accent} ${themeClasses.text.primary}`}>
                            {commentText}
                          </div>
                        )}
                      </td>
                      <td className={`px-5 py-4 font-semibold transition-colors ${themeClasses.text.tertiary}`}>
                        {date(r.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            setReviewToDelete(r);
                            setShowDeleteModal(true);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer ${themeClasses.status.danger}`}
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
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className={`relative rounded-[20px] border shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className={`flex items-center justify-between px-6 py-5 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className={`font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-colors ${themeClasses.text.primary}`}>
                <AlertCircle size={18} className="text-red-500" />
                Delete Review?
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className={`text-xs font-semibold leading-relaxed transition-colors ${themeClasses.text.secondary}`}>
                Are you sure you want to delete the review written by <span className={`font-bold transition-colors ${themeClasses.text.primary}`}>{reviewToDelete.userName || reviewToDelete.customerName || 'Anonymous'}</span>?
              </p>
              <div className={`text-[10px] font-black uppercase tracking-wider p-4 rounded-xl border transition-colors ${themeClasses.status.danger}`}>
                ⚠️ This action is permanent. It will permanently purge the review content and trigger a recalculation of the related product rating averages.
              </div>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.outline}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={working === (reviewToDelete.reviewId || reviewToDelete.id)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
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
