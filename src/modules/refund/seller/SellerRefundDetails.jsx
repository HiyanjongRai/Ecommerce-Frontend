import React from 'react';
import { ArrowLeft, AlertCircle, Clock, Scale, CheckCircle, AlertTriangle, Package, Info, ExternalLink, Coins, Truck } from 'lucide-react';
import SellerUnderReview from './status-views/SellerUnderReview';
import SellerReturnDetails from './status-views/SellerReturnDetails';
import SellerQualityInspection from './status-views/SellerQualityInspection';
import SellerPayoutProcessing from './status-views/SellerPayoutProcessing';
import SellerRefundCompleted from './status-views/SellerRefundCompleted';
import SellerReplacementShipping from './status-views/SellerReplacementShipping';

const STATUS_META = {
  REQUEST_CREATED: { label: 'Request Created', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: Scale },
  MORE_EVIDENCE_REQUESTED: { label: 'Evidence Required', badge: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  OFFER_MADE: { label: 'Offer Pending', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Clock },
  SELLER_APPROVED: { label: 'Approved by Seller', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  RETURN_PENDING: { label: 'Return Pending', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Package },
  RETURN_SHIPPED: { label: 'Return Shipped', badge: 'bg-sky-50 text-sky-700 border-sky-200', icon: Package },
  RETURN_RECEIVED: { label: 'Return Received', badge: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle },
  PRODUCT_INSPECTION: { label: 'Product Inspection', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: Scale },
  INSPECTION_COMPLETE: { label: 'Inspection Complete', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle },
  REFUND_PROCESSING: { label: 'Refund Processing', badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock },
  PENDING_ADMIN_VERIFICATION: { label: 'Pending Admin Verification', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: Clock },
  REFUND_COMPLETED: { label: 'Refund Completed', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
  SELLER_REJECTED: { label: 'Rejected by Seller', badge: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  CUSTOMER_ACCEPTS: { label: 'Offer Accepted', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  CLOSED: { label: 'Closed', badge: 'bg-gray-200 text-gray-500 border-gray-300', icon: CheckCircle },
  ADMIN_REVIEW: { label: 'Admin Reviewing', badge: 'bg-pink-50 text-pink-700 border-pink-200', icon: Scale },
  ADMIN_APPROVED_REFUND: { label: 'Approved by Admin', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  ADMIN_REJECTED_REFUND: { label: 'Rejected by Admin', badge: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  REPLACEMENT_PREPARING: { label: 'Replacement Preparing', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: Clock },
  REPLACEMENT_SHIPPED: { label: 'Replacement Shipped', badge: 'bg-sky-50 text-sky-700 border-sky-200', icon: Package },
  EXCHANGE_COMPLETED: { label: 'Exchange Completed', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle }
};

const getStatusMeta = (status) => STATUS_META[status] || { label: status, badge: 'bg-gray-50 text-gray-500 border-gray-250', icon: Info };

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';
const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const SELLER_ACTION_STATUSES = ['REQUEST_CREATED', 'UNDER_REVIEW', 'RETURN_SHIPPED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE', 'REFUND_PROCESSING'];

export default function SellerRefundDetails({
  detail,
  onBack,
  onRefresh,
  error,
  setError
}) {
  const meta = getStatusMeta(detail.status);
  const actionRequired = SELLER_ACTION_STATUSES.includes(detail.status);

  // Negotiation Status check
  const latestCustomerAction = React.useMemo(() => {
    if (!detail?.auditLogs || detail.auditLogs.length === 0) return null;
    const logs = [...detail.auditLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return logs.find(log => log.actorRole?.toUpperCase() === 'CUSTOMER');
  }, [detail]);

  const negotiationStatus = React.useMemo(() => {
    const isNegotiated = latestCustomerAction && latestCustomerAction.notes?.toLowerCase().includes('initiated negotiation');
    const isFullRefundRequest = latestCustomerAction && latestCustomerAction.notes?.toLowerCase().includes("rejected the seller's offer");
    return { isNegotiated, isFullRefundRequest };
  }, [latestCustomerAction]);

  const renderActionBar = () => {
    const status = detail.status;
    if (['REQUEST_CREATED', 'UNDER_REVIEW', 'MORE_EVIDENCE_REQUESTED', 'OFFER_MADE'].includes(status)) {
      return (
        <SellerUnderReview
          detail={detail}
          isNegotiated={negotiationStatus.isNegotiated}
          isFullRefundRequest={negotiationStatus.isFullRefundRequest}
          onRefresh={onRefresh}
          setError={setError}
        />
      );
    }
    if (['RETURN_PENDING', 'RETURN_SHIPPED', 'RETURN_RECEIVED'].includes(status)) {
      return (
        <SellerReturnDetails
          detail={detail}
          onRefresh={onRefresh}
          setError={setError}
        />
      );
    }
    if (['PRODUCT_INSPECTION', 'INSPECTION_COMPLETE'].includes(status)) {
      return (
        <SellerQualityInspection
          detail={detail}
          onRefresh={onRefresh}
          setError={setError}
        />
      );
    }
    if (['REFUND_PROCESSING', 'PENDING_ADMIN_VERIFICATION'].includes(status)) {
      return (
        <SellerPayoutProcessing
          detail={detail}
          onRefresh={onRefresh}
          setError={setError}
        />
      );
    }
    if (status === 'REPLACEMENT_PREPARING') {
      return (
        <SellerReplacementShipping
          detail={detail}
          onRefresh={onRefresh}
          setError={setError}
        />
      );
    }
    if (['REPLACEMENT_SHIPPED', 'EXCHANGE_COMPLETED'].includes(status)) {
      return (
        <div className="border border-violet-200 bg-violet-50/20 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-violet-900 flex items-center gap-1.5">
            <Truck size={15} /> Replacement Shipment Shipped
          </h4>
          <div className="text-xs font-semibold text-gray-700 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Courier Name:</span>
              <span className="text-gray-900 font-bold">{detail.replacementCourier || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tracking Number:</span>
              <span className="text-gray-900 font-mono font-bold">{detail.replacementTrackingNumber || 'N/A'}</span>
            </div>
            {detail.replacementShippedAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">Shipped At:</span>
                <span className="text-gray-900">{dateLabel(detail.replacementShippedAt)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return <SellerRefundCompleted detail={detail} />;
  };

  return (
    <div className="space-y-4 max-w-[1400px] font-sans animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to List
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-150 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black text-gray-800">{detail.refundNumber}</span>
                <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${meta.badge}`}>
                  {meta.label}
                </span>
                {actionRequired && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-[9px] font-black">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    Action Required
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 font-bold flex items-center gap-2">
                <span>Order ID: <span className="text-gray-600 font-mono">ORD-{detail.orderNumber || detail.orderId}</span></span>
                <span>•</span>
                <span>Requested: <span className="font-bold text-gray-600">{dateLabel(detail.createdAt)}</span></span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-black text-base text-gray-850 block">{money(detail.refundAmount)}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Refund Amount Claimed</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Split Info Panel */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Product & Customer Details */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <Package size={14} className="text-indigo-600" />
                  Claim Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
                  <div>
                    <span className="text-gray-450 block text-[9px] uppercase tracking-widest">Customer</span>
                    <span className="text-gray-850 font-bold">{detail.customerName || 'Customer'}</span>
                  </div>
                  <div>
                    <span className="text-gray-450 block text-[9px] uppercase tracking-widest">Customer Email</span>
                    <span className="text-gray-850">{detail.customerEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-450 block text-[9px] uppercase tracking-widest">Return Reason</span>
                    <span className="text-gray-850 capitalize font-bold">{detail.reason?.replace('_', ' ').toLowerCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-455 block text-[9px] uppercase tracking-widest">Type</span>
                    <span className="text-gray-850 capitalize">{detail.type?.toLowerCase().replace('_', ' ')}</span>
                  </div>
                  {detail.returnRequired != null && (
                    <div>
                      <span className="text-gray-450 block text-[9px] uppercase tracking-widest">Return Requirement</span>
                      <span className={`font-bold ${detail.returnRequired ? 'text-indigo-600' : 'text-emerald-600'}`}>
                        {detail.returnRequired ? 'Need Return' : 'No Return (Direct Refund)'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-150 pt-3">
                  <span className="text-gray-450 block text-[9px] uppercase tracking-widest mb-1">Description / Notes</span>
                  <p className="text-gray-800 font-medium bg-white border border-gray-200 rounded-lg p-2.5 leading-relaxed font-sans">
                    {detail.description || 'No detailed description provided.'}
                  </p>
                </div>
              </div>

              {/* Evidence Photos */}
              {detail.evidence && detail.evidence.length > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-2">Evidence Uploads</h4>
                  <div className="flex flex-wrap gap-3">
                    {detail.evidence.map(e => (
                      <div key={e.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square w-20 bg-white">
                        <img
                          src={e.fileUrl.startsWith('http') ? e.fileUrl : `http://localhost:8080${e.fileUrl.startsWith('/') ? '' : '/'}${e.fileUrl}`}
                          alt="Evidence"
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={e.fileUrl.startsWith('http') ? e.fileUrl : `http://localhost:8080${e.fileUrl.startsWith('/') ? '' : '/'}${e.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payout Details */}
              {detail.paymentProofUrl && (
                <div className="bg-orange-50/20 border border-orange-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-orange-850 border-b border-orange-200 pb-2 flex items-center gap-2">
                    <Coins size={14} className="text-orange-600" />
                    Submitted Refund Payout Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
                    <div>
                      <span className="text-gray-450 block text-[9px] uppercase tracking-widest">Transaction Reference</span>
                      <span className="text-gray-850 font-mono font-bold bg-white px-2 py-1 border border-gray-200 rounded inline-block mt-0.5">
                        {detail.paymentReference}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-450 block text-[9px] uppercase tracking-widest">Payout Date</span>
                      <span className="text-gray-850">{dateLabel(detail.updatedAt)}</span>
                    </div>
                  </div>
                  {detail.paymentComment && (
                    <div className="border-t border-orange-150/40 pt-3">
                      <span className="text-gray-450 block text-[9px] uppercase tracking-widest mb-1">Remarks / Explanation</span>
                      <p className="text-gray-800 font-medium bg-white border border-gray-200 rounded-lg p-2.5 leading-relaxed font-sans">
                        {detail.paymentComment}
                      </p>
                    </div>
                  )}
                  <div className="border-t border-orange-150/40 pt-3">
                    <span className="text-gray-455 block text-[9px] uppercase tracking-widest mb-2">Screenshot Proof</span>
                    <div className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video w-48 bg-white">
                      <img
                        src={detail.paymentProofUrl.startsWith('http') ? detail.paymentProofUrl : `http://localhost:8080${detail.paymentProofUrl.startsWith('/') ? '' : '/'}${detail.paymentProofUrl}`}
                        alt="Payout Proof"
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={detail.paymentProofUrl.startsWith('http') ? detail.paymentProofUrl : `http://localhost:8080${detail.paymentProofUrl.startsWith('/') ? '' : '/'}${detail.paymentProofUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4 max-h-[450px] overflow-y-auto">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-2">Activity Timeline</h4>
              <div className="space-y-4 relative pl-3 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-0.5 before:bg-gray-250">
                {detail.auditLogs?.slice().reverse().map(log => (
                  <div key={log.id} className="flex gap-3 items-start text-xs leading-relaxed relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shrink-0 mt-1.5 z-10" />
                    <div className="flex-1">
                      <span className="font-bold text-gray-800 block">{log.notes || 'Status updated'}</span>
                      <span className="text-[10px] text-gray-450 block font-medium">
                        {log.actorRole} · {dateLabel(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Render Action Bar and corresponding status views */}
          {renderActionBar()}
        </div>
      </div>
    </div>
  );
}
