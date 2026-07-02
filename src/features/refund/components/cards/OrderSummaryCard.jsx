import React from 'react';
import { Package, Copy, Check } from 'lucide-react';
import { toast } from '../../../../shared/contexts/ToastContext';

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';
const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function OrderSummaryCard({
  detail,
  isDark = false,
  copied = null,
  copyToClipboard = () => {}
}) {
  return (
    <div className={`border rounded-2xl p-5 space-y-4 transition-colors shadow-2xs ${
      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
        isDark ? 'text-white border-white/10' : 'text-gray-800 border-gray-150'
      }`}>
        <Package size={14} className="text-[#16A34A]" /> Order Summary
      </h3>
      
      <div className="space-y-2.5 text-xs font-semibold">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Order ID:</span>
          <div className="flex items-center gap-1">
            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{detail.orderNumber || detail.orderId}</span>
            <button 
              onClick={() => copyToClipboard(detail.orderNumber || detail.orderId, 'orderId')}
              className="p-0.5 bg-transparent border-0 cursor-pointer"
            >
              {copied === 'orderId' ? <Check className="w-3 h-3 text-[#e8f3e9]0" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-dashed border-gray-100 dark:border-white/5 pt-1.5">
          <span className="text-gray-400">Order Date:</span>
          <span className={isDark ? 'text-white' : 'text-gray-800'}>{dateLabel(detail.createdAt)}</span>
        </div>
        <div className="flex justify-between items-center border-t border-dashed border-gray-100 dark:border-white/5 pt-1.5">
          <span className="text-gray-400">Payment Method:</span>
          <span className={`font-bold capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>{detail.paymentMethod || 'eSewa'}</span>
        </div>
        <div className="flex justify-between items-center border-t border-dashed border-gray-100 dark:border-white/5 pt-1.5">
          <span className="text-gray-400">Order Amount:</span>
          <span className={`font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{money(detail.refundAmount)}</span>
        </div>
      </div>

      <button 
        onClick={() => toast('Redirecting to order fulfillment page...', 'success')}
        className="w-full text-center py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-650 dark:text-white border-gray-200 dark:border-white/10 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer font-bold"
      >
        👁 View Order Details
      </button>
    </div>
  );
}
