import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, Package, Boxes, Tag, Megaphone,
  Ticket, ShoppingCart, RefreshCw, Scale, Inbox, Bell,
  Store, Settings, HelpCircle, LogOut, Sun, Moon, ChevronRight,
  TrendingUp,
} from 'lucide-react';

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
      { to: '/seller/products',           label: 'Add Products',    icon: Package         },
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
      { to: '/seller/refunds',            label: 'Refunds',         icon: RefreshCw       },
      { to: '/seller/disputes',           label: 'Disputes',        icon: Scale           },
      { to: '/seller/inbox',              label: 'Inbox',           icon: Inbox, badge: 4 },
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
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRadius: 18, overflow: 'hidden',
        background: bg, border: `1px solid ${border}`,
        boxShadow: dark ? '0 8px 32px rgba(0,0,0,.5)' : '0 1px 4px rgba(0,0,0,.07)',
        minHeight: 640, userSelect: 'none',
      }}
    >
      {/* ── Store header ───────────────────────────────────── */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {logoSrc ? (
              <img src={logoSrc} alt={profile.storeName}
                   style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: `1px solid ${border}` }} />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 15,
                boxShadow: '0 4px 12px rgba(16,185,129,.3)',
              }}>
                {profile?.storeName?.charAt(0)?.toUpperCase() || 'S'}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 12, height: 12, borderRadius: '50%',
              background: '#10b981', border: '2px solid #fff',
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: dark ? '#fff' : '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.storeName || 'My Store'}
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 20,
              background: dark ? 'rgba(16,185,129,.15)' : '#ecfdf5',
              color: dark ? '#34d399' : '#047857',
            }}>
              Active Panel
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {NAV.map((section) => (
          <div key={section.group} style={{ marginBottom: 14 }}>
            <p style={{ margin: '0 0 4px', padding: '0 20px', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: textMuted }}>
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
                    padding: '8px 12px', margin: '1px 8px', borderRadius: 10,
                    textDecoration: 'none', fontSize: 13,
                    fontWeight: active ? 700 : 500,
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
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 2, background: dark ? '#34d399' : '#059669' }} />
                  )}
                  {/* Icon + label — guaranteed gap via inline style */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={16} style={{ flexShrink: 0, color: active ? (dark ? '#34d399' : '#059669') : (dark ? 'rgba(255,255,255,.4)' : '#9ca3af') }} />
                    <span>{item.label}</span>
                  </div>
                  {/* Badge or chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {item.badge > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight size={12} style={{ color: dark ? '#34d399' : '#059669' }} />}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

        {/* Help */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 4px', padding: '0 20px', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: textMuted }}>
            Help
          </p>
          <button
            onClick={() => window.alert('Jhapcham Help Center — How can we assist you?')}
            style={{
              width: 'calc(100% - 16px)', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', margin: '1px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 13, fontWeight: 500, color: textNormal,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,.05)' : '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <HelpCircle size={16} style={{ flexShrink: 0, color: dark ? 'rgba(255,255,255,.4)' : '#9ca3af' }} />
            <span>Help Center</span>
          </button>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ padding: '12px', borderTop: `1px solid ${border}` }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', fontSize: 13, fontWeight: 600,
            color: dark ? '#f87171' : '#ef4444', transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(239,68,68,.1)' : '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          <span>Sign Out</span>
        </button>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, background: dark ? 'rgba(255,255,255,.05)' : '#f3f4f6', borderRadius: 10, padding: 4 }}>
          {[
            { label: 'Light', Icon: Sun,  on: !dark, click: () => dark && toggleDarkMode()  },
            { label: 'Dark',  Icon: Moon, on: dark,  click: () => !dark && toggleDarkMode() },
          ].map(({ label, Icon: I, on, click }) => (
            <button key={label} onClick={click} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              background: on ? (dark ? 'rgba(16,185,129,.2)' : '#fff') : 'transparent',
              color: on ? (dark ? '#34d399' : '#059669') : (dark ? 'rgba(255,255,255,.35)' : '#9ca3af'),
              boxShadow: on ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              transition: 'all 0.15s ease',
            }}>
              <I size={12} /><span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
