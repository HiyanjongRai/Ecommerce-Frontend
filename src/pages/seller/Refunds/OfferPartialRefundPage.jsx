import React from 'react';
import { Scale } from 'lucide-react';

export default function OfferPartialRefundPage({
  detail,
  hooksContext,
  customerCounterLog,
  hasPendingCounterOffer,
  isDark = false
}) {
  const {
    handleAcceptNegotiation,
    setShowOfferModal,
    setAcceptStep,
    setOfferType,
    setOfferNotes,
    setOfferAmount,
    handleAskPayment,
    submitting
  } = hooksContext;

  const isAccepted = ['CUSTOMER_ACCEPTS', 'SELLER_APPROVED'].includes(detail.status);

  if (isAccepted) {
    return (
      <div className={`p-5 border rounded-2xl space-y-4 ${
        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
      }`}>
        <div className="flex items-start gap-3 text-xs">
          <Scale size={18} className="text-[#e8f3e9]0 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#16A34A] dark:text-[#2E5E2C]">Partial Refund Offer Accepted</h4>
            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
              The partial refund proposal of <strong className="font-extrabold text-[#16A34A]">Rs. {Number(detail.refundAmount).toLocaleString()}</strong> has been accepted. Please request payment details from the customer.
            </p>
          </div>
        </div>
        
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAskPayment}
            disabled={submitting}
            className="flex-1 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border-0 active:scale-[0.98]"
          >
            💳 Ask Payment Request
          </button>
        </div>
      </div>
    );
  }

  if (!hasPendingCounterOffer) {
    return (
      <div className={`p-5 border rounded-2xl space-y-4 ${
        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
      }`}>
        <div className="flex items-start gap-3 text-xs">
          <Scale size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-650 dark:text-indigo-400">Partial Refund Proposal</h4>
            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
              Negotiation in progress. You can make another counter-offer or approve/reject the refund request inside the Actions panel.
            </p>
          </div>
        </div>
        
        <div className="pt-2">
          <button
            onClick={() => {
              setAcceptStep('resolution_select');
              setOfferType('PARTIAL_REFUND');
              setOfferNotes('');
              setOfferAmount('');
              setShowOfferModal(true);
            }}
            disabled={submitting}
            className="w-full py-2.5 border rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer bg-transparent border-indigo-650 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-650 hover:text-white"
          >
            Create New Counter-Proposal
          </button>
        </div>
      </div>
    );
  }

  const notesStr = customerCounterLog?.notes || '';
  const amountMatch = notesStr.match(/(?:counter-offer of|NPR|Rs\.?)\s*([\d,]+)/i);
  let amount = amountMatch ? amountMatch[1] : '—';
  if (amount === '—') {
    const numberMatch = notesStr.match(/\b\d{2,}\b/);
    if (numberMatch) amount = numberMatch[0];
  }
  const noteMatch = notesStr.match(/Note:\s*(.*)$/i);
  let note = noteMatch ? noteMatch[1] : '';
  if (!note && notesStr.trim() !== amount) {
    note = notesStr;
  }

  const displayAmount = /^\d+$/.test(amount.replace(/,/g, ''))
    ? Number(amount.replace(/,/g, '')).toLocaleString()
    : amount;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-5 shadow-2xs animate-in slide-in-from-top-4 duration-300 text-xs">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between font-sans">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl shrink-0 flex items-center justify-center bg-amber-500/10 text-amber-500">
            <Scale size={20} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Customer Counter-Proposal Received
            </span>
            <h3 className={`text-sm font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Customer has proposed a counter refund of{' '}
              <span className="text-[#16A34A] font-black text-base">Rs. {displayAmount}</span>
            </h3>
            {note && (
              <p className={`text-xs font-medium rounded-xl p-3 border leading-relaxed mt-2 ${
                isDark ? 'text-gray-300 bg-white/5 border-white/10' : 'text-gray-700 bg-white border-gray-150'
              }`}>
                <strong className="text-amber-600 font-bold block mb-0.5 text-[9px] uppercase tracking-wider">Customer Message</strong>
                "{note}"
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={handleAcceptNegotiation}
            disabled={submitting}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer border-0 active:scale-[0.98] transition-all"
          >
            Accept Counter-Offer
          </button>
          <button
            type="button"
            onClick={() => {
              setAcceptStep('resolution_select');
              setOfferType('PARTIAL_REFUND');
              setOfferNotes('');
              setOfferAmount('');
              setShowOfferModal(true);
            }}
            disabled={submitting}
            className={`flex-1 sm:flex-initial px-4 py-2.5 border rounded-xl font-bold text-xs cursor-pointer bg-transparent transition-all ${
              isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-750'
            }`}
          >
            Make Counter-Proposal
          </button>
        </div>
      </div>
    </div>
  );
}
