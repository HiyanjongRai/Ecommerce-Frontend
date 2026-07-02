import React from 'react';
import { Package } from 'lucide-react';
import { BASE_URL } from '../../../../services/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';

export default function RefundItemCard({
  items = [],
  orderDetail = null,
  isDark = false,
  refundAmount = 0
}) {
  return (
    <div className={`border rounded-2xl p-5 space-y-4 transition-colors shadow-2xs ${
      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
        isDark ? 'text-white border-white/10' : 'text-gray-800 border-gray-150'
      }`}>
        <Package size={14} className="text-[#16A34A]" /> Refund Items
      </h3>

      <div className="divide-y divide-gray-100 dark:divide-white/5 space-y-4">
        {items.map((item, idx) => {
          const name = item.productName || item.name || 'Product Item';
          const sku = item.sku || 'N/A';
          const variants = item.variants || {};
          const qty = item.quantity || 1;
          const price = item.price || item.unitPrice || 0;
          const total = item.lineTotal || (price * qty) || 0;

          return (
            <div key={idx} className="pt-4 first:pt-0 flex flex-col sm:flex-row gap-4 items-start">
              <div className={`w-28 h-28 rounded-xl border flex items-center justify-center p-1.5 shrink-0 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }`}>
                {(() => {
                  const matchingOi = orderDetail?.items?.find(oi => oi.id === item.orderItemId || oi.productId === item.productId);
                  const img = item.imagePath || matchingOi?.imagePath || matchingOi?.productImage;
                  return img ? (
                    <img src={getImgUrl(img)} alt="" className="max-w-full max-h-full object-contain rounded" />
                  ) : (
                    <Package size={32} className="text-gray-400" />
                  );
                })()}
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-1">
                  <h4 className={`text-xs font-black truncate block ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[10px] font-bold text-gray-400">
                    {Object.entries(variants).map(([k, v]) => (
                      <span key={k} className="capitalize">{k}: <span className={isDark ? 'text-white' : 'text-gray-755'}>{String(v)}</span></span>
                    ))}
                    <span>SKU: <span className={isDark ? 'text-white' : 'text-gray-755'}>{sku}</span></span>
                    <span>Qty: <span className={isDark ? 'text-white' : 'text-gray-755'}>{qty}</span></span>
                  </div>
                </div>
                <div className="md:text-right shrink-0">
                  <p className="text-[10px] text-gray-400">Unit: {money(price)}</p>
                  <p className="text-xs font-black text-red-500 mt-0.5">Refund: {money(total || refundAmount)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed pt-4 flex items-center justify-between">
        <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>Total Refund Amount</span>
        <span className="text-base font-black text-red-500">{money(refundAmount)}</span>
      </div>
    </div>
  );
}
