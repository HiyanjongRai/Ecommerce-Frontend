import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications, markNotifRead } from '../../../shared/api/customerApi';
import { useCustomer } from '../contexts/CustomerContext';
import { CheckCircle2, Truck, Package, Tag, Heart, User, Percent, Bell, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const ICON_STYLES = {
  ORDER:    { icon: Truck,   bg: 'bg-green-50',  fg: 'text-[#16A34A]' },
  DELIVERY: { icon: Package, bg: 'bg-blue-50',   fg: 'text-blue-500' },
  PROMO:    { icon: Tag,     bg: 'bg-amber-50',  fg: 'text-amber-500' },
  WISHLIST: { icon: Heart,   bg: 'bg-purple-50', fg: 'text-purple-500' },
  ACCOUNT:  { icon: User,    bg: 'bg-gray-100',  fg: 'text-gray-500' },
  OFFER:    { icon: Percent, bg: 'bg-red-50',    fg: 'text-red-500' },
  SYSTEM:   { icon: Bell,    bg: 'bg-gray-100',  fg: 'text-gray-500' },
};

const getIconStyle = (type) => ICON_STYLES[type] || ICON_STYLES.SYSTEM;

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'ORDERS', label: 'Orders', types: ['ORDER', 'DELIVERY', 'ORDER_UPDATE'] },
  { id: 'OFFERS', label: 'Offers', types: ['PROMO', 'OFFER'] },
  { id: 'ACCOUNT', label: 'Account', types: ['ACCOUNT', 'WISHLIST'] },
  { id: 'UPDATES', label: 'Updates', types: ['SYSTEM'] },
];

const PAGE_SIZE = 6;

const CustomerNotifications = () => {
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const { user, refreshNotifs } = useCustomer();
  const navigate = useNavigate();
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); setNotifs([]); return; }
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifs(Array.isArray(res.data) ? res.data : []);
    } catch { setNotifs([]); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (notifId) => {
    try {
      await markNotifRead(notifId);
      setNotifs(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      refreshNotifs();
    } catch { /* ignore */ }
  };

  const getNotificationTarget = (notif) => {
    const type = notif?.type;
    const text = `${notif?.title || ''} ${notif?.message || ''}`.toLowerCase();
    if (type === 'MESSAGE_RECEIVED') return '/customer/messages';
    if (type === 'LOYALTY_UPDATE') return '/customer/loyalty';
    if (text.includes('refund')) return '/customer/orders';
    if (text.includes('dispute')) return '/customer/disputes';
    if (type === 'ORDER_UPDATE' || text.includes('order') || text.includes('delivery')) return '/customer/orders';
    return '/customer';
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) await handleRead(notif.id);
    navigate(getNotificationTarget(notif), {
      state: { notificationId: notif.id, relatedEntityId: notif.relatedEntityId },
    });
  };

  const markAll = async () => {
    const unread = notifs.filter(n => !n.isRead);
    await Promise.allSettled(unread.map(n => markNotifRead(n.id)));
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    refreshNotifs();
  };

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const tabCounts = useMemo(() => {
    const counts = { ALL: notifs.length };
    CATEGORY_TABS.slice(1).forEach(tab => {
      counts[tab.id] = notifs.filter(n => tab.types.includes(n.type)).length;
    });
    return counts;
  }, [notifs]);

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return notifs;
    const tab = CATEGORY_TABS.find(t => t.id === activeTab);
    return notifs.filter(n => tab.types.includes(n.type));
  }, [notifs, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [activeTab]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
      <svg className="animate-spin w-6 h-6 text-[#16A34A] mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading notifications...</p>
    </div>
  );

  return (
    <div className="font-sans animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated with your orders, offers and important updates.</p>
        </div>
        <button
          onClick={markAll}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#16A34A] hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-xs text-gray-500 font-medium mb-6 max-w-sm mx-auto">We'll alert you here when there are updates about your orders or account.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-colors">
            Explore Storefront
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Filter tabs */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 overflow-x-auto">
            <div className="flex items-center gap-2">
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.id ? 'bg-[#16A34A] text-white' : 'text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label} ({tabCounts[tab.id] || 0})
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400 transition-colors flex-shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
            </button>
          </div>

          {/* Notification list */}
          <div className="divide-y divide-gray-100">
            {paginated.map(n => {
              const { icon: Icon, bg, fg } = getIconStyle(n.type);
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(n); } }}
                  className="px-5 py-4 flex gap-4 items-start cursor-pointer hover:bg-gray-50/70 transition-colors focus:outline-none"
                >
                  <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${bg} ${fg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">{n.title || n.message}</h4>
                    {n.title && n.message && (
                      <p className="text-sm text-slate-500">{n.message}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                      {n.createdAt && ' \u00b7 '}
                      {n.createdAt ? new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${!n.isRead ? 'bg-[#16A34A]' : 'bg-gray-300'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-5 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-slate-500 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                    page === i + 1 ? 'bg-[#16A34A] text-white' : 'border border-gray-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-slate-500 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerNotifications;