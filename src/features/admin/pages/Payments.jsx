import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, RefreshCw, Copy, Check, CreditCard, Calendar, DollarSign, X, CheckCircle, AlertTriangle, Clock, ChevronDown } from 'lucide-react';
import AdminLayout from '../../../app/layouts/AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { getAdminPayments, getAdminPaymentEvents } from '../api/adminApi';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || 'N/A').replaceAll('_', ' ');
const date  = v => v ? new Date(v).toLocaleString() : 'N/A';

const StateBadge = ({ value, themeClasses }) => {
  const statusMap = {
    PENDING:   themeClasses.status.warning,
    COMPLETED: themeClasses.status.success,
    FAILED:    themeClasses.status.danger,
    REFUNDED:  themeClasses.status.info,
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusMap[value] || themeClasses.status.pending}`}>
      {nice(value)}
    </span>
  );
};

export default function AdminPayments() {
  const { themeClasses } = useAdminTheme();
  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('ALL');
  const [working, setWorking]     = useState('');
  const [toast, setToast]         = useState('');
  const [copiedId, setCopiedId]   = useState(null);
  
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [events, setEvents]                   = useState([]);
  const [loadingEvents, setLoadingEvents]     = useState(false);

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminPayments();
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPayments([]);
      showToast('❌ Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const loadEvents = async (payment) => {
    setSelectedPayment(payment);
    setLoadingEvents(true);
    setEvents([]);
    try {
      const res = await getAdminPaymentEvents(payment.paymentId);
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEvents([]);
      showToast('❌ Failed to load payment events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('📋 Copied to clipboard');
  };

  const stats = React.useMemo(() => {
    const total = payments.length;
    const completed = payments.filter(p => p.state === 'COMPLETED');
    const totalVolume = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
    const successRate = total > 0 ? (completed.length / total) * 100 : 0;
    const avgValue = completed.length > 0 ? totalVolume / completed.length : 0;
    const pendingCount = payments.filter(p => p.state === 'PENDING').length;
    return {
      total,
      totalVolume,
      successRate,
      avgValue,
      pendingCount
    };
  }, [payments]);

  const filtered = payments.filter(p => {
    const matchFilter = filter === 'ALL' || p.state === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || [
      String(p.paymentId),
      String(p.orderId),
      p.customOrderId,
      p.customerName,
      p.customerEmail,
      p.method,
      p.transactionUuid,
      p.providerReferenceId
    ].some(f => f?.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  const displayedPayments = React.useMemo(() => {
    return filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(0);
  }, [search, filter]);

  return (
    <AdminLayout pageTitle="Payment Management" pageSubtitle={`${payments.length} total payments processed`}>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-[20px] shadow-2xl border transition-all ${themeClasses.bg.secondary} ${themeClasses.border.accent} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      <div className="p-4 lg:p-6 space-y-6">
        
        {/* Dynamic Statistics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          
          {/* Total Volume */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Total Volume</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{money(stats.totalVolume)}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.success}`}>From completed payments</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Success Rate</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <CheckCircle size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.successRate.toFixed(1)}%</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.info}`}>{payments.filter(p => p.state === 'COMPLETED').length} of {stats.total} successful</p>
            </div>
          </div>

          {/* Avg Value */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Avg. Transaction</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-2xs">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{money(stats.avgValue)}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.accent}`}>Average ticket size</p>
            </div>
          </div>

          {/* Pending Count */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Pending Transactions</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.pendingCount}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.warning}`}>Awaiting gateway callback</p>
            </div>
          </div>

        </div>

        {/* Filters */}
        <div className={`rounded-[20px] border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-4 transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search payments, orders, accounts, UUID..."
                className={`w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
              />
            </div>
            <div className="relative">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className={`appearance-none pl-3.5 pr-8 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
              >
                <option value="ALL">All States</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <ChevronDown size={13} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${themeClasses.text.tertiary}`} />
            </div>
          </div>
          <button
            onClick={loadPayments}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className={`rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Payment ID', 'Order ID', 'Customer', 'Method', 'Amount', 'State', 'Provider Ref', 'Initiated', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${themeClasses.border.primary}`}>
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(9).fill(0).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : displayedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={`text-center py-16 font-semibold transition-colors ${themeClasses.text.tertiary}`}>
                      No payments found
                    </td>
                  </tr>
                ) : displayedPayments.map(p => (
                  <tr key={p.paymentId} className={`transition-colors hover:${themeClasses.bg.secondary}`}>
                    <td className={`px-5 py-4 font-semibold transition-colors ${themeClasses.text.primary}`}>
                      #{p.paymentId}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-600">
                      <div>#{p.customOrderId || p.orderId}</div>
                      {p.transactionUuid && (
                        <div className={`text-[10px] font-normal mt-0.5 tracking-tighter transition-colors ${themeClasses.text.tertiary}`}>
                          UUID: {p.transactionUuid}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className={`font-bold transition-colors ${themeClasses.text.primary}`}>{p.customerName || 'N/A'}</p>
                        <p className={`text-[9px] font-semibold transition-colors ${themeClasses.text.tertiary}`}>{p.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}>
                        {p.method}
                      </span>
                    </td>
                    <td className={`px-5 py-4 font-black transition-colors ${themeClasses.text.primary}`}>
                      {money(p.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <StateBadge value={p.state} themeClasses={themeClasses} />
                    </td>
                    <td className={`px-5 py-4 text-xs font-mono transition-colors ${themeClasses.text.tertiary}`}>
                      {p.providerReferenceId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[100px]">{p.providerReferenceId}</span>
                          <button
                            onClick={() => copyToClipboard(p.providerReferenceId, `ref-${p.paymentId}`)}
                            className={`p-1 rounded transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`}
                          >
                            {copiedId === `ref-${p.paymentId}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                    <td className={`px-5 py-4 text-xs font-semibold transition-colors ${themeClasses.text.tertiary}`}>
                      {date(p.initiatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => loadEvents(p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                      >
                        <Eye size={12} /> Events
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-6 py-4 border-t transition-colors ${themeClasses.border.primary}`}>
              <p className={`text-xs font-semibold transition-colors ${themeClasses.text.tertiary}`}>
                Page {currentPage + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-colors border cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-colors border cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events Drawer */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" onClick={() => setSelectedPayment(null)} />
          <div className={`relative w-full max-w-lg h-full shadow-2xl flex flex-col z-50 border-l transition-all duration-300 transform translate-x-0 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className={`flex items-center justify-between px-6 py-5 border-b transition-colors ${themeClasses.border.primary}`}>
              <div>
                <h2 className={`text-sm font-black uppercase tracking-wider transition-colors ${themeClasses.text.primary}`}>Transaction History</h2>
                <p className={`text-[11px] font-mono font-semibold transition-colors ${themeClasses.text.tertiary}`}>Payment ID: #{selectedPayment.paymentId}</p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className={`p-2 rounded-xl border transition-colors ${themeClasses.text.tertiary} ${themeClasses.border.primary} hover:${themeClasses.bg.secondary} cursor-pointer`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Payment Info Card */}
              <div className={`rounded-[20px] p-5 border space-y-3 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold transition-colors ${themeClasses.text.tertiary}`}>Order ID:</span>
                  <span className={`font-bold font-mono transition-colors ${themeClasses.text.primary}`}>#{selectedPayment.orderId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold transition-colors ${themeClasses.text.tertiary}`}>Customer:</span>
                  <span className={`font-bold transition-colors ${themeClasses.text.primary}`}>{selectedPayment.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold transition-colors ${themeClasses.text.tertiary}`}>Payment Gateway:</span>
                  <span className="font-bold text-emerald-600">{selectedPayment.method}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold transition-colors ${themeClasses.text.tertiary}`}>Transaction Amount:</span>
                  <span className={`font-black transition-colors ${themeClasses.text.primary}`}>{money(selectedPayment.amount)}</span>
                </div>
                <div className={`flex justify-between items-center text-xs pt-2.5 border-t transition-colors ${themeClasses.border.primary}`}>
                  <span className={`font-semibold transition-colors ${themeClasses.text.tertiary}`}>State:</span>
                  <StateBadge value={selectedPayment.state} themeClasses={themeClasses} />
                </div>
              </div>

              {/* UUID copy area */}
              {selectedPayment.transactionUuid && (
                <div className={`border rounded-[20px] p-5 space-y-2 transition-colors ${themeClasses.border.primary}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Transaction UUID</span>
                  <div className={`flex items-center justify-between p-2 rounded-xl border text-xs font-mono transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
                    <span className="truncate max-w-[280px]">{selectedPayment.transactionUuid}</span>
                    <button
                      onClick={() => copyToClipboard(selectedPayment.transactionUuid, 'uuid')}
                      className={`p-1.5 rounded-lg transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`}
                    >
                      {copiedId === 'uuid' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Event Timeline */}
              <div className="space-y-4">
                <h3 className={`text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Event Timeline</h3>
                {loadingEvents ? (
                  <div className="flex flex-col gap-3 py-6 items-center justify-center">
                    <RefreshCw size={20} className={`animate-spin transition-colors ${themeClasses.text.tertiary}`} />
                    <span className={`text-xs font-semibold transition-colors ${themeClasses.text.tertiary}`}>Loading logs...</span>
                  </div>
                ) : events.length === 0 ? (
                  <div className={`text-center py-10 border border-dashed rounded-[20px] text-xs transition-colors ${themeClasses.border.primary} ${themeClasses.text.tertiary} ${themeClasses.bg.secondary}`}>
                    No logged events for this transaction.
                  </div>
                ) : (
                  <div className={`relative border-l pl-4 ml-2 space-y-6 py-2 transition-colors ${themeClasses.border.primary}`}>
                    {events.map((ev, idx) => {
                      const isComplete = ev.eventType?.includes('SUCCESS') || ev.eventType?.includes('COMPLETE');
                      const isFailed   = ev.eventType?.includes('FAIL') || ev.eventType?.includes('ERROR');
                      return (
                        <div key={ev.id || idx} className="relative">
                          {/* Dot */}
                          <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 transition-colors
                            ${isComplete ? 'border-emerald-500' : isFailed ? 'border-red-500' : 'border-amber-500'} ${themeClasses.bg.primary}`} />
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-bold transition-colors ${themeClasses.text.primary}`}>{nice(ev.eventType)}</p>
                              <span className={`text-[9px] font-semibold transition-colors ${themeClasses.text.tertiary}`}>{date(ev.createdAt || ev.timestamp)}</span>
                            </div>
                            <p className={`text-[11px] leading-relaxed transition-colors ${themeClasses.text.secondary}`}>{ev.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className={`border-t p-4 transition-colors ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
              <button
                onClick={() => setSelectedPayment(null)}
                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border cursor-pointer transition-colors ${themeClasses.button.outline}`}
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
