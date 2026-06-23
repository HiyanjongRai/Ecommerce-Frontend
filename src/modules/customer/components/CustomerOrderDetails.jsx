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
const APP_ORIGIN = window.location.origin;

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
      <div className="bg-red-50 border border-red-200 rounded-[20px] p-5 text-center text-xs font-bold text-red-605 uppercase tracking-wider shadow-sm">
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
    <div id="order-tracking-timeline" className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] mb-6 scroll-mt-6">
      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute top-[22px] left-[5%] right-[5%] h-[4px] bg-gray-100 rounded-full -translate-y-1/2" />
        
        {/* Progress Line Active */}
        <div 
          className="absolute top-[22px] left-[5%] h-[4px] bg-[#16A34A] rounded-full -translate-y-1/2 transition-all duration-500" 
          style={{ width: `${(Math.min(stepIdx, TRACK_STEPS.length - 1) / (TRACK_STEPS.length - 1)) * 90}%` }}
        />
        
        <div className="relative flex justify-between items-start">
          {TRACK_STEPS.map((step, idx) => {
            const isCompleted = idx < stepIdx;
            const isCurrent = idx === stepIdx;
            const isUpcoming = idx > stepIdx;
            const done = idx <= stepIdx;
            const date = stepDates[idx];

            return (
              <div key={step.key} className="flex flex-col items-center flex-1 text-center z-10 relative">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ring-[6px] ring-white ${
                  isCompleted 
                    ? 'bg-[#16A34A] text-white shadow-md' 
                    : isCurrent 
                      ? 'bg-emerald-50 border-2 border-[#16A34A] text-[#16A34A] shadow-md ring-[6px] ring-emerald-50/50' 
                      : 'bg-white border border-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <div className="pt-3 max-w-[120px] mx-auto">
                  <p className={`text-[11px] uppercase tracking-wider font-bold leading-tight ${
                    isCurrent ? 'text-[#16A34A]' : done ? 'text-slate-800' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {date ? (
                    <p className="text-[11px] text-gray-500 font-semibold mt-1">{fmtDate(date)}</p>
                  ) : (
                    <div className="h-4"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
      setEsewaData({ amount: amt, tax_amount: '0.00', total_amount: amt, transaction_uuid: uuid, product_code: sig.productCode, product_service_charge: '0.00', product_delivery_charge: '0.00', success_url: `${APP_ORIGIN}/payment/success`, failure_url: `${APP_ORIGIN}/payment/failure`, signed_field_names: 'total_amount,transaction_uuid,product_code', signature: sig.signature, paymentUrl: sig.paymentUrl });
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

      {/* ── Header Card ── */}
      <div className="bg-white rounded-[20px] p-5 mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-800 leading-tight tracking-tight">Order Details</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                Order ID: <span className="text-slate-800 font-semibold">{order.customOrderId || `#${order.orderId}`}</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                Placed on: <span className="text-slate-800 font-semibold">{fmtDate(order.createdAt)}</span>
              </span>
            </div>
          </div>
          <div className="text-right flex flex-col items-start sm:items-end gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge}`}>
              {order.status === 'DELIVERED' && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
              {statusLabel}
            </span>
            {order.status === 'DELIVERED' && order.deliveredAt && (
              <span className="text-xs text-gray-500 font-semibold">
                Delivered on {fmtDate(order.deliveredAt)}
              </span>
            )}
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'FAILED' && (
              <span className="text-xs text-gray-500 font-medium">
                Est. Delivery: {fmtDate(order.deliveredAt || new Date(new Date(order.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Standalone Progress Tracker timeline ── */}
      <StepTracker order={order} />

      {/* ── Main 2-col layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* ─── LEFT COLUMN ─── */}
        <div className="flex-1 min-w-0 w-full space-y-4">

          {/* Product Information */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-[18px] font-bold text-slate-800">Product Details</h3>
            </div>

            {order.items && order.items.map((item, idx) => (
              <div key={idx} className={`flex flex-col md:flex-row gap-5 items-start ${idx > 0 ? 'pt-5 mt-5 border-t border-gray-100' : ''}`}>
                {/* Image */}
                <div className="w-24 h-24 bg-gray-50 border border-gray-150 rounded-xl flex-shrink-0 flex items-center justify-center p-2 overflow-hidden">
                  {item.imagePath
                    ? <img src={getImgUrl(item.imagePath)} className="max-w-full max-h-full object-contain rounded-lg" alt={item.name} />
                    : <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  }
                </div>

                {/* Info grid */}
                <div className="flex-1 w-full flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="text-[15px] font-semibold text-slate-800 leading-snug">{item.name || `Product #${item.productId}`}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
                      {item.brand && (
                        <p>
                          Brand: <span className="text-[#16A34A] font-semibold">{item.brand}</span>
                        </p>
                      )}
                      {item.category && <p>Category: <span className="text-slate-800 font-semibold">{item.category}</span></p>}
                      {item.variantLabel && <p>Variant: <span className="text-slate-800 font-semibold">{item.variantLabel}</span></p>}
                      <p>Color: <span className="text-slate-800 font-semibold">{item.color || 'Standard'}</span></p>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Stars rating={item.rating || 4.8} />
                      <span className="text-[11px] text-gray-500 font-bold">({item.rating || '4.8'})</span>
                    </div>

                    {order.status === 'DELIVERED' && order.deliveredAt && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[#16A34A] text-[10px] font-bold uppercase tracking-wider mt-1">
                        ✓ Delivered
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 md:w-52 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Quantity</span>
                      <span className="font-bold text-slate-800 px-2 py-0.5 rounded-full bg-slate-100 text-[10px]">{item.quantity}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Price</span>
                      <span className="font-bold text-slate-800">{money(item.unitPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Total</span>
                      <span className="font-bold text-[#16A34A]">{money(item.lineTotal ?? (item.unitPrice * item.quantity))}</span>
                    </div>
                    
                    <div className="pt-2 flex flex-col gap-1.5">
                      {/* Track Order Button */}
                      <button 
                        onClick={() => {
                          const el = document.getElementById('order-tracking-timeline');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Track Order
                      </button>

                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Buy Again Button */}
                        <button className="py-1.5 rounded-lg border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                          Buy Again
                        </button>
                        {/* Write Review Button */}
                        <Link 
                          to="/customer/reviews"
                          state={{ 
                            productId: item.productId,
                            productName: item.name,
                            imagePath: item.imagePath
                          }}
                          className="py-1.5 rounded-lg border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                        >
                          Write Review
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping + Payment row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Shipping Information */}
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-[15px] font-semibold text-slate-800">Shipping To</h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start flex-1 justify-between">
                <div className="space-y-3 flex-1 text-sm text-slate-600 font-medium">
                  {/* Name */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">👤</span>
                    <span className="text-slate-800 font-bold">{order.recipientName || order.customerName || '—'}</span>
                  </div>
                  {/* Phone */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📞</span>
                    <span>{order.recipientPhone || order.customerPhone || '—'}</span>
                  </div>
                  {/* Address */}
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg">📍</span>
                    <div className="flex-1">
                      <p className="leading-snug text-slate-800">{order.shippingAddress || '—'}</p>
                      <p className="text-xs text-gray-505 mt-0.5">
                        {[order.shippingCity, order.postalCode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                  {/* Country */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🌎</span>
                    <span>{order.country || 'Nepal'}</span>
                  </div>
                </div>

                {/* Map pin decorator */}
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 relative overflow-hidden flex-shrink-0 self-center hidden sm:block">
                  <div className="absolute inset-0" style={{backgroundImage: 'linear-gradient(#a7f3d0 1px, transparent 1px), linear-gradient(90deg, #a7f3d0 1px, transparent 1px)', backgroundSize: '10px 10px', transform: 'rotate(15deg) scale(1.5)'}} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-7 h-7 text-[#16A34A] drop-shadow-md z-10 relative" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                      </svg>
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/10 blur-[1px] rounded-[100%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <h3 className="text-[15px] font-semibold text-slate-800">Payment Details</h3>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${paymentBadge}`}>
                  {paymentLabel}
                </span>
              </div>

              <div className="space-y-3.5 text-xs flex-1 text-slate-600 font-medium">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    {isEsewa && <span className="text-white bg-[#60bb46] rounded-full w-4 h-4 flex items-center justify-center text-[9px] italic font-black">e</span>}
                    {isKhalti && <span className="text-white bg-[#5c2d91] rounded-sm w-4 h-4 flex items-center justify-center text-[9px] font-black">K</span>}
                    {isEsewa ? 'eSewa Wallet' : isKhalti ? 'Khalti Wallet' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500">Payment Status</span>
                  <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-emerald-650 font-bold' : 'text-slate-800'}`}>{paymentLabel}</span>
                </div>
                {order.transactionUuid && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono font-semibold text-slate-800 select-all truncate max-w-[150px] pl-2" title={order.transactionUuid}>{order.transactionUuid}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500">Paid Date</span>
                  <span className="font-semibold text-slate-800">
                    {order.paymentStatus === 'PAID' ? fmtDateTime(order.confirmedAt || order.createdAt) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold text-slate-800">{money(order.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          {order.sellerStoreName && (
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-[15px] font-semibold text-slate-800">Merchant Information</h3>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[10px] text-center leading-tight flex-shrink-0">
                    {order.sellerStoreName.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-800">{order.sellerStoreName}</span>
                      <svg className="w-4 h-4 text-[#16A34A]" fill="currentColor" viewBox="0 0 20 20" title="Verified Merchant">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[11px] text-emerald-650 font-semibold">Verified Store Partner</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-gray-100 py-3 text-slate-650 font-medium">
                  <div>
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Rating</p>
                    <p className="text-slate-850 font-bold flex items-center gap-1">4.8 <span className="text-yellow-400">★</span></p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Reviews</p>
                    <p className="text-slate-850 font-bold">1,250+ claims</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Response Rate</p>
                    <p className="text-emerald-650 font-bold">98.5% (Fast)</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Partner Since</p>
                    <p className="text-slate-850 font-bold">2022</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button className="flex-1 py-2 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat Seller
                  </button>
                  <button className="flex-1 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    Visit Store
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-[15px] font-semibold text-slate-800">Customer Instructions</h3>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                {order.customerNotes}
              </p>
            </div>
          )}

          {/* You May Also Like */}
          {relatedProducts.length > 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-[18px] font-bold text-slate-800">You May Also Like</h3>
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
                    <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-[#16A34A] transition-colors">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stars rating={p.rating || 4.5} />
                      <span className="text-[9px] text-gray-500 font-bold">{p.rating || '4.5'}</span>
                    </div>
                    <p className="text-xs font-black text-[#16A34A] mt-1">{money(p.price || p.salePrice)}</p>
                    <button className="w-full mt-2 py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer">
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
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-150">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-[15px] font-semibold text-slate-800">Order Summary</h3>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-650 font-medium">
              <div className="flex justify-between items-center">
                <span>Subtotal ({order.items?.length || 0} items)</span>
                <span className="text-slate-800 font-semibold">{money(order.itemsTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shipping Fee</span>
                <span className="text-slate-800 font-semibold">
                  {order.shippingFee > 0 ? money(order.shippingFee) : <span className="text-[#16A34A] font-bold">FREE</span>}
                </span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span>Discount</span>
                  <span className="text-red-500 font-semibold">- {money(order.discountTotal)}</span>
                </div>
              )}
              {order.vatAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span>Tax (Included)</span>
                  <span className="text-slate-800 font-semibold">{money(order.vatAmount)}</span>
                </div>
              )}
              
              <div className="pt-4 mt-3 border-t border-gray-150">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Grand Total</span>
                  <span className="text-[32px] font-bold text-[#16A34A] leading-none tracking-tight">{money(order.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons embedded in summary */}
            <div className="mt-5 space-y-2">
              {order.status === 'DRAFT' && order.paymentStatus !== 'PAID' && (
                <div className="space-y-2 mb-2 pt-2 border-t border-gray-100">
                  <button onClick={() => handleRetry('ESEWA')} disabled={!!busyId} className="w-full py-2.5 rounded-xl bg-[#60bb46] hover:bg-[#4da038] text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black italic">e</span>Pay with eSewa
                  </button>
                  <button onClick={() => handleRetry('KHALTI')} disabled={!!busyId} className="w-full py-2.5 rounded-xl bg-[#5c2d91] hover:bg-[#4a2275] text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                    <span className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center text-[9px] font-black">K</span>Pay with Khalti
                  </button>
                </div>
              )}
              
              {['DELIVERED', 'SHIPPED'].includes(order.status) && (
                <button onClick={() => setDisputeOpen(true)} className="w-full py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-755 font-bold text-[10px] uppercase tracking-widest hover:bg-violet-100 transition-colors cursor-pointer">
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

          {/* Refund / Return eligibility information */}
          {order.status === 'DELIVERED' && (
            <div className="bg-[#F8FAF7] border border-[#E5E7EB] rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="text-base">🔄</span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Return & Refund</h4>
              </div>
              <div className="space-y-1.5 text-xs text-slate-650 font-medium">
                <div className="flex justify-between">
                  <span>Return Status:</span>
                  <span className="text-[#16A34A] font-bold">Eligible</span>
                </div>
                <div className="flex justify-between">
                  <span>Eligible Until:</span>
                  <span className="text-slate-850 font-semibold">
                    {fmtDate(new Date(new Date(order.deliveredAt || order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000))}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                Items are eligible for return/replacement within 7 days of successful delivery.
              </p>
              <button 
                onClick={() => setRefundModalOpen(true)} 
                className="w-full py-2 rounded-xl bg-emerald-50 border border-[#16A34A]/25 text-[#16A34A] font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
              >
                Request Return / Exchange
              </button>
            </div>
          )}

          {/* Need Help */}
          <div className="bg-[#F8FAF7] border border-[#E5E7EB] rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
            <div>
              <h4 className="text-[15px] font-bold text-slate-800">Need Assistance?</h4>
              <p className="text-xs text-gray-500 font-medium mt-1">Questions about your order? Our support team can assist with:</p>
            </div>
            
            <ul className="space-y-2 text-xs text-slate-650 font-semibold">
              <li className="flex items-center gap-2">
                <span className="text-[#16A34A] text-sm">•</span> Tracking & shipping status
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#16A34A] text-sm">•</span> Damaged/defective item refund
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#16A34A] text-sm">•</span> Direct merchant escalation
              </li>
            </ul>

            <button className="w-full py-2.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Contact Support
            </button>
          </div>

          {/* Trust Badges */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[#16A34A] text-sm font-bold mb-0.5">✓</span>
                <span className="text-[11px] font-bold text-slate-800">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[#16A34A] text-sm font-bold mb-0.5">✓</span>
                <span className="text-[11px] font-bold text-slate-800">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[#16A34A] text-sm font-bold mb-0.5">✓</span>
                <span className="text-[11px] font-bold text-slate-800">Buyer Protection</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[#16A34A] text-sm font-bold mb-0.5">✓</span>
                <span className="text-[11px] font-bold text-slate-800">Easy Returns</span>
              </div>
            </div>
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
