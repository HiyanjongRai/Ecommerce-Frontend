import React from 'react';
import { 
  ChevronRight, ArrowLeft, CheckCircle, Box, Clock, Truck, 
  ShoppingBag, Download, FileText, XCircle, FileImage, ExternalLink, Headphones, HelpCircle, AlertTriangle
} from 'lucide-react';
import { useCustomerRefund } from '../hooks/useCustomerRefund';
import HorizontalProgressStepper from '../components/timeline/HorizontalProgressStepper';
import TimelineLogList from '../components/timeline/TimelineLogList';
import RefundWorkflowEngine from '../services/workflow/RefundWorkflowEngine';
import CustomerReturnShipping from './status-views/CustomerReturnShipping';
import { getStatusMeta } from '../constants/RefundConstants';
import { BASE_URL } from '../../../shared/api/apiClient';

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';
const dateLabel = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const formatStepDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getCustomBadgeClassAndLabel = (status) => {
  const base = "inline-flex items-center px-4 py-1.5 border rounded-full text-[13px] font-semibold tracking-wide whitespace-nowrap shadow-2xs transition-all";
  switch (status) {
    case 'REQUEST_CREATED':
      return {
        label: 'Requested',
        style: `${base} bg-gray-100 text-gray-700 border-gray-200`
      };
    case 'UNDER_REVIEW':
    case 'MORE_EVIDENCE_REQUESTED':
    case 'ADMIN_REVIEW':
      return {
        label: 'Verification',
        style: `${base} bg-purple-100 text-purple-700 border-purple-200`
      };
    case 'SELLER_APPROVED':
    case 'ADMIN_APPROVED_REFUND':
    case 'RETURN_PENDING':
    case 'RETURN_SHIPPED':
    case 'RETURN_RECEIVED':
      return {
        label: 'Approved',
        style: `${base} bg-blue-100 text-blue-700 border-blue-200`
      };
    case 'REFUND_PROCESSING':
    case 'PRODUCT_INSPECTION':
    case 'INSPECTION_COMPLETE':
      return {
        label: 'Processing',
        style: `${base} bg-orange-100 text-orange-700 border-orange-200`
      };
    case 'CLOSED':
      return {
        label: 'Closed',
        style: `${base} bg-gray-100 text-gray-700 border-gray-200`
      };
    case 'REFUND_COMPLETED':
    case 'CUSTOMER_ACCEPTS':
      return {
        label: 'Refunded',
        style: `${base} bg-emerald-100 text-emerald-700 border-emerald-200`
      };
    case 'EXCHANGE_COMPLETED':
      return {
        label: 'Completed',
        style: `${base} bg-emerald-100 text-emerald-700 border-emerald-200`
      };
    case 'SELLER_REJECTED':
    case 'ADMIN_REJECTED_REFUND':
      return {
        label: 'Rejected',
        style: `${base} bg-red-100 text-red-700 border-red-200`
      };
    default:
      return {
        label: status ? status.replace('_', ' ') : 'Unknown',
        style: `${base} bg-gray-100 text-gray-700 border-gray-200`
      };
  }
};

export default function CustomerRefundDetails({
  detailId,
  onBack,
  onRefreshList
}) {
  const {
    detail,
    detailLoading,
    orderDetail,
    actionError,
    setActionError,
    handleRefresh,
    handleMockAction
  } = useCustomerRefund({ detailId, onRefreshList });

  if (detailLoading || !detail) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-[#10B981] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading details...</p>
      </div>
    );
  }

  const meta = getStatusMeta ? getStatusMeta(detail.status) : { label: detail.status, badge: 'bg-gray-50 text-gray-500 border-gray-200' };
  const isFinalStatus = ['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED', 'ADMIN_REJECTED_REFUND'].includes(detail.status);

  // Calculate approval date if present in logs
  const getApprovalDate = () => {
    if (detail.auditLogs) {
      const log = detail.auditLogs.find(l => l.newStatus === 'SELLER_APPROVED' || l.newStatus === 'ADMIN_APPROVED_REFUND');
      return log?.createdAt || null;
    }
    return null;
  };
  const approvalDate = getApprovalDate();

  return (
    <div className="pb-10 max-w-5xl mx-auto animate-in fade-in duration-300 font-sans text-gray-800">
      {/* Breadcrumbs & Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            <span>Returns</span>
            <ChevronRight size={10} className="text-gray-300" />
            <span className="text-[#10B981]">Return Details</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">Return / Refund Details</h1>
          <p className="text-[13px] text-gray-500 mt-1.5 font-semibold">View the product, return reason, status and refund information.</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 hover:text-gray-900 transition-all px-3 py-1.5 border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 shrink-0 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Returns
        </button>
      </div>

      {/* Reusable Stepper Timeline */}
      <HorizontalProgressStepper
        status={detail.status}
        actorRole="CUSTOMER"
        auditLogs={detail.auditLogs || []}
      />

      {/* Actions Error Message */}
      {actionError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-xs font-bold mb-6 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-505 shrink-0 text-red-500" />
          {actionError}
        </div>
      )}

      {/* Main workflow engine dispatcher */}
      <div className="mb-4">
        <RefundWorkflowEngine
          actorRole="CUSTOMER"
          detail={detail}
          onRefresh={handleRefresh}
          setActionError={setActionError}
          isDark={false}
        />
      </div>

      {/* Product Details & Refund Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Column 1: Product Details (lg:col-span-2) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col justify-between">
          <div>
            <h3 className="text-[18px] font-bold text-slate-800 mb-4">Product Details</h3>
            <div className="space-y-4">
              {(detail.items?.length > 0 ? detail.items : [{ orderItemId: orderDetail?.items?.[0]?.id, quantity: detail.quantity || 1 }]).map((ritem, i) => {
                const oItem = orderDetail?.items?.find(oi => oi.id === ritem.orderItemId) || orderDetail?.items?.[0] || {};
                return (
                  <div key={i} className="flex flex-col sm:flex-row items-start gap-5 pb-4 border-b border-gray-150 last:border-0 last:pb-0 last:mb-0">
                    <div className="w-28 h-28 rounded-xl border border-gray-200 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center p-1">
                      <img 
                        src={getImgUrl(oItem.imagePath || detail.productImage) || "https://via.placeholder.com/120"} 
                        alt={oItem.productName || oItem.name || 'Product'} 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/120" }}
                      />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0 pt-1">
                      <h2 className="text-lg font-bold text-slate-800 leading-tight">
                        {oItem.productName || oItem.name || 'Product Details'}
                      </h2>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-500 items-center">
                        {oItem.brand && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                            Sold by {oItem.brand}
                          </span>
                        )}
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                          Qty: {ritem.quantity || 1}
                        </span>
                        <span className="bg-emerald-55 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100 uppercase text-[10px] font-bold">
                          {detail.type ? detail.type.toLowerCase().replace('_', ' ') : 'Refund'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">SKU: {oItem.sku || `SKU-${detail.orderId}`}</p>
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-[16px] font-bold text-slate-800">{money(oItem.price || (detail.refundAmount / (ritem.quantity || 1)))}</span>
                        <span className="text-xs text-gray-400 font-medium">x {ritem.quantity || 1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 2: Refund Summary Card (lg:col-span-1) */}
        <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col justify-between">
          <div>
            <h3 className="text-[18px] font-bold text-slate-800 mb-4">Refund Summary</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">Refund Amount</span>
                <span className="text-3xl font-black text-[#16A34A]">{money(detail.refundAmount)}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Status</span>
                {(() => {
                  const badgeInfo = getCustomBadgeClassAndLabel(detail.status);
                  return (
                    <span className={badgeInfo.style}>
                      {badgeInfo.label}
                    </span>
                  );
                })()}
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-3 text-xs text-gray-600 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-semibold">Refund Method</span>
                  <span className="text-slate-800 font-bold">{orderDetail?.paymentMethod || 'Original Source (eSewa)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-semibold">Expected Date</span>
                  <span className="text-slate-800 font-bold">
                    {approvalDate ? dateLabel(new Date(new Date(approvalDate).getTime() + 2 * 24 * 60 * 60 * 1000)) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-semibold">Order Reference</span>
                  <span className="text-slate-800 font-mono font-bold bg-gray-50 px-1.5 py-0.5 rounded">{detail.orderNumber || `ORD-${detail.orderId}`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Return & Refund Details Side-by-Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Return Details & Timeline Logs */}
        <div className="space-y-6">
          {/* Return Details Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 flex items-center justify-center shrink-0">
                <ShoppingBag size={16} className="text-[#16A34A]" />
              </div>
              <h3 className="text-[18px] font-bold text-slate-800">Return Details</h3>
            </div>

            <div className="space-y-0.5 text-sm text-gray-600 font-medium">
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Return ID</span>
                <span className="text-slate-800 font-bold font-mono text-right">{detail.refundNumber}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Reason</span>
                <span className="text-slate-800 font-bold capitalize text-right">{detail.reason ? detail.reason.replace('_', ' ').toLowerCase() : '—'}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Type</span>
                <span className="text-slate-800 font-bold capitalize text-right">{detail.type ? detail.type.toLowerCase().replace('_', ' ') : '—'}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Requested On</span>
                <span className="text-slate-800 font-bold text-right">{formatStepDate(detail.createdAt)}</span>
              </div>
              {approvalDate && (
                <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                  <span className="text-gray-400">Approved On</span>
                  <span className="text-slate-800 font-bold text-right">{formatStepDate(approvalDate)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Shipping Method</span>
                <span className="text-slate-800 font-bold flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded justify-end w-max ml-auto">
                  <Truck size={14} className="text-[#16A34A]" />
                  Self Ship
                </span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 last:border-0 items-center">
                <span className="text-gray-400">Tracking ID</span>
                <span className="text-right">
                  {detail.trackingNumber ? (
                    <span className="text-[#16A34A] font-bold font-mono inline-flex items-center gap-1 hover:underline cursor-pointer">
                      {detail.trackingNumber}
                      <ExternalLink size={12} />
                    </span>
                  ) : detail.status === 'RETURN_PENDING' ? (
                    <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs">Pending submission</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </span>
              </div>
            </div>

            {/* Styled Return Description Box */}
            <div className="bg-[#F8FAF7] border border-[#E5E7EB] rounded-[14px] p-4 mt-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Return Description</span>
              <p className="text-slate-700 leading-relaxed font-medium text-sm">
                {detail.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Custom check/message box */}
            <div className="mt-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-[#059669]">
              <CheckCircle size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {detail.status === 'RETURN_PENDING' ? (
                  <span>Return approved. Please submit the shipment tracking details.</span>
                ) : detail.status === 'RETURN_SHIPPED' ? (
                  <span>Return shipped. Merchant is waiting to receive the package.</span>
                ) : ['RETURN_RECEIVED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE'].includes(detail.status) ? (
                  <span>Return approved and item received. Your refund is being processed.</span>
                ) : detail.status === 'REFUND_COMPLETED' ? (
                  <span>Refund successfully processed. Thank you!</span>
                ) : (
                  <span>Return request is currently under review by the merchant.</span>
                )}
              </div>
            </div>

            {/* Return shipping instructions/form component */}
            <CustomerReturnShipping
              detail={detail}
              onRefresh={handleRefresh}
              setActionError={setActionError}
            />
          </div>

          {/* Activity timeline below details */}
          <TimelineLogList
            auditLogs={detail.auditLogs || []}
            description={detail.description || ''}
            actorRole="CUSTOMER"
            isDark={false}
          />
        </div>

        {/* Right Column: Refund Details & Support/Trust Elements */}
        <div className="space-y-6">
          {/* Refund Details Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 flex items-center justify-center shrink-0">
                <Box size={16} className="text-[#16A34A]" />
              </div>
              <h3 className="text-[18px] font-bold text-slate-800">Refund Details</h3>
            </div>

            <div className="space-y-0.5 text-sm text-gray-600 font-medium">
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Refund Method</span>
                <span className="text-slate-800 font-bold text-right bg-gray-50 px-2 py-0.5 rounded w-max ml-auto">Original Source ({orderDetail?.paymentMethod || 'eSewa'})</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Refund Amount</span>
                <span className="text-slate-800 font-bold text-right">{money(detail.refundAmount)}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Deductions</span>
                <span className="text-slate-800 font-bold text-right">Rs. 0.00</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-950 font-bold">Refundable Amount</span>
                <span className="text-[#16A34A] font-black text-lg text-right">{money(detail.refundAmount)}</span>
              </div>
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                <span className="text-gray-400">Refund Status</span>
                <span className="text-right">
                  {(() => {
                    const badgeInfo = getCustomBadgeClassAndLabel(detail.status);
                    return (
                      <span className={badgeInfo.style}>
                        {badgeInfo.label}
                      </span>
                    );
                  })()}
                </span>
              </div>
              {approvalDate && (
                <div className="grid grid-cols-2 py-3 border-b border-gray-100 items-center">
                  <span className="text-gray-400">Refund Initiated On</span>
                  <span className="text-slate-800 font-bold text-right">{dateLabel(approvalDate)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 py-3 border-b border-gray-100 last:border-0 items-center">
                <span className="text-gray-400">Expected Refund Date</span>
                <span className="text-slate-800 font-bold text-right">
                  {approvalDate ? dateLabel(new Date(new Date(approvalDate).getTime() + 2 * 24 * 60 * 60 * 1000)) : '—'}
                </span>
              </div>
            </div>

            <div className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-gray-600">
              <Clock size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {detail.status === 'REFUND_COMPLETED' ? (
                  <span>The refund has been completed and credited to your original payment source.</span>
                ) : (
                  <span>Once processed, the refund will be credited to your original payment method.</span>
                )}
              </div>
            </div>
          </div>

          {/* Support & Customer Trust Elements Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A] shrink-0">
                <Headphones size={18} />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-800">Support & Trust</h3>
                <p className="text-[12px] text-gray-500 font-semibold">Refund tracking & verification details</p>
              </div>
            </div>
            
            <div className="space-y-0.5 text-xs text-gray-600 font-medium">
              <div className="grid grid-cols-2 py-2.5 border-b border-gray-100 items-center">
                <span className="text-gray-400">Refund Reference ID</span>
                <span className="text-slate-800 font-bold font-mono text-right">{detail.refundNumber || `REF-${detail.id}`}</span>
              </div>
              <div className="grid grid-cols-2 py-2.5 border-b border-gray-100 items-center">
                <span className="text-gray-400">Expected Refund Date</span>
                <span className="text-slate-800 font-bold text-right">
                  {approvalDate ? dateLabel(new Date(new Date(approvalDate).getTime() + 2 * 24 * 60 * 60 * 1000)) : '—'}
                </span>
              </div>
              <div className="grid grid-cols-2 py-2.5 border-b border-gray-100 items-center">
                <span className="text-gray-400">Refund Destination</span>
                <span className="text-slate-800 font-bold text-right">{orderDetail?.paymentMethod || 'eSewa (Original Source)'}</span>
              </div>
              <div className="grid grid-cols-2 py-2.5 border-b border-gray-100 items-center">
                <span className="text-gray-400">Refund Method</span>
                <span className="text-slate-800 font-bold text-right">Automatic Payout</span>
              </div>
              <div className="grid grid-cols-2 py-2.5 last:border-0 items-center">
                <span className="text-gray-400">Need Help?</span>
                <span className="text-slate-800 font-bold text-right">Contact Support</span>
              </div>
            </div>

            {detail.status === 'CLOSED' && (
              <button
                onClick={() => alert('Support ticket system opening soon!')}
                className="w-full py-2.5 rounded-xl border border-[#16A34A] bg-white hover:bg-[#16A34A]/5 text-[#16A34A] font-bold text-xs transition-all shadow-xs text-center flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                <HelpCircle size={14} />
                Contact Support
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bottom Bar */}
      {!isFinalStatus && (
      <div className="flex flex-wrap gap-3 items-center justify-between border-t border-gray-200 pt-5 mt-6">
        <div className="flex gap-3">
          <button
            onClick={() => handleMockAction('Download Return Label')}
            className="flex items-center gap-2 text-[12px] font-bold text-slate-700 hover:text-slate-900 transition-all px-4 py-2 border border-gray-200 rounded-xl bg-white shadow-xs hover:bg-gray-50 cursor-pointer"
          >
            <Download size={14} />
            Download Return Label
          </button>
          <button
            onClick={() => handleMockAction('View Return Policy')}
            className="flex items-center gap-2 text-[12px] font-bold text-slate-700 hover:text-slate-900 transition-all px-4 py-2 border border-gray-200 rounded-xl bg-white shadow-xs hover:bg-gray-50 cursor-pointer"
          >
            <FileText size={14} />
            View Return Policy
          </button>
        </div>

        <div className="flex gap-3">
          {/* Cancel Button */}
          <button
            onClick={() => handleMockAction('Cancellation')}
            className="flex items-center gap-2 text-[12px] font-bold text-red-650 hover:bg-red-50 transition-all px-4 py-2 border border-red-200 rounded-xl bg-white shadow-xs cursor-pointer text-red-650"
          >
            <XCircle size={14} className="text-red-500" />
            Cancel Return
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
