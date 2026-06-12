import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useCustomer } from './contexts/CustomerContext';
import CustomerSidebar from './components/CustomerSidebar';
import CustomerHome from './components/CustomerHome';
import { NotificationButton } from '../../shared/components/ui/notification-button';
import CustomerOrders from './components/CustomerOrders';
import Cart from '../cart/Cart';
import Checkout from '../checkout/Checkout';
import CustomerWishlist from './components/CustomerWishlist';
import CustomerProfile from './components/CustomerProfile';
import CustomerAddresses from './components/CustomerAddresses';
import CustomerReviews from './components/CustomerReviews';
import CustomerNotifications from './components/CustomerNotifications';
import CustomerLoyalty from './components/CustomerLoyalty';
// Customer listing pages removed (CustomerBrowse, FilteredProductsPage)
import CustomerMessages from './components/CustomerMessages';
import CustomerRefunds from './components/CustomerRefunds';
import CustomerDisputes from './components/CustomerDisputes';
// FilteredProductsPage removed
import Navbar from '../../shared/components/Navbar/Navbar';
import BorderAvatarDemo from '../../shared/components/ui/avatar-border';

const BREADCRUMBS = {
  '/customer/dashboard':     'Dashboard',
  '/customer/cart':          'Shopping Cart',
  '/customer/wishlist':      'Wishlist',
  '/customer/orders':        'My Orders',
  '/customer/reviews':       'My Reviews',
  '/customer/profile':       'Account Details',
  '/customer/addresses':     'Addresses',
  '/customer/loyalty':       'Loyalty Points',
  '/customer/messages':      'Messages',
  '/customer/notifications': 'Notifications',
  '/customer/refunds':       'My Refunds',
  '/customer/disputes':      'My Disputes',
};

const CustomerLayout = () => {
  const { user, loading, unreadNotifs } = useCustomer();
  const location = useLocation();
  const navigate = useNavigate();
  const currentLabel = BREADCRUMBS[location.pathname] || 'My Account';

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('customer-theme') === 'dark';
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('customer-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm font-semibold tracking-wide">Loading your account…</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'CUSTOMER') return <Navigate to="/" replace />;

  return (
    <>
      <Navbar />
      <div className={`customer-page min-h-screen bg-gray-50 font-sans transition-colors duration-250 ${darkMode ? 'theme-dark' : ''}`}>
      <style>{`
        .customer-page {
          background-color: #FFFFFF !important;
          color: #111827 !important;
        }
        .customer-page .text-blue-600,
        .customer-page .text-blue-700,
        .customer-page .text-blue-500,
        .customer-page .text-blue-800,
        .customer-page .text-blue-900,
        .customer-page .text-[#2563EB],
        .customer-page .text-[#1D4ED8],
        .customer-page .text-[#4299E1] {
          color: #065F46 !important;
        }
        .customer-page .bg-blue-50,
        .customer-page .bg-blue-100,
        .customer-page .bg-blue-200,
        .customer-page .border-blue-200,
        .customer-page .bg-sky-50,
        .customer-page .border-sky-200,
        .customer-page .text-sky-700,
        .customer-page .bg-sky-100 {
          background-color: #ECFDF5 !important;
          border-color: #A7F3D0 !important;
          color: #065F46 !important;
        }
        .customer-page .bg-blue-600,
        .customer-page .hover:bg-blue-700:hover,
        .customer-page .bg-[#2563EB],
        .customer-page .bg-blue-500,
        .customer-page .text-blue-50 {
          background-color: #10B981 !important;
          color: #FFFFFF !important;
          border-color: #10B981 !important;
        }
        .customer-page .hover:text-blue-600:hover,
        .customer-page .focus:border-blue-500:focus,
        .customer-page .focus:border-blue-400:focus,
        .customer-page .focus:border-sky-500:focus,
        .customer-page .focus:ring-blue-100:focus,
        .customer-page .focus:ring-blue-500:focus {
          color: #10B981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
        }
        .customer-page .border-blue-100,
        .customer-page .border-blue-500,
        .customer-page .border-sky-100 {
          border-color: #A7F3D0 !important;
        }
        .customer-page .hover:bg-blue-100:hover,
        .customer-page .bg-blue-100:hover,
        .customer-page .hover:bg-sky-100:hover {
          background-color: #D1FAE5 !important;
        }

        /* ── Dark Mode Aurora Dark Theme Overrides ── */
        .theme-dark {
          background-color: #080b14 !important;
          color: #f0f4ff !important;
        }
        .theme-dark .bg-gray-50 {
          background-color: #080b14 !important;
        }
        
        /* Layout elements & cards */
        .theme-dark aside,
        .theme-dark main,
        .theme-dark [class*="bg-white"] {
          background-color: #0d1117 !important;
          color: #f0f4ff !important;
        }
        
        .theme-dark nav,
        .theme-dark header {
          background-color: #0d1117 !important;
          color: #f0f4ff !important;
        }
        
        /* CRISP LIGHT LINES (BORDERS) */
        .theme-dark [class*="border"] {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        
        /* Text Color Adaptations */
        .theme-dark h1,
        .theme-dark h2,
        .theme-dark h3,
        .theme-dark p,
        .theme-dark span,
        .theme-dark td,
        .theme-dark th {
          color: #f0f4ff !important;
        }
        
        /* Numbers & Stats texts override */
        .theme-dark [class*="text-gray-900"],
        .theme-dark [class*="text-gray-800"] {
          color: #f0f4ff !important;
        }
        
        /* Muted Gray Texts */
        .theme-dark .text-gray-400,
        .theme-dark .text-gray-500 {
          color: #8892a4 !important;
        }
        
        /* Input & Search Adaptations */
        .theme-dark .bg-gray-50 {
          background-color: rgba(255, 255, 255, 0.03) !important;
          color: #f0f4ff !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .theme-dark input,
        .theme-dark textarea,
        .theme-dark select {
          background-color: #1a1f2e !important;
          color: #f0f4ff !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .theme-dark input::placeholder,
        .theme-dark textarea::placeholder {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .theme-dark input:focus,
        .theme-dark textarea:focus,
        .theme-dark select:focus {
          border-color: rgba(52, 211, 153, 0.5) !important;
          background-color: #1a1f2e !important;
        }
        
        /* ACTIVE PILL OVERRIDES */
        .theme-dark [class*="text-blue-600"],
        .theme-dark [class*="text-blue-500"] {
          color: #34D399 !important;
        }
        
        .theme-dark [class*="bg-blue-600"] {
          background-color: #10B981 !important;
          color: #ffffff !important;
        }
        
        /* Buttons hover states */
        .theme-dark .hover:bg-blue-700:hover,
        .theme-dark [class*="bg-blue-600"]:hover {
          background-color: #059669 !important;
        }

        /* ── Sidebar Modern Premium styles ── */
        .theme-dark-sidebar {
          transition: all 0.25s ease;
        }
        .theme-dark .theme-dark-sidebar {
          background-color: #0d1117 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
        }
        .sidebar-section-title {
          color: #9CA3AF !important;
        }
        .theme-dark .sidebar-section-title {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .theme-active-pill {
          background-color: rgba(16, 185, 129, 0.08) !important;
          color: #10B981 !important;
        }
        .theme-dark .theme-active-pill {
          background-color: rgba(52, 211, 153, 0.1) !important;
          color: #34D399 !important;
        }
        .theme-dark .theme-dark-sidebar a:hover:not(.theme-active-pill) {
          background-color: rgba(255, 255, 255, 0.03) !important;
          color: #34D399 !important;
        }
        
        /* ── Breadcrumb Banner Dark Mode ── */
        .theme-dark .bg-white {
          background-color: #0d1117 !important;
        }
        .theme-dark .text-gray-800 {
          color: #f0f4ff !important;
        }
        .theme-dark .text-gray-600 {
          color: #cbd5e1 !important;
        }
        
        /* ── Cards and Containers ── */
        .theme-dark .rounded-xl,
        .theme-dark .rounded-lg,
        .theme-dark .rounded-2xl {
          background-color: #0d1117 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        
        /* ── Status Badges ── */
        .theme-dark [class*="bg-amber-"],
        .theme-dark [class*="bg-blue-"],
        .theme-dark [class*="bg-emerald-"],
        .theme-dark [class*="bg-red-"],
        .theme-dark [class*="bg-purple-"] {
          background-color: rgba(52, 211, 153, 0.15) !important;
          color: #34D399 !important;
          border-color: rgba(52, 211, 153, 0.3) !important;
        }
        
        /* ── Scrollbar ── */
        .theme-dark ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .theme-dark ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .theme-dark ::-webkit-scrollbar-thumb {
          background: rgba(52, 211, 153, 0.3);
          border-radius: 4px;
        }
        .theme-dark ::-webkit-scrollbar-thumb:hover {
          background: rgba(52, 211, 153, 0.5);
        }
        
        @keyframes slideIn {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out forwards;
        }
      `}</style>
      {/* Breadcrumb Banner */}
      <div className={`${darkMode ? 'theme-dark' : ''} bg-white border-b border-gray-100`}>
        <div className="max-w-[1440px] mx-auto px-6 py-2.5">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">
            <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
            <span>›</span>
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">Shop</span>
            <span>›</span>
            <span className="text-gray-600">{currentLabel}</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">My Account</h1>
              <NotificationButton
                count={unreadNotifs}
                onClick={() => navigate('/customer/notifications')}
              />
            </div>
            <BorderAvatarDemo />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-6 py-4">
        <div className="flex gap-8 items-start">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <CustomerSidebar 
              currentPath={location.pathname} 
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          </aside>

          {/* Page Content */}
          <main className="flex-1 min-w-0">
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"     element={<CustomerHome />} />
              {/* Listing routes removed */}
              <Route path="cart"          element={<Cart />} />
              <Route path="checkout"      element={<Checkout />} />
              <Route path="wishlist"      element={<CustomerWishlist />} />
              <Route path="orders"        element={<CustomerOrders />} />
              <Route path="reviews"       element={<CustomerReviews />} />
              <Route path="profile"       element={<CustomerProfile />} />
              <Route path="addresses"     element={<CustomerAddresses />} />
              <Route path="loyalty"       element={<CustomerLoyalty />} />
              <Route path="messages"      element={<CustomerMessages />} />
              <Route path="notifications" element={<CustomerNotifications />} />
              <Route path="refunds"       element={<CustomerRefunds />} />
              <Route path="disputes"      element={<CustomerDisputes />} />
              <Route path="*"             element={<Navigate to="dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
      </div>
    </>
  );
};

export default CustomerLayout;

