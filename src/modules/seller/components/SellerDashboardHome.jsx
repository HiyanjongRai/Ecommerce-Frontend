import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSellerDashboardStats, getSellerIncome, getSellerProfile, getSellerOrders, getSellerInventory } from '../services/sellerService';
import { resolveImageUrl, SectionHeader } from './SellerSectionUtils';
import { useSellerTheme } from '../hooks/useSellerTheme';

// Strip backend role prefixes from customer names (server-side concat bug)
// e.g. "admincustomer_userJohn Doe" → "John Doe"
const sanitizeName = (raw) => {
  if (!raw) return 'Customer';
  // IMPORTANT: longer patterns must come BEFORE shorter ones (admincustomer_user before admin)
  const cleaned = String(raw).replace(/^(admincustomer_user|customer_user|admin|seller_user|user_)/i, '').trim();
  return cleaned || 'Customer';
};

const SellerDashboardHome = () => {
  const { darkMode, themeClasses } = useSellerTheme();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    netProfit: 0,
    weeklySales: [],
    topSellingProducts: [],
  });
  const [recentOrdersList, setRecentOrdersList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [briefing, setBriefing] = useState({
    title: 'Daily Performance Briefing',
    status: 'GENERATING MESSAGE',
    message: 'Analyzing your store telemetry, order history, and inventory levels...',
    type: 'optimal',
    lowStock: 0,
    pendingOrders: 0
  });
  
  // Dynamic sales data states
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [viewType, setViewType] = useState('monthly'); // 'monthly' or 'weekly'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const profileRes = await getSellerProfile();
        const profileData = profileRes.data || {};
        setProfile(profileData);
        const userId = profileData.userId;
        
        const [statsRes, incomeRes, ordersRes, inventoryRes] = await Promise.all([
          getSellerDashboardStats().catch(err => { console.error(err); return { data: {} }; }),
          getSellerIncome().catch(err => { console.error(err); return { data: {} }; }),
          userId ? getSellerOrders(userId).catch(err => { console.error(err); return { data: [] }; }) : Promise.resolve({ data: [] }),
          getSellerInventory().catch(err => { console.error(err); return { data: [] }; })
        ]);
        
        const loadedOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        
        // Map real orders to the recentOrders array
        const mappedRecent = loadedOrders.slice(0, 5).map(o => ({
          id: String(o.orderId || o.id),
          product: o.productNames || 'Ordered Items',
          status: o.status || 'Pending',
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          customer: sanitizeName(o.customerName || o.userName),
          image: o.productImage ? resolveImageUrl(o.productImage) : null
        }));

        // 100% Dynamic Monthly Sales Data
        const monthlyCounts = [
          { month: 'Jan', completed: 0, canceled: 0 },
          { month: 'Feb', completed: 0, canceled: 0 },
          { month: 'Mar', completed: 0, canceled: 0 },
          { month: 'Apr', completed: 0, canceled: 0 },
          { month: 'May', completed: 0, canceled: 0 },
          { month: 'Jun', completed: 0, canceled: 0 },
          { month: 'Jul', completed: 0, canceled: 0 },
          { month: 'Aug', completed: 0, canceled: 0 },
          { month: 'Sep', completed: 0, canceled: 0 },
          { month: 'Oct', completed: 0, canceled: 0 },
          { month: 'Nov', completed: 0, canceled: 0 },
          { month: 'Dec', completed: 0, canceled: 0 },
        ];

        // 100% Dynamic Weekly Sales Data (Mon-Sun)
        const weeklyCounts = [
          { label: 'Mon', completed: 0, canceled: 0 },
          { label: 'Tue', completed: 0, canceled: 0 },
          { label: 'Wed', completed: 0, canceled: 0 },
          { label: 'Thu', completed: 0, canceled: 0 },
          { label: 'Fri', completed: 0, canceled: 0 },
          { label: 'Sat', completed: 0, canceled: 0 },
          { label: 'Sun', completed: 0, canceled: 0 },
        ];

        // Aggregate actual orders from the database
        loadedOrders.forEach(o => {
          if (!o.createdAt) return;
          const date = new Date(o.createdAt);
          
          // Monthly aggregation
          const monthIdx = date.getMonth();
          // Weekly aggregation: date.getDay() yields 0 for Sun, 1 for Mon, ..., 6 for Sat.
          // Map to Mon (idx 0), ..., Sun (idx 6)
          const rawDay = date.getDay();
          const dayIdx = rawDay === 0 ? 6 : rawDay - 1;

          const statusStr = String(o.status || '').toUpperCase();
          const isSuccess = ['DELIVERED', 'COMPLETED', 'DELIVERING', 'SHIPPED'].includes(statusStr);
          const isCancel = ['CANCELLED', 'FAILED', 'RETURNED'].includes(statusStr);

          // Update Monthly
          if (monthIdx >= 0 && monthIdx < 12) {
            if (isSuccess) monthlyCounts[monthIdx].completed += 1;
            else if (isCancel) monthlyCounts[monthIdx].canceled += 1;
            else monthlyCounts[monthIdx].completed += 1;
          }

          // Update Weekly
          if (dayIdx >= 0 && dayIdx < 7) {
            if (isSuccess) weeklyCounts[dayIdx].completed += 1;
            else if (isCancel) weeklyCounts[dayIdx].canceled += 1;
            else weeklyCounts[dayIdx].completed += 1;
          }
        });

        const totalRevenue = Number(incomeRes.data?.totalIncome ?? statsRes.data?.totalIncome ?? 0);
        const totalOrders = statsRes.data?.totalOrders || loadedOrders.length || 0;
        const activeProductsCount = statsRes.data?.activeProducts || 0;
        const vatCollected = Number(statsRes.data?.totalVatCollected ?? 0);
        const netProfit = Number(statsRes.data?.netProfit ?? (Number(incomeRes.data?.totalIncome ?? 0) - Number(incomeRes.data?.totalCommission ?? 0) + vatCollected));
        const totalCost = Number(statsRes.data?.totalCost ?? 0);
        const profitMargin = Number(statsRes.data?.profitMargin ?? 0);
        
        setStats({
          totalRevenue,
          totalOrders,
          activeProducts: activeProductsCount,
          netProfit,
          totalCost,
          profitMargin,
          weeklySales: Array.isArray(statsRes.data?.weeklySales) ? statsRes.data.weeklySales.map(Number) : [],
          topSellingProducts: Array.isArray(statsRes.data?.topSellingProducts) ? statsRes.data.topSellingProducts : [],
        });
        setRecentOrdersList(mappedRecent);
        setMonthlySalesData(monthlyCounts);
        setWeeklySalesData(weeklyCounts);

        // Store all orders and products for search
        setAllOrders(loadedOrders);
        const inventoryList = inventoryRes?.data?.content || inventoryRes?.data || [];
        setAllProducts(inventoryList);

        // Process briefing data
        let lowStock = 0;
        inventoryList.forEach(p => {
          if (p.hasVariants) {
            const variantStock = (p.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
            if (variantStock < 5) {
              lowStock++;
            }
          } else {
            if ((p.stockQuantity ?? 0) < 5) {
              lowStock++;
            }
          }
        });

        const pendingOrders = loadedOrders.filter(o => ['PENDING', 'PROCESSING', 'UNPAID'].includes(String(o.status).toUpperCase())).length;

        let briefingTitle = "Store Health: Excellent";
        let briefingStatus = "OPTIMAL";
        let briefingType = "optimal"; // 'optimal' | 'warning' | 'critical'
        let briefingMsg = "";
        let insightMsg = "";

        if (lowStock > 0) {
          briefingTitle = "Inventory Warning: Low Stock Detected";
          briefingStatus = "RESTOCK RECOMMENDED";
          briefingType = "warning";
          briefingMsg = `We detected ${lowStock} product listing${lowStock > 1 ? 's are' : ' is'} running extremely low on inventory stock. Restock soon to prevent order delays and maintain listing visibility.`;
        } else if (pendingOrders > 0) {
          briefingTitle = "Dispatch Action Required: Pending Orders";
          briefingStatus = "ORDERS WAITING";
          briefingType = "optimal";
          briefingMsg = `You have ${pendingOrders} new order${pendingOrders > 1 ? 's' : ''} waiting in the dispatch queue. Package and ship them today to keep your Jhapcham delivery score optimal!`;
        } else {
          briefingTitle = "Store Health: Optimal";
          briefingStatus = "EXCELLENT STATUS";
          briefingType = "optimal";
          briefingMsg = `Inventory levels are healthy and your active order queue is clear. Your merchant profile is in outstanding standing today!`;
        }

        // Add contextual revenue/store insights
        if (totalRevenue > 100000) {
          insightMsg = ` With Rs. ${totalRevenue.toLocaleString()} in cumulative revenue, your store is in the top tier of active sellers! Tip: Add variant options like color or storage configurations to boost conversions by up to 20%.`;
        } else if (totalOrders > 0) {
          insightMsg = ` Your shop has fulfilled ${totalOrders} order${totalOrders > 1 ? 's' : ''}. Tip: Consider launching a discount coupon campaign to boost repeat buyer engagement!`;
        } else {
          insightMsg = ` Welcome to Jhapcham! Get started by adding beautiful high-definition product listings with variants in the My Services section to attract your very first customer!`;
        }

        setBriefing({
          title: briefingTitle,
          status: briefingStatus,
          message: briefingMsg + insightMsg,
          type: briefingType,
          lowStock,
          pendingOrders
        });

      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayStats = [
    { title: 'Net Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, isPositive: true },
    { title: 'Total Cost', value: `Rs. ${stats.totalCost?.toLocaleString() || '0'}`, isPositive: false },
    { title: 'Net Profit', value: `Rs. ${stats.netProfit?.toLocaleString() || '0'}`, isPositive: true },
    { title: 'Profit Margin', value: `${stats.profitMargin || '0'}%`, isPositive: true },
  ];

  // Pick active array depending on current selection
  const activeChartData = viewType === 'monthly' ? monthlySalesData : weeklySalesData;

  // Scale height relative to peak actual dynamic value, with floor of 5
  const maxVal = Math.max(...activeChartData.map(c => Math.max(c.completed, c.canceled)), 5);

  // Dynamically calculate the Y-axis label steps
  const yAxisValues = [
    maxVal,
    Math.round(maxVal * 0.75),
    Math.round(maxVal * 0.5),
    Math.round(maxVal * 0.25),
    0
  ];

  const getStatusStyle = (status) => {
    const s = String(status).toUpperCase();
    if (['DELIVERED', 'COMPLETED', 'DELIVERING', 'SHIPPED'].includes(s)) {
      return 'text-[#05CD99] bg-[#E6FAF5]';
    } else if (['CANCELLED', 'FAILED', 'RETURNED'].includes(s)) {
      return 'text-[#EE5D50] bg-[#FDE9E8]';
    } else {
      return 'text-[#4318FF] bg-[#F4F7FE]';
    }
  };

  // Search handler
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Search in orders
    allOrders.forEach(order => {
      const orderId = String(order.orderId || order.id || '').toLowerCase();
      const customOrderId = String(order.customOrderId || '').toLowerCase();
      const customerName = String(order.customerName || order.userName || '').toLowerCase();
      const productNames = String(order.productNames || '').toLowerCase();
      const status = String(order.status || '').toLowerCase();

      if (orderId.includes(q) || customOrderId.includes(q) || customerName.includes(q) || productNames.includes(q) || status.includes(q)) {
        results.push({
          type: 'order',
          id: order.orderId || order.id,
          title: `Order #${order.customOrderId || order.orderId}`,
          subtitle: `${order.customerName || 'Customer'} - ${order.productNames || 'Items'}`,
          status: order.status,
          amount: order.totalAmount || order.sellerNetAmount || 0,
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
          data: order
        });
      }
    });

    // Search in products
    allProducts.forEach(product => {
      const productName = String(product.productName || product.name || '').toLowerCase();
      const sku = String(product.sku || product.SKU || '').toLowerCase();
      const category = String(product.category || '').toLowerCase();
      const productId = String(product.productId || product.id || '').toLowerCase();

      if (productName.includes(q) || sku.includes(q) || category.includes(q) || productId.includes(q)) {
        // Try multiple image field names used in the system
        const productImage = product.imagePaths?.[0] || product.mainImage || product.productImage || product.imagePath || product.image || product.imageUrl || product.thumbnail;
        console.log('Product found:', product.productName, 'Image:', productImage, 'All fields:', product);
        
        results.push({
          type: 'product',
          id: product.productId || product.id,
          title: product.productName || product.name,
          subtitle: `SKU: ${product.sku || 'N/A'} | Stock: ${product.stockQuantity || 0}`,
          price: product.price || product.sellingPrice || 0,
          stock: product.stockQuantity || 0,
          image: productImage,
          data: product
        });
      }
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
    setShowSearchResults(true);
  };

  const briefingCardClass = briefing.type === 'critical'
    ? 'bg-red-50/30 border-red-200 briefing-card-critical'
    : briefing.type === 'warning'
      ? 'bg-amber-50/30 border-amber-200 briefing-card-warning'
      : 'bg-emerald-50/30 border-emerald-250 briefing-card-optimal';

  const stockLinkClass = briefing.lowStock > 0
    ? 'bg-amber-500/[0.04] border-amber-500/20 text-amber-600 briefing-link-active-lowstock'
    : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 briefing-link-btn';

  const ordersLinkClass = briefing.pendingOrders > 0
    ? 'bg-emerald-500/[0.04] border-[#10B981]/20 text-[#10B981] briefing-link-active-orders'
    : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 briefing-link-btn';

  return (
    <div className={`space-y-4 max-w-[1400px] animate-in fade-in-50 duration-200 font-sans ${themeClasses.bg.primary}`}>
      <style>{`
        /* Custom briefing overrides for Jhapcham matrix dark mode */
        .theme-dark .briefing-card-optimal {
          background-color: rgba(16, 185, 129, 0.08) !important;
          border-color: rgba(16, 185, 129, 0.35) !important;
        }
        .theme-dark .briefing-card-warning {
          background-color: rgba(245, 158, 11, 0.08) !important;
          border-color: rgba(245, 158, 11, 0.35) !important;
        }
        .theme-dark .briefing-card-critical {
          background-color: rgba(239, 68, 68, 0.08) !important;
          border-color: rgba(239, 68, 68, 0.35) !important;
        }
        .theme-dark .briefing-link-btn {
          background-color: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          color: #CBD5E1 !important;
        }
        .theme-dark .briefing-link-btn:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
          color: #FFFFFF !important;
        }
        .theme-dark .briefing-link-active-lowstock {
          background-color: rgba(245, 158, 11, 0.1) !important;
          border-color: rgba(245, 158, 11, 0.3) !important;
          color: #F59E0B !important;
        }
        .theme-dark .briefing-link-active-lowstock:hover {
          background-color: rgba(245, 158, 11, 0.18) !important;
          border-color: rgba(245, 158, 11, 0.45) !important;
        }
        .theme-dark .briefing-link-active-orders {
          background-color: rgba(16, 185, 129, 0.1) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
          color: #10B981 !important;
        }
        .theme-dark .briefing-link-active-orders:hover {
          background-color: rgba(16, 185, 129, 0.18) !important;
          border-color: rgba(16, 185, 129, 0.45) !important;
        }
      `}</style>

      {/* Header — single row matching Commission header height */}
      <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-4">

          {/* Left: title + subtitle */}
          <div className="shrink-0">
            <h2 className="text-sm font-black text-gray-900 tracking-tight">Dashboard</h2>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Live store performance, order overview, and key metrics.</p>
          </div>

          {/* Center: search bar */}
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 border border-gray-200 rounded-sm px-3 py-1.5 bg-gray-50 hover:bg-white hover:border-gray-300 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="Search orders, products, customers, SKU..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                className={`flex-1 bg-transparent ${themeClasses.text.primary} border-0 outline-none text-[11px] font-semibold placeholder-gray-400`}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); }}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSearchResults(false)}></div>
                <div className={`absolute top-full left-0 right-0 mt-1 ${themeClasses.card} border ${themeClasses.border.primary} rounded-sm shadow-xl z-50 max-h-96 overflow-y-auto`}>
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (result.type === 'order') {
                          navigate(`/seller/orders?orderId=${result.id}`);
                        } else {
                          navigate(`/seller/products?productId=${result.id}`);
                        }
                        setShowSearchResults(false);
                      }}
                      className={`p-4 border-b ${themeClasses.border.primary} hover:${themeClasses.bg.secondary} cursor-pointer transition-colors last:border-b-0`}
                    >
                      {result.type === 'order' ? (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-blue-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-bold ${themeClasses.text.primary} truncate`}>{result.title}</p>
                              <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm font-black whitespace-nowrap uppercase tracking-wider">ORDER</span>
                            </div>
                            <p className={`text-xs ${themeClasses.text.secondary} truncate`}>{result.subtitle}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`text-[9px] px-2 py-1 rounded-sm font-black uppercase tracking-wider ${
                                result.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                                result.status === 'PENDING' || result.status === 'COD_PENDING' ? 'bg-amber-100 text-amber-800' :
                                result.status === 'PROCESSING' || result.status === 'PACKED' ? 'bg-blue-100 text-blue-800' :
                                result.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {result.status}
                              </span>
                              <span className={`text-xs font-black ${themeClasses.text.primary}`}>Rs. {result.amount?.toLocaleString()}</span>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {result.image ? (
                              <img
                                src={resolveImageUrl(result.image)}
                                alt={result.title}
                                className="w-16 h-16 rounded-sm object-cover border border-gray-200"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-sm bg-gray-100 flex items-center justify-center border border-gray-200">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-black ${themeClasses.text.primary} truncate text-xs`}>{result.title}</p>
                              <span className="text-[9px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-sm font-black whitespace-nowrap uppercase tracking-wider">PRODUCT</span>
                            </div>
                            <p className={`text-[10px] ${themeClasses.text.secondary} truncate`}>{result.subtitle}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-[9px] px-2 py-1 rounded-sm font-black uppercase tracking-wider bg-gray-100 text-gray-800">
                                Rs. {result.price?.toLocaleString()}
                              </span>
                              <span className={`text-[9px] font-black ${result.stock < 5 ? 'text-red-600 bg-red-50 px-2 py-1 rounded-sm' : themeClasses.text.primary}`}>
                                Stock: {result.stock}
                              </span>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {showSearchResults && searchResults.length === 0 && searchQuery && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSearchResults(false)}></div>
                <div className={`absolute top-full left-0 right-0 mt-1 ${themeClasses.card} border ${themeClasses.border.primary} rounded-sm shadow-xl z-50 p-4 text-center`}>
                  <p className={`text-[11px] font-bold ${themeClasses.text.secondary}`}>No results found for "{searchQuery}"</p>
                </div>
              </>
            )}
          </div>

          {/* Right: date badge */}
          <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>

        </div>
      </div>

      {/* Real-time executive store briefing card */}
      <div className={`border rounded-sm p-5 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all duration-300 shadow-sm ${briefingCardClass}`}>
        {/* Subtle background radar/glow decoration */}
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-xl opacity-20 pointer-events-none ${
          briefing.type === 'critical' ? 'bg-red-500' : briefing.type === 'warning' ? 'bg-amber-500' : 'bg-[#10B981]'
        }`}></div>

        <div className="flex items-start gap-4 flex-1 min-w-0 z-10">
          {/* Animated radar beacon */}
          <div className="relative shrink-0 mt-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${
              briefing.type === 'critical' 
                ? 'bg-red-500/10 text-red-500 border border-red-500/25' 
                : briefing.type === 'warning' 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' 
                  : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25'
            }`}>
              {briefing.type === 'critical' 
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                : briefing.type === 'warning' 
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>}
            </div>
            {/* Pulsing halo */}
            <span className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
              briefing.type === 'critical' ? 'bg-red-400' : briefing.type === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
            }`}></span>
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border leading-none ${
                briefing.type === 'critical' 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/25' 
                  : briefing.type === 'warning' 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' 
                    : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25'
              }`}>
                {briefing.status}
              </span>
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Live Store Briefing • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-gray-150 uppercase tracking-tight">
              {(() => {
                const storeLabel = profile?.shopName || profile?.storeName || profile?.fullName || profile?.username || '';
                return storeLabel ? `${storeLabel} • ` : '';
              })()}{briefing.title}
            </h4>
            <p className="text-[13px] text-gray-600 dark:text-zinc-350 leading-relaxed font-semibold pr-4 font-sans">
              {briefing.message}
            </p>
          </div>
        </div>

        {/* Telemetry Dashboard Quick Actions grid */}
        <div className="grid grid-cols-2 gap-2 shrink-0 w-full lg:w-auto z-10">
          <Link
            to="/seller/inventory"
            className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all text-center min-w-[95px] select-none hover:scale-[1.02] ${stockLinkClass}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span className="text-[14px] font-black mt-1 leading-none">{briefing.lowStock}</span>
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 mt-1">Low Stock</span>
          </Link>

          <Link
            to="/seller/orders"
            className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all text-center min-w-[95px] select-none hover:scale-[1.02] ${ordersLinkClass}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/></svg>
            <span className="text-[14px] font-black mt-1 leading-none">{briefing.pendingOrders}</span>
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 mt-1">Dispatch</span>
          </Link>
        </div>
      </div>
      
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {displayStats.map((stat, idx) => (
          <div key={idx} className={`${themeClasses.card} rounded-sm p-3.5 shadow-sm flex items-center justify-between transition-colors duration-250 border border-gray-200`}>
            <div>
              <h3 className={`text-[9px] font-black uppercase tracking-wider ${themeClasses.text.tertiary} mb-1`}>{stat.title}</h3>
              <div className={`text-base font-black ${themeClasses.text.primary} leading-none mb-1.5`}>
                {loading ? '...' : stat.value}
              </div>
            </div>
            {/* Mock Sparkline SVG */}
            <div className="w-16 h-8 opacity-85">
              {stat.isPositive ? (
                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M0,35 Q10,35 20,25 T40,25 T60,10 T80,15 T100,5" fill="none" stroke="url(#greenGrad)" strokeWidth="3.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M0,5 Q20,10 40,5 T60,20 T80,15 T100,35" fill="none" stroke="url(#redGrad)" strokeWidth="3.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm transition-colors duration-250">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-3 relative">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-800">Order Overview</h3>
            <div className="flex gap-3 mt-1.5 text-[11px] font-black uppercase tracking-wider text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600"></div>
                <span>Canceled</span>
              </div>
            </div>
          </div>
          
          {/* Header Metric Overlay */}
          {selectedMonthIndex !== null && activeChartData[selectedMonthIndex] && (
            <div className="px-3 py-1.5 rounded-sm bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 select-none">
              <span>{activeChartData[selectedMonthIndex].label || activeChartData[selectedMonthIndex].month}</span>
              <span className="text-emerald-600">✓ {activeChartData[selectedMonthIndex].completed} Completed</span>
              <span className="text-gray-400">✕ {activeChartData[selectedMonthIndex].canceled} Canceled</span>
            </div>
          )}

          {/* Interactive Mode Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider transition-colors hover:bg-gray-50 select-none"
            >
              <span>{viewType === 'monthly' ? 'Monthly' : 'Weekly'}</span>
              <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-sm shadow-lg z-50 py-1 text-[9px] font-black uppercase tracking-wider animate-in fade-in zoom-in-95 duration-100 select-none overflow-hidden">
                  <button
                    onClick={() => { setViewType('monthly'); setSelectedMonthIndex(null); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${viewType === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    Monthly View
                  </button>
                  <button
                    onClick={() => { setViewType('weekly'); setSelectedMonthIndex(null); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${viewType === 'weekly' ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    Weekly View
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-[160px] mt-4 flex items-end justify-between px-2 relative select-none">
          {/* Y-axis grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-[20px] z-0">
            {yAxisValues.map((val, i) => (
              <div key={i} className="flex items-center w-full">
                <span className="text-gray-400 text-[9px] font-bold w-8 -ml-8">{val}</span>
                <div className="h-[1px] w-full bg-gray-100/50 ml-2"></div>
              </div>
            ))}
          </div>

          {/* Interactive Chart Columns */}
          <div className="relative z-10 w-full h-[140px] flex items-end justify-between px-1 pb-1">
            {activeChartData.map((data, i) => {
              const hCompleted = (data.completed / maxVal) * 100;
              const hCanceled = (data.canceled / maxVal) * 100;
              const isSelected = selectedMonthIndex === i;

              return (
                <div 
                  key={i} 
                  onMouseEnter={() => setSelectedMonthIndex(i)}
                  onMouseLeave={() => setSelectedMonthIndex(null)}
                  onClick={() => setSelectedMonthIndex(i)}
                  className={`flex flex-col items-center gap-2 h-full justify-end group cursor-pointer w-full relative transition-all duration-150 px-0.5 ${
                    isSelected ? 'bg-[#10B981]/5 rounded-sm border border-dashed border-[#10B981]/20 scale-105' : ''
                  }`}
                >
                  {/* Tooltip */}
                  {isSelected && (
                    <div className="absolute -top-12 z-50 bg-gray-900 text-white px-2.5 py-1.5 rounded-sm shadow-xl text-[9px] font-black uppercase tracking-wider border border-gray-700 flex flex-col gap-0.5 min-w-[80px] text-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-emerald-400">{data.label || data.month}</span>
                      <span>✓ {data.completed} Done</span>
                      <span className="text-gray-400">✕ {data.canceled} Fail</span>
                    </div>
                  )}

                  <div className="flex items-end gap-[3px] h-full pb-0.5 w-full justify-center">
                    {/* Unified Green Active bar */}
                    <div 
                      className={`w-1.5 bg-[#10B981] rounded-t-sm transition-all duration-300 ${isSelected ? 'bg-[#34D399] shadow-md shadow-[#10B981]/30 scale-x-125' : 'group-hover:bg-[#34D399]'}`} 
                      style={{ height: `${hCompleted}%` }}
                    ></div>
                    {/* Unified Gray Canceled bar */}
                    <div 
                      className={`w-1.5 bg-gray-300 dark:bg-zinc-700 rounded-t-sm transition-all duration-300 ${isSelected ? 'bg-gray-400 dark:bg-zinc-500 scale-x-125' : 'group-hover:bg-gray-400 dark:group-hover:bg-zinc-500'}`} 
                      style={{ height: `${hCanceled}%` }}
                    ></div>
                  </div>
                  <span className={`text-[10.5px] font-black uppercase tracking-wider transition-colors ${isSelected ? 'text-[#10B981]' : 'text-gray-400'}`}>
                    {data.label || data.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm transition-colors duration-250">
        <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-3">
          <h3 className="text-[9px] font-black uppercase tracking-wider text-gray-400">Recent Purchase History</h3>
          <Link to="/seller/orders" className="flex items-center gap-1.5 text-gray-700 bg-white border border-gray-200 px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider transition-colors hover:bg-gray-50">
            View All
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-[12px] font-bold text-gray-400">Loading purchase history...</div>
          ) : recentOrdersList.length === 0 ? (
            <div className="text-center py-10 text-[12px] font-bold text-gray-400">No purchase history found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 pr-2">No</th>
                  <th className="py-2.5 px-2">Product Name</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-2 text-right">Buyer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px] font-bold text-gray-700">
                {recentOrdersList.map((order, index) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pr-2 font-black text-gray-800 text-[10px]">#{order.customOrderId || order.id}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-sm bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                          {order.image ? (
                            <img src={order.image} alt="" className="w-full h-full object-contain" onError={(e) => { e.target.style.display='none'; }}/>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                          )}
                        </div>
                        <span className="font-black text-gray-800 max-w-[250px] truncate uppercase tracking-wide text-[11.5px]">{order.product}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-sm border inline-block ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-400 font-bold text-[11px] uppercase tracking-wider">{order.date}</td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="font-black text-gray-800 text-[11.5px]">{order.customer}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default SellerDashboardHome;
