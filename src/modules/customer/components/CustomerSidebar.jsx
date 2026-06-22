import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import {
  LayoutDashboard, Package, Heart, Eye,
  Scale, MessageCircle, Bell, HelpCircle,
  User, MapPin, Gift, Star, CreditCard, Settings,
  LogOut, Sun, Moon, ChevronRight, Crown, ChevronDown, ChevronLeft
} from 'lucide-react';


const NAV = [
  {
    group: 'Shopping',
    items: [
      { to: '/customer/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
      { to: '/customer/orders',          label: 'My Orders',       icon: Package },
      { to: '/customer/wishlist',        label: 'Wishlist',        icon: Heart },
      { to: '/customer/recently-viewed', label: 'Recently Viewed', icon: Eye },
    ],
  },
  {
    group: 'Support',
    items: [
      { to: '/customer/disputes',        label: 'My Disputes',     icon: Scale },
      { to: '/customer/messages',        label: 'Messages',        icon: MessageCircle },
      { to: '/customer/notifications',   label: 'Notifications',   icon: Bell, badgeKey: 'notifs' },
      { to: '/customer/help',            label: 'Help Center',     icon: HelpCircle },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/customer/profile',         label: 'Profile',         icon: User },
      { to: '/customer/addresses',       label: 'Addresses',       icon: MapPin },
      { to: '/customer/loyalty',         label: 'Loyalty Points',  icon: Gift, pointBadge: '250 pts' },
      { to: '/customer/reviews',         label: 'My Reviews',      icon: Star },
      { to: '/customer/payment-methods', label: 'Payment Methods', icon: CreditCard },
      { to: '/customer/settings',        label: 'Account Settings',icon: Settings },
    ],
  },
];

export default function CustomerSidebar({ darkMode, toggleDarkMode, isCollapsed, onToggleCollapse }) {
  const { logoutUser, user, unreadNotifs } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [expandedSections, setExpandedSections] = useState({
    Shopping: true,
    Support: true,
    Account: true
  });

  const handleLogout = () => { logoutUser(); navigate('/'); };

  // active matcher
  const active = (to) => to !== '/' ? currentPath.startsWith(to) : currentPath === '/';

  // badge resolver
  const getBadgeCount = (key) => {
    if (key === 'notifs') return unreadNotifs || 14; // fallback to 14 if undefined for the UI demo
    return 0;
  };

  const toggleSection = (groupName) => {
    setExpandedSections(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const isDark = darkMode;

  return (
    <nav className={`flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col min-h-[600px] select-none transition-all duration-300 ${
      isCollapsed ? 'w-[72px]' : 'w-56'
    }`}>
      
      {/* ── Profile Header ── */}
      <div className={`relative p-5 border-b border-gray-100 overflow-hidden bg-gradient-to-b from-emerald-50/60 to-white ${isCollapsed ? 'flex justify-center' : ''}`}>
        {!isCollapsed && (
          <svg className="absolute bottom-0 left-0 w-[150%] opacity-40 text-emerald-100/70 pointer-events-none" viewBox="0 0 1440 320" fill="currentColor" style={{ transform: 'translateX(-10%)' }}>
            <path fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,106.7C672,96,768,128,864,154.7C960,181,1056,203,1152,192C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        )}

        <div className="relative flex items-center gap-3.5 z-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-[#10B981] flex items-center justify-center text-white text-lg font-black shadow-[0_4px_12px_rgba(16,185,129,0.25)] border-2 border-white">
              {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'R'}
            </div>
            {/* Verified Badge */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
          {/* Info */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-gray-900 truncate tracking-tight mb-0.5">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'My Account'}
              </p>
              <p className="text-[10px] font-semibold text-gray-500 truncate mb-1.5">
                {user?.email || 'raihiyan8@gmail.com'}
              </p>
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#e6f7ec] border border-[#bbf7d0] text-[#10B981] text-[8px] font-black uppercase tracking-wider">
                <Crown size={8} className="text-[#10B981]" />
                Gold Member
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide space-y-4">
        {NAV.map((section, idx) => {
          const isExpanded = expandedSections[section.group];
          
          if (isCollapsed) {
            return (
              <div key={section.group} className="space-y-[2px] px-2.5">
                {section.items.map((item) => {
                  const isActive = active(item.to);
                  const Icon = item.icon;
                  const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-[#f0fdf4] text-[#10B981] shadow-xs' 
                          : 'text-gray-500 hover:bg-emerald-50/45 hover:text-emerald-700'
                      }`}
                    >
                      <Icon size={18} className={`transition-all duration-200 group-hover:scale-105 ${isActive ? 'text-[#10B981]' : 'text-gray-400 group-hover:text-[#10B981]'}`} />
                      
                      {/* Floating Badge */}
                      {badgeCount > 0 && (
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#EF4444] rounded-full border border-white flex items-center justify-center text-[7px] text-white font-bold">
                          {badgeCount}
                        </span>
                      )}
                      {item.pointBadge && (
                        <span className="absolute -bottom-0.5 right-0.5 w-2 h-2 bg-[#10B981] rounded-full border border-white" />
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
                className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-0 cursor-pointer text-left"
              >
                <span>{section.group}</span>
                <ChevronDown size={10} className={`transform transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
              </button>
              
              {/* Nav Items Accordion Body */}
              {isExpanded && (
                <div className="space-y-[2px] mt-1">
                  {section.items.map((item) => {
                    const isActive = active(item.to);
                    const Icon = item.icon;
                    const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isActive 
                            ? 'bg-[#f0fdf4] text-[#10B981] shadow-xs' 
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
                          {item.pointBadge && (
                            <span className="px-1.5 py-0.5 rounded bg-[#e6f7ec] text-[#10B981] font-black text-[8px] uppercase tracking-wide">
                              {item.pointBadge}
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
          onClick={handleLogout}
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
                !darkMode ? 'bg-[#f0fdf4] text-[#10B981] shadow-xs' : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50/40'
              }`}
            >
              <Sun size={12} />
              {!isCollapsed && <span className="text-[10px] font-black">Light</span>}
            </button>
            <button 
              onClick={() => !darkMode && toggleDarkMode()}
              title="Dark Mode"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer border-0 ${
                darkMode ? 'bg-[#f0fdf4] text-[#10B981] shadow-xs' : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50/40'
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
