import React, { useState, useEffect } from 'react';
import { getSellerProfile, getSellerDisputeList, submitDisputeEvidence } from '../services/sellerService';
import DisputeThread from '../../dispute/components/DisputeThread';
import {
  EmptyState, LoadingState, SectionHeader,
} from './SellerSectionUtils';
import {
  AlertCircle, AlertTriangle, ArrowRight, CheckCircle, Clock,
  FileText, RefreshCw, Scale, Shield, ShieldAlert,
} from 'lucide-react';

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS_CONFIG = {
  OPEN:         { label: 'Open',         badge: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock },
  PENDING:      { label: 'Open',         badge: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-blue-50 text-blue-700 border-blue-200',       icon: Scale },
  ESCALATED:    { label: 'Escalated',    badge: 'bg-red-50 text-red-700 border-red-200',          icon: AlertTriangle },
  RESOLVED:     { label: 'Resolved',     badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  CLOSED:       { label: 'Closed',       badge: 'bg-gray-100 text-gray-600 border-gray-200',      icon: CheckCircle },
};
const getConfig = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.PENDING;

/* ─── SLA label — 48h seller response window ─────────────────────── */
function SLABadge({ createdAt, status }) {
  if (!['OPEN', 'PENDING'].includes(status) || !createdAt) return null;
  const hrs  = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000);
  const left = Math.max(0, 48 - hrs);
  if (left === 0) return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 rounded-full px-2 py-0.5 text-[9px] font-black">
      <AlertTriangle size={9} /> Overdue — respond now!
    </span>
  );
  if (left <= 12) return (
    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-2 py-0.5 text-[9px] font-black">
      <Clock size={9} /> {left}h remaining
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 border border-sky-300 rounded-full px-2 py-0.5 text-[9px] font-black">
      <Clock size={9} /> Respond within {left}h
    </span>
  );
}

const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/* ─── Tabs ───────────────────────────────────────────────────────── */
const TABS = [
  { id: 'ALL',         label: 'All' },
  { id: 'PENDING',     label: 'Open' },
  { id: 'UNDER_REVIEW',label: 'Review' },
  { id: 'RESOLVED',    label: 'Closed' },
];
const tabMatch = (tab, d) => {
  if (tab === 'ALL')          return true;
  if (tab === 'PENDING')      return ['PENDING', 'OPEN'].includes(d.status);
  if (tab === 'UNDER_REVIEW') return ['UNDER_REVIEW', 'ESCALATED'].includes(d.status);
  if (tab === 'RESOLVED')     return ['RESOLVED', 'CLOSED'].includes(d.status);
  return true;
};

/* ─── Main component ─────────────────────────────────────────────── */
export default function SellerDisputes() {
  const [disputes,          setDisputes]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [sellerId,          setSellerId]          = useState(null);
  const [error,             setError]             = useState('');
  const [activeTab,         setActiveTab]         = useState('ALL');
  const [activeDisputeId,   setActiveDisputeId]   = useState(null);
  const [selectedDispute,   setSelectedDispute]   = useState(null);
  const [evidenceText,      setEvidenceText]      = useState('');
  const [attachmentUrl,     setAttachmentUrl]     = useState('');
  const [submittingEvidence,setSubmittingEvidence]= useState(false);
  const [evidenceSuccess,   setEvidenceSuccess]   = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true); setError('');
      const profileRes = await getSellerProfile();
      const sId = profileRes.data?.userId || profileRes.data?.id;
      setSellerId(sId);
      if (sId) {
        const res  = await getSellerDisputeList(sId);
        const list = res.data || [];
        setDisputes(list);
        if (activeDisputeId) {
          const updated = list.find(d => d.id === activeDisputeId);
          if (updated) setSelectedDispute(updated);
        }
      } else {
        setError('No merchant profile found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load disputes.');
    } finally { setLoading(false); }
  };

  const handleSelectDispute = (dispute) => {
    setActiveDisputeId(dispute.id);
    setSelectedDispute(dispute);
    setEvidenceText(''); setAttachmentUrl(''); setEvidenceSuccess(''); setError('');
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceText.trim()) { setError('Please enter your evidence statement before submitting.'); return; }
    try {
      setSubmittingEvidence(true); setError(''); setEvidenceSuccess('');
      await submitDisputeEvidence(activeDisputeId, { message: evidenceText, attachmentUrl });
      setEvidenceSuccess('Your evidence statement has been formally recorded on this dispute.');
      setEvidenceText(''); setAttachmentUrl('');
      if (sellerId) {
        const res = await getSellerDisputeList(sellerId);
        const list = res.data || [];
        setDisputes(list);
        const updated = list.find(d => d.id === activeDisputeId);
        if (updated) setSelectedDispute(updated);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit evidence.');
    } finally { setSubmittingEvidence(false); }
  };

  const filtered = disputes.filter(d => tabMatch(activeTab, d));
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.id] = tab.id === 'ALL' ? disputes.length : disputes.filter(d => tabMatch(tab.id, d)).length;
    return acc;
  }, {});

  if (loading) return <LoadingState label="Loading disputes…" />;

  return (
    <div className="space-y-4 max-w-[1400px] font-sans">
      <SectionHeader
        title="Disputes Desk"
        subtitle="Review claims escalated by customers, submit formal statements, and communicate with moderators."
        action={
          <button
            onClick={loadAll}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 rounded-lg border border-gray-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-sm flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

        {/* ── Left: Dispute list ── */}
        <div className="space-y-3">
          {/* Tabs with counts */}
          <div className="bg-white border border-gray-200 rounded-sm p-1.5 flex gap-1 shadow-sm overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 flex-1 justify-center px-2.5 py-1 rounded-sm text-[9px] font-black transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.label}
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tabCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          {/* List — no fixed max-height, natural scroll inside column */}
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {filtered.length === 0 ? (
              <div className="text-center py-10 bg-white border border-gray-200 rounded-sm">
                <ShieldAlert size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-400 text-xs font-semibold">No disputes in this category.</p>
              </div>
            ) : (
              filtered.map(d => {
                const cfg    = getConfig(d.status);
                const isOpen = ['OPEN', 'PENDING'].includes(d.status);
                const active = activeDisputeId === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDispute(d)}
                    className={`w-full text-left p-3.5 rounded-sm border transition-all ${
                      active
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-gray-800 truncate">
                            {d.publicReferenceId || `DSP-${d.id}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-semibold">Order #{d.orderId}</p>
                        <p className="text-[10px] text-gray-400">{dateLabel(d.createdAt)}</p>
                        {isOpen && <SLABadge createdAt={d.createdAt} status={d.status} />}
                      </div>
                      <ArrowRight size={14} className={active ? 'text-blue-500' : 'text-gray-300'} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Dispute detail ── */}
        <div>
          {selectedDispute ? (
            <div className="space-y-5">
              {/* Metadata card */}
              <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Shield size={15} className="text-blue-600" />
                    <h3 className="font-black text-xs text-gray-800 uppercase tracking-wider">Dispute Details</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getConfig(selectedDispute.status).badge}`}>
                    {getConfig(selectedDispute.status).label}
                  </span>
                </div>

                {/* SLA banner for open disputes */}
                {['OPEN', 'PENDING'].includes(selectedDispute.status) && (
                  <div className="rounded-sm border-2 border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 text-sm">Response required</p>
                      <p className="text-xs text-amber-800 mt-0.5">You must respond within 48 hours. Use the discussion thread below.</p>
                      <div className="mt-1.5">
                        <SLABadge createdAt={selectedDispute.createdAt} status={selectedDispute.status} />
                      </div>
                    </div>
                  </div>
                )}

                {['RESOLVED', 'CLOSED'].includes(selectedDispute.status) && (
                  <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2.5">
                    <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-900">This dispute has been resolved by admin.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
                  <div className="col-span-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Reference ID</span>
                    <span className="font-mono font-bold text-gray-800">{selectedDispute.publicReferenceId || `DSP-${selectedDispute.id}`}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Customer</span>
                    <span className="font-semibold text-gray-800">{selectedDispute.customerName || 'Anonymous'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Order</span>
                    <span className="font-semibold text-gray-800">#{selectedDispute.orderId}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Opened</span>
                    <span className="font-semibold text-gray-800">{dateLabel(selectedDispute.createdAt)}</span>
                  </div>
                  {selectedDispute.resolvedAt && (
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Resolved</span>
                      <span className="font-semibold text-gray-800">{dateLabel(selectedDispute.resolvedAt)}</span>
                    </div>
                  )}
                  <div className="col-span-2 bg-gray-50 rounded-sm border border-gray-100 p-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Customer Complaint</span>
                    <p className="font-medium text-[12px] text-gray-800 leading-relaxed">
                      {selectedDispute.reason || 'No complaint statement provided.'}
                    </p>
                  </div>
                  {selectedDispute.adminNotes && (
                    <div className="col-span-2 bg-blue-50 rounded-sm border border-blue-200 p-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 block mb-1.5">Admin Decision</span>
                      <p className="font-medium text-[12px] text-blue-900 leading-relaxed">{selectedDispute.adminNotes}</p>
                      {selectedDispute.outcome && (
                        <p className="mt-1.5 font-black text-[10px] text-blue-700 uppercase tracking-wider">
                          Outcome: {selectedDispute.outcome.replaceAll('_', ' ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dispute thread */}
              <DisputeThread
                disputeId={selectedDispute.id}
                publicReferenceId={selectedDispute.publicReferenceId}
                currentRole="SELLER"
                onUpdate={loadAll}
              />

              {/* Formal evidence submission */}
              {!['RESOLVED', 'CLOSED'].includes(selectedDispute.status) && (
                <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <FileText size={15} className="text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">Submit Formal Evidence</h4>
                  </div>

                  {evidenceSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-sm flex items-center gap-2">
                      <CheckCircle size={14} />
                      {evidenceSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSubmitEvidence} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Your Statement / Defense
                      </label>
                      <textarea
                        required
                        placeholder="Write your formal statement, explanation, or proof arguments here. Be specific and factual…"
                        value={evidenceText}
                        onChange={e => setEvidenceText(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-sm p-2.5 text-[11px] font-medium text-gray-700 outline-none h-24 focus:border-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Supporting File URL (optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/delivery-proof.jpg"
                        value={attachmentUrl}
                        onChange={e => setAttachmentUrl(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-sm p-2 text-[11px] font-medium text-gray-700 outline-none focus:border-gray-400"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingEvidence}
                        className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-wider rounded-sm disabled:opacity-50 transition-colors"
                      >
                        {submittingEvidence ? 'Submitting…' : 'Submit Formal Evidence'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[380px] bg-white border border-gray-200 rounded-sm flex flex-col justify-center items-center text-center p-6 shadow-sm">
              <div className="w-12 h-12 bg-gray-50 rounded-sm flex items-center justify-center mb-3">
                <ShieldAlert size={24} className="text-gray-300" />
              </div>
              <h3 className="text-xs font-black text-gray-600 uppercase tracking-wider">Select a Dispute</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1.5 max-w-[240px] leading-relaxed">
                Choose a case from the left to view messages, submit evidence, and respond.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
