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
  const paymentPendingCount = React.useMemo(() => refunds.filter(r => r.status === 'REFUND_PROCESSING' || r.status === 'PENDING_ADMIN_VERIFICATION').length, [refunds]);

  const displayRefunds = React.useMemo(() => {
    if (filter === 'DISPUTES') {
      return refunds.filter(r => r.status === 'ADMIN_REVIEW');
    }
    if (filter === 'PAYMENTS') {
      return refunds.filter(r => r.status === 'REFUND_PROCESSING' || r.status === 'PENDING_ADMIN_VERIFICATION');
    }
    return refunds;
  }, [refunds, filter]);

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Filters */}
      <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5">
        <button
          onClick={() => setFilter('DISPUTES')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'DISPUTES'
              ? 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              : 'text-gray-400 hover:text-gray-655'
          }`}
        >
          <Gavel size={14} />
          Appeal Arbitration
          {disputesCount > 0 && (
            <span className="bg-pink-100 text-pink-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {disputesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('PAYMENTS')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'PAYMENTS'
              ? 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              : 'text-gray-455 hover:text-gray-655'
          }`}
        >
          <CreditCard size={14} />
          Disbursement Queue
          {paymentPendingCount > 0 && (
            <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {paymentPendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'ALL'
              ? 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              : 'text-gray-400 hover:text-gray-655'
          }`}
        >
          <ShoppingBag size={14} />
          All Cases
        </button>
      </div>

      {/* List content */}
      {loading ? (
        <div className="py-16 text-center text-gray-450">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-[#e8f3e9]0" />
          <p className="text-xs font-black uppercase tracking-wider">Loading refunds desk...</p>
        </div>
      ) : displayRefunds.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-450">
          <ShieldAlert size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-bold">Queue is empty</p>
          <p className="text-xs text-gray-400 mt-1">No requests match your current selected filter.</p>
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
