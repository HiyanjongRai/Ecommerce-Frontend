import React from 'react';
import { AlertTriangle, AlertCircle, X, ArrowRight } from 'lucide-react';

const T = {
  text:   '#111827',
  sub:    '#6B7280',
  border: '#E5E7EB',
  warn:   '#FB923C',
  danger: '#EF4444',
};

/**
 * InventoryAlerts — Premium stock alert cards.
 * Rendered only when unacknowledged alerts exist.
 */
export default function InventoryAlerts({ alerts, products, isDark, onAcknowledge, onOpenEdit }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={`border rounded-2xl p-4 shadow-[0_4px_16px_rgba(251,146,60,0.08)] transition-all ${
      isDark ? 'bg-amber-950/10 border-amber-500/20' : 'bg-amber-50/40 border-amber-200/70'
    }`}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-30" />
            <AlertTriangle className="w-4 h-4 relative text-amber-600" />
          </div>
          <h2 className="text-[13px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Stock Alerts
          </h2>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800">
          {alerts.length} Requiring Action
        </span>
      </div>

      {/* Alert rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {alerts.map((alert) => {
          const isOut   = (alert.currentStock ?? 0) === 0;
          const accent  = isOut ? T.danger : T.warn;
          const accentBg = isOut ? '#FEF2F2' : '#FFF7ED';
          const accentBorder = isOut ? '#FECACA' : '#FED7AA';

          return (
            <div key={alert.id} className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm transition-all hover:shadow-md"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : T.border }}>
              {/* Icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
                style={{ background: accentBg, borderColor: accentBorder, color: accent }}>
                {isOut ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold truncate" style={{ color: T.text }}>{alert.productName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                    style={{ background: accentBg, borderColor: accentBorder, color: accent }}>
                    {isOut ? 'Out of Stock' : `${alert.currentStock ?? 0} units left`}
                  </span>
                  {alert.thresholdStock != null && (
                    <span className="text-[10px] font-medium" style={{ color: T.sub }}>
                      Threshold: {alert.thresholdStock}
                    </span>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button"
                  onClick={() => {
                    const product = products.find(p => (p.id || p.productId) === alert.productId);
                    if (product) onOpenEdit(product);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all"
                  style={{ borderColor: T.border, color: T.text, background: '#fff' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}>
                  Edit
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all"
                  style={{ borderColor: T.border, color: T.sub, background: '#fff' }}
                  title="Dismiss alert"
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.danger; e.currentTarget.style.color = T.danger; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.sub; }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
