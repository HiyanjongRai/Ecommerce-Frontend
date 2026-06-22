import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Mail, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, X, Info
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminCommissions, sendCommissionReminder } from '../services/adminService';
import { useAdminTheme } from '../hooks/useAdminTheme';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || '').replaceAll('_', ' ');
const dateStr = v => v ? new Date(v).toLocaleDateString() : 'N/A';
const isPast  = v => v && new Date(v).getTime() < Date.now();

/* ─── Status badge ───────────────────────────────────────────── */
const StatusBadge = ({ status, themeClasses }) => {
  const statusMap = {
    PAID:    themeClasses.status.success,
    PENDING: themeClasses.status.warning,
    OVERDUE: themeClasses.status.danger,
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusMap[status] || themeClasses.status.pending}`}>
      {nice(status)}
    </span>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color, themeClasses }) => (
  <div className={`rounded-2xl border p-5 shadow-sm flex items-center gap-4 transition-colors ${themeClasses.card} ${color}`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${color.replace('border-', 'bg-').replace('/30', '/20')}`}>
      <Icon size={20} className={`opacity-80 transition-colors ${themeClasses.text.primary}`} />
    </div>
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{label}</p>
      <p className={`text-lg font-black mt-0.5 transition-colors ${themeClasses.text.primary}`}>{value}</p>
    </div>
  </div>
);

/* ─── VAT Tooltip ────────────────────────────────────────────── */
const VatTooltip = ({ row, themeClasses }) => {
  const [show, setShow] = useState(false);
  const inputVat   = (row.saleAmount || 0) * 0.13;
  const outputVat  = (row.commissionEarned || 0) * 0.13;
  const vatPayable = inputVat - outputVat;
  const grossProfit = (row.commissionEarned || 0) - (row.fineAmount || 0);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={`p-1 rounded-md transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.text.accent} hover:${themeClasses.bg.success}`}
      >
        <Info size={13} />
      </button>
      {show && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 rounded-xl p-3 w-56 shadow-2xl pointer-events-none border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
          <p className={`font-black text-xs mb-2 ${themeClasses.text.accent}`}>Financial Breakdown</p>
          <div className="space-y-1 text-[11px] font-bold">
            <div className="flex justify-between"><span className={themeClasses.text.tertiary}>Input VAT (13%):</span><span>{money(inputVat)}</span></div>
            <div className="flex justify-between"><span className={themeClasses.text.tertiary}>Output VAT (13%):</span><span>{money(outputVat)}</span></div>
            <div className={`flex justify-between border-t pt-1 transition-colors ${themeClasses.border.primary}`}><span className={themeClasses.text.tertiary}>VAT Payable:</span><span className={themeClasses.text.warning}>{money(vatPayable)}</span></div>
            <div className={`flex justify-between border-t pt-1 transition-colors ${themeClasses.border.primary}`}><span className={themeClasses.text.tertiary}>Gross Profit:</span><span className={themeClasses.text.success}>{money(grossProfit)}</span></div>
            <div className="flex justify-between"><span className={themeClasses.text.tertiary}>Net to Seller:</span><span className={themeClasses.text.success}>{money(row.netAmount)}</span></div>
            {row.platformSponsoredDiscount > 0 && (
              <div className={`flex justify-between border-t pt-1 transition-colors ${themeClasses.border.primary}`}><span className={themeClasses.text.tertiary}>Platform Discount:</span><span className={themeClasses.text.danger}>-{money(row.platformSponsoredDiscount)}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminCommissions() {
  const { themeClasses } = useAdminTheme();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState('');
  const [working, setWorking]         = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sentReminders, setSentReminders] = useState(new Set());

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3200); };

  /* ── Load ──────────────────────────────────────────────────── */
  const loadCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCommissions();
      const data = Array.isArray(res.data) ? res.data : [];
      setCommissions(data);
    } catch {
      showToast('❌ Failed to load commission data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCommissions(); }, [loadCommissions]);

  /* ── Send Reminder ─────────────────────────────────────────── */
  const handleRemind = async (orderId) => {
    setWorking(orderId);
    try {
      await sendCommissionReminder(orderId);
      setSentReminders(prev => new Set([...prev, orderId]));
      showToast('✅ Reminder sent to seller');
    } catch {
      showToast('❌ Failed to send reminder');
    } finally {
      setWorking(null);
    }
  };

  /* ── Aggregates ─────────────────────────────────────────────── */
  const total    = commissions.reduce((s, r) => s + (r.commissionEarned || 0), 0);
  const paid     = commissions.filter(r => r.status === 'PAID').reduce((s, r) => s + (r.commissionEarned || 0), 0);
  const unpaid   = commissions.filter(r => r.status === 'PENDING').reduce((s, r) => s + (r.commissionEarned || 0), 0);
  const overdue  = commissions.filter(r => r.status === 'OVERDUE').reduce((s, r) => s + (r.commissionEarned || 0), 0);

  const filtered = commissions.filter(r => statusFilter === 'ALL' || r.status === statusFilter);

  return (
    <AdminLayout
      pageTitle="Commission Management"
      pageSubtitle={`${commissions.length} commission records loaded`}
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-50 backdrop-blur-md text-sm font-bold px-4 py-3 rounded-xl shadow-xl transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <div className="px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Earned"   value={money(total)}   icon={TrendingUp}    color="border-emerald-200/30 text-emerald-700" themeClasses={themeClasses} />
        <StatCard label="Total Paid"     value={money(paid)}    icon={CheckCircle}   color="border-emerald-200/30 text-emerald-700" themeClasses={themeClasses} />
        <StatCard label="Total Unpaid"   value={money(unpaid)}  icon={Clock}         color="border-amber-200/30 text-amber-700" themeClasses={themeClasses} />
        <StatCard label="Total Overdue"  value={money(overdue)} icon={AlertCircle}   color="border-red-200/30 text-red-700" themeClasses={themeClasses} />
      </div>

      {/* ── Filter + Refresh ───────────────────────────────────── */}
      <div className={`px-6 pb-4 border-b transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-2">
          <label className={`text-xs font-bold uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Filter:</label>
          {['ALL', 'PENDING', 'PAID', 'OVERDUE'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                statusFilter === s
                  ? `${themeClasses.button.primary}`
                  : `${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`
              }`}
            >
              {nice(s) || 'All'}
            </button>
          ))}
        </div>
        <button
          onClick={loadCommissions}
          className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-xs font-bold transition-colors ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="p-6">
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Order ID', 'Product', 'Seller', 'Sale Amount', 'Rate', 'Commission', 'Fine', 'Net to Seller', 'Status', 'Due Date', 'Reminded', 'Actions'].map(h => (
                    <th key={h} className={`px-3 py-3 text-left text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(12).fill(0).map((_, j) => (
                        <td key={j} className="px-3 py-4"><div className={`h-3.5 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className={`text-center py-14 font-medium transition-colors ${themeClasses.text.tertiary}`}>
                      <DollarSign size={28} className={`mx-auto mb-2 transition-colors ${themeClasses.bg.tertiary}`} />
                      No commission records found.
                    </td>
                  </tr>
                ) : filtered.map(r => {
                  const orderId = r.orderId || r.customOrderId;
                  const isOverdue = r.status === 'OVERDUE' || (r.status === 'PENDING' && isPast(r.dueDate));
                  const reminded = sentReminders.has(orderId) || r.reminderSent;
                  return (
                    <tr key={orderId} className={`border-b transition-colors ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`}>
                      {/* Order ID */}
                      <td className={`px-3 py-3 font-mono font-bold text-xs whitespace-nowrap transition-colors text-emerald-600`}>
                        <div>#{r.customOrderId || orderId}</div>
                        {r.transactionId && (
                          <div className={`text-[10px] font-normal mt-0.5 tracking-tighter transition-colors ${themeClasses.text.tertiary}`}>
                            TXN: {r.transactionId}
                          </div>
                        )}
                      </td>
                      {/* Product */}
                      <td className={`px-3 py-3 max-w-[140px] transition-colors ${themeClasses.text.secondary}`}>
                        <p className={`font-semibold text-xs truncate transition-colors ${themeClasses.text.primary}`} title={r.productName}>{r.productName || '—'}</p>
                      </td>
                      {/* Seller */}
                      <td className="px-3 py-3">
                        <p className={`font-semibold text-xs transition-colors ${themeClasses.text.primary}`}>{r.sellerStoreName || '—'}</p>
                        <p className={`text-[10px] transition-colors ${themeClasses.text.tertiary}`}>{r.sellerEmail || ''}</p>
                        {r.sellerPhone && <p className={`text-[10px] transition-colors ${themeClasses.text.tertiary}`}>{r.sellerPhone}</p>}
                      </td>
                      {/* Sale Amount */}
                      <td className={`px-3 py-3 font-semibold text-xs transition-colors ${themeClasses.text.primary}`}>{money(r.saleAmount)}</td>
                      {/* Rate */}
                      <td className={`px-3 py-3 text-xs font-bold transition-colors text-emerald-600`}>
                        {r.commissionRate ? `${r.commissionRate}%` : '—'}
                      </td>
                      {/* Commission Earned */}
                      <td className={`px-3 py-3 font-bold text-xs transition-colors text-emerald-600`}>{money(r.commissionEarned)}</td>
                      {/* Fine */}
                      <td className={`px-3 py-3 text-xs font-bold transition-colors ${(r.fineAmount > 0) ? 'text-red-600' : themeClasses.text.tertiary}`}>
                        {(r.fineAmount > 0)
                          ? money(r.fineAmount)
                          : '—'
                        }
                      </td>
                      {/* Net to Seller */}
                      <td className={`px-3 py-3 font-bold text-xs transition-colors ${themeClasses.text.primary}`}>
                        <div className="flex items-center gap-1">
                          {money(r.netAmount)}
                          <VatTooltip row={r} themeClasses={themeClasses} />
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3"><StatusBadge status={r.status} themeClasses={themeClasses} /></td>
                      {/* Due Date */}
                      <td className={`px-3 py-3 text-xs font-semibold transition-colors ${isOverdue ? 'text-red-600' : themeClasses.text.secondary}`}>
                        {dateStr(r.dueDate)}
                        {isOverdue && <span className={`block text-[10px] font-bold text-red-500`}>OVERDUE</span>}
                      </td>
                      {/* Reminder Sent */}
                      <td className="px-3 py-3">
                        {reminded
                          ? <span className={`flex items-center gap-1 text-xs font-bold transition-colors text-emerald-600`}><CheckCircle size={11} /> Sent</span>
                          : <span className={`flex items-center gap-1 text-xs transition-colors ${themeClasses.text.tertiary}`}><X size={11} /> Not Sent</span>
                        }
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3">
                        {(r.status !== 'PAID') && (
                          <button
                            onClick={() => handleRemind(orderId)}
                            disabled={working === orderId || reminded}
                            title="Send overdue payment reminder email to seller"
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${
                              reminded
                                ? `${themeClasses.border.primary} ${themeClasses.text.tertiary} ${themeClasses.bg.secondary} cursor-not-allowed`
                                : `${themeClasses.status.success}`
                            }`}
                          >
                            <Mail size={11} />
                            {working === orderId ? 'Sending...' : reminded ? 'Sent' : 'Remind'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fine calculation note */}
        <div className={`mt-4 border rounded-xl p-4 text-xs flex items-start gap-2 transition-colors ${themeClasses.bg.warning} ${themeClasses.border.warning}`}>
          <Info size={14} className={`flex-shrink-0 mt-0.5 transition-colors ${themeClasses.text.warning}`} />
          <div>
            <p className={`font-black transition-colors ${themeClasses.text.warning}`}>Commission Fine Policy</p>
            <p className={`mt-0.5 transition-colors ${themeClasses.text.warning}`}>Overdue commissions incur a <strong>10% base fine</strong> plus an additional <strong>5% per week</strong> of delay. Hover the <Info size={10} className="inline" /> icon on any row to view the full VAT & financial breakdown.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
