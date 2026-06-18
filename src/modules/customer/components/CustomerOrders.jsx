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
  DRAFT:      'bg-amber-50 border-amber-200 text-amber-600',
  PENDING:    'bg-amber-50 border-amber-200 text-amber-600',
  CONFIRMED:  'bg-amber-50 border-amber-200 text-amber-600',
  PROCESSING: 'bg-amber-50 border-amber-200 text-amber-600',
  PACKED:     'bg-amber-50 border-amber-200 text-amber-600',
  SHIPPED:    'bg-blue-50 border-blue-200 text-blue-600',
  DELIVERED:  'bg-[#e6f7ec] border-[#10B981]/20 text-[#10B981]',
  CANCELLED:  'bg-red-50 border-red-200 text-red-500',
  REFUNDED:   'bg-red-50 border-red-200 text-red-500',
  FAILED:     'bg-red-50 border-red-200 text-red-500',
};

const STATUS_LABEL = {
  DRAFT: 'Processing', PENDING: 'Processing', CONFIRMED: 'Processing',
  PROCESSING: 'Processing', PACKED: 'Processing', SHIPPED: 'Shipped',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Returned',
  FAILED: 'Cancelled',
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
  if (status === 'PAID') return { cls: 'bg-[#e6f7ec] text-[#10B981]', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>, label: 'Paid' };
  if (status === 'REFUNDED') return { cls: 'bg-red-50 text-red-500', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>, label: 'Refunded' };
  // Default to Pending
  return { cls: 'bg-amber-50 text-amber-600', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, label: 'Pending' };
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
      
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 mb-1.5">My Orders</h1>
        <p className="text-sm text-gray-500 font-semibold">Track, view and manage all your orders in one place.</p>
      </div>

      {/* ── Tabs & Filters ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-gray-200 mb-6 gap-4">
        <div className="flex overflow-x-auto w-full xl:w-auto scrollbar-hide gap-8">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`pb-4 text-sm font-black whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                filter === tab.id 
                  ? 'border-[#10B981] text-[#10B981]' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pb-4 xl:pb-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Last 6 Months
            <svg className="w-3.5 h-3.5 text-gray-400 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      {/* ── Orders List ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-2xl">
          <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1.5">No orders found</p>
          <p className="text-xs text-gray-500 font-semibold mb-6">You don't have any orders matching this filter.</p>
          <Link to="/" className="inline-flex items-center justify-center bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-black uppercase tracking-wider px-6 py-3 rounded-lg transition-colors cursor-pointer">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const firstItem = order.items?.[0] || {};
            const pConf = getPaymentConfig(order.paymentStatus);
            const sBadge = STATUS_BADGE[order.status] || 'bg-gray-50 border-gray-200 text-gray-600';
            const sLabel = STATUS_LABEL[order.status] || order.status;
            const sIcon = STATUS_ICON[order.status] || null;

            return (
              <div 
                key={order.orderId} 
                className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row gap-6 md:items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => setExpanded(order.orderId)}
              >
                {/* 1. Order ID, Date, Payment */}
                <div className="w-full md:w-40 flex-shrink-0 space-y-3.5 border-b md:border-b-0 md:border-r border-gray-100 pb-5 md:pb-0 md:pr-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold mb-0.5 uppercase tracking-wider">Order ID</p>
                    <p className="text-sm font-black text-[#10B981]">{order.customOrderId || `#ORD-${order.orderId}`}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold mb-0.5 uppercase tracking-wider">Order Date</p>
                    <p className="text-xs font-black text-gray-900">{fmtDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-[10px] text-gray-500 font-bold">Payment</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${pConf.cls}`}>
                      {pConf.icon}
                      {pConf.label}
                    </span>
                  </div>
                </div>

                {/* 2. Product Image & Details */}
                <div className="flex flex-1 items-center gap-5 min-w-0">
                  <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 flex-shrink-0">
                    {firstItem.imagePath ? (
                      <img src={getImgUrl(firstItem.imagePath)} className="max-w-full max-h-full object-contain" alt="" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="text-[15px] font-black text-gray-900 truncate mb-2">
                       {firstItem.name || 'Order Items'}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-semibold mb-3">
                       {firstItem.variantLabel && <span>Variant: <span className="text-gray-800">{firstItem.variantLabel}</span></span>}
                       {firstItem.variantLabel && firstItem.color && <span className="w-px h-3 bg-gray-300"></span>}
                       {firstItem.color && <span>Color: <span className="text-gray-800">{firstItem.color}</span></span>}
                       {firstItem.size && <span>Size: <span className="text-gray-800">{firstItem.size}</span></span>}
                    </div>
                    <p className="text-[11px] text-gray-500 font-bold">
                      Qty: <span className="text-gray-900">{firstItem.quantity || 1}</span> 
                      {order.items?.length > 1 && <span className="text-[#10B981] ml-2">+{order.items.length - 1} more items</span>}
                    </p>
                  </div>
                </div>

                {/* 3. Price & Status */}
                <div className="w-full md:w-48 flex-shrink-0 space-y-3">
                  <p className="text-lg font-black text-[#10B981]">{money(order.grandTotal)}</p>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-black uppercase tracking-wider ${sBadge}`}>
                      {sIcon} {sLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold">
                    {order.status === 'DELIVERED' && order.deliveredAt && `Delivered on ${fmtDate(order.deliveredAt)}`}
                    {order.status === 'SHIPPED' && order.shippedAt && `Shipped on ${fmtDate(order.shippedAt)}`}
                    {order.status === 'CANCELLED' && order.cancelledAt && `Cancelled on ${fmtDate(order.cancelledAt)}`}
                    {['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && `Expected by ${fmtDate(new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000))}`}
                  </p>
                </div>

                {/* 4. Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setExpanded(order.orderId); }} 
                    className="px-5 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    View Details
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* TODO popup menu */ }}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* ── Pagination ── */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-100 gap-4">
            <p className="text-[11px] text-gray-500 font-bold">Showing 1 to {filtered.length} of {filtered.length} orders</p>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e6f7ec] text-[#10B981] font-black text-xs cursor-pointer">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer">3</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
