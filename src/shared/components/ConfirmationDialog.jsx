import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
  isDark = false,
  details,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden animate-in fade-in-50 scale-in-95 duration-300 ${
        isDark ? 'bg-zinc-950 border-white/[0.08] text-white' : 'bg-white border-gray-200 text-slate-900'
      }`}>
        <div className={`px-6 py-5 border-b flex items-start justify-between gap-4 ${
          isDark ? 'border-white/[0.08] bg-zinc-950' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              danger
                ? isDark
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-red-50 border border-red-100 text-red-600'
                : isDark
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
            }`}>
              <AlertTriangle className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">{title}</h3>
              <p className={`mt-1 text-[11px] leading-5 font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-zinc-500 hover:bg-zinc-900 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
            }`}
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {details ? (
          <div className={`px-6 py-4 text-[11px] leading-5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            {details}
          </div>
        ) : null}

        <div className={`px-6 py-4 border-t flex gap-3 ${
          isDark ? 'border-white/[0.08]' : 'border-gray-100'
        }`}>
          <button
            type="button"
            onClick={loading ? undefined : onCancel}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all ${
              isDark
                ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white disabled:opacity-50'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={loading ? undefined : onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-white transition-all shadow-lg ${
              danger ? 'bg-red-600 hover:bg-red-700 disabled:opacity-60' : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60'
            }`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
