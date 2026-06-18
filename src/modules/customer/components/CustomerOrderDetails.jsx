import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  cancelOrder, retryPayment, changePaymentMethod,
  getEsewaSignature, initiateKhaltiPayment, openDispute,
  getProducts
} from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { getProductLink } from '../../../shared/utils/slugHelper';
import CreateRefundModal from './CreateRefundModal';

/* ── helpers ─────────────────────────────────────────── */
const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ── constants ──────────────────────────────────────── */
const STATUS_BADGE = {
  DRAFT:      'bg-amber-50 text-amber-700',
  PENDING:    'bg-amber-50 text-amber-700',
  CONFIRMED:  'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-indigo-50 text-indigo-700',
  PACKED:     'bg-violet-50 text-violet-700',
  SHIPPED:    'bg-sky-50 text-sky-700',
  DELIVERED:  'bg-[#e6f7ec] text-[#1e8a44]',
  CANCELLED:  'bg-red-50 text-red-600',
  REFUNDED:   'bg-orange-50 text-orange-600',
  FAILED:     'bg-red-50 text-red-600',
};

const STATUS_LABEL = {
  DRAFT: 'Awaiting Payment', PENDING: 'Order Placed', CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing', PACKED: 'Packed', SHIPPED: 'Out for Delivery',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
  FAILED: 'Failed', COD_PENDING: 'Pay on Delivery',
};

const PAYMENT_LABEL = {
  PAID: 'Paid', COD_PENDING: 'Pay on Delivery', PENDING_COD: 'Pay on Delivery',
  REQUIRES_PAYMENT: 'Payment Required', PAYMENT_INITIATED: 'Processing',
  REFUND_PENDING: 'Refund Processing', REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled', FAILED: 'Failed',
  COD_REMITTED: 'Collected (Cash)', COD_FAILED: 'COD Failed',
};

const CANCELLABLE = ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING'];

/* ── 5-step tracker ─────────────────────────────────── */
const TRACK_STEPS = [
  { key: 'placed',    label: 'Order Placed' },
  { key: 'confirmed', label: 'Payment Confirmed' },
  { key: 'shipped',   label: 'Shipped' },
  { key: 'transit',   label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const getStepIndex = (status) => {
  switch (status) {
    case 'DRAFT': case 'PENDING': return 0;
    case 'CONFIRMED': case 'PROCESSING': case 'PACKED': return 1;
    case 'SHIPPED': return 2;
    case 'DELIVERED': return 4;
    default: return status === 'CANCELLED' || status === 'FAILED' ? -1 : 0;
  }
};

const StepTracker = ({ order }) => {
  const stepIdx = getStepIndex(order.status);

  if (stepIdx === -1) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-xs font-black text-red-600 uppercase tracking-wider">
        🚫 This order has been {STATUS_LABEL[order.status] || order.status}.
      </div>
    );
  }

  const stepDates = [
    order.createdAt,
    order.confirmedAt || (stepIdx >= 1 ? order.createdAt : null),
    order.shippedAt,
    order.outForDeliveryAt || (stepIdx >= 3 ? order.shippedAt : null),
    order.deliveredAt,
  ];

  return (
    <div className="relative flex justify-between items-start px-4 md:px-10">
      {/* Track line background */}
      <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-gray-200 rounded-full" />
      {/* Track line active */}
      <div 
        className="absolute top-4 left-[10%] h-1 bg-[#10B981] rounded-full transition-all duration-500" 
        style={{ width: `${(Math.min(stepIdx, TRACK_STEPS.length - 1) / (TRACK_STEPS.length - 1)) * 80}%` }}
      />
      {TRACK_STEPS.map((step, idx) => {
        const done   = idx <= stepIdx;
        return (
          <div key={step.key} className="flex flex-col items-center flex-1 text-center z-10 relative gap-3 bg-white">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-white ${
              done ? 'bg-[#10B981] text-white shadow-sm' : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}>
              {done ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              )}
            </div>
            <div className="pt-1.5">
              <p className={`text-[10px] font-black leading-tight ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {stepDates[idx] ? (
                <p className="text-[9px] text-gray-500 font-semibold mt-0.5">{fmtDate(stepDates[idx])}</p>
              ) : (
                <div className="h-3"></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Star rating ────────────────────────────────────── */
const Stars = ({ rating = 0 }) => (
  <span className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-[#ffc107]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    ))}
  </span>
);

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function CustomerOrderDetails({ order, onBack, busyId, setBusyId, onRefundRequested }) {
  const [refundModalOpen,   setRefundModalOpen]   = useState(false);
  const [disputeOpen,       setDisputeOpen]       = useState(false);
  const [disputeType,       setDisputeType]       = useState('OTHER');
  const [disputeReason,     setDisputeReason]     = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError,      setDisputeError]      = useState('');
  const [disputeSuccess,    setDisputeSuccess]    = useState('');
  const [relatedProducts,   setRelatedProducts]   = useState([]);

  const esewaFormRef = useRef(null);
  const [esewaData, setEsewaData] = useState(null);

  useEffect(() => { if (esewaData && esewaFormRef.current) esewaFormRef.current.submit(); }, [esewaData]);

  useEffect(() => {
    getProducts({ page: 0, size: 8 })
      .then(r => setRelatedProducts(Array.isArray(r.data?.content) ? r.data.content : []))
      .catch(() => setRelatedProducts([]));
  }, []);

  if (!order) return null;

  /* payment helpers */
  const pm          = String(order.paymentMethod || '').toUpperCase();
  const isEsewa     = pm === 'ESEWA';
  const isKhalti    = pm === 'KHALTI';
  const isCOD       = !isEsewa && !isKhalti;

  /* cancel */
  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setBusyId(order.orderId);
    try { await cancelOrder(order.orderId); await onRefundRequested?.(); onBack(); }
    catch (e) { alert(e.response?.data?.message || 'Cancel failed'); }
    setBusyId(null);
  };

  /* retry */
  const handleRetry = async (method) => {
    const m = method || order.paymentMethod;
    setBusyId(`${order.orderId}-${m}`);
    try {
      if (m !== order.paymentMethod) await changePaymentMethod(order.orderId, m);
      else await retryPayment(order.orderId);
      const amt = Number(order.grandTotal).toFixed(2);
      if (m === 'KHALTI') {
        const r = await initiateKhaltiPayment({ orderIds: [order.orderId], amount: amt, purchaseOrderId: order.customOrderId || String(order.orderId) });
        const url = r.data?.paymentUrl;
        if (!url) throw new Error('No URL');
        window.location.href = url;
        return;
      }
      const uuid = `ORDS-${order.orderId}-${Date.now()}`;
      const sig  = (await getEsewaSignature({ amount: amt, transactionUuid: uuid, orderIds: [order.orderId] })).data;
      setEsewaData({ amount: amt, tax_amount: '0.00', total_amount: amt, transaction_uuid: uuid, product_code: sig.productCode, product_service_charge: '0.00', product_delivery_charge: '0.00', success_url: 'http://localhost:3000/payment/success', failure_url: 'http://localhost:3000/payment/failure', signed_field_names: 'total_amount,transaction_uuid,product_code', signature: sig.signature, paymentUrl: sig.paymentUrl });
    } catch (e) { alert(e.response?.data?.message || 'Payment failed.'); }
    finally { setBusyId(null); }
  };

  /* dispute */
  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) { setDisputeError('Please describe your dispute.'); return; }
    setDisputeSubmitting(true); setDisputeError(''); setDisputeSuccess('');
    try {
      await openDispute({ orderId: order.orderId, type: disputeType, description: disputeReason.trim() });
      setDisputeSuccess('Dispute ticket opened! Track it under My Disputes.');
      await onRefundRequested?.();
      setTimeout(() => setDisputeOpen(false), 1500);
    } catch (err) { setDisputeError(err.response?.data?.message || 'Failed.'); }
    finally { setDisputeSubmitting(false); }
  };

  const statusBadge   = STATUS_BADGE[order.status] || 'bg-gray-50 text-gray-500';
  const statusLabel   = STATUS_LABEL[order.status] || order.status;
  const paymentBadge  = STATUS_BADGE[order.paymentStatus] || 'bg-gray-50 text-gray-500';
  const paymentLabel  = PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus || 'Pending';

  return (
    <div className="pb-10 font-sans text-gray-800 animate-in fade-in duration-200">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold mb-3">
        <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6"/></svg>
        <span className="hover:text-emerald-600 cursor-pointer transition-colors" onClick={onBack}>My Orders</span>
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6"/></svg>
        <span className="text-emerald-600 font-black">Order Details</span>
      </nav>

      {/* ── Header + Tracker Card ── */}
      <div className="bg-white rounded-2xl p-5 md:px-6 mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-xl md:text-[22px] font-black text-gray-900 mb-1.5">Order Details</h1>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> 
                Order ID: <span className="text-gray-900 font-bold">{order.customOrderId || `#${order.orderId}`}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> 
                Order Date: <span className="text-gray-900 font-bold">{fmtDate(order.createdAt)}</span>
              </span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${statusBadge}`}>
             {order.status === 'DELIVERED' && <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
             {statusLabel}
          </div>
        </div>
        
        <div className="mt-5 border-t border-gray-100 pt-5 pb-1">
           <StepTracker order={order} />
        </div>
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* ─── LEFT COLUMN ─── */}
        <div className="flex-1 min-w-0 w-full space-y-4">

          {/* Product Information */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Product Information</h3>
            </div>

            {order.items && order.items.map((item, idx) => (
              <div key={idx} className={`flex flex-col md:flex-row gap-4 items-start ${idx > 0 ? 'pt-4 mt-4 border-t border-gray-100' : ''}`}>
                {/* Image */}
                <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center p-1.5">
                  {item.imagePath
                    ? <img src={getImgUrl(item.imagePath)} className="max-w-full max-h-full object-contain" alt={item.name} />
                    : <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  }
                </div>

                {/* Info grid */}
                <div className="flex-1 w-full flex flex-col md:flex-row justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-[13px] font-black text-gray-900 leading-snug">{item.name || `Product #${item.productId}`}</h4>
                    {item.brand && (
                      <p className="text-[11px] text-gray-500 font-semibold mt-1">
                        Brand: <span className="text-[#2563EB] font-bold ml-1">{item.brand}</span>
                      </p>
                    )}
                    {item.category && <p className="text-[11px] text-gray-500 font-semibold">Category: <span className="text-gray-800 ml-1">{item.category}</span></p>}
                    {item.variantLabel && <p className="text-[11px] text-gray-500 font-semibold">Variant: <span className="text-gray-800 ml-1">{item.variantLabel}</span></p>}
                    <p className="text-[11px] text-gray-500 font-semibold">Color: <span className="text-gray-800 ml-1">{item.color || 'Standard'}</span></p>
                    
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Stars rating={item.rating || 4.8} />
                      <span className="text-[10px] text-gray-500 font-bold">({item.rating || '4.8'})</span>
                    </div>

                    {order.status === 'DELIVERED' && order.deliveredAt && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e6f7ec] text-[#1e8a44] rounded-md text-[9px] font-black uppercase tracking-wider">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        Delivered on {fmtDate(order.deliveredAt)}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 md:mt-0 md:w-48 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 font-semibold w-16">Qty</span>
                      <span className="text-gray-300">:</span>
                      <span className="font-bold text-gray-900 flex-1 text-right">{item.quantity}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 font-semibold w-16">Price</span>
                      <span className="text-gray-300">:</span>
                      <span className="font-bold text-gray-900 flex-1 text-right">{money(item.unitPrice)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 font-semibold w-16">Total</span>
                      <span className="text-gray-300">:</span>
                      <span className="font-bold text-[#10B981] flex-1 text-right">{money(item.lineTotal ?? (item.unitPrice * item.quantity))}</span>
                    </div>
                    
                    <div className="pt-2">
                      <button className="w-full py-2 rounded-xl border border-[#10B981] text-[#10B981] bg-white hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Buy Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping + Payment row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Shipping Information */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Shipping Information</h3>
              </div>

              <div className="flex gap-4 flex-1">
                <div className="flex-1 space-y-2 text-[10px]">
                  {[
                    { icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>, label: 'Name', value: order.recipientName || order.customerName },
                    { icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>, label: 'Phone',   value: order.recipientPhone || order.customerPhone },
                    { icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>, label: 'Address', value: order.shippingAddress },
                    { icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>, label: 'City',           value: order.shippingCity },
                    { icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>, label: 'Code',    value: order.postalCode },
                    { icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, label: 'Country',        value: order.country || 'Nepal' },
                  ].map(({ icon, label, value }) => value && (
                    <div key={label} className="flex gap-1.5 items-center">
                      <span className="w-20 text-gray-500 flex-shrink-0 flex items-center gap-1.5 font-semibold uppercase tracking-wider">{icon} {label}</span>
                      <span className="text-gray-300">:</span>
                      <span className="text-gray-900 font-bold flex-1 truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Map pin */}
                <div className="w-16 h-16 rounded-xl bg-blue-50 relative overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0" style={{backgroundImage: 'linear-gradient(#dbeafe 1px, transparent 1px), linear-gradient(90deg, #dbeafe 1px, transparent 1px)', backgroundSize: '12px 12px', transform: 'rotate(20deg) scale(1.5)'}}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-6 h-6 text-[#10B981] drop-shadow-md z-10 relative" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                      </svg>
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/10 blur-[1px] rounded-[100%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Payment Info</h3>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${paymentBadge}`}>
                  {paymentLabel}
                </span>
              </div>

              <div className="space-y-1.5 text-[10px] flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider w-[100px]">Method</span>
                  <span className="text-gray-300">:</span>
                  <span className="font-bold text-gray-900 flex items-center gap-1.5 flex-1 justify-end">
                    {isEsewa && <span className="text-white bg-[#60bb46] rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] italic font-black">e</span>}
                    {isKhalti && <span className="text-white bg-[#5c2d91] rounded-sm w-3.5 h-3.5 flex items-center justify-center text-[8px] font-black">K</span>}
                    {isEsewa ? 'eSewa Wallet' : isKhalti ? 'Khalti Wallet' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider w-[100px]">Status</span>
                  <span className="text-gray-300">:</span>
                  <span className={`font-bold flex-1 text-right ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-gray-900'}`}>{paymentLabel}</span>
                </div>
                {order.transactionUuid && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold uppercase tracking-wider w-[100px]">Trans. ID</span>
                    <span className="text-gray-300">:</span>
                    <span className="font-bold text-gray-900 flex-1 text-right truncate pl-2" title={order.transactionUuid}>{order.transactionUuid}</span>
                  </div>
                )}

                <div className="pt-2.5 mt-2.5 border-t border-gray-100 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Subtotal</span><span className="text-gray-300">:</span><span className="font-bold text-gray-900 w-20 text-right">{money(order.itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Shipping Fee</span><span className="text-gray-300">:</span><span className="font-bold text-gray-900 w-20 text-right">{money(order.shippingFee)}</span>
                  </div>
                  {order.discountTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">Discount</span><span className="text-gray-300">:</span><span className="font-bold text-red-500 w-20 text-right">- {money(order.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-1.5 pt-1.5 text-[11px]">
                    <span className="font-black text-gray-900 uppercase tracking-wider">Total</span><span className="text-gray-300">:</span><span className="font-black text-emerald-600 w-20 text-right">{money(order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          {order.sellerStoreName && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Seller Information</h3>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-black text-[9px] text-center leading-tight flex-shrink-0">
                    TECH<br/>HUB
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-black text-gray-900">{order.sellerStoreName}</span>
                      <svg className="w-3.5 h-3.5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stars rating={4.8} />
                      <span className="text-[10px] text-gray-500 font-bold">4.8 (1,250 Reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <button className="py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[9px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    Contact Seller
                  </button>
                  <button className="py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-[9px] uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                    Visit Store
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Customer Notes</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {order.customerNotes}
              </p>
            </div>
          )}

          {/* You May Also Like */}
          {relatedProducts.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">You May Also Like</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {relatedProducts.slice(0, 6).map(p => (
                  <Link key={p.productId || p.id} to={getProductLink(p)} className="flex-shrink-0 w-36 group">
                    <div className="w-full h-28 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden mb-2.5 group-hover:border-emerald-300 transition-colors p-2 flex items-center justify-center">
                      {p.imagePath || p.images?.[0]
                        ? <img src={getImgUrl(p.imagePath || p.images?.[0])} className="max-w-full max-h-full object-contain" alt={p.name} />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>
                      }
                    </div>
                    <p className="text-[11px] font-black text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stars rating={p.rating || 4.5} />
                      <span className="text-[9px] text-gray-500 font-bold">{p.rating || '4.5'}</span>
                    </div>
                    <p className="text-xs font-black text-[#10B981] mt-1">{money(p.price || p.salePrice)}</p>
                    <button className="w-full mt-2 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer">
                      Add to Cart
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">

          {/* Order Summary */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Order Summary</h3>
            </div>
            
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold">Items Total</span>
                <span className="text-gray-300">:</span>
                <span className="font-bold text-gray-900 w-20 text-right">{money(order.itemsTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold">Shipping Fee</span>
                <span className="text-gray-300">:</span>
                <span className="font-bold text-gray-900 w-20 text-right">{money(order.shippingFee)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Discount</span>
                  <span className="text-gray-300">:</span>
                  <span className="font-bold text-red-500 w-20 text-right">- {money(order.discountTotal)}</span>
                </div>
              )}
              {order.vatAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Tax (13%)</span>
                  <span className="text-gray-300">:</span>
                  <span className="font-bold text-gray-900 w-20 text-right">{money(order.vatAmount)}</span>
                </div>
              )}
              
              <div className="pt-3 mt-2 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Grand Total</span>
                <span className="text-lg font-black text-[#10B981]">{money(order.grandTotal)}</span>
              </div>
            </div>

            {/* Action buttons embedded in summary */}
            <div className="mt-5 space-y-2">
              {order.status === 'DRAFT' && order.paymentStatus !== 'PAID' && (
                <div className="space-y-2 mb-2 pt-2 border-t border-gray-100">
                  <button onClick={() => handleRetry('ESEWA')} disabled={!!busyId} className="w-full py-2 rounded-xl bg-[#60bb46] hover:bg-[#4da038] text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black italic">e</span>Pay with eSewa
                  </button>
                  <button onClick={() => handleRetry('KHALTI')} disabled={!!busyId} className="w-full py-2 rounded-xl bg-[#5c2d91] hover:bg-[#4a2275] text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                    <span className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center text-[9px] font-black">K</span>Pay with Khalti
                  </button>
                </div>
              )}
              {order.status === 'DELIVERED' && (
                <button onClick={() => setRefundModalOpen(true)} className="w-full py-2 rounded-xl bg-[#e6f7ec] border border-[#10B981]/20 text-[#10B981] font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm">
                  Request Refund / Exchange
                </button>
              )}
              {['DELIVERED', 'SHIPPED'].includes(order.status) && (
                <button onClick={() => setDisputeOpen(true)} className="w-full py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 font-bold text-[10px] uppercase tracking-widest hover:bg-violet-100 transition-colors cursor-pointer">
                  Open Dispute
                </button>
              )}
              {CANCELLABLE.includes(order.status) && (
                <button onClick={handleCancel} disabled={busyId === order.orderId} className="w-full py-2 rounded-xl border border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60">
                  {busyId === order.orderId ? '...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#e6f7ec] text-[#1e8a44] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </div>
              <div className="pt-0.5">
                <h3 className="text-xs font-black text-gray-900 mb-0.5 uppercase tracking-wider">Need Help?</h3>
                <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">Questions about your order? Our team is ready to help.</p>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Contact Support
            </button>
          </div>

          {/* Trust Badges */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
            {[
              { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>, title: 'Secure Payment', desc: 'Payments are safe & encrypted.' },
              { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>, title: 'Fast Delivery',  desc: 'We deliver quickly & safely.' },
              { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,  title: 'Easy Returns',   desc: '7-day easy return policy.' },
            ].map(b => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e6f7ec] text-[#10B981] flex items-center justify-center flex-shrink-0">
                  {b.icon}
                </div>
                <div className="pt-0.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-gray-900 mb-0.5">{b.title}</p>
                  <p className="text-[9px] text-gray-500 font-semibold">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Dispute Modal ══ */}
      {disputeOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-[#f6f0ff] px-5 py-4">
              <div>
                <h3 className="text-sm font-black text-gray-900">⚖️ File Dispute Ticket</h3>
                <p className="mt-1 text-xs font-semibold text-gray-500">Escalate an issue for Order {order.customOrderId || `#${order.orderId}`}.</p>
              </div>
              <button onClick={() => setDisputeOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors" type="button">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleDisputeSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">Dispute Type</label>
                <select value={disputeType} onChange={e => setDisputeType(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-violet-400" required>
                  <option value="NOT_RECEIVED">Item Not Received</option>
                  <option value="DAMAGED">Damaged Item Received</option>
                  <option value="COUNTERFEIT">Counterfeit / Fake Product</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">Describe the Issue</label>
                <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-violet-400 min-h-[80px]" placeholder="Describe the issue in detail…" required />
              </div>
              {disputeError   && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{disputeError}</div>}
              {disputeSuccess && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{disputeSuccess}</div>}
              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" onClick={() => setDisputeOpen(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">Cancel</button>
                <button type="submit" disabled={disputeSubmitting || !disputeReason.trim()} className="rounded-lg bg-[#5c2d91] px-5 py-2 text-xs font-black text-white hover:bg-[#4a2275] disabled:opacity-50 cursor-pointer transition-colors">
                  {disputeSubmitting ? 'Submitting…' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      <CreateRefundModal isOpen={refundModalOpen} onClose={() => setRefundModalOpen(false)} order={order} onCreated={() => { setRefundModalOpen(false); onRefundRequested?.(); }} />

      {/* Hidden eSewa form */}
      {esewaData && (
        <form ref={esewaFormRef} action={esewaData.paymentUrl} method="POST" style={{ display: 'none' }}>
          {Object.entries(esewaData).filter(([k]) => k !== 'paymentUrl').map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </form>
      )}
    </div>
  );
}
