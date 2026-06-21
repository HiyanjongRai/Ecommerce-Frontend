import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSellerOrders, getSellerProfile } from '../services/sellerService';
import { formatMoney, normalizeList, resolveImageUrl, SectionHeader } from './SellerSectionUtils';
import SellerOrderDetails from './SellerOrderDetails';
import { useSellerTheme } from '../hooks/useSellerTheme';
import { Sparkles, RefreshCw, Package, Clock, Scale, Coins } from 'lucide-react';

// Strip backend role prefixes from customer names (server-side concat bug)
const sanitizeName = (raw) => {
  if (!raw) return 'Anonymous';
  const cleaned = String(raw).replace(/^(admincustomer_user|customer_user|admin|seller_user|user_)/i, '').trim();
  return cleaned || 'Anonymous';
};

const SellerOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  const [sellerUserId, setSellerUserId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Filtering & Search
  const [activeTab, setActiveTab] = useState(() => {
    const statusParam = new URLSearchParams(window.location.search).get('status');
    if (statusParam) {
      const upper = statusParam.toUpperCase();
      if (['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(upper)) {
        return upper;
      }
    }
    return 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('orderId') || '');

  useEffect(() => {
    const q = searchParams.get('orderId');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const upper = statusParam.toUpperCase();
      if (['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(upper)) {
        setActiveTab(upper);
      }
    } else {
      setActiveTab('ALL');
    }
  }, [searchParams]);
  
  // Selected Order for Details View
  const [selectedOrder, setSelectedOrder] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const profileRes = await getSellerProfile();
      const userId = profileRes.data?.userId;
      setSellerUserId(userId);
      if (userId) {
        const orderRes = await getSellerOrders(userId);
        setOrders(normalizeList(orderRes.data));
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Recalculate stats dynamically based on ALL orders
  const stats = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let earnings = 0;

    orders.forEach(order => {
      const status = String(order.status).toUpperCase();
      if (['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(status)) pending++;
      else if (['PROCESSING', 'PACKED'].includes(status)) processing++;
      
      // Calculate net earnings for non-cancelled orders
      if (!['CANCELLED', 'FAILED', 'RETURNED'].includes(status)) {
        earnings += Number(order.sellerNetAmount || order.totalAmount || 0);
      }
    });

    return { all: orders.length, pending, processing, earnings };
  }, [orders]);

  // Tab count indicators calculations
  const tabCounts = useMemo(() => {
    const counts = { ALL: orders.length, PENDING: 0, PROCESSING: 0, SHIPPED: 0, COMPLETED: 0, CANCELLED: 0 };
    orders.forEach(order => {
      const status = String(order.status).toUpperCase();
      if (['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(status)) counts.PENDING++;
      else if (['PROCESSING', 'PACKED', 'CONFIRMED', 'CONFIRMED_BY_CALL'].includes(status)) counts.PROCESSING++;
      else if (['SHIPPED', 'OUT_FOR_DELIVERY'].includes(status)) counts.SHIPPED++;
      else if (status === 'DELIVERED') counts.COMPLETED++;
      else if (['CANCELLED', 'FAILED', 'RETURNED'].includes(status)) counts.CANCELLED++;
    });
    return counts;
  }, [orders]);

  // Tab Filtering logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filter by tab
      const status = String(order.status).toUpperCase();
      let matchesTab = true;
      if (activeTab === 'PENDING') {
        matchesTab = ['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(status);
      } else if (activeTab === 'PROCESSING') {
        matchesTab = ['PROCESSING', 'PACKED', 'CONFIRMED', 'CONFIRMED_BY_CALL'].includes(status);
      } else if (activeTab === 'SHIPPED') {
        matchesTab = ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(status);
      } else if (activeTab === 'COMPLETED') {
        matchesTab = status === 'DELIVERED';
      } else if (activeTab === 'CANCELLED') {
        matchesTab = ['CANCELLED', 'FAILED', 'RETURNED'].includes(status);
      }

      // 2. Filter by search query
      let matchesSearch = true;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const customOrderIdStr = String(order.customOrderId || '').toLowerCase();
        const orderIdStr = String(order.orderId || order.id || '').toLowerCase();
        const customerNameStr = String(order.customerName || order.userName || '').toLowerCase();
        const productsStr = String(order.productNames || '').toLowerCase();
        matchesSearch = customOrderIdStr.includes(q) || orderIdStr.includes(q) || customerNameStr.includes(q) || productsStr.includes(q);
      }

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
  };

  const inputCls = `border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors w-full sm:w-64 ${
    isDark 
      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-655 focus:border-[#16A34A]' 
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#16A34A]'
  }`;

  if (loading) return (
    <div className={`flex flex-col items-center justify-center h-64 gap-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <svg className="animate-spin w-6 h-6 text-[#16A34A]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-xs font-bold uppercase tracking-wider">Loading orders...</span>
    </div>
  );

  if (selectedOrder) {
    return (
      <SellerOrderDetails 
        orderId={selectedOrder.orderId || selectedOrder.id}
        onClose={() => {
          setSelectedOrder(null);
          load();
        }}
      />
    );
  }

  return (
    <div className={`space-y-6 max-w-[1400px] animate-in fade-in duration-300 font-sans ${themeClasses.bg.primary}`}>

      {/* ── Premium Gradient Page Header Banner ── */}
      <SectionHeader 
        title="Order & Analytics Desk"
        subtitle="Review store transactions, payouts, and fulfillment operations."
        tag="Fulfillment Panel"
        action={
          <button 
            type="button" 
            onClick={load} 
            className="h-10 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-white text-gray-955 hover:bg-gray-100 active:scale-95 shadow-md shrink-0 cursor-pointer border-0"
          >
            <RefreshCw size={12} className="shrink-0 text-slate-800" />
            Sync Orders
          </button>
        }
      />

      {message && (
        <div className={`p-4 border rounded-xl text-xs font-black flex items-center gap-3 tracking-wide uppercase ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          {message}
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.all, sub: 'All-time volume', icon: Package, iconColor: 'text-blue-500 bg-blue-500/10' },
          { label: 'Pending', value: stats.pending, sub: 'Awaiting dispatch', icon: Clock, iconColor: 'text-amber-500 bg-amber-500/10', extra: stats.pending > 0 },
          { label: 'Processing', value: stats.processing, sub: 'In fulfillment', icon: Scale, iconColor: 'text-indigo-500 bg-indigo-500/10' },
          { label: 'Net Earnings', value: formatMoney(stats.earnings), sub: 'Settled revenue', icon: Coins, iconColor: 'text-[#16A34A] bg-[#16A34A]/10' },
        ].map((card, idx) => {
          const CardIcon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 border rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-[110px] flex flex-col justify-between ${
                isDark
                  ? 'bg-zinc-950 border-zinc-900 hover:border-[#16A34A]/30'
                  : 'bg-white border-gray-200 hover:border-[#16A34A]/25'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-widest block ${isDark ? 'text-zinc-550' : 'text-gray-400'}`}>{card.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconColor}`}>
                  <CardIcon size={15} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2 flex-wrap">
                <p className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {card.value}
                  {card.extra && <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
                </p>
                <p className={`text-[9px] font-bold ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs & Search ── */}
      <div className={`border rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-colors overflow-hidden ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'}`}>
        <div className={`px-5 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'border-zinc-900' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'PROCESSING', label: 'Processing' },
              { id: 'SHIPPED', label: 'Shipped' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'CANCELLED', label: 'Cancelled' }
            ].map(tab => (
              <button key={tab.id} onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                if (tab.id === 'ALL') {
                  nextParams.delete('status');
                } else {
                  nextParams.set('status', tab.id.toLowerCase());
                }
                setSearchParams(nextParams);
              }}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  activeTab === tab.id 
                    ? isDark
                      ? 'bg-white border-white text-black font-black' 
                      : 'bg-slate-900 border-slate-900 text-white font-black' 
                    : isDark 
                      ? 'text-zinc-400 border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:text-white' 
                      : 'text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                {tab.label}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? isDark ? 'bg-zinc-200 text-black' : 'bg-white/20 text-white'
                    : isDark ? 'bg-zinc-850 text-zinc-400' : 'bg-gray-150 text-gray-650'
                }`}>
                  {tabCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>
          
          {/* Elegant pill search input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search order ID or customer…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-9 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-emerald-500/15 outline-none transition-all placeholder-gray-400 dark:placeholder-zinc-600 text-slate-800 dark:text-white shadow-2xs`}
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-550">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors bg-transparent border-0 cursor-pointer text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Orders List ── */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
              <svg className={`w-6 h-6 ${isDark ? 'text-zinc-650' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className={`text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>No orders found</p>
            <p className={`text-[10px] font-semibold ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {filteredOrders.map((order) => {
              const itemsCount = order.totalItems || 1;
              const orderStatus = String(order.status).toUpperCase();
              const isUrgent = ['PENDING', 'COD_PENDING', 'PROCESSING', 'CONFIRMED', 'PACKED'].includes(orderStatus) &&
                (order.createdAt && (Date.now() - new Date(order.createdAt).getTime() > 24 * 60 * 60 * 1000));
              
              const sBadge = 
                ['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(orderStatus) ? (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200') :
                ['PROCESSING', 'PACKED', 'CONFIRMED', 'CONFIRMED_BY_CALL'].includes(orderStatus) ? (isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200') :
                ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(orderStatus) ? (isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200') :
                orderStatus === 'DELIVERED' ? (isDark ? 'bg-emerald-950/20 text-emerald-450 border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-100') :
                (isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800' : 'bg-gray-100 text-gray-550 border-gray-200');
 
              return (
                <div 
                  key={order.orderId || order.id} 
                  className={`border rounded-[20px] p-5 flex flex-col md:flex-row gap-5 md:items-center shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300 cursor-pointer bg-white dark:bg-zinc-950 border-gray-150 dark:border-zinc-900 hover:border-emerald-600/20 dark:hover:border-emerald-500/20 hover:-translate-y-0.5 hover:shadow-md`}
                  onClick={() => handleOpenDetails(order)}
                >
                  {/* 1. Order ID, Date, Customer */}
                  <div className={`w-full md:w-52 flex-shrink-0 space-y-2 pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-zinc-900 md:pr-5`}>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 text-gray-400 dark:text-zinc-550`}>Order ID</p>
                      <p className={`text-xs font-black truncate text-slate-800 dark:text-gray-100`}>{order.customOrderId || `#ORD-${order.orderId || order.id}`}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 text-gray-400 dark:text-zinc-550`}>Date / Customer</p>
                      <p className={`text-[10px] font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                      <p className={`text-[10px] font-semibold truncate ${isDark ? 'text-zinc-450' : 'text-gray-500'}`}>{sanitizeName(order.customerName)}</p>
                    </div>
                  </div>

                  {/* 2. Product Image & Details */}
                  <div className="flex flex-1 items-center gap-4 min-w-0">
                    <div className={`w-16 h-16 rounded-xl border flex items-center justify-center p-1.5 flex-shrink-0 bg-gray-50 border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 shadow-2xs`}>
                      {order.productImage ? (
                        <img src={resolveImageUrl(order.productImage)} className="max-w-full max-h-full object-contain rounded-md" alt="" />
                      ) : (
                        <svg className={`w-6 h-6 ${isDark ? 'text-zinc-700' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-slate-805'}`}>
                         {order.productNames || 'Ordered Items'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-semibold ${isDark ? 'text-zinc-450' : 'text-gray-500'}`}>Qty: <span className={`font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{itemsCount}</span></span>
                        {isUrgent && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider animate-pulse bg-red-500/10 text-red-500 border-red-500/20`}>Late Dispatch</span>}
                      </div>
                    </div>
                  </div>

                  {/* 3. Price & Status */}
                  <div className="w-full md:w-36 flex-shrink-0 space-y-1.5 text-right md:text-left">
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(order.sellerNetAmount || order.totalAmount || 0)}</p>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${sBadge}`}>
                        {orderStatus}
                      </span>
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-550' : 'text-gray-400'}`}>
                      {order.paymentMethod || 'COD'}
                    </p>
                  </div>

                  {/* 4. Actions */}
                  <div className="flex items-center justify-end md:justify-start gap-1.5 flex-shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenDetails(order); }} 
                      className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-emerald-600/20 active:scale-[0.98]`}
                    >
                      Manage
                      <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
