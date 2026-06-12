import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { escalateRefundToAdmin, getCustomerRefunds, submitRefundReturnShipment, uploadRefundEvidence } from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiConfig';
import EvidencePreviewModal from '../../dispute/components/EvidencePreviewModal';
import {
  AlertTriangle, ArrowLeft, CheckCircle, Clock, CreditCard, FileText,
  Image as ImageIcon, Package, RefreshCw, ShieldCheck, XCircle, Zap,
} from 'lucide-react';

/* ─── Status metadata ────────────────────────────────────────────── */
const STATUS_META = {
  REQUESTED:               { icon: Clock,         label: 'Submitted',          badge: 'bg-blue-100 text-blue-800 border-blue-300',       accent: 'text-blue-700' },
  VIEWED:                  { icon: Clock,         label: 'Viewed by Seller',   badge: 'bg-blue-100 text-blue-800 border-blue-300',       accent: 'text-blue-700' },
  UNDER_REVIEW:            { icon: ShieldCheck,   label: 'Under Review',       badge: 'bg-blue-100 text-blue-800 border-blue-300',       accent: 'text-blue-700' },
  WAITING_FOR_CUSTOMER:    { icon: AlertTriangle, label: 'Action Required',    badge: 'bg-amber-100 text-amber-800 border-amber-300',    accent: 'text-amber-700' },
  WAITING_FOR_RETURN:      { icon: Package,       label: 'Return Required',    badge: 'bg-amber-100 text-amber-800 border-amber-300',    accent: 'text-amber-700' },
  RETURN_IN_TRANSIT:       { icon: Clock,         label: 'Return Shipped',     badge: 'bg-sky-100 text-sky-800 border-sky-300',          accent: 'text-sky-700' },
  RETURN_RECEIVED:         { icon: CheckCircle,   label: 'Return Received',    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  INSPECTION_PENDING:      { icon: ShieldCheck,   label: 'Inspection',         badge: 'bg-purple-100 text-purple-800 border-purple-300', accent: 'text-purple-700' },
  APPROVED:                { icon: ShieldCheck,   label: 'Approved',           badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  PROCESSING:              { icon: ShieldCheck,   label: 'Processing',         badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  PROCESSING_REFUND:       { icon: ShieldCheck,   label: 'Processing Refund',  badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  GATEWAY_PENDING:         { icon: Clock,         label: 'Payment Processing', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  WEBHOOK_RECEIVED:        { icon: CheckCircle,   label: 'Payment Confirmed',  badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  PENDING_ADMIN_VERIFICATION: { icon: Clock,      label: 'Pending Verification', badge: 'bg-blue-100 text-blue-800 border-blue-300',    accent: 'text-blue-700' },
  PARTIALLY_REFUNDED:      { icon: CheckCircle,   label: 'Partially Refunded', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  REFUNDED:                { icon: CheckCircle,   label: 'Refunded ✓',         badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  COMPLETED:               { icon: CheckCircle,   label: 'Completed',          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  REJECTED:                { icon: XCircle,       label: 'Rejected',           badge: 'bg-red-100 text-red-800 border-red-300',          accent: 'text-red-700' },
  DENIED:                  { icon: XCircle,       label: 'Denied',             badge: 'bg-red-100 text-red-800 border-red-300',          accent: 'text-red-700' },
  FAILED:                  { icon: XCircle,       label: 'Failed',             badge: 'bg-red-100 text-red-800 border-red-300',          accent: 'text-red-700' },
  CANCELLED:               { icon: XCircle,       label: 'Cancelled',          badge: 'bg-gray-100 text-gray-800 border-gray-300',       accent: 'text-gray-700' },
  ESCALATED_TO_DISPUTE:    { icon: AlertTriangle, label: 'Escalated',          badge: 'bg-purple-100 text-purple-800 border-purple-300', accent: 'text-purple-700' },
  ESCALATED:               { icon: AlertTriangle, label: 'Escalated',          badge: 'bg-amber-100 text-amber-800 border-amber-300',    accent: 'text-amber-700' },
  PENDING:                 { icon: Clock,         label: 'Pending',            badge: 'bg-gray-100 text-gray-800 border-gray-300',       accent: 'text-gray-700' },
  PENDING_SELLER:          { icon: Clock,         label: 'Awaiting Seller',    badge: 'bg-amber-100 text-amber-800 border-amber-300',    accent: 'text-amber-700' },
};

const ACTION_BANNERS = {
  WAITING_FOR_CUSTOMER: {
    color: 'bg-amber-50 border-amber-300',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    title: 'Your action is required',
    text: 'The seller has requested more evidence. Please upload photos or documents to continue your refund.',
  },
  WAITING_FOR_RETURN: {
    color: 'bg-amber-50 border-amber-300',
    icon: Package,
    iconClass: 'text-amber-600',
    title: 'Please return the item',
    text: 'Ship the product back to the seller and submit your tracking details below.',
  },
  REJECTED: {
    color: 'bg-red-50 border-red-300',
    icon: XCircle,
    iconClass: 'text-red-600',
    title: 'Refund was rejected',
    text: 'If you disagree, you can escalate to admin for a final independent review.',
  },
  DENIED: {
    color: 'bg-red-50 border-red-300',
    icon: XCircle,
    iconClass: 'text-red-600',
    title: 'Refund was denied',
    text: 'If you disagree, you can escalate to admin for a final independent review.',
  },
  REFUNDED: {
    color: 'bg-emerald-50 border-emerald-300',
    icon: CheckCircle,
    iconClass: 'text-emerald-600',
    title: 'Refund complete!',
    text: 'Your refund has been successfully processed.',
  },
  PARTIALLY_REFUNDED: {
    color: 'bg-emerald-50 border-emerald-300',
    icon: CheckCircle,
    iconClass: 'text-emerald-600',
    title: 'Partial refund completed',
    text: 'A partial refund has been issued for this request.',
  },
};

/* ─── Helpers ────────────────────────────────────────────────────── */
const money = (v) => `Rs. ${Number(v || 0).toLocaleString()}`;
const SAFE_REF = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const safeSuffix = (id) => {
  let v = Number(id || 0), s = '';
  do { s = SAFE_REF[v % SAFE_REF.length] + s; v = Math.floor(v / SAFE_REF.length); } while (v > 0);
  return s.padStart(8, 'A').slice(-8);
};
const refDate = (val) => {
  const d = val ? new Date(val) : new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};
const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const dateTimeLabel = (v) => v ? new Date(v).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const refundRef = (r) => r.publicReferenceId || r.refundReferenceId || r.referenceId || `REF-${refDate(r.createdAt)}-${safeSuffix(r.id)}`;
const orderRef  = (r) => r.customOrderId || r.orderReferenceId || (r.orderId ? `Order #${r.orderId}` : 'N/A');
const getStatusMeta = (s) => STATUS_META[s] || STATUS_META.PENDING;
const evidenceUrl = (path) => path ? (path.startsWith('http') ? path : `${BASE_URL}/${path}`) : null;
const isImg = (path) => path && /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(path);

/* ─── SLA countdown for return deadline ─────────────────────────── */
function DeadlineChip({ deadline }) {
  if (!deadline) return null;
  const ms   = new Date(deadline).getTime() - Date.now();
  const hrs  = Math.ceil(ms / 3600000);
  const past = ms < 0;
  if (past) return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
      <AlertTriangle size={10} /> Overdue
    </span>
  );
  if (hrs <= 24) return (
    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
      <Clock size={10} /> {hrs}h left
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 border border-sky-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
      <Clock size={10} /> Due {dateLabel(deadline)}
    </span>
  );
}

/* ─── Action-required indicator for list cards ───────────────────── */
const ACTION_REQUIRED_STATUSES = ['WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'REJECTED', 'DENIED', 'FAILED'];

/* ─── Horizontal step progress bar ──────────────────────────────── */
const REFUND_STEPS = [
  { key: 'submitted', label: 'Submitted',  statuses: ['REQUESTED', 'PENDING', 'PENDING_SELLER', 'VIEWED'] },
  { key: 'review',    label: 'Review',     statuses: ['UNDER_REVIEW', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'RETURN_IN_TRANSIT', 'RETURN_RECEIVED', 'INSPECTION_PENDING'] },
  { key: 'approved',  label: 'Approved',   statuses: ['APPROVED', 'PROCESSING', 'PROCESSING_REFUND', 'GATEWAY_PENDING', 'WEBHOOK_RECEIVED', 'PENDING_ADMIN_VERIFICATION'] },
  { key: 'paid',      label: 'Paid',       statuses: ['REFUNDED', 'PARTIALLY_REFUNDED', 'COMPLETED'] },
];
const TERMINAL_FAIL = ['REJECTED', 'DENIED', 'FAILED', 'CANCELLED', 'ESCALATED', 'ESCALATED_TO_DISPUTE'];

function RefundStepper({ status }) {
  const isFail = TERMINAL_FAIL.includes(status);
  const activeIdx = REFUND_STEPS.findIndex(s => s.statuses.includes(status));

  return (
    <div className="flex items-center gap-0 w-full" role="list" aria-label="Refund progress">
      {REFUND_STEPS.map((step, i) => {
        const done    = !isFail && i < activeIdx;
        const current = !isFail && i === activeIdx;
        const future  = !done && !current;
        const last    = i === REFUND_STEPS.length - 1;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 shrink-0" role="listitem">
              {/* Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isFail && i === activeIdx
                  ? 'border-red-500 bg-red-500'
                  : done
                    ? 'border-emerald-500 bg-emerald-500'
                    : current
                      ? 'border-blue-500 bg-blue-500 shadow-md shadow-blue-200'
                      : 'border-gray-200 bg-gray-50'
              }`}>
                {isFail && i === activeIdx ? (
                  <XCircle size={14} className="text-white" />
                ) : done ? (
                  <CheckCircle size={14} className="text-white" />
                ) : current ? (
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                ) : (
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
              </div>
              {/* Label */}
              <span className={`text-[10px] font-bold whitespace-nowrap ${
                isFail && i === activeIdx ? 'text-red-600'
                  : done ? 'text-emerald-600'
                  : current ? 'text-blue-600'
                  : 'text-gray-400'
              }`}>
                {isFail && i === activeIdx ? getStatusMeta(status).label : step.label}
              </span>
            </div>

            {/* Connector line */}
            {!last && (
              <div className={`flex-1 h-0.5 mb-5 transition-all ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Evidence thumbnail grid ────────────────────────────────────── */
function EvidenceGallery({ evidence, evidenceImagePath, onPreview }) {
  const items = evidence?.length
    ? evidence
    : evidenceImagePath
      ? [{ filePath: evidenceImagePath, note: 'Initial evidence', uploadedBy: 'CUSTOMER' }]
      : [];
  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
        Evidence Submitted ({items.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => {
          const url  = evidenceUrl(item.filePath);
          const img  = isImg(item.filePath);
          return (
            <button
              key={item.id || item.filePath || idx}
              type="button"
              onClick={() => onPreview(url)}
              className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden
                         hover:border-emerald-400 hover:shadow-md transition-all"
              style={{ width: 88, height: 88 }}
            >
              {img && url ? (
                <img
                  src={url}
                  alt={`Evidence ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className="w-full h-full items-center justify-center flex-col gap-1"
                style={{ display: img && url ? 'none' : 'flex' }}
              >
                <ImageIcon size={22} className="text-gray-300" />
                <span className="text-[9px] font-bold text-gray-400">File {idx + 1}</span>
              </div>
              {/* Uploader badge */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                <p className="text-[8px] font-bold text-white truncate">
                  {item.uploadedBy || 'Customer'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function CustomerRefunds() {
  const [searchParams] = useSearchParams();
  const [refunds,            setRefunds]            = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [previewEvidence,    setPreviewEvidence]    = useState(null);
  const [expandedRefundId,   setExpandedRefundId]   = useState(null);

  useEffect(() => {
    const rId = searchParams.get('refundId');
    if (rId && refunds.length > 0) {
      const matched = refunds.find(r => String(r.id) === rId || refundRef(r).toLowerCase() === rId.toLowerCase());
      if (matched) {
        setExpandedRefundId(matched.id);
      }
    }
  }, [searchParams, refunds]);

  const [evidenceForms,      setEvidenceForms]      = useState({});
  const [returnForms,        setReturnForms]        = useState({});
  const [escalationForms,    setEscalationForms]    = useState({});
  const [actionErrors,       setActionErrors]       = useState({});
  const [uploadingEvidenceFor, setUploadingEvidenceFor] = useState(null);
  const [submittingReturnFor,  setSubmittingReturnFor]  = useState(null);
  const [escalatingRefundFor,  setEscalatingRefundFor]  = useState(null);

  const getActionError  = (id)  => actionErrors[id] || '';
  const setActionError  = (id, msg) => setActionErrors(c => ({ ...c, [id]: msg }));
  const clearActionError = (id) => setActionErrors(c => { const n = { ...c }; delete n[id]; return n; });

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await getCustomerRefunds();
      setRefunds(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRefunds(); }, []);

  const updateEvidenceForm   = (id, patch) => setEvidenceForms(f => ({ ...f, [id]: { ...(f[id] || {}), ...patch } }));
  const updateReturnForm     = (id, patch) => setReturnForms(f => ({ ...f, [id]: { ...(f[id] || {}), ...patch } }));
  const updateEscalationForm = (id, patch) => setEscalationForms(f => ({ ...f, [id]: { ...(f[id] || {}), ...patch } }));

  const submitMoreEvidence = async (refundId) => {
    const files = evidenceForms[refundId]?.files || [];
    if (!files.length) { setActionError(refundId, 'Please select at least one image.'); return; }
    try {
      setUploadingEvidenceFor(refundId); clearActionError(refundId);
      await uploadRefundEvidence(refundId, files, evidenceForms[refundId]?.note || '');
      setEvidenceForms(f => ({ ...f, [refundId]: {} }));
      await fetchRefunds();
    } catch (err) {
      setActionError(refundId, err.response?.data?.message || 'Could not upload evidence.');
    } finally { setUploadingEvidenceFor(null); }
  };

  const submitReturnShipment = async (refundId) => {
    const form = returnForms[refundId] || {};
    if (!form.returnCourier || !form.returnTrackingNumber) {
      setActionError(refundId, 'Please enter courier name and tracking number.'); return;
    }
    try {
      setSubmittingReturnFor(refundId); clearActionError(refundId);
      await submitRefundReturnShipment(refundId, form);
      setReturnForms(f => ({ ...f, [refundId]: {} }));
      await fetchRefunds();
    } catch (err) {
      setActionError(refundId, err.response?.data?.message || 'Could not submit tracking.');
    } finally { setSubmittingReturnFor(null); }
  };

  const submitEscalation = async (refundId) => {
    const note = escalationForms[refundId]?.comment || '';
    if (!note.trim()) { setActionError(refundId, 'Please explain why you are escalating.'); return; }
    try {
      setEscalatingRefundFor(refundId); clearActionError(refundId);
      await escalateRefundToAdmin(refundId, note);
      setEscalationForms(f => ({ ...f, [refundId]: {} }));
      await fetchRefunds();
    } catch (err) {
      setActionError(refundId, err.response?.data?.message || 'Could not escalate.');
    } finally { setEscalatingRefundFor(null); }
  };

  const stats = useMemo(() => {
    const active   = refunds.filter(r => ['PENDING','REQUESTED','PENDING_SELLER','VIEWED','UNDER_REVIEW','WAITING_FOR_CUSTOMER','WAITING_FOR_RETURN','RETURN_IN_TRANSIT','RETURN_RECEIVED','APPROVED','PROCESSING','PROCESSING_REFUND','ESCALATED','ESCALATED_TO_DISPUTE'].includes(r.status)).length;
    const done     = refunds.filter(r => ['COMPLETED','REFUNDED','PARTIALLY_REFUNDED'].includes(r.status)).length;
    const needsAct = refunds.filter(r => ACTION_REQUIRED_STATUSES.includes(r.status)).length;
    const total    = refunds.reduce((s, r) => s + Number(r.refundAmount || 0), 0);
    return { active, done, needsAct, total };
  }, [refunds]);

  if (loading) return (
    <div className="max-w-5xl mx-auto py-24 text-center">
      <div className="w-10 h-10 border-2 border-t-emerald-500 border-gray-200 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Loading your refunds…</p>
    </div>
  );

  /* ── List view ── */
  if (!expandedRefundId) return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CreditCard size={18} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">My Refunds</h2>
            <p className="text-xs text-gray-500 font-medium">{refunds.length} request{refunds.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <button
          onClick={fetchRefunds}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active',        value: stats.active,   icon: Clock,        bg: 'bg-blue-50',    border: 'border-blue-200',   num: 'text-blue-700'  },
          { label: 'Action Needed', value: stats.needsAct, icon: Zap,          bg: 'bg-amber-50',   border: 'border-amber-200',  num: 'text-amber-700' },
          { label: 'Completed',     value: stats.done,     icon: CheckCircle,  bg: 'bg-emerald-50', border: 'border-emerald-200',num: 'text-emerald-700' },
          { label: 'Total Claimed', value: money(stats.total), icon: FileText, bg: 'bg-gray-50',    border: 'border-gray-200',   num: 'text-gray-700'  },
        ].map(({ label, value, icon: Icon, bg, border, num }) => (
          <div key={label} className={`rounded-xl border ${bg} ${border} p-4 shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={num} />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
            </div>
            <p className={`text-lg font-black ${num}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Request History</h3>
          <p className="text-xs text-gray-400">Newest first</p>
        </div>

        {refunds.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CreditCard size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-600 text-sm">No refund requests yet</p>
            <p className="text-xs text-gray-400 mt-1">Refunds you request from orders will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {refunds.map((refund) => {
              const meta       = getStatusMeta(refund.status);
              const Icon       = meta.icon;
              const needsAct   = ACTION_REQUIRED_STATUSES.includes(refund.status);
              return (
                <button
                  key={refund.id}
                  onClick={() => setExpandedRefundId(refund.id)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Pulsing dot for action required */}
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.badge.split(' ').slice(0,2).join(' ')}`}>
                        <Icon size={16} />
                      </div>
                      {needsAct && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white">
                          <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm font-mono">{refundRef(refund)}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {orderRef(refund)} &bull; {dateLabel(refund.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-black text-gray-900">{money(refund.refundAmount)}</p>
                      {refund.returnDeadline && refund.status === 'WAITING_FOR_RETURN' && (
                        <DeadlineChip deadline={refund.returnDeadline} />
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <EvidencePreviewModal url={previewEvidence} title="Refund Evidence" onClose={() => setPreviewEvidence(null)} />
    </div>
  );

  /* ── Detail view ── */
  const refund = refunds.find(r => r.id === expandedRefundId);
  if (!refund) return null;
  const meta   = getStatusMeta(refund.status);
  const Icon   = meta.icon;
  const banner = ACTION_BANNERS[refund.status];

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-in fade-in duration-200">
      {/* Back bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setExpandedRefundId(null)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={16} />
          Back to refunds
        </button>
      </div>

      {/* Action banner */}
      {banner && (
        <div className={`mb-5 rounded-2xl border-2 p-4 flex items-start gap-3 ${banner.color}`}>
          <banner.icon size={20} className={`${banner.iconClass} shrink-0 mt-0.5`} />
          <div>
            <p className="font-bold text-gray-900 text-sm">{banner.title}</p>
            <p className="text-sm text-gray-700 mt-0.5">{banner.text}</p>
          </div>
        </div>
      )}

      {/* Status card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.badge.split(' ').slice(0,2).join(' ')}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-mono text-xs text-gray-400 mb-0.5">{refundRef(refund)}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">{money(refund.refundAmount)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Refund Amount</p>
            </div>
          </div>
        </div>

        {/* Progress stepper */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Progress</p>
          <RefundStepper status={refund.status} />
        </div>

        {/* Info grid */}
        <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border-b border-gray-100">
          {[
            { label: 'Order',       value: orderRef(refund) },
            { label: 'Submitted',   value: dateLabel(refund.createdAt) },
            { label: 'Last Updated',value: dateTimeLabel(refund.updatedAt) },
            { label: 'Reason',      value: refund.reason || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
              <p className="font-semibold text-gray-800 truncate" title={value}>{value}</p>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div className="px-6 py-5 space-y-3">
          {refund.sellerComment && (
            <div className={`rounded-xl border p-3 text-sm ${['REJECTED','DENIED','FAILED'].includes(refund.status) ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              <p className="font-bold mb-0.5">Seller note</p>
              <p className="font-medium">{refund.sellerComment}</p>
            </div>
          )}
          {(refund.adminComment || refund.providerReference) && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              {refund.adminComment && <p><span className="font-bold">Admin note:</span> {refund.adminComment}</p>}
              {refund.providerReference && (
                <p className="mt-1 font-mono text-xs font-black">Ref: {refund.providerReference}</p>
              )}
            </div>
          )}
          {refund.latestEvidenceRequest && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">More evidence requested</p>
                <p className="font-medium mt-0.5">{refund.latestEvidenceRequest}</p>
              </div>
            </div>
          )}
          {(refund.returnInstructions || refund.returnCourier || refund.returnDeadline) && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold">Return Instructions</p>
                {refund.returnDeadline && <DeadlineChip deadline={refund.returnDeadline} />}
              </div>
              {refund.returnInstructions && <p className="font-medium">{refund.returnInstructions}</p>}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {refund.returnCourier       && <div><span className="font-black">Courier:</span> {refund.returnCourier}</div>}
                {refund.returnTrackingNumber && <div><span className="font-black">Tracking:</span> {refund.returnTrackingNumber}</div>}
              </div>
            </div>
          )}
          {(refund.inspectionCondition || refund.paymentStage) && (
            <div className="grid grid-cols-2 gap-3">
              {refund.inspectionCondition && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Inspection</p>
                  <p className="font-bold">{refund.inspectionCondition}</p>
                  {refund.inspectionNotes && <p className="font-medium text-xs mt-1">{refund.inspectionNotes}</p>}
                </div>
              )}
              {refund.paymentStage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Payment Stage</p>
                  <p className="font-bold">{refund.paymentStage.replaceAll('_', ' ')}</p>
                  {refund.gatewayEventAt && <p className="font-medium text-xs mt-1">{dateTimeLabel(refund.gatewayEventAt)}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Evidence Gallery */}
      {(refund.evidence?.length > 0 || refund.evidenceImagePath) && (
        <div className="mb-5">
          <EvidenceGallery
            evidence={refund.evidence}
            evidenceImagePath={refund.evidenceImagePath}
            onPreview={setPreviewEvidence}
          />
        </div>
      )}

      {/* Timeline */}
      {refund.timeline?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activity Log</p>
          </div>
          <div className="px-6 py-4 space-y-3">
            {refund.timeline.map((entry) => (
              <div key={entry.id || `${entry.action}-${entry.timestamp}`} className="flex gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5" />
                  <div className="w-0.5 flex-1 bg-gray-100" />
                </div>
                <div className="pb-3">
                  <p className="text-xs font-black text-gray-800">{entry.action?.replaceAll('_', ' ')}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    {entry.performedBy} &bull; {entry.timestamp ? dateTimeLabel(entry.timestamp) : ''}
                  </p>
                  {entry.comment && <p className="text-xs text-gray-600 font-medium mt-0.5">{entry.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action: Upload Evidence */}
      {refund.status === 'WAITING_FOR_CUSTOMER' && (
        <div className="bg-white border-2 border-amber-300 rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700" />
            <h4 className="font-black text-amber-900 text-sm">Upload Evidence</h4>
          </div>
          <div className="px-6 py-5 space-y-3">
            <input
              type="file" accept="image/*" multiple
              onChange={e => updateEvidenceForm(refund.id, { files: Array.from(e.target.files || []) })}
              className="w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium
                         file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3 file:py-1.5
                         file:text-xs file:font-bold file:text-white hover:border-amber-400"
            />
            {(evidenceForms[refund.id]?.files?.length || 0) > 0 && (
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                ✓ {evidenceForms[refund.id].files.length} image{evidenceForms[refund.id].files.length > 1 ? 's' : ''} selected
              </p>
            )}
            <textarea
              placeholder="Optional note about what these images show…"
              value={evidenceForms[refund.id]?.note || ''}
              onChange={e => updateEvidenceForm(refund.id, { note: e.target.value })}
              className="h-20 w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-gray-900 outline-none focus:border-amber-500"
            />
            {getActionError(refund.id) && <p className="text-xs font-bold text-red-600">{getActionError(refund.id)}</p>}
            <div className="flex justify-end">
              <button
                onClick={() => submitMoreEvidence(refund.id)}
                disabled={uploadingEvidenceFor === refund.id}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {uploadingEvidenceFor === refund.id ? 'Uploading…' : 'Submit Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action: Return Shipment */}
      {refund.status === 'WAITING_FOR_RETURN' && (
        <div className="bg-white border-2 border-sky-300 rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 bg-sky-50 border-b border-sky-200 flex items-center gap-2">
            <Package size={16} className="text-sky-700" />
            <h4 className="font-black text-sky-900 text-sm">Submit Return Tracking</h4>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Courier name (e.g. DHL, FedEx)"
                value={returnForms[refund.id]?.returnCourier || ''}
                onChange={e => updateReturnForm(refund.id, { returnCourier: e.target.value })}
                className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-sky-500"
              />
              <input
                placeholder="Tracking number"
                value={returnForms[refund.id]?.returnTrackingNumber || ''}
                onChange={e => updateReturnForm(refund.id, { returnTrackingNumber: e.target.value })}
                className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-sky-500"
              />
              <textarea
                placeholder="Optional note…"
                value={returnForms[refund.id]?.comment || ''}
                onChange={e => updateReturnForm(refund.id, { comment: e.target.value })}
                className="h-16 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-medium text-gray-900 outline-none focus:border-sky-500 sm:col-span-2"
              />
            </div>
            {getActionError(refund.id) && <p className="text-xs font-bold text-red-600">{getActionError(refund.id)}</p>}
            <div className="flex justify-end">
              <button
                onClick={() => submitReturnShipment(refund.id)}
                disabled={submittingReturnFor === refund.id}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {submittingReturnFor === refund.id ? 'Submitting…' : 'Submit Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action: Escalate */}
      {['REJECTED', 'DENIED', 'FAILED'].includes(refund.status) && (
        <div className="bg-white border-2 border-purple-300 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-purple-50 border-b border-purple-200 flex items-center gap-2">
            <ShieldCheck size={16} className="text-purple-700" />
            <h4 className="font-black text-purple-900 text-sm">Request Admin Review</h4>
          </div>
          <div className="px-6 py-5 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              If you believe the seller's decision was wrong, you can request an independent admin review. Please explain your case clearly.
            </p>
            <textarea
              placeholder="Tell admin what evidence supports your claim…"
              value={escalationForms[refund.id]?.comment || ''}
              onChange={e => updateEscalationForm(refund.id, { comment: e.target.value })}
              className="h-24 w-full rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm font-medium text-gray-900 outline-none focus:border-purple-500"
            />
            {getActionError(refund.id) && <p className="text-xs font-bold text-red-600">{getActionError(refund.id)}</p>}
            <div className="flex justify-end">
              <button
                onClick={() => submitEscalation(refund.id)}
                disabled={escalatingRefundFor === refund.id}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {escalatingRefundFor === refund.id ? 'Escalating…' : 'Request Admin Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EvidencePreviewModal url={previewEvidence} title="Refund Evidence" onClose={() => setPreviewEvidence(null)} />
    </div>
  );
}
