import React, { useState, useEffect, useMemo } from 'react';
import {
  confirmSellerRefundCompletion, getSellerProfile, getSellerRefundRequests,
  inspectRefundReturn, requestRefundEvidence, requestRefundReturn, updateRefundStatus,
  respondToRefund,
} from '../services/sellerService';
import EvidencePreviewModal from '../../dispute/components/EvidencePreviewModal';
import {
  EmptyState, LoadingState, SectionHeader, formatMoney,
  normalizeList, resolveImageUrl,
} from './SellerSectionUtils';
import {
  AlertCircle, AlertTriangle, CheckCircle, Clock, Image as ImageIcon,
  Package, RefreshCw, XCircle, Copy, Check, ExternalLink, Coins, Info, ArrowRight, Eye, Sparkles, ArrowLeft
} from 'lucide-react';
import { useSellerTheme } from '../hooks/useSellerTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';

/* ─── Status/process config ──────────────────────────────────────── */
const REFUND_PROCESS = [
  { status: 'REQUESTED',               label: 'Requested',          help: 'Customer submitted refund request' },
  { status: 'VIEWED',                  label: 'Viewed',             help: 'You opened the request' },
  { status: 'UNDER_REVIEW',            label: 'Under Review',       help: 'Evidence and order details being checked' },
  { status: 'WAITING_FOR_CUSTOMER',    label: 'Need Customer Proof',help: 'Awaiting more images/details from customer' },
  { status: 'WAITING_FOR_RETURN',      label: 'Waiting Return',     help: 'Customer must return the product' },
  { status: 'RETURN_IN_TRANSIT',       label: 'Return Shipped',     help: 'Item shipping back' },
  { status: 'RETURN_RECEIVED',         label: 'Return Received',    help: 'You received the returned item' },
  { status: 'INSPECTION_PENDING',      label: 'Inspection',         help: 'Returned item being inspected' },
  { status: 'APPROVED',                label: 'Approved',           help: 'Refund approved' },
  { status: 'REJECTED',                label: 'Rejected',           help: 'Refund denied' },
  { status: 'PROCESSING_REFUND',       label: 'Processing Refund',  help: 'Payment being processed' },
  { status: 'GATEWAY_PENDING',         label: 'Gateway Pending',    help: 'Payment provider processing' },
  { status: 'WEBHOOK_RECEIVED',        label: 'Payment Confirmed',  help: 'Payment provider confirmed progress' },
  { status: 'PENDING_ADMIN_VERIFICATION', label: 'Admin Verification', help: 'Proof submitted; awaiting admin review' },
  { status: 'PARTIALLY_REFUNDED',      label: 'Partial Refund',     help: 'Partial amount refunded' },
  { status: 'REFUNDED',                label: 'Refunded',           help: 'Refund completed successfully' },
  { status: 'CANCELLED',               label: 'Cancelled',          help: 'Customer cancelled request' },
  { status: 'ESCALATED_TO_DISPUTE',    label: 'Escalated',          help: 'Refund turned into dispute' },
];

const LEGACY_STATUS_MAP = {
  PENDING: 'REQUESTED', PENDING_SELLER: 'REQUESTED',
  PROCESSING: 'PROCESSING_REFUND', COMPLETED: 'REFUNDED',
  FAILED: 'REJECTED', ESCALATED: 'ESCALATED_TO_DISPUTE', DENIED: 'REJECTED',
};

const STATUS_TRANSITIONS = {
  REQUESTED:           ['VIEWED', 'UNDER_REVIEW', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'REJECTED'],
  VIEWED:              ['UNDER_REVIEW', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'REJECTED'],
  UNDER_REVIEW:        ['WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'APPROVED', 'REJECTED'],
  WAITING_FOR_CUSTOMER:['UNDER_REVIEW', 'REJECTED'],
  WAITING_FOR_RETURN:  ['RETURN_IN_TRANSIT', 'RETURN_RECEIVED', 'REJECTED'],
  RETURN_IN_TRANSIT:   ['RETURN_RECEIVED', 'REJECTED'],
  RETURN_RECEIVED:     ['INSPECTION_PENDING', 'APPROVED', 'REJECTED'],
  INSPECTION_PENDING:  ['APPROVED', 'REJECTED', 'ESCALATED_TO_DISPUTE'],
  APPROVED:            ['PROCESSING_REFUND'],
  PROCESSING_REFUND:   ['GATEWAY_PENDING', 'WEBHOOK_RECEIVED', 'PENDING_ADMIN_VERIFICATION', 'REFUNDED', 'PARTIALLY_REFUNDED'],
  GATEWAY_PENDING:     ['WEBHOOK_RECEIVED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
  WEBHOOK_RECEIVED:    ['REFUNDED', 'PARTIALLY_REFUNDED'],
  PENDING_ADMIN_VERIFICATION: [],
};

const TERMINAL = ['REJECTED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED', 'ESCALATED_TO_DISPUTE'];

const STATUS_BADGE = {
  REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
  VIEWED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
  WAITING_FOR_CUSTOMER: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
  WAITING_FOR_RETURN: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
  RETURN_IN_TRANSIT: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50',
  RETURN_RECEIVED: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20 dark:bg-[#16A34A]/15 dark:text-[#2E5E2C] dark:border-[#16A34A]/20',
  INSPECTION_PENDING: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50',
  APPROVED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50',
  REJECTED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50',
  PROCESSING_REFUND: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50',
  GATEWAY_PENDING: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50',
  WEBHOOK_RECEIVED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
  PENDING_ADMIN_VERIFICATION: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
  PARTIALLY_REFUNDED: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20 dark:bg-[#16A34A]/15 dark:text-[#2E5E2C] dark:border-[#16A34A]/20',
  REFUNDED: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20 dark:bg-[#16A34A]/15 dark:text-[#2E5E2C] dark:border-[#16A34A]/20',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/20 dark:text-gray-400 dark:border-gray-700/50',
  ESCALATED_TO_DISPUTE: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50',
};

/* ─── Helpers ────────────────────────────────────────────────────── */
const normalizeStatus   = (s) => LEGACY_STATUS_MAP[s] || s || 'REQUESTED';
const statusLabel       = (s) => REFUND_PROCESS.find(p => p.status === normalizeStatus(s))?.label || s;
const badgeClass        = (s) => STATUS_BADGE[normalizeStatus(s)] || 'bg-gray-55 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
const nextStatusOptions = (s) => STATUS_TRANSITIONS[normalizeStatus(s)] || [];
const firstNextStatus   = (s) => nextStatusOptions(s)[0] || '';
const isImg             = (p) => p && /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(p);

const SAFE_REF = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const safeSuffix = (id) => {
  let v = Number(id || 0), s = '';
  do { s = SAFE_REF[v % SAFE_REF.length] + s; v = Math.floor(v / SAFE_REF.length); } while (v > 0);
  return s.padStart(8, 'A').slice(-8);
};
const refDate    = (val) => { const d = val ? new Date(val) : new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`; };
const refundRef  = (r) => r.publicReferenceId || r.refundReferenceId || r.referenceId || `REF-${refDate(r.createdAt)}-${safeSuffix(r.id)}`;
const orderRef   = (r) => r.customOrderId || r.orderReferenceId || (r.orderId ? `Order #${r.orderId}` : 'N/A');
const displayDate = (v) => { if (!v) return '—'; const d = new Date(v); return isNaN(d) ? '—' : d.toLocaleDateString(); };
const displayDT   = (v) => { if (!v) return ''; const d = new Date(v); return isNaN(d) ? '' : d.toLocaleString(); };

// Convert ALL_CAPS_SNAKE reason codes to human-readable labels
// e.g. "DAMAGED_ITEM" → "Damaged Item", "WRONG_SIZE" → "Wrong Size"
const formatReason = (raw) => {
  if (!raw) return 'No reason provided.';
  return String(raw)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Strip backend role-prefix concat from customer names
// e.g. "admincustomer_userJohn Doe" → "John Doe"
const sanitizeName = (raw) => {
  if (!raw) return 'Customer';
  const cleaned = String(raw).replace(/^(admin|customer_user|admincustomer_user|seller_user|user_)/i, '').trim();
  return cleaned || 'Customer';
};

/* ─── Horizontal Stepper ──────────────────────────────────────────  */
const STEPPER_FLOW = [
  { key: 'received', label: 'Received',  statuses: ['REQUESTED', 'PENDING', 'PENDING_SELLER', 'VIEWED'] },
  { key: 'review',   label: 'Review',    statuses: ['UNDER_REVIEW', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'RETURN_IN_TRANSIT', 'RETURN_RECEIVED', 'INSPECTION_PENDING'] },
  { key: 'decision', label: 'Decision',  statuses: ['APPROVED', 'REJECTED', 'ESCALATED_TO_DISPUTE', 'CANCELLED'] },
  { key: 'payout',   label: 'Payout',    statuses: ['PROCESSING_REFUND', 'GATEWAY_PENDING', 'WEBHOOK_RECEIVED', 'PENDING_ADMIN_VERIFICATION', 'REFUNDED', 'PARTIALLY_REFUNDED'] },
];

function RefundStepper({ status }) {
  const norm     = normalizeStatus(status);
  const isReject = ['REJECTED', 'CANCELLED', 'ESCALATED_TO_DISPUTE'].includes(norm);
  const activeIdx = STEPPER_FLOW.findIndex(s => s.statuses.includes(norm));

  // Determine active stage colors
  const getActiveColors = () => {
    if (isReject) return { border: 'border-red-400 bg-red-400', text: 'text-red-500' };
    if (['APPROVED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'PROCESSING_REFUND', 'GATEWAY_PENDING', 'WEBHOOK_RECEIVED', 'PENDING_ADMIN_VERIFICATION'].includes(norm)) {
      return { border: 'border-[#16A34A] bg-[#16A34A]/100', text: 'text-[#16A34A] dark:text-[#2E5E2C]' };
    }
    if (['WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'RETURN_IN_TRANSIT', 'RETURN_RECEIVED', 'INSPECTION_PENDING'].includes(norm)) {
      return { border: 'border-amber-500 bg-amber-500', text: 'text-amber-500 dark:text-amber-400' };
    }
    return { border: 'border-blue-500 bg-blue-500', text: 'text-blue-600 dark:text-blue-400' };
  };

  const activeColors = getActiveColors();

  return (
    <div className="flex items-center w-full">
      {STEPPER_FLOW.map((step, i) => {
        const done    = !isReject && i < activeIdx;
        const current = i === activeIdx;
        const last    = i === STEPPER_FLOW.length - 1;
        const isFailStep = isReject && current;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isFailStep ? 'border-red-400 bg-red-400'
                  : done    ? 'border-[#16A34A] bg-[#16A34A]/100'
                  : current ? `${activeColors.border} shadow-md`
                  : 'border-gray-250 bg-gray-55 dark:border-gray-700 dark:bg-gray-800'
              }`}>
                {isFailStep
                  ? <XCircle size={14} className="text-white" />
                  : done
                    ? <CheckCircle size={14} className="text-white" />
                    : current
                      ? <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                      : <div className="w-2 h-2 bg-gray-300 dark:bg-gray-650 rounded-full" />
                }
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                isFailStep ? 'text-red-500'
                  : done ? 'text-[#16A34A] dark:text-[#2E5E2C]'
                  : current ? activeColors.text
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {!last && (
              <div className={`flex-1 h-0.5 mb-5 ${done ? 'bg-[#16A34A]/100' : 'bg-gray-250 dark:bg-gray-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Evidence Thumbnails ─────────────────────────────────────────── */
function EvidenceGallery({ evidence, evidenceImagePath, onPreview }) {
  const items = evidence?.length
    ? evidence
    : evidenceImagePath
      ? [{ filePath: evidenceImagePath, note: 'Initial evidence', uploadedBy: 'CUSTOMER' }]
      : [];
  if (!items.length) return null;

  return (
    <div className="rounded-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3.5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Customer Evidence ({items.length} file{items.length !== 1 ? 's' : ''})
        </p>
        <span className="text-[8px] font-black uppercase tracking-widest text-[#16A34A] dark:text-[#2E5E2C] bg-[#16A34A]/10 dark:bg-[#16A34A]/15 px-2 py-0.5 rounded-full">
          Verified Evidence
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {items.map((item, idx) => {
          const url = resolveImageUrl(item.filePath);
          const img = isImg(item.filePath);
          return (
            <div key={item.id || item.filePath || idx} className="group relative">
              <button
                type="button"
                onClick={() => onPreview(url)}
                className="relative rounded-sm border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 overflow-hidden
                           hover:border-[#16A34A] hover:shadow-md transition-all w-16 h-16 shrink-0 block"
              >
                {img && url ? (
                  <>
                    <img
                      src={url}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                    />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye size={16} className="text-white" />
                    </div>
                  </>
                ) : null}
                <div className="w-full h-full items-center justify-center flex-col gap-1"
                     style={{ display: img && url ? 'none' : 'flex' }}>
                  <ImageIcon size={20} className="text-gray-300 dark:text-gray-700" />
                  <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500">File {idx + 1}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                  <p className="text-[7px] font-black text-white truncate uppercase tracking-wider">{item.uploadedBy || 'Customer'}</p>
                </div>
              </button>
              {/* Hover Preview Panel */}
              {img && url && (
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] pointer-events-none transition-all duration-200">
                  <div className="bg-white dark:bg-zinc-900 border-2 border-[#16A34A] rounded-xl p-1.5 shadow-2xl w-48 h-48 flex items-center justify-center relative">
                    <img src={url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-emerald-500" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Action Banner for seller ────────────────────────────────────── */
function ActionBanner({ status }) {
  const norm = normalizeStatus(status);
  if (['REQUESTED', 'PENDING', 'PENDING_SELLER'].includes(norm))
    return (
      <div className="rounded-sm border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-805/40 p-3 flex items-center gap-3">
        <div className="p-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-sm shrink-0">
          <AlertTriangle size={15} />
        </div>
        <div>
          <p className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">New Refund Claim</p>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">Please review the customer evidence and reason, then decide to approve, request return, or reject.</p>
        </div>
      </div>
    );
  if (norm === 'RETURN_RECEIVED' || norm === 'INSPECTION_PENDING')
    return (
      <div className="rounded-sm border border-violet-300 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-805/40 p-3 flex items-center gap-3">
        <div className="p-1 bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-sm shrink-0">
          <Package size={15} />
        </div>
        <div>
          <p className="text-xs font-black text-violet-900 dark:text-violet-200 uppercase tracking-wide">Product Return Received</p>
          <p className="text-[10px] text-violet-700 dark:text-violet-400 font-semibold mt-0.5">Inspect the physical condition of the returned item below, adjust the approved amount, and process final decision.</p>
        </div>
      </div>
    );
  if (norm === 'PROCESSING_REFUND')
    return (
      <div className="rounded-sm border border-[#16A34A]/30 bg-[#16A34A]/10 dark:bg-[#16A34A]/15 dark:border-emerald-805/40 p-3 flex items-center gap-3">
        <div className="p-1 bg-[#16A34A]/20 dark:bg-[#16A34A]/15 text-[#152F17] dark:text-[#2E5E2C] rounded-sm shrink-0">
          <CheckCircle size={15} />
        </div>
        <div>
          <p className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">Payout Pending</p>
          <p className="text-[10px] text-[#152F17] dark:text-[#2E5E2C] font-semibold mt-0.5">Send the refund amount to the customer's wallet account and upload the reference screenshot as proof.</p>
        </div>
      </div>
    );
  return null;
}

/* ─── Info panel ──────────────────────────────────────────────────── */
const INFO_TONES = {
  gray:   'border-gray-150 dark:border-gray-800 bg-gray-55 dark:bg-gray-955 text-gray-800 dark:text-gray-200',
  green:  'border-emerald-150 dark:border-emerald-955 bg-emerald-55 dark:bg-emerald-955/20 text-emerald-900 dark:text-[#8DBA90]',
  amber:  'border-amber-150 dark:border-amber-955 bg-amber-55 dark:bg-amber-955/20 text-amber-900 dark:text-amber-300',
  blue:   'border-blue-150 dark:border-blue-955 bg-blue-55 dark:bg-blue-955/20 text-blue-900 dark:text-blue-300',
  red:    'border-red-150 dark:border-red-955 bg-red-55 dark:bg-red-955/20 text-red-900 dark:text-red-300',
  violet: 'border-violet-150 dark:border-violet-955 bg-violet-55 dark:bg-violet-955/20 text-violet-900 dark:text-violet-300',
};

function InfoPanel({ tone = 'gray', label, children }) {
  return (
    <div className={`rounded-sm border p-3 transition-all shadow-sm ${INFO_TONES[tone] || INFO_TONES.gray}`}>
      <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">{label}</span>
      <div className="text-[11px] font-semibold leading-relaxed">{children}</div>
    </div>
  );
}

/* ─── Timeline list ──────────────────────────────────────────────── */
function RefundTimelineList({ entries }) {
  if (!entries?.length) return null;
  return (
    <div className="rounded-sm border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Activity Timeline</span>
        <span className="text-[9px] font-black text-[#16A34A] dark:text-[#2E5E2C] bg-[#16A34A]/10 dark:bg-[#16A34A]/15 px-2 py-0.5 rounded-sm">{entries.length} Events</span>
      </div>
      <div className="max-h-52 space-y-3.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
        {entries.slice().reverse().map((entry) => {
          const actor = String(entry.performedBy || 'SYSTEM').toUpperCase();
          const act = String(entry.action || '').toUpperCase();
          const badgeColor = 
            actor === 'SELLER' ? 'bg-[#16A34A]/10 text-[#152F17] dark:bg-[#16A34A]/15 dark:text-[#2E5E2C] border-emerald-100 dark:border-emerald-900/30' :
            actor === 'CUSTOMER' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' :
            actor === 'ADMIN' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-100 dark:border-purple-900/30' :
            'bg-gray-55 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700/30';

          let eventDotColor = 'bg-gray-400 dark:bg-gray-550 ring-gray-100 dark:ring-gray-800/40';
          if (act.includes('APPROVE') || act.includes('COMPLETE') || act.includes('RESOLVE') || act.includes('RECEIVE')) {
            eventDotColor = 'bg-[#16A34A]/100 dark:bg-emerald-450 ring-emerald-50 dark:ring-emerald-950/40';
          } else if (act.includes('REJECT') || act.includes('DISPUTE') || act.includes('CANCEL') || act.includes('FAIL') || act.includes('DENY')) {
            eventDotColor = 'bg-red-500 dark:bg-red-450 ring-red-50 dark:ring-red-950/40';
          } else if (act.includes('WAIT') || act.includes('EVIDENCE') || act.includes('INSPECT') || act.includes('UPLOAD')) {
            eventDotColor = 'bg-amber-500 dark:bg-amber-450 ring-amber-50 dark:ring-amber-950/30';
          } else if (actor === 'SELLER') {
            eventDotColor = 'bg-[#16A34A]/100 dark:bg-emerald-450 ring-emerald-50 dark:ring-emerald-950/40';
          } else if (actor === 'CUSTOMER') {
            eventDotColor = 'bg-blue-500 dark:bg-blue-450 ring-blue-50 dark:ring-blue-950/40';
          } else if (actor === 'ADMIN') {
            eventDotColor = 'bg-purple-500 dark:bg-purple-450 ring-purple-50 dark:ring-purple-950/40';
          }

          return (
            <div key={entry.id || `${entry.action}-${entry.timestamp}`} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ring-4 mt-1 ${eventDotColor}`} />
                <div className="w-0.5 flex-1 bg-gray-100 dark:bg-gray-800 mt-2" />
              </div>
              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                    {entry.action?.replaceAll('_', ' ')}
                  </p>
                  <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${badgeColor}`}>
                    {entry.performedBy || 'SYSTEM'}
                  </span>
                </div>
                <p className="text-[8.5px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                  {displayDT(entry.timestamp)}
                </p>
                {entry.comment && (
                  <div className="mt-1.5 p-2 bg-gray-50 dark:bg-gray-955 rounded-sm border border-gray-100 dark:border-gray-800 text-[10px] font-semibold text-gray-600 dark:text-gray-300 leading-relaxed shadow-sm">
                    {entry.comment}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tabs ───────────────────────────────────────────────────────── */
const TABS = [
  { id: 'ALL',      label: 'All Requests' },
  { id: 'PENDING',  label: 'Needs Action' },
  { id: 'COMPLETED',label: 'Processing / Done' },
  { id: 'REJECTED', label: 'Rejected' },
];
const tabMatch = (tab, r) => {
  const n = normalizeStatus(r.status);
  if (tab === 'ALL')      return true;
  if (tab === 'PENDING')  return ['REQUESTED','VIEWED','UNDER_REVIEW','WAITING_FOR_CUSTOMER','WAITING_FOR_RETURN','RETURN_IN_TRANSIT','RETURN_RECEIVED'].includes(n);
  if (tab === 'COMPLETED') return ['APPROVED','INSPECTION_PENDING','PROCESSING_REFUND','PENDING_ADMIN_VERIFICATION','PARTIALLY_REFUNDED','REFUNDED'].includes(n);
  if (tab === 'REJECTED') return ['REJECTED','CANCELLED','ESCALATED_TO_DISPUTE'].includes(n);
  return true;
};

/* ─── Statuses that need seller action ──────────────────────────── */
const SELLER_ACTION_STATUSES = ['REQUESTED','PENDING','PENDING_SELLER','VIEWED','RETURN_RECEIVED','INSPECTION_PENDING','PROCESSING_REFUND'];

export default function SellerRefunds() {
  const { darkMode } = useSellerTheme();
  const [searchParams] = useSearchParams();
  const [refunds,              setRefunds]              = useState([]);
  const [loading,              setLoading]              = useState(true);
  const [sellerId,             setSellerId]             = useState(null);
  const [error,                setError]                = useState('');
  const [activeTab,            setActiveTab]            = useState('ALL');
  const [previewEvidence,      setPreviewEvidence]      = useState(null);
  const [searchQuery,          setSearchQuery]          = useState('');
  const [expandedRefundId,     setExpandedRefundId]     = useState(null);

  useEffect(() => {
    const rId = searchParams.get('refundId');
    if (rId && refunds.length > 0) {
      const matched = refunds.find(r => String(r.id) === rId || refundRef(r).toLowerCase() === rId.toLowerCase());
      if (matched) {
        setExpandedRefundId(matched.id);
      }
    }
  }, [searchParams, refunds]);

  // Action state
  const [actingOnRefund,       setActingOnRefund]       = useState(null);
  const [requestingEvidenceFor,setRequestingEvidenceFor]= useState(null);
  const [requestingReturnFor,  setRequestingReturnFor]  = useState(null);
  const [returnForm,           setReturnForm]           = useState({});
  const [inspectionForms,      setInspectionForms]      = useState({});
  const [paymentForms,         setPaymentForms]         = useState({});
  const [nextStatus,           setNextStatus]           = useState('UNDER_REVIEW');
  const [comment,              setComment]              = useState('');
  const [submitting,           setSubmitting]           = useState(false);
  const [copiedId,             setCopiedId]             = useState(null);
  const [proofPreviews,        setProofPreviews]        = useState({});

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true); setError('');
      const profileRes = await getSellerProfile();
      const sId = profileRes.data?.userId || profileRes.data?.id;
      setSellerId(sId);
      if (sId) {
        const refundRes = await getSellerRefundRequests(sId);
        setRefunds(normalizeList(refundRes.data));
      } else {
        setError('No merchant profile found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load refunds.');
    } finally { setLoading(false); }
  };

  const refreshRefunds = async () => {
    if (!sellerId) return;
    const res = await getSellerRefundRequests(sellerId);
    setRefunds(normalizeList(res.data));
  };

  const cancelAction = () => {
    setActingOnRefund(null); setRequestingEvidenceFor(null); setRequestingReturnFor(null);
    setReturnForm({}); setInspectionForms({}); setPaymentForms({}); setComment('');
  };

  const handleStatusUpdate = async (refundId) => {
    if (!nextStatus) { setError('Please select a next status before updating.'); return; }
    try {
      setSubmitting(true); setError('');
      // APPROVED/REJECTED must use the dedicated seller-response endpoint so that
      // backend seller-specific state guards and notification logic fire correctly.
      if (nextStatus === 'APPROVED') {
        await respondToRefund(refundId, 'ACCEPT', comment);
      } else if (nextStatus === 'REJECTED') {
        await respondToRefund(refundId, 'REJECT', comment);
      } else {
        await updateRefundStatus(refundId, nextStatus, comment);
      }
      cancelAction(); await refreshRefunds();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update status.'); }
    finally { setSubmitting(false); }
  };

  const handleEvidenceRequest = async (refundId) => {
    if (!comment.trim()) { setError('Please tell the customer what evidence is needed.'); return; }
    try {
      setSubmitting(true); setError('');
      await requestRefundEvidence(refundId, comment);
      setRequestingEvidenceFor(null); setComment(''); await refreshRefunds();
    } catch (err) { setError(err.response?.data?.message || 'Failed to request evidence.'); }
    finally { setSubmitting(false); }
  };

  const handleReturnRequest = async (refundId) => {
    if (!returnForm.returnInstructions?.trim()) { setError('Please add return instructions before requesting a return.'); return; }
    try {
      setSubmitting(true); setError('');
      await requestRefundReturn(refundId, { ...returnForm, comment });
      setRequestingReturnFor(null); setReturnForm({}); setComment(''); await refreshRefunds();
    } catch (err) { setError(err.response?.data?.message || 'Failed to request return.'); }
    finally { setSubmitting(false); }
  };

  const updatePaymentForm    = (id, p) => setPaymentForms(f => ({ ...f, [id]: { ...(f[id]||{ paymentMethod: 'KHALTI' }), ...p } }));
  const updateInspectionForm = (id, p) => setInspectionForms(f => ({ ...f, [id]: { ...(f[id]||{ condition: 'GOOD' }), ...p } }));

  const handleInspection = async (refund, decision) => {
    const form = inspectionForms[refund.id] || {};
    try {
      setSubmitting(true); setError('');
      await inspectRefundReturn(refund.id, {
        condition: form.condition || 'GOOD',
        notes: form.notes || '',
        decision,
        approvedAmount: form.approvedAmount || refund.refundAmount,
      });
      setInspectionForms(f => ({ ...f, [refund.id]: {} }));
      await refreshRefunds();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save inspection.'); }
    finally { setSubmitting(false); }
  };

  const handlePaymentSubmit = async (refund) => {
    const form = paymentForms[refund.id] || {};
    if (!form.providerReference?.trim()) { setError('Please enter the payment transaction ID before submitting.'); return; }
    try {
      setSubmitting(true); setError('');
      await confirmSellerRefundCompletion(refund.id, {
        paymentMethod: form.paymentMethod || 'KHALTI',
        providerReference: form.providerReference,
        refundAmount: form.refundAmount || refund.refundAmount,
        comment: form.comment || '',
        proof: form.proof,
      });
      setPaymentForms(f => ({ ...f, [refund.id]: {} }));
      setProofPreviews(p => ({ ...p, [refund.id]: null }));
      setComment(''); await refreshRefunds();
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit payment.'); }
    finally { setSubmitting(false); }
  };

  const handleProofFileChange = (refundId, file) => {
    updatePaymentForm(refundId, { proof: file });
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreviews(prev => ({ ...prev, [refundId]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setProofPreviews(prev => {
        const copy = { ...prev };
        delete copy[refundId];
        return copy;
      });
    }
  };

  const handleCopy = (e, id, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Telemetry statistics
  const stats = useMemo(() => {
    let needsActionCount = 0;
    let activeExposureVal = 0;
    let completedPayoutsVal = 0;
    let escalatedDisputesCount = 0;

    refunds.forEach(r => {
      const norm = normalizeStatus(r.status);
      const amt = Number(r.refundAmount || r.approvedAmount || 0);

      if (SELLER_ACTION_STATUSES.includes(norm)) {
        needsActionCount++;
      }
      if (!TERMINAL.includes(norm)) {
        activeExposureVal += amt;
      }
      if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(norm)) {
        completedPayoutsVal += Number(r.approvedAmount || r.refundAmount || 0);
      }
      if (norm === 'ESCALATED_TO_DISPUTE') {
        escalatedDisputesCount++;
      }
    });

    return {
      needsAction: needsActionCount,
      activeExposure: activeExposureVal,
      completedPayouts: completedPayoutsVal,
      escalatedDisputes: escalatedDisputesCount
    };
  }, [refunds]);

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.id] = tab.id === 'ALL' ? refunds.length : refunds.filter(r => tabMatch(tab.id, r)).length;
    return acc;
  }, {});

  const filteredRefunds = useMemo(() => {
    return refunds.filter(r => {
      if (!tabMatch(activeTab, r)) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const refId = refundRef(r).toLowerCase();
        const oRef = orderRef(r).toLowerCase();
        const reason = (r.reason || '').toLowerCase();
        return refId.includes(q) || oRef.includes(q) || reason.includes(q);
      }
      return true;
    });
  }, [refunds, activeTab, searchQuery]);

  // Dynamic panel formatting functions
  const getRiskTone = (r) => {
    const score = r.riskScore;
    const level = String(r.riskLevel || '').toUpperCase();
    if (level === 'HIGH' || score >= 70) return 'red';
    if (level === 'MEDIUM' || (score >= 40 && score < 70)) return 'amber';
    return 'green';
  };

  const getRiskDescription = (r) => {
    const tone = getRiskTone(r);
    if (tone === 'red') return 'High risk anomaly flagged. Audit customer details and evidence files thoroughly.';
    if (tone === 'amber') return 'Moderate risk assessment. Minor metadata deviations detected.';
    return 'Low fraud risk. Account metrics and transaction metadata match standard patterns.';
  };

  const getInspectionTone = (cond) => {
    const c = String(cond || '').toUpperCase();
    if (c === 'GOOD') return 'green';
    if (c === 'DAMAGED') return 'red';
    if (c === 'MISSING_PARTS') return 'amber';
    return 'violet';
  };

  const getInspectionDescription = (cond) => {
    const c = String(cond || '').toUpperCase();
    if (c === 'GOOD') return 'Resaleable condition. Restock inventory.';
    if (c === 'DAMAGED') return 'Damaged return. Item cannot be resold.';
    if (c === 'MISSING_PARTS') return 'Returned incomplete. Missing components/accessories.';
    return 'Inspected returned merchandise.';
  };

  const getPaymentTone = (stage) => {
    return String(stage || '').toUpperCase() === 'REFUNDED' ? 'green' : 'blue';
  };

  const getPaymentDescription = (stage) => {
    const s = String(stage || '').toUpperCase();
    if (s === 'REFUNDED') return 'Gateway settlement completed. Funds credited back to customer wallet.';
    if (s === 'PROCESSING') return 'Payout confirmation pending admin verification.';
    return 'Reversal transaction stage: ' + s;
  };

  if (loading) return <LoadingState label="Loading refund requests…" />;

  // ── DETAIL VIEW ──
  if (expandedRefundId) {
    const refund = refunds.find(r => r.id === expandedRefundId);
    if (!refund) return null;
    const norm = normalizeStatus(refund.status);
    const needsAct = SELLER_ACTION_STATUSES.includes(norm);
    const canAct  = !TERMINAL.includes(norm) && nextStatusOptions(refund.status).length > 0;

    return (
      <div className="space-y-4 max-w-[1400px] font-sans animate-in fade-in duration-200">
        {/* Back navigation bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setExpandedRefundId(null); cancelAction(); }}
            className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <ArrowLeft size={16} />
            Back to Requests List
          </button>
        </div>

        {/* Detailed Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-sm shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-5 border-b border-gray-150 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-sm select-none">
                    <span className="font-mono text-[11px] font-black text-gray-700 dark:text-gray-300">{refundRef(refund)}</span>
                    <button
                      onClick={(e) => handleCopy(e, refund.id, refundRef(refund))}
                      className="text-gray-400 hover:text-[#e8f3e9]0 transition-colors cursor-pointer"
                      title="Copy Refund Reference ID"
                    >
                      {copiedId === refund.id ? <Check size={11} className="text-[#e8f3e9]0 animate-in fade-in" /> : <Copy size={11} />}
                    </button>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${badgeClass(refund.status)}`}>
                    {statusLabel(refund.status)}
                  </span>
                  {needsAct && (
                    <span className="inline-flex items-center gap-1 bg-amber-100/80 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-[9px] font-black">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      Seller Action Required
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold flex items-center gap-2.5">
                  <span className="flex items-center gap-1">
                    Order: 
                    <Link
                      to={`/seller/orders?orderId=${refund.customOrderId || refund.orderId}`}
                      className="font-black text-[#16A34A] hover:text-[#16A34A] dark:hover:text-[#2E5E2C] hover:underline flex items-center gap-0.5"
                    >
                      {orderRef(refund)}
                      <ExternalLink size={10} />
                    </Link>
                  </span>
                  <span>•</span>
                  <span>Requested: <span className="font-bold text-gray-600 dark:text-gray-300">{displayDate(refund.createdAt)}</span></span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-black text-base text-gray-800 dark:text-white block">{formatMoney(refund.refundAmount)}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Amount Claimed</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Action banner */}
            <ActionBanner status={refund.status} />

            {/* Stepper */}
            <div className="bg-gray-50 dark:bg-gray-955/40 rounded-sm border border-gray-150 dark:border-gray-800 p-3.5 shadow-inner">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Claim Stage Process</p>
              <RefundStepper status={refund.status} />
            </div>

            {/* Detail grid */}
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="space-y-5">
                <InfoPanel label="Customer Claim Reason">
                  <p className="text-gray-700 dark:text-gray-300">{formatReason(refund.reason)}</p>
                </InfoPanel>

                <EvidenceGallery
                  evidence={refund.evidence}
                  evidenceImagePath={refund.evidenceImagePath}
                  onPreview={setPreviewEvidence}
                />

                {(refund.latestEvidenceRequest || refund.sellerComment || refund.adminComment) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {refund.latestEvidenceRequest && (
                      <InfoPanel tone="amber" label="Evidence Request Sent">
                        <p>{refund.latestEvidenceRequest}</p>
                      </InfoPanel>
                    )}
                    {refund.sellerComment && (
                      <InfoPanel label="Your Remark">
                        <p>{refund.sellerComment}</p>
                      </InfoPanel>
                    )}
                    {refund.adminComment && (
                      <InfoPanel tone="blue" label="Admin Reference">
                        <p>{refund.adminComment}</p>
                        {refund.providerReference && (
                          <p className="mt-1 font-mono text-[9px] font-black uppercase tracking-wide bg-blue-100 dark:bg-blue-955/40 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded inline-block">Ref: {refund.providerReference}</p>
                        )}
                      </InfoPanel>
                    )}
                  </div>
                )}

                {(refund.returnInstructions || refund.returnCourier) && (
                  <InfoPanel tone="green" label="Return Details">
                    {refund.returnInstructions && <p>{refund.returnInstructions}</p>}
                    <div className="mt-2.5 grid gap-2.5 text-[10px] sm:grid-cols-3 bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-lg shadow-sm">
                      {refund.returnCourier       && <span><b className="text-gray-500 dark:text-gray-400">Courier:</b> {refund.returnCourier}</span>}
                      {refund.returnTrackingNumber && <span><b className="text-gray-500 dark:text-gray-400">Tracking:</b> {refund.returnTrackingNumber}</span>}
                      {refund.returnDeadline      && <span><b className="text-gray-500 dark:text-gray-400">Deadline:</b> {displayDate(refund.returnDeadline)}</span>}
                    </div>
                  </InfoPanel>
                )}
              </div>

              {/* Right column: Unified audit panel */}
              <div className="space-y-5">
                {(refund.riskLevel || refund.paymentStage || refund.inspectionCondition) && (
                  <div className="rounded-sm border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-955/20 p-4 space-y-4 shadow-sm">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Security & Quality Audit</span>
                    
                    <div className="space-y-3">
                      {refund.riskLevel && (
                        <div className="border border-gray-200 dark:border-gray-805 rounded-lg p-3 bg-white dark:bg-gray-900 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Risk Level</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            getRiskTone(refund) === 'red' ? 'text-red-600 bg-red-50' : 
                            getRiskTone(refund) === 'amber' ? 'text-amber-600 bg-amber-50' : 'text-[#16A34A] bg-[#16A34A]/10'
                          }`}>{refund.riskLevel}</span>
                        </div>
                      )}
                      {refund.paymentStage && (
                        <div className="border border-gray-200 dark:border-gray-805 rounded-lg p-3 bg-white dark:bg-gray-900 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Payment Stage</span>
                          <span className="text-[10px] font-black text-blue-600">{refund.paymentStage.replaceAll('_', ' ')}</span>
                        </div>
                      )}
                      {refund.inspectionCondition && (
                        <div className="border border-gray-200 dark:border-gray-805 rounded-lg p-3 bg-white dark:bg-gray-900 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Condition</span>
                          <span className="text-[10px] font-black text-gray-850 dark:text-white">{refund.inspectionCondition}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                       {refund.riskLevel && (
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed"><b className="text-gray-850 dark:text-gray-200">Risk:</b> {getRiskDescription(refund)}</p>
                       )}
                       {refund.paymentStage && (
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed"><b className="text-gray-850 dark:text-gray-200">Stage:</b> {getPaymentDescription(refund.paymentStage)}</p>
                       )}
                       {refund.inspectionCondition && (
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed"><b className="text-gray-850 dark:text-gray-200">Inspect:</b> {getInspectionDescription(refund.inspectionCondition)}</p>
                       )}
                       {refund.inspectionNotes && (
                          <div className="p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-[10px] text-gray-600 italic">
                             "{refund.inspectionNotes}"
                          </div>
                       )}
                    </div>
                  </div>
                )}
                <RefundTimelineList entries={refund.timeline} />
              </div>
            </div>
          </div>

          {/* ── Action area ── */}
          {canAct && (
            <div className="px-6 pb-6 border-t border-gray-155 dark:border-gray-850 pt-5 bg-gray-55/20 dark:bg-gray-955/10">
              <AnimatePresence mode="wait">
                {requestingEvidenceFor === refund.id ? (
                  <motion.div
                    key="evidence"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-amber-50 dark:bg-amber-955/20 border border-amber-205 dark:border-amber-900/40 rounded-xl p-4 space-y-3 overflow-hidden"
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Info size={14} /> Ask Customer for More Evidence
                    </h4>
                    <textarea
                      placeholder="Describe exactly what proof, photo, or document you need from the customer…"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-amber-205 dark:border-gray-800 rounded-xl p-3 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none h-24 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelAction} disabled={submitting} className="px-4 py-2 border border-gray-205 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold">Cancel</button>
                      <button onClick={() => handleEvidenceRequest(refund.id)} disabled={submitting} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm">
                        {submitting ? 'Sending…' : 'Request Evidence'}
                      </button>
                    </div>
                  </motion.div>
                ) : requestingReturnFor === refund.id ? (
                  <motion.div
                    key="return"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-[#16A34A]/10 dark:bg-emerald-955/20 border border-emerald-205 dark:border-emerald-900/40 rounded-xl p-4 space-y-3.5 overflow-hidden"
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#152F17] dark:text-[#2E5E2C] flex items-center gap-1.5">
                      <Package size={14} /> Request Product Return Shipment
                    </h4>
                    <textarea
                      placeholder="Provide return address, packaging instructions, accessories to include..."
                      value={returnForm.returnInstructions || ''}
                      onChange={e => setReturnForm(f => ({ ...f, returnInstructions: e.target.value }))}
                      className="w-full bg-white dark:bg-gray-900 border border-emerald-205 dark:border-gray-850 rounded-xl p-3 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none h-20 focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20"
                    />
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      {[
                        { placeholder: 'Suggested Courier (e.g. DHL, FedEx)', key: 'returnCourier' },
                        { placeholder: 'Tracking Label (e.g. Track Ref)', key: 'returnTrackingNumber' },
                      ].map(({ placeholder, key }) => (
                        <input
                          key={key}
                          placeholder={placeholder}
                          value={returnForm[key] || ''}
                          onChange={e => setReturnForm(f => ({ ...f, [key]: e.target.value }))}
                          className="bg-white dark:bg-gray-900 border border-emerald-205 dark:border-gray-855 rounded-xl p-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-[#16A34A]"
                        />
                      ))}
                      <div className="relative">
                        <input
                          type="date"
                          value={returnForm.returnDeadline || ''}
                          onChange={e => setReturnForm(f => ({ ...f, returnDeadline: e.target.value }))}
                          className="bg-white dark:bg-gray-900 border border-emerald-205 dark:border-gray-855 rounded-xl p-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none w-full focus:border-[#16A34A]"
                        />
                        <span className="absolute right-8 top-3 text-[8px] font-black uppercase tracking-widest text-gray-400 pointer-events-none">Deadline</span>
                      </div>
                    </div>
                    <textarea
                      placeholder="Optional private memo details..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-emerald-205 dark:border-gray-855 rounded-xl p-3 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none h-14 focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelAction} disabled={submitting} className="px-4 py-2 border border-gray-205 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold">Cancel</button>
                      <button onClick={() => handleReturnRequest(refund.id)} disabled={submitting} className="px-4 py-2 bg-[#16A34A] hover:bg-[#0D1E0F] text-white rounded-xl text-xs font-bold shadow-sm">
                        {submitting ? 'Sending…' : 'Request Return'}
                      </button>
                    </div>
                  </motion.div>
                ) : actingOnRefund === refund.id ? (
                  <motion.div
                    key="status"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3.5 overflow-hidden"
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">Update Refund Flow Status</h4>
                    <select
                      value={nextStatus}
                      onChange={e => setNextStatus(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-750 rounded-xl p-2.5 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-white outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20"
                    >
                      {nextStatusOptions(refund.status).map(s => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Provide a reason or log note about this workflow state adjustment..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-750 rounded-xl p-3 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none h-20 focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelAction} disabled={submitting} className="px-4 py-2 border border-gray-202 dark:border-gray-750 bg-white dark:bg-gray-800 hover:bg-gray-55 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold">Cancel</button>
                      <button onClick={() => handleStatusUpdate(refund.id)} disabled={submitting} className="px-4 py-2 bg-[#16A34A] hover:bg-[#0D1E0F] text-white rounded-xl text-xs font-bold shadow-sm">
                        {submitting ? 'Updating…' : 'Confirm Update'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Default Action buttons row */
                  <motion.div
                    key="buttons"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-wrap gap-2.5"
                  >
                    {norm !== 'APPROVED' && (
                      <button
                        onClick={() => { setRequestingEvidenceFor(refund.id); setActingOnRefund(null); setRequestingReturnFor(null); setComment(''); }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 border border-amber-250 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-103 cursor-pointer"
                      >
                        <AlertTriangle size={13} /> Ask for Evidence
                      </button>
                    )}
                    {['REQUESTED', 'VIEWED', 'UNDER_REVIEW'].includes(norm) && (
                      <button
                        onClick={() => { setRequestingReturnFor(refund.id); setRequestingEvidenceFor(null); setActingOnRefund(null); setReturnForm({}); setComment(''); }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#152F17] hover:bg-[#16A34A]/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-103 cursor-pointer"
                      >
                        <Package size={13} /> Request Return
                      </button>
                    )}
                    <button
                      onClick={() => { setActingOnRefund(refund.id); setRequestingEvidenceFor(null); setRequestingReturnFor(null); setNextStatus(firstNextStatus(refund.status)); setComment(''); }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#16A34A] hover:bg-[#0D1E0F] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-103 shadow-sm cursor-pointer ml-auto"
                    >
                      <Clock size={13} /> {norm === 'APPROVED' ? 'Start Processing' : 'Update Status'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Pay customer panel */}
          {norm === 'PROCESSING_REFUND' && (
            <div className="px-6 pb-6 border-t border-gray-155 dark:border-gray-800 pt-5 bg-[#16A34A]/10 dark:bg-emerald-955/5">
              <div className="rounded-xl border border-[#16A34A]/20 dark:border-emerald-900/40 bg-[#16A34A]/10/30 dark:bg-emerald-955/20 p-4 space-y-4 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-[#16A34A]/20 dark:bg-[#16A34A]/20 text-[#16A34A] rounded-lg"><Coins size={14} /></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#152F17] dark:text-[#2E5E2C]">Submit Payment Settlement Proof</h4>
                </div>
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-[#8DBA90]/80">
                  Process the payout via Khalti or eSewa wallet, then log the reference details and transaction screenshot below for admin verification.
                </p>

                {/* Custom Payout Selector */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Payment Gateway</label>
                    <div className="flex gap-2.5">
                      {[
                        { value: 'KHALTI', label: 'Khalti Payout', logoText: 'Khalti', activeClass: 'border-[#5c2d91] bg-[#5c2d91]/10 text-[#5c2d91] dark:text-[#a074e6]' },
                        { value: 'ESEWA', label: 'eSewa Payout', logoText: 'eSewa', activeClass: 'border-[#60bb46] bg-[#60bb46]/10 text-[#60bb46] dark:text-[#7ae65d]' }
                      ].map(opt => {
                        const selected = (paymentForms[refund.id]?.paymentMethod || 'KHALTI') === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updatePaymentForm(refund.id, { paymentMethod: opt.value })}
                            className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                              selected 
                                ? `${opt.activeClass} shadow-sm border-2 scale-[1.02]`
                                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                          >
                            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                              {opt.logoText}
                              {selected && <CheckCircle size={10} />}
                            </span>
                            <span className="text-[8px] font-bold opacity-80 mt-0.5">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Transaction ID / Payout amount */}
                  <div className="grid gap-2 grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Transaction ID</label>
                      <input
                        placeholder="Transaction / Reference Ref"
                        value={paymentForms[refund.id]?.providerReference || ''}
                        onChange={e => updatePaymentForm(refund.id, { providerReference: e.target.value })}
                        className="w-full bg-white dark:bg-gray-900 border border-[#16A34A]/30 dark:border-gray-800 rounded-xl p-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-[#16A34A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Payout Amount</label>
                      <div className="relative">
                        <input
                          type="number" min="1"
                          max={refund.totalAmount || refund.refundAmount || undefined}
                          placeholder="Amount"
                          value={paymentForms[refund.id]?.refundAmount || refund.refundAmount || ''}
                          onChange={e => updatePaymentForm(refund.id, { refundAmount: e.target.value })}
                          className="w-full bg-white dark:bg-gray-900 border border-[#16A34A]/30 dark:border-gray-800 rounded-xl p-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-[#16A34A]"
                        />
                      </div>
                      {(() => {
                        const form = paymentForms[refund.id] || {};
                        const enteredAmt = Number(form.refundAmount || refund.refundAmount || 0);
                        const originalAmt = Number(refund.refundAmount || 0);
                        if (enteredAmt !== originalAmt && originalAmt > 0) {
                          const pct = Math.round((enteredAmt / originalAmt) * 100);
                          return (
                            <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/20 px-2 py-0.5 rounded-full block text-right mt-1 shrink-0">
                              Partial: {pct}%
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* File upload drag proof & Memo */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Transaction Screenshot Proof</label>
                    <div className="relative border border-[#16A34A]/30 dark:border-gray-855 rounded-xl bg-white dark:bg-gray-900 p-2 text-xs flex items-center justify-between">
                      <input
                        type="file" accept="image/*,.pdf"
                        onChange={e => handleProofFileChange(refund.id, e.target.files?.[0] || null)}
                        className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#16A34A]/10 file:text-[#152F17] dark:file:bg-emerald-955/30 dark:file:text-[#2E5E2C]"
                      />
                    </div>
                    {proofPreviews[refund.id] && (
                      <div className="mt-2.5 relative w-20 h-20 rounded-xl overflow-hidden border border-gray-250 dark:border-gray-700 shadow-sm animate-in zoom-in-95">
                        <img src={proofPreviews[refund.id]} alt="Payment proof preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => handleProofFileChange(refund.id, null)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 transition-colors cursor-pointer"
                        >
                          <XCircle size={10} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Remarks Memo</label>
                    <textarea
                      placeholder="Optional private transaction note..."
                      value={paymentForms[refund.id]?.comment || ''}
                      onChange={e => updatePaymentForm(refund.id, { comment: e.target.value })}
                      className="w-full bg-white dark:bg-gray-900 border border-[#16A34A]/30 dark:border-gray-855 rounded-xl p-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none h-14 focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handlePaymentSubmit(refund)}
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#152F17] hover:bg-[#0D1E0F] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-102 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Submit Settlement Proof'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin verification pending */}
          {norm === 'PENDING_ADMIN_VERIFICATION' && (
            <div className="px-5 pb-4">
              <div className="rounded-xl border border-blue-250 bg-blue-50 dark:bg-blue-955/20 dark:border-blue-900/40 p-3.5 text-[11px] font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Info size={15} /> Payment proof submitted successfully. Jhapcham administration is auditing the transaction reference. The status will update once confirmed.
              </div>
            </div>
          )}

          {/* Inspection panel */}
          {['RETURN_RECEIVED', 'INSPECTION_PENDING'].includes(norm) && (
            <div className="px-6 pb-6 border-t border-gray-155 dark:border-gray-850 pt-5 bg-violet-50/10 dark:bg-violet-955/5">
              <div className="rounded-xl border border-violet-250 dark:border-violet-900/40 bg-violet-50/30 dark:bg-violet-955/20 p-4 space-y-4 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-lg"><Sparkles size={14} /></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">Merchandise Quality Assessment Audit</h4>
                </div>

                {/* Pill Cards condition selector */}
                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Returned Condition</label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {[
                      { value: 'GOOD', label: 'Good condition', icon: CheckCircle, activeClass: 'bg-[#16A34A]/10 border-[#16A34A] text-emerald-800 dark:bg-[#16A34A]/15 dark:border-[#16A34A] dark:text-[#8DBA90]' },
                      { value: 'DAMAGED', label: 'Damaged merchandise', icon: XCircle, activeClass: 'bg-red-50 border-red-500 text-red-800 dark:bg-red-950/20 dark:border-red-500 dark:text-red-300' },
                      { value: 'MISSING_PARTS', label: 'Missing accessory/parts', icon: AlertTriangle, activeClass: 'bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-950/20 dark:border-amber-500 dark:text-amber-300' }
                    ].map(opt => {
                      const selected = (inspectionForms[refund.id]?.condition || 'GOOD') === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateInspectionForm(refund.id, { condition: opt.value })}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                            selected 
                              ? `${opt.activeClass} shadow-md border-2 scale-[1.02]`
                              : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-850'
                          }`}
                        >
                          <Icon size={14} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Approved Amount & notes inputs */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Approved Refund Amount</label>
                    <input
                      type="number" min="1"
                      max={refund.totalAmount || refund.refundAmount || undefined}
                      placeholder="Approved refund amount"
                      value={inspectionForms[refund.id]?.approvedAmount || refund.refundAmount || ''}
                      onChange={e => updateInspectionForm(refund.id, { approvedAmount: e.target.value })}
                      className="w-full bg-white dark:bg-gray-900 border border-violet-250 dark:border-gray-855 rounded-xl p-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-violet-500"
                    />
                    {(() => {
                      const form = inspectionForms[refund.id] || {};
                      const enteredAmt = Number(form.approvedAmount || refund.refundAmount || 0);
                      const originalAmt = Number(refund.refundAmount || 0);
                      if (enteredAmt !== originalAmt && originalAmt > 0) {
                        const pct = Math.round((enteredAmt / originalAmt) * 100);
                        return (
                          <span className="text-[8.5px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/20 px-2 py-0.5 rounded-full block text-right mt-1">
                            ⚠️ Proposing Partial Settlement: {pct}% of Rs. {originalAmt}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Quality Assessment Notes</label>
                    <input
                      placeholder="Describe visual defects, missing packaging detail..."
                      value={inspectionForms[refund.id]?.notes || ''}
                      onChange={e => updateInspectionForm(refund.id, { notes: e.target.value })}
                      className="w-full bg-white dark:bg-gray-900 border border-violet-250 dark:border-gray-855 rounded-xl p-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 justify-end pt-2">
                  <button onClick={() => handleInspection(refund, 'REJECT')}   disabled={submitting} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-955/20 dark:text-red-400 dark:border-red-900/30 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"><XCircle size={13} /> Reject Claim</button>
                  <button onClick={() => handleInspection(refund, 'ESCALATE')} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"><AlertTriangle size={13} /> Escalate to Dispute</button>
                  <button onClick={() => handleInspection(refund, 'APPROVE')}  disabled={submitting} className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-102 cursor-pointer"><CheckCircle size={13} /> Approve Refund</button>
                </div>
              </div>
            </div>
          )}

          {/* Escalated to dispute */}
          {norm === 'ESCALATED_TO_DISPUTE' && (
            <div className="px-5 pb-4">
              <div className="rounded-xl border border-violet-250 bg-violet-50 dark:bg-violet-955/20 dark:border-violet-900/40 p-3.5 text-[11px] font-bold text-violet-800 dark:text-violet-300 flex items-center gap-2">
                <AlertTriangle size={15} /> This refund is escalated to a dispute. A Jhapcham dispute arbitrator is reviewing independent merchant log events and customer evidence upload to enforce a settlement.
              </div>
            </div>
          )}
        </div>

        <EvidencePreviewModal url={previewEvidence} title="Customer Refund Evidence" onClose={() => setPreviewEvidence(null)} />
      </div>
    );
  }

  // ── DEFAULT LIST VIEW ──
  return (
    <div className="space-y-4 max-w-[1400px] font-sans">
      <SectionHeader
        title="Refund Requests Console"
        subtitle="Track customer refund disputes, review return packages, inspect product condition, and handle payouts."
        action={
          <button
            onClick={loadAll}
            className="p-1.5 text-gray-400 hover:text-gray-700 transition-all bg-white rounded-sm border border-gray-200 hover:border-gray-400"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold rounded-sm flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Telemetry Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Needs Action */}
        <div className={`p-3.5 rounded-sm border-l-4 border border-gray-200 transition-all duration-300 shadow-sm ${
          stats.needsAction > 0 
            ? 'border-l-amber-400 bg-amber-50/50' 
            : 'bg-white border-l-gray-300'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Needs Action</span>
              <p className="text-base font-black mt-1 flex items-center gap-2 text-gray-900 dark:text-white">
                {stats.needsAction}
                {stats.needsAction > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </p>
            </div>
            <div className={`p-1.5 rounded-sm ${stats.needsAction > 0 ? 'bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-650'}`}>
              <Clock size={16} />
            </div>
          </div>
          <p className="text-[9.5px] font-semibold text-gray-500 mt-2">Requests awaiting seller review</p>
        </div>

        {/* Claim Exposure */}
        <div className="p-3.5 bg-white border border-gray-200 border-l-4 border-l-blue-400 dark:bg-gray-900 dark:border-gray-800 rounded-sm shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Active Exposure</span>
              <p className="text-base font-black mt-1 text-gray-900 dark:text-white">{formatMoney(stats.activeExposure)}</p>
            </div>
            <div className="p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-sm">
              <Coins size={16} />
            </div>
          </div>
          <p className="text-[9.5px] font-semibold text-gray-500 mt-2">Active claim amount under review</p>
        </div>

        {/* Completed Payouts */}
        <div className="p-3.5 bg-white border border-gray-200 border-l-4 border-l-emerald-400 dark:bg-gray-900 dark:border-gray-800 rounded-sm shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Total Payouts Done</span>
              <p className="text-base font-black mt-1 text-gray-900 dark:text-white">{formatMoney(stats.completedPayouts)}</p>
            </div>
            <div className="p-1.5 bg-[#16A34A]/10 text-[#16A34A] dark:bg-[#16A34A]/20 dark:text-[#2E5E2C] rounded-sm">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="text-[9.5px] font-semibold text-gray-500 mt-2">Settled claims payout total</p>
        </div>

        {/* Disputes / Escalations */}
        <div className={`p-3.5 rounded-sm border-l-4 border border-gray-200 transition-all duration-300 shadow-sm ${
          stats.escalatedDisputes > 0 
            ? 'border-l-red-400 bg-red-50/50' 
            : 'bg-white border-l-gray-300'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Escalated Disputes</span>
              <p className="text-base font-black mt-1 text-gray-900 dark:text-white">{stats.escalatedDisputes}</p>
            </div>
            <div className={`p-1.5 rounded-sm ${stats.escalatedDisputes > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-650'}`}>
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-[9.5px] font-semibold text-gray-500 mt-2">Disputes in admin arbitration</p>
        </div>
      </div>

      {/* Tabs & Search controls */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-sm shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-4 pt-3 pb-2.5 border-b border-gray-100">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-[9px] font-black transition-all whitespace-nowrap uppercase tracking-wider ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                {tab.label}
                <span className={`text-[8px] font-black px-1 py-0.5 rounded-sm ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {tabCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex items-center border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-sm w-full md:w-60">
            <svg className="w-3 h-3 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search REF ID, Order ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-gray-800 dark:text-white placeholder-gray-400 font-semibold"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-sm pl-1">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Table List */}
      {filteredRefunds.length === 0 ? (
        <EmptyState title="No Refund Requests" text="No refund requests match your current filters." />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-955 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Refund reference</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Order details</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Requested date</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Reason</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Claimed</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filteredRefunds.map(refund => {
                  const norm = normalizeStatus(refund.status);
                  const needsAct = SELLER_ACTION_STATUSES.includes(norm);
                  return (
                    <tr 
                      key={refund.id} 
                      onClick={() => setExpandedRefundId(refund.id)}
                      className="hover:bg-gray-55/40 dark:hover:bg-gray-850/40 transition-colors cursor-pointer group"
                    >
                      {/* ID reference */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedRefundId(refund.id); }}
                            className="font-mono text-xs font-black text-[#16A34A] hover:underline cursor-pointer group-hover:scale-102 transition-transform"
                          >
                            {refundRef(refund)}
                          </button>
                          <button
                            onClick={(e) => handleCopy(e, refund.id, refundRef(refund))}
                            className="text-gray-300 hover:text-[#e8f3e9]0 dark:text-gray-600 dark:hover:text-[#2E5E2C] transition-colors cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId === refund.id ? <Check size={11} className="text-[#e8f3e9]0" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>

                      {/* Order info */}
                      <td className="px-3 py-2.5">
                        <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                          {orderRef(refund)}
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="px-3 py-2.5">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          {displayDate(refund.createdAt)}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-3 py-2.5 max-w-[120px] truncate">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400" title={refund.reason}>
                          {refund.reason || 'No details.'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${badgeClass(refund.status)}`}>
                            {statusLabel(refund.status)}
                          </span>
                          {needsAct && (
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Action required" />
                          )}
                        </div>
                      </td>

                      {/* Claimed Amount */}
                      <td className="px-3 py-2.5">
                        <span className="text-[11px] font-black text-gray-800 dark:text-white">
                          {formatMoney(refund.refundAmount)}
                        </span>
                      </td>

                      {/* Action trigger button */}
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedRefundId(refund.id); }}
                          className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white rounded-sm text-[9px] font-black uppercase tracking-wider transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
