import React from 'react';
import {
  Plus, Search, X, ChevronDown, ArrowUpDown, ChevronUp,
  Package, CheckCircle2, XCircle, AlertTriangle, AlertCircle,
  DollarSign, TrendingDown,
} from 'lucide-react';
import { SectionHeader } from '../../SectionUtils/SectionUtils';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  green:  '#22C55E',
  text:   '#111827',
  sub:    '#6B7280',
  border: '#E5E7EB',
  warn:   '#FB923C',
  danger: '#EF4444',
  info:   '#38BDF8',
};

// ─── Compact KPI card ─────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, accent, note, onFilter, isDark }) {
  return (
    <button
      type="button"
      onClick={onFilter}
      className={`border rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-left w-full transition-all duration-200 ${
        isDark
          ? 'bg-zinc-950/45 border-white/[0.08] text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
          : 'bg-white border-[#E5E7EB] text-[#111827]'
      } ${
        onFilter ? 'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ background: accent + '14', borderColor: accent + '30', color: accent }}>
          <Icon className="w-4 h-4" />
        </div>
        {note && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{ color: accent, background: accent + '12', borderColor: accent + '28' }}>
            {note}
          </span>
        )}
      </div>
      <p className={`text-[26px] font-black leading-none ${isDark ? 'text-white' : 'text-[#111827]'}`}>{value}</p>
      <p className={`text-[10px] font-semibold mt-1 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{label}</p>
    </button>
  );
}

// ─── Sort-clickable column header ─────────────────────────────────────────────
export function SortableHeader({ label, sortKey, sortBy, onSort }) {
  const isSortedAsc  = sortBy === `${sortKey}_asc`;
  const isSortedDesc = sortBy === `${sortKey}_desc`;
  const isSorted     = isSortedAsc || isSortedDesc;
  return (
    <th
      onClick={() => onSort(isSortedAsc ? `${sortKey}_desc` : `${sortKey}_asc`)}
      className="py-3.5 px-5 text-[10px] font-black uppercase tracking-[0.1em] text-[#6B7280] select-none cursor-pointer hover:text-[#111827] transition-colors"
    >
      <div className="flex items-center gap-1">
        {label}
        {isSorted ? (
          isSortedAsc
            ? <ChevronUp   className="w-3.5 h-3.5 text-emerald-500" />
            : <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />
        )}
      </div>
    </th>
  );
}

/**
 * InventoryToolbar
 * Renders: compact header → KPI cards → filter toolbar → active chips
 */
export default function InventoryToolbar({
  stats,
  alerts,
  statusFilter,
  search,
  categoryFilter,
  sortBy,
  isDark,
  dynamicCategories,
  onStatusFilter,
  onSearch,
  onCategory,
  onSort,
  onReset,
  onOpenCreate,
}) {
  const hasFilters = search !== '' || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'DEFAULT';

  const inputCls = `border rounded-xl text-[13px] font-medium focus:outline-none transition-all focus:ring-2 ${
    isDark
      ? 'bg-zinc-900 border-white/[0.08] text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/10'
      : 'bg-white border-[#E5E7EB] text-[#111827] placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500/10'
  }`;

  const selectCls = `border rounded-xl text-[13px] font-medium focus:outline-none appearance-none cursor-pointer transition-all ${
    isDark
      ? 'bg-zinc-900 border-white/[0.08] text-white focus:border-emerald-500'
      : 'bg-white border-[#E5E7EB] text-[#111827] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
  }`;

  return (
    <>
      {/* ── Premium Gradient Page Header Banner ── */}
      <SectionHeader 
        title="Inventory Management"
        subtitle="Monitor stock levels, product availability, and inventory performance."
        tag="Inventory Center"
        action={
          <button 
            type="button" 
            onClick={onOpenCreate}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border shadow-sm h-10 flex items-center gap-1.5 ${
              isDark
                ? 'bg-zinc-900 border-white/[0.08] hover:bg-zinc-800 text-white'
                : 'bg-white border-gray-200 hover:bg-gray-150 text-gray-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Create Listing
          </button>
        }
      />

      {/* ══════════════════════════════════════════════════════════
          KPI CARDS
      ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          icon={Package}
          label="Total Products"
          value={stats.total}
          accent={T.sub}
          isDark={isDark}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Active Listings"
          value={stats.active}
          accent={T.green}
          onFilter={() => onStatusFilter('ACTIVE')}
          isDark={isDark}
        />
        <KpiCard
          icon={XCircle}
          label="Inactive Listings"
          value={stats.inactive}
          accent={T.sub}
          onFilter={() => onStatusFilter('INACTIVE')}
          isDark={isDark}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Low Stock"
          value={stats.lowStock}
          accent={T.warn}
          note={stats.lowStock > 0 ? 'Action' : null}
          onFilter={() => onStatusFilter('ALL')}
          isDark={isDark}
        />
        <KpiCard
          icon={AlertCircle}
          label="Out of Stock"
          value={stats.outOfStock}
          accent={T.danger}
          note={stats.outOfStock > 0 ? 'Urgent' : null}
          onFilter={() => onStatusFilter('ALL')}
          isDark={isDark}
        />
        <KpiCard
          icon={DollarSign}
          label="Inventory Value"
          value={`Rs. ${(stats.inventoryValue || 0).toLocaleString()}`}
          accent="#8B5CF6"
          isDark={isDark}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          ADVANCED FILTER TOOLBAR
      ══════════════════════════════════════════════════════════ */}
      <div className={`flex flex-wrap items-center gap-3 px-4 py-3 border rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] ${
        isDark ? 'bg-zinc-950 border-white/[0.08]' : 'bg-white border-[#E5E7EB]'
      }`}>
        {/* Status tabs */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {[
            { id: 'ALL',      label: 'All',      count: stats.total    },
            { id: 'ACTIVE',   label: 'Active',   count: stats.active   },
            { id: 'INACTIVE', label: 'Inactive', count: stats.inactive },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all whitespace-nowrap border ${
                  isActive
                    ? 'text-white shadow-sm border-transparent'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-emerald-500/40'
                    : 'bg-gray-50 border-[#E5E7EB] text-gray-600 hover:border-emerald-400/50 hover:bg-emerald-50/40'
                }`}
                style={isActive ? { background: T.green, borderColor: T.green } : {}}
              >
                {tab.label} <span className="opacity-70 font-medium">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className={`hidden sm:block w-px h-7 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-[#E5E7EB]'}`} />

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products, brand, SKU..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className={`${inputCls} w-full pl-9 pr-8 py-2`}
          />
          {search && (
            <button onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category */}
        <div className="relative shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => onCategory(e.target.value)}
            className={`${selectCls} pl-3 pr-8 py-2 min-w-[130px]`}
          >
            <option value="ALL">All Categories</option>
            {dynamicCategories.filter((c) => c !== 'ALL').map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => onSort(e.target.value)}
            className={`${selectCls} pl-9 pr-8 py-2 min-w-[150px]`}
          >
            <option value="DEFAULT">Sort by</option>
            <option value="name_asc">Name: A–Z</option>
            <option value="name_desc">Name: Z–A</option>
            <option value="price_asc">Price: Low–High</option>
            <option value="price_desc">Price: High–Low</option>
            <option value="stock_asc">Stock: Low–High</option>
            <option value="stock_desc">Stock: High–Low</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Reset */}
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-black uppercase tracking-wider transition-colors shrink-0"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : T.border,
              color: T.sub,
              background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
            }}
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* ── Active filter chips ── */}
      {hasFilters && (
        <div className={`flex items-center gap-2 flex-wrap px-4 py-2.5 border rounded-xl shadow-sm select-none -mt-2 ${
          isDark ? 'bg-zinc-950 border-white/[0.06]' : 'bg-white border-[#E5E7EB]'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider mr-1" style={{ color: T.sub }}>
            Filters:
          </span>
          {search && (
            <FilterChip label={`Search: ${search}`} onRemove={() => onSearch('')} isDark={isDark} />
          )}
          {categoryFilter !== 'ALL' && (
            <FilterChip label={`Category: ${categoryFilter}`} onRemove={() => onCategory('ALL')} isDark={isDark} />
          )}
          {statusFilter !== 'ALL' && (
            <FilterChip label={`Status: ${statusFilter}`} onRemove={() => onStatusFilter('ALL')} isDark={isDark} />
          )}
          {sortBy !== 'DEFAULT' && (
            <FilterChip label={`Sort: ${sortBy.replace('_', ': ')}`} onRemove={() => onSort('DEFAULT')} isDark={isDark} />
          )}
          <button type="button" onClick={onReset}
            className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors ml-auto">
            Clear All
          </button>
        </div>
      )}
    </>
  );
}

function FilterChip({ label, onRemove, isDark }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
      isDark
        ? 'bg-zinc-900 border-white/[0.08] text-zinc-350'
        : 'bg-gray-50 border-[#E5E7EB] text-gray-700'
    }`}>
      {label}
      <button type="button" onClick={onRemove} className="text-gray-450 hover:text-gray-650 transition-colors">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
