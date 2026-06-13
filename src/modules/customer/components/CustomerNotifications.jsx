import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications, markNotifRead } from '../../../shared/api/customerApi';
import { useCustomer } from '../contexts/CustomerContext';

const NOTIF_ICON = {
  ORDER:    '📦',
  DELIVERY: '🚚',
  PAYMENT:  '💳',
  SYSTEM:   '🔔',
  PROMO:    '🎉',
};

const CustomerNotifications = () => {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
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
    const role = user?.role;
    const type = notif?.type;
    const text = `${notif?.title || ''} ${notif?.message || ''}`.toLowerCase();

    if (role === 'SELLER') {
      if (type === 'MESSAGE_RECEIVED') return '/seller/inbox';
      if (text.includes('inventory') || text.includes('stock') || text.includes('restock')) return '/seller/inventory';
      if (text.includes('refund')) return '/seller/refunds';
      if (text.includes('dispute')) return '/seller/disputes';
      if (type === 'CAMPAIGN_ALERT' || text.includes('campaign')) return '/seller/campaigns';
      if (text.includes('promo')) return '/seller/promos';
      if (type === 'ORDER_UPDATE' || type === 'SELLER_ALERT' || text.includes('order')) return '/seller/orders';
      return '/seller/dashboard';
    }

    if (role === 'ADMIN') {
      if (type === 'REPORT_ALERT' || text.includes('report')) return '/admin/reports';
      if (text.includes('refund')) return '/admin/refunds';
      if (text.includes('dispute')) return '/admin/disputes';
      if (text.includes('seller')) return '/admin/sellers';
      if (type === 'ORDER_UPDATE' || text.includes('order')) return '/admin/orders';
      return '/admin/dashboard';
    }

    if (type === 'MESSAGE_RECEIVED') return '/customer/messages';
    if (type === 'LOYALTY_UPDATE') return '/customer/loyalty';
    if (text.includes('refund')) return '/customer/refunds';
    if (text.includes('dispute')) return '/customer/disputes';
    if (type === 'ORDER_UPDATE' || text.includes('order') || text.includes('delivery')) return '/customer/orders';
    return '/customer/dashboard';
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleRead(notif.id);
    }
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

  if (loading) return (
    <div className="flex items-center gap-2 py-8 text-gray-400 text-sm">
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Loading notifications…
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-800">
          Notifications Desk
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </span>
          {unreadCount > 0 && (
            <button
              className="bg-white hover:bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-wider px-4 py-2 border border-gray-200 rounded-sm transition-colors duration-150"
              onClick={markAll}
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-sm">
          <div className="text-5xl mb-4 select-none">🔔</div>
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2">No notifications</h3>
          <p className="text-xs text-gray-400 mb-4">We'll alert you here when something happens.</p>
          <Link
            to="/"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors duration-150"
          >
            Explore Storefront
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden divide-y divide-gray-100 shadow-sm">
          {notifs.map(n => (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationClick(n)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNotificationClick(n);
                }
              }}
              className={`
                p-5 flex gap-4 items-start transition-all duration-150
                ${!n.isRead ? 'bg-emerald-50/20' : 'bg-white'}
                cursor-pointer hover:bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset
              `}
            >
              <div className="text-3xl flex-shrink-0 mt-0.5 select-none">
                {NOTIF_ICON[n.type] || '🔔'}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`text-xs mb-1 line-clamp-2 ${!n.isRead ? 'font-black text-gray-900' : 'font-semibold text-gray-600'}`}>
                  {n.title || n.message}
                </h4>
                {n.title && n.message && (
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">
                    {n.message}
                  </p>
                )}
                <span className="block mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString('en-GB') : ''}
                </span>
              </div>

              {!n.isRead && (
                <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full flex-shrink-0 mt-2 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerNotifications;
