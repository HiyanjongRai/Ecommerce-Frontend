import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getEsewaCommissionSignature, getSellerCommissions, initiateKhaltiCommissionPayment } from '../services/sellerService';
import { normalizeList } from './SellerSectionUtils';
import { useSellerTheme } from '../hooks/useSellerTheme';

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = (val) => {
  const n = Number(val || 0);
  return `Rs. ${n.toLocaleString('en-NP', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const displayOrderId = (item) =>
  item.customOrderId || (item.orderId ? `#${item.orderId}` : item.id ? `#${item.id}` : '—');

const commissionAmt  = (item) => Number(item.commissionEarned || item.commissionAmount || 0);
const fineAmt        = (item) => Number(item.fineAmount || 0);
const commPayable    = (item) => commissionAmt(item) + fineAmt(item);
const netEarnings    = (item) => Number(item.finalSellerEarnings || item.netProfitAmount || item.netAmount || 0);
const statusStr      = (item) => String(item.status || item.commissionStatus || 'DUE').toUpperCase();

/* ─── sub-components ──────────────────────────────────────────── */
const StatusPill = ({ status, isDark }) => {
  const s = String(status || '').toUpperCase();
  
  const getStyle = () => {
    switch (s) {
      case 'PAID':
        return isDark
          ? 'bg-green-950/30 border-green-500/30 text-green-400'
          : 'bg-green-50 border-green-200 text-green-700';
      case 'UNPAID':
      case 'PENDING':
        return isDark
          ? 'bg-orange-950/30 border-orange-500/30 text-orange-400'
          : 'bg-orange-50 border-orange-200 text-orange-700';
      case 'DUE':
        return isDark
          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300'
          : 'bg-gray-100 border-gray-300 text-gray-800';
      case 'CANCELLED':
        return isDark
          ? 'bg-red-950/30 border-red-500/30 text-red-400'
          : 'bg-red-50 border-red-200 text-red-700';
      default:
        return isDark
          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
          : 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStyle()}`}>
      {s}
    </span>
  );
};

const SparkLine = ({ positive }) =>
  positive ? (
    <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
      <path d="M0,35 Q10,35 20,25 T40,25 T60,10 T80,15 T100,5" fill="none" stroke="url(#g1)" strokeWidth="3.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
      <path d="M0,5 Q20,10 40,5 T60,20 T80,15 T100,35" fill="none" stroke="url(#g2)" strokeWidth="3.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </svg>
  );

/* ─── main component ──────────────────────────────────────────── */
const SellerCommission = () => {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [message, setMessage] = useState('');
  const [esewaData, setEsewaData] = useState(null);
  const esewaFormRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [vatOpen, setVatOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (esewaData && esewaFormRef.current) esewaFormRef.current.submit();
  }, [esewaData]);

  useEffect(() => {
    setLoading(true);
    getSellerCommissions()
      .then((res) => setCommissions(normalizeList(res.data)))
      .catch(() => setCommissions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const s = searchParams.get('khaltiCommission');
    if (s === 'success') setMessage('Khalti commission payment verified successfully.');
    else if (s === 'failed') setMessage('Khalti commission payment could not be verified.');
  }, [searchParams]);

  /* summary */
  const summary = useMemo(() => {
    const due        = commissions.filter(i => statusStr(i) !== 'PAID').reduce((s, i) => s + commPayable(i), 0);
    const paid       = commissions.filter(i => statusStr(i) === 'PAID').reduce((s, i) => s + commPayable(i), 0);
    const totalSales = commissions.reduce((s, i) => s + Number(i.saleAmount || 0), 0);
    const totalVat   = commissions.reduce((s, i) => s + Number(i.vatPayableAmount || i.vatAmount || 0), 0);
    const promoLoss  = commissions.reduce((s, i) => s + Number(i.sellerPromoDiscountAmount || 0), 0);
    const platDisc   = commissions.reduce((s, i) => s + Number(i.platformSponsoredDiscountAmount || 0), 0);
    const totalNet   = commissions.reduce((s, i) => s + netEarnings(i), 0);
    return { due, paid, totalSales, totalVat, promoLoss, platDisc, totalNet, count: commissions.length };
  }, [commissions]);

  const payableItems = useMemo(() =>
    commissions.filter(i => statusStr(i) !== 'PAID' && i.orderId && commPayable(i) > 0),
    [commissions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return commissions;
    const q = search.trim().toLowerCase();
    return commissions.filter(i =>
      (i.customOrderId && i.customOrderId.toLowerCase().includes(q)) ||
      String(i.orderId || '').includes(q) ||
      (i.productName && i.productName.toLowerCase().includes(q))
    );
  }, [commissions, search]);

  /* payment */
  const pay = async (gateway, items = payableItems) => {
    if (!items.length) { setMessage('No unpaid commission available.'); return; }
    const orderIds = items.map(i => i.orderId);
    const amount   = items.reduce((s, i) => s + commPayable(i), 0).toFixed(2);
    const uuid     = `COMM-${orderIds.join('_')}-${Date.now()}`;
    setProcessing(`${gateway}-${orderIds.join('_')}`);
    setMessage('');
    try {
      if (gateway === 'ESEWA') {
        const sig = (await getEsewaCommissionSignature({ amount, transactionUuid: uuid, orderIds })).data;
        setEsewaData({
          amount, tax_amount: '0.00', total_amount: amount, transaction_uuid: uuid,
          product_code: sig.productCode, product_service_charge: '0.00', product_delivery_charge: '0.00',
          success_url: `${window.location.origin}/payment/success`, failure_url: `${window.location.origin}/payment/failure`,
          signed_field_names: 'total_amount,transaction_uuid,product_code', signature: sig.signature,
          paymentUrl: sig.paymentUrl,
        });
        return;
      }
      const url = (await initiateKhaltiCommissionPayment({ amount, purchaseOrderId: uuid, orderIds })).data?.paymentUrl;
      if (!url) throw new Error('No Khalti URL');
      window.location.href = url;
    } catch (err) {
      setMessage(err.response?.data?.message || `Failed to start ${gateway} payment.`);
      setProcessing('');
    }
  };

  /* stat cards */
  const cards = [
    { title: 'Total Sales',       value: fmt(summary.totalSales), positive: true  },
    { title: 'Net Earnings',      value: fmt(summary.totalNet),   positive: true  },
    { title: 'Commission Due',    value: fmt(summary.due),        positive: false },
    { title: 'Commission Paid',   value: fmt(summary.paid),       positive: true  },
    { title: 'VAT Payable',       value: fmt(summary.totalVat),   positive: false, onClick: () => setVatOpen(true) },
    { title: 'Promo Loss',        value: fmt(summary.promoLoss),  positive: false },
    { title: 'Total Records',     value: summary.count,           positive: true  },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
      <svg className="animate-spin w-6 h-6 text-[#16A34A]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <span className="text-xs font-bold uppercase tracking-wider">Loading Financials...</span>
    </div>
  );

  return (
    <div className={`space-y-4 max-w-[1400px] animate-in fade-in-50 duration-200 font-sans ${themeClasses.bg.primary}`}>

      {/* ── Hero Banner ── */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border transition-all ${
          isDark ? 'border-white/[0.08]' : 'border-gray-200'
        }`}
        style={{ background: isDark ? 'linear-gradient(135deg, #0b0c10 0%, #111827 40%, rgba(22, 163, 74, 0.15) 100%)' : 'linear-gradient(135deg, #111827 0%, #16A34A 100%)' }}
      >
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div>
            <p className="text-emerald-100/70 text-[10px] font-extrabold uppercase tracking-[0.2em] bg-white/10 border border-white/10 rounded-full px-2.5 py-0.5 inline-block mb-2">
              Financial Center
            </p>
            <h1 className="text-white text-xl font-bold leading-tight tracking-tight mt-1">Earnings & Commission Ledger</h1>
            <p className="text-emerald-100/70 text-xs font-normal mt-1">Track platform commission dues and payment status.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={!payableItems.length || !!processing}
              onClick={() => pay('ESEWA')}
              className="bg-white hover:bg-gray-150 text-gray-900 disabled:opacity-50 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm h-10 flex items-center"
            >
              Pay eSewa
            </button>
            <button
              disabled={!payableItems.length || !!processing}
              onClick={() => pay('KHALTI')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-50 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm h-10 flex items-center"
            >
              Pay Khalti
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`border rounded-xl px-4 py-3 text-xs font-bold ${isDark ? 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]' : 'bg-green-50 border-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {cards.map(({ title, value, positive, onClick }) => {
          let accentText = positive 
            ? 'text-[#16A34A]' 
            : 'text-red-500';
          
          return (
            <div
              key={title}
              onClick={onClick}
              className={`border rounded-[20px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-zinc-950/45 hover:border-white/[0.15] border-white/[0.08] text-white'
                  : 'bg-white hover:border-gray-300 border-gray-200 text-[#111827]'
              } ${onClick ? 'cursor-pointer' : ''}`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block mb-1">
                  {title}
                </span>
                <span className="text-[17px] font-bold tracking-tight leading-none text-[#111827] dark:text-white block mt-1">
                  {value}
                </span>
                <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider mt-2.5 ${accentText}`}>
                  {positive ? '↑' : '↓'} This period
                </span>
              </div>
              <div className="w-full h-8 mt-3 opacity-85">
                <SparkLine positive={positive} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Commission Table ── */}
      <div className={`border rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all ${
        isDark ? 'bg-zinc-950/45 border-white/[0.08] text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-gray-150/50'
        }`}>
          <h2 className="text-xs font-bold uppercase tracking-wider">Transaction Ledger</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search ID or product…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`block w-56 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all text-xs font-semibold ${
                isDark ? '!bg-zinc-900 !border-white/[0.08] !text-white !placeholder-zinc-500' : ''
              }`}
            />
            <button className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              isDark ? 'bg-zinc-900 border-white/[0.08] text-zinc-300 hover:bg-zinc-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
              Export
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'}`}>
              <svg className={`w-6 h-6 ${isDark ? 'text-white/20' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className={`text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {commissions.length === 0 ? 'No records yet' : 'No matches'}
            </p>
            <p className="text-[10px] text-gray-500 font-semibold">
              {commissions.length === 0 ? 'Commission entries appear after delivered orders.' : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${isDark ? 'bg-zinc-900/50' : 'bg-gray-50/50'} border-b ${isDark ? 'border-white/[0.08]' : 'border-gray-150/50'}`}>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Order ID</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Product</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Sale</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">VAT</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Promo Loss</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Commission</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Net Earnings</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Status</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Date</th>
                  <th className="py-3 px-5 text-[9px] font-black uppercase tracking-wider text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-50'}`}>
                {filtered.map((item, idx) => {
                  const status = statusStr(item);
                  const oid    = displayOrderId(item);
                  return (
                    <tr key={item.orderId || item.id || idx} className={`transition-all ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/30'}`}>
                      {/* Order ID */}
                      <td className="py-3 px-5">
                        <Link
                          to={`/seller/orders?orderId=${item.orderId || item.id}`}
                          className="text-[11px] font-black text-[#16A34A] hover:text-[#059669] transition-colors font-mono"
                        >
                          {oid}
                        </Link>
                      </td>
                      {/* Product */}
                      <td className={`py-3 px-5 text-[11px] font-semibold max-w-[140px] truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {item.productName || '—'}
                      </td>
                      {/* Sale */}
                      <td className={`py-3 px-5 text-[11px] font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                        {fmt(item.saleAmount || item.orderTotal || item.totalAmount)}
                      </td>
                      {/* VAT */}
                      <td className={`py-3 px-5 text-[11px] font-black ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {fmt(item.vatPayableAmount || item.vatAmount)}
                      </td>
                      {/* Promo Loss */}
                      <td className={`py-3 px-5 text-[11px] font-black ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {Number(item.sellerPromoDiscountAmount || 0) > 0 ? `−${fmt(item.sellerPromoDiscountAmount)}` : '—'}
                      </td>
                      {/* Commission */}
                      <td className="py-3 px-5">
                        <span className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{fmt(commPayable(item))}</span>
                        {fineAmt(item) > 0 && (
                          <span className={`block text-[9px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+fine {fmt(fineAmt(item))}</span>
                        )}
                      </td>
                      {/* Net Earnings */}
                      <td className={`py-3 px-5 text-[11px] font-black ${isDark ? 'text-[#16A34A]' : 'text-[#16A34A]'}`}>
                        {fmt(netEarnings(item))}
                      </td>
                      {/* Status */}
                      <td className="py-3 px-5">
                        <StatusPill status={status} isDark={isDark} />
                      </td>
                      {/* Date */}
                      <td className="py-3 px-5 text-[10px] text-gray-500 font-bold whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-NP', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      {/* Pay */}
                      <td className="py-3 px-5">
                        {status === 'PAID' ? (
                          <span className="text-[10px] font-bold uppercase text-[#16A34A]">✓ Paid</span>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              disabled={!!processing}
                              onClick={() => pay('ESEWA', [item])}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition-colors disabled:opacity-40 ${isDark ? 'bg-[#16A34A]/15 text-[#16A34A] hover:bg-[#16A34A]/25' : 'bg-emerald-50 text-[#16A34A] hover:bg-emerald-100 border border-emerald-100'}`}
                            >
                              eSewa
                            </button>
                            <button
                              disabled={!!processing}
                              onClick={() => pay('KHALTI', [item])}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition-colors disabled:opacity-40 border ${isDark ? 'bg-white/10 text-white border-white/15 hover:bg-white/15' : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-200'}`}
                            >
                              Khalti
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer summary */}
        {filtered.length > 0 && (
          <div className={`px-5 py-3 flex flex-wrap items-center gap-4 text-[10px] font-semibold border-t ${isDark ? 'border-white/10 bg-[#111827]/80 text-gray-400' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
            <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
            <span className={isDark ? 'text-white/20' : 'text-gray-300'}>|</span>
            <span>Total Sale: <strong className={isDark ? 'text-white' : 'text-gray-700'}>{fmt(filtered.reduce((s,i) => s + Number(i.saleAmount||0), 0))}</strong></span>
            <span className={isDark ? 'text-white/20' : 'text-gray-300'}>|</span>
            <span>Commission: <strong className={isDark ? 'text-white' : 'text-gray-700'}>{fmt(filtered.reduce((s,i) => s + commPayable(i), 0))}</strong></span>
            <span className={isDark ? 'text-white/20' : 'text-gray-300'}>|</span>
            <span>Net: <strong className={isDark ? 'text-[#16A34A]' : 'text-[#16A34A]'}>{fmt(filtered.reduce((s,i) => s + netEarnings(i), 0))}</strong></span>
          </div>
        )}
      </div>

      {/* ── eSewa hidden form ── */}
      {esewaData && (
        <form ref={esewaFormRef} action={esewaData.paymentUrl} method="POST" style={{ display: 'none' }}>
          {Object.entries(esewaData).filter(([k]) => k !== 'paymentUrl').map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </form>
      )}

      {/* ── VAT Breakdown Modal ── */}
      {vatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl max-w-lg w-full shadow-2xl border flex flex-col max-h-[85vh] overflow-hidden ${isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100'}`}>
              <div>
                <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Nepal VAT (13%) Breakdown</h3>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">Order-level tax ledger for current records</p>
              </div>
              <button
                onClick={() => setVatOpen(false)}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formula helper */}
            <div className={`mx-6 mt-5 mb-2 rounded-xl px-4 py-3 text-[10px] font-bold leading-relaxed border ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <span className={`font-black block mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>💡 Nepal VAT Formula (13% inclusive):</span>
              <code className={`rounded px-2 py-1 font-mono block text-center mt-1.5 ${isDark ? 'bg-black/50 text-gray-300 border border-white/10' : 'bg-white text-gray-800 border border-gray-200'}`}>
                VAT = Sale Price − (Sale Price ÷ 1.13)
              </code>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-6 pt-3">
              <table className={`w-full text-left border-collapse border rounded-xl overflow-hidden ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <thead>
                  <tr className={`border-b ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider text-gray-400">Order ID</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider text-gray-400">Date</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider text-gray-400">Sale</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider text-gray-400 text-right">VAT (13%)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-50'}`}>
                  {commissions.map((item, idx) => (
                    <tr key={item.orderId || item.id || idx} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'}`}>
                      <td className="py-3 px-4">
                        <Link
                          to={`/seller/orders?orderId=${item.orderId || item.id}`}
                          onClick={() => setVatOpen(false)}
                          className="text-[11px] font-black text-[#16A34A] hover:underline font-mono"
                        >
                          {displayOrderId(item)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[10px] text-gray-500 font-bold">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-NP', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      <td className={`py-3 px-4 text-[11px] font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                        {fmt(item.saleAmount || item.orderTotal || item.totalAmount)}
                      </td>
                      <td className={`py-3 px-4 text-[11px] font-black text-right ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {fmt(item.vatPayableAmount || item.vatAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 flex items-center justify-between border-t ${isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Total VAT</p>
                <p className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(summary.totalVat)}</p>
              </div>
              <button
                onClick={() => setVatOpen(false)}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-colors ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCommission;
