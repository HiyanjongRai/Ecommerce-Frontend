import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyReviews, deleteReview, updateReview } from '../../../shared/api/customerApi';
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
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
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

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editComment.trim()) {
      setEditError('Please enter a comment.');
      return;
    }
    setSubmittingEdit(true);
    setEditError('');
    try {
      await updateReview(editingReview.id, {
        rating: editRating,
        comment: editComment.trim()
      });
      await load();
      setEditingReview(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update review.');
    } finally {
      setSubmittingEdit(false);
    }
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
      <div className="flex items-center justify-center w-12 h-12 bg-amber-50 border border-amber-100 rounded-sm mx-auto mb-4">
        <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2">No reviews yet</h3>
      <p className="text-xs text-gray-400 mb-5">After receiving an order, you can leave a product review.</p>
      <Link
        to="/account/orders"
        className="inline-block bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors duration-150"
      >
        View My Orders →
      </Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-sm font-black text-gray-800">My Reviews</h2>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
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

              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 border border-emerald-100 rounded-sm transition-colors duration-150 text-center"
                  onClick={() => {
                    setEditingReview(r);
                    setEditRating(r.rating);
                    setEditComment(r.comment);
                    setEditError('');
                  }}
                >
                  Edit
                </button>
                <button
                  className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 border border-red-100 rounded-sm transition-colors duration-150 disabled:opacity-50 flex-shrink-0 text-center"
                  disabled={busyId === r.id}
                  onClick={() => handleDelete(r.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center bg-emerald-50 px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Edit Product Review</h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-1">
                  {editingReview.productName || `Product #${editingReview.productId}`}
                </p>
              </div>
              <button 
                onClick={() => setEditingReview(null)}
                className="text-gray-400 hover:text-gray-700 font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 font-sans text-[#222529]">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditRating(num)}
                      className="text-2xl transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    >
                      {num <= editRating ? (
                        <span className="text-yellow-500">★</span>
                      ) : (
                        <span className="text-gray-300">★</span>
                      )}
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-gray-500">{editRating} of 5 stars</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Your Review</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50/50 rounded-sm p-3 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-colors min-h-[100px]"
                  placeholder="Share details of your experience with this product..."
                  required
                />
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-sm p-3 text-xs font-bold">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-sm text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit || !editComment.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;
