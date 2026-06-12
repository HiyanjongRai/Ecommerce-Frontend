import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import {
  LayoutDashboard, ShoppingBag, Package, CreditCard,
  Scale, Heart, Bell, MessageCircle, User, MapPin,
  Zap, Star, LogOut, Sun, Moon, ChevronRight,
} from 'lucide-react';

const NAV = [
  {
    group: 'Shopping',
    items: [
      { to: '/customer/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
      { to: '/',                       label: 'Browse Shop',    icon: ShoppingBag     },
      { to: '/customer/orders',        label: 'My Orders',      icon: Package         },
      { to: '/customer/wishlist',      label: 'Wishlist',       icon: Heart           },
    ],
  },
  {
    group: 'Support',
    items: [
      { to: '/customer/refunds',       label: 'My Refunds',     icon: CreditCard      },
      { to: '/customer/disputes',      label: 'My Disputes',    icon: Scale           },
      { to: '/customer/messages',      label: 'Messages',       icon: MessageCircle,  badge: 'messages' },
      { to: '/customer/notifications', label: 'Notifications',  icon: Bell,           badge: 'notifs'   },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/customer/profile',       label: 'Profile',        icon: User            },
      { to: '/customer/addresses',     label: 'Addresses',      icon: MapPin          },
      { to: '/customer/loyalty',       label: 'Loyalty Points', icon: Zap             },
      { to: '/customer/reviews',       label: 'My Reviews',     icon: Star            },
    ],
  },
];

export default function CustomerSidebar({ currentPath, darkMode, toggleDarkMode }) {
  const { logoutUser, user, unreadNotifs } = useCustomer();
  const navigate = useNavigate();

  const handleLogout = () => { logoutUser(); navigate('/'); };

  const active = (to) => to !== '/' ? currentPath.startsWith(to) : currentPath === '/';
  const badge  = (key) => key === 'notifs' ? (unreadNotifs || 0) : 0;

  const dark = darkMode;

  /* ── style tokens ────────────────────────────────────────── */
  const bg         = dark ? '#0d1117'            : '#ffffff';
  const border     = dark ? 'rgba(255,255,255,.08)' : '#e5e7eb';
  const textMuted  = dark ? 'rgba(255,255,255,.35)' : '#9ca3af';
  const textNormal = dark ? 'rgba(255,255,255,.65)' : '#4b5563';
  const textHover  = dark ? '#ffffff'            : '#111827';
  const activeBg   = dark ? 'rgba(16,185,129,.14)' : '#f0fdf4';
  const activeText = dark ? '#34d399'            : '#047857';

  return (
    <nav
      style={{
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 18,
        overflow: 'hidden',
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: dark ? '0 8px 32px rgba(0,0,0,.45)' : '0 1px 4px rgba(0,0,0,.07)',
        minHeight: 640,
        userSelect: 'none',
      }}
    >
      {/* ── Profile header ─────────────────────────────────── */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #34d399 0%, #0d9488 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 15,
              boxShadow: '0 4px 12px rgba(16,185,129,.3)',
            }}>
              {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {/* online dot */}
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 12, height: 12, borderRadius: '50%',
              background: '#10b981', border: '2px solid #fff',
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: dark ? '#fff' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'My Account'}
            </p>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: dark ? '#34d399' : '#059669', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'Customer'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {NAV.map((section) => (
          <div key={section.group} style={{ marginBottom: 16 }}>
            {/* Section label */}
            <p style={{
              margin: '0 0 4px',
              padding: '0 20px',
              fontSize: 9, fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: textMuted,
            }}>
              {section.group}
            </p>

            {/* Items */}
            {section.items.map((item) => {
              const isActive = active(item.to);
              const Icon = item.icon;
              const badgeCount = item.badge ? badge(item.badge) : 0;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    margin: '1px 8px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? activeText : textNormal,
                    background: isActive ? activeBg : 'transparent',
                    transition: 'background 0.15s ease, color 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = dark ? 'rgba(255,255,255,.05)' : '#f9fafb';
                      e.currentTarget.style.color = textHover;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = textNormal;
                    }
                  }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3, height: 18, borderRadius: 2,
                      background: dark ? '#34d399' : '#059669',
                    }} />
                  )}

                  {/* Icon + Label — guaranteed 8px gap via inline style */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon
                      size={16}
                      style={{
                        flexShrink: 0,
                        color: isActive
                          ? (dark ? '#34d399' : '#059669')
                          : (dark ? 'rgba(255,255,255,.4)' : '#9ca3af'),
                      }}
                    />
                    <span>{item.label}</span>
                  </div>

                  {/* Right: badge or chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {badgeCount > 0 && (
                      <span style={{
                        background: '#ef4444', color: '#fff',
                        fontSize: 9, fontWeight: 900,
                        minWidth: 18, height: 18, padding: '0 4px',
                        borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight size={12} style={{ color: dark ? '#34d399' : '#059669' }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ padding: '12px', borderTop: `1px solid ${border}` }}>
        {/* Sign out */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', fontSize: 13, fontWeight: 600,
            color: dark ? '#f87171' : '#ef4444',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(239,68,68,.1)' : '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          <span>Sign Out</span>
        </button>

        {/* Theme toggle */}
        <div style={{
          display: 'flex', gap: 4, marginTop: 8,
          background: dark ? 'rgba(255,255,255,.05)' : '#f3f4f6',
          borderRadius: 10, padding: 4,
        }}>
          {[
            { label: 'Light', icon: Sun,  active: !dark, onClick: () => dark && toggleDarkMode()  },
            { label: 'Dark',  icon: Moon, active: dark,  onClick: () => !dark && toggleDarkMode() },
          ].map(({ label, icon: Icon2, active: isOn, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: isOn ? (dark ? 'rgba(16,185,129,.2)' : '#fff') : 'transparent',
                color: isOn ? (dark ? '#34d399' : '#059669') : (dark ? 'rgba(255,255,255,.35)' : '#9ca3af'),
                boxShadow: isOn ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon2 size={12} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
