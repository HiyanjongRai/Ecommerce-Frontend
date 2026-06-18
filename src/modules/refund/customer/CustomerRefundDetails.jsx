import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ArrowLeft, CheckCircle, Box, Clock, Truck, 
  ShoppingBag, Download, FileText, XCircle, FileImage, Upload, ExternalLink, Headphones, Scale, HelpCircle
} from 'lucide-react';
import { getOrderDetail } from '../../../shared/api/customerApi';
import { uploadRefundFile, uploadEvidence, getRefundDetails } from '../../../shared/api/refundApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import CustomerUnderReview from './status-views/CustomerUnderReview';
import CustomerReturnShipping from './status-views/CustomerReturnShipping';
import CustomerPayoutTracking from './status-views/CustomerPayoutTracking';
import CustomerRefundProcessing from './status-views/CustomerRefundProcessing';
import CustomerReplacementTracking from './status-views/CustomerReplacementTracking';

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

const getLogIcon = (status) => {
  switch (status) {
    case 'REQUEST_CREATED':
      return <Clock size={12} className="text-blue-500" />;
    case 'UNDER_REVIEW':
    case 'ADMIN_REVIEW':
      return <Scale size={12} className="text-amber-500" />;
    case 'MORE_EVIDENCE_REQUESTED':
      return <AlertTriangle size={12} className="text-red-500" />;
    case 'SELLER_APPROVED':
    case 'ADMIN_APPROVED_REFUND':
    case 'REFUND_COMPLETED':
    case 'EXCHANGE_COMPLETED':
      return <CheckCircle size={12} className="text-[#10B981]" />;
    case 'RETURN_PENDING':
    case 'RETURN_SHIPPED':
      return <Truck size={12} className="text-[#10B981]" />;
    default:
      return <CheckCircle size={12} className="text-gray-400" />;
  }
};

const getLogCircleStyle = (status) => {
  switch (status) {
    case 'MORE_EVIDENCE_REQUESTED':
    case 'SELLER_REJECTED':
    case 'ADMIN_REJECTED_REFUND':
      return 'bg-red-50 ring-red-100 border-red-200';
    case 'SELLER_APPROVED':
    case 'ADMIN_APPROVED_REFUND':
    case 'REFUND_COMPLETED':
    case 'EXCHANGE_COMPLETED':
      return 'bg-[#e6f7ec] ring-[#bbf7d0] border-[#10B981]/20';
    case 'REQUEST_CREATED':
    case 'UNDER_REVIEW':
      return 'bg-blue-50 ring-blue-100 border-blue-200';
    default:
      return 'bg-gray-50 ring-gray-100 border-gray-200';
  }
};

const STATUS_META = {
  REQUEST_CREATED: { label: 'Request Created', badge: 'bg-blue-50 text-blue-600 border-blue-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-50 text-amber-600 border-amber-200', icon: Scale },
  MORE_EVIDENCE_REQUESTED: { label: 'Evidence Required', badge: 'bg-red-50 text-red-500 border-red-200', icon: AlertTriangle },
  OFFER_MADE: { label: 'Offer Pending', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: Clock },
  SELLER_APPROVED: { label: 'Approved by Seller', badge: 'bg-[#e6f7ec] text-[#10B981] border-[#10B981]/20', icon: CheckCircle },
  RETURN_PENDING: { label: 'Return Pending', badge: 'bg-amber-50 text-amber-600 border-amber-200', icon: Truck },
  RETURN_SHIPPED: { label: 'Return Shipped', badge: 'bg-blue-50 text-blue-600 border-blue-200', icon: Truck },
  RETURN_RECEIVED: { label: 'Return Received', badge: 'bg-[#e6f7ec] text-[#10B981] border-[#10B981]/20', icon: CheckCircle },
  PRODUCT_INSPECTION: { label: 'Product Inspection', badge: 'bg-violet-50 text-violet-600 border-violet-200', icon: Scale },
  INSPECTION_COMPLETE: { label: 'Inspection Complete', badge: 'bg-purple-50 text-purple-600 border-purple-200', icon: CheckCircle },
  REFUND_PROCESSING: { label: 'Refund Processing', badge: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock },
  REFUND_COMPLETED: { label: 'Refund Completed', badge: 'bg-[#e6f7ec] text-[#10B981] border-[#10B981]/20', icon: CheckCircle },
  SELLER_REJECTED: { label: 'Rejected by Seller', badge: 'bg-red-50 text-red-500 border-red-200', icon: AlertTriangle },
  CUSTOMER_ACCEPTS: { label: 'Offer Accepted', badge: 'bg-[#e6f7ec] text-[#10B981] border-[#10B981]/20', icon: CheckCircle },
  CLOSED: { label: 'Closed', badge: 'bg-gray-100 text-gray-500 border-gray-200', icon: CheckCircle },
  ADMIN_REVIEW: { label: 'Admin Reviewing', badge: 'bg-pink-50 text-pink-600 border-pink-200', icon: Scale },
  ADMIN_APPROVED_REFUND: { label: 'Approved by Admin', badge: 'bg-[#e6f7ec] text-[#10B981] border-[#10B981]/20', icon: CheckCircle },
  ADMIN_REJECTED_REFUND: { label: 'Rejected by Admin', badge: 'bg-red-50 text-red-500 border-red-200', icon: AlertTriangle },
  REPLACEMENT_PREPARING: { label: 'Replacement Preparing', badge: 'bg-violet-50 text-violet-600 border-violet-200', icon: Clock },
  REPLACEMENT_SHIPPED: { label: 'Replacement Shipped', badge: 'bg-sky-50 text-sky-600 border-sky-200', icon: Truck },
  EXCHANGE_COMPLETED: { label: 'Exchange Completed', badge: 'bg-[#e6f7ec] text-[#10B981] border-[#10B981]/20', icon: CheckCircle }
};

import { AlertTriangle } from 'lucide-react';

const getStatusMeta = (status) => STATUS_META[status] || { label: status, badge: 'bg-gray-50 text-gray-500 border-gray-200', icon: HelpCircle };

export default function CustomerRefundDetails({
  detailId,
  onBack,
  onRefreshList
}) {
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState(null);
  const [actionError, setActionError] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const loadDetails = async () => {
    setDetailLoading(true);
    setActionError('');
    try {
      const res = await getRefundDetails(detailId);
      setDetail(res.data);
      if (res.data?.orderId) {
        try {
          const orderRes = await getOrderDetail(res.data.orderId);
          setOrderDetail(orderRes.data);
        } catch (err) {
          console.error('Failed to load order details', err);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (detailId) {
      loadDetails();
    }
  }, [detailId]);

  const handleRefresh = () => {
    loadDetails();
    onRefreshList();
  };

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

  const meta = getStatusMeta(detail.status);

  // Stepper timeline
  const getTimelineDates = () => {
    const dates = { requested: detail.createdAt, approved: null, shipped: null, returned: null, processing: null, refunded: null };
    if (detail.auditLogs) {
      detail.auditLogs.forEach(log => {
        const status = log.newStatus;
        if ((status === 'SELLER_APPROVED' || status === 'ADMIN_APPROVED_REFUND') && !dates.approved) dates.approved = log.createdAt;
        if (log.notes?.toLowerCase().includes('tracking') && !dates.shipped) dates.shipped = log.createdAt;
        if (status === 'RETURN_RECEIVED' && !dates.returned) dates.returned = log.createdAt;
        if (status === 'REFUND_PROCESSING' && !dates.processing) dates.processing = log.createdAt;
        if ((status === 'REFUND_COMPLETED' || status === 'EXCHANGE_COMPLETED' || status === 'CLOSED') && !dates.refunded) dates.refunded = log.createdAt;
      });
    }
    if (detail.trackingNumber && !dates.shipped) dates.shipped = detail.updatedAt;
    if (!dates.approved && (dates.shipped || dates.returned || dates.refunded)) dates.approved = dates.requested;
    if (!dates.shipped && (dates.returned || dates.refunded)) dates.shipped = dates.approved || dates.requested;
    if (!dates.returned && dates.refunded) dates.returned = dates.shipped;
    return dates;
  };

  const stepDates = getTimelineDates();
  
  const HORIZ_STEPS = [
    { label: 'Requested', date: stepDates.requested },
    { label: 'Approved', date: stepDates.approved },
    { label: 'Received', date: stepDates.returned },
    { label: 'Processing', date: stepDates.processing || (detail.status === 'REFUND_PROCESSING' ? detail.updatedAt : null) },
    { label: 'Completed', date: stepDates.refunded }
  ];

  let activeIdx = 0;
  if (['SELLER_APPROVED', 'ADMIN_APPROVED_REFUND', 'RETURN_PENDING', 'RETURN_SHIPPED'].includes(detail.status)) {
    activeIdx = 1;
  } else if (['RETURN_RECEIVED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE'].includes(detail.status)) {
    activeIdx = 2;
  } else if (['REFUND_PROCESSING'].includes(detail.status)) {
    activeIdx = 3;
  } else if (['REFUND_COMPLETED', 'REPLACEMENT_PREPARING', 'REPLACEMENT_SHIPPED', 'EXCHANGE_COMPLETED', 'CLOSED', 'CUSTOMER_ACCEPTS', 'ADMIN_REJECTED_REFUND'].includes(detail.status)) {
    activeIdx = 4;
  }

  const handleMockAction = (actionName) => {
    alert(`This refund request is currently ${meta.label.toLowerCase()}. To perform a "${actionName}", please use the support desk or active resolution buttons.`);
  };

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
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">Return / Refund Details</h1>
          <p className="text-[11px] text-gray-500 mt-1.5 font-semibold">View the product, return reason, status and refund information.</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 hover:text-gray-900 transition-all px-3 py-1.5 border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 shrink-0 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Returns
        </button>
      </div>

      {/* Progress Stepper Tracker Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="relative flex justify-between items-start w-full max-w-3xl mx-auto my-2 px-4">
          <div className="absolute top-3 left-6 right-6 h-1 bg-gray-100 -z-0 rounded-full" />
          <div 
            className="absolute top-3 left-6 h-1 bg-[#10B981] transition-all duration-500 ease-out -z-0 rounded-full" 
            style={{ width: `${(activeIdx / (HORIZ_STEPS.length - 1)) * 100}%` }}
          />
          {HORIZ_STEPS.map((step, idx) => {
            const completed = idx < activeIdx;
            const current = idx === activeIdx;
            
            let CircleIcon = null;
            if (idx === 0 || idx === 1) CircleIcon = <CheckCircle size={14} />;
            else if (idx === 2) CircleIcon = <Box size={14} />;
            else if (idx === 3) CircleIcon = <Clock size={14} />;
            else CircleIcon = <CheckCircle size={14} />;

            return (
              <div key={idx} className="flex flex-col items-center flex-1 text-center z-10 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  completed 
                    ? 'bg-[#10B981] border-[#10B981] text-white font-bold' 
                    : current
                      ? 'bg-white border-[#10B981] text-[#10B981] font-bold shadow-sm ring-2 ring-emerald-50'
                      : 'bg-white border-gray-200 text-gray-300'
                }`}>
                  {completed ? <span className="text-white text-xs">✓</span> : CircleIcon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider mt-2 ${completed || current ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block font-semibold">
                  {step.date ? dateLabel(step.date) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-xs font-bold mb-6 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Product & Order Info Horizontal Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl border border-gray-100 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center p-1.5">
            <img 
              src={getImgUrl(orderDetail?.items?.[0]?.imagePath || detail.product?.imagePath) || "https://via.placeholder.com/120"} 
              alt={orderDetail?.items?.[0]?.name || 'Product'} 
              className="max-w-full max-h-full object-contain"
              onError={(e) => { e.target.src = "https://via.placeholder.com/120" }}
            />
          </div>
          <div className="space-y-1 flex-1 min-w-0 pt-0.5">
            <h2 className="text-[13px] font-black text-gray-900 truncate leading-tight">
              {orderDetail?.items?.[0]?.name || 'Product Details'}
            </h2>
            <div className="text-[10px] text-gray-500 font-bold flex flex-wrap gap-2">
              {orderDetail?.items?.[0]?.brand && <span>Sold by {orderDetail.items[0].brand}</span>}
              <span>Qty: {orderDetail?.items?.[0]?.quantity || 1}</span>
            </div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">SKU: {orderDetail?.items?.[0]?.sku || `SKU-${detail.orderId}`}</p>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-[13px] font-black text-gray-900">{money(detail.refundAmount)}</span>
              <span className="text-[10px] text-gray-400 font-bold">x {orderDetail?.items?.[0]?.quantity || 1}</span>
            </div>
          </div>
          <div className="border-l border-gray-100 pl-5 h-full hidden md:flex items-center">
            <div className="text-center">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-0.5">Total Refund</span>
              <span className="text-base font-black text-[#10B981]">{money(detail.refundAmount)}</span>
            </div>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5 space-y-2.5 text-[11px] font-semibold text-gray-600">
          <div className="flex justify-between items-center">
            <span>Order ID</span>
            <span className="text-gray-900 font-bold font-mono bg-gray-50 px-1.5 py-0.5 rounded">{detail.orderNumber || `ORD-${detail.orderId}`}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Order Date</span>
            <span className="text-gray-900 font-bold">{orderDetail?.orderDate ? dateLabel(orderDetail.orderDate) : 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Payment Method</span>
            <span className="text-gray-900 font-bold uppercase">{orderDetail?.paymentMethod || 'eSewa'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Total Paid</span>
            <span className="text-gray-900 font-black">{orderDetail?.totalAmount ? money(orderDetail.totalAmount) : money(detail.refundAmount)}</span>
          </div>
        </div>
      </div>

      {/* Return & Refund Details Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Left Card: Return Details */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <ShoppingBag size={14} className="text-[#10B981]" />
              </div>
              <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Return Details</h3>
            </div>

            <div className="space-y-3 text-[11px] font-semibold text-gray-600">
              <div className="flex justify-between items-center">
                <span>Return ID</span>
                <span className="text-gray-900 font-bold font-mono">{detail.refundNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Reason</span>
                <span className="text-gray-900 font-bold capitalize">{detail.reason.replace('_', ' ').toLowerCase()}</span>
              </div>
              <div className="flex flex-col gap-1.5 border border-gray-100 rounded-xl p-2.5 bg-gray-50/50">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Description</span>
                <p className="text-gray-800 leading-relaxed font-medium">
                  {detail.description || 'No detailed description provided.'}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span>Type</span>
                <span className="text-gray-900 font-bold capitalize">{detail.type.toLowerCase().replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Requested On</span>
                <span className="text-gray-900 font-bold">{formatStepDate(detail.createdAt)}</span>
              </div>
              {stepDates.approved && (
                <div className="flex justify-between items-center">
                  <span>Approved On</span>
                  <span className="text-gray-900 font-bold">{formatStepDate(stepDates.approved)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Shipping Method</span>
                <span className="text-gray-900 font-bold flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                  <Truck size={12} className="text-[#10B981]" />
                  Self Ship
                </span>
              </div>

              {/* Dynamic Tracking Section */}
              <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1.5">
                <span>Tracking ID</span>
                {detail.trackingNumber ? (
                  <span className="text-[#10B981] font-bold font-mono flex items-center gap-1 hover:underline cursor-pointer">
                    {detail.trackingNumber}
                    <ExternalLink size={10} />
                  </span>
                ) : detail.status === 'RETURN_PENDING' ? (
                  <span className="text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Pending submission</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>

              {/* Return Tracking Form Component */}
              <CustomerReturnShipping
                detail={detail}
                onRefresh={handleRefresh}
                setActionError={setActionError}
              />

              {stepDates.returned && (
                <div className="flex justify-between items-center">
                  <span>Item Received On</span>
                  <span className="text-gray-900 font-bold">{formatStepDate(stepDates.returned)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 p-3 bg-emerald-50/50 border border-[#10B981]/20 rounded-xl flex items-start gap-2.5 text-[11px] font-semibold text-[#059669]">
            <CheckCircle size={14} className="text-[#10B981] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
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
        </div>

        {/* Right Card: Refund Details */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Box size={14} className="text-[#10B981]" />
              </div>
              <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Refund Details</h3>
            </div>

            <div className="space-y-3.5 text-[11px] font-semibold text-gray-600">
              <div className="flex justify-between items-center">
                <span>Refund Method</span>
                <span className="text-gray-900 font-bold bg-gray-50 px-1.5 py-0.5 rounded">Original Source ({orderDetail?.paymentMethod || 'eSewa'})</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Refund Amount</span>
                <span className="text-gray-900 font-bold">{money(detail.refundAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Deductions</span>
                <span className="text-gray-900 font-bold">Rs. 0.00</span>
              </div>
              
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-gray-900 font-bold">Refundable Amount</span>
                <span className="text-[#10B981] font-black text-[15px]">{money(detail.refundAmount)}</span>
              </div>

              <div className="flex justify-between items-center pt-1.5">
                <span>Refund Status</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase border tracking-wider ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>

              {stepDates.approved && (
                <div className="flex justify-between items-center">
                  <span>Refund Initiated On</span>
                  <span className="text-gray-900 font-bold">{dateLabel(stepDates.approved)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Expected Refund Date</span>
                <span className="text-gray-900 font-bold">
                  {stepDates.approved ? dateLabel(new Date(new Date(stepDates.approved).getTime() + 2 * 24 * 60 * 60 * 1000)) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-2 text-[11px] font-semibold text-gray-600">
            <Clock size={14} className="text-[#10B981] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {detail.status === 'REFUND_COMPLETED' ? (
                <span>The refund has been completed and credited to your original payment source.</span>
              ) : (
                <span>Once processed, the refund will be credited to your original payment method.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Evidence Upload Block */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <FileImage size={14} className="text-[#10B981]" />
            Evidence Photos ({detail.evidence?.length || 0})
          </h3>
          {detail.status === 'MORE_EVIDENCE_REQUESTED' && (
            <span className="text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded-full">
              Additional proof required
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {detail.evidence && detail.evidence.map(e => (
            <div key={e.id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-square bg-gray-50 shadow-sm">
              <img 
                src={getImgUrl(e.fileUrl)} 
                alt="Evidence file"
                className="w-full h-full object-cover"
              />
              <a 
                href={getImgUrl(e.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
              >
                <ExternalLink size={20} />
              </a>
            </div>
          ))}

          {/* Dynamic Direct Upload Block */}
          {detail.status === 'MORE_EVIDENCE_REQUESTED' && (
            <label className="border-2 border-dashed border-gray-200 hover:border-[#10B981] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-emerald-50/50 transition-all aspect-square text-center">
              <Upload size={20} className="text-[#10B981] mb-2" />
              <span className="text-xs font-black text-gray-800 block mb-0.5">Upload More</span>
              <span className="text-[9px] text-gray-400 font-bold block uppercase">JPG, PNG &bull; Max 5MB</span>
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUploadingEvidence(true);
                  setActionError('');
                  try {
                    const uploadRes = await uploadRefundFile(file);
                    const fileUrl = uploadRes.data?.fileUrl;
                    if (!fileUrl) throw new Error('File URL not returned');
                    await uploadEvidence(detail.id, { fileUrl, note: 'Uploaded additional evidence' });
                    handleRefresh();
                  } catch (err) {
                    setActionError(err.response?.data?.message || 'Upload failed');
                  } finally {
                    setUploadingEvidence(false);
                  }
                }}
                className="hidden"
              />
            </label>
          )}
        </div>

        {detail.status === 'MORE_EVIDENCE_REQUESTED' && (
          <div className="bg-red-50/50 border border-red-200 rounded-xl p-3 text-[11px] text-red-700 font-semibold leading-relaxed flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <span>The {detail.auditLogs?.some(log => log.newStatus === 'MORE_EVIDENCE_REQUESTED' && log.actorRole === 'ADMIN') ? 'Admin' : 'Seller'} has requested additional pictures. Please upload clear photos of the damaged area using the upload box above.</span>
          </div>
        )}
      </div>

      {/* Appeal Form Component */}
      <CustomerUnderReview
        detail={detail}
        onRefresh={handleRefresh}
        setActionError={setActionError}
      />

      {/* Customer Payout Account/QR details collector */}
      <CustomerRefundProcessing
        detail={detail}
        onRefresh={handleRefresh}
        setActionError={setActionError}
      />

      {/* Customer Replacement Product Action Center */}
      <CustomerReplacementTracking
        detail={detail}
        onRefresh={handleRefresh}
        setActionError={setActionError}
      />

      {/* Timeline & Support Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
          <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4">
            Return Activity Timeline
          </h3>

          <div className="space-y-5 relative pl-3 before:absolute before:top-2 before:bottom-2 before:left-[21px] before:w-[3px] before:bg-gray-100">
            {detail.auditLogs && detail.auditLogs.map((log, idx) => (
              <div key={idx} className="flex gap-3 items-start text-[11px] leading-relaxed relative">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white ${getLogCircleStyle(log.newStatus)}`}>
                  {getLogIcon(log.newStatus)}
                </div>
                <div className="flex-1 flex justify-between flex-wrap gap-2 pt-0.5 bg-gray-50 border border-gray-100 rounded-xl p-2.5">
                  <div>
                    <span className="font-black text-gray-900 block mb-0.5">
                      {log.notes || 'Status updated'}
                    </span>
                    <span className="text-gray-500 font-semibold text-[10px]">
                      Action by <span className="uppercase text-gray-700 font-bold">{log.actorRole?.toLowerCase() || 'System'}</span> &bull; Status: {log.newStatus ? log.newStatus.replace(/_/g, ' ') : 'N/A'}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold mt-0.5">
                    {formatStepDate(log.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-100/60 rounded-2xl p-5 space-y-3 flex flex-col justify-between font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center text-[#10B981] shrink-0">
              <Headphones size={18} />
            </div>
            <h3 className="text-[13px] font-black text-gray-900 block mt-3">Need Help?</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
              If you have any questions regarding your return or refund, our dedicated support team is always here to assist you.
            </p>
          </div>
          <button
            onClick={() => alert('Support ticket system opening soon!')}
            className="w-full py-2 rounded-xl border border-[#10B981] bg-white hover:bg-emerald-50 text-[#10B981] font-black text-[11px] transition-all shadow-sm text-center flex items-center justify-center gap-1.5 cursor-pointer mt-3"
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* Actions Bottom Bar */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between border-t border-gray-100 pt-5 mt-6">
        <div className="flex gap-2.5">
          <button
            onClick={() => handleMockAction('Download Return Label')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 hover:text-gray-900 transition-all px-3 py-2 border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 cursor-pointer"
          >
            <Download size={14} />
            Download Return Label
          </button>
          <button
            onClick={() => handleMockAction('View Return Policy')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 hover:text-gray-900 transition-all px-3 py-2 border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 cursor-pointer"
          >
            <FileText size={14} />
            View Return Policy
          </button>
        </div>

        <div className="flex gap-2.5">
          {/* Active dynamic customer actions */}
          <CustomerPayoutTracking
            detail={detail}
            onRefresh={handleRefresh}
            setActionError={setActionError}
          />

          {detail.status === 'SELLER_REJECTED' && (
            <button
              onClick={() => {
                const el = document.getElementById('appeal-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 border border-red-500 hover:bg-red-50 text-red-600 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer"
            >
              Appeal Rejection
            </button>
          )}

          {/* Cancel Button */}
          <button
            onClick={() => handleMockAction('Cancellation')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-all px-3 py-2 border border-red-200 rounded-lg bg-white shadow-sm cursor-pointer"
          >
            <XCircle size={14} className="text-red-500" />
            Cancel Return
          </button>
        </div>
      </div>
    </div>
  );
}
