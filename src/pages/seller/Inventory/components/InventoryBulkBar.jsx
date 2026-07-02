import React from 'react';
import { Download, Archive, Trash2, EyeOff, X } from 'lucide-react';

/**
 * InventoryBulkBar — Premium floating bulk action bar.
 * Shown when one or more rows are selected.
 */
export default function InventoryBulkBar({
  selectedIds,
  isBulkProcessing,
  isDark,
  onDeactivate,
  onExport,
  onDelete,
  onClearSelection,
}) {
  if (selectedIds.length === 0) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.18)] animate-in slide-in-from-bottom-4 duration-300"
      style={{
        background: isDark ? 'rgba(9,9,11,0.96)' : 'rgba(255,255,255,0.98)',
        borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#E5E7EB',
        minWidth: '380px',
      }}
    >
      {/* Count badge */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-[12px] shadow-sm">
          {selectedIds.length}
        </div>
        <span className="text-[13px] font-bold" style={{ color: isDark ? '#fff' : '#111827' }}>
          {selectedIds.length} selected
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 shrink-0" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }} />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-1">
        <BulkBtn
          icon={<EyeOff className="w-3.5 h-3.5" />}
          label="Deactivate"
          onClick={onDeactivate}
          disabled={isBulkProcessing}
          isDark={isDark}
        />
        <BulkBtn
          icon={<Download className="w-3.5 h-3.5" />}
          label="Export CSV"
          onClick={onExport}
          disabled={isBulkProcessing}
          isDark={isDark}
        />
        <BulkBtn
          icon={<Trash2 className="w-3.5 h-3.5" />}
          label="Delete"
          onClick={onDelete}
          disabled={isBulkProcessing}
          danger
        />
      </div>

      {/* Dismiss */}
      {onClearSelection && (
        <button
          type="button"
          onClick={onClearSelection}
          className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100 shrink-0"
          title="Clear selection"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}

      {isBulkProcessing && (
        <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function BulkBtn({ icon, label, onClick, disabled, danger, isDark }) {
  if (danger) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-wider text-white disabled:opacity-50 transition-all"
        style={{ background: '#EF4444' }}
      >
        {icon}
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-black uppercase tracking-wider disabled:opacity-50 transition-all"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
        color: isDark ? '#D1D5DB' : '#374151',
        background: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
