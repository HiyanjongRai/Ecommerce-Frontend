import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUnreadMessageCount } from '../api/sellerApi';
import {
  LayoutDashboard, DollarSign, Package, Boxes, Tag, Megaphone,
  Ticket, ShoppingCart, Scale, Inbox, Bell, Store, Settings,
  LogOut, Sun, Moon, ChevronRight, ChevronLeft, ChevronDown, HelpCircle, TrendingUp
} from 'lucide-react';
import { toast } from '../../../shared/contexts/ToastContext';
import { BASE_URL } from '../../../shared/api/apiClient';

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
  {
    group: 'Help',
    items: [
      { to: '#help',                      label: 'Help Center',     icon: HelpCircle, isAction: true },
    ],
  },
];

export default function SellerSidebar({ currentPath, darkMode, toggleDarkMode, profile, onLogout, isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const [badges, setBadges] = useState({ inbox: 0 });

  const [expandedSections, setExpandedSections] = useState({
    Overview: true,
    Products: true,
    Orders: true,
    Store: true,
    Help: true
  });

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

  const active = (to) => currentPath.startsWith(to);

  const getBadgeCount = (key) => {
    if (key === 'inbox') return badges.inbox || 0;
    return 0;
  };

  const toggleSection = (groupName) => {
    setExpandedSections(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const logoSrc = profile?.logoImagePath
    ? (profile.logoImagePath.startsWith('http') ? profile.logoImagePath : `${BASE_URL}/${profile.logoImagePath.replace(/^\//, '')}`)
    : null;

  return (
    <nav className={`flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col min-h-[600px] select-none transition-all duration-300 theme-dark-sidebar ${
      isCollapsed ? 'w-[72px]' : 'w-56'
    }`}>
      
      {/* ── Profile/Store Header ── */}
      <div className={`relative p-5 border-b border-gray-100 overflow-hidden bg-gradient-to-b from-emerald-50/60 to-white ${isCollapsed ? 'flex justify-center' : ''}`}>
        {!isCollapsed && (
          <svg className="absolute bottom-0 left-0 w-[150%] opacity-40 text-emerald-100/70 pointer-events-none" viewBox="0 0 1440 320" fill="currentColor" style={{ transform: 'translateX(-10%)' }}>
            <path fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,106.7C672,96,768,128,864,154.7C960,181,1056,203,1152,192C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        )}

        <div className="relative flex items-center gap-3.5 z-10">
          {/* Logo / Avatar */}
          <div className="relative flex-shrink-0">
            {logoSrc ? (
              <img 
                src={logoSrc} 
                alt={profile?.storeName} 
                className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#10B981] to-[#0d9488] flex items-center justify-center text-white text-lg font-black shadow-[0_4px_12px_rgba(16,185,129,0.25)] border-2 border-white">
                {profile?.storeName?.charAt(0)?.toUpperCase() || 'S'}
              </div>
            )}
            {/* Active dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full flex items-center justify-center shadow-sm">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          {/* Info */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-gray-900 truncate tracking-tight mb-0.5">
                {profile?.storeName || 'My Store'}
              </p>
              <p className="text-[10px] font-semibold text-gray-500 truncate mb-1.5">
                {profile?.email || 'Store Partner'}
              </p>
              <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e6f7ec] border border-[#bbf7d0] text-[#10B981] text-[8px] font-black uppercase tracking-wider">
                Active Panel
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide space-y-4">
        {NAV.map((section) => {
          const isExpanded = expandedSections[section.group];
          
          if (isCollapsed) {
            return (
              <div key={section.group} className="space-y-[2px] px-2.5">
                {section.items.map((item) => {
                  const isActive = !item.isAction && active(item.to);
                  const Icon = item.icon;
                  const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;

                  if (item.isAction) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          if (item.label === 'Help Center') {
                            toast('💡 Jhapcham Help Center — How can we assist you? Email: support@jhapcham.com', 'info');
                          }
                        }}
                        title={item.label}
                        className="group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 bg-transparent border-0 text-gray-500 hover:bg-emerald-50/45 hover:text-emerald-700 cursor-pointer"
                      >
                        <Icon size={18} className="text-gray-400 group-hover:text-[#10B981] group-hover:scale-105 transition-all duration-200" />
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-[#f0fdf4] text-[#10B981] shadow-xs theme-active-pill' 
                          : 'text-gray-550 hover:bg-emerald-50/45 hover:text-emerald-700'
                      }`}
                    >
                      <Icon size={18} className={`transition-all duration-200 group-hover:scale-105 ${isActive ? 'text-[#10B981]' : 'text-gray-400 group-hover:text-[#10B981]'}`} />
                      
                      {/* Floating Badge */}
                      {badgeCount > 0 && (
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#EF4444] rounded-full border border-white flex items-center justify-center text-[7px] text-white font-bold">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={section.group} className="px-3">
              {/* Collapsible Section Heading */}
              <button
                type="button"
                onClick={() => toggleSection(section.group)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-gray-450 hover:text-gray-600 transition-colors bg-transparent border-0 cursor-pointer text-left sidebar-section-title"
              >
                <span>{section.group}</span>
                <ChevronDown size={10} className={`transform transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
              </button>
              
              {/* Nav Items Accordion Body */}
              {isExpanded && (
                <div className="space-y-[2px] mt-1">
                  {section.items.map((item) => {
                    const isActive = !item.isAction && active(item.to);
                    const Icon = item.icon;
                    const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;

                    if (item.isAction) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            if (item.label === 'Help Center') {
                              toast('💡 Jhapcham Help Center — How can we assist you? Email: support@jhapcham.com', 'info');
                            }
                          }}
                          className="w-full group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 bg-transparent border-0 text-gray-600 hover:bg-emerald-50/45 hover:text-emerald-700 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={16} className="text-gray-400 group-hover:text-emerald-600 group-hover:scale-105 transition-all duration-200" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight 
                            size={10} 
                            className="text-emerald-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" 
                          />
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isActive 
                            ? 'bg-[#f0fdf4] text-[#10B981] shadow-xs theme-active-pill' 
                            : 'text-gray-600 hover:bg-emerald-50/45 hover:text-emerald-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className={`transition-all duration-200 group-hover:scale-105 ${isActive ? 'text-[#10B981]' : 'text-gray-400 group-hover:text-emerald-600'}`} />
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {badgeCount > 0 && (
                            <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[8px] font-black shadow-xs">
                              {badgeCount}
                            </span>
                          )}
                          <ChevronRight 
                            size={10} 
                            className={`transition-all duration-200 ${
                              isActive 
                                ? 'text-[#10B981] opacity-100' 
                                : 'text-emerald-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                            }`} 
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className={`p-3 border-t border-gray-100 bg-white ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {/* Sign Out */}
        <button
          onClick={onLogout}
          title="Sign Out"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer border-0 bg-transparent ${isCollapsed ? 'w-11 h-11 justify-center' : 'w-full'}`}
        >
          <LogOut size={15} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {/* Theme Toggle & Collapse controls */}
        <div className={`flex w-full ${isCollapsed ? 'flex-col gap-2' : 'flex-col gap-1.5'}`}>
          <div className="flex p-1 bg-white border border-gray-100 rounded-[12px] shadow-xs">
            <button 
              onClick={() => darkMode && toggleDarkMode()} 
              title="Light Mode"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer border-0 ${
                !darkMode ? 'bg-[#f0fdf4] text-[#10B981] shadow-xs' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Sun size={12} />
              {!isCollapsed && <span className="text-[10px] font-black">Light</span>}
            </button>
            <button 
              onClick={() => !darkMode && toggleDarkMode()}
              title="Dark Mode"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer border-0 ${
                darkMode ? 'bg-[#f0fdf4] text-[#10B981] shadow-xs' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Moon size={12} />
              {!isCollapsed && <span className="text-[10px] font-black">Dark</span>}
            </button>
          </div>

          {/* Collapse sidebar button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors border border-gray-100 rounded-xl cursor-pointer ${
              isCollapsed ? 'w-11 h-11' : 'w-full'
            }`}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"><ChevronLeft size={12} /> Collapse</div>}
          </button>
        </div>
      </div>
    </nav>
);
}
