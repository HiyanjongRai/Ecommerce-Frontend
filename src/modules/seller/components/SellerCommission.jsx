import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getEsewaCommissionSignature, getSellerCommissions, initiateKhaltiCommissionPayment } from '../services/sellerService';
import { normalizeList } from './SellerSectionUtils';

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
const StatusPill = ({ status }) => {
  const s = String(status || '').toUpperCase();
  const map = {
    PAID:    'bg-green-50 text-green-700 border border-green-200',
    UNPAID:  'bg-blue-50 text-blue-700 border border-blue-200',
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    DUE:     'bg-red-50 text-red-600 border border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide inline-block ${map[s] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
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
          <stop offset="0%" stopColor="#05CD99" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#05CD99" />
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
      <path d="M0,5 Q20,10 40,5 T60,20 T80,15 T100,35" fill="none" stroke="url(#g2)" strokeWidth="3.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EE5D50" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EE5D50" />
        </linearGradient>
      </defs>
    </svg>
  );

/* ─── main component ──────────────────────────────────────────── */
const SellerCommission = () => {
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
          success_url: 'http://localhost:3000/payment/success', failure_url: 'http://localhost:3000/payment/failure',
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
    <div className="flex items-center justify-center h-48">
      <div className="flex items-center gap-3 text-gray-400">
        <svg className="animate-spin w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-semibold">Loading commissions…</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-[1400px]">

      {/* ── Page Header ── */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-sm font-black text-gray-900 tracking-tight">Commission</h1>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Track platform commission dues and payment status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!payableItems.length || !!processing}
              onClick={() => pay('ESEWA')}
              className="bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 hover:bg-green-700 text-white px-3.5 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              Pay All via eSewa
            </button>
            <button
              disabled={!payableItems.length || !!processing}
              onClick={() => pay('KHALTI')}
              className="bg-purple-600 disabled:bg-gray-200 disabled:text-gray-400 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              Pay All via Khalti
            </button>
          </div>
        </div>
        {message && (
          <div className="mt-3 border border-gray-200 bg-gray-50 rounded-sm px-3 py-2 text-[11px] font-semibold text-gray-700">
            {message}
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {cards.map(({ title, value, positive, onClick }) => (
          <div
            key={title}
            onClick={onClick}
            className={`bg-white border border-gray-200 rounded-sm shadow-sm p-3.5 flex items-center justify-between transition-colors duration-200 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          >
            <div>
              <h3 className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">{title}</h3>
              <div className="text-base font-black text-gray-900 leading-none">{value}</div>
              <div className={`flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider mt-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
                {positive ? '↑' : '↓'} This period
              </div>
            </div>
            <div className="w-14 h-7 opacity-80">
              <SparkLine positive={positive} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Commission Table ── */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <h2 className="text-xs font-black text-gray-900 tracking-tight">Commission Records</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by order ID or product…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-sm px-3 py-1.5 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 w-56"
            />
            <button className="flex items-center gap-1.5 text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-sm text-xs font-bold hover:bg-gray-100 transition-colors">
              Export
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-14">
            <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs font-semibold text-gray-500">
              {commissions.length === 0 ? 'No commission records yet' : 'No results match your search'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {commissions.length === 0 ? 'Commission entries appear after delivered orders.' : 'Try a different order ID or product name.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Order ID</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Product</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Sale</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">VAT</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Promo Loss</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Commission</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Net Earnings</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Status</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Date</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Pay</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const status = statusStr(item);
                  const oid    = displayOrderId(item);
                  return (
                    <tr key={item.orderId || item.id || idx} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      {/* Order ID */}
                      <td className="py-2.5 px-3">
                        <Link
                          to={`/seller/orders?orderId=${item.orderId || item.id}`}
                          className="text-[11px] font-black text-gray-800 hover:text-blue-600 transition-colors font-mono"
                        >
                          {oid}
                        </Link>
                      </td>
                      {/* Product */}
                      <td className="py-2.5 px-3 text-[11px] text-gray-500 font-medium max-w-[140px] truncate">
                        {item.productName || '—'}
                      </td>
                      {/* Sale */}
                      <td className="py-2.5 px-3 text-[11px] text-gray-700 font-semibold">
                        {fmt(item.saleAmount || item.orderTotal || item.totalAmount)}
                      </td>
                      {/* VAT */}
                      <td className="py-2.5 px-3 text-[11px] text-amber-600 font-semibold">
                        {fmt(item.vatPayableAmount || item.vatAmount)}
                      </td>
                      {/* Promo Loss */}
                      <td className="py-2.5 px-3 text-[11px] font-semibold text-red-500">
                        {Number(item.sellerPromoDiscountAmount || 0) > 0 ? `−${fmt(item.sellerPromoDiscountAmount)}` : '—'}
                      </td>
                      {/* Commission */}
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-black text-gray-800">{fmt(commPayable(item))}</span>
                        {fineAmt(item) > 0 && (
                          <span className="block text-[9px] text-red-500 font-bold">+fine {fmt(fineAmt(item))}</span>
                        )}
                      </td>
                      {/* Net Earnings */}
                      <td className="py-2.5 px-3 text-[11px] font-black text-green-600">
                        {fmt(netEarnings(item))}
                      </td>
                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <StatusPill status={status} />
                      </td>
                      {/* Date */}
                      <td className="py-2.5 px-3 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-NP', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      {/* Pay */}
                      <td className="py-2.5 px-3">
                        {status === 'PAID' ? (
                          <span className="text-[9px] font-black text-green-600 uppercase">✓ Paid</span>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              disabled={!!processing}
                              onClick={() => pay('ESEWA', [item])}
                              className="rounded-sm bg-green-50 border border-green-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-green-700 hover:bg-green-100 disabled:opacity-40 transition-colors"
                            >
                              eSewa
                            </button>
                            <button
                              disabled={!!processing}
                              onClick={() => pay('KHALTI', [item])}
                              className="rounded-sm bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-purple-700 hover:bg-purple-100 disabled:opacity-40 transition-colors"
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
          <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50 flex flex-wrap items-center gap-4 text-[10px] text-gray-500 font-semibold">
            <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-gray-300">|</span>
            <span>Total Sale: <strong className="text-gray-700">{fmt(filtered.reduce((s,i) => s + Number(i.saleAmount||0), 0))}</strong></span>
            <span className="text-gray-300">|</span>
            <span>Commission: <strong className="text-gray-700">{fmt(filtered.reduce((s,i) => s + commPayable(i), 0))}</strong></span>
            <span className="text-gray-300">|</span>
            <span>Net: <strong className="text-green-600">{fmt(filtered.reduce((s,i) => s + netEarnings(i), 0))}</strong></span>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-lg w-full shadow-2xl border border-gray-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-gray-900">Nepal VAT (13%) Breakdown</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Order-level tax ledger for current records</p>
              </div>
              <button
                onClick={() => setVatOpen(false)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formula helper */}
            <div className="mx-5 mt-4 mb-2 bg-amber-50 border border-amber-100 rounded-sm px-3 py-2 text-[10px] text-gray-500 font-medium leading-relaxed">
              <span className="font-black text-gray-700 block mb-0.5">💡 Nepal VAT Formula (13% inclusive):</span>
              <code className="bg-white border border-gray-100 rounded px-2 py-0.5 font-mono text-gray-800 block text-center mt-1">
                VAT = Sale Price − (Sale Price ÷ 1.13)
              </code>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-5 pt-2">
              <table className="w-full text-left border-collapse border border-gray-100 rounded-sm overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-2 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Order ID</th>
                    <th className="py-2 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Date</th>
                    <th className="py-2 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Sale</th>
                    <th className="py-2 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400 text-right">VAT (13%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {commissions.map((item, idx) => (
                    <tr key={item.orderId || item.id || idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <Link
                          to={`/seller/orders?orderId=${item.orderId || item.id}`}
                          onClick={() => setVatOpen(false)}
                          className="text-[11px] font-black text-blue-600 hover:underline font-mono"
                        >
                          {displayOrderId(item)}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-gray-400 font-medium">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-NP', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-gray-700 font-semibold">
                        {fmt(item.saleAmount || item.orderTotal || item.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-black text-amber-600 text-right">
                        {fmt(item.vatPayableAmount || item.vatAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Total VAT</p>
                <p className="text-base font-black text-gray-900">{fmt(summary.totalVat)}</p>
              </div>
              <button
                onClick={() => setVatOpen(false)}
                className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-black px-5 py-2 rounded-sm transition-colors"
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
