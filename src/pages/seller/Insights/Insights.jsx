import React, { useState, useEffect, useMemo } from 'react';
import {
  getSellerDashboardStats, getSellerInventory, getSellerOrders, getSellerProfile
} from '../../../services/sellerApi';
import { useSellerTheme } from '../../../hooks/useSellerTheme';
import { Sparkles, TrendingUp, TrendingDown, Tag, Package, Lightbulb, AlertTriangle } from 'lucide-react';
import { SectionHeader } from '../SectionUtils/SectionUtils';

const SellerInsights = () => {
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;

  const colors = {
    primaryGreen: '#22C55E',
    background: isDark ? '#0d0d0d' : '#F9FAFB',
    cardBg: isDark ? '#111111' : '#FFFFFF',
    textMain: isDark ? '#FFFFFF' : '#111827',
    textSec: isDark ? '#9CA3AF' : '#6B7280',
    border: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
    warning: '#FB923C',
    error: '#EF4444',
    info: '#38BDF8',
    success: '#22C55E'
  };

  const [stats, setStats] = useState({ topSellingProducts: [] });
  const [allProducts, setAllProducts] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsightsData = async () => {
      try {
        const profileRes = await getSellerProfile().catch(() => ({ data: {} }));
        const userId = profileRes.data?.userId;

        const [statsRes, inventoryRes, ordersRes] = await Promise.all([
          getSellerDashboardStats().catch(() => ({ data: {} })),
          getSellerInventory().catch(() => ({ data: [] })),
          userId ? getSellerOrders(userId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
        ]);

        const inventoryList = inventoryRes?.data?.content || inventoryRes?.data || [];
        const loadedOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];

        setAllProducts(inventoryList);
        setAllOrders(loadedOrders);

        setStats({
          topSellingProducts: Array.isArray(statsRes.data?.topSellingProducts) ? statsRes.data.topSellingProducts : [],
        });
      } catch (err) {
        console.error('Failed to load insights data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsightsData();
  }, []);

  // ── Calculated metrics ───────────────────────────────────────────────────────
  const topSellingProduct = useMemo(() => {
    return stats.topSellingProducts?.[0]?.productName || stats.topSellingProducts?.[0]?.name || 'N/A';
  }, [stats.topSellingProducts]);

  const bestCategory = useMemo(() => {
    const categoryCounts = allProducts.reduce((acc, p) => {
      if (p.category) {
        acc[p.category] = (acc[p.category] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.keys(categoryCounts).length > 0
      ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
      : 'N/A';
  }, [allProducts]);

  const lowestStockProductObj = useMemo(() => {
    return allProducts
      .filter(p => {
        const stock = p.hasVariants
          ? (p.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
          : (p.stockQuantity ?? 0);
        return stock > 0;
      })
      .sort((a, b) => {
        const stockA = a.hasVariants ? (a.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0) : (a.stockQuantity ?? 0);
        const stockB = b.hasVariants ? (b.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0) : (b.stockQuantity ?? 0);
        return stockA - stockB;
      })[0];
  }, [allProducts]);

  const lowestStockProduct = useMemo(() => {
    return lowestStockProductObj?.productName || lowestStockProductObj?.name || 'N/A';
  }, [lowestStockProductObj]);

  const slowMovingProductObj = useMemo(() => {
    return allProducts
      .filter(p => {
        const stock = p.hasVariants
          ? (p.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
          : (p.stockQuantity ?? 0);
        return stock >= 20;
      })
      .sort((a, b) => {
        const stockA = a.hasVariants ? (a.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0) : (a.stockQuantity ?? 0);
        const stockB = b.hasVariants ? (b.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0) : (b.stockQuantity ?? 0);
        return stockB - stockA;
      })[0];
  }, [allProducts]);

  const slowMovingProduct = useMemo(() => {
    return slowMovingProductObj?.productName || slowMovingProductObj?.name || 'N/A';
  }, [slowMovingProductObj]);

  const insightsRecommendations = useMemo(() => {
    const list = [];
    if (lowestStockProductObj) {
      list.push({
        type: 'restock',
        action: `Restock ${lowestStockProductObj.productName || lowestStockProductObj.name}`,
        desc: `Only ${lowestStockProductObj.stockQuantity || 1} units left. Restock now to prevent stockouts.`
      });
    }
    if (allProducts.length > 0 && allOrders.length > 5) {
      list.push({
        type: 'campaign',
        action: 'Increase campaign budget',
        desc: 'Convert views into sales by joining the upcoming seasonal shopping festival.'
      });
    }
    const noImgProduct = allProducts.find(p => !p.imagePaths || p.imagePaths.length === 0);
    if (noImgProduct) {
      list.push({
        type: 'images',
        action: `Improve product images for ${noImgProduct.productName || noImgProduct.name}`,
        desc: 'Adding high-quality visual content increases customer trust and click-through rates by 40%.'
      });
    }
    if (list.length === 0) {
      list.push({
        type: 'create',
        action: 'Create discount coupon to drive first sales',
        desc: 'Sellers with coupons observe a 25% increase in purchase conversion rates.'
      });
    }
    return list;
  }, [lowestStockProductObj, allProducts, allOrders.length]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <div style={{ width: '24px', height: '24px', border: `3px solid ${colors.border}`, borderTopColor: colors.primaryGreen, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '12px', fontWeight: '800', uppercase: 'true', tracking: '0.15em', color: colors.textSec }}>Analyzing catalog metrics...</span>
      </div>
    );
  }

  return (
    <div 
      style={{
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px', 
        backgroundColor: colors.background, 
        color: colors.textMain,
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── Premium Gradient Page Header Banner ── */}
      <SectionHeader 
        title="Strategic Intelligence Hub"
        subtitle="Leverage business intelligence models and catalog telemetry to optimize sales"
        tag="Seller Strategic Insights"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Performance indicators */}
        <div className="sc-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: colors.textSec, margin: 0, textTransform: 'uppercase' }}>
            Listing Indicators
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Top Selling Product', value: topSellingProduct, icon: TrendingUp, color: colors.primaryGreen },
              { label: 'Best Performing Category', value: bestCategory, icon: Tag, color: colors.info },
              { label: 'Lowest Stock Listing', value: lowestStockProduct, icon: AlertTriangle, color: colors.warning },
              { label: 'Slow Moving Product', value: slowMovingProduct, icon: TrendingDown, color: colors.error }
            ].map((ind, idx) => {
              const Icon = ind.icon;
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: idx === 3 ? 'none' : `1px solid ${colors.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justify: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: ind.color, justifyContent: 'center' }}>
                      <Icon size={14} />
                    </div>
                    <span style={{ fontSize: '13px', color: colors.textSec }}>
                      {ind.label}
                    </span>
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '13px', color: colors.textMain, maxWidth: '180px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ind.value}>
                    {ind.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="sc-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: colors.primaryGreen }} />
            <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: colors.textSec, margin: 0, textTransform: 'uppercase' }}>
              Actionable AI Recommendations
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insightsRecommendations.map((rec, index) => {
              let badgeColor = colors.primaryGreen;
              let badgeText = 'Inventory';
              if (rec.type === 'campaign') { badgeColor = '#A855F7'; badgeText = 'Growth'; }
              if (rec.type === 'images') { badgeColor = colors.info; badgeText = 'Quality'; }

              return (
                <div 
                  key={index} 
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <span 
                    style={{ 
                      fontSize: '9px', 
                      fontWeight: '800', 
                      textTransform: 'uppercase', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      backgroundColor: `${badgeColor}15`,
                      color: badgeColor,
                      marginTop: '2px'
                    }}
                  >
                    {badgeText}
                  </span>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: '800', color: colors.textMain, margin: 0 }}>{rec.action}</h5>
                    <p style={{ fontSize: '11.5px', color: colors.textSec, marginTop: '2px', margin: '2px 0 0 0', lineHeight: '1.4' }}>{rec.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SellerInsights;
