import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Package, ShoppingCart, CreditCard,
  Star, ImageIcon, Megaphone, Tag, DollarSign, AlertTriangle, Grid3X3, BadgeCheck,
  RefreshCw, Scale, ShieldCheck, MessageSquare, Settings,
  Bell, LogOut, Menu, X, ChevronRight, Sun, Moon, Search, Sparkles,
} from 'lucide-react';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import { useAdminTheme } from '../hooks/useAdminTheme';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard',    label: 'Dashboard',          icon: LayoutDashboard, path: '/admin/dashboard'   },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { id: 'users',        label: 'Users',               icon: Users,           path: '/admin/users'       },
      { id: 'sellers',      label: 'Sellers',             icon: Store,           path: '/admin/sellers'     },
      { id: 'products',     label: 'Products',            icon: Package,         path: '/admin/products'    },
      { id: 'orders',       label: 'Orders',              icon: ShoppingCart,    path: '/admin/orders'      },
      { id: 'payments',     label: 'Payments',            icon: CreditCard,      path: '/admin/payments'    },
      { id: 'commissions',  label: 'Commissions',         icon: DollarSign,      path: '/admin/commissions' },
      { id: 'reviews',      label: 'Reviews',             icon: Star,            path: '/admin/reviews'     },
    ],
  },
  {
    label: 'Homepage',
    items: [
      { id: 'homepage-banner',   label: 'Hero & Promo',      icon: Sparkles,      path: '/admin/banners'     },
      { id: 'homepage-categories', label: 'Category Rail',   icon: Grid3X3,       path: '/admin/categories'  },
      { id: 'homepage-brands',   label: 'Brand Rail',        icon: BadgeCheck,    path: '/admin/brands'      },
      { id: 'homepage-promos',   label: 'Promo Codes',       icon: Tag,            path: '/admin/promos'      },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'campaigns',    label: 'Campaigns',           icon: Megaphone,       path: '/admin/campaigns'   },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { id: 'reports',      label: 'Reports',             icon: AlertTriangle,   path: '/admin/reports'     },
      { id: 'disputes',     label: 'Disputes',            icon: Scale,           path: '/admin/disputes', urgent: true },
      { id: 'audit',        label: 'Audit Logs',          icon: ShieldCheck,     path: '/admin/audit-logs'  },
      { id: 'inbox',        label: 'Inbox',               icon: MessageSquare,   path: '/admin/inbox'       },
      { id: 'settings',     label: 'Settings',            icon: Settings,        path: '/admin/settings'    },
    ],
  },
];

function SidebarInner({ mobile, onClose, isDark, themeClasses, location, handleLogout, toggleDarkMode, notifications }) {
  return (
    <aside className={`
      flex flex-col h-full transition-all duration-300
      ${mobile ? 'w-72' : 'w-56'}
      ${isDark
        ? 'bg-[#0d1117] border border-white/8 shadow-2xl'
        : 'bg-white border border-gray-200/80 shadow-sm'
      }
      rounded-2xl
    `}>
      {/* Logo / Brand header */}
      <div className={`flex items-center justify-between px-4 py-4 border-b ${isDark ? 'border-white/8' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/25">
            J
          </div>
          <div>
            <p className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Jhapcham</p>
            <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Admin Panel
            </p>
          </div>
        </div>
        {mobile && (
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/60 hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              margin: '0 0 4px',
              padding: '0 20px',
            }}>
              <p style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: group.label === 'Homepage'
                  ? (isDark ? '#6ee7b7' : '#059669')
                  : (isDark ? 'rgba(255,255,255,.30)' : '#9ca3af'),
              }}>
                {group.label}
              </p>
              {group.label === 'Homepage' && (
                <span style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: isDark ? 'rgba(255,255,255,.42)' : '#6b7280',
                }}>
                  storefront
                </span>
              )}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const activeText = isDark ? '#34d399' : '#047857';
              const activeBg   = isDark ? 'rgba(16,185,129,.14)' : '#f0fdf4';
              const normalText = isDark ? 'rgba(255,255,255,.60)' : '#4b5563';

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => mobile && onClose()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 12px', margin: '1px 8px', borderRadius: 10,
                    textDecoration: 'none', fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? activeText : normalText,
                    background: isActive ? activeBg : 'transparent',
                    transition: 'background 0.15s ease, color 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : '#f9fafb';
                      e.currentTarget.style.color = isDark ? '#fff' : '#111827';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = normalText;
                    }
                  }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, borderRadius: 2, background: isDark ? '#34d399' : '#059669' }} />
                  )}

                  {/* Icon + label — guaranteed 8px gap */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={15} style={{ flexShrink: 0, color: isActive ? (isDark ? '#34d399' : '#059669') : (isDark ? 'rgba(255,255,255,.4)' : '#9ca3af') }} />
                    <span>{item.label}</span>
                  </div>

                  {/* Right side */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {item.urgent && !isActive && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDark ? '#fbbf24' : '#f59e0b', animation: 'pulse 2s infinite' }} />
                    )}
                    {isActive && (
                      <ChevronRight size={12} style={{ color: isDark ? '#34d399' : '#059669' }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`px-3 pb-4 pt-3 border-t space-y-2 ${isDark ? 'border-white/8' : 'border-gray-100'}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
            isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
          }`}
        >
          <LogOut size={15} className="flex-shrink-0" />
          <span>Sign Out</span>
        </button>

        <div className={`flex items-center rounded-xl p-1 gap-1 ${isDark ? 'bg-white/5' : 'bg-gray-100/80'}`}>
          <button
            onClick={() => isDark && toggleDarkMode()}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              !isDark ? 'bg-white text-emerald-600 shadow-sm' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Sun size={12} />
            <span>Light</span>
          </button>
          <button
            onClick={() => !isDark && toggleDarkMode()}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              isDark ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Moon size={12} />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children, pageTitle, pageSubtitle, headerActions, notifications = 0 }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { logoutUser, user } = useCustomer();
  const { darkMode, toggleDarkMode, themeClasses } = useAdminTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isDark        = darkMode;
  const handleLogout  = () => { logoutUser(); navigate('/'); };
  const adminInitial  = user?.firstName?.charAt(0)?.toUpperCase() || 'A';

  const handleAdminSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    navigate(`/admin/orders?orderId=${encodeURIComponent(query)}`);
  };

  return (
    <div className={`flex min-h-screen gap-2 p-2 overflow-x-hidden transition-colors duration-250 ${themeClasses.bg.secondary}`}>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <SidebarInner
          isDark={isDark}
          themeClasses={themeClasses}
          location={location}
          handleLogout={handleLogout}
          toggleDarkMode={toggleDarkMode}
          notifications={notifications}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <SidebarInner
              mobile
              onClose={() => setSidebarOpen(false)}
              isDark={isDark}
              themeClasses={themeClasses}
              location={location}
              handleLogout={handleLogout}
              toggleDarkMode={toggleDarkMode}
              notifications={notifications}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden rounded-2xl border shadow-sm transition-colors duration-250 ${
        isDark ? 'border-white/8' : 'border-gray-200/80'
      } ${themeClasses.card}`}>

        {/* Top header */}
        <header className={`flex-shrink-0 border-b px-4 lg:px-6 py-3 flex items-center gap-4 transition-colors ${
          isDark ? 'bg-[#0d1117] border-white/8' : 'bg-white border-gray-100'
        }`}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${isDark ? 'text-white/60 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            {pageTitle && (
              <div>
                <h1 className={`text-base font-black uppercase tracking-wider truncate ${themeClasses.text.primary}`}>
                  {pageTitle}
                </h1>
                {pageSubtitle && (
                  <p className={`text-xs mt-0.5 truncate ${themeClasses.text.secondary}`}>{pageSubtitle}</p>
                )}
              </div>
            )}
          </div>

          {/* Search Pill for Admin */}
          <form onSubmit={handleAdminSearch} className="flex-1 max-w-xs relative hidden md:block mx-4">
            <div className={`relative flex items-center border rounded-lg overflow-hidden transition-all ${
              isDark 
                ? 'border-white/20 focus-within:border-emerald-500 bg-white/5' 
                : 'border-gray-300 focus-within:border-emerald-600 bg-gray-50'
            }`}>
              <input 
                type="text" 
                placeholder="Search orders, refunds..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-3 pr-8 py-1.5 text-xs bg-transparent outline-none placeholder-gray-400 focus:outline-none ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              />
              <button type="submit" className={`absolute right-0 top-0 bottom-0 px-2.5 transition-colors outline-none ${
                isDark ? 'text-white/60 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'
              }`}>
                <Search size={13} />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {headerActions}

            {/* Notification bell */}
            <button className={`relative p-2 rounded-xl transition-colors ${isDark ? 'text-white/60 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Bell size={17} />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>

            {/* Admin avatar */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/25">
              {adminInitial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto transition-colors ${themeClasses.bg.primary}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
