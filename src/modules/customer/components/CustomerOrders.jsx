import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getUserOrders } from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import CustomerOrderDetails from './CustomerOrderDetails';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_BADGE = {
  DRAFT:      'bg-blue-50 border border-blue-200/50 text-blue-600',
  PENDING:    'bg-amber-50 border border-amber-200/50 text-amber-600',
  CONFIRMED:  'bg-blue-50 border border-blue-200/50 text-blue-600',
  PROCESSING: 'bg-blue-50 border border-blue-200/50 text-blue-600',
  PACKED:     'bg-blue-50 border border-blue-200/50 text-blue-600',
  SHIPPED:    'bg-blue-50 border border-blue-200/50 text-blue-600',
  DELIVERED:  'bg-emerald-50 border border-emerald-200/50 text-[#16A34A]',
  CANCELLED:  'bg-red-50 border border-red-200/50 text-red-500',
  REFUNDED:   'bg-purple-50 border border-purple-200/50 text-purple-650',
  FAILED:     'bg-red-50 border border-red-200/50 text-red-500',
};

const STATUS_LABEL = {
  DRAFT: 'Processing', PENDING: 'Pending', CONFIRMED: 'Processing',
  PROCESSING: 'Processing', PACKED: 'Processing', SHIPPED: 'Shipped',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
  FAILED: 'Failed',
};

const STATUS_ICON = {
  DELIVERED: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
  SHIPPED: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
  PROCESSING: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  CANCELLED: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
};
// Fallback mapping
Object.keys(STATUS_LABEL).forEach(k => {
  if (!STATUS_ICON[k]) {
    const l = STATUS_LABEL[k];
    if (l === 'Processing') STATUS_ICON[k] = STATUS_ICON.PROCESSING;
    else if (l === 'Returned' || l === 'Cancelled') STATUS_ICON[k] = STATUS_ICON.CANCELLED;
  }
});

const getPaymentConfig = (status) => {
  if (status === 'PAID') return { cls: 'bg-emerald-50 text-[#16A34A] border border-emerald-100', label: 'Paid' };
  if (status === 'REFUNDED') return { cls: 'bg-purple-50 text-purple-650 border border-purple-100', label: 'Refunded' };
  return { cls: 'bg-amber-50 text-amber-600 border border-amber-100', label: 'Pending' };
};

const TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'RETURNED', label: 'Returned' },
];

const CustomerOrders = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    const oId = searchParams.get('orderId');
    if (oId && orders.length > 0) {
      const matched = orders.find(
        o => String(o.orderId) === oId ||
          String(o.customOrderId || '').toLowerCase() === oId.toLowerCase()
      );
      if (matched) setExpanded(matched.orderId);
    }
  }, [searchParams, orders]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch { setOrders([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    if (filter === 'ALL') return true;
    if (filter === 'PROCESSING') return ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(o.status);
    if (filter === 'SHIPPED') return o.status === 'SHIPPED';
    if (filter === 'DELIVERED') return o.status === 'DELIVERED';
    if (filter === 'CANCELLED') return ['CANCELLED', 'FAILED'].includes(o.status);
    if (filter === 'RETURNED') return o.status === 'REFUNDED';
    return true;
  });

  const getTabCount = (tabId) => {
    if (tabId === 'ALL') return orders.length;
    return orders.filter(o => {
      if (tabId === 'PROCESSING') return ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(o.status);
      if (tabId === 'SHIPPED') return o.status === 'SHIPPED';
      if (tabId === 'DELIVERED') return o.status === 'DELIVERED';
      if (tabId === 'CANCELLED') return ['CANCELLED', 'FAILED'].includes(o.status);
      if (tabId === 'RETURNED') return o.status === 'REFUNDED';
      return false;
    }).length;
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedOrders = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startItem = filtered.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <svg className="animate-spin w-8 h-8 text-[#10B981] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm font-black uppercase tracking-wider text-gray-400">Fetching your orders…</p>
      </div>
    );
  }

  if (expanded) {
    return (
      <CustomerOrderDetails
        order={orders.find(o => o.orderId === expanded)}
        onBack={() => setExpanded(null)}
        busyId={busyId}
        setBusyId={setBusyId}
        onRefundRequested={load}
      />
    );
  }

  return (
    <div className="pb-10 font-sans text-gray-800 animate-in fade-in duration-300">
      {/* ── Tabs & Filters Toolbar ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex overflow-x-auto w-full md:w-auto scrollbar-hide gap-2 py-1">
          {TABS.map(tab => {
            const isActive = filter === tab.id;
            const count = getTabCount(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => { setFilter(tab.id); setCurrentPage(1); }}
                className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-200 hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-[#16A34A] text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200/80 hover:text-gray-800'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 flex items-center gap-2.5 shadow-xs w-full md:w-auto">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            Filter
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Last 6 Months
            <svg className="w-3.5 h-3.5 text-gray-400 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      {/* ── Orders List ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="w-12 h-12 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">No orders found</p>
          <p className="text-[13px] text-gray-500 font-medium mb-4">You don't have any orders matching this filter.</p>
          <Link to="/" className="inline-flex items-center justify-center bg-[#16A34A] hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map(order => {
            const firstItem = order.items?.[0] || {};
            const pConf = getPaymentConfig(order.paymentStatus);
            const sBadge = STATUS_BADGE[order.status] || 'bg-gray-50 border-gray-200 text-gray-600';
            const sLabel = STATUS_LABEL[order.status] || order.status;
            const sIcon = STATUS_ICON[order.status] || null;

            return (
              <div 
                key={order.orderId} 
                className="bg-white border border-[#E5E7EB] rounded-2xl p-4 md:py-3.5 md:px-5 min-h-[80px] flex flex-col lg:flex-row gap-4 lg:items-center shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer"
                onClick={() => setExpanded(order.orderId)}
              >
                {/* 1. Left Section: Product details & ID */}
                <div className="flex flex-1 items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 bg-white border border-gray-150 rounded-xl flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
                    {firstItem.imagePath ? (
                      <img src={getImgUrl(firstItem.imagePath)} className="max-w-full max-h-full object-contain rounded-lg" alt="" />
                    ) : (
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-bold text-slate-800 leading-snug truncate hover:text-[#16A34A] transition-colors">
                       {firstItem.name || 'Order Items'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                       {firstItem.variantLabel && <span>Variant: <span className="text-slate-800 font-semibold">{firstItem.variantLabel}</span></span>}
                       {firstItem.variantLabel && firstItem.color && <span className="w-px h-2 bg-gray-300"></span>}
                       {firstItem.color && <span>Color: <span className="text-slate-800 font-semibold">{firstItem.color}</span></span>}
                       {firstItem.size && <span>Size: <span className="text-slate-800 font-semibold">{firstItem.size}</span></span>}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 font-medium mt-0.5">
                      <span>Qty: <strong className="text-slate-800 font-semibold">{firstItem.quantity || 1}</strong>{order.items?.length > 1 && <span className="text-[#16A34A] ml-1 font-bold">+{order.items.length - 1} more</span>}</span>
                      <span className="text-gray-300">•</span>
                      <span>Order ID: <strong className="text-slate-850 font-semibold">{order.customOrderId || `#ORD-${order.orderId}`}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 2. Center Section: Compact Payment & Dates */}
                <div className="w-full lg:w-48 flex-shrink-0 flex flex-col gap-1 border-t lg:border-t-0 lg:border-l lg:border-r border-gray-100 pt-3 lg:pt-0 lg:px-4.5 text-xs text-gray-500 font-medium">
                  {order.paymentMethod && (
                    <div className="flex items-center gap-1.5">
                      <span>Payment:</span>
                      {order.paymentMethod.toUpperCase() === 'ESEWA' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#16A34A] border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          eSewa • {pConf.label}
                        </span>
                      ) : order.paymentMethod.toUpperCase() === 'KHALTI' ? (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-violet-600 border border-purple-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Khalti • {pConf.label}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pConf.cls}`}>
                          {order.paymentMethod} • {pConf.label}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5">
                    <span>Placed:</span>
                    <strong className="text-slate-800 font-semibold">{fmtDate(order.createdAt)}</strong>
                  </div>
                  
                  <div className="text-[10px] text-gray-400 font-medium">
                    {order.status === 'DELIVERED' && order.deliveredAt && `Delivered ${fmtDate(order.deliveredAt)}`}
                    {order.status === 'SHIPPED' && order.shippedAt && `Shipped ${fmtDate(order.shippedAt)}`}
                    {order.status === 'CANCELLED' && order.cancelledAt && `Cancelled ${fmtDate(order.cancelledAt)}`}
                    {['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(order.status) && `Expected by ${fmtDate(new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000))}`}
                  </div>
                </div>

                {/* 3. Right Section: Price, Status & Actions */}
                <div className="w-full lg:w-auto flex-shrink-0 flex flex-row lg:flex-col xl:flex-row items-center gap-3.5 justify-between lg:justify-start">
                  <div className="flex flex-col gap-0.5 min-w-[90px] lg:text-right xl:text-left">
                    <span className="text-lg font-bold text-[#16A34A] font-mono leading-none">{money(order.grandTotal)}</span>
                    <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider leading-none">Grand Total</span>
                  </div>

                  <span className={`h-8 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 select-none ${sBadge}`}>
                    {sIcon} {sLabel}
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpanded(order.orderId); }} 
                      className="h-8 px-3 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    >
                      Details
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); /* TODO: Options panel */ }}
                      className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
          
          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-150 gap-3">
              <p className="text-[12px] text-gray-500 font-semibold">Showing {startItem} to {endItem} of {filtered.length} orders</p>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      currentPage === page 
                        ? 'bg-emerald-50 text-[#16A34A] border border-emerald-100' 
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
