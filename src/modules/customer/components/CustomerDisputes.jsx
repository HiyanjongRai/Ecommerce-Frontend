import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getCustomerDisputes } from '../../../shared/api/customerApi';
import { useCustomer } from '../contexts/CustomerContext';
import DisputeThread from '../../dispute/components/DisputeThread';
import {
  AlertTriangle, ArrowLeft, CheckCircle, Clock,
  Gavel, RefreshCw, Scale, Shield, ShieldAlert,
} from 'lucide-react';

/* ─── Status metadata ────────────────────────────────────────────── */
const STATUS_META = {
  OPEN:         { icon: Clock,         label: 'Open',         badge: 'bg-amber-100 text-amber-800 border-amber-300',    accent: 'text-amber-700' },
  PENDING:      { icon: Clock,         label: 'Pending',      badge: 'bg-amber-100 text-amber-800 border-amber-300',    accent: 'text-amber-700' },
  UNDER_REVIEW: { icon: Scale,         label: 'Under Review', badge: 'bg-blue-100 text-blue-800 border-blue-300',       accent: 'text-blue-700'  },
  ESCALATED:    { icon: AlertTriangle, label: 'Escalated',    badge: 'bg-red-100 text-red-800 border-red-300',          accent: 'text-red-700'   },
  RESOLVED:     { icon: CheckCircle,   label: 'Resolved',     badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', accent: 'text-emerald-700' },
  CLOSED:       { icon: CheckCircle,   label: 'Closed',       badge: 'bg-gray-100 text-gray-800 border-gray-300',       accent: 'text-gray-600'  },
};
const getStatusMeta = (s) => STATUS_META[s] || STATUS_META.PENDING;

/* ─── Dispute progress steps ─────────────────────────────────────── */
const DISPUTE_STEPS = [
  { key: 'opened',   label: 'Opened',   statuses: ['OPEN', 'PENDING'] },
  { key: 'review',   label: 'Review',   statuses: ['UNDER_REVIEW', 'ESCALATED'] },
  { key: 'resolved', label: 'Resolved', statuses: ['RESOLVED', 'CLOSED'] },
];

function DisputeStepper({ status }) {
  const activeIdx = DISPUTE_STEPS.findIndex(s => s.statuses.includes(status));
  return (
    <div className="flex items-center w-full">
      {DISPUTE_STEPS.map((step, i) => {
        const done    = i < activeIdx;
        const current = i === activeIdx;
        const last    = i === DISPUTE_STEPS.length - 1;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done    ? 'border-emerald-500 bg-emerald-500'
                : current ? 'border-blue-500 bg-blue-500 shadow-md shadow-blue-200'
                : 'border-gray-200 bg-gray-50'
              }`}>
                {done    ? <CheckCircle size={14} className="text-white" />
                : current ? <div className="w-2.5 h-2.5 bg-white rounded-full" />
                : <div className="w-2 h-2 bg-gray-300 rounded-full" />}
              </div>
              <span className={`text-[10px] font-bold whitespace-nowrap ${
                done ? 'text-emerald-600' : current ? 'text-blue-600' : 'text-gray-400'
              }`}>{step.label}</span>
            </div>
            {!last && (
              <div className={`flex-1 h-0.5 mb-5 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── SLA label for open disputes ────────────────────────────────── */
function SLALabel({ createdAt, status }) {
  if (!['OPEN', 'PENDING'].includes(status) || !createdAt) return null;
  const hrs  = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000);
  const left = Math.max(0, 48 - hrs);
  if (left === 0) return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
      <AlertTriangle size={10} /> Seller overdue
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
      <Clock size={10} /> Seller has ~{left}h to respond
    </span>
  );
}

const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

/* ─── Main component ─────────────────────────────────────────────── */
export default function CustomerDisputes() {
  const { user } = useCustomer();
  const [disputes,          setDisputes]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [expandedDisputeId, setExpandedDisputeId] = useState(null);

  const fetchDisputes = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res  = await getCustomerDisputes(user.id);
      setDisputes(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const stats = useMemo(() => ({
    open:     disputes.filter(d => ['OPEN','PENDING'].includes(d.status)).length,
    review:   disputes.filter(d => ['UNDER_REVIEW','ESCALATED'].includes(d.status)).length,
    resolved: disputes.filter(d => ['RESOLVED','CLOSED'].includes(d.status)).length,
  }), [disputes]);

  if (loading) return (
    <div className="max-w-5xl mx-auto py-24 text-center">
      <div className="w-10 h-10 border-2 border-t-red-500 border-gray-200 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Loading disputes…</p>
    </div>
  );

  /* ── List view ── */
  if (!expandedDisputeId) return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert size={18} className="text-red-700" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">My Disputes</h2>
            <p className="text-xs text-gray-500 font-medium">{disputes.length} case{disputes.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <button
          onClick={fetchDisputes}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Open Cases', value: stats.open,     icon: Clock,        bg: 'bg-amber-50',   border: 'border-amber-200',   num: 'text-amber-700'   },
          { label: 'In Review',  value: stats.review,   icon: Scale,        bg: 'bg-blue-50',    border: 'border-blue-200',    num: 'text-blue-700'    },
          { label: 'Resolved',   value: stats.resolved, icon: CheckCircle,  bg: 'bg-emerald-50', border: 'border-emerald-200', num: 'text-emerald-700' },
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
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Case History</h3>
        </div>

        {disputes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShieldAlert size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-600 text-sm">No disputes yet</p>
            <p className="text-xs text-gray-400 mt-1">Escalated order issues will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {disputes.map((dispute) => {
              const meta    = getStatusMeta(dispute.status);
              const Icon    = meta.icon;
              const needsAct = ['OPEN', 'PENDING'].includes(dispute.status);
              return (
                <button
                  key={dispute.id}
                  onClick={() => setExpandedDisputeId(dispute.id)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                        <p className="font-bold text-gray-900 text-sm font-mono">
                          {dispute.publicReferenceId || `Dispute #${dispute.id}`}
                        </p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Order #{dispute.orderId} &bull; {dateLabel(dispute.createdAt)}
                      </p>
                      {needsAct && <div className="mt-1"><SLALabel createdAt={dispute.createdAt} status={dispute.status} /></div>}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  /* ── Detail view ── */
  const dispute = disputes.find(d => d.id === expandedDisputeId);
  if (!dispute) return null;
  const meta = getStatusMeta(dispute.status);
  const Icon = meta.icon;

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-in fade-in duration-200">
      {/* Back bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setExpandedDisputeId(null)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={16} />
          Back to disputes
        </button>
      </div>

      {/* Status banner for open cases */}
      {['OPEN', 'PENDING'].includes(dispute.status) && (
        <div className="mb-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900 text-sm">Awaiting seller response</p>
            <p className="text-sm text-gray-700 mt-0.5">
              The seller has up to 48 hours to respond. You can communicate in the thread below.
            </p>
            <div className="mt-2">
              <SLALabel createdAt={dispute.createdAt} status={dispute.status} />
            </div>
          </div>
        </div>
      )}
      {['RESOLVED', 'CLOSED'].includes(dispute.status) && (
        <div className="mb-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 flex items-start gap-3">
          <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900 text-sm">Dispute resolved</p>
            <p className="text-sm text-gray-700 mt-0.5">This case has been closed by the admin.</p>
          </div>
        </div>
      )}

      {/* Dispute info card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.badge.split(' ').slice(0,2).join(' ')}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-mono text-xs text-gray-400 mb-0.5">
                  {dispute.publicReferenceId || `Dispute #${dispute.id}`}
                </p>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Order</p>
              <p className="font-black text-gray-900">#{dispute.orderId}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Progress</p>
          <DisputeStepper status={dispute.status} />
        </div>

        {/* Meta grid */}
        <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Opened</p>
            <p className="font-semibold text-gray-800 text-sm">{dateLabel(dispute.createdAt)}</p>
          </div>
          {dispute.resolvedAt && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Resolved</p>
              <p className="font-semibold text-gray-800 text-sm">{dateLabel(dispute.resolvedAt)}</p>
            </div>
          )}
        </div>

        {/* Complaint */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Your Complaint</p>
          <p className="text-sm font-medium text-gray-800 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
            {dispute.reason || 'No complaint statement provided.'}
          </p>
          {dispute.adminNotes && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gavel size={14} className="text-blue-700" />
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Admin Decision</p>
              </div>
              <p className="text-sm font-medium text-blue-900">{dispute.adminNotes}</p>
              {dispute.outcome && (
                <p className="mt-2 font-black text-xs text-blue-800 uppercase tracking-wider">
                  Outcome: {dispute.outcome.replaceAll('_', ' ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dispute Thread */}
      <DisputeThread
        disputeId={dispute.id}
        publicReferenceId={dispute.publicReferenceId}
        currentRole="BUYER"
        onUpdate={fetchDisputes}
      />
    </div>
  );
}
