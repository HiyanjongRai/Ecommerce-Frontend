import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSellerNotifications, markSellerNotifRead } from '../services/sellerService';
import { LoadingState, SectionHeader } from './SellerSectionUtils';

const NotifIcon = ({ type }) => {
  const cls = "w-5 h-5 flex-shrink-0";
  switch (type) {
    case 'ORDER':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>;
    case 'DELIVERY':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>;
    case 'PAYMENT':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>;
    case 'PROMO':
    case 'CAMPAIGN_ALERT':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>;
    case 'SELLER_ALERT':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>;
    case 'MESSAGE_RECEIVED':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;
    default:
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>;
  }
};

const getIconColor = (type) => {
  switch (type) {
    case 'ORDER': return 'text-emerald-600 bg-emerald-50';
    case 'DELIVERY': return 'text-blue-600 bg-blue-50';
    case 'PAYMENT': return 'text-purple-600 bg-purple-50';
    case 'PROMO':
    case 'CAMPAIGN_ALERT': return 'text-orange-600 bg-orange-50';
    case 'SELLER_ALERT': return 'text-amber-600 bg-amber-50';
    case 'MESSAGE_RECEIVED': return 'text-teal-600 bg-teal-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getTarget = (notif) => {
  const type = notif?.type;
  const text = `${notif?.title || ''} ${notif?.message || ''}`.toLowerCase();
  if (type === 'MESSAGE_RECEIVED') return '/seller/inbox';
  if (text.includes('inventory') || text.includes('stock') || text.includes('restock')) return '/seller/inventory';
  if (text.includes('refund')) return '/seller/orders';
  if (text.includes('dispute')) return '/seller/disputes';
  if (type === 'CAMPAIGN_ALERT' || text.includes('campaign')) return '/seller/campaigns';
  if (text.includes('promo')) return '/seller/promos';
  if (type === 'ORDER_UPDATE' || type === 'SELLER_ALERT' || text.includes('order')) return '/seller/orders';
  return '/seller/dashboard';
};

// ─── Kebab Menu ───────────────────────────────────────────────────────────────
const NotifMenu = ({ notif, onMarkRead, onDismiss, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0 self-start mt-0.5">
      {/* Trigger */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-sm text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        title="More options"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-sm shadow-lg min-w-[160px] py-1 overflow-hidden">

          {/* Go to related page */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
            </svg>
            Go to page
          </button>

          {/* Mark as read — only show if unread */}
          {!notif.isRead && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onMarkRead(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Mark as read
            </button>
          )}

          <div className="border-t border-gray-100 my-1"/>

          {/* Dismiss (remove from list) */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDismiss(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SellerNotifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSellerNotifications();
      setNotifs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 401 || status === 403) {
        setError('Your account does not have access to notifications, or your session has expired. Please log in again.');
      } else {
        setError('Could not load notifications. Please try again later.');
      }
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (notifId) => {
    try {
      await markSellerNotifRead(notifId);
      setNotifs(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) await handleRead(notif.id);
    navigate(getTarget(notif));
  };

  const handleDismiss = (notifId) => {
    setNotifs(prev => prev.filter(n => n.id !== notifId));
  };

  const markAll = async () => {
    const unread = notifs.filter(n => !n.isRead);
    await Promise.allSettled(unread.map(n => markSellerNotifRead(n.id)));
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifs.filter(n => !n.isRead).length;
  const [visibleCount, setVisibleCount] = useState(6);
  const visibleNotifs = notifs.slice(0, visibleCount);
  const hiddenCount = notifs.length - visibleCount;

  if (loading) return <LoadingState label="Loading notifications…" />;

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Notifications"
          subtitle="Order alerts, inventory warnings, and store updates."
        />
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="flex-shrink-0 text-[9px] font-black uppercase tracking-wider text-gray-600 border border-gray-200 px-3 py-1.5 rounded-sm hover:bg-gray-50 transition-colors"
          >
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs font-bold text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {!error && notifs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm p-10 text-center shadow-sm">
          <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
          </div>
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-1">No notifications yet</h3>
          <p className="text-[10px] text-gray-400 font-medium">Order alerts, inventory warnings, and campaign updates will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {visibleNotifs.map(n => (
              <div
                key={n.id}
                className={`flex gap-3 items-start p-3.5 transition-colors hover:bg-gray-50/60 ${!n.isRead ? 'bg-emerald-50/20' : 'bg-white'}`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconColor(n.type)}`}>
                  <NotifIcon type={n.type} />
                </div>

                {/* Content — clickable */}
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className={`text-xs mb-1 leading-snug ${!n.isRead ? 'font-black text-gray-900' : 'font-semibold text-gray-600'}`}>
                    {n.title || n.message}
                  </p>
                  {n.title && n.message && (
                    <p className="text-xs text-gray-400 font-medium leading-relaxed">{n.message}</p>
                  )}
                  <span className="block mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('en-GB') : ''}
                  </span>
                </button>

                {/* Unread dot */}
                {!n.isRead && (
                  <div className="w-2 h-2 bg-emerald-600 rounded-full flex-shrink-0 mt-2.5 animate-pulse" />
                )}

                {/* Kebab menu */}
                <NotifMenu
                  notif={n}
                  onMarkRead={() => handleRead(n.id)}
                  onDismiss={() => handleDismiss(n.id)}
                  onNavigate={() => navigate(getTarget(n))}
                />
              </div>
            ))}
          </div>

          {/* See more / Show less footer */}
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setVisibleCount(v => v + 6)}
              className="w-full flex items-center justify-center gap-2 py-3 border-t border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
              See {hiddenCount} more notification{hiddenCount !== 1 ? 's' : ''}
            </button>
          ) : notifs.length > 6 ? (
            <button
              type="button"
              onClick={() => setVisibleCount(6)}
              className="w-full flex items-center justify-center gap-2 py-3 border-t border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
              </svg>
              Show less
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SellerNotifications;
