import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import SellerDashboardHome from './components/SellerDashboardHome';
import SellerProfile from './components/SellerProfile';
import SellerProducts from './components/SellerProducts';
import SellerOrders from './components/SellerOrders';
import SellerInventory from './components/SellerInventory';
import SellerCampaigns from './components/SellerCampaigns';
import SellerCommission from './components/SellerCommission';
import SellerInbox from './components/SellerInbox';
import SellerSettings from './components/SellerSettings';
import SellerPromos from './components/SellerPromos';
import SellerDiscountSales from './components/SellerDiscountSales';
import SellerSaleDiscountList from './components/SellerSaleDiscountList';
import SellerDisputes from './components/SellerDisputes';
import SellerNotifications from './components/SellerNotifications';
import { getSellerProfile, getSellerApplicationStatus } from './services/sellerService';
import { useCustomer } from '../customer/contexts/CustomerContext';
import SellerOnboarding from './components/SellerOnboarding';
import SellerSidebar from './components/SellerSidebar';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const BREADCRUMBS = {
  '/seller/dashboard':  'Dashboard Overview',
  '/seller/orders':     'Orders & Analytics',
  '/seller/commission': 'Earnings Summary',
  '/seller/products':   'Product Catalog',
  '/seller/inventory':  'Inventory Manager',
  '/seller/campaigns':  'Promo Campaigns',
  '/seller/promos':     'Promo Codes Manager',
  '/seller/discount-sales': 'Discount & Sales',
  '/seller/sale-discount-list': 'Sale & Discount List',
  '/seller/inbox':      'Messages Queue',
  '/seller/profile':    'Store Profile',
  '/seller/settings':   'Settings Panel',
  '/seller/disputes':   'Order Disputes',
  '/seller/notifications': 'Notifications',
};

// SIDEBAR_SECTIONS removed — navigation is handled by SellerSidebar.jsx

const renderIcon = (type, isActive) => {
  const activeColor = "text-[#10B981] theme-dark:text-[#34D399]";
  const inactiveColor = "text-gray-400 group-hover:text-[#10B981] theme-dark:group-hover:text-[#34D399] transition-colors";
  const iconClass = `w-5 h-5 flex-shrink-0 ${isActive ? activeColor : inactiveColor}`;

  switch (type) {
    case 'dashboard':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L3.5 10H5v9a2 2 0 002 2h10a2 2 0 002-2v-9h1.5L12 3zm0 11a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'earnings':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-12S17.514 2 12 2zm1 13.5v.5h-2v-.5c0-.825-.675-1.5-1.5-1.5H10v-2h.5c.825 0 1.5-.675 1.5-1.5V10h-1V8.5h2v.5c0 .825.675 1.5 1.5 1.5h.5v2h-.5c-.825 0-1.5.675-1.5 1.5V15h1v.5z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'products':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 8h-3.5a1.5 1.5 0 01-1.5-1.5V3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
          <path d="M16 3.586V6h2.414L16 3.586z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'inbox':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2h-3.586a1 1 0 01-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 016.586 16H4zM4 14V6a2 2 0 012-2h12a2 2 0 012 2v8h-3.172a3 3 0 00-2.122.879L13.379 16h-2.758l-1.327-1.121A3 3 0 007.172 14H4z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V18a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      );
    case 'analytics':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 11a2 2 0 012-2h2a2 2 0 012 2v8H5v-8zM11 7a2 2 0 012-2h2a2 2 0 012 2v12h-6V7zM17 3a2 2 0 012-2h2a2 2 0 012 2v16h-6V3z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'inventory':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.378 1.602a1 1 0 00-.756 0L3 5.055v11.89a1 1 0 00.622.922l8 3.2a1 1 0 00.756 0l8-3.2a1 1 0 00.622-.922V5.055l-8.622-3.453zM12 11.59L5.05 8.784l6.95-2.78 6.95 2.78L12 11.59z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'campaigns':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.3 4.93a1.5 1.5 0 011.2 1.47v11.2a1.5 1.5 0 01-2.4 1.2l-3.5-2.8H5.5A1.5 1.5 0 014 14.5v-5A1.5 1.5 0 015.5 8h2.1l3.5-2.8a1.5 1.5 0 011.2-.27zM16.5 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      );
    case 'promos':
    case 'discounts':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5 3.5a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-3 0v-3a1.5 1.5 0 011.5-1.5zm6 0a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-3 0v-3a1.5 1.5 0 011.5-1.5zM4.5 9A1.5 1.5 0 016 7.5h12A1.5 1.5 0 0119.5 9v6a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 15V9zm3 3a1 1 0 100-2 1 1 0 000-2zm7.5-1a1 1 0 10-2 0 1 1 0 002 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
    case 'profile':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'helps':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'settings':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 01-2.28 1l-.87-.53c-1.37-.83-3.08.88-2.25 2.25l.53.87a1.53 1.53 0 01-1 2.28c-1.56.38-1.56 2.6 0 2.98a1.53 1.53 0 011 2.28l-.53.87c-.83 1.37.88 3.08 2.25 2.25l.87-.53a1.53 1.53 0 012.28 1c.38 1.56 2.6 1.56 2.98 0a1.53 1.53 0 012.28-1l.87.53c1.37.83 3.08-.88 2.25-2.25l-.53-.87a1.53 1.53 0 011-2.28c1.56-.38 1.56-2.6 0-2.98a1.53 1.53 0 01-1-2.28l.53-.87c.83-1.37-.88-3.08-2.25-2.25l-.87.53a1.53 1.53 0 01-2.28-1zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'disputes':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'notifications':
      return isActive ? (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22z" />
          <path d="M18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'logout':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      );
    default:
      return null;
  }
};

const SellerLayout = () => {
  const { user, logoutUser } = useCustomer();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [checkingApp, setCheckingApp] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('seller-theme') === 'dark';
  });
  const [sidebarToast, setSidebarToast] = useState(null);

  const showSidebarToast = (msg, type = 'info') => {
    setSidebarToast({ msg, type });
    setTimeout(() => setSidebarToast(null), 3000);
  };

  const handleMenuClick = (item, e) => {
    if (item.to.startsWith('#')) {
      e.preventDefault();
      if (item.icon === 'logout') {
        handleLogout();
      } else if (item.icon === 'helps') {
        showSidebarToast("💡 Jhapcham Help Center loaded! How can we assist you?", 'success');
      }
    }
  };

  const fetchProfileAndStatus = useCallback(async () => {
    try {
      setCheckingApp(true);
      const res = await getSellerProfile();
      if (res.data) {
        setProfile(res.data);
      }
      
      if (user?.id) {
        const appRes = await getSellerApplicationStatus(user.id);
        if (appRes.data) {
          setAppStatus(appRes.data.status);
        }
      }
    } catch (err) {
      console.error("Failed to load seller profile and application status in layout", err);
    } finally {
      setCheckingApp(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchProfileAndStatus();
    } else {
      setCheckingApp(false);
    }
  }, [user?.id, fetchProfileAndStatus]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('seller-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleLogout = () => {
    logoutUser();
  };

  // Find currently active title for breadcrumb
  const currentLabel = BREADCRUMBS[location.pathname] || 'Dashboard';

  return (
    <>
      <div className={`seller-page min-h-screen bg-gray-50 text-gray-900 font-sans transition-colors duration-250 flex flex-col ${darkMode ? 'theme-dark' : ''}`}>
        <style>{`
        .seller-page {
          background-color: #F9FAFB !important;
          color: #111827 !important;
        }
        .seller-page .text-blue-600,
        .seller-page .text-blue-700,
        .seller-page .text-blue-500,
        .seller-page .text-blue-800,
        .seller-page .text-blue-900,
        .seller-page .text-[#5c4ce3],
        .seller-page .text-[#1d4ed8] {
          color: #065F46 !important;
        }
        .seller-page .bg-blue-50,
        .seller-page .bg-blue-100,
        .seller-page .bg-blue-200,
        .seller-page .border-blue-200,
        .seller-page .bg-sky-50,
        .seller-page .border-sky-200,
        .seller-page .text-sky-700,
        .seller-page .bg-sky-100 {
          background-color: #ECFDF5 !important;
          border-color: #A7F3D0 !important;
          color: #065F46 !important;
        }
        .seller-page .bg-blue-600,
        .seller-page .hover:bg-blue-700:hover,
        .seller-page .bg-[#5c4ce3],
        .seller-page .bg-blue-500,
        .seller-page .text-blue-50 {
          background-color: #10B981 !important;
          color: #FFFFFF !important;
          border-color: #10B981 !important;
        }
        .seller-page .hover:text-blue-600:hover,
        .seller-page .focus:border-blue-500:focus,
        .seller-page .focus:border-blue-400:focus,
        .seller-page .focus:border-sky-500:focus,
        .seller-page .text-blue-50 {
          color: #10B981 !important;
        }
        .seller-page .bg-blue-600:hover,
        .seller-page .bg-[#5c4ce3]:hover,
        .seller-page .hover:bg-blue-600:hover {
          background-color: #047857 !important;
        }
        .seller-page .border-blue-100,
        .seller-page .border-blue-500,
        .seller-page .border-sky-100 {
          border-color: #A7F3D0 !important;
        }
        .seller-page .hover:bg-blue-100:hover,
        .seller-page .bg-blue-100:hover,
        .seller-page .hover:bg-sky-100:hover {
          background-color: #D1FAE5 !important;
        }
        .seller-page .focus:ring-blue-100:focus,
        .seller-page .focus:ring-blue-500:focus {
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
        }

        /* ── Dark Mode Matrix Black & Neon Green ── */
        .theme-dark {
          background-color: #0d0d0d !important;
          color: #FFFFFF !important;
        }
        .theme-dark .bg-gray-50,
        .theme-dark .bg-gray-100 {
          background-color: #111111 !important;
        }
        
        /* Layout elements & cards */
        .theme-dark aside,
        .theme-dark main,
        .theme-dark [class*="bg-white"] {
          background-color: #111111 !important;
          color: #FFFFFF !important;
        }
        
        .theme-dark nav,
        .theme-dark header {
          background-color: #0d0d0d !important;
          color: #FFFFFF !important;
        }
        
        /* CRISP WHITE LINES (BORDERS) */
        .theme-dark [class*="border"] {
          border-color: rgba(255, 255, 255, 0.12) !important;
        }
        .theme-dark [class*="divide-"] > * {
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
          color: #FFFFFF !important;
        }
        
        /* Status Badge overrides to prevent white text on white backgrounds */
        .theme-dark span[class*="bg-green"],
        .theme-dark span[class*="bg-emerald"],
        .theme-dark [class*="bg-[#E6FAF5]"] {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #10B981 !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        
        .theme-dark span[class*="bg-red"],
        .theme-dark span[class*="bg-rose"],
        .theme-dark [class*="bg-[#FDE9E8]"] {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #EF4444 !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
        }
        
        .theme-dark span[class*="bg-blue"],
        .theme-dark span[class*="bg-yellow"],
        .theme-dark span[class*="bg-amber"],
        .theme-dark [class*="bg-[#F4F7FE]"] {
          background-color: rgba(245, 158, 11, 0.15) !important;
          color: #F59E0B !important;
          border-color: rgba(245, 158, 11, 0.3) !important;
        }
        
        /* Numbers & Stats texts override to pure white */
        .theme-dark [class*="text-[#2B3674]"],
        .theme-dark [class*="text-gray-900"],
        .theme-dark [class*="text-gray-800"] {
          color: #FFFFFF !important;
        }
        
        /* Muted Gray Texts -> Light grey for high contrast */
        .theme-dark .text-gray-400,
        .theme-dark .text-gray-500,
        .theme-dark [class*="text-[#A3AED0]"] {
          color: #6B7280 !important;
        }
        
        .theme-dark .hover:text-blue-600:hover {
          color: #10B981 !important;
        }
        
        /* Input & Search Adaptations */
        .theme-dark .bg-gray-50,
        .theme-dark .bg-[#F4F7FE] {
          background-color: #1a1a1a !important;
          color: #FFFFFF !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .theme-dark input {
          color: #FFFFFF !important;
        }
        
        /* ACCENT NEON GREEN OVERRIDES */
        .theme-dark [class*="text-blue-600"],
        .theme-dark [class*="text-blue-500"],
        .theme-dark [class*="text-[#5c4ce3]"] {
          color: #10B981 !important;
        }
        
        .theme-dark [class*="bg-blue-600"],
        .theme-dark [class*="bg-[#5c4ce3]"] {
          background-color: #10B981 !important;
          color: #000000 !important;
        }
        
        /* Active items on list (like Active Inbox chat selection card) */
        .theme-dark .bg-blue-50,
        .theme-dark [class*="bg-blue-50"] {
          background-color: rgba(16, 185, 129, 0.1) !important;
          border-color: #10B981 !important;
          color: #FFFFFF !important;
        }
        .theme-dark [class*="bg-blue-50"] span {
          color: #FFFFFF !important;
        }
        .theme-dark [class*="bg-blue-50"] p {
          color: #10B981 !important;
        }
        
        /* Buttons hover states */
        .theme-dark .hover:bg-blue-700:hover,
        .theme-dark .hover:bg-[#4a3bc6]:hover,
        .theme-dark [class*="bg-blue-600"]:hover,
        .theme-dark [class*="bg-[#5c4ce3]"]:hover {
          background-color: #059669 !important;
          color: #000000 !important;
        }
        
        /* Stat trends */
        .theme-dark [class*="text-green-600"],
        .theme-dark [class*="text-emerald-600"] {
          color: #34D399 !important;
        }
        .theme-dark [class*="text-red-500"] {
          color: #F87171 !important;
        }
        
        /* Badges & Pill backgrounds */
        .theme-dark .bg-blue-600\/5 {
          background-color: rgba(16, 185, 129, 0.1) !important;
          color: #10B981 !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }
        .theme-dark .bg-emerald-50 {
          background-color: rgba(52, 211, 153, 0.1) !important;
          color: #34D399 !important;
          border: 1px solid rgba(52, 211, 153, 0.3) !important;
        }
        
        /* Modal Backdrop & Modal Card Background */
        .theme-dark [class*="bg-[#2B3674]/55"] {
          background-color: rgba(0, 0, 0, 0.85) !important;
        }
        .theme-dark [class*="bg-[#FAF7F2]"] {
          background-color: #111111 !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        
        /* Subtle Inner Dashed/Dotted Borders */
        .theme-dark [class*="border-dashed"],
        .theme-dark [class*="border-dotted"],
        .theme-dark [class*="divide-dashed"] > * {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* ── Order Modal: specific hex badge backgrounds ── */
        .theme-dark [class*="bg-[#fce8e6]"] {
          background-color: rgba(239, 68, 68, 0.12) !important;
          color: #F87171 !important;
          border-color: rgba(239, 68, 68, 0.25) !important;
        }
        .theme-dark [class*="bg-[#e6f4ea]"] {
          background-color: rgba(16, 185, 129, 0.12) !important;
          color: #34D399 !important;
          border-color: rgba(16, 185, 129, 0.25) !important;
        }
        .theme-dark [class*="bg-[#edf2f6]"] {
          background-color: rgba(148, 163, 184, 0.12) !important;
          color: #CBD5E1 !important;
          border-color: rgba(148, 163, 184, 0.25) !important;
        }
        .theme-dark [class*="bg-[#fef9c3]"] {
          background-color: rgba(245, 158, 11, 0.12) !important;
          color: #FCD34D !important;
          border-color: rgba(245, 158, 11, 0.25) !important;
        }
        .theme-dark [class*="bg-[#ffedd5]"] {
          background-color: rgba(249, 115, 22, 0.12) !important;
          color: #FB923C !important;
          border-color: rgba(249, 115, 22, 0.25) !important;
        }
        .theme-dark a[class*="bg-white"],
        .theme-dark button[class*="bg-white"] {
          background-color: #1a1a1a !important;
          color: #FFFFFF !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }
        .theme-dark a[class*="bg-white"]:hover,
        .theme-dark button[class*="bg-white"]:hover {
          background-color: #222222 !important;
        }

        /* ── Sidebar Modern Premium styles ── */
        .theme-dark-sidebar {
          transition: all 0.25s ease;
        }
        .theme-dark .theme-dark-sidebar {
          background-color: #0b0c10 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
        }
        .sidebar-section-title {
          color: #9CA3AF !important;
        }
        .theme-dark .sidebar-section-title {
          color: rgba(255, 255, 255, 0.35) !important;
        }
        .theme-active-pill {
          background-color: rgba(16, 185, 129, 0.08) !important;
          color: #10B981 !important;
        }
        .theme-dark .theme-active-pill {
          background-color: rgba(16, 185, 129, 0.1) !important;
          color: #34D399 !important;
        }
        .theme-dark .theme-dark-sidebar a:hover:not(.theme-active-pill) {
          background-color: rgba(255, 255, 255, 0.04) !important;
          color: #10B981 !important;
        }
        @keyframes slideIn {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out forwards;
        }
        /* Seller top bar */
        .seller-topbar {
          background: #ffffff;
          border-bottom: 1px solid #E5E7EB;
        }
        .theme-dark .seller-topbar {
          background: #0b0c10 !important;
          border-bottom-color: rgba(255,255,255,0.08) !important;
        }
      `}</style>

      {/* ── Seller Top Bar (replaces customer Navbar) ── */}
      <header className="seller-topbar sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Logo + brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group" title="Back to storefront">
              <span className="text-xl font-black text-gray-900 tracking-tight group-hover:text-[#10B981] transition-colors">
                Jhapcham<span className="text-[#10B981]">.</span>
              </span>
            </Link>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 select-none">Seller Studio</span>
          </div>

          {/* Center: Breadcrumb */}
          <nav className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 select-none">
            <Link to="/seller/dashboard" className="hover:text-[#10B981] transition-colors">Dashboard</Link>
            {currentLabel !== 'Dashboard Overview' && (
              <>
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                <span className="text-gray-600 font-bold">{currentLabel}</span>
              </>
            )}
          </nav>

          {/* Right: Store info + actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-gray-200 hover:border-[#10B981] hover:bg-emerald-50 transition-all text-gray-500 hover:text-[#10B981]"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>

            {/* Store identity */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              {profile?.logoImagePath ? (
                <img
                  src={profile.logoImagePath.startsWith('http') ? profile.logoImagePath : `${BASE_URL}${profile.logoImagePath.startsWith('/') ? '' : '/'}${profile.logoImagePath}`}
                  alt={profile?.storeName || 'Store'}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center font-black text-xs">
                  {profile?.storeName ? profile.storeName.charAt(0).toUpperCase() : 'S'}
                </span>
              )}
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-800 leading-none">{profile?.storeName || 'Seller Studio'}</p>
                <p className="text-[10px] text-[#10B981] font-bold mt-0.5">Active Store</p>
              </div>
            </div>

            {/* Back to store link */}
            <Link
              to="/"
              className="hidden lg:flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gray-500 hover:text-[#10B981] transition-colors border border-gray-200 hover:border-[#10B981] px-3 py-1.5 rounded-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Storefront
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-5 pt-3 pb-4">
        {checkingApp ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#10B981] mb-4" />
            <p className="text-xs uppercase tracking-widest font-black text-gray-500">Verifying merchant credentials...</p>
          </div>
        ) : appStatus !== 'APPROVED' ? (
          <SellerOnboarding onApproved={fetchProfileAndStatus} />
        ) : (
          <div className="flex gap-4 items-start">
            {/* Seller Sidebar */}
            <SellerSidebar
              currentPath={location.pathname}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              profile={profile}
              onLogout={handleLogout}
            />

            {/* Simple Right Content Panel */}
            <main className="flex-1 min-w-0 w-full">
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<SellerDashboardHome />} />
                <Route path="profile" element={<SellerProfile />} />
                <Route path="products" element={<SellerProducts />} />
                <Route path="orders" element={<SellerOrders />} />
                <Route path="disputes" element={<SellerDisputes />} />
                <Route path="inventory" element={<SellerInventory />} />
                <Route path="notifications" element={<SellerNotifications />} />
                <Route path="campaigns" element={<SellerCampaigns />} />
                <Route path="promos" element={<SellerPromos />} />
                <Route path="discount-sales" element={<SellerDiscountSales />} />
                <Route path="sale-discount-list" element={<SellerSaleDiscountList />} />
                <Route path="commission" element={<SellerCommission />} />
                <Route path="inbox" element={<SellerInbox />} />
                <Route path="settings" element={<SellerSettings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </main>

          </div>
        )}
      </div>

      {/* Modern floating toast */}
      {sidebarToast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-slide-in border ${
          sidebarToast.type === 'success' 
            ? 'bg-[#10B981]/95 border-[#10B981]/25 text-white' 
            : 'bg-[#10B981]/95 border-[#10B981]/25 text-white'
        }`}>
          <span>{sidebarToast.msg}</span>
        </div>
      )}

      </div>
    </>
  );
};

export default SellerLayout;

