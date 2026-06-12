import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminDisputes, adminArbitrateDispute } from '../services/adminService';
import DisputeThread from '../../dispute/components/DisputeThread';
import { useAdminTheme } from '../hooks/useAdminTheme';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Gavel, RefreshCw, Scale, ShieldAlert, XCircle,
} from 'lucide-react';

/* ─── Status badges ──────────────────────────────────────────────── */
const STATUS_BADGE_LIGHT = {
  OPEN:         'bg-amber-50  text-amber-700  border-amber-200',
  PENDING:      'bg-amber-50  text-amber-700  border-amber-200',
  UNDER_REVIEW: 'bg-blue-50   text-blue-700   border-blue-200',
  ESCALATED:    'bg-violet-50 text-violet-700 border-violet-200',
  RESOLVED:     'bg-green-50  text-green-700  border-green-200',
  CLOSED:       'bg-gray-100  text-gray-500   border-gray-200',
};
const STATUS_BADGE_DARK = {
  OPEN:         'bg-amber-900/30  text-amber-400  border-amber-700',
  PENDING:      'bg-amber-900/30  text-amber-400  border-amber-700',
  UNDER_REVIEW: 'bg-blue-900/30   text-blue-400   border-blue-700',
  ESCALATED:    'bg-violet-900/30 text-violet-400 border-violet-700',
  RESOLVED:     'bg-green-900/30  text-green-400  border-green-700',
  CLOSED:       'bg-gray-700      text-gray-400   border-gray-600',
};

/* ─── Helpers ────────────────────────────────────────────────────── */
const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';
const disputeRef = (d) => d.publicReferenceId || `DSP-${d.id}`;
const dateLabel  = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/* ─── Outcome definitions — values MUST match backend enum exactly ─ */
/**
 * Backend DisputeOutcome enum values:
 *   REFUND | PARTIAL_REFUND | DENIED
 *
 * Previous values (FULL_REFUND_TO_BUYER, NO_REFUND_SELLER_WINS, MUTUAL_SETTLEMENT,
 * ESCALATED_TO_LEGAL) were WRONG and caused 400 errors on every arbitration.
 */
const OUTCOMES = [
  {
    value:    'REFUND',
    label:    'Full Refund to Buyer',
    sub:      'Buyer wins — full refund amount will be returned.',
    color:    'border-emerald-400 bg-emerald-50 text-emerald-900',
    selected: 'bg-emerald-600 text-white border-emerald-600',
    icon:     CheckCircle,
    iconCls:  'text-emerald-600',
  },
  {
    value:    'PARTIAL_REFUND',
    label:    'Partial Refund',
    sub:      'Split decision — enter the exact amount to refund.',
    color:    'border-amber-400 bg-amber-50 text-amber-900',
    selected: 'bg-amber-500 text-white border-amber-500',
    icon:     Scale,
    iconCls:  'text-amber-500',
  },
  {
    value:    'DENIED',
    label:    'Deny — Seller Wins',
    sub:      'Seller wins — no refund will be issued.',
    color:    'border-red-400 bg-red-50 text-red-900',
    selected: 'bg-red-600 text-white border-red-600',
    icon:     XCircle,
    iconCls:  'text-red-600',
  },
];

/* ─── Smart tabs ─────────────────────────────────────────────────── */
const SMART_TABS = [
  { id: 'ALL',          label: 'All',           match: () => true },
  { id: 'PENDING',      label: '⚡ Open',        match: (d) => ['OPEN', 'PENDING'].includes(d.status) },
  { id: 'UNDER_REVIEW', label: 'Under Review',  match: (d) => ['UNDER_REVIEW', 'ESCALATED'].includes(d.status) },
  { id: 'RESOLVED',     label: 'Closed',        match: (d) => ['RESOLVED', 'CLOSED'].includes(d.status) },
];

/* ─── Confirmation modal for arbitration ─────────────────────────── */
function ConfirmModal({ outcome, onConfirm, onCancel }) {
  const def = OUTCOMES.find(o => o.value === outcome);
  if (!def) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className={`rounded-xl border-2 p-4 flex items-center gap-3 ${def.color}`}>
          <def.icon size={22} className={def.iconCls} />
          <div>
            <p className="font-black text-base">{def.label}</p>
            <p className="text-sm font-medium mt-0.5 opacity-80">{def.sub}</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-700 text-center">
          Are you sure you want to record this final decision? <br />
          <strong>This cannot be undone.</strong>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 font-black text-sm rounded-xl ${def.selected}`}
          >
            Confirm Ruling
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ArbitratePanel ──────────────────────────────────────────────── */
function ArbitratePanel({ disputeId, onDone, themeClasses }) {
  const [outcome,       setOutcome]       = useState('');
  const [notes,         setNotes]         = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [err,           setErr]           = useState('');
  const [success,       setSuccess]       = useState('');
  const [showConfirm,   setShowConfirm]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outcome)      { setErr('Select an outcome.'); return; }
    if (!notes.trim()) { setErr('Admin notes are required.'); return; }
    setErr('');
    setShowConfirm(true);
  };

  const executeArbitration = async () => {
    setShowConfirm(false);
    try {
      setSubmitting(true); setErr(''); setSuccess('');
      await adminArbitrateDispute(disputeId, {
        outcome,
        notes,
        partialRefundAmount: outcome === 'PARTIAL_REFUND' && partialAmount ? Number(partialAmount) : undefined,
      });
      setSuccess('Arbitration decision recorded successfully.');
      setOutcome(''); setNotes(''); setPartialAmount('');
      onDone();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Arbitration failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          outcome={outcome}
          onConfirm={executeArbitration}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <form onSubmit={handleSubmit} className={`space-y-5 border rounded-2xl p-5 shadow-sm transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
        <div className={`flex items-center gap-2 border-b pb-3 transition-colors ${themeClasses.border.primary}`}>
          <Gavel size={16} className="text-emerald-600" />
          <h4 className={`text-xs font-black uppercase tracking-widest transition-colors ${themeClasses.text.primary}`}>
            Issue Arbitration Ruling
          </h4>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 text-xs font-bold rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-300">
            <CheckCircle size={14} /> {success}
          </div>
        )}
        {err && (
          <div className="flex items-center gap-2 p-3 text-xs font-bold rounded-xl border bg-red-50 text-red-700 border-red-300">
            <AlertTriangle size={14} /> {err}
          </div>
        )}

        {/* Outcome cards */}
        <div className="space-y-2">
          <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>
            Decision Outcome
          </p>
          <div className="grid gap-2">
            {OUTCOMES.map(opt => {
              const isSelected = outcome === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOutcome(opt.value)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    isSelected ? opt.selected : `border-gray-200 ${themeClasses.card} hover:border-gray-300`
                  }`}
                >
                  <opt.icon size={18} className={isSelected ? 'text-white' : opt.iconCls} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${isSelected ? 'text-white' : themeClasses.text.primary}`}>
                      {opt.label}
                    </p>
                    <p className={`text-[11px] font-medium ${isSelected ? 'text-white/80' : themeClasses.text.tertiary}`}>
                      {opt.sub}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center shrink-0">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Partial amount — only for PARTIAL_REFUND */}
        {outcome === 'PARTIAL_REFUND' && (
          <div>
            <label className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
              Partial Refund Amount
            </label>
            <input
              type="number" min="1" required
              placeholder="e.g. 500"
              value={partialAmount}
              onChange={e => setPartialAmount(e.target.value)}
              className={`w-full rounded-xl border p-3 text-sm font-medium transition-colors outline-none focus:border-amber-500 ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
            />
          </div>
        )}

        {/* Admin notes */}
        <div>
          <label className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
            Decision Notes (required)
          </label>
          <textarea
            required
            rows={3}
            placeholder="Explain your decision clearly. Both buyer and seller will see this note…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={`w-full rounded-xl border p-3 text-sm font-medium transition-colors outline-none focus:border-emerald-500 resize-none ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !outcome}
          className={`w-full py-3 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md disabled:opacity-50 transition-colors ${themeClasses.button.primary}`}
        >
          {submitting ? 'Recording decision…' : 'Review & Confirm Ruling'}
        </button>
      </form>
    </>
  );
}

/* ─── DisputeCard ─────────────────────────────────────────────────── */
function DisputeCard({ dispute, onRefreshed, themeClasses, isDark }) {
  const [open, setOpen] = useState(false);
  const badge = isDark
    ? (STATUS_BADGE_DARK[dispute.status] || STATUS_BADGE_DARK.CLOSED)
    : (STATUS_BADGE_LIGHT[dispute.status] || STATUS_BADGE_LIGHT.CLOSED);

  const isActive = ['OPEN', 'PENDING', 'UNDER_REVIEW', 'ESCALATED'].includes(dispute.status);

  return (
    <div className={`rounded-2xl border shadow-sm transition-all ${
      open ? 'border-emerald-400 shadow-md' : themeClasses.border.primary
    } ${themeClasses.card}`}>
      {/* Row header */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left rounded-2xl transition-colors hover:${themeClasses.bg.secondary}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isActive
            ? <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            : <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          }
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className={`font-black text-sm transition-colors ${themeClasses.text.primary}`}>
                {disputeRef(dispute)}
              </p>
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase ${badge}`}>
                {dispute.status}
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-2 py-0.5 text-[9px] font-black">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Needs ruling
                </span>
              )}
            </div>
            <p className={`text-xs font-medium mt-0.5 truncate transition-colors ${themeClasses.text.tertiary}`}>
              Order #{dispute.orderId} &bull; {dateLabel(dispute.createdAt)}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className={themeClasses.text.tertiary} /> : <ChevronDown size={16} className={themeClasses.text.tertiary} />}
      </button>

      {/* Detail */}
      {open && (
        <div className={`px-5 pb-6 border-t space-y-5 pt-5 transition-colors ${themeClasses.border.primary}`}>
          {/* Info block */}
          <div className={`grid grid-cols-2 gap-3 text-xs font-bold transition-colors ${themeClasses.text.secondary}`}>
            <div className="col-span-2">
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Reference</span>
              <span className={`font-mono transition-colors ${themeClasses.text.primary}`}>{disputeRef(dispute)}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Customer</span>
              <span>{dispute.customerId || 'N/A'}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Seller</span>
              <span>{dispute.sellerId || 'N/A'}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Opened</span>
              <span>{dateLabel(dispute.createdAt)}</span>
            </div>
            {dispute.resolvedAt && (
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Resolved</span>
                <span>{dateLabel(dispute.resolvedAt)}</span>
              </div>
            )}
            {dispute.refundAmount && (
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Refund Claim</span>
                <span>{money(dispute.refundAmount)}</span>
              </div>
            )}
            <div className={`col-span-2 rounded-xl border p-3 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Complaint / Reason</span>
              <p className={`text-[11px] font-medium leading-relaxed transition-colors ${themeClasses.text.secondary}`}>
                {dispute.reason || 'No complaint statement provided.'}
              </p>
            </div>
            {dispute.outcome && (
              <div className={`col-span-2 rounded-xl border p-3 transition-colors ${themeClasses.bg.success} ${themeClasses.border.success}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.success}`}>Final Outcome</span>
                <p className={`text-sm font-black transition-colors ${themeClasses.text.success}`}>
                  {dispute.outcome.replaceAll('_', ' ')}
                </p>
                {dispute.adminNotes && (
                  <p className={`text-[11px] font-medium mt-1 transition-colors ${themeClasses.text.success}`}>{dispute.adminNotes}</p>
                )}
              </div>
            )}
          </div>

          {/* Thread */}
          <DisputeThread
            disputeId={dispute.id}
            publicReferenceId={dispute.publicReferenceId}
            currentRole="ADMIN"
            onUpdate={onRefreshed}
          />

          {/* Arbitration panel — only when still active */}
          {isActive && (
            <ArbitratePanel
              disputeId={dispute.id}
              onDone={onRefreshed}
              themeClasses={themeClasses}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function AdminDisputes() {
  const { themeClasses, isDark } = useAdminTheme();
  const [disputes,   setDisputes]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [activeTab,  setActiveTab]  = useState('ALL');

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res  = await getAdminDisputes();
      const list = Array.isArray(res.data) ? res.data
                 : Array.isArray(res.data?.content) ? res.data.content : [];
      setDisputes(list);
    } catch (ex) { setError(ex.response?.data?.message || 'Failed to load disputes.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const tabCounts = SMART_TABS.reduce((acc, tab) => {
    acc[tab.id] = disputes.filter(tab.match).length;
    return acc;
  }, {});
  const filtered = disputes.filter(SMART_TABS.find(t => t.id === activeTab)?.match || (() => true));

  const counts = {
    open:     disputes.filter(d => ['OPEN','PENDING'].includes(d.status)).length,
    review:   disputes.filter(d => ['UNDER_REVIEW','ESCALATED'].includes(d.status)).length,
    resolved: disputes.filter(d => ['RESOLVED','CLOSED'].includes(d.status)).length,
  };

  return (
    <AdminLayout
      pageTitle="Dispute Arbitration"
      pageSubtitle="Review buyer–seller disputes, moderate messages, and issue binding arbitration decisions."
      headerActions={
        <button
          onClick={fetchDisputes}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black uppercase border transition-colors ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary} disabled:opacity-60`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div className={`mx-auto max-w-5xl space-y-6 p-4 lg:p-6 transition-colors ${themeClasses.bg.primary}`}>
        {error && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${themeClasses.bg.danger} ${themeClasses.border.danger} ${themeClasses.text.danger}`}>
            {error}
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Open Cases',  value: counts.open,     color: 'text-amber-600' },
            { label: 'In Review',   value: counts.review,   color: 'text-blue-600'  },
            { label: 'Resolved',    value: counts.resolved, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 shadow-sm transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
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
            <RefreshCw size={16} className="animate-spin" /> Loading disputes…
          </div>
        ) : filtered.length === 0 ? (
          <div className={`rounded-xl border border-dashed p-10 text-center transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
            <ShieldAlert size={28} className={`mx-auto mb-2 transition-colors ${themeClasses.text.tertiary}`} />
            <p className={`text-sm font-bold transition-colors ${themeClasses.text.tertiary}`}>
              No disputes in this category.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => (
              <DisputeCard
                key={d.id}
                dispute={d}
                onRefreshed={fetchDisputes}
                themeClasses={themeClasses}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
