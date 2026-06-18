import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { getUserOrdersSimple, getLoyaltyPoints } from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

/* ── Status config matching orders page ──────────────────────── */
const STATUS_BADGE = {
  DRAFT:      'bg-amber-50 border border-amber-200 text-amber-600',
  PENDING:    'bg-amber-50 border border-amber-200 text-amber-600',
  CONFIRMED:  'bg-amber-50 border border-amber-200 text-amber-600',
  PROCESSING: 'bg-amber-50 border border-amber-200 text-amber-600',
  PACKED:     'bg-amber-50 border border-amber-200 text-amber-600',
  SHIPPED:    'bg-blue-50 border border-blue-200 text-blue-600',
  DELIVERED:  'bg-[#e6f7ec] border border-[#10B981]/20 text-[#10B981]',
  CANCELLED:  'bg-red-50 border border-red-200 text-red-500',
  REFUNDED:   'bg-red-50 border border-red-200 text-red-500',
  FAILED:     'bg-red-50 border border-red-200 text-red-500',
};

const STATUS_LABEL = {
  DRAFT: 'Processing', PENDING: 'Processing', CONFIRMED: 'Processing',
  PROCESSING: 'Processing', PACKED: 'Processing', SHIPPED: 'Shipped',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Returned',
  FAILED: 'Cancelled',
};

const STATUS_ICON = {
  DELIVERED: <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
  SHIPPED: <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
  PROCESSING: <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  CANCELLED: <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
};
Object.keys(STATUS_LABEL).forEach(k => {
  if (!STATUS_ICON[k]) {
    const l = STATUS_LABEL[k];
    if (l === 'Processing') STATUS_ICON[k] = STATUS_ICON.PROCESSING;
    else if (l === 'Returned' || l === 'Cancelled') STATUS_ICON[k] = STATUS_ICON.CANCELLED;
  }
});

/* ── Tier helper ─────────────────────────────────────────────── */
const getTier = (pts = 0) =>
  pts >= 10000 ? { label: 'Diamond', color: '#06b6d4' } :
  pts >= 4000  ? { label: 'Platinum', color: '#6366f1' } :
  pts >= 1500  ? { label: 'Gold',    color: '#F59E0B' } :
  pts >= 500   ? { label: 'Silver',  color: '#64748b' } :
                 { label: 'Bronze',  color: '#92400e' };

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
    to: '/customer/addresses', label: 'Addresses', sub: 'Delivery locations',
    color: '#8b5cf6', bg: '#f5f3ff',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
  {
    to: '/customer/loyalty', label: 'Rewards', sub: 'Points & tiers',
    color: '#d97706', bg: '#fffbeb',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    to: '/customer/messages', label: 'Messages', sub: 'Inbox',
    color: '#3b82f6', bg: '#eff6ff',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
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
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">

      {/* ── Hero Banner ────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)' }}
      >
        {/* Decorative elements */}
        <svg className="absolute -bottom-10 left-0 w-full opacity-20 text-emerald-100" viewBox="0 0 1440 320" fill="currentColor">
          <path fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,106.7C672,96,768,128,864,154.7C960,181,1056,203,1152,192C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-white/10" />
        <div className="absolute right-20 -bottom-6 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 z-10">
          <div>
            <p className="text-emerald-300/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{today}</p>
            <h2 className="text-white text-2xl font-black leading-tight tracking-tight">
              Welcome back, {firstName}! 👋
            </h2>
            <p className="text-emerald-200/80 text-sm font-semibold mt-1.5">
              Here's a quick overview of your account today.
            </p>
          </div>
          {/* Loyalty pill */}
          <div className="flex-shrink-0 flex items-center gap-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 shadow-lg">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-0.5">Loyalty Tier</p>
              <p className="text-white text-[15px] font-black" style={{ color: tier.color === '#92400e' ? '#fbbf24' : tier.color }}>
                {tier.label}
              </p>
            </div>
            <div className="w-px h-8 bg-white/20 mx-2" />
            <div>
              <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-0.5">Points Balance</p>
              <p className="text-white text-[15px] font-black">{loyaltyPts.toLocaleString()} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spending */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Spent</p>
            <div className="w-10 h-10 rounded-full bg-[#e6f7ec] flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">Rs. {totalSpent.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 font-bold mt-2">Avg. Rs. {avgOrder.toLocaleString()} / order</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Orders</p>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">{totalOrders}</p>
            <p className="text-[11px] text-gray-500 font-bold mt-2">{delivered} orders delivered successfully</p>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Orders</p>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">{activeOrders}</p>
            <p className="text-[11px] text-gray-500 font-bold mt-2">Currently in progress</p>
          </div>
        </div>

        {/* Loyalty Points */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rewards Points</p>
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">{loyaltyPts.toLocaleString()}</p>
            <p className="text-[11px] font-black mt-2" style={{ color: tier.color === '#92400e' ? '#d97706' : tier.color }}>
              {tier.label} Tier Member
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Left: Recent Orders */}
        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h3 className="text-[15px] font-black text-gray-900">Recent Orders</h3>
            <Link
              to="/customer/orders"
              className="text-xs font-black text-[#10B981] hover:text-[#059669] transition-colors flex items-center gap-1.5"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {loadingOrders ? (
            <div className="flex items-center gap-3 p-10 justify-center text-gray-400 text-sm font-bold">
              <svg className="animate-spin w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Fetching recent orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1.5">No orders yet</p>
              <p className="text-xs text-gray-500 font-semibold">Your purchase history will appear here.</p>
              <Link to="/" className="inline-flex mt-6 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-lg transition-colors shadow-sm">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.slice(0, 5).map(o => {
                const ref = o.customOrderId || (o.orderId ? `#ORD-${o.orderId}` : '—');
                const date = o.createdAt
                  ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';
                const amount = (o.grandTotal || o.totalAmount || 0).toLocaleString();
                const productName = o.items?.[0]?.name
                  ? (o.items.length > 1 ? `${o.items[0].name} +${o.items.length - 1} more` : o.items[0].name)
                  : 'Order Items';
                  
                const sBadge = STATUS_BADGE[o.status] || 'bg-gray-50 border border-gray-200 text-gray-600';
                const sLabel = STATUS_LABEL[o.status] || o.status;
                const sIcon = STATUS_ICON[o.status] || null;

                return (
                  <div
                    key={o.orderId || o.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/customer/orders?orderId=${o.orderId}`)}
                  >
                    {/* Icon / Image */}
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                      {o.items?.[0]?.imagePath ? (
                        <img src={getImgUrl(o.items[0].imagePath)} className="max-w-full max-h-full object-contain" alt="" />
                      ) : (
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-[#10B981] font-mono">{ref}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${sBadge}`}>
                          {sIcon} {sLabel}
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-gray-800 truncate leading-tight mb-0.5">{productName}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{date}</p>
                    </div>

                    {/* Amount & Arrow */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <p className="text-[15px] font-black text-gray-900">Rs. {amount}</p>
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors shadow-sm">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-[#10B981] transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Links */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[15px] font-black text-gray-900">Quick Access</h3>
          </div>
          <div className="divide-y divide-gray-100 p-2">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50/70 rounded-xl transition-colors group m-1"
              >
                {/* Colored icon box */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm"
                  style={{ background: link.bg, color: link.color }}
                >
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-gray-900 group-hover:text-[#10B981] transition-colors">{link.label}</p>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">{link.sub}</p>
                </div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-gray-100 transition-all">
                  <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerHome;
