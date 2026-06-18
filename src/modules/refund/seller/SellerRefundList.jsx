import React from 'react';
import { RefreshCw, Clock, Scale, CheckCircle, AlertTriangle, Info, Package, ShieldAlert } from 'lucide-react';

const STATUS_META = {
  REQUEST_CREATED: { label: 'Request Created', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: Scale },
  MORE_EVIDENCE_REQUESTED: { label: 'Evidence Required', badge: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  OFFER_MADE: { label: 'Offer Pending', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Clock },
  SELLER_APPROVED: { label: 'Approved by Seller', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  RETURN_PENDING: { label: 'Return Pending', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Package },
  RETURN_SHIPPED: { label: 'Return Shipped', badge: 'bg-sky-50 text-sky-700 border-sky-200', icon: Package },
  RETURN_RECEIVED: { label: 'Return Received', badge: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle },
  PRODUCT_INSPECTION: { label: 'Product Inspection', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: Scale },
  INSPECTION_COMPLETE: { label: 'Inspection Complete', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle },
  REFUND_PROCESSING: { label: 'Refund Processing', badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock },
  PENDING_ADMIN_VERIFICATION: { label: 'Pending Admin Verification', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: Clock },
  REFUND_COMPLETED: { label: 'Refund Completed', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
  SELLER_REJECTED: { label: 'Rejected by Seller', badge: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  CUSTOMER_ACCEPTS: { label: 'Offer Accepted', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  CLOSED: { label: 'Closed', badge: 'bg-gray-200 text-gray-500 border-gray-300', icon: CheckCircle },
  ADMIN_REVIEW: { label: 'Admin Reviewing', badge: 'bg-pink-50 text-pink-700 border-pink-200', icon: Scale },
  ADMIN_APPROVED_REFUND: { label: 'Approved by Admin', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  ADMIN_REJECTED_REFUND: { label: 'Rejected by Admin', badge: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  REPLACEMENT_PREPARING: { label: 'Replacement Preparing', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: Clock },
  REPLACEMENT_SHIPPED: { label: 'Replacement Shipped', badge: 'bg-sky-50 text-sky-700 border-sky-200', icon: Package },
  EXCHANGE_COMPLETED: { label: 'Exchange Completed', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle }
};

const getStatusMeta = (status) => STATUS_META[status] || { label: status, badge: 'bg-gray-50 text-gray-500 border-gray-250', icon: Info };

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';
const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Needs Action' },
  { id: 'COMPLETED', label: 'Processing / Done' },
  { id: 'REJECTED', label: 'Rejected' },
];

const SELLER_ACTION_STATUSES = ['REQUEST_CREATED', 'UNDER_REVIEW', 'RETURN_SHIPPED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE', 'REFUND_PROCESSING'];

export default function SellerRefundList({
  refunds,
  filteredRefunds,
  loading,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  stats,
  onSelectDetail,
  onRefresh
}) {
  const tabCounts = React.useMemo(() => {
    const counts = { ALL: refunds.length, PENDING: 0, COMPLETED: 0, REJECTED: 0 };
    refunds.forEach(r => {
      if (SELLER_ACTION_STATUSES.includes(r.status)) counts.PENDING++;
      if (['SELLER_APPROVED', 'RETURN_PENDING', 'RETURN_RECEIVED', 'PENDING_ADMIN_VERIFICATION', 'REFUND_COMPLETED', 'CUSTOMER_ACCEPTS', 'CLOSED', 'REPLACEMENT_PREPARING', 'REPLACEMENT_SHIPPED', 'EXCHANGE_COMPLETED'].includes(r.status)) counts.COMPLETED++;
      if (['SELLER_REJECTED', 'ADMIN_REJECTED_REFUND', 'ADMIN_REVIEW', 'ADMIN_APPROVED_REFUND'].includes(r.status)) counts.REJECTED++;
    });
    return counts;
  }, [refunds]);

  return (
    <div className="space-y-4 max-w-[1400px] font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Refund & Dispute Management console</h2>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{refunds.length} total request{refunds.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors px-3 py-1.5 border border-gray-200 rounded-lg bg-white cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Needs Action</span>
          <p className="text-xl font-black text-gray-900 mt-1 flex items-center gap-2">
            {stats.needsAction}
            {stats.needsAction > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
          </p>
          <p className="text-[10px] text-gray-455 mt-1 font-semibold">Awaiting seller response</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Active Exposure</span>
          <p className="text-xl font-black text-gray-900 mt-1">{money(stats.exposure)}</p>
          <p className="text-[10px] text-gray-455 mt-1 font-semibold">Active claim values</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Total Payouts settled</span>
          <p className="text-xl font-black text-gray-900 mt-1">{money(stats.settled)}</p>
          <p className="text-[10px] text-gray-455 mt-1 font-semibold">Disbursed refunds</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Escalated Disputes</span>
          <p className="text-xl font-black text-gray-900 mt-1">{stats.escalated}</p>
          <p className="text-[10px] text-gray-455 mt-1 font-semibold">Arbitration count</p>
        </div>
      </div>

      {/* Tabs & Search controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.label}
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-650'
                }`}>
                  {tabCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center border border-gray-200 px-3 py-2 rounded-lg w-full md:w-64">
            <input
              type="text"
              placeholder="Search Refund ID or Order ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-400 font-semibold"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">✕</button>}
          </div>
        </div>

        {/* Requests Table */}
        {filteredRefunds.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
            <ShieldAlert size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-black text-gray-650 uppercase tracking-widest">No refund requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[9px] font-black uppercase tracking-widest text-gray-450">
                  <th className="px-4 py-3">Refund Number</th>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Requested Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Claim Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                {filteredRefunds.map(r => {
                  const meta = getStatusMeta(r.status);
                  const needsAct = SELLER_ACTION_STATUSES.includes(r.status);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectDetail(r.id)}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">{r.refundNumber}</td>
                      <td className="px-4 py-3 font-mono">ORD-{r.orderNumber || r.orderId}</td>
                      <td className="px-4 py-3 font-bold">{r.customerName || 'Customer'}</td>
                      <td className="px-4 py-3 text-gray-400">{dateLabel(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[8.5px] font-black uppercase tracking-wider ${meta.badge}`}>
                          {meta.label}
                          {needsAct && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-gray-900">{money(r.refundAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectDetail(r.id); }}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
