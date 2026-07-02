import React from 'react';
import {
  TrendingUp, Clock, Image as ImageIcon, Package, Zap,
  DollarSign, Sparkles, AlertCircle,
} from 'lucide-react';
import { imgSrc } from './InventoryComponents';

const T = {
  green:  '#22C55E',
  text:   '#111827',
  sub:    '#6B7280',
  border: '#E5E7EB',
  warn:   '#FB923C',
  danger: '#EF4444',
};

// ─── Insight item in a list ──────────────────────────────────────────────────
function InsightItem({ product, badge, sub, onEdit, isDark }) {
  const img = product.imagePaths?.[0] || product.mainImage;
  return (
    <div
      className={`flex items-center gap-3 py-2.5 border-b last:border-b-0 cursor-pointer group transition-colors -mx-3 px-3 rounded-xl ${
        isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
      }`}
      onClick={() => onEdit(product)}
    >
      <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border shrink-0 ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-[#E5E7EB]'
      }`}>
        {img
          ? <img src={imgSrc(img)} alt={product.name} className="w-full h-full object-cover" />
          : <Package className="w-4 h-4 text-gray-300" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-bold truncate group-hover:text-emerald-600 transition-colors ${
          isDark ? 'text-white' : 'text-[#111827]'
        }`}>
          {product.name}
        </p>
        <p className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{sub}</p>
      </div>
      {badge && (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
          {badge.label}
        </span>
      )}
    </div>
  );
}

// ─── Insight card shell ──────────────────────────────────────────────────────
function InsightCard({ icon: Icon, title, accent, children, isEmpty, emptyMsg, isDark }) {
  return (
    <div className={`border rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] ${
      isDark
        ? 'bg-zinc-950/45 border-white/[0.08] text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
        : 'bg-white border-[#E5E7EB]'
    }`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
          isDark ? 'border-white/10' : 'border-gray-200'
        }`}
          style={{ background: accent + '14', borderColor: accent + '30', color: accent }}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className={`text-[13px] font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{title}</h3>
      </div>
      {isEmpty ? (
        <p className={`text-[12px] py-4 text-center ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{emptyMsg || 'No items.'}</p>
      ) : children}
    </div>
  );
}

/**
 * InventoryInsights — Smart product intelligence section.
 * Shows actionable lists derived from the product catalog.
 */
export default function InventoryInsights({ products, onEdit, isDark }) {
  if (!products || products.length === 0) return null;

  const now = Date.now();
  const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

  const getQty = (p) =>
    p.hasVariants
      ? (p.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0)
      : (p.stockQuantity ?? 0);

  const getValue = (p) => getQty(p) * Number(p.price || 0);

  // ── Derived lists ────────────────────────────────────────────────────────
  const lowStock = products
    .filter(p => !p.hasVariants && getQty(p) > 0 && getQty(p) <= 4)
    .sort((a, b) => getQty(a) - getQty(b))
    .slice(0, 4);

  const outOfStock = products
    .filter(p => !p.hasVariants && getQty(p) === 0)
    .slice(0, 4);

  const missingImages = products
    .filter(p => !p.imagePaths?.length && !p.mainImage)
    .slice(0, 4);

  const highestValue = [...products]
    .filter(p => !p.hasVariants)
    .sort((a, b) => getValue(b) - getValue(a))
    .slice(0, 4);

  const notUpdated = products
    .filter(p => {
      const updated = p.updatedAt || p.lastUpdated;
      if (!updated) return true;
      return now - new Date(updated).getTime() > DAYS_30;
    })
    .slice(0, 4);

  const newest = [...products]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
          isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-[#F0FDF4] border-[#BBF7D0]'
        }`}>
          <Sparkles className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h2 className={`text-[16px] font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>Inventory Intelligence</h2>
          <p className={`text-[12px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Actionable insights to help you manage stock proactively.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Critical stock */}
        <InsightCard icon={AlertCircle} title="Critical Stock (1–4 units)" accent={T.danger} isDark={isDark}
          isEmpty={lowStock.length === 0} emptyMsg="No critical stock items — great job!">
          {lowStock.map(p => (
            <InsightItem key={p.id || p.productId} product={p} onEdit={onEdit} isDark={isDark}
              sub={`${getQty(p)} units remaining`}
              badge={{ label: `${getQty(p)} left`, color: T.danger, bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' }} />
          ))}
        </InsightCard>

        {/* Out of stock */}
        <InsightCard icon={Package} title="Out of Stock" accent={T.sub} isDark={isDark}
          isEmpty={outOfStock.length === 0} emptyMsg="All products in stock!">
          {outOfStock.map(p => (
            <InsightItem key={p.id || p.productId} product={p} onEdit={onEdit} isDark={isDark}
              sub={`Rs. ${Number(p.price || 0).toLocaleString()} · Restock needed`}
              badge={{ label: 'Restocking', color: isDark ? '#9CA3AF' : T.sub, bg: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', border: isDark ? 'rgba(255,255,255,0.1)' : T.border }} />
          ))}
        </InsightCard>

        {/* Missing images */}
        <InsightCard icon={ImageIcon} title="Missing Product Images" accent="#38BDF8" isDark={isDark}
          isEmpty={missingImages.length === 0} emptyMsg="All products have images!">
          {missingImages.map(p => (
            <InsightItem key={p.id || p.productId} product={p} onEdit={onEdit} isDark={isDark}
              sub="No image uploaded — impacts conversions"
              badge={{ label: 'No Image', color: '#0369A1', bg: isDark ? 'rgba(56, 189, 248, 0.15)' : '#F0F9FF', border: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD' }} />
          ))}
        </InsightCard>

        {/* Highest inventory value */}
        <InsightCard icon={DollarSign} title="Highest Inventory Value" accent="#8B5CF6" isDark={isDark}
          isEmpty={highestValue.length === 0} emptyMsg="No products with stock.">
          {highestValue.map(p => (
            <InsightItem key={p.id || p.productId} product={p} onEdit={onEdit} isDark={isDark}
              sub={`${getQty(p)} units × Rs. ${Number(p.price || 0).toLocaleString()}`}
              badge={{ label: `Rs. ${getValue(p).toLocaleString()}`, color: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF', border: isDark ? 'rgba(139, 92, 246, 0.3)' : '#DDD6FE' }} />
          ))}
        </InsightCard>

        {/* Not updated in 30 days */}
        <InsightCard icon={Clock} title="Not Updated in 30+ Days" accent={T.warn} isDark={isDark}
          isEmpty={notUpdated.length === 0} emptyMsg="All products recently updated.">
          {notUpdated.map(p => {
            const lastDate = p.updatedAt || p.lastUpdated;
            const daysAgo = lastDate
              ? Math.floor((now - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
              : null;
            return (
              <InsightItem key={p.id || p.productId} product={p} onEdit={onEdit} isDark={isDark}
                sub={daysAgo !== null ? `Last updated ${daysAgo} days ago` : 'Never updated'}
                badge={{ label: daysAgo !== null ? `${daysAgo}d ago` : 'Stale', color: T.warn, bg: isDark ? 'rgba(251, 146, 60, 0.15)' : '#FFF7ED', border: isDark ? 'rgba(251, 146, 60, 0.3)' : '#FED7AA' }} />
            );
          })}
        </InsightCard>

        {/* Newest products */}
        <InsightCard icon={Zap} title="Recently Added Products" accent={T.green} isDark={isDark}
          isEmpty={newest.length === 0} emptyMsg="No products yet.">
          {newest.map(p => {
            const created = p.createdAt;
            const daysAgo = created
              ? Math.floor((now - new Date(created).getTime()) / (1000 * 60 * 60 * 24))
              : null;
            return (
              <InsightItem key={p.id || p.productId} product={p} onEdit={onEdit} isDark={isDark}
                sub={`Rs. ${Number(p.price || 0).toLocaleString()} · ${p.category || 'Uncategorized'}`}
                badge={daysAgo !== null
                  ? { label: daysAgo === 0 ? 'Today' : `${daysAgo}d ago`, color: T.green, bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4', border: isDark ? 'rgba(34, 197, 94, 0.3)' : '#BBF7D0' }
                  : null
                } />
            );
          })}
        </InsightCard>
      </div>
    </div>
  );
}
