import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { 
  getUserOrdersSimple, 
  getLoyaltyPoints, 
  getCustomerRefunds, 
  getNotifications, 
  getProducts 
} from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const getPaymentConfig = (status) => {
  if (status === 'PAID') return { cls: 'bg-emerald-50 text-[#16A34A] border border-emerald-100', label: 'Paid' };
  if (status === 'REFUNDED') return { cls: 'bg-purple-50 text-purple-650 border border-purple-100', label: 'Refunded' };
  return { cls: 'bg-amber-50 text-amber-600 border border-amber-100', label: 'Pending' };
};

/* ── Status config matching orders page ──────────────────────── */
const STATUS_BADGE = {
  DRAFT:      'bg-blue-50 border border-blue-200/50 text-blue-600',
  PENDING:    'bg-amber-50 border border-amber-200/50 text-amber-600',
  CONFIRMED:  'bg-blue-50 border border-blue-200/50 text-blue-600',
  PROCESSING: 'bg-blue-50 border border-blue-200/50 text-blue-600',
  PACKED:     'bg-blue-50 border border-blue-200/50 text-blue-600',
  SHIPPED:    'bg-blue-50 border border-blue-200/50 text-blue-600',
  DELIVERED:  'bg-emerald-50 border border-emerald-200/50 text-emerald-700',
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
  DELIVERED: <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
  SHIPPED: <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
  PROCESSING: <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  CANCELLED: <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
};
Object.keys(STATUS_LABEL).forEach(k => {
  if (!STATUS_ICON[k]) {
    const l = STATUS_LABEL[k];
    if (l === 'Processing') STATUS_ICON[k] = STATUS_ICON.PROCESSING;
    else if (l === 'Returned' || l === 'Cancelled' || l === 'Failed') STATUS_ICON[k] = STATUS_ICON.CANCELLED;
  }
});

/* ── Tier helper ─────────────────────────────────────────────── */
const getTier = (pts = 0) =>
  pts >= 10000 ? { label: 'Diamond', color: '#06b6d4' } :
  pts >= 4000  ? { label: 'Platinum', color: '#6366f1' } :
  pts >= 1500  ? { label: 'Gold',    color: '#F59E0B' } :
  pts >= 500   ? { label: 'Silver',  color: '#64748b' } :
                 { label: 'Bronze',  color: '#92400e' };

const getProgressMeta = (pts) => {
  if (pts >= 10000) return { current: pts, target: 10000, percentage: 100, nextLabel: 'Max Tier reached' };
  if (pts >= 4000)  return { current: pts - 4000, target: 6000, percentage: Math.min(100, Math.round(((pts - 4000) / 6000) * 100)), nextLabel: 'Diamond' };
  if (pts >= 1500)  return { current: pts - 1500, target: 2500, percentage: Math.min(100, Math.round(((pts - 1500) / 2500) * 100)), nextLabel: 'Platinum' };
  if (pts >= 500)   return { current: pts - 500,  target: 1000, percentage: Math.min(100, Math.round(((pts - 500) / 1000) * 100)), nextLabel: 'Gold' };
  return { current: pts, target: 500, percentage: Math.min(100, Math.round((pts / 500) * 100)), nextLabel: 'Silver' };
};

/* ── Status Meta Helper for Refund/Dispute Widgets ───────────── */
const STATUS_META = {
  REQUEST_CREATED: { label: 'Request Created', badge: 'bg-blue-50 text-blue-600 border-blue-200' },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-50 text-amber-600 border-amber-200' },
  MORE_EVIDENCE_REQUESTED: { label: 'Evidence Required', badge: 'bg-red-50 text-red-500 border-red-200' },
  OFFER_MADE: { label: 'Offer Pending', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  SELLER_APPROVED: { label: 'Approved by Seller', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  RETURN_PENDING: { label: 'Return Pending', badge: 'bg-amber-50 text-amber-600 border-amber-200' },
  RETURN_SHIPPED: { label: 'Return Shipped', badge: 'bg-blue-50 text-blue-600 border-blue-200' },
  RETURN_RECEIVED: { label: 'Return Received', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  PRODUCT_INSPECTION: { label: 'Product Inspection', badge: 'bg-violet-50 text-violet-600 border-violet-200' },
  INSPECTION_COMPLETE: { label: 'Inspection Complete', badge: 'bg-purple-50 text-purple-600 border-purple-200' },
  REFUND_PROCESSING: { label: 'Refund Processing', badge: 'bg-amber-50 text-amber-600 border-amber-200' },
  PENDING_ADMIN_VERIFICATION: { label: 'Admin Verification', badge: 'bg-purple-50 text-purple-750 border-purple-200' },
  REFUND_COMPLETED: { label: 'Refund Completed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  SELLER_REJECTED: { label: 'Rejected by Seller', badge: 'bg-red-50 text-red-500 border-red-200' },
  CUSTOMER_ACCEPTS: { label: 'Offer Accepted', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  CLOSED: { label: 'Closed', badge: 'bg-gray-100 text-gray-500 border-gray-200' },
  ADMIN_REVIEW: { label: 'Admin Review', badge: 'bg-pink-50 text-pink-600 border-pink-200' },
  ADMIN_APPROVED_REFUND: { label: 'Approved by Admin', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  ADMIN_REJECTED_REFUND: { label: 'Rejected by Admin', badge: 'bg-red-50 text-red-500 border-red-200' },
  REPLACEMENT_PREPARING: { label: 'Replacement Preparing', badge: 'bg-violet-50 text-violet-600 border-violet-200' },
  REPLACEMENT_SHIPPED: { label: 'Replacement Shipped', badge: 'bg-sky-50 text-sky-600 border-sky-200' },
  EXCHANGE_COMPLETED: { label: 'Exchange Completed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
};

const getStatusMeta = (status) => {
  return STATUS_META[status] || { label: status, badge: 'bg-gray-50 text-gray-500 border border-gray-200' };
};

/* ── Notification Icons ──────────────────────────────────────── */
const NOTIF_ICONS = {
  ORDER:    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  DELIVERY: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
  PAYMENT:  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>,
  PROMO:    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>,
  SYSTEM:   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>,
};

/* ── Quick link data ─────────────────────────────────────────── */
const QUICK_LINKS = [
  {
    to: '/customer/orders', label: 'My Orders', sub: 'Track & manage',
    color: '#10B981', bg: '#e6f7ec',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  },
  {
    to: '/customer/wishlist', label: 'Wishlist', sub: 'Saved items',
    color: '#ef4444', bg: '#fff1f2',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  {
    to: '/customer/addresses', label: 'Addresses', sub: 'Locations',
    color: '#8b5cf6', bg: '#f5f3ff',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
  {
    to: '/customer/loyalty', label: 'Rewards', sub: 'Points & tiers',
    color: '#d97706', bg: '#fffbeb',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
];

/* ── Component ───────────────────────────────────────────────── */
const CustomerHome = () => {
  const { user } = useCustomer();
  const navigate = useNavigate();
  const [orders,        setOrders]        = useState([]);
  const [loyalty,       setLoyalty]       = useState(null);
  const [refunds,       setRefunds]       = useState([]);
  const [notifs,        setNotifs]        = useState([]);
  const [recProducts,   setRecProducts]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const userId = user?.id;

  useEffect(() => {
    const load = async () => {
      if (!userId) { setLoading(false); return; }
      const [ordRes, loyRes, refRes, notifRes, prodRes] = await Promise.allSettled([
        getUserOrdersSimple(),
        getLoyaltyPoints(),
        getCustomerRefunds(),
        getNotifications(),
        getProducts({ page: 0, size: 3 }),
      ]);
      if (ordRes.status === 'fulfilled') {
        const d = ordRes.value.data;
        setOrders(Array.isArray(d) ? d : []);
      }
      if (loyRes.status === 'fulfilled') setLoyalty(loyRes.value.data);
      if (refRes.status === 'fulfilled') {
        const d = refRes.value.data?.content || refRes.value.data || [];
        setRefunds(Array.isArray(d) ? d : []);
      }
      if (notifRes.status === 'fulfilled') {
        setNotifs(Array.isArray(notifRes.value.data) ? notifRes.value.data : []);
      }
      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value.data?.content || prodRes.value.data || [];
        setRecProducts(Array.isArray(d) ? d : []);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const displayName  = user?.fullName || user?.username || 'Customer';
  const firstName    = displayName.split(' ')[0];
  const totalOrders  = orders.length;
  const totalSpent   = orders.reduce((s, o) => s + (o.grandTotal || o.totalAmount || 0), 0);
  const avgOrder     = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
  const activeOrders = orders.filter(o => ['PENDING','CONFIRMED','PROCESSING','PACKED','SHIPPED','DRAFT'].includes(o.status)).length;
  const delivered    = orders.filter(o => o.status === 'DELIVERED').length;
  const loyaltyPts   = loyalty?.points ?? 0;
  const tier         = getTier(loyaltyPts);
  const today        = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const activeRefunds = refunds.filter(r => !['CLOSED', 'REFUND_COMPLETED', 'EXCHANGE_COMPLETED'].includes(r.status));
  const recentNotifsList = notifs.slice(0, 3);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-[20px] py-4 px-6 shadow-[0_8px_30px_rgba(22,163,74,0.08)] border border-emerald-800/10"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #064e3b 100%)' }}
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10">
          <div>
            <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">
              Welcome back, {firstName}! 👋
            </h2>
            <p className="text-gray-300 text-xs font-semibold mt-1">
              {today} • Track and manage your orders
            </p>
          </div>
          {/* Loyalty Widget */}
          <div className="flex-shrink-0 flex items-center gap-3 bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl px-3 py-1.5 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <p className="text-[8px] text-white/50 font-black uppercase tracking-widest mb-0.5">Tier</p>
              <p className="text-white text-[11px] font-black" style={{ color: tier.color === '#92400e' ? '#fbbf24' : tier.color }}>
                {tier.label}
              </p>
            </div>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <div>
              <p className="text-[8px] text-white/50 font-black uppercase tracking-widest mb-0.5">Points</p>
              <p className="text-white text-[11px] font-black">{loyaltyPts.toLocaleString()} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Orders */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between min-h-[130px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Total Orders</p>
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-[#E5E7EB] shadow-xs">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[28px] lg:text-[32px] font-bold text-slate-800 leading-none tracking-tight">{totalOrders}</p>
            <p className="text-[11px] text-gray-500 font-semibold mt-2">{delivered} orders delivered</p>
          </div>
        </div>

        {/* 2. Active Orders */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between min-h-[130px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Active Orders</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-xs">
              <svg className="w-4 h-4 text-[#F59E0B]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[28px] lg:text-[32px] font-bold text-slate-800 leading-none tracking-tight">{activeOrders}</p>
            <p className="text-[11px] text-gray-500 font-semibold mt-2">In progress & tracking</p>
          </div>
        </div>

        {/* 3. Total Spending */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between min-h-[130px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Total Spent</p>
            <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center border border-emerald-100 shadow-xs">
              <svg className="w-4 h-4 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[28px] lg:text-[32px] font-bold text-slate-800 leading-none tracking-tight">Rs. {totalSpent.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 font-semibold mt-2">Avg. Rs. {avgOrder.toLocaleString()} / order</p>
          </div>
        </div>

        {/* 4. Loyalty Points */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between min-h-[130px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Points Balance</p>
            <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center border border-yellow-100/50 shadow-xs">
              <svg className="w-4 h-4 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[28px] lg:text-[32px] font-bold text-slate-800 leading-none tracking-tight">{loyaltyPts.toLocaleString()}</p>
            <p className="text-[11px] font-bold mt-2" style={{ color: tier.color === '#92400e' ? '#d97706' : tier.color }}>
              {tier.label} Member
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Recent Orders</h3>
            <Link
              to="/customer/orders"
              className="text-xs font-black text-[#16A34A] hover:text-emerald-700 transition-colors flex items-center gap-1.5"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 p-12 justify-center text-gray-450 text-xs font-black uppercase tracking-wider bg-white rounded-[20px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              <svg className="animate-spin w-4 h-4 text-[#16A34A]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Fetching recent orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-[20px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-6 h-6 text-gray-350" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">No orders yet</p>
              <p className="text-xs text-gray-505 font-semibold">Your purchase history will appear here.</p>
              <Link to="/" className="inline-flex mt-5 bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map(o => {
                const productName = o.productNames || 'Order Items';
                const productImage = o.productImage;
                const itemsCount = o.totalItems || 1;
                const pConf = getPaymentConfig(o.paymentStatus);
                const sBadge = STATUS_BADGE[o.status] || 'bg-gray-50 border border-gray-250 text-gray-600';
                const sLabel = STATUS_LABEL[o.status] || o.status;
                const sIcon = STATUS_ICON[o.status] || null;

                return (
                  <div 
                    key={o.orderId || o.id} 
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-4 md:py-3.5 md:px-5 min-h-[80px] flex flex-col md:flex-row gap-4 md:items-center shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer"
                    onClick={() => navigate(`/customer/orders?orderId=${o.orderId}`)}
                  >
                    {/* 1. Left Section: Product details & ID */}
                    <div className="flex flex-1 items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 bg-white border border-gray-150 rounded-xl flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
                        {productImage ? (
                          <img src={getImgUrl(productImage)} className="max-w-full max-h-full object-contain rounded-lg" alt="" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-bold text-slate-800 leading-snug truncate hover:text-[#16A34A] transition-colors">
                           {productName}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 font-medium mt-0.5">
                          <span>Qty: <strong className="text-slate-800 font-semibold">{itemsCount}</strong></span>
                          <span className="text-gray-300">•</span>
                          <span>Order ID: <strong className="text-slate-850 font-semibold">{o.customOrderId || `#ORD-${o.orderId}`}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Center Section: Compact Payment & Dates */}
                    <div className="w-full md:w-auto flex-shrink-0 flex flex-col gap-1 border-t md:border-t-0 md:border-l md:border-r border-gray-100 pt-3 md:pt-0 md:px-4.5 text-xs text-gray-500 font-medium min-w-[130px]">
                      {o.paymentMethod && (
                        <div className="flex items-center gap-1.5">
                          <span>Payment:</span>
                          {o.paymentMethod.toUpperCase() === 'ESEWA' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#16A34A] border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              eSewa • {pConf.label}
                            </span>
                          ) : o.paymentMethod.toUpperCase() === 'KHALTI' ? (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-violet-600 border border-purple-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Khalti • {pConf.label}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pConf.cls}`}>
                              {o.paymentMethod} • {pConf.label}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <span>Placed:</span>
                        <strong className="text-slate-800 font-semibold">{fmtDate(o.createdAt)}</strong>
                      </div>
                      
                      <div className="text-[10px] text-gray-400 font-medium">
                        {o.status === 'DELIVERED' && o.deliveredAt && `Delivered ${fmtDate(o.deliveredAt)}`}
                        {o.status === 'SHIPPED' && o.shippedAt && `Shipped ${fmtDate(o.shippedAt)}`}
                        {o.status === 'CANCELLED' && o.cancelledAt && `Cancelled ${fmtDate(o.cancelledAt)}`}
                        {['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(o.status) && `Expected by ${fmtDate(new Date(new Date(o.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000))}`}
                      </div>
                    </div>

                    {/* 3. Right Section: Price, Status & Actions */}
                    <div className="w-full md:w-auto flex-shrink-0 flex flex-row md:flex-col items-center md:items-end gap-2.5 justify-between md:justify-center border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 min-w-[130px]">
                      <div className="flex flex-col gap-0.5 md:text-right">
                        <span className="text-lg font-bold text-[#16A34A] font-mono leading-none">{money(o.grandTotal)}</span>
                        <span className="text-[9px] text-gray-455 font-bold uppercase tracking-wider leading-none">Grand Total</span>
                      </div>

                      <span className={`h-8 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 select-none ${sBadge}`}>
                        {sIcon} {sLabel}
                      </span>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/customer/orders?orderId=${o.orderId}`); }} 
                          className="h-8 px-3 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                        >
                          Details
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Spaced Interactive Widgets */}
        <div className="space-y-6 lg:col-span-1">
          {/* Quick Access (2x2 Grid) */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-4">
            <h3 className="text-[18px] font-bold text-slate-800">Quick Access</h3>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 group text-center"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 shadow-xs"
                    style={{ background: link.bg, color: link.color }}
                  >
                    {link.icon}
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 group-hover:text-[#16A34A] transition-colors leading-tight">{link.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Loyalty progress bar */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-slate-800">Tier Status Progress</h3>
              <span className="text-[10px] font-bold uppercase bg-emerald-50 text-[#16A34A] px-2 py-0.5 rounded border border-emerald-100">
                {tier.label}
              </span>
            </div>
            
            {(() => {
              const meta = getProgressMeta(loyaltyPts);
              return (
                <div className="space-y-2 mt-1">
                  <div className="flex justify-between items-end text-xs font-bold">
                    <span className="text-gray-900">{loyaltyPts.toLocaleString()} pts</span>
                    {meta.nextLabel === 'Max Tier reached' ? (
                      <span className="text-gray-400">{meta.nextLabel}</span>
                    ) : (
                      <span className="text-gray-450 font-medium">Next: {meta.nextLabel}</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#16A34A] h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${meta.percentage}%` }}
                    />
                  </div>
                  {meta.nextLabel !== 'Max Tier reached' && (
                    <p className="text-[10px] text-gray-400 font-semibold mt-1">
                      {(meta.target - meta.current).toLocaleString()} points left to upgrade
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Active Refunds */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-slate-800">Active Returns & Refunds</h3>
              <span className="text-[10px] font-bold bg-amber-50 text-[#F59E0B] px-2 py-0.5 rounded border border-amber-100">
                {activeRefunds.length} Active
              </span>
            </div>
            
            {activeRefunds.length === 0 ? (
              <div className="text-center py-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-150 p-4">
                <p className="text-xs font-bold text-gray-450">No active refund requests.</p>
                <Link to="/customer/orders" className="text-[10px] font-black text-[#16A34A] hover:underline uppercase tracking-wider mt-1.5 block">
                  Request refund / exchange
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeRefunds.slice(0, 3).map(ref => {
                  const refId = ref.customRefundId || `#REF-${ref.refundId || ref.id}`;
                  const reason = ref.reason || 'No reason provided';
                  const amount = ref.requestedAmount ? `Rs. ${ref.requestedAmount.toLocaleString()}` : '';
                  const meta = getStatusMeta(ref.status);
                  
                  return (
                    <Link
                      key={ref.id}
                      to="/customer/disputes"
                      className="flex items-center gap-3 p-3 bg-gray-50/50 hover:bg-emerald-50/30 border border-gray-100 rounded-xl transition-all duration-200 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10.5px] font-black text-gray-900 font-mono">{refId}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${meta.badge || 'bg-gray-100 text-gray-600'}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-[11.5px] font-bold text-gray-700 truncate">{reason}</p>
                        <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Type: {ref.refundType || 'REFUND'} {amount && `• ${amount}`}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-[#16A34A] transition-colors" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-slate-800">Recent Notifications</h3>
              <Link to="/customer/notifications" className="text-[10px] font-black text-[#16A34A] hover:underline uppercase tracking-wider">
                View all
              </Link>
            </div>
            
            {recentNotifsList.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 text-center py-4 bg-gray-50/50 rounded-2xl">No recent notifications.</p>
            ) : (
              <div className="space-y-3">
                {recentNotifsList.map(notif => (
                  <Link
                    key={notif.id}
                    to="/customer/notifications"
                    className="flex gap-3 items-start p-2.5 hover:bg-gray-50/50 rounded-xl transition-all duration-200"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${!notif.isRead ? 'bg-[#e6f7ec] text-[#16A34A]' : 'bg-gray-100 text-gray-400'}`}>
                      {NOTIF_ICONS[notif.type] || NOTIF_ICONS.SYSTEM || <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug truncate ${!notif.isRead ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {notif.title || notif.message}
                      </p>
                      <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Products */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-3.5">
            <h3 className="text-[18px] font-bold text-slate-800">Recommended for You</h3>
            
            {recProducts.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 text-center py-4 bg-gray-50/50 rounded-2xl">No recommendations available.</p>
            ) : (
              <div className="space-y-3">
                {recProducts.map(prod => {
                  const img = prod.imagePath || prod.image || (prod.images && prod.images[0]);
                  return (
                    <a
                      key={prod.id}
                      href={`/product/${prod.slug || prod.id}`}
                      className="flex items-center gap-3 p-2 bg-gray-50/30 hover:bg-emerald-50/30 border border-gray-100 hover:border-emerald-100/50 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-11 h-11 bg-white border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden p-1 shrink-0">
                        {img ? (
                          <img src={getImgUrl(img)} className="max-w-full max-h-full object-contain" alt="" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#16A34A] transition-colors">{prod.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Rs. {(prod.price || 0).toLocaleString()}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CustomerHome;
