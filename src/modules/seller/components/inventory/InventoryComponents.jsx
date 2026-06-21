import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { BASE_URL } from '../../../../shared/api/apiClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const imgSrc = (p) =>
  p?.startsWith('http') ? p : `${BASE_URL}${p?.startsWith('/') ? '' : '/'}${p}`;

// ─── StatusPill ───────────────────────────────────────────────────────────────

export const StatusPill = ({ status, isDark, qty }) => {
  const s = (status || '').toUpperCase();
  const isOutOfStock = qty === 0;
  const isLowStock = qty <= 5 && qty > 0;

  if (isOutOfStock) {
    return (
      <span className="inline-flex items-center gap-2 text-[11.5px] font-bold px-3.5 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-500/20 text-red-600 dark:text-red-400 select-none h-[38px]">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Out of Stock
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className="inline-flex items-center gap-2 text-[11.5px] font-bold px-3.5 rounded-full bg-amber-50 dark:bg-amber-955/20 border border-amber-250/50 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 select-none h-[38px]">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Low Stock
      </span>
    );
  }

  if (s === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-2 text-[11.5px] font-bold px-3.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-500/20 text-[#22C55E] dark:text-emerald-400 select-none h-[38px]">
        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
        Active
      </span>
    );
  }

  if (s === 'INACTIVE' || s === 'ARCHIVED') {
    return (
      <span className="inline-flex items-center gap-2 text-[11.5px] font-bold px-3.5 rounded-full bg-gray-50 dark:bg-zinc-800/40 border border-gray-250 dark:border-white/[0.06] text-gray-500 dark:text-zinc-400 select-none h-[38px]">
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-zinc-500" />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-[11.5px] font-bold px-3.5 rounded-full bg-blue-50 dark:bg-blue-955/20 border border-blue-200/50 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 select-none h-[38px]">
      <span className="w-2 h-2 rounded-full bg-blue-500" />
      {status || 'Draft'}
    </span>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

export const StatCard = ({ title, value, icon: Icon, isDark, type }) => {
  const styles = {
    total: {
      border: isDark ? 'border-white/[0.08] hover:border-zinc-700/50' : 'border-[#E5E7EB] hover:border-gray-300',
      iconColor: 'text-gray-500 dark:text-zinc-455',
      bgIcon: 'bg-gray-50 dark:bg-zinc-900',
    },
    active: {
      border: isDark ? 'border-white/[0.08] hover:border-[#22C55E]/30' : 'border-[#E5E7EB] hover:border-[#22C55E]/30',
      iconColor: 'text-[#22C55E] dark:text-emerald-400',
      bgIcon: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    },
    inactive: {
      border: isDark ? 'border-white/[0.08] hover:border-zinc-700/50' : 'border-[#E5E7EB] hover:border-gray-300',
      iconColor: 'text-gray-400 dark:text-zinc-550',
      bgIcon: 'bg-gray-50 dark:bg-zinc-900',
    },
    lowStock: {
      border: isDark ? 'border-white/[0.08] hover:border-amber-500/30' : 'border-[#E5E7EB] hover:border-amber-300',
      iconColor: 'text-amber-500 dark:text-amber-455',
      bgIcon: 'bg-amber-50 dark:bg-amber-950/20',
    },
    outOfStock: {
      border: isDark ? 'border-white/[0.08] hover:border-red-500/30' : 'border-[#E5E7EB] hover:border-red-300',
      iconColor: 'text-red-550 dark:text-red-455',
      bgIcon: 'bg-red-50 dark:bg-red-950/20',
    },
  };

  const currentStyle = styles[type] || styles.total;

  return (
    <div
      className={`relative overflow-hidden border rounded-2xl py-4 px-5 h-[90px] flex items-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-200 ${
        isDark ? 'bg-zinc-950/40 border-white/[0.08] text-white' : 'bg-white border-[#E5E7EB] text-gray-900'
      } ${currentStyle.border}`}
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="min-w-0">
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-455 block mb-1">
            {title}
          </span>
          <span className="text-2xl font-bold tracking-tight leading-none text-[#111827] dark:text-white">
            {value}
          </span>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border border-gray-100/50 dark:border-white/[0.04] flex-shrink-0 ${currentStyle.bgIcon} ${currentStyle.iconColor}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

export const SkeletonCard = () => (
  <div className="border rounded-xl p-4 animate-pulse bg-gray-50 dark:bg-zinc-900/30 border-gray-150 dark:border-white/[0.06]">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-6 w-10 bg-gray-300 dark:bg-zinc-700 rounded"></div>
      </div>
      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800"></div>
    </div>
  </div>
);

export const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-gray-100 dark:border-white/[0.05]">
    <td className="py-3 px-5">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded bg-gray-200 dark:bg-zinc-850"></div>
        <div className="w-[60px] h-[60px] rounded-lg bg-gray-200 dark:bg-zinc-800"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
          <div className="h-2.5 bg-gray-150 dark:bg-zinc-850 rounded w-1/2"></div>
        </div>
      </div>
    </td>
    <td className="py-3 px-5"><div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-16"></div></td>
    <td className="py-3 px-5"><div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-14"></div></td>
    <td className="py-3 px-5">
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-20"></div>
        <div className="h-1.5 bg-gray-200 dark:bg-zinc-800 rounded w-24"></div>
      </div>
    </td>
    <td className="py-3 px-5"><div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-16"></div></td>
    <td className="py-3 px-5 text-right">
      <div className="flex justify-end gap-2">
        <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg w-10"></div>
        <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg w-10"></div>
      </div>
    </td>
  </tr>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

export const EmptyState = ({ onReset, onCreate }) => (
  <div className="text-center py-16 px-4 bg-white dark:bg-zinc-950 rounded-2xl">
    <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/[0.04] flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-zinc-700">
      <Package className="w-7 h-7" />
    </div>
    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
      No products found
    </h3>
    <p className="text-xs text-gray-500 dark:text-zinc-450 mt-1 max-w-sm mx-auto">
      No inventory listings match your search query or filter options. Refine filters, clear search terms, or create a brand new product.
    </p>
    <div className="flex items-center justify-center gap-3.5 mt-6">
      <button
        onClick={onReset}
        className="px-4 py-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-gray-650 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-850 transition-colors shadow-sm"
      >
        Clear active filters
      </button>
      <Link
        to="/seller/add-product"
        className="px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
      >
        Add Product
      </Link>
    </div>
  </div>
);
