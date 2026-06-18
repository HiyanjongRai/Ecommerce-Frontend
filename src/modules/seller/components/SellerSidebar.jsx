import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUnreadMessageCount } from '../services/sellerService';
import {
  LayoutDashboard, DollarSign, Package, Boxes, Tag, Megaphone,
  Ticket, ShoppingCart, RefreshCw, Scale, Inbox, Bell,
  Store, Settings, HelpCircle, LogOut, Sun, Moon, ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from '../../../shared/contexts/ToastContext';

const NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/seller/dashboard',          label: 'Dashboard',       icon: LayoutDashboard },
      { to: '/seller/commission',         label: 'Earnings',        icon: DollarSign      },
    ],
  },
  {
    group: 'Products',
    items: [
      { to: '/seller/products',           label: 'Products',        icon: Package         },
      { to: '/seller/inventory',          label: 'Inventory',       icon: Boxes           },
      { to: '/seller/discount-sales',     label: 'Discounts & Sales', icon: Tag           },
      { to: '/seller/sale-discount-list', label: 'Sale List',       icon: TrendingUp      },
      { to: '/seller/campaigns',          label: 'Campaigns',       icon: Megaphone       },
      { to: '/seller/promos',             label: 'Promo Codes',     icon: Ticket          },
    ],
  },
  {
    group: 'Orders',
    items: [
      { to: '/seller/orders',             label: 'Orders',          icon: ShoppingCart    },
      { to: '/seller/disputes',           label: 'Disputes',        icon: Scale           },
      { to: '/seller/inbox',              label: 'Inbox',           icon: Inbox, badgeKey: 'inbox' },
    ],
  },
  {
    group: 'Store',
    items: [
      { to: '/seller/notifications',      label: 'Notifications',   icon: Bell            },
      { to: '/seller/profile',            label: 'Store Profile',   icon: Store           },
      { to: '/seller/settings',           label: 'Settings',        icon: Settings        },
    ],
  },
];

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function SellerSidebar({ currentPath, darkMode, toggleDarkMode, profile, onLogout }) {
  const dark = darkMode;
  const [badges, setBadges] = useState({ inbox: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await getUnreadMessageCount();
        const count = typeof res.data === 'number' ? res.data : (res.data?.count ?? 0);
        setBadges(prev => ({ ...prev, inbox: count }));
      } catch { /* silent */ }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (to) => currentPath.startsWith(to);

  /* ── style tokens ────────────────────────────────────────── */
  const bg         = dark ? '#0b0c10'               : '#ffffff';
  const border     = dark ? 'rgba(255,255,255,.10)' : '#e5e7eb';
  const textMuted  = dark ? 'rgba(255,255,255,.30)' : '#9ca3af';
  const textNormal = dark ? 'rgba(255,255,255,.60)' : '#4b5563';
  const textHover  = dark ? '#ffffff'               : '#111827';
  const activeBg   = dark ? 'rgba(16,185,129,.14)'  : '#f0fdf4';
  const activeText = dark ? '#34d399'               : '#047857';

  const logoSrc = profile?.logoImagePath
    ? (profile.logoImagePath.startsWith('http') ? profile.logoImagePath : `${BASE_URL}/${profile.logoImagePath.replace(/^\//, '')}`)
    : null;

  return (
    <nav
      style={{
        width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRadius: 4, overflow: 'hidden',
        background: bg, border: `1px solid ${border}`,
        boxShadow: dark ? '0 4px 24px rgba(0,0,0,.4)' : '0 1px 3px rgba(0,0,0,.06)',
        minHeight: 640, userSelect: 'none',
      }}
    >
      {/* ── Store header ─────────────────────────────────────── */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {logoSrc ? (
              <img src={logoSrc} alt={profile.storeName}
                   style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', border: `1px solid ${border}` }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: 4,
                background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 13,
                boxShadow: '0 2px 8px rgba(16,185,129,.3)',
              }}>
                {profile?.storeName?.charAt(0)?.toUpperCase() || 'S'}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 9, height: 9, borderRadius: '50%',
              background: '#10b981', border: '2px solid #fff',
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 11, color: dark ? '#fff' : '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.storeName || 'My Store'}
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '1px 6px', borderRadius: 3,
              background: dark ? 'rgba(16,185,129,.15)' : '#ecfdf5',
              color: dark ? '#34d399' : '#047857',
            }}>
              Active Panel
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map((section) => (
          <div key={section.group} style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 2px', padding: '0 14px', fontSize: 9, fontWeight: 900, letterSpacing: '0.13em', textTransform: 'uppercase', color: textMuted }}>
              {section.group}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 10px', margin: '1px 6px', borderRadius: 3,
                    textDecoration: 'none', fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    color: active ? activeText : textNormal,
                    background: active ? activeBg : 'transparent',
                    transition: 'background 0.15s ease, color 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = dark ? 'rgba(255,255,255,.05)' : '#f9fafb';
                      e.currentTarget.style.color = textHover;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = textNormal;
                    }
                  }}
                >
                  {active && (
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 14, borderRadius: 2, background: dark ? '#34d399' : '#059669' }} />
                  )}
                  {/* Icon + label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon size={13} style={{ flexShrink: 0, color: active ? (dark ? '#34d399' : '#059669') : (dark ? 'rgba(255,255,255,.4)' : '#9ca3af') }} />
                    <span>{item.label}</span>
                  </div>
                  {/* Badge or chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {item.badgeKey && badges[item.badgeKey] > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {badges[item.badgeKey]}
                      </span>
                    )}
                    {!item.badgeKey && item.badge > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight size={10} style={{ color: dark ? '#34d399' : '#059669' }} />}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

        {/* Help */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: '0 0 2px', padding: '0 14px', fontSize: 9, fontWeight: 900, letterSpacing: '0.13em', textTransform: 'uppercase', color: textMuted }}>
            Help
          </p>
          <button
            onClick={() => toast('💡 Jhapcham Help Center — How can we assist you? Email: support@jhapcham.com', 'info')}
            style={{
              width: 'calc(100% - 12px)', display: 'flex', alignItems: 'center', gap: 7,
              padding: '4px 10px', margin: '1px 6px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 11, fontWeight: 600, color: textNormal,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,.05)' : '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <HelpCircle size={12} style={{ flexShrink: 0, color: dark ? 'rgba(255,255,255,.4)' : '#9ca3af' }} />
            <span>Help Center</span>
          </button>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div style={{ padding: '8px', borderTop: `1px solid ${border}` }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
            background: 'transparent', fontSize: 11, fontWeight: 700,
            color: dark ? '#f87171' : '#ef4444', transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(239,68,68,.1)' : '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={12} style={{ flexShrink: 0 }} />
          <span>Sign Out</span>
        </button>
        <div style={{ display: 'flex', gap: 3, marginTop: 6, background: dark ? 'rgba(255,255,255,.05)' : '#f3f4f6', borderRadius: 4, padding: 3 }}>
          {[
            { label: 'Light', Icon: Sun,  on: !dark, click: () => dark && toggleDarkMode()  },
            { label: 'Dark',  Icon: Moon, on: dark,  click: () => !dark && toggleDarkMode() },
          ].map(({ label, Icon: I, on, click }) => (
            <button key={label} onClick={click} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '4px 0', borderRadius: 3, border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 700,
              background: on ? (dark ? 'rgba(16,185,129,.2)' : '#fff') : 'transparent',
              color: on ? (dark ? '#34d399' : '#059669') : (dark ? 'rgba(255,255,255,.35)' : '#9ca3af'),
              boxShadow: on ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
              transition: 'all 0.15s ease',
            }}>
              <I size={10} /><span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
