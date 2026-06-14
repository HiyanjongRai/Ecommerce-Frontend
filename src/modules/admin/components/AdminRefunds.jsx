import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  getAdminRefunds,
  adminConfirmRefundCompletionWithAmount,
  adminRecordRefundPaymentEvent,
  adminUpdateRefundStatus,
  adminFinalizeRefund,
} from '../services/adminService';
import { BASE_URL } from '../../../shared/api/apiConfig';
import EvidencePreviewModal from '../../dispute/components/EvidencePreviewModal';
import { useAdminTheme } from '../hooks/useAdminTheme';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Clock, CreditCard, Image as ImageIcon, RefreshCw, XCircle,
} from 'lucide-react';

/* ─── Helpers ────────────────────────────────────────────────────── */
const money = (v) => `Rs. ${Number(v || 0).toLocaleString()}`;
const SAFE_REF = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const safeSuffix = (id) => {
  let v = Number(id || 0), s = '';
  do { s = SAFE_REF[v % SAFE_REF.length] + s; v = Math.floor(v / SAFE_REF.length); } while (v > 0);
  return s.padStart(8, 'A').slice(-8);
};
const refDate  = (val) => { const d = val ? new Date(val) : new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`; };
const refundRef = (r) => r.publicReferenceId || r.refundReferenceId || r.referenceId || `REF-${refDate(r.createdAt)}-${safeSuffix(r.id)}`;
const orderRef  = (r) => r.customOrderId || r.orderReferenceId || (r.orderId ? `Order #${r.orderId}` : 'N/A');
const evidenceUrl = (path) => { if (!path) return null; return path.startsWith('http') ? path : `${BASE_URL}/${path}`; };
const isImg = (path) => path && /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(path);

/* ─── Status badge map ───────────────────────────────────────────── */
const STATUS_BADGE = {
  PENDING:                   'bg-amber-50 text-amber-700 border-amber-200',
  REQUESTED:                 'bg-amber-50 text-amber-700 border-amber-200',
  VIEWED:                    'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW:              'bg-blue-50 text-blue-700 border-blue-200',
  WAITING_FOR_CUSTOMER:      'bg-amber-50 text-amber-700 border-amber-200',
  WAITING_FOR_RETURN:        'bg-amber-50 text-amber-700 border-amber-200',
  RETURN_IN_TRANSIT:         'bg-sky-50 text-sky-700 border-sky-200',
  RETURN_RECEIVED:           'bg-emerald-50 text-emerald-700 border-emerald-200',
  INSPECTION_PENDING:        'bg-violet-50 text-violet-700 border-violet-200',
  PENDING_SELLER:            'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:                  'bg-green-50 text-green-700 border-green-200',
  DENIED:                    'bg-red-50 text-red-700 border-red-200',
  REJECTED:                  'bg-red-50 text-red-700 border-red-200',
  FAILED:                    'bg-red-50 text-red-700 border-red-200',
  PROCESSING:                'bg-sky-50 text-sky-700 border-sky-200',
  PROCESSING_REFUND:         'bg-sky-50 text-sky-700 border-sky-200',
  GATEWAY_PENDING:           'bg-sky-50 text-sky-700 border-sky-200',
  WEBHOOK_RECEIVED:          'bg-blue-50 text-blue-700 border-blue-200',
  PENDING_ADMIN_VERIFICATION:'bg-violet-50 text-violet-700 border-violet-200',
  PARTIALLY_REFUNDED:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUNDED:                  'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED:                 'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED:                 'bg-gray-100 text-gray-600 border-gray-200',
  ESCALATED:                 'bg-violet-50 text-violet-700 border-violet-200',
  ESCALATED_TO_DISPUTE:      'bg-violet-50 text-violet-700 border-violet-200',
};

const STATUS_LABELS = {
  REQUESTED: 'Requested', VIEWED: 'Viewed', UNDER_REVIEW: 'Under Review',
  WAITING_FOR_CUSTOMER: 'Needs Customer Proof', WAITING_FOR_RETURN: 'Needs Return',
  RETURN_IN_TRANSIT: 'Return Shipped', RETURN_RECEIVED: 'Return Received',
  INSPECTION_PENDING: 'Inspection', APPROVED: 'Approved', REJECTED: 'Rejected',
  DENIED: 'Denied', FAILED: 'Failed', PROCESSING_REFUND: 'Processing',
  GATEWAY_PENDING: 'Gateway Pending', WEBHOOK_RECEIVED: 'Payment Confirmed',
  PENDING_ADMIN_VERIFICATION: '⚡ Verify Payment', PARTIALLY_REFUNDED: 'Partial Refund',
  REFUNDED: 'Refunded', CANCELLED: 'Cancelled', ESCALATED_TO_DISPUTE: '⚡ Escalated',
  ESCALATED: 'Escalated', COMPLETED: 'Completed', PENDING: 'Pending',
};
const statusLabel = (s) => STATUS_LABELS[s] || s;

const statusIcon = (s) => {
  if (['REFUNDED', 'PARTIALLY_REFUNDED', 'RETURN_RECEIVED', 'WEBHOOK_RECEIVED', 'COMPLETED'].includes(s))
    return <CheckCircle size={14} className="text-emerald-500" />;
  if (s === 'APPROVED') return <CheckCircle size={14} className="text-green-500" />;
  if (['DENIED', 'REJECTED', 'FAILED', 'CANCELLED'].includes(s)) return <XCircle size={14} className="text-red-500" />;
  if (['ESCALATED', 'ESCALATED_TO_DISPUTE', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'INSPECTION_PENDING', 'PENDING_ADMIN_VERIFICATION'].includes(s))
    return <AlertTriangle size={14} className="text-amber-500" />;
  return <Clock size={14} className="text-sky-500" />;
};

/* ─── Smart tab groups ───────────────────────────────────────────── */
const SMART_TABS = [
  {
    id: 'ALL',       label: 'All',
    match: () => true,
  },
  {
    id: 'ACTION',    label: '⚡ Needs Action',
    match: (r) => ['ESCALATED_TO_DISPUTE', 'PENDING_ADMIN_VERIFICATION'].includes(r.status),
  },
  {
    id: 'ACTIVE',    label: 'In Progress',
    match: (r) => ['REQUESTED','PENDING','PENDING_SELLER','VIEWED','UNDER_REVIEW',
                   'WAITING_FOR_CUSTOMER','WAITING_FOR_RETURN','RETURN_IN_TRANSIT',
                   'RETURN_RECEIVED','INSPECTION_PENDING'].includes(r.status),
  },
  {
    id: 'PROCESSING',label: 'Processing',
    match: (r) => ['APPROVED','PROCESSING','PROCESSING_REFUND','GATEWAY_PENDING',
                   'WEBHOOK_RECEIVED'].includes(r.status),
  },
  {
    id: 'COMPLETED', label: 'Completed',
    match: (r) => ['COMPLETED','REFUNDED','PARTIALLY_REFUNDED'].includes(r.status),
  },
  {
    id: 'REJECTED',  label: 'Rejected',
    match: (r) => ['DENIED','REJECTED','FAILED','CANCELLED'].includes(r.status),
  },
];

/* ─── Evidence thumbnail gallery ─────────────────────────────────── */
function EvidenceGallery({ evidence, evidenceImagePath, onPreview, themeClasses }) {
  const items = evidence?.length
    ? evidence
    : evidenceImagePath
      ? [{ filePath: evidenceImagePath, note: 'Initial evidence', uploadedBy: 'CUSTOMER' }]
      : [];
  if (!items.length) return null;

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
      <div className="flex items-center justify-between mb-3.5">
        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>
          Customer Evidence Attachment ({items.length})
        </span>
        <span className="text-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
          Audited Files
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item, idx) => {
          const url = evidenceUrl(item.filePath);
          const img = isImg(item.filePath);
          return (
            <button
              key={item.id || item.filePath || idx}
              type="button"
              onClick={() => onPreview(url)}
              className="group relative rounded-xl overflow-hidden border hover:border-emerald-500 hover:shadow-md transition-all shrink-0 bg-white dark:bg-black/30"
              style={{ width: 80, height: 80 }}
            >
              {img && url ? (
                <img
                  src={url} alt={`Evidence ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250"
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className="w-full h-full items-center justify-center flex flex-col gap-1.5"
                   style={{ display: img && url ? 'none' : 'flex' }}>
                <ImageIcon size={20} className="text-gray-300" />
                <span className="text-[9px] font-black text-gray-400">File {idx + 1}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-0.5">
                <p className="text-[7.5px] font-black text-white truncate uppercase tracking-widest text-center">
                  {item.performedBy || item.uploadedBy || 'CUSTOMER'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── RefundRow ─────────────────────────────────────────────────── */
function RefundRow({ refund, onRefreshed, themeClasses }) {
  const [open,        setOpen]        = useState(false);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [err,         setErr]         = useState('');
  const [previewEvidence, setPreviewEvidence] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    stage: 'GATEWAY_PENDING',
    providerReference: '',
    amount: refund.refundAmount || '',
    comment: '',
  });

  const handleDisputeDecision = async (status) => {
    if (!comment.trim()) { setErr('Please add an admin decision note.'); return; }
    try {
      setSubmitting(true); setErr('');
      const approve = status === 'APPROVED';

      if (approve) {
        // Backend guard on admin-finalize requires refund to be in APPROVED or RETURN_RECEIVED
        // status before processing money/stock. Step 1: move to APPROVED, Step 2: finalize.
        const currentStatus = refund.status;
        const alreadyApproved = ['APPROVED', 'RETURN_RECEIVED'].includes(currentStatus);
        if (!alreadyApproved) {
          await adminUpdateRefundStatus(refund.id, 'APPROVED', comment);
        }
        await adminFinalizeRefund(refund.id, true, comment);
      } else {
        // Rejection: admin-finalize handles it directly regardless of current status
        await adminFinalizeRefund(refund.id, false, comment);
      }
      onRefreshed();
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message || 'Decision failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentEvent = async () => {
    try {
      setSubmitting(true); setErr('');
      await adminRecordRefundPaymentEvent(refund.id, paymentForm);
      onRefreshed();
    } catch (ex) { setErr(ex.response?.data?.message || 'Payment event failed.'); }
    finally { setSubmitting(false); }
  };

  const handleVerifySellerPayment = async () => {
    try {
      setSubmitting(true); setErr('');
      await adminConfirmRefundCompletionWithAmount(
        refund.id,
        paymentForm.providerReference || refund.providerReference,
        paymentForm.amount || refund.refundAmount,
        paymentForm.comment || 'Seller payment proof verified.'
      );
      onRefreshed();
    } catch (ex) { setErr(ex.response?.data?.message || 'Verification failed.'); }
    finally { setSubmitting(false); }
  };

  const badge = STATUS_BADGE[refund.status] || STATUS_BADGE.PENDING;
  const needsAdminAction = ['ESCALATED_TO_DISPUTE', 'PENDING_ADMIN_VERIFICATION'].includes(refund.status);

  return (
    <div className={`rounded-xl border shadow-sm transition-all ${
      open ? 'border-emerald-400' : needsAdminAction ? 'border-amber-300' : themeClasses.border.primary
    } ${themeClasses.card}`}>

      {/* Header row */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:${themeClasses.bg.secondary} rounded-xl`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {statusIcon(refund.status)}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-black text-sm transition-colors ${themeClasses.text.primary}`}>
                {refundRef(refund)}
              </p>
              <span className={`font-semibold text-xs transition-colors ${themeClasses.text.tertiary}`}>
                {orderRef(refund)}
              </span>
              {needsAdminAction && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-2 py-0.5 text-[9px] font-black">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Action required
                </span>
              )}
            </div>
            <p className={`text-xs font-medium mt-0.5 truncate transition-colors ${themeClasses.text.tertiary}`}>
              {refund.reason?.slice(0, 70)}{refund.reason?.length > 70 ? '…' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className={`font-black text-sm transition-colors ${themeClasses.text.primary}`}>{money(refund.refundAmount)}</span>
          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wide ${badge}`}>
            {statusLabel(refund.status)}
          </span>
          {open ? <ChevronUp size={14} className={themeClasses.text.tertiary} /> : <ChevronDown size={14} className={themeClasses.text.tertiary} />}
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div className={`px-6 pb-6 border-t space-y-6 pt-5 transition-colors ${themeClasses.border.primary}`}>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column - Metadata Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className={`rounded-2xl border p-5 space-y-4 transition-all shadow-xs ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                <div className="border-b pb-3 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>
                    Claim Metadata
                  </span>
                  <span className="text-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Platform Audited
                  </span>
                </div>
                
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className={`text-[9.5px] font-black uppercase tracking-widest block opacity-70 mb-1`}>Refund Reference</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold text-sm tracking-tight text-emerald-600`}>{refundRef(refund)}</span>
                    </div>
                  </div>

                  <div>
                    <span className={`text-[9.5px] font-black uppercase tracking-widest block opacity-70 mb-1`}>Order Reference</span>
                    <span className={`font-mono font-bold ${themeClasses.text.primary}`}>{orderRef(refund)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={`text-[9.5px] font-black uppercase tracking-widest block opacity-70 mb-1`}>Customer ID</span>
                      <span className={`font-bold ${themeClasses.text.primary}`}>{refund.customerId ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[9.5px] font-black uppercase tracking-widest block opacity-70 mb-1`}>Seller ID</span>
                      <span className={`font-bold ${themeClasses.text.primary}`}>{refund.sellerId ?? 'N/A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={`text-[9.5px] font-black uppercase tracking-widest block opacity-70 mb-1`}>Requested On</span>
                      <span className={`font-semibold ${themeClasses.text.secondary}`}>
                        {refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[9.5px] font-black uppercase tracking-widest block opacity-70 mb-1`}>Claim Amount</span>
                      <span className="font-black text-sm text-emerald-600">{money(refund.refundAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk metrics if present */}
              {(refund.riskLevel || refund.paymentStage || refund.inspectionCondition) && (
                <div className={`rounded-2xl border p-4 space-y-3 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider block border-b pb-2 ${themeClasses.text.tertiary}`}>
                    Risk & Inspection Metrics
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {refund.riskLevel && (
                      <div className={`rounded-xl border p-2.5 text-center ${
                        String(refund.riskLevel).toUpperCase() === 'HIGH' ? themeClasses.bg.danger : themeClasses.bg.success
                      }`}>
                        <span className={`text-[8.5px] font-black uppercase tracking-widest block opacity-80`}>Risk Level</span>
                        <span className="text-[11px] font-black block mt-0.5">{refund.riskLevel}</span>
                      </div>
                    )}
                    {refund.paymentStage && (
                      <div className={`rounded-xl border p-2.5 text-center ${themeClasses.bg.info}`}>
                        <span className={`text-[8.5px] font-black uppercase tracking-widest block opacity-80`}>Payment</span>
                        <span className="text-[11px] font-black block mt-0.5 truncate" title={refund.paymentStage}>{refund.paymentStage.replaceAll('_', ' ')}</span>
                      </div>
                    )}
                    {refund.inspectionCondition && (
                      <div className={`rounded-xl border p-2.5 text-center ${themeClasses.bg.warning}`}>
                        <span className={`text-[8.5px] font-black uppercase tracking-widest block opacity-80`}>Inspection</span>
                        <span className="text-[11px] font-black block mt-0.5">{refund.inspectionCondition}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Claims details & logs (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Customer Reason Card */}
              <div className={`rounded-2xl border-l-4 p-4 shadow-xs border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`} style={{ borderLeftColor: '#3B82F6' }}>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 block mb-1">Customer Reason</span>
                <p className={`text-xs font-semibold leading-relaxed ${themeClasses.text.primary}`}>{refund.reason || 'No description provided.'}</p>
              </div>

              {/* Seller Response Card */}
              {refund.sellerComment && (
                <div className={`rounded-2xl border-l-4 p-4 shadow-xs border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`} style={{ borderLeftColor: '#F59E0B' }}>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 block mb-1">Seller Response Note</span>
                  <p className={`text-xs font-semibold leading-relaxed ${themeClasses.text.primary}`}>{refund.sellerComment}</p>
                </div>
              )}

              {/* Previous Admin Note Card */}
              {refund.adminComment && (
                <div className={`rounded-2xl border-l-4 p-4 shadow-xs border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`} style={{ borderLeftColor: '#10B981' }}>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 block mb-1">Previous Admin Note</span>
                  <p className={`text-xs font-semibold leading-relaxed ${themeClasses.text.primary}`}>{refund.adminComment}</p>
                  {refund.providerReference && (
                    <span className="inline-block mt-2 font-mono text-[9.5px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100/50">
                      Ref: {refund.providerReference}
                    </span>
                  )}
                </div>
              )}

              {/* Evidence Request Banner */}
              {refund.latestEvidenceRequest && (
                <div className={`rounded-2xl border-l-4 p-4 shadow-xs border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`} style={{ borderLeftColor: '#EF4444' }}>
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-500 block mb-1">Latest Evidence Request</span>
                  <p className={`text-xs font-semibold leading-relaxed ${themeClasses.text.primary}`}>{refund.latestEvidenceRequest}</p>
                </div>
              )}

              {/* Evidence Gallery block */}
              <div className="pt-2">
                <EvidenceGallery
                  evidence={refund.evidence}
                  evidenceImagePath={refund.evidenceImagePath}
                  onPreview={setPreviewEvidence}
                  themeClasses={themeClasses}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          {err && <p className={`text-[10px] font-bold transition-colors ${themeClasses.text.danger}`}>{err}</p>}

          {/* Escalation dispute decision */}
          {refund.status === 'ESCALATED_TO_DISPUTE' && (
            <div className={`border-t border-dashed pt-4 space-y-3 transition-colors ${themeClasses.border.primary}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-amber-500" />
                <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.primary}`}>
                  Admin Dispute Decision
                </h4>
              </div>
              <p className={`text-[11px] font-medium transition-colors ${themeClasses.text.secondary}`}>
                Customer escalated a rejected refund. Review all evidence then accept or reject the refund claim.
              </p>
              <textarea
                placeholder="Admin comment / decision rationale (required)…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className={`w-full rounded-xl p-3 text-xs font-semibold outline-none h-16 focus:border-emerald-500 resize-none border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
              />
              <div className="flex gap-2 justify-end">
                <button
                  disabled={submitting}
                  onClick={() => handleDisputeDecision('REJECTED')}
                  className={`px-4 py-2 text-white font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1.5 ${themeClasses.button.danger}`}
                >
                  <XCircle size={12} /> Reject Final
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleDisputeDecision('APPROVED')}
                  className={`px-4 py-2 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md disabled:opacity-50 transition-colors flex items-center gap-1.5 ${themeClasses.button.primary}`}
                >
                  <CheckCircle size={12} /> Accept Refund
                </button>
              </div>
            </div>
          )}

          {/* Seller owns payout after admin accepts */}
          {['APPROVED', 'PROCESSING', 'PROCESSING_REFUND'].includes(refund.status) && (
            <div className={`border-t border-dashed pt-4 transition-colors ${themeClasses.border.primary}`}>
              <div className={`rounded-xl border p-3 text-[11px] font-semibold transition-colors ${themeClasses.bg.success} ${themeClasses.border.success}`}>
                Refund approved. Seller must now process the customer payout and submit proof.
              </div>
            </div>
          )}

          {/* Verify seller payment proof */}
          {refund.status === 'PENDING_ADMIN_VERIFICATION' && (
            <div className={`border-t border-dashed pt-4 space-y-3 transition-colors ${themeClasses.border.primary}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-violet-500" />
                <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.primary}`}>Verify Seller Payment Proof</h4>
              </div>
              <div className={`rounded-xl border p-3 text-[11px] font-semibold transition-colors ${themeClasses.bg.info} ${themeClasses.border.info}`}>
                Seller submitted payout proof. Check the transaction ID and attached receipt before confirming.
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  placeholder="Provider reference"
                  value={paymentForm.providerReference || refund.providerReference || ''}
                  onChange={e => setPaymentForm(f => ({ ...f, providerReference: e.target.value }))}
                  className={`rounded-xl p-2.5 text-xs font-semibold border ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={paymentForm.amount || refund.refundAmount || ''}
                  onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                  className={`rounded-xl p-2.5 text-xs font-semibold border ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
                />
                <button
                  disabled={submitting}
                  onClick={handleVerifySellerPayment}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-60 ${themeClasses.button.primary}`}
                >
                  Verify & Complete
                </button>
              </div>
              <textarea
                placeholder="Verification note (optional)"
                value={paymentForm.comment}
                onChange={e => setPaymentForm(f => ({ ...f, comment: e.target.value }))}
                className={`w-full rounded-xl p-2.5 text-xs font-semibold border h-14 ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
              />
            </div>
          )}

          {/* Record payment event */}
          {['PROCESSING_REFUND', 'GATEWAY_PENDING', 'WEBHOOK_RECEIVED'].includes(refund.status) && (
            <div className={`border-t border-dashed pt-4 space-y-3 transition-colors ${themeClasses.border.primary}`}>
              <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>Record Payment Event</h4>
              <div className="grid gap-2 md:grid-cols-4">
                <select
                  value={paymentForm.stage}
                  onChange={e => setPaymentForm(f => ({ ...f, stage: e.target.value }))}
                  className={`rounded-xl p-2.5 text-xs font-semibold border ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
                >
                  <option value="GATEWAY_PENDING">Gateway Pending</option>
                  <option value="WEBHOOK_RECEIVED">Webhook Received</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>
                <input
                  placeholder="Provider reference"
                  value={paymentForm.providerReference}
                  onChange={e => setPaymentForm(f => ({ ...f, providerReference: e.target.value }))}
                  className={`rounded-xl p-2.5 text-xs font-semibold border ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                  className={`rounded-xl p-2.5 text-xs font-semibold border ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
                />
                <button
                  disabled={submitting}
                  onClick={handlePaymentEvent}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-60 ${themeClasses.button.primary}`}
                >
                  Record
                </button>
              </div>
              <textarea
                placeholder="Payment note"
                value={paymentForm.comment}
                onChange={e => setPaymentForm(f => ({ ...f, comment: e.target.value }))}
                className={`w-full rounded-xl p-2.5 text-xs font-semibold border h-14 ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
              />
            </div>
          )}

          {/* Timeline Tracker */}
          {refund.timeline?.length > 0 && (
            <div className={`border-t border-dashed pt-5 transition-colors ${themeClasses.border.primary}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Audit History Logs</span>
              </div>
              <div className="relative border-l border-emerald-500/20 dark:border-emerald-500/10 ml-3 space-y-5">
                {refund.timeline.map((entry) => {
                  const actor = String(entry.performedBy || 'SYSTEM').toUpperCase();
                  const badgeColor = 
                    actor === 'SELLER' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100/30' :
                    actor === 'CUSTOMER' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100/30' :
                    actor === 'ADMIN' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-100/30' :
                    'bg-gray-55 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200/30';
                  
                  return (
                    <div key={entry.id || `${entry.action}-${entry.timestamp}`} className="relative pl-6">
                      {/* Timeline dot */}
                      <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-black flex items-center justify-center shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </span>
                      
                      <div className={`rounded-xl border p-3.5 space-y-1.5 transition-all shadow-xs ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className={`text-xs font-black uppercase tracking-wide text-emerald-600`}>
                            {entry.action?.replaceAll('_', ' ')}
                          </p>
                          <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${badgeColor}`}>
                            {entry.performedBy || 'SYSTEM'}
                          </span>
                        </div>
                        <p className={`text-[9px] font-semibold ${themeClasses.text.tertiary}`}>
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                        </p>
                        {entry.comment && (
                          <p className={`text-xs font-medium leading-relaxed mt-1.5 p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-gray-150/40 text-gray-700 dark:text-gray-300`}>
                            {entry.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <EvidencePreviewModal url={previewEvidence} title="Customer Refund Evidence" onClose={() => setPreviewEvidence(null)} />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function AdminRefunds() {
  const { themeClasses } = useAdminTheme();
  const [searchParams] = useSearchParams();
  const [refunds,      setRefunds]      = useState([]);
  const [activeTab,    setActiveTab]    = useState('ALL');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [searchQuery,  setSearchQuery]  = useState(searchParams.get('refundId') || searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('refundId') || searchParams.get('search');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await getAdminRefunds('');
      const list = Array.isArray(res.data) ? res.data
                 : Array.isArray(res.data?.content) ? res.data.content : [];
      setRefunds(list);
    } catch (ex) { setError(ex.response?.data?.message || 'Failed to load refunds.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  // Counts per smart tab
  const tabCounts = SMART_TABS.reduce((acc, tab) => {
    acc[tab.id] = refunds.filter(tab.match).length;
    return acc;
  }, {});

  const filteredRefunds = refunds
    .filter(SMART_TABS.find(t => t.id === activeTab)?.match || (() => true))
    .filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const rRef = refundRef(r).toLowerCase();
      const oRef = orderRef(r).toLowerCase();
      const reason = (r.reason || '').toLowerCase();
      return rRef.includes(q) || oRef.includes(q) || reason.includes(q);
    });

  const counts = {
    pending:   refunds.filter(r => ['PENDING','REQUESTED','PENDING_SELLER','VIEWED','UNDER_REVIEW','WAITING_FOR_CUSTOMER','WAITING_FOR_RETURN','RETURN_IN_TRANSIT','RETURN_RECEIVED','INSPECTION_PENDING'].includes(r.status)).length,
    action:    refunds.filter(r => ['ESCALATED_TO_DISPUTE','PENDING_ADMIN_VERIFICATION'].includes(r.status)).length,
    approved:  refunds.filter(r => ['APPROVED','PROCESSING','PROCESSING_REFUND','GATEWAY_PENDING','WEBHOOK_RECEIVED'].includes(r.status)).length,
    completed: refunds.filter(r => ['COMPLETED','REFUNDED','PARTIALLY_REFUNDED'].includes(r.status)).length,
    denied:    refunds.filter(r => ['DENIED','REJECTED','FAILED','CANCELLED'].includes(r.status)).length,
  };
  const totalAmount = refunds
    .filter(r => !['DENIED','REJECTED','FAILED','CANCELLED'].includes(r.status))
    .reduce((s, r) => s + Number(r.refundAmount || 0), 0);

  return (
    <AdminLayout
      pageTitle="Refund Management"
      pageSubtitle="Review escalations, verify seller payouts, and manage the full refund lifecycle."
      headerActions={
        <button
          onClick={fetchRefunds}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black uppercase transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary} disabled:opacity-60`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div className={`mx-auto max-w-6xl space-y-6 p-4 lg:p-6 transition-colors ${themeClasses.bg.primary}`}>
        {error && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${themeClasses.bg.danger} ${themeClasses.border.danger}`}>{error}</div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Needs Action', value: counts.action,    color: 'text-amber-600',   bg: themeClasses.card },
            { label: 'Active',       value: counts.pending,   color: 'text-blue-600',    bg: themeClasses.card },
            { label: 'Processing',   value: counts.approved,  color: 'text-sky-600',     bg: themeClasses.card },
            { label: 'Completed',    value: counts.completed, color: 'text-emerald-600', bg: themeClasses.card },
            { label: 'Denied',       value: counts.denied,    color: 'text-red-600',     bg: themeClasses.card },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 shadow-sm transition-colors ${s.bg} ${themeClasses.border.primary}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Total exposure */}
        <div className={`rounded-xl border p-4 shadow-sm flex items-center gap-4 transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          <CreditCard size={22} className="text-emerald-500" />
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>Total Refund Exposure (non-denied)</p>
            <p className={`text-2xl font-black mt-0.5 transition-colors ${themeClasses.text.primary}`}>{money(totalAmount)}</p>
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by Refund ID, Order ID, Reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-all ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            🔎
          </span>
        </div>

        {/* Smart tab filter */}
        <div className={`flex items-center gap-2 flex-wrap rounded-xl p-3 shadow-sm border transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          {SMART_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? `${themeClasses.button.primary}`
                  : `${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`
              }`}
            >
              {tab.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === tab.id ? 'bg-white/25 text-white' : `${themeClasses.bg.tertiary} ${themeClasses.text.tertiary}`
              }`}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className={`flex items-center gap-2 py-10 justify-center text-sm transition-colors ${themeClasses.text.tertiary}`}>
            <RefreshCw size={16} className="animate-spin" /> Loading refunds…
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className={`rounded-xl border border-dashed p-10 text-center transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
            <CreditCard size={28} className={`mx-auto mb-2 transition-colors ${themeClasses.text.tertiary}`} />
            <p className={`text-sm font-bold transition-colors ${themeClasses.text.tertiary}`}>No refunds in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRefunds.map(r => (
              <RefundRow key={r.id} refund={r} onRefreshed={fetchRefunds} themeClasses={themeClasses} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
