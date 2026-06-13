import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { getUserOrdersSimple, getLoyaltyPoints } from '../../../shared/api/customerApi';

/* ── Icon Components ─────────────────────────────────────────── */
const IconOrders = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const IconRefunds = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const IconAddresses = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconAccount = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconWishlist = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconLogout = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-red-400 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconCart = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconLoyalty = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconNotifications = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconMessages = () => (
  <svg className="w-7 h-7 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

/* ── Quick Cards Data ─────────────────────────────────────────── */
const CARDS = [
  { to: '/customer/orders',        label: 'ORDERS',        icon: <IconOrders /> },
  { to: '/customer/refunds',       label: 'REFUNDS',       icon: <IconRefunds /> },
  { to: '/customer/addresses',     label: 'ADDRESSES',     icon: <IconAddresses /> },
  { to: '/customer/profile',       label: 'ACCOUNT DETAILS', icon: <IconAccount /> },
  { to: '/customer/wishlist',      label: 'WISHLIST',      icon: <IconWishlist /> },
  { to: '/customer/cart',          label: 'CART',          icon: <IconCart /> },
  { to: '/customer/loyalty',       label: 'LOYALTY',       icon: <IconLoyalty /> },
  { to: '/customer/notifications', label: 'NOTIFICATIONS', icon: <IconNotifications /> },
  { to: '/customer/messages',      label: 'MESSAGES',      icon: <IconMessages /> },
];

const STATUS_CLASS = {
  PENDING:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  SHIPPED:    'bg-purple-100 text-purple-700 border-purple-200',
  DELIVERED:  'bg-green-100 text-green-700 border-green-200',
  CANCELLED:  'bg-red-100 text-red-700 border-red-200',
  PAID:       'bg-green-100 text-green-700 border-green-200',
};

/* ── Component ───────────────────────────────────────────────── */
const CustomerHome = () => {
  const { user, logoutUser } = useCustomer();
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const userId = user?.id;

  useEffect(() => {
    const fetch = async () => {
      if (!userId) { setLoadingOrders(false); setOrders([]); setLoyalty(null); return; }
      const [ordRes, loyRes] = await Promise.allSettled([
        getUserOrdersSimple(),
        getLoyaltyPoints(),
      ]);
      if (ordRes.status === 'fulfilled') {
        const data = ordRes.value.data;
        setOrders(Array.isArray(data) ? data : []);
      }
      if (loyRes.status === 'fulfilled') setLoyalty(loyRes.value.data);
      setLoadingOrders(false);
    };
    fetch();
  }, [userId]);

  const displayName = user?.fullName || user?.username || 'Customer';

  // ── Metrics Calculations ──
  const totalOrders = orders.length;
  const totalSpending = orders.reduce((acc, o) => acc + (o.grandTotal || o.totalAmount || 0), 0);
  const avgOrderVal = totalOrders > 0 ? Math.round(totalSpending / totalOrders) : 0;
  const pendingCount = orders.filter(o => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  // Monthly Spending Trend calculations
  const monthlyStats = {};
  orders.forEach(o => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    monthlyStats[key] = (monthlyStats[key] || 0) + (o.grandTotal || o.totalAmount || 0);
  });

  let trendData = Object.entries(monthlyStats).map(([month, val]) => ({ month, val }));
  if (trendData.length === 0) {
    // Elegant baseline demo targets
    trendData = [
      { month: 'Mar 26', val: 0 },
      { month: 'Apr 26', val: 0 },
      { month: 'May 26', val: 0 },
    ];
  } else {
    // Sort trendData chronologically by converting key back to dates for comparison
    trendData.sort((a, b) => {
      const parseDate = (str) => {
        const [m, y] = str.split(' ');
        return new Date(Date.parse(`${m} 1, 20${y}`));
      };
      return parseDate(a.month) - parseDate(b.month);
    });
  }

  const maxSpendVal = Math.max(...trendData.map(t => t.val), 1000);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Greeting */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-1">
          Welcome back, {displayName}! 👋
        </h2>
        <p className="text-xs md:text-sm text-gray-500 font-semibold uppercase tracking-wider">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Bento-Style Analytics Deck ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spending */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
              💸 Total Spending
            </span>
            <span className="text-xl font-black text-gray-900 leading-none">
              Rs. {totalSpending.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span>Avg. Order:</span>
            <span className="font-bold text-gray-800">Rs. {avgOrderVal.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
              📦 Total Purchases
            </span>
            <span className="text-xl font-black text-gray-900 leading-none">
              {totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> {pendingCount} Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {deliveredCount} Delivered
            </span>
          </div>
        </div>

        {/* Loyalty Tier */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
              💎 Loyalty Points Balance
            </span>
            <span className="text-xl font-black text-gray-900 leading-none">
              {(loyalty?.points ?? 0).toLocaleString()} <span className="text-[10px] font-semibold text-gray-400 ml-0.5">pts</span>
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span>Member Status:</span>
            <span className="font-black text-emerald-600 uppercase tracking-wide">
              {loyalty?.points >= 10000 ? '👑 Diamond' : loyalty?.points >= 4000 ? '💎 Platinum' : loyalty?.points >= 1500 ? '🥇 Gold' : loyalty?.points >= 500 ? '🥈 Silver' : '🥉 Bronze'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Visual Spend Sheet & Monthly Trend Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spend Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-800 pb-2 border-b border-gray-200 mb-3">
              📊 Spending Analytics Sheet
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold mb-4">
              Track your aggregate product purchase spending trends month by month.
            </p>
          </div>

          <div className="flex gap-4 items-end justify-between h-32 pt-4 px-2 border-b border-gray-100">
            {trendData.map(item => {
              const pct = Math.max(Math.round((item.val / maxSpendVal) * 100), 4);
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 whitespace-nowrap pointer-events-none">
                    Rs. {item.val.toLocaleString()}
                  </div>
                  {/* Bar */}
                  <div className="w-full max-w-[48px] bg-gray-50 rounded-t-sm flex items-end h-24 overflow-hidden border border-gray-100/50">
                    <div
                      className="bg-emerald-600 hover:bg-emerald-700 w-full transition-all duration-300 rounded-t-sm"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  {/* X Axis Label */}
                  <span className="text-[9px] font-black tracking-wide text-gray-400 mt-2 uppercase">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spend Insights & Smart Metrics */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-800 pb-2 border-b border-gray-200 mb-3">
              💡 Spend Insights
            </h3>
            <ul className="space-y-3 text-[11px] font-semibold text-gray-600">
              <li className="flex justify-between items-center py-1 border-b border-gray-50">
                <span>Account Activity State</span>
                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-sm border border-green-100 text-[9px] font-black uppercase tracking-wide">Active</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-gray-50">
                <span>Average Basket Value</span>
                <span className="text-gray-900 font-bold">Rs. {avgOrderVal.toLocaleString()}</span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-gray-50">
                <span>Order Fulfillment Rate</span>
                <span className="text-gray-900 font-bold">
                  {totalOrders > 0 ? `${Math.round((deliveredCount / totalOrders) * 100)}%` : '100%'}
                </span>
              </li>
              <li className="flex justify-between items-center py-1">
                <span>Next Rewards Target</span>
                <span className="text-emerald-600 font-bold">
                  {loyalty?.points >= 1500 ? '4,000 pts' : '1,500 pts'}
                </span>
              </li>
            </ul>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <Link
              to="/"
              className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-wider py-2 border border-gray-200 rounded-sm transition-colors duration-150"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* ── Porto Quick Menu Grid ── */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-800 mb-3 pb-2 border-b border-gray-200">
          ⚙️ Account Quick Portal
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border border-gray-200 rounded-sm overflow-hidden shadow-sm">
          {CARDS.map((card, idx) => (
            <Link
              key={card.to}
              to={card.to}
              className={`
                group flex flex-col items-center justify-center py-5 px-3 gap-2
                bg-white hover:bg-gray-50 transition-all duration-200
                border-gray-200 border-r border-b
              `}
            >
              {card.icon}
              <span className="text-[8px] font-black tracking-[1px] text-gray-500 group-hover:text-emerald-600 transition-colors duration-200 uppercase">
                {card.label}
              </span>
            </Link>
          ))}

          {/* Logout tile */}
          <button
            onClick={logoutUser}
            className="group flex flex-col items-center justify-center py-5 px-3 gap-2 bg-white hover:bg-gray-50 transition-all duration-200 border-b border-r"
          >
            <IconLogout />
            <span className="text-[8px] font-black tracking-[1px] text-gray-500 group-hover:text-red-500 transition-colors duration-200 uppercase">
              LOGOUT
            </span>
          </button>
        </div>
      </div>

      {/* ── Recent Orders Table ── */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-3">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-gray-800">Recent Purchase History</h2>
          <Link to="/customer/orders" className="text-[10px] text-emerald-600 hover:underline font-bold uppercase tracking-wider">
            View All →
          </Link>
        </div>

        {loadingOrders ? (
          <div className="flex items-center gap-2 py-3 text-gray-400 text-xs">
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-1">📭</div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">No orders yet</p>
            <p className="text-[10px] text-gray-400">Start shopping to see your orders here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-2 pr-3">Order</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 pr-3 font-bold text-emerald-600">#{o.id}</td>
                    <td className="py-2.5 px-3 text-gray-500 font-semibold text-[10px]">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${STATUS_CLASS[o.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-gray-800">
                      Rs. {(o.grandTotal || o.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <button
                        onClick={() => navigate('/customer/orders')}
                        className="text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHome;
