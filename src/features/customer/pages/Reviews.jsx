import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMyReviews, deleteReview, updateReview, submitReview } from '../api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../contexts/CustomerContext';

const MAX_FILES = 5;
const TITLE_LIMIT = 100;
const COMMENT_LIMIT = 1000;

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

const Stars = ({ rating }) => (
  <span className="text-amber-400 tracking-wider font-black select-none text-[15px]">
    {'★'.repeat(Math.round(rating))}
    {'☆'.repeat(5 - Math.round(rating))}
  </span>
);

/* Interactive star picker used on the write-a-review page (green, matches reference) */
const RatingPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((num) => (
      <button
        key={num}
        type="button"
        onClick={() => onChange(num)}
        aria-label={`${num} star${num > 1 ? 's' : ''}`}
        className="text-3xl leading-none transition-transform hover:scale-110 active:scale-95 focus:outline-none"
      >
        <span className={num <= value ? 'text-[#16A34A]' : 'text-gray-200'}>★</span>
      </button>
    ))}
  </div>
);

const CustomerReviews = () => {
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Create Review State (full-page form)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createProductId, setCreateProductId] = useState(null);
  const [createProductName, setCreateProductName] = useState('');
  const [createImagePath, setCreateImagePath] = useState('');
  const [createVariant, setCreateVariant] = useState('');
  const [createQty, setCreateQty] = useState(null);
  const [createOrderLabel, setCreateOrderLabel] = useState('');
  const [createDeliveredAt, setCreateDeliveredAt] = useState('');
  const [createRating, setCreateRating] = useState(0);
  const [createTitle, setCreateTitle] = useState('');
  const [createComment, setCreateComment] = useState('');
  const [createFiles, setCreateFiles] = useState([]); // [{ file, preview }]
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Edit Review State
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const { user } = useCustomer();
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setReviews([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getMyReviews(userId);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.state && location.state.productId) {
      setCreateProductId(location.state.productId);
      setCreateProductName(location.state.productName || `Product #${location.state.productId}`);
      setCreateImagePath(location.state.imagePath || '');
      setCreateVariant(location.state.variant || location.state.color || '');
      setCreateQty(location.state.quantity || null);
      setCreateOrderLabel(location.state.customOrderId || (location.state.orderId ? `#${location.state.orderId}` : ''));
      setCreateDeliveredAt(location.state.deliveredAt || '');
      setCreateRating(0);
      setCreateTitle('');
      setCreateComment('');
      setCreateFiles([]);
      setCreateError('');
      setShowCreateForm(true);

      // Clear navigation state so a reload/back doesn't re-open the form
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    setBusyId(reviewId);
    try {
      await deleteReview(reviewId);
      await load();
    } catch {
      alert('Delete failed');
    }
    setBusyId(null);
  };

  const addCreateFiles = (fileList) => {
    const incoming = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;
    setCreateFiles((prev) => {
      const room = MAX_FILES - prev.length;
      if (room <= 0) return prev;
      const accepted = incoming.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }));
      return [...prev, ...accepted];
    });
  };

  const removeCreateFile = (idx) => {
    setCreateFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addCreateFiles(e.dataTransfer.files);
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setCreateFiles([]);
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!createRating) {
      setCreateError('Please select a star rating.');
      return;
    }
    if (!createComment.trim()) {
      setCreateError('Please enter a review.');
      return;
    }
    setSubmittingCreate(true);
    setCreateError('');
    try {
      const formData = new FormData();
      formData.append('productId', createProductId);
      formData.append('rating', createRating);
      if (createTitle.trim()) formData.append('title', createTitle.trim());
      formData.append('comment', createComment.trim());
      createFiles.forEach(({ file }) => formData.append('images', file));

      await submitReview(formData);
      await load();
      closeCreateForm();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingCreate(false);
    }
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
      const formData = new FormData();
      formData.append('rating', editRating);
      formData.append('comment', editComment.trim());
      if (editImage) {
        formData.append('image', editImage);
      }

      await updateReview(editingReview.id, formData);
      await load();
      setEditingReview(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update review.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
        <svg className="animate-spin w-6 h-6 text-[#10B981] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading reviews...</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     FULL-PAGE "WRITE A REVIEW" FORM
  ══════════════════════════════════════════════════════ */
  if (showCreateForm) {
    return (
      <div className="pb-10 animate-in fade-in duration-300 font-sans">
        <div className="mb-6">
          <h2 className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight mb-1">Write a Review</h2>
          <p className="text-sm text-gray-500 font-medium">Share your experience and help others make better choices.</p>
        </div>

        {/* Product summary card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 flex items-center gap-5">
          <div className="w-20 h-20 bg-gray-50 border border-gray-150 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 p-1.5">
            {createImagePath ? (
              <img src={getImgUrl(createImagePath)} alt="" className="object-contain w-full h-full" />
            ) : (
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate">{createProductName}</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {[createVariant, createQty ? `Qty: ${createQty}` : null].filter(Boolean).join('  •  ')}
            </p>
            <p className="text-sm text-gray-500 font-medium mt-0.5">
              {[
                createOrderLabel ? `Order ${createOrderLabel}` : null,
                createDeliveredAt
                  ? `Delivered on ${new Date(createDeliveredAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : null,
              ]
                .filter(Boolean)
                .join('  •  ')}
            </p>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleCreateSubmit} className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-3">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <RatingPicker value={createRating} onChange={setCreateRating} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Title of Review <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value.slice(0, TITLE_LIMIT))}
                placeholder="Summarize your experience"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-50 transition-all"
                required
              />
              <p className="text-right text-[11px] text-gray-400 font-medium mt-1">
                {createTitle.length}/{TITLE_LIMIT}
              </p>
            </div>
          </div>

          <div className="mt-1">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={createComment}
              onChange={(e) => setCreateComment(e.target.value.slice(0, COMMENT_LIMIT))}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-50 transition-all min-h-[140px]"
              placeholder="Share details about the product. What did you like or not like?"
              required
            />
            <p className="text-right text-[11px] text-gray-400 font-medium mt-1">
              {createComment.length}/{COMMENT_LIMIT}
            </p>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-slate-800">Add Photos or Videos <span className="font-normal text-gray-400">(Optional)</span></label>
            <p className="text-xs text-gray-500 font-medium mt-0.5 mb-3">Upload images or videos to help others. (Max {MAX_FILES} files)</p>

            <div className="flex flex-wrap items-stretch gap-3">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`w-40 h-32 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center px-3 cursor-pointer transition-colors ${
                  dragActive ? 'border-[#16A34A] bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                } ${createFiles.length >= MAX_FILES ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <svg className="w-5 h-5 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
                </svg>
                <span className="text-xs font-semibold text-[#16A34A]">Click to upload <span className="text-gray-500 font-medium">or drag and drop</span></span>
                <span className="text-[10px] text-gray-400 font-medium">PNG, JPG, MP4 up to 10MB each</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addCreateFiles(e.target.files)}
                />
              </label>

              {createFiles.map((f, idx) => (
                <div key={idx} className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-150 flex-shrink-0">
                  <img src={f.preview} className="w-full h-full object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => removeCreateFile(idx)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-black/80 transition-colors cursor-pointer"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {createFiles.length > 0 && createFiles.length < MAX_FILES && (
                <label className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-500">Add More</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addCreateFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          {createError && (
            <div className="mt-5 bg-red-50 border border-red-100 text-red-700 rounded-xl p-3.5 text-xs font-bold flex items-center gap-2">
              <span className="text-base">⚠️</span> {createError}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={closeCreateForm}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCreate || !createComment.trim() || !createRating}
              className="px-6 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submittingCreate ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>

        {/* Reassurance banner */}
        <div className="mt-5 bg-[#F2FBF5] border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.556-3.04 8.4-7.2 9.625a1.978 1.978 0 01-1.6 0C7.04 20.4 4 16.556 4 12V6.74a1 1 0 01.629-.928L11.508 3.1a1 1 0 01.984 0l6.879 2.712a1 1 0 01.629.928V12z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-[#16A34A]">Your review matters!</p>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">Your feedback helps other customers make informed decisions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 animate-in fade-in duration-300 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[22px] font-black text-gray-900 tracking-tight leading-tight mb-1">My Reviews</h2>
          <p className="text-xs text-gray-500 font-semibold">
            {reviews.length > 0 ? `You've left ${reviews.length} review${reviews.length !== 1 ? 's' : ''}.` : 'You have not submitted any reviews yet.'}
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] animate-in fade-in duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl mx-auto mb-5 shadow-sm">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">No reviews yet</h3>
          <p className="text-xs text-gray-500 font-semibold mb-6 max-w-sm mx-auto">After receiving an order, you can leave a product review to share your experience.</p>
          <Link
            to="/customer/orders"
            className="inline-block bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            View My Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => {
            const img = r.images?.[0]?.imagePath || r.imagePath || null;
            return (
              <div
                key={r.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow"
              >
                {img && (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
                    <img src={getImgUrl(img)} alt="" className="object-contain w-full h-full" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                    <Stars rating={r.rating} />
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h4 className="text-[15px] font-black text-gray-900 mb-2 leading-tight">{r.productName || `Product #${r.productId}`}</h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-50">{r.comment}</p>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <button
                    className="flex-1 sm:flex-none bg-[#e6f7ec] hover:bg-emerald-100 text-[#10B981] text-[10px] font-black uppercase tracking-widest px-4 py-2.5 border border-[#10B981]/20 rounded-xl transition-all text-center"
                    onClick={() => {
                      setEditingReview(r);
                      setEditRating(r.rating);
                      setEditComment(r.comment);
                      setEditError('');
                    }}
                  >
                    Edit Review
                  </button>
                  <button
                    className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 border border-red-100 rounded-xl transition-all disabled:opacity-50 text-center"
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
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-[#f0fdf4] px-6 py-5 border-b border-[#10B981]/10">
              <div>
                <h3 className="text-[15px] font-black text-gray-900 uppercase tracking-wider">Edit Product Review</h3>
                <p className="text-[11px] text-gray-500 font-bold mt-1 uppercase tracking-widest truncate max-w-xs">
                  {editingReview.productName || `Product #${editingReview.productId}`}
                </p>
              </div>
              <button
                onClick={() => setEditingReview(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Your Rating</label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 w-fit">
                  <RatingPicker value={editRating} onChange={setEditRating} />
                  <span className="ml-3 text-xs font-black text-gray-500 uppercase tracking-widest">{editRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Written Review</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50/50 rounded-xl p-4 text-sm font-medium outline-none focus:border-[#10B981] focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all min-h-[140px]"
                  placeholder="Share details of your experience with this product..."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Review Image (Optional)</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer transition-colors shadow-sm">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditImage(file);
                          setEditImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {(editImagePreview || editingReview.imagePath) && (
                    <div className="relative w-14 h-14 bg-gray-50 border border-gray-150 rounded-xl overflow-hidden flex items-center justify-center p-1">
                      <img src={editImagePreview || getImgUrl(editingReview.imagePath)} className="object-contain w-full h-full" alt="Preview" />
                      <button
                        type="button"
                        onClick={() => {
                          setEditImage(null);
                          setEditImagePreview('');
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-bold shadow-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
                  <span className="text-base">⚠️</span> {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-5 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit || !editComment.trim()}
                  className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submittingEdit ? 'Saving...' : 'Save Review'}
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