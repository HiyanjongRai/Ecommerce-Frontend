import React from 'react';
import { RefreshCw, Scale, HelpCircle, ChevronRight, Clock, Truck, CheckCircle, AlertTriangle, Handshake } from 'lucide-react';
import { BASE_URL } from '../../../shared/api/apiClient';
import { getOrderDetail } from '../../customer/api/customerApi';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const orderDetailCache = {};

function CustomerRefundListProductCell({ refund }) {
  const [resolvedImg, setResolvedImg] = React.useState(refund.productImage || refund.items?.[0]?.imagePath || null);

  React.useEffect(() => {
    if (refund.productImage || refund.items?.[0]?.imagePath) {
      return;
    }

    const orderId = refund.orderId;
    if (!orderId) return;

    if (orderDetailCache[orderId]) {
      orderDetailCache[orderId].then(data => {
        if (data) {
          const match = data.items?.find(oi => oi.id === refund.items?.[0]?.orderItemId || oi.productId === refund.items?.[0]?.productId) || data.items?.[0];
          if (match?.imagePath) setResolvedImg(match.imagePath);
          else if (match?.productImage) setResolvedImg(match.productImage);
        }
      });
      return;
    }

    const promise = getOrderDetail(orderId)
      .then(res => res.data)
      .catch(() => null);

    orderDetailCache[orderId] = promise;

    promise.then(data => {
      if (data) {
        const match = data.items?.find(oi => oi.id === refund.items?.[0]?.orderItemId || oi.productId === refund.items?.[0]?.productId) || data.items?.[0];
        if (match?.imagePath) setResolvedImg(match.imagePath);
        else if (match?.productImage) setResolvedImg(match.productImage);
      }
    });
  }, [refund]);

  const meta = getStatusMeta(refund.status);
  const Icon = meta.icon;

  return (
    <div className={`w-24 h-24 rounded-lg flex items-center justify-center border shrink-0 overflow-hidden ${
      resolvedImg ? 'bg-gray-50 border-gray-150' : meta.badge
    }`}>
      {resolvedImg ? (
        <img src={getImgUrl(resolvedImg)} alt="" className="max-w-full max-h-full object-contain" />
      ) : (
        <Icon size={24} strokeWidth={2.5} />
      )}
    </div>
  );
}


const STATUS_META = {
  REQUEST_CREATED: { label: 'Request Created', badge: 'bg-blue-50 text-blue-600 border-blue-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-50 text-amber-600 border-amber-200', icon: Scale },
  MORE_EVIDENCE_REQUESTED: { label: 'Evidence Required', badge: 'bg-red-50 text-red-500 border-red-200', icon: AlertTriangle },
  OFFER_MADE: { label: 'Offer Pending', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: Handshake },
  SELLER_APPROVED: { label: 'Approved by Seller', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#bbf7d0]', icon: CheckCircle },
  RETURN_PENDING: { label: 'Return Pending', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: Truck },
  RETURN_SHIPPED: { label: 'Return Shipped', badge: 'bg-sky-50 text-sky-600 border-sky-200', icon: Truck },
  RETURN_RECEIVED: { label: 'Return Received', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#bbf7d0]', icon: CheckCircle },
  PRODUCT_INSPECTION: { label: 'Product Inspection', badge: 'bg-violet-50 text-violet-600 border-violet-200', icon: Scale },
  INSPECTION_COMPLETE: { label: 'Inspection Complete', badge: 'bg-purple-50 text-purple-600 border-purple-200', icon: CheckCircle },
  REFUND_PROCESSING: { label: 'Refund Processing', badge: 'bg-orange-50 text-orange-600 border-orange-200', icon: Clock },
  REFUND_COMPLETED: { label: 'Refund Completed', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#bbf7d0]', icon: CheckCircle },
  SELLER_REJECTED: { label: 'Rejected by Seller', badge: 'bg-red-50 text-red-500 border-red-200', icon: AlertTriangle },
  CUSTOMER_ACCEPTS: { label: 'Offer Accepted', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#bbf7d0]', icon: CheckCircle },
  CLOSED: { label: 'Closed', badge: 'bg-gray-100 text-gray-500 border-gray-200', icon: CheckCircle },
  ADMIN_REVIEW: { label: 'Admin Reviewing', badge: 'bg-pink-50 text-pink-600 border-pink-200', icon: Scale },
  ADMIN_APPROVED_REFUND: { label: 'Approved by Admin', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#bbf7d0]', icon: CheckCircle },
  ADMIN_REJECTED_REFUND: { label: 'Rejected by Admin', badge: 'bg-red-50 text-red-500 border-red-200', icon: AlertTriangle },
  REPLACEMENT_PREPARING: { label: 'Replacement Preparing', badge: 'bg-violet-50 text-violet-600 border-violet-200', icon: Clock },
  REPLACEMENT_SHIPPED: { label: 'Replacement Shipped', badge: 'bg-sky-50 text-sky-600 border-sky-200', icon: Truck },
  EXCHANGE_COMPLETED: { label: 'Exchange Completed', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#bbf7d0]', icon: CheckCircle }
};

const getStatusMeta = (status) => STATUS_META[status] || { label: status, badge: 'bg-gray-50 text-gray-500 border-gray-200', icon: HelpCircle };

const getNextAction = (refund) => {
  const status = String(refund.status || '').toUpperCase();
  if (status === 'MORE_EVIDENCE_REQUESTED') return 'Upload evidence';
  if (status === 'RETURN_PENDING') return 'Submit return tracking';
  if (status === 'OFFER_MADE') return 'Review offer';
  if (status === 'REFUND_PROCESSING') {
    return refund.customerPayoutDetails || refund.payoutDetails || refund.payoutQrUrl
      ? 'Waiting for payout'
      : 'Submit payout details';
  }
  if (status === 'REPLACEMENT_SHIPPED') return 'Confirm replacement';
  if (['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED', 'ADMIN_REJECTED_REFUND'].includes(status)) return 'No action needed';
  return 'View details';
};

export default function CustomerRefundList({
  refunds,
  onSelectDetail,
  onRefresh
}) {
  return (
    <div className="pb-10 animate-in fade-in duration-300 font-sans">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[18px] font-black text-gray-900 tracking-tight leading-tight mb-0.5">
            My Disputes & Returns
          </h2>
          <p className="text-[11px] text-gray-500 font-semibold">
            Manage your issue tickets, refunds, and exchanges.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-gray-400 bg-white border border-gray-100 px-2.5 py-1.5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            Total: {refunds.length}
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-600 hover:text-[#10B981] hover:border-[#10B981] hover:bg-[#16A34A]/10 transition-colors px-3 py-1.5 border border-gray-200 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── List Content ── */}
      {refunds.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Scale className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1.5">You have not requested any refunds yet.</p>
          <p className="text-xs text-gray-500 font-semibold max-w-sm mx-auto">
            If you have issues with a delivered order, you can open a request from your "My Orders" page.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] divide-y divide-gray-100">
          {refunds.map(r => {
            const meta = getStatusMeta(r.status);
            const Icon = meta.icon;
            
            return (
              <button
                key={r.id}
                onClick={() => onSelectDetail(r.id)}
                className="w-full text-left px-5 py-3 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Product Image or Fallback Status Icon Box */}
                  <CustomerRefundListProductCell refund={r} />
                  
                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] font-black text-[#10B981] font-mono">
                        {r.refundNumber}
                      </span>
                      <span className={`inline-flex rounded text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                    
                    <p className="text-xs font-bold text-gray-800 truncate mb-0.5">
                      {r.type.replace('_', ' ')} · Order #{r.orderNumber || r.orderId}
                    </p>
                    
                    <p className="text-[9px] text-gray-400 font-semibold">
                      Seller: {r.sellerName || 'Seller'} | Amount: Rs. {Number(r.refundAmount || 0).toLocaleString()} | Submitted: {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] text-[#10B981] font-black uppercase tracking-wider mt-1">
                      Next action: {getNextAction(r)}
                    </p>
                  </div>
                </div>

                {/* Arrow Button */}
                <div className="w-7 h-7 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:bg-[#16A34A]/10 group-hover:border-emerald-100 transition-colors shadow-sm shrink-0">
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-[#10B981] transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
