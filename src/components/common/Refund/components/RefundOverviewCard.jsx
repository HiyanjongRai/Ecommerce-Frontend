import React from 'react';
import { Package, ShieldAlert, HelpCircle } from 'lucide-react';
import { getBadgeClass, getStatusLabel } from '../../../../utils/refundConstants';
import { BASE_URL } from '../../../../services/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';

export default function RefundOverviewCard({
  detail,
  orderDetail = null,
  customerProfile = {},
  isDark = false
}) {
  const getRefundProductImage = () => {
    if (detail.productImage) return getImgUrl(detail.productImage);
    if (orderDetail?.items) {
      if (detail.items?.length > 0) {
        const firstRefundItem = detail.items[0];
        const match = orderDetail.items.find(oi => oi.id === firstRefundItem.orderItemId || oi.productId === firstRefundItem.productId);
        if (match?.imagePath) return getImgUrl(match.imagePath);
        if (match?.productImage) return getImgUrl(match.productImage);
      }
      const firstOrderItem = orderDetail.items[0];
      if (firstOrderItem?.imagePath) return getImgUrl(firstOrderItem.imagePath);
      if (firstOrderItem?.productImage) return getImgUrl(firstOrderItem.productImage);
    }
    return null;
  };

  return (
    <div className={`border rounded-2xl p-5 space-y-4 transition-colors shadow-2xs ${
      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
        isDark ? 'text-white border-white/10' : 'text-gray-800 border-gray-150'
      }`}>
        <ShieldAlert size={14} className="text-[#16A34A]" /> Refund Overview
      </h3>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className={`w-28 h-28 rounded-xl border flex items-center justify-center p-1.5 shrink-0 ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-150'
        }`}>
          {getRefundProductImage() ? (
            <img src={getRefundProductImage()} alt="" className="max-w-full max-h-full object-contain rounded" />
          ) : (
            <Package size={32} className="text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-semibold w-full">
          <div>
            <span className={`block text-[8.5px] uppercase tracking-widest mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Refund Type</span>
            <span className={`font-bold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{detail.type?.toLowerCase().replace('_', ' ') || 'Money Back'}</span>
          </div>
          <div>
            <span className={`block text-[8.5px] uppercase tracking-widest mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Refund Amount</span>
            <span className="font-black text-red-500 block">{money(detail.refundAmount)}</span>
          </div>
          <div>
            <span className={`block text-[8.5px] uppercase tracking-widest mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Payment Method</span>
            <span className={`font-bold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{detail.paymentMethod || 'eSewa'}</span>
          </div>
          <div>
            <span className={`block text-[8.5px] uppercase tracking-widest mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Risk Level</span>
            <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-black uppercase border ${customerProfile.riskBadge}`}>
              {customerProfile.riskLevel || 'LOW'}
            </span>
          </div>
          <div>
            <span className={`block text-[8.5px] uppercase tracking-widest mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fraud Risk Score</span>
            <span className={`font-bold block flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {customerProfile.score || 0} / 100
              <HelpCircle size={12} className="text-gray-400 cursor-pointer" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
