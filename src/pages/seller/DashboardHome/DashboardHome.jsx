import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSellerDashboardStats, getSellerIncome, getSellerProfile,
  getSellerOrders, getSellerInventory, getUnreadMessageCount,
  getSellerCommissions
} from '../../../services/sellerApi';
import { resolveImageUrl } from '../SectionUtils/SectionUtils';
import { useSellerTheme } from '../../../hooks/useSellerTheme';

// Modular Dashboard Subcomponents
import DashboardHeader from '../Dashboard/components/DashboardHeader';
import CommissionBanner from '../Dashboard/components/CommissionBanner';
import KpiCards from '../Dashboard/components/KpiCards';
import RecentOrders from '../Dashboard/components/RecentOrders';
import ActionCenter from '../Dashboard/components/ActionCenter';
import StoreHealthCard from '../Dashboard/components/StoreHealthCard';
import QuickActionGrid from '../Dashboard/components/QuickActionGrid';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sanitizeName = (raw) => {
  if (!raw) return 'Customer';
  const cleaned = String(raw).replace(/^(admincustomer_user|customer_user|admin|seller_user|user_)/i, '').trim();
  return cleaned || 'Customer';
};

// ─── Component ───────────────────────────────────────────────────────────────
const SellerDashboardHome = () => {
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;
  const navigate = useNavigate();

  // Curated color system matched to Seller Earning/Commission ledger page
  const colors = {
    primaryGreen: '#16A34A',
    background: isDark ? '#0b0c10' : '#F9FAFB',
    cardBg: isDark ? 'rgba(9, 9, 11, 0.45)' : '#FFFFFF',
    textMain: isDark ? '#FFFFFF' : '#111827',
    textSec: isDark ? '#9CA3AF' : '#6B7280',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    success: '#22C55E'
  };

  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, activeProducts: 0, netProfit: 0,
    totalCost: 0, profitMargin: 0, weeklySales: [], topSellingProducts: [],
  });
  const [recentOrdersList, setRecentOrdersList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [briefing, setBriefing] = useState({
    title: 'Daily Performance Briefing',
    status: 'GENERATING',
    message: 'Analyzing store telemetry...',
    type: 'optimal', lowStock: 0, pendingOrders: 0
  });

  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [allOrders, setAllOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [badges, setBadges] = useState({ inbox: 0 });

  // ── Data fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const profileRes = await getSellerProfile();
        const profileData = profileRes.data || {};
        setProfile(profileData);
        const userId = profileData.userId;

        const [statsRes, incomeRes, ordersRes, inventoryRes, unreadRes] = await Promise.all([
          getSellerDashboardStats().catch(err => { console.error(err); return { data: {} }; }),
          getSellerIncome().catch(err => { console.error(err); return { data: {} }; }),
          userId ? getSellerOrders(userId).catch(err => { console.error(err); return { data: [] }; }) : Promise.resolve({ data: [] }),
          getSellerInventory().catch(err => { console.error(err); return { data: [] }; }),
          getUnreadMessageCount().catch(err => { console.error(err); return { data: 0 }; })
        ]);

        const unreadCount = typeof unreadRes?.data === 'number' ? unreadRes.data : (unreadRes?.data?.count ?? 0);
        setBadges({ inbox: unreadCount });

        const loadedOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];

        const mappedRecent = loadedOrders.slice(0, 5).map(o => ({
          id:        String(o.orderId || o.id),
          displayId: String(o.customOrderId || o.orderId || o.id),
          product:   o.productNames || 'Ordered Items',
          status:    o.status || 'Pending',
          date:      o.createdAt
            ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A',
          customer:  sanitizeName(o.customerName || o.userName),
          image:     o.productImage ? resolveImageUrl(o.productImage) : null,
          amount:    o.totalAmount || o.sellerNetAmount || 0
        }));

        const totalRevenue        = Number(incomeRes.data?.totalIncome ?? statsRes.data?.totalIncome ?? 0);
        const totalOrders         = statsRes.data?.totalOrders || loadedOrders.length || 0;
        const activeProductsCount = statsRes.data?.activeProducts || 0;
        const vatCollected        = Number(statsRes.data?.totalVatCollected ?? 0);
        const netProfit           = Number(statsRes.data?.netProfit ?? (Number(incomeRes.data?.totalIncome ?? 0) - Number(incomeRes.data?.totalCommission ?? 0) + vatCollected));
        const totalCost           = Number(statsRes.data?.totalCost ?? 0);
        const profitMargin        = Number(statsRes.data?.profitMargin ?? 0);

        setStats({
          totalRevenue, totalOrders, activeProducts: activeProductsCount,
          netProfit, totalCost, profitMargin,
          weeklySales:        Array.isArray(statsRes.data?.weeklySales) ? statsRes.data.weeklySales.map(Number) : [],
          topSellingProducts: Array.isArray(statsRes.data?.topSellingProducts) ? statsRes.data.topSellingProducts : [],
        });
        setRecentOrdersList(mappedRecent);
        setAllOrders(loadedOrders);

        const inventoryList = inventoryRes?.data?.content || inventoryRes?.data || [];
        setAllProducts(inventoryList);

        // Briefing
        let lowStock = 0;
        inventoryList.forEach(p => {
          const stock = p.hasVariants
            ? (p.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
            : (p.stockQuantity ?? 0);
          if (stock < 5) lowStock++;
        });

        const pendingOrders = loadedOrders.filter(o =>
          ['PENDING','PROCESSING','UNPAID'].includes(String(o.status).toUpperCase())
        ).length;

        let title, status, type, msg;
        if (lowStock > 0) {
          title  = 'Inventory Warning: Low Stock Detected';
          status = 'RESTOCK RECOMMENDED';
          type   = 'warning';
          msg    = `${lowStock} product listing${lowStock > 1 ? 's are' : ' is'} running low. Restock soon to prevent order delays.`;
        } else if (pendingOrders > 0) {
          title  = 'Dispatch Action Required';
          status = 'ORDERS WAITING';
          type   = 'optimal';
          msg    = `${pendingOrders} order${pendingOrders > 1 ? 's' : ''} waiting in dispatch. Ship today to keep delivery scores optimal!`;
        } else {
          title  = 'Store Health: Optimal';
          status = 'EXCELLENT STATUS';
          type   = 'optimal';
          msg    = 'Inventory levels are healthy and your active order queue is clear.';
        }

        setBriefing({ title, status, message: msg, type, lowStock, pendingOrders });
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch commissions separately
  useEffect(() => {
    getSellerCommissions()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        setCommissions(list);
      })
      .catch(() => setCommissions([]));
  }, []);

  // ── Commission summary ───────────────────────────────────────────────────────
  const commSummary = useMemo(() => {
    const statusStr = (i) => String(i.status || i.commissionStatus || 'DUE').toUpperCase();
    const commPayable = (i) => Number(i.commissionEarned || i.commissionAmount || 0) + Number(i.fineAmount || 0);
    const netEarnings = (i) => Number(i.finalSellerEarnings || i.netProfitAmount || i.netAmount || 0);
    return {
      due:      commissions.filter(i => statusStr(i) !== 'PAID').reduce((s, i) => s + commPayable(i), 0),
      paid:     commissions.filter(i => statusStr(i) === 'PAID').reduce((s, i) => s + commPayable(i), 0),
      totalNet: commissions.reduce((s, i) => s + netEarnings(i), 0),
      totalVat: commissions.reduce((s, i) => s + Number(i.vatPayableAmount || i.vatAmount || 0), 0),
      count:    commissions.length,
    };
  }, [commissions]);

  // ── Calculated metrics ───────────────────────────────────────────────────────
  const returnsCount = useMemo(() => {
    return allOrders.filter(o => ['RETURNED', 'RETURN_REQUESTED'].includes(String(o.status).toUpperCase())).length;
  }, [allOrders]);

  const cancellationsCount = useMemo(() => {
    return allOrders.filter(o => ['CANCELLED', 'CANCELLATION_REQUESTED', 'FAILED'].includes(String(o.status).toUpperCase())).length;
  }, [allOrders]);

  const refundRequestsCount = useMemo(() => {
    return allOrders.filter(o => ['RETURNED', 'REFUNDED', 'RETURN_REQUESTED'].includes(String(o.status).toUpperCase())).length;
  }, [allOrders]);

  const firstPendingOrder = useMemo(() => {
    return allOrders.find(o => ['PENDING', 'PROCESSING', 'UNPAID', 'COD_PENDING', 'INITIATED'].includes(String(o.status).toUpperCase()));
  }, [allOrders]);

  const lowStockCount = useMemo(() => {
    return allProducts.filter(p => {
      const stock = p.hasVariants
        ? (p.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
        : (p.stockQuantity ?? 0);
      return stock > 0 && stock < 5;
    }).length;
  }, [allProducts]);

  const outOfStockCount = useMemo(() => {
    return allProducts.filter(p => {
      const stock = p.hasVariants
        ? (p.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
        : (p.stockQuantity ?? 0);
      return stock === 0;
    }).length;
  }, [allProducts]);

  const cancellationRate = useMemo(() => {
    const total = allOrders.length;
    if (total === 0) return '0%';
    const cancelled = allOrders.filter(o => ['CANCELLED', 'FAILED'].includes(String(o.status).toUpperCase())).length;
    return ((cancelled / total) * 100).toFixed(1) + '%';
  }, [allOrders]);

  // ── Search Handler ───────────────────────────────────────────────────────────
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); setShowSearchResults(false); return; }

    const q = query.toLowerCase();
    const results = [];

    allOrders.forEach(order => {
      const match = [
        String(order.orderId || order.id || ''),
        String(order.customOrderId || ''),
        String(order.customerName || order.userName || ''),
        String(order.productNames || ''),
        String(order.status || ''),
      ].some(s => s.toLowerCase().includes(q));

      if (match) {
        results.push({
          type: 'order',
          id: order.orderId || order.id,
          title: `Order #${order.customOrderId || order.orderId}`,
          subtitle: `${order.customerName || 'Customer'} — ${order.productNames || 'Items'}`,
          status: order.status,
          amount: order.totalAmount || order.sellerNetAmount || 0,
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
          data: order
        });
      }
    });

    allProducts.forEach(product => {
      const match = [
        String(product.productName || product.name || ''),
        String(product.sku || product.SKU || ''),
        String(product.category || ''),
        String(product.productId || product.id || ''),
      ].some(s => s.toLowerCase().includes(q));

      if (match) {
        const img = product.imagePaths?.[0] || product.mainImage || product.productImage || product.imageUrl || product.thumbnail;
        results.push({
          type: 'product',
          id: product.productId || product.id,
          title: product.productName || product.name,
          subtitle: `SKU: ${product.sku || 'N/A'} | Stock: ${product.stockQuantity || 0}`,
          price: product.price || product.sellingPrice || 0,
          stock: product.stockQuantity || 0,
          image: img,
          data: product
        });
      }
    });

    setSearchResults(results.slice(0, 8));
    setShowSearchResults(true);
  };

  const storeLabel = profile?.shopName || profile?.storeName || profile?.fullName || profile?.username || 'Seller';
  const todayDateString = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div 
      className="animate-in fade-in-50 duration-200 pb-12" 
      style={{
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px', 
        backgroundColor: colors.background, 
        color: colors.textMain,
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      <style>{`
        .sc-card {
          background-color: ${colors.cardBg};
          border: 1px solid ${colors.border};
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          padding: 24px;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sc-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          border-color: ${isDark ? 'rgba(255,255,255,0.15)' : '#C3C6CB'};
        }
        
        /* Table responsive classes */
        @media (max-width: 768px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: block !important; }
        }
        @media (min-width: 769px) {
          .desktop-table { display: table !important; }
          .mobile-cards { display: none !important; }
        }
      `}</style>

      {/* ── HEADER (Integrated greeting, search, actions) ── */}
      <DashboardHeader 
        storeLabel={storeLabel} 
        todayDateString={todayDateString} 
        profile={profile}
        colors={colors}
        isDark={isDark}
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
      />

      {/* ── Platform Commission Banner ── */}
      <CommissionBanner 
        dueAmount={commSummary.due} 
        colors={colors} 
        isDark={isDark} 
      />

      {/* ── LEVEL 1: Business Overview ── */}
      <KpiCards 
        totalRevenue={stats.totalRevenue}
        totalOrders={stats.totalOrders}
        pendingDispatch={briefing.pendingOrders}
        availableBalance={Math.max(0, commSummary.totalNet - commSummary.due)}
        commissionDue={commSummary.due}
        colors={colors}
        isDark={isDark}
      />

      {/* ── LEVEL 2: Recent Orders ── */}
      <RecentOrders 
        recentOrdersList={recentOrdersList} 
        loading={loading} 
        colors={colors} 
        isDark={isDark} 
      />

      {/* ── LEVEL 3: Operational Center & Store Health ── */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          gap: '24px', 
          width: '100%',
          alignItems: 'stretch'
        }}
      >
        <div style={{ flex: 1, minWidth: '320px' }}>
          <ActionCenter 
            lowStockCount={lowStockCount}
            refundRequestsCount={refundRequestsCount}
            pendingDispatchCount={briefing.pendingOrders}
            returnsCount={returnsCount}
            unreadMessagesCount={badges.inbox}
            activeProductsCount={stats.activeProducts || allProducts.length || 24}
            colors={colors}
            isDark={isDark}
          />
        </div>
        
        <div style={{ flex: 1, minWidth: '320px' }}>
          <StoreHealthCard 
            cancellationRate={cancellationRate} 
            lowStockCount={lowStockCount}
            outOfStockCount={outOfStockCount}
            colors={colors} 
            isDark={isDark} 
          />
        </div>
      </div>

      {/* ── QUICK ACTIONS (horizontal row of compact action buttons) ── */}
      <QuickActionGrid 
        colors={colors} 
        isDark={isDark} 
        pendingOrder={firstPendingOrder}
      />
    </div>
  );
};

export default SellerDashboardHome;
