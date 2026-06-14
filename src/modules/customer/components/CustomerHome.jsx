import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { getUserOrdersSimple, getLoyaltyPoints } from '../../../shared/api/customerApi';

/* ── Status badge config ─────────────────────────────────────── */
const STATUS_CFG = {
  PENDING:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED:  { label: 'Confirmed',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  PROCESSING: { label: 'Processing', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PACKED:     { label: 'Packed',     cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  SHIPPED:    { label: 'Shipped',    cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  DELIVERED:  { label: 'Delivered',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED:  { label: 'Cancelled',  cls: 'bg-red-50 text-red-600 border-red-200' },
  REFUNDED:   { label: 'Refunded',   cls: 'bg-orange-50 text-orange-600 border-orange-200' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

/* ── Tier helper ─────────────────────────────────────────────── */
const getTier = (pts = 0) =>
  pts >= 10000 ? { label: 'Diamond', color: '#06b6d4' } :
  pts >= 4000  ? { label: 'Platinum', color: '#6366f1' } :
  pts >= 1500  ? { label: 'Gold',    color: '#d97706' } :
  pts >= 500   ? { label: 'Silver',  color: '#64748b' } :
                 { label: 'Bronze',  color: '#92400e' };

/* ── Quick link data ─────────────────────────────────────────── */
const QUICK_LINKS = [
  {
    to: '/customer/orders', label: 'My Orders', sub: 'Track & manage',
    color: '#10B981', bg: '#f0fdf4',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  },
  {
    to: '/customer/refunds', label: 'Refunds', sub: 'Return requests',
    color: '#f59e0b', bg: '#fffbeb',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  },
  {
    to: '/customer/wishlist', label: 'Wishlist', sub: 'Saved items',
    color: '#ef4444', bg: '#fff1f2',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  {
    to: '/customer/addresses', label: 'Addresses', sub: 'Delivery locations',
    color: '#8b5cf6', bg: '#f5f3ff',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
  {
    to: '/customer/loyalty', label: 'Rewards', sub: 'Points & tiers',
    color: '#d97706', bg: '#fffbeb',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    to: '/customer/messages', label: 'Messages', sub: 'Inbox',
    color: '#3b82f6', bg: '#eff6ff',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
];

/* ── Component ───────────────────────────────────────────────── */
const CustomerHome = () => {
  const { user } = useCustomer();
  const navigate = useNavigate();
  const [orders,        setOrders]        = useState([]);
  const [loyalty,       setLoyalty]       = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const userId = user?.id;

  useEffect(() => {
    const load = async () => {
      if (!userId) { setLoadingOrders(false); return; }
      const [ordRes, loyRes] = await Promise.allSettled([
        getUserOrdersSimple(),
        getLoyaltyPoints(),
      ]);
      if (ordRes.status === 'fulfilled') {
        const d = ordRes.value.data;
        setOrders(Array.isArray(d) ? d : []);
      }
      if (loyRes.status === 'fulfilled') setLoyalty(loyRes.value.data);
      setLoadingOrders(false);
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

  return (
    <div className="space-y-5">

      {/* ── Hero Banner ────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-sm p-5"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-white/10" />
        <div className="absolute -right-2 top-10 w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute right-20 -bottom-6 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-emerald-300/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{today}</p>
            <h2 className="text-white text-xl font-black leading-tight">
              Welcome back, {firstName}! 👋
            </h2>
            <p className="text-emerald-200/70 text-xs font-medium mt-1">
              Here's what's happening with your account today.
            </p>
          </div>
          {/* Loyalty tier pill */}
          <div className="flex-shrink-0 flex items-center gap-2 bg-white/10 border border-white/20 rounded-sm px-3 py-2">
            <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <div>
              <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Tier</p>
              <p className="text-white text-xs font-black" style={{ color: tier.color === '#92400e' ? '#fbbf24' : tier.color }}>
                {tier.label}
              </p>
            </div>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <div>
              <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Points</p>
              <p className="text-white text-xs font-black">{loyaltyPts.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Spending */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Spent</p>
            <div className="w-7 h-7 rounded-sm bg-emerald-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 leading-none">Rs. {totalSpent.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">Avg. Rs. {avgOrder.toLocaleString()} / order</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Orders</p>
            <div className="w-7 h-7 rounded-sm bg-blue-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 leading-none">{totalOrders}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">{delivered} delivered</p>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Active</p>
            <div className="w-7 h-7 rounded-sm bg-amber-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 leading-none">{activeOrders}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">In progress</p>
          </div>
        </div>

        {/* Loyalty Points */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Rewards</p>
            <div className="w-7 h-7 rounded-sm bg-yellow-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 leading-none">{loyaltyPts.toLocaleString()}</p>
            <p className="text-[10px] font-black mt-1" style={{ color: tier.color === '#92400e' ? '#d97706' : tier.color }}>
              {tier.label} tier
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Left: Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Recent Orders</h3>
            <Link
              to="/customer/orders"
              className="text-[10px] font-black uppercase tracking-wider text-[#10B981] hover:text-[#059669] transition-colors flex items-center gap-1"
            >
              View all
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {loadingOrders ? (
            <div className="flex items-center gap-2 p-6 text-gray-400 text-xs">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 px-5">
              <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-1">No orders yet</p>
              <p className="text-[10px] text-gray-400">Your purchase history will appear here.</p>
              <Link to="/" className="inline-block mt-4 bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-black uppercase tracking-wider px-5 py-2 rounded-sm transition-colors">
                Start Shopping →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.slice(0, 5).map(o => {
                const ref = o.customOrderId || (o.orderId ? `#${o.orderId}` : '—');
                const date = o.createdAt
                  ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';
                const amount = (o.grandTotal || o.totalAmount || 0).toLocaleString();
                const productName = o.items?.[0]?.name
                  ? (o.items.length > 1 ? `${o.items[0].name} +${o.items.length - 1}` : o.items[0].name)
                  : null;
                return (
                  <div
                    key={o.orderId || o.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => navigate('/customer/orders')}
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-sm bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-gray-800 font-mono">{ref}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {productName ? `${productName} · ` : ''}{date}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-gray-900">Rs. {amount}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Links */}
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Quick Access</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/70 transition-colors group"
              >
                {/* Colored icon box */}
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: link.bg, color: link.color }}
                >
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-800 group-hover:text-gray-900">{link.label}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{link.sub}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerHome;
