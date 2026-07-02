import React from 'react';
import { RefreshCw, ShieldAlert, Gavel, CreditCard, ShoppingBag } from 'lucide-react';
import AdminRefundDetails from './AdminRefundDetails';

export default function AdminRefundList({
  refunds,
  loading,
  filter,
  setFilter,
  onRefresh,
  themeClasses
}) {
  const disputesCount = React.useMemo(() => refunds.filter(r => r.status === 'ADMIN_REVIEW').length, [refunds]);
  const evidenceCount = React.useMemo(() => refunds.filter(r => r.status === 'MORE_EVIDENCE_REQUESTED').length, [refunds]);
  const verificationCount = React.useMemo(() => refunds.filter(r => r.status === 'PENDING_ADMIN_VERIFICATION').length, [refunds]);
  const completedCount = React.useMemo(() => refunds.filter(r => ['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED', 'ADMIN_REJECTED_REFUND'].includes(r.status)).length, [refunds]);

  const displayRefunds = React.useMemo(() => {
    if (filter === 'DISPUTES') {
      return refunds.filter(r => r.status === 'ADMIN_REVIEW');
    }
    if (filter === 'EVIDENCE_WAITING') {
      return refunds.filter(r => r.status === 'MORE_EVIDENCE_REQUESTED');
    }
    if (filter === 'PAYOUT_VERIFICATION') {
      return refunds.filter(r => r.status === 'PENDING_ADMIN_VERIFICATION');
    }
    if (filter === 'COMPLETED') {
      return refunds.filter(r => ['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED', 'ADMIN_REJECTED_REFUND'].includes(r.status));
    }
    return refunds;
  }, [refunds, filter]);

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Filters */}
      <div className={`flex gap-2 border rounded-xl p-1.5 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
        <button
          onClick={() => setFilter('DISPUTES')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'DISPUTES'
              ? `${themeClasses.bg.primary} ${themeClasses.text.primary} border ${themeClasses.border.primary} shadow-xs`
              : `${themeClasses.text.tertiary} hover:${themeClasses.text.secondary}`
          }`}
        >
          <Gavel size={14} />
          Disputes
          {disputesCount > 0 && (
            <span className="bg-pink-100 text-pink-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {disputesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('EVIDENCE_WAITING')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'EVIDENCE_WAITING'
              ? `${themeClasses.bg.primary} ${themeClasses.text.primary} border ${themeClasses.border.primary} shadow-xs`
              : `${themeClasses.text.tertiary} hover:${themeClasses.text.secondary}`
          }`}
        >
          <ShieldAlert size={14} />
          Evidence Waiting
          {evidenceCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {evidenceCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('PAYOUT_VERIFICATION')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'PAYOUT_VERIFICATION'
              ? `${themeClasses.bg.primary} ${themeClasses.text.primary} border ${themeClasses.border.primary} shadow-xs`
              : `${themeClasses.text.tertiary} hover:${themeClasses.text.secondary}`
          }`}
        >
          <CreditCard size={14} />
          Payout Verification
          {verificationCount > 0 && (
            <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {verificationCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'COMPLETED'
              ? `${themeClasses.bg.primary} ${themeClasses.text.primary} border ${themeClasses.border.primary} shadow-xs`
              : `${themeClasses.text.tertiary} hover:${themeClasses.text.secondary}`
          }`}
        >
          <ShoppingBag size={14} />
          Completed
          {completedCount > 0 && (
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {completedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'ALL'
              ? `${themeClasses.bg.primary} ${themeClasses.text.primary} border ${themeClasses.border.primary} shadow-xs`
              : `${themeClasses.text.tertiary} hover:${themeClasses.text.secondary}`
          }`}
        >
          <ShoppingBag size={14} />
          All Cases
        </button>
      </div>

      {/* List content */}
      {loading ? (
        <div className={`py-16 text-center transition-colors ${themeClasses.text.tertiary}`}>
          <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-wider">Loading refunds desk...</p>
        </div>
      ) : displayRefunds.length === 0 ? (
        <div className={`border border-dashed rounded-[20px] p-10 text-center transition-colors ${themeClasses.card} ${themeClasses.border.primary} ${themeClasses.text.tertiary}`}>
          <ShieldAlert size={32} className={`mx-auto mb-3 transition-colors ${themeClasses.text.tertiary}`} />
          <p className="text-sm font-bold">Queue is empty</p>
          <p className="text-xs mt-1">No requests match your current selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayRefunds.map(r => (
            <AdminRefundDetails
              key={r.id}
              refund={r}
              onActionCompleted={onRefresh}
              themeClasses={themeClasses}
            />
          ))}
        </div>
      )}
    </div>
  );
}
