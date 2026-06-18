import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications, markNotifRead } from '../../../shared/api/customerApi';
import { useCustomer } from '../contexts/CustomerContext';

const NOTIF_ICONS = {
  ORDER:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  DELIVERY: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
  PAYMENT:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>,
  PROMO:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>,
  SYSTEM:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>,
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

  const toggleExpand = (label) => setExpanded(prev => ({ ...prev, [label]: !prev[label] }));

  const unreadCount = notifs.filter(n => !n.isRead).length;
  const grouped = groupByDate(notifs);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
      <svg className="animate-spin w-6 h-6 text-[#10B981] mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading notifications...</p>
    </div>
  );

  return (
    <div className="pb-10 max-w-4xl animate-in fade-in duration-300 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[22px] font-black text-gray-900 tracking-tight leading-tight mb-1">
            Notifications
          </h2>
          <p className="text-xs text-gray-500 font-semibold">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'You are all caught up!'}
          </p>
        </div>
        <button
          className="h-10 px-5 bg-white hover:bg-emerald-50 hover:border-[#10B981] hover:text-[#10B981] text-gray-600 text-xs font-black uppercase tracking-wider border border-gray-200 rounded-xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-600 cursor-pointer shrink-0"
          onClick={markAll}
          disabled={unreadCount === 0}
        >
          Mark All Read
        </button>
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
            </svg>
          </div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">No notifications yet</h3>
          <p className="text-xs text-gray-500 font-semibold mb-6 max-w-sm mx-auto">We'll alert you here when there are updates about your orders or account.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            Explore Storefront
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, items }) => {
            const isExpanded = expanded[label];
            const visible = isExpanded ? items : items.slice(0, PAGE_SIZE);
            const remaining = items.length - PAGE_SIZE;
            return (
              <div key={label}>
                {/* Date group label */}
                <div className="flex items-center gap-3 mb-3 pl-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">{items.length}</span>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] divide-y divide-gray-100">
                  {visible.map(n => (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNotificationClick(n)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(n); }}}
                      className={[
                        'px-5 py-4 flex gap-4 items-start transition-all duration-200 cursor-pointer focus:outline-none relative',
                        !n.isRead
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                          : 'bg-white hover:bg-gray-50/70',
                      ].join(' ')}
                    >
                      {/* Active green left indicator */}
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981]" />
                      )}

                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${!n.isRead ? 'bg-[#e6f7ec] text-[#10B981]' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                        {NOTIF_ICONS[n.type] || NOTIF_ICONS.SYSTEM}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className={`text-[13px] mb-1 pr-4 leading-tight ${!n.isRead ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                            {n.title || n.message}
                          </h4>
                          <span className={`flex-shrink-0 text-[10px] font-semibold ${!n.isRead ? 'text-[#10B981]' : 'text-gray-400'}`}>
                            {n.createdAt ? new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        {n.title && n.message && (
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-2xl">
                            {n.message}
                          </p>
                        )}
                      </div>

                      {!n.isRead && (
                        <div className="w-2 h-2 bg-[#10B981] rounded-full flex-shrink-0 mt-1.5 ml-2 shadow-sm" />
                      )}
                    </div>
                  ))}

                  {/* See more / See less */}
                  {items.length > PAGE_SIZE && (
                    <button
                      onClick={() => toggleExpand(label)}
                      className="w-full px-5 py-4 text-xs font-black uppercase tracking-widest text-[#10B981] hover:bg-emerald-50/40 transition-colors text-center border-t border-gray-100"
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
