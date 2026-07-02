import React, { useState } from 'react';
import { Handshake, X } from 'lucide-react';
import { acceptOffer, rejectOffer, negotiateOffer } from '../../../../services/refundApi';

export default function CustomerPayoutTracking({
  detail,
  onRefresh,
  setActionError
}) {
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [negotiateNotes, setNegotiateNotes] = useState('');
  const [negotiateAmount, setNegotiateAmount] = useState('');
  const [submittingNegotiate, setSubmittingNegotiate] = useState(false);

  const handleAccept = async () => {
    setActionError('');
    try {
      await acceptOffer(detail.id);
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to accept offer');
    }
  };

  const handleReject = async () => {
    setActionError('');
    try {
      await rejectOffer(detail.id);
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to request full refund');
    }
  };

  const handleNegotiateSubmit = async (e) => {
    e.preventDefault();
    if (!negotiateNotes.trim()) return;

    setSubmittingNegotiate(true);
    setActionError('');
    try {
      await negotiateOffer(detail.id, negotiateNotes.trim(), negotiateAmount.trim());
      setNegotiateNotes('');
      setNegotiateAmount('');
      setShowNegotiateModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to submit negotiation');
    } finally {
      setSubmittingNegotiate(false);
    }
  };

  if (detail.status !== 'OFFER_MADE') {
    return null;
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          className="px-5 py-2.5 bg-[#152F17] hover:bg-[#0D1E0F] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Accept Offer
        </button>
        <button
          onClick={() => {
            setNegotiateNotes('');
            setShowNegotiateModal(true);
          }}
          className="px-4 py-2.5 border border-indigo-500 hover:bg-indigo-50/50 text-indigo-600 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Negotiate
        </button>
        <button
          onClick={handleReject}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Request Full Refund
        </button>
      </div>

      {/* Negotiation Modal Dialog */}
      {showNegotiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-205 flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/20">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Handshake size={16} className="text-indigo-600" />
                Negotiate Refund Offer
              </h3>
              <button 
                type="button"
                onClick={() => setShowNegotiateModal(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleNegotiateSubmit} className="p-5 space-y-4">
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                Propose your counter-offer or explain what resolution you would prefer. This will send your request back to the seller for review.
              </p>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Negotiation Message</label>
                <textarea
                  value={negotiateNotes}
                  onChange={e => setNegotiateNotes(e.target.value)}
                  rows="4"
                  placeholder="e.g. I would accept a Rs. 1,200 refund instead, or a full exchange for size L."
                  className="w-full text-xs border border-gray-250 rounded-lg p-3 bg-white focus:outline-none focus:border-indigo-500 font-semibold shadow-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Proposed Refund Amount (NPR)</label>
                <input
                  type="number"
                  value={negotiateAmount}
                  onChange={e => setNegotiateAmount(e.target.value)}
                  placeholder="e.g. 1200"
                  className="w-full text-xs border border-gray-250 rounded-lg p-3 bg-white focus:outline-none focus:border-indigo-500 font-semibold shadow-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNegotiateModal(false)}
                  className="px-4 py-2 border border-gray-250 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNegotiate || !negotiateNotes.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingNegotiate ? 'Submitting...' : 'Send Counter-Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
