import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, ShieldAlert, X } from 'lucide-react';
import { reportProduct, reportSeller } from '../../../features/customer/api/customerApi';

const PRODUCT_REASONS = [
  { value: 'INACCURATE_DESCRIPTION', label: 'Inaccurate description' },
  { value: 'COUNTERFEIT', label: 'Counterfeit item' },
  { value: 'PROHIBITED_ITEM', label: 'Prohibited item' },
  { value: 'OFFENSIVE_CONTENT', label: 'Offensive content' },
  { value: 'OTHER', label: 'Other concern' },
];

const SELLER_REASONS = [
  { value: 'SCAM', label: 'Scam or fraud' },
  { value: 'OFFENSIVE_BEHAVIOR', label: 'Offensive behavior' },
  { value: 'UNFULFILLED_ORDERS', label: 'Unfulfilled orders' },
  { value: 'OTHER', label: 'Other concern' },
];

export default function ReportModal({ isOpen, onClose, type, targetId, targetName }) {
  const [reasonCode, setReasonCode] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const reasons = useMemo(
    () => (type === 'PRODUCT' ? PRODUCT_REASONS : SELLER_REASONS),
    [type]
  );

  if (!isOpen) return null;

  const selectedReason = reasons.find(reason => reason.value === reasonCode);
  const isValid = reasonCode && details.trim().length >= 10;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) return;

    try {
      setLoading(true);
      setFeedback('');
      if (type === 'PRODUCT') {
        await reportProduct({ productId: targetId, reasonCode, details });
      } else if (type === 'SELLER') {
        await reportSeller({ sellerId: targetId, reasonCode, details });
      }
      setFeedback('Report submitted. Our moderation team will review it.');
      setTimeout(onClose, 900);
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl animate-slide-in">
        <div className="flex items-start justify-between gap-4 border-b border-red-100 bg-red-50 px-5 py-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="font-black text-gray-900">Report {type === 'PRODUCT' ? 'Product' : 'Seller'}</h2>
              <p className="mt-1 text-xs font-semibold text-gray-500">Flag content that violates marketplace trust or safety rules.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-red-400 transition-colors hover:bg-white hover:text-red-700"
            aria-label="Close report modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reported item</p>
            <p className="mt-1 truncate text-sm font-bold text-gray-800">{targetName || `ID #${targetId}`}</p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-700">
              Reason
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {reasons.map(reason => (
                <button
                  type="button"
                  key={reason.value}
                  onClick={() => setReasonCode(reason.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition-all ${
                    reasonCode === reason.value
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-red-200'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-700">
              Details
            </label>
            <textarea
              value={details}
              onChange={event => setDetails(event.target.value)}
              required
              minLength={10}
              placeholder="Describe what happened, where you noticed it, and any helpful context."
              className="min-h-[120px] w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500"
            />
            <div className="mt-2 flex justify-between text-[10px] font-bold text-gray-400">
              <span>Minimum 10 characters</span>
              <span>{details.trim().length} typed</span>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div className="flex items-start gap-2 text-blue-800">
              <FileText size={15} className="mt-0.5 shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">
                {selectedReason
                  ? `Selected: ${selectedReason.label}. Add specific evidence so moderation can act faster.`
                  : 'Choose the closest reason, then add specific evidence for the moderation team.'}
              </p>
            </div>
          </div>

          {feedback && (
            <div className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-bold ${
              feedback.startsWith('Report submitted')
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {feedback.startsWith('Report submitted') ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {feedback}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


