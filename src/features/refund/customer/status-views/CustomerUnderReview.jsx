import React, { useState } from 'react';
import { Scale } from 'lucide-react';
import { appealDecision } from '../../api/refundApi';

export default function CustomerUnderReview({
  detail,
  onRefresh,
  setActionError
}) {
  const [appealNotes, setAppealNotes] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealNotes.trim()) return;

    setSubmittingAppeal(true);
    setActionError('');
    try {
      await appealDecision(detail.id, {
        notes: appealNotes.trim()
      });
      setAppealNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to submit appeal');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (detail.status !== 'SELLER_REJECTED') {
    return null;
  }

  return (
    <div id="appeal-section" className="bg-red-50/20 border border-red-200 rounded-xl p-5 mb-6 space-y-4">
      <h4 className="text-xs font-black uppercase tracking-wider text-red-800 flex items-center gap-1.5 border-b border-red-100 pb-3">
        <Scale size={15} />
        Appeal Seller Rejection
      </h4>
      <p className="text-xs text-red-700 leading-relaxed font-semibold">
        You can appeal the seller's decision. This will escalate the case to the platform admin team for independent arbitration.
      </p>
      <form onSubmit={handleAppealSubmit} className="space-y-3">
        <textarea
          value={appealNotes}
          onChange={e => setAppealNotes(e.target.value)}
          rows="3"
          placeholder="Elaborate on why you are appealing this decision..."
          className="w-full text-xs border border-red-200 rounded-lg p-3 bg-white focus:outline-none focus:border-red-500 font-semibold"
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submittingAppeal || !appealNotes.trim()}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {submittingAppeal ? 'Escalating...' : 'Submit Appeal to Admin'}
          </button>
        </div>
      </form>
    </div>
  );
}
