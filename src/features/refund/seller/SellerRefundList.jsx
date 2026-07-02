import React from 'react';
import { RefreshCw, Clock, Scale, CheckCircle, AlertTriangle, Info, Package, ShieldAlert, Sparkles, Coins, AlertCircle } from 'lucide-react';
import { useSellerTheme } from '../../seller/hooks/useSellerTheme';
import { BASE_URL } from '../../../shared/api/apiClient';
import { getSellerOrderDetail } from '../../seller/api/sellerApi';
import { SectionHeader } from '../../seller/pages/SectionUtils';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const orderDetailCache = {};

function SellerRefundListProductCell({ refund, isDark }) {
  const [resolvedImg, setResolvedImg] = React.useState(refund.productImage || refund.items?.[0]?.imagePath || null);
  const [productName, setProductName] = React.useState(refund.items?.[0]?.productName || 'Product');

  React.useEffect(() => {
    if (refund.productImage || refund.items?.[0]?.imagePath) {
      return;
    }

    const orderId = refund.orderId;
    if (!orderId) return;

    if (orderDetailCache[orderId]) {
      orderDetailCache[orderId].then(data => {
        if (data) {
          const match = data.items?.find(oi => oi.id === refund.items?.[0]?.orderItemId || oi.productId === refund.items?.[0]?.productId) || data.items?.[0];
          if (match?.imagePath) setResolvedImg(match.imagePath);
          else if (match?.productImage) setResolvedImg(match.productImage);
          if (match?.productName) setProductName(match.productName);
        }
      });
      return;
    }

    const promise = getSellerOrderDetail(orderId)
      .then(res => res.data)
      .catch(() => null);

    orderDetailCache[orderId] = promise;

    promise.then(data => {
      if (data) {
        const match = data.items?.find(oi => oi.id === refund.items?.[0]?.orderItemId || oi.productId === refund.items?.[0]?.productId) || data.items?.[0];
        if (match?.imagePath) setResolvedImg(match.imagePath);
        else if (match?.productImage) setResolvedImg(match.productImage);
        if (match?.productName) setProductName(match.productName);
      }
    });
  }, [refund]);

  return (
    <div className="flex items-center gap-3">
      <div className={`w-24 h-24 rounded-lg border flex items-center justify-center p-1.5 shrink-0 ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-150'
      }`}>
        {resolvedImg ? (
          <img src={getImgUrl(resolvedImg)} alt="" className="max-w-full max-h-full object-contain rounded" />
        ) : (
          <Package size={22} className="text-gray-400" />
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-black truncate max-w-[150px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {productName}
        </p>
        {refund.items?.length > 1 && (
          <p className="text-[9px] text-[#16A34A] font-bold">+{refund.items.length - 1} more items</p>
        )}
      </div>
    </div>
  );
}

const STATUS_META = {
  REQUEST_CREATED: { label: 'Request Created', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: Scale },
  MORE_EVIDENCE_REQUESTED: { label: 'Evidence Required', badge: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  OFFER_MADE: { label: 'Offer Pending', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Clock },
  SELLER_APPROVED: { label: 'Approved by Seller', badge: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20', icon: CheckCircle },
  RETURN_PENDING: { label: 'Return Pending', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Package },
  RETURN_SHIPPED: { label: 'Return Shipped', badge: 'bg-sky-50 text-sky-700 border-sky-200', icon: Package },
  RETURN_RECEIVED: { label: 'Return Received', badge: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle },
  PRODUCT_INSPECTION: { label: 'Product Inspection', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: Scale },
  INSPECTION_COMPLETE: { label: 'Inspection Complete', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle },
  REFUND_PROCESSING: { label: 'Refund Processing', badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock },
  PENDING_ADMIN_VERIFICATION: { label: 'Pending Admin Verification', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: Clock },
  REFUND_COMPLETED: { label: 'Refund Completed', badge: 'bg-[#16A34A]/20 text-emerald-800 border-[#16A34A]/30', icon: CheckCircle },
  SELLER_REJECTED: { label: 'Rejected by Seller', badge: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  CUSTOMER_ACCEPTS: { label: 'Offer Accepted', badge: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20', icon: CheckCircle },
  CLOSED: { label: 'Closed', badge: 'bg-gray-200 text-gray-500 border-gray-300', icon: CheckCircle },
  ADMIN_REVIEW: { label: 'Admin Reviewing', badge: 'bg-pink-50 text-pink-700 border-pink-200', icon: Scale },
  ADMIN_APPROVED_REFUND: { label: 'Approved by Admin', badge: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20', icon: CheckCircle },
  ADMIN_REJECTED_REFUND: { label: 'Rejected by Admin', badge: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  REPLACEMENT_PREPARING: { label: 'Replacement Preparing', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: Clock },
  REPLACEMENT_SHIPPED: { label: 'Replacement Shipped', badge: 'bg-sky-50 text-sky-700 border-sky-200', icon: Package },
  EXCHANGE_COMPLETED: { label: 'Exchange Completed', badge: 'bg-[#16A34A]/20 text-emerald-800 border-[#16A34A]/30', icon: CheckCircle }
};

const getStatusMeta = (status) => STATUS_META[status] || { label: status, badge: 'bg-gray-50 text-gray-500 border-gray-250', icon: Info };

const getBadgeClass = (status, isDark) => {
  if (!isDark) {
    return STATUS_META[status]?.badge || 'bg-gray-50 text-gray-500 border-gray-250';
  }
  const maps = {
    REQUEST_CREATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    UNDER_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    MORE_EVIDENCE_REQUESTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    OFFER_MADE: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    SELLER_APPROVED: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20',
    RETURN_PENDING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    RETURN_SHIPPED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    RETURN_RECEIVED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    PRODUCT_INSPECTION: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    INSPECTION_COMPLETE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    REFUND_PROCESSING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    PENDING_ADMIN_VERIFICATION: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    REFUND_COMPLETED: 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/30',
    SELLER_REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
    CUSTOMER_ACCEPTS: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20',
    CLOSED: 'bg-white/5 text-gray-400 border-white/10',
    ADMIN_REVIEW: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    ADMIN_APPROVED_REFUND: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20',
    ADMIN_REJECTED_REFUND: 'bg-red-500/15 text-red-400 border-red-500/30',
    REPLACEMENT_PREPARING: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    REPLACEMENT_SHIPPED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    EXCHANGE_COMPLETED: 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/30',
  };
  return maps[status] || 'bg-white/5 text-gray-400 border-white/10';
};

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';
const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const TABS = [
  { id: 'ALL', label: 'All Requests' },
  { id: 'NEW_REVIEW', label: 'New Review' },
  { id: 'WAITING_CUSTOMER', label: 'Waiting Customer' },
  { id: 'RETURN_INSPECTION', label: 'Return / Inspection' },
  { id: 'PAYOUT_REPLACEMENT', label: 'Payout / Replacement' },
  { id: 'DISPUTES', label: 'Disputes' },
  { id: 'COMPLETED', label: 'Completed' },
];

const SELLER_ACTION_STATUSES = ['REQUEST_CREATED', 'UNDER_REVIEW', 'RETURN_SHIPPED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE', 'REFUND_PROCESSING', 'REPLACEMENT_PREPARING'];

const getTabIdForStatus = (status) => {
  if (['REQUEST_CREATED', 'UNDER_REVIEW', 'OFFER_MADE'].includes(status)) return 'NEW_REVIEW';
  if (['MORE_EVIDENCE_REQUESTED', 'RETURN_PENDING', 'REPLACEMENT_SHIPPED'].includes(status)) return 'WAITING_CUSTOMER';
  if (['RETURN_SHIPPED', 'RETURN_RECEIVED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE'].includes(status)) return 'RETURN_INSPECTION';
  if (['REFUND_PROCESSING', 'PENDING_ADMIN_VERIFICATION', 'REPLACEMENT_PREPARING'].includes(status)) return 'PAYOUT_REPLACEMENT';
  if (['ADMIN_REVIEW', 'ADMIN_APPROVED_REFUND', 'ADMIN_REJECTED_REFUND'].includes(status)) return 'DISPUTES';
  if (['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED'].includes(status)) return 'COMPLETED';
  return 'ALL';
};

const getNextSellerAction = (status) => {
  const actions = {
    REQUEST_CREATED: 'Review request',
    UNDER_REVIEW: 'Review request',
    MORE_EVIDENCE_REQUESTED: 'Monitor evidence',
    RETURN_PENDING: 'Wait for return tracking',
    RETURN_SHIPPED: 'Confirm return received',
    RETURN_RECEIVED: 'Inspect product',
    PRODUCT_INSPECTION: 'Complete inspection',
    INSPECTION_COMPLETE: 'Choose resolution',
    REFUND_PROCESSING: 'Submit payout proof',
    PENDING_ADMIN_VERIFICATION: 'Wait for admin verification',
    REPLACEMENT_PREPARING: 'Ship replacement',
    REPLACEMENT_SHIPPED: 'Wait for customer confirmation',
    ADMIN_REVIEW: 'Monitor admin review',
    REFUND_COMPLETED: 'No action needed',
    EXCHANGE_COMPLETED: 'No action needed',
    CLOSED: 'No action needed'
  };
  return actions[status] || 'View details';
};

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
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  const tabCounts = React.useMemo(() => {
    const counts = TABS.reduce((acc, tab) => ({ ...acc, [tab.id]: 0 }), {});
    counts.ALL = refunds.length;
    refunds.forEach(r => {
      const tabId = getTabIdForStatus(r.status);
      if (tabId !== 'ALL') counts[tabId]++;
    });
    return counts;
  }, [refunds]);

  return (
    <div className={`space-y-6 max-w-[1400px] font-sans ${themeClasses.bg.primary} animate-in fade-in duration-300`}>
      
      <SectionHeader
        tag="Merchant Panel"
        title="Dispute & Refund Desk"
        subtitle="Monitor customer returns, claim processing, and manage escalation tickets."
        action={
          <button
            onClick={onRefresh}
            className="p-2 h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-white hover:bg-gray-150 text-gray-900 border border-gray-200 shadow-sm shrink-0 cursor-pointer"
          >
            <RefreshCw size={12} className={`shrink-0 ${loading ? 'animate-spin' : ''}`} />
            Sync Desk
          </button>
        }
      />

      {/* ── Telemetry Metrics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Needs Action', value: stats.needsAction, sub: 'Awaiting response', icon: Scale, extra: stats.needsAction > 0, iconColor: 'text-amber-500 bg-amber-500/10' },
          { label: 'Active Exposure', value: money(stats.exposure), sub: 'Active claim values', icon: Coins, iconColor: 'text-[#16A34A] bg-[#16A34A]/10' },
          { label: 'Total Payouts', value: money(stats.settled), sub: 'Settled claims', icon: CheckCircle, iconColor: 'text-blue-500 bg-blue-500/10' },
          { label: 'Escalated Disputes', value: stats.escalated, sub: 'Under arbitration', icon: ShieldAlert, iconColor: 'text-red-500 bg-red-500/10' }
        ].map((card, idx) => {
          const CardIcon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 border rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                isDark
                  ? 'bg-[#0b0c10] border-white/10 hover:border-[#16A34A]/30'
                  : 'bg-white border-gray-200 hover:border-[#16A34A]/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-widest block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{card.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconColor}`}>
                  <CardIcon size={16} />
                </div>
              </div>
              <p className={`text-xl font-black mt-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {card.value}
                {card.extra && <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
              </p>
              <p className={`text-[10px] mt-1.5 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Tabs & Search List Container ── */}
      <div className={`border rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-colors overflow-hidden ${isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className={`px-4 py-3.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border-0 ${
                  activeTab === tab.id
                    ? (isDark ? 'bg-white text-black font-black' : 'bg-gray-900 text-white font-black')
                    : (isDark ? 'text-gray-500 hover:text-white hover:bg-white/10 bg-transparent' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 bg-transparent')
                }`}
              >
                {tab.label}
                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? (isDark ? 'bg-black/15 text-black' : 'bg-white/20 text-white')
                    : (isDark ? 'bg-white/10 text-white' : 'bg-gray-150 text-gray-650')
                }`}>
                  {tabCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search Refund ID or Order ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors w-full sm:w-64 ${
                isDark
                  ? 'bg-[#111827] border-white/10 text-white placeholder-gray-650 focus:border-[#16A34A]'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#16A34A]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors bg-transparent border-0 cursor-pointer ${
                  isDark ? 'text-gray-500 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Requests Table */}
        {filteredRefunds.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <ShieldAlert size={24} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
            </div>
            <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-900'}`}>No claims match filters</p>
            <p className={`text-[10px] font-semibold mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>We couldn't find any dispute claims in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[9px] font-black uppercase tracking-widest transition-colors ${
                  isDark ? 'bg-[#111827] border-white/10 text-gray-400' : 'border-gray-100 bg-gray-50/50 text-gray-450'
                }`}>
                  <th className="px-5 py-3.5">Refund ID</th>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Requested</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Claim Amount</th>
                  <th className="px-5 py-3.5">Next Seller Action</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${isDark ? 'divide-white/5 text-gray-300' : 'divide-gray-100 text-gray-700'} text-xs font-semibold`}>
                {filteredRefunds.map(r => {
                  const meta = getStatusMeta(r.status);
                  const needsAct = SELLER_ACTION_STATUSES.includes(r.status);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectDetail(r.id)}
                      className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'}`}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-[#16A34A]">{r.refundNumber}</td>
                      <td className="px-5 py-4 font-mono text-gray-500">ORD-{r.orderNumber || r.orderId}</td>
                      <td className="px-5 py-4">
                        <SellerRefundListProductCell refund={r} isDark={isDark} />
                      </td>
                      <td className={`px-5 py-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{r.customerName || 'Customer'}</td>
                      <td className={`px-5 py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{dateLabel(r.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[8.5px] font-black uppercase tracking-wider ${getBadgeClass(r.status, isDark)}`}>
                          {meta.label}
                          {needsAct && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                        </span>
                      </td>
                      <td className={`px-5 py-4 font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{money(r.refundAmount)}</td>
                      <td className={`px-5 py-4 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{getNextSellerAction(r.status)}</td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectDetail(r.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors border-0 ${
                            isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 hover:bg-black text-white'
                          }`}
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
