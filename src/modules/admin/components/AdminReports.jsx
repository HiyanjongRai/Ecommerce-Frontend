import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import {
  getAdminReports,
  resolveProductReport,
  resolveSellerReport,
  resolveCustomerReport,
} from '../services/adminService';
import {
  RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, User, Package, Store,
} from 'lucide-react';

const STATUS_BADGE_LIGHT = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  REVIEWED:  'bg-blue-50 text-blue-700 border-blue-200',
  ACTIONED:  'bg-green-50 text-green-700 border-green-200',
  DISMISSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_BADGE_DARK = {
  PENDING:   'bg-amber-900/30 text-amber-400 border-amber-800',
  REVIEWED:  'bg-blue-900/30 text-blue-400 border-blue-800',
  ACTIONED:  'bg-green-900/30 text-green-400 border-green-800',
  DISMISSED: 'bg-gray-700 text-gray-400 border-gray-600',
};

const REPORT_TYPES = ['PRODUCT', 'SELLER', 'CUSTOMER'];

const typeIcon = (t) => {
  if (t === 'PRODUCT')  return <Package  size={14} className="text-emerald-500" />;
  if (t === 'SELLER')   return <Store    size={14} className="text-violet-500" />;
  return                       <User     size={14} className="text-rose-500"   />;
};

const resolverFor = (type) => {
  if (type === 'PRODUCT')  return resolveProductReport;
  if (type === 'SELLER')   return resolveSellerReport;
  return                          resolveCustomerReport;
};

const publicRef = (record, fallbackPrefix) => record.publicReferenceId || `${fallbackPrefix}-${record.id}`;

/* ─── ReportCard ──────────────────────────────────────────────────── */
function ReportCard({ report, type, onResolved, themeClasses }) {
  const [open,        setOpen]        = useState(false);
  const [action,      setAction]      = useState('');
  const [adminNote,   setAdminNote]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [err,         setErr]         = useState('');
  const STATUS_BADGE = themeClasses.darkMode ? STATUS_BADGE_DARK : STATUS_BADGE_LIGHT;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action) { setErr('Choose an action first.'); return; }
    try {
      setSubmitting(true); setErr('');
      await resolverFor(type)(report.id, { action, adminNote });
      onResolved();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`rounded-lg border shadow-sm transition-all ${open ? 'border-emerald-300 dark:border-emerald-600' : themeClasses.border.primary} ${themeClasses.card}`}>
      {/* Row */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:${themeClasses.bg.secondary}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {typeIcon(type)}
          <div className="min-w-0">
            <p className={`font-black text-sm truncate transition-colors ${themeClasses.text.primary}`}>
              {publicRef(report, `${type}-RPT`)}
              <span className={`ml-2 font-semibold text-xs transition-colors ${themeClasses.text.secondary}`}>
                — {type} {report.targetId ? `#${report.targetId}` : ''}
              </span>
            </p>
            <p className={`text-xs font-semibold truncate mt-0.5 transition-colors ${themeClasses.text.secondary}`}>
              {report.reason?.slice(0, 80)}{report.reason?.length > 80 ? '…' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wide transition-colors ${STATUS_BADGE[report.status] || STATUS_BADGE.PENDING}`}>
            {report.status || 'PENDING'}
          </span>
          {open ? <ChevronUp size={14} className={`transition-colors ${themeClasses.text.tertiary}`} /> : <ChevronDown size={14} className={`transition-colors ${themeClasses.text.tertiary}`} />}
        </div>
      </button>

      {/* Detail panel */}
      {open && (
        <div className={`px-5 pb-5 border-t space-y-4 pt-4 transition-colors ${themeClasses.border.primary}`}>
          {/* Meta grid */}
          <div className={`grid grid-cols-2 gap-3 text-xs font-bold transition-colors ${themeClasses.text.primary}`}>
            <div className="col-span-2">
              <span className={`text-[9px] font-black uppercase tracking-widest block transition-colors ${themeClasses.text.tertiary}`}>Public Reference</span>
              <span className={`font-mono transition-colors ${themeClasses.text.primary}`}>{publicRef(report, `${type}-RPT`)}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block transition-colors ${themeClasses.text.tertiary}`}>Reporter ID</span>
              <span>{report.reporterId ?? 'N/A'}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block transition-colors ${themeClasses.text.tertiary}`}>Submitted</span>
              <span>{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className={`col-span-2 p-3 rounded-lg border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Full Reason Statement</span>
              <p className={`font-medium text-[11px] leading-relaxed whitespace-pre-wrap transition-colors ${themeClasses.text.primary}`}>
                {report.reason || 'No description provided.'}
              </p>
            </div>
            {report.additionalDetails && (
              <div className={`col-span-2 p-3 rounded-lg border transition-colors ${themeClasses.bg.info} ${themeClasses.border.primary}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.info}`}>Additional Details</span>
                <p className={`font-medium text-[11px] leading-relaxed transition-colors ${themeClasses.text.info}`}>{report.additionalDetails}</p>
              </div>
            )}
            {report.adminNote && (
              <div className={`col-span-2 p-3 rounded-lg border transition-colors ${themeClasses.bg.success} ${themeClasses.border.primary}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.success}`}>Previous Admin Note</span>
                <p className={`font-medium text-[11px] leading-relaxed transition-colors ${themeClasses.text.success}`}>{report.adminNote}</p>
              </div>
            )}
          </div>

          {/* Moderation form */}
          {report.status !== 'ACTIONED' && report.status !== 'DISMISSED' && (
            <form onSubmit={handleSubmit} className={`space-y-3 border-t border-dashed pt-4 transition-colors ${themeClasses.border.primary}`}>
              <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>Take Moderation Action</h4>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {['REVIEWED', 'ACTIONED', 'DISMISSED',
                  type === 'PRODUCT' ? 'PRODUCT_TAKEDOWN' :
                  type === 'SELLER'  ? 'SELLER_PENALTY'  : 'CUSTOMER_FLAG'
                ].map(act => (
                  <button
                    type="button"
                    key={act}
                    onClick={() => setAction(act)}
                    className={`px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all ${
                      action === act
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : themeClasses.button.secondary
                    }`}
                  >
                    {act.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Internal admin note (visible to admins only)…"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                className={`w-full rounded-lg p-3 text-xs font-semibold outline-none h-16 focus:border-emerald-500 resize-none border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
              />

              {err && <p className={`text-[10px] font-bold transition-colors ${themeClasses.text.danger}`}>{err}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-md disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Apply Action'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function AdminReports() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [activeType,   setActiveType]   = useState('PRODUCT');
  const [statusFilter, setStatusFilter] = useState('');
  const [reports,      setReports]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await getAdminReports(activeType, statusFilter);
      const list = Array.isArray(res.data) ? res.data
                 : Array.isArray(res.data?.content) ? res.data.content
                 : [];
      setReports(list);
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [activeType, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const statCounts = {
    PENDING:   reports.filter(r => !r.status || r.status === 'PENDING').length,
    ACTIONED:  reports.filter(r => r.status === 'ACTIONED').length,
    DISMISSED: reports.filter(r => r.status === 'DISMISSED').length,
  };

  return (
    <AdminLayout
      pageTitle="Reports Moderation"
      pageSubtitle="Review flagged content from customers, manage product takedowns, seller penalties, and customer flags."
      headerActions={
        <button
          onClick={fetchReports}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black uppercase transition-colors ${themeClasses.button.outline} disabled:opacity-60`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div className={`mx-auto max-w-6xl space-y-6 p-4 lg:p-6 transition-colors ${themeClasses.bg.secondary}`}>
        {error && (
          <div className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${themeClasses.status.danger}`}>
            {error}
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending',   value: statCounts.PENDING,   icon: Clock,        status: 'warning' },
            { label: 'Actioned',  value: statCounts.ACTIONED,  icon: CheckCircle,  status: 'success' },
            { label: 'Dismissed', value: statCounts.DISMISSED, icon: XCircle,      status: 'pending' },
          ].map(({ label, value, icon: Icon, status }) => (
            <div key={label} className={`rounded-lg border p-4 shadow-sm flex items-center gap-3 transition-colors ${themeClasses.card} ${themeClasses.status[status]}`}>
              <Icon size={20} className="text-emerald-500" />
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>{label}</p>
                <p className={`text-xl font-black mt-0.5 transition-colors ${themeClasses.text.primary}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className={`flex flex-wrap items-center gap-3 border rounded-lg p-3 shadow-sm transition-colors ${themeClasses.card}`}>
          {/* Type tabs */}
          <div className="flex gap-1">
            {REPORT_TYPES.map(t => (
              <button
                key={t}
                onClick={() => { setActiveType(t); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeType === t
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : `${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`
                }`}
              >
                {typeIcon(t)}
                <span>{t}</span>
              </button>
            ))}
          </div>

          <div className={`h-5 w-px transition-colors ${themeClasses.border.primary}`} />

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTIONED">Actioned</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>

        {/* Report list */}
        {loading ? (
          <div className={`flex items-center gap-2 py-10 justify-center text-sm transition-colors ${themeClasses.text.secondary}`}>
            <RefreshCw size={16} className="animate-spin" /> Loading reports…
          </div>
        ) : reports.length === 0 ? (
          <div className={`rounded-lg border border-dashed p-10 text-center transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
            <AlertTriangle size={28} className={`mx-auto mb-2 transition-colors ${themeClasses.text.tertiary}`} />
            <p className={`text-sm font-bold transition-colors ${themeClasses.text.secondary}`}>No {activeType.toLowerCase()} reports found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <ReportCard key={r.id} report={r} type={activeType} onResolved={fetchReports} themeClasses={themeClasses} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
