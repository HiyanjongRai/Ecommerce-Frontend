import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications, markNotifRead } from '../../../shared/api/customerApi';
import { useCustomer } from '../contexts/CustomerContext';

const NOTIF_ICONS = {
  ORDER:    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  DELIVERY: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
  PAYMENT:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>,
  PROMO:    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>,
  SYSTEM:   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>,
};

const PAGE_SIZE = 6;

const groupByDate = (notifs) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const groups = [
    { label: 'Today',     items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'Earlier',   items: [] },
  ];
  notifs.forEach((n) => {
    const d = n.createdAt ? new Date(n.createdAt) : new Date(0);
    if (d >= startOfToday)          groups[0].items.push(n);
    else if (d >= startOfYesterday) groups[1].items.push(n);
    else if (d >= startOfWeek)      groups[2].items.push(n);
    else                            groups[3].items.push(n);
  });
  return groups.filter((g) => g.items.length > 0);
};

const CustomerNotifications = () => {
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState({});
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
    if (type === 'MESSAGE_RECEIVED') return '/account/messages';
    if (type === 'LOYALTY_UPDATE') return '/account/loyalty';
    if (text.includes('refund')) return '/account/refunds';
    if (text.includes('dispute')) return '/account/disputes';
    if (type === 'ORDER_UPDATE' || text.includes('order') || text.includes('delivery')) return '/account/orders';
    return '/account';
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

  const toggleExpand = (label) => setExpanded(prev => ({ ...prev, [label]: !prev[label] }));

  const unreadCount = notifs.filter(n => !n.isRead).length;
  const grouped = groupByDate(notifs);

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
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-sm font-black text-gray-800">Notifications</h2>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <button
          className="h-8 px-3 bg-white hover:bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-wider border border-gray-200 rounded-sm transition-colors duration-150 disabled:opacity-40"
          onClick={markAll}
          disabled={unreadCount === 0}
        >
          Mark All Read
        </button>
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-sm">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-50 border border-gray-200 rounded-sm mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
          </div>
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2">No notifications</h3>
          <p className="text-xs text-gray-400 mb-4">We'll alert you here when something happens.</p>
          <Link
            to="/"
            className="inline-block bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors duration-150"
          >
            Explore Storefront
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ label, items }) => {
            const isExpanded = expanded[label];
            const visible = isExpanded ? items : items.slice(0, PAGE_SIZE);
            const remaining = items.length - PAGE_SIZE;
            return (
              <div key={label}>
                {/* Date group label */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-semibold text-gray-400">{items.length}</span>
                </div>

                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden divide-y divide-gray-100 shadow-sm">
                  {visible.map(n => (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNotificationClick(n)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(n); }}}
                      className={[
                        'px-4 py-3 flex gap-3 items-start transition-all duration-150 cursor-pointer focus:outline-none',
                        !n.isRead
                          ? 'bg-emerald-50/40 border-l-2 border-l-[#10B981] hover:bg-emerald-50/60'
                          : 'bg-white border-l-2 border-l-transparent hover:bg-gray-50/70',
                      ].join(' ')}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center ${!n.isRead ? 'bg-emerald-100 text-[#10B981]' : 'bg-gray-100 text-gray-400'}`}>
                        {NOTIF_ICONS[n.type] || NOTIF_ICONS.SYSTEM}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs mb-0.5 line-clamp-1 ${!n.isRead ? 'font-black text-gray-900' : 'font-semibold text-gray-600'}`}>
                          {n.title || n.message}
                        </h4>
                        {n.title && n.message && (
                          <p className="text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-1">
                            {n.message}
                          </p>
                        )}
                        <span className="block mt-1 text-[10px] text-gray-400 font-semibold">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString('en-GB') : ''}
                        </span>
                      </div>

                      {!n.isRead && (
                        <div className="w-2 h-2 bg-[#10B981] rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}

                  {/* See more / See less */}
                  {items.length > PAGE_SIZE && (
                    <button
                      onClick={() => toggleExpand(label)}
                      className="w-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#10B981] hover:bg-emerald-50/40 transition-colors text-center"
                    >
                      {isExpanded
                        ? 'Show less ↑'
                        : `See ${remaining} more notification${remaining !== 1 ? 's' : ''} ↓`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerNotifications;
