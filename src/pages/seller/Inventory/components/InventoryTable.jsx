import React from 'react';
import {
  Pencil, Trash2, Image as ImageIcon, Loader2,
  MoreVertical, Copy, Archive, Eye, EyeOff,
  Package, Plus, ArrowUpDown, ChevronUp, ChevronDown,
} from 'lucide-react';
import { imgSrc, EmptyState } from './InventoryComponents';

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  green:  '#22C55E',
  text:   '#111827',
  sub:    '#6B7280',
  border: '#E5E7EB',
  warn:   '#FB923C',
  danger: '#EF4444',
};

// ─── Sortable header ────────────────────────────────────────────────────────
const ColHeader = ({ label, sortKey, sortBy, onSort }) => {
  const asc    = sortBy === `${sortKey}_asc`;
  const desc   = sortBy === `${sortKey}_desc`;
  const active = asc || desc;
  const isDark = localStorage.getItem('seller-theme') === 'dark';
  return (
    <th
      onClick={() => onSort(asc ? `${sortKey}_desc` : `${sortKey}_asc`)}
      className="py-3.5 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 dark:text-zinc-400 select-none cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? asc ? <ChevronUp className="w-3.5 h-3.5 text-emerald-500" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
          : <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-650" />
        }
      </div>
    </th>
  );
};

// ─── Stock health pill ──────────────────────────────────────────────────────
export function StockHealthPill({ qty, hasVariants }) {
  const isDark = localStorage.getItem('seller-theme') === 'dark';
  if (hasVariants) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border"
        style={isDark 
          ? { color: '#C084FC', background: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.25)' } 
          : { color: '#8B5CF6', background: '#F5F3FF', borderColor: '#DDD6FE' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        Multi-Variant
      </span>
    );
  }
  if (qty === 0) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border"
      style={isDark
        ? { color: '#9CA3AF', background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.08)' }
        : { color: '#6B7280', background: '#F9FAFB', borderColor: T.border }}>
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Out of Stock
    </span>
  );
  if (qty <= 4) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border"
      style={isDark
        ? { color: '#F87171', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.25)' }
        : { color: T.danger, background: '#FEF2F2', borderColor: '#FECACA' }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.danger }} />
      Critical
    </span>
  );
  if (qty <= 19) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border"
      style={isDark
        ? { color: '#FBBF24', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.25)' }
        : { color: T.warn, background: '#FFF7ED', borderColor: '#FED7AA' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.warn }} />
      Low Stock
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border"
      style={isDark
        ? { color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.25)' }
        : { color: T.green, background: '#F0FDF4', borderColor: '#BBF7D0' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.green }} />
      Healthy
    </span>
  );
}

// ─── Stock progress bar ────────────────────────────────────────────────────
function StockBar({ qty, hasVariants }) {
  if (hasVariants) return null;
  const isDark = localStorage.getItem('seller-theme') === 'dark';
  const max   = Math.max(qty, 50);  // baseline capacity
  const pct   = Math.min(100, (qty / max) * 100);
  const color = qty === 0 ? '#9CA3AF' : qty <= 4 ? T.danger : qty <= 19 ? T.warn : T.green;
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-medium" style={{ color: isDark ? '#A1A1AA' : T.sub }}>{qty} units</span>
        <span className="text-[10px] font-bold" style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div className="w-full h-[6px] rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden border border-gray-100 dark:border-zinc-800">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Product image ──────────────────────────────────────────────────────────
function ProductImage({ product, onClick, loadingEdit }) {
  const pid = product.id || product.productId;
  const img = product.imagePaths?.[0] || product.mainImage;
  return (
    <div
      onClick={onClick}
      className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-[#E5E7EB] bg-gray-50 cursor-pointer hover:border-emerald-400 transition-all shadow-sm"
    >
      {loadingEdit === pid
        ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
        : img
        ? <img src={imgSrc(img)} alt={product.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
        : <ImageIcon className="w-5 h-5 text-gray-300" />
      }
    </div>
  );
}

// ─── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || 'DRAFT').toUpperCase();
  const isDark = localStorage.getItem('seller-theme') === 'dark';
  const map = {
    ACTIVE:   { label: 'Active',   color: isDark ? '#34D399' : T.green,   bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4', border: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0' },
    INACTIVE: { label: 'Inactive', color: isDark ? '#9CA3AF' : T.sub,     bg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB', border: isDark ? 'rgba(255, 255, 255, 0.08)' : T.border  },
    DRAFT:    { label: 'Draft',    color: isDark ? '#C084FC' : '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF', border: isDark ? 'rgba(139, 92, 246, 0.25)' : '#DDD6FE' },
  };
  const cfg = map[s] || map.DRAFT;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function InventoryTable({
  paginatedProducts,
  isDark,
  selectedIds,
  isAllSelected,
  isSomeSelected,
  activeDropdownId,
  updatingStockId,
  loadingEdit,
  currentPage,
  totalPages,
  totalItems,
  stats,
  sortBy,
  onSort,
  onSelectAll,
  onSelectOne,
  onOpenEdit,
  onStatusToggle,
  onDuplicate,
  onArchive,
  onConfirmDelete,
  onDirectStockUpdate,
  onToggleDropdown,
  onCloseDropdown,
  onPageChange,
  onReset,
  onOpenCreate,
  getPageNumbers,
}) {
  return (
    <div className={`border rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.05)] overflow-hidden ${
      isDark ? 'bg-zinc-950 border-white/[0.08]' : 'bg-white border-[#E5E7EB]'
    }`}>
      {paginatedProducts.length === 0 ? (
        <EmptyState onReset={onReset} onCreate={onOpenCreate} />
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className={`border-b ${isDark ? 'bg-zinc-900 border-white/[0.06]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                <tr>
                  {/* Select all */}
                  <th className="py-4 pl-5 pr-3 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                      onChange={onSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                    />
                  </th>
                  <ColHeader label="Product"       sortKey="name"   sortBy={sortBy} onSort={onSort} />
                  <ColHeader label="Price"         sortKey="price"  sortBy={sortBy} onSort={onSort} />
                  <ColHeader label="Stock & Health" sortKey="stock"  sortBy={sortBy} onSort={onSort} />
                  <ColHeader label="Status"        sortKey="status" sortBy={sortBy} onSort={onSort} />
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-gray-550 dark:text-zinc-400">
                    Inv. Value
                  </th>
                  <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-[0.1em] text-gray-550 dark:text-zinc-400 pr-5">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-[#F3F4F6]'}`}>
                {paginatedProducts.map((p, idx) => {
                  const pid      = p.id || p.productId;
                  const qty      = p.hasVariants
                    ? (p.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0)
                    : (p.stockQuantity ?? 0);
                  const isActive = (p.status || '').toUpperCase() === 'ACTIVE';
                  const selected = selectedIds.includes(pid);
                  const price    = Number(p.price || 0);
                  const invValue = qty * price;

                  return (
                    <tr
                      key={pid}
                      className="group transition-all duration-150"
                      style={{
                        background: selected
                          ? (isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4')
                          : isDark
                          ? idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                          : idx % 2 === 0 ? '#fff' : '#FAFAFA',
                        borderLeft: selected ? `3px solid ${T.green}` : '3px solid transparent',
                      }}
                    >
                      {/* Checkbox */}
                      <td className="pl-4 pr-3 py-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onSelectOne(pid)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                        />
                      </td>

                      {/* Product */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <ProductImage product={p} onClick={() => onOpenEdit(p)} loadingEdit={loadingEdit} />
                          <div className="min-w-0">
                            <p
                              onClick={() => onOpenEdit(p)}
                              className="text-[14px] font-black truncate max-w-[200px] cursor-pointer transition-colors hover:text-emerald-600"
                              style={{ color: isDark ? '#fff' : T.text }}
                            >
                              {p.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {p.brand && (
                                <span className="text-[11px] font-semibold" style={{ color: isDark ? '#9CA3AF' : '#374151' }}>
                                  {p.brand}
                                </span>
                              )}
                              {p.brand && p.category && <span className="text-gray-300 text-[10px]">·</span>}
                              {p.category && (
                                <span className="text-[11px]" style={{ color: T.sub }}>{p.category}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono mt-0.5 block" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                              ID: {pid}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          {p.onSale && p.discountPrice ? (
                            <>
                              <span className="text-[14px] font-black" style={{ color: T.green }}>
                                Rs. {Number(p.discountPrice).toLocaleString()}
                              </span>
                              <span className="text-[11px] line-through font-medium" style={{ color: T.sub }}>
                                Rs. {price.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-[14px] font-black" style={{ color: isDark ? '#fff' : T.text }}>
                              Rs. {price.toLocaleString()}
                            </span>
                          )}
                          {p.hasVariants && (
                            <span className="text-[10px] mt-0.5" style={{ color: T.sub }}>
                              {p.variants?.length || 0} variants
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock & Health */}
                      <td className="px-4 py-4">
                        <div className="min-w-[160px]" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2 mb-1">
                            <StockHealthPill qty={qty} hasVariants={p.hasVariants} />
                            {!p.hasVariants && (
                              <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-zinc-900 p-0.5 ml-1">
                                <button
                                  type="button"
                                  onClick={() => onDirectStockUpdate(p, false)}
                                  disabled={updatingStockId === pid || qty <= 0}
                                  className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 dark:text-zinc-450 hover:bg-white dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all"
                                >
                                  <span className="text-sm font-bold leading-none">−</span>
                                </button>
                                {updatingStockId === pid
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500 mx-1" />
                                  : <span className="text-[11px] font-black w-6 text-center" style={{ color: isDark ? '#fff' : T.text }}>{qty}</span>
                                }
                                <button
                                  type="button"
                                  onClick={() => onDirectStockUpdate(p, true)}
                                  disabled={updatingStockId === pid}
                                  className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 dark:text-zinc-455 hover:bg-white dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <StockBar qty={qty} hasVariants={p.hasVariants} />
                          {p.hasVariants && (
                            <p className="text-[10px] mt-0.5" style={{ color: T.sub }}>
                              Total: {qty} units across {p.variants?.length || 0} variants
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Inventory value */}
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-bold" style={{ color: isDark ? '#fff' : T.text }}>
                          {p.hasVariants ? '—' : `Rs. ${invValue.toLocaleString()}`}
                        </span>
                        {!p.hasVariants && (
                          <p className="text-[10px] mt-0.5" style={{ color: T.sub }}>
                            {qty} × {price.toLocaleString()}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onOpenEdit(p)}
                            disabled={loadingEdit === pid}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-all shadow-sm ${
                              isDark
                                ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                                : 'border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          {/* More dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={e => onToggleDropdown(pid, e)}
                              className={`p-2 rounded-xl border text-gray-500 hover:text-gray-900 transition-all shadow-sm h-[34px] w-[34px] flex items-center justify-center ${
                                isDark ? 'border-zinc-800 hover:bg-zinc-900 hover:text-white' : 'border-[#E5E7EB] bg-white hover:bg-gray-50'
                              }`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeDropdownId === pid && (
                              <div className="absolute right-0 mt-1.5 w-52 rounded-2xl border bg-white dark:bg-zinc-950 border-[#E5E7EB] dark:border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.40)] py-1.5 z-[90] animate-in fade-in-50 slide-in-from-top-2 duration-150">
                                <MenuItem
                                  icon={<Pencil className="w-3.5 h-3.5" />}
                                  label="Edit Product"
                                  onClick={() => { onOpenEdit(p); onCloseDropdown(); }}
                                />
                                <MenuItem
                                  icon={<Copy className="w-3.5 h-3.5" />}
                                  label="Duplicate Product"
                                  onClick={() => { onDuplicate(p); onCloseDropdown(); }}
                                />
                                <MenuItem
                                  icon={isActive
                                    ? <EyeOff className="w-3.5 h-3.5" />
                                    : <Eye className="w-3.5 h-3.5" />
                                  }
                                  label={isActive ? 'Deactivate' : 'Activate'}
                                  onClick={() => { onCloseDropdown(); onStatusToggle(p); }}
                                />
                                <MenuItem
                                  icon={<Archive className="w-3.5 h-3.5" />}
                                  label="Archive Product"
                                  onClick={() => { onArchive(p); onCloseDropdown(); }}
                                />
                                <div className="h-px bg-gray-100 dark:bg-white/[0.08] my-1" />
                                <MenuItem
                                  icon={<Trash2 className="w-3.5 h-3.5" />}
                                  label="Delete Product"
                                  danger
                                  onClick={() => { onConfirmDelete(p); onCloseDropdown(); }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer: summary + pagination */}
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t ${
            isDark ? 'border-white/[0.05]' : 'border-[#F3F4F6]'
          }`}>
            <p className="text-[12px] font-medium" style={{ color: T.sub }}>
              Showing <strong className="font-black" style={{ color: isDark ? '#fff' : T.text }}>{totalItems}</strong> products
              {' · '}
              <span style={{ color: T.green }}>{stats.active} Active</span>
              {' · '}
              <span style={{ color: T.warn }}>{stats.lowStock} Low Stock</span>
              {' · '}
              <span style={{ color: T.danger }}>{stats.outOfStock} Out of Stock</span>
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 select-none">
                <PaginationBtn
                  label="← Prev"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />
                {getPageNumbers().map((n, i) =>
                  n === '...'
                    ? <span key={`e${i}`} className="px-2 text-xs text-gray-400">…</span>
                    : <PaginationBtn
                        key={n}
                        label={n}
                        onClick={() => onPageChange(n)}
                        active={currentPage === n}
                      />
                )}
                <PaginationBtn
                  label="Next →"
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3.5 py-2 text-[12px] font-semibold flex items-center gap-2.5 transition-colors ${
        danger
          ? 'text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20'
          : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900/60'
      }`}
    >
      <span className={danger ? 'text-red-500' : 'text-gray-400 dark:text-zinc-550'}>{icon}</span>
      {label}
    </button>
  );
}

function PaginationBtn({ label, onClick, disabled, active }) {
  const isDark = localStorage.getItem('seller-theme') === 'dark';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all min-h-[32px] ${
        active
          ? (isDark ? 'bg-white text-black shadow-sm' : 'bg-[#111827] text-white shadow-sm')
          : disabled
          ? 'text-gray-300 dark:text-zinc-700 cursor-not-allowed'
          : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 border border-[#E5E7EB] dark:border-white/[0.08]'
      }`}
    >
      {label}
    </button>
  );
}
