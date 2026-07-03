import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  cancelOrder, retryPayment, changePaymentMethod,
  getEsewaSignature, initiateKhaltiPayment, openDispute,
  getProducts
} from '../api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { getProductLink } from '../../../shared/utils/slugHelper';
import CreateRefundModal from '../components/CreateRefundModal';

/* ── helpers ─────────────────────────────────────────── */
const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

const money = (v) => (v != null ? `Rs. ${Number(v).toLocaleString()}` : '—');

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

/* ── constants ──────────────────────────────────────── */
const STATUS_BADGE = {
  DRAFT: 'bg-amber-50 text-amber-700',
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-indigo-50 text-indigo-700',
  PACKED: 'bg-violet-50 text-violet-700',
  SHIPPED: 'bg-sky-50 text-sky-700',
  DELIVERED: 'bg-[#e6f7ec] text-[#1e8a44]',
  CANCELLED: 'bg-red-50 text-red-600',
  REFUNDED: 'bg-orange-50 text-orange-600',
  FAILED: 'bg-red-50 text-red-600',
};

const STATUS_LABEL = {
  DRAFT: 'Awaiting Payment',
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
  COD_PENDING: 'Pay on Delivery',
};

const PAYMENT_LABEL = {
  PAID: 'Paid',
  COD_PENDING: 'Pay on Delivery',
  PENDING_COD: 'Pay on Delivery',
  REQUIRES_PAYMENT: 'Payment Required',
  PAYMENT_INITIATED: 'Processing',
  REFUND_PENDING: 'Refund Processing',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  COD_REMITTED: 'Collected (Cash)',
  COD_FAILED: 'COD Failed',
};

const CANCELLABLE = ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING'];
const APP_ORIGIN = window.location.origin;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/* ── 5-step horizontal tracker (compact, matches reference) ── */
const TRACK_STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'transit', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const getStepIndex = (status) => {
  switch (status) {
    case 'DRAFT':
    case 'PENDING':
      return 0;
    case 'CONFIRMED':
      return 0;
    case 'PROCESSING':
      return 1;
    case 'PACKED':
      return 1;
    case 'SHIPPED':
      return 2;
    case 'DELIVERED':
      return 4;
    default:
      return status === 'CANCELLED' || status === 'FAILED' ? -1 : 0;
  }
};

const TruckIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3V7zm11 3h4l3 3v2h-7v-5zM6.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm12 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
  </svg>
);

const CheckIcon = (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CalendarIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const STEP_ICON = [CheckIcon, CheckIcon, TruckIcon, TruckIcon, CalendarIcon];

const StepTracker = ({ order }) => {
  const stepIdx = getStepIndex(order.status);

  if (stepIdx === -1) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-xs font-bold text-red-600 uppercase tracking-wider">
        This order has been {STATUS_LABEL[order.status] || order.status}.
      </div>
    );
  }

  const stepDates = [
    order.confirmedAt || order.createdAt,
    stepIdx >= 1 ? order.processedAt || order.createdAt : null,
    order.shippedAt,
    stepIdx >= 3 ? order.outForDeliveryAt : null,
    order.deliveredAt,
  ];

  const expectedDelivery = order.deliveredAt
    ? null
    : fmtDate(new Date(new Date(order.createdAt).getTime() + 4 * MS_PER_DAY));

  const inTransit = stepIdx >= 2 && stepIdx < 4;

  return (
    <div id="order-tracking-timeline" className="bg-white border border-gray-200 rounded-xl p-6 mb-4 scroll-mt-6">
      <h3 className="text-[15px] font-bold text-slate-800 mb-6">Order Status</h3>

      <div className="relative px-2">
        <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-gray-200" />
        <div
          className="absolute top-[18px] left-[10%] h-[2px] bg-[#16A34A] transition-all duration-500"
          style={{ width: `${(Math.min(stepIdx, TRACK_STEPS.length - 1) / (TRACK_STEPS.length - 1)) * 80}%` }}
        />

        <div className="relative flex justify-between">
          {TRACK_STEPS.map((step, idx) => {
            const isCompleted = idx < stepIdx;
            const isCurrent = idx === stepIdx;
            const done = idx <= stepIdx;
            const date = stepDates[idx];

            return (
              <div key={step.key} className="flex flex-col items-center flex-1 text-center z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ring-4 ring-white ${isCompleted
                      ? 'bg-[#16A34A] text-white'
                      : isCurrent
                        ? 'bg-white border-2 border-[#16A34A] text-[#16A34A]'
                        : 'bg-white border border-gray-200 text-gray-300'
                    }`}
                >
                  {isCompleted || isCurrent ? STEP_ICON[idx] : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                </div>
                <p className={`text-[11px] font-semibold mt-2 leading-tight ${done ? 'text-slate-800' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{date ? fmtDate(date) : '—'}</p>
              </div>
            );
          })}
        </div>
      </div>

      {inTransit && (
        <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-[#16A34A] flex-shrink-0">{TruckIcon}</span>
          <div>
            <p className="text-xs font-bold text-[#16A34A]">Your order is on the way!</p>
            {expectedDelivery && (
              <p className="text-[11px] text-emerald-700 font-medium">Your package is expected to be delivered on {expectedDelivery}.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Star rating ────────────────────────────────────── */
const Stars = ({ rating = 0 }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-[#ffc107]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </span>
);

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function CustomerOrderDetails({ order, onBack, busyId, setBusyId, onRefundRequested }) {
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeType, setDisputeType] = useState('OTHER');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);

  const esewaFormRef = useRef(null);
  const [esewaData, setEsewaData] = useState(null);

  useEffect(() => {
    if (esewaData && esewaFormRef.current) esewaFormRef.current.submit();
  }, [esewaData]);

  useEffect(() => {
    getProducts({ page: 0, size: 8 })
      .then((r) => setRelatedProducts(Array.isArray(r.data?.content) ? r.data.content : []))
      .catch(() => setRelatedProducts([]));
  }, []);

  if (!order) return null;

  const deliveredAtDate = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const returnWindowDays = Number(order.returnWindowDays || 7);
  const returnDeadline = deliveredAtDate
    ? new Date(deliveredAtDate.getTime() + returnWindowDays * 24 * 60 * 60 * 1000)
    : null;
  const canCreateRefund = order.status === 'DELIVERED' && (!returnDeadline || returnDeadline >= new Date());
  const refundDisabledReason = order.status !== 'DELIVERED'
    ? 'Refunds are available after delivery.'
    : 'This order is outside the return window.';

  /* payment helpers */
  const pm = String(order.paymentMethod || '').toUpperCase();
  const isEsewa = pm === 'ESEWA';
  const isKhalti = pm === 'KHALTI';

  /* cancel */
  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setBusyId(order.orderId);
    try {
      await cancelOrder(order.orderId);
      await onRefundRequested?.();
      onBack();
    } catch (e) {
      alert(e.response?.data?.message || 'Cancel failed');
    }
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
      const sig = (await getEsewaSignature({ amount: amt, transactionUuid: uuid, orderIds: [order.orderId] })).data;
      setEsewaData({
        amount: amt,
        tax_amount: '0.00',
        total_amount: amt,
        transaction_uuid: uuid,
        product_code: sig.productCode,
        product_service_charge: '0.00',
        product_delivery_charge: '0.00',
        success_url: `${APP_ORIGIN}/payment/success`,
        failure_url: `${APP_ORIGIN}/payment/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: sig.signature,
        paymentUrl: sig.paymentUrl,
      });
    } catch (e) {
      alert(e.response?.data?.message || 'Payment failed.');
    } finally {
      setBusyId(null);
    }
  };

  /* dispute */
  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      setDisputeError('Please describe your dispute.');
      return;
    }
    setDisputeSubmitting(true);
    setDisputeError('');
    setDisputeSuccess('');
    try {
      await openDispute({ orderId: order.orderId, type: disputeType, description: disputeReason.trim() });
      setDisputeSuccess('Dispute ticket opened! Track it under My Disputes.');
      await onRefundRequested?.();
      setTimeout(() => setDisputeOpen(false), 1500);
    } catch (err) {
      setDisputeError(err.response?.data?.message || 'Failed.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handlePrintInvoice = () => window.print();

  const statusBadge = STATUS_BADGE[order.status] || 'bg-gray-50 text-gray-500';
  const statusLabel = STATUS_LABEL[order.status] || order.status;
  const paymentBadge = STATUS_BADGE[order.paymentStatus] || 'bg-gray-50 text-gray-500';
  const paymentLabel = PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus || 'Pending';
  const itemCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;

  return (
    <div className="pb-10 font-sans text-gray-800 animate-in fade-in duration-200">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-4">
        <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <span>›</span>
        <Link to="/customer/account" className="hover:text-emerald-600 transition-colors">My Account</Link>
        <span>›</span>
        <span className="hover:text-emerald-600 cursor-pointer transition-colors" onClick={onBack}>My Orders</span>
        <span>›</span>
        <span className="text-gray-700">Order Details</span>
      </nav>

      {/* ── Header row ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-899">Order Details</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Order ID: <span className="font-semibold text-slate-700">{order.customOrderId || `#${order.orderId}`}</span>
            <span className="mx-1.5 text-gray-300">|</span>
            Placed on <span className="font-semibold text-slate-700">{fmtDateTime(order.createdAt)}</span>
          </p>
        </div>
        <button
          onClick={handlePrintInvoice}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 001 1zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>

      {/* ── 2-col layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* ─── LEFT COLUMN ─── */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Order Status tracker + banner */}
          <StepTracker order={order} />

          {/* Order Items */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-slate-800 mb-4">Order Items</h3>

            <div className="divide-y divide-gray-100">
              {order.items &&
                order.items.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-150 rounded-lg flex-shrink-0 flex items-center justify-center p-1.5 overflow-hidden">
                      {item.imagePath ? (
                        <img src={getImgUrl(item.imagePath)} className="max-w-full max-h-full object-contain rounded" alt={item.name} />
                      ) : (
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 leading-snug truncate">{item.name || `Product #${item.productId}`}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {[item.variantLabel, item.color].filter(Boolean).join(', ') || 'Standard'}
                        </p>
                        {item.warrantyMonths && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-semibold text-gray-600">
                            {item.warrantyMonths >= 12 ? `${Math.round(item.warrantyMonths / 12)} Year Warranty` : `${item.warrantyMonths} Month Warranty`}
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-800">{money(item.lineTotal ?? item.unitPrice * item.quantity)}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Item-level actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  const el = document.getElementById('order-tracking-timeline');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wide transition-colors cursor-pointer"
              >
                Track Order
              </button>
              <button className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 font-bold text-[11px] uppercase tracking-wide transition-colors cursor-pointer">
                Buy Again
              </button>
              {order.items?.[0] && (
                <Link
                  to="/customer/reviews"
                  state={{ productId: order.items[0].productId, productName: order.items[0].name, imagePath: order.items[0].imagePath }}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 font-bold text-[11px] uppercase tracking-wide transition-colors cursor-pointer"
                >
                  Write Review
                </Link>
              )}
            </div>

            {/* Inline subtotal block (mirrors the items card footer in the reference) */}
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-1.5 text-xs text-slate-600 font-medium max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800 font-semibold">{money(order.itemsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-slate-800 font-semibold">{order.shippingFee > 0 ? money(order.shippingFee) : 'FREE'}</span>
              </div>
              {order.vatAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="text-slate-800 font-semibold">{money(order.vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-gray-100">
                <span className="font-bold text-slate-800">Total Amount</span>
                <span className="font-bold text-slate-900">{money(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          {order.sellerStoreName && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-[15px] font-bold text-slate-800 mb-4">Merchant Information</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                  {order.sellerStoreName.substring(0, 3).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800">{order.sellerStoreName}</span>
                    <svg className="w-4 h-4 text-[#16A34A]" fill="currentColor" viewBox="0 0 20 20" title="Verified Merchant">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Verified Store Partner</span>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button className="flex-1 py-2 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer">
                  Chat Seller
                </button>
                <button className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-bold text-xs uppercase tracking-wide hover:bg-gray-50 transition-colors cursor-pointer">
                  Visit Store
                </button>
              </div>
            </div>
          )}

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-[15px] font-bold text-slate-800 mb-2">Customer Instructions</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{order.customerNotes}</p>
            </div>
          )}

          {/* Easy Returns banner */}
          {order.status === 'DELIVERED' && (
            <div className="bg-[#F2FBF5] border border-emerald-100 rounded-xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-[#16A34A] flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Easy Returns</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {canCreateRefund
                      ? `Not satisfied with your order? You can return items within ${returnWindowDays} days.`
                      : refundDisabledReason}
                  </p>
                </div>
              </div>
              <button
                onClick={() => canCreateRefund && setRefundModalOpen(true)}
                disabled={!canCreateRefund}
                className="flex-shrink-0 text-[#16A34A] font-bold text-xs hover:underline cursor-pointer whitespace-nowrap disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                Start a Return →
              </button>
            </div>
          )}

          {/* You May Also Like */}
          {relatedProducts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-[15px] font-bold text-slate-800 mb-4">You May Also Like</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {relatedProducts.slice(0, 6).map((p) => (
                  <Link key={p.productId || p.id} to={getProductLink(p)} className="flex-shrink-0 w-36 group">
                    <div className="w-full h-28 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden mb-2 group-hover:border-emerald-300 transition-colors p-2 flex items-center justify-center">
                      {p.imagePath || p.images?.[0] ? (
                        <img src={getImgUrl(p.imagePath || p.images?.[0])} className="max-w-full max-h-full object-contain" alt={p.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-[#16A34A] transition-colors">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stars rating={p.rating || 4.5} />
                      <span className="text-[9px] text-gray-500 font-bold">{p.rating || '4.5'}</span>
                    </div>
                    <p className="text-xs font-black text-[#16A34A] mt-1">{money(p.price || p.salePrice)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
          {/* Status badge card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Order Status</span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${statusBadge}`}>
              {statusLabel}
            </span>
          </div>

          {/* Delivery Address */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-slate-800">Delivery Address</h3>
              <button className="text-[11px] font-bold text-[#16A34A] hover:underline cursor-pointer">Edit</button>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-slate-800 font-bold">{order.recipientName || order.customerName || '—'}</p>
                <p className="leading-snug mt-0.5">{order.shippingAddress || '—'}</p>
                <p className="leading-snug">{[order.shippingCity, order.postalCode].filter(Boolean).join(', ')}</p>
                <p className="leading-snug">{order.country || 'Nepal'}</p>
                <p className="mt-1 text-slate-700 font-semibold">{order.recipientPhone || order.customerPhone || '—'}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-[14px] font-bold text-slate-800 mb-3">Payment Information</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-700 font-semibold">
                {isEsewa && <span className="text-white bg-[#60bb46] rounded-full w-5 h-5 flex items-center justify-center text-[9px] italic font-black">e</span>}
                {isKhalti && <span className="text-white bg-[#5c2d91] rounded-sm w-5 h-5 flex items-center justify-center text-[9px] font-black">K</span>}
                {!isEsewa && !isKhalti && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )}
                {isEsewa ? 'eSewa Wallet' : isKhalti ? 'Khalti Wallet' : 'Cash on Delivery'}
              </span>
              <span className="font-bold text-slate-800">{money(order.grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2.5 pt-2.5 border-t border-gray-100">
              <span className="text-gray-500 font-medium">Status</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${paymentBadge}`}>{paymentLabel}</span>
            </div>
            {order.transactionUuid && (
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-gray-500 font-medium">Transaction ID</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[140px]" title={order.transactionUuid}>
                  {order.transactionUuid}
                </span>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-[14px] font-bold text-slate-800 mb-3">Order Summary</h3>
            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="text-slate-800 font-semibold">{money(order.itemsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-slate-800 font-semibold">
                  {order.shippingFee > 0 ? money(order.shippingFee) : <span className="text-[#16A34A] font-bold">FREE</span>}
                </span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="text-red-500 font-semibold">- {money(order.discountTotal)}</span>
                </div>
              )}
              {order.vatAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="text-slate-800 font-semibold">{money(order.vatAmount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-150">
              <span className="text-sm font-bold text-slate-800">Total Amount</span>
              <span className="text-xl font-bold text-[#16A34A]">{money(order.grandTotal)}</span>
            </div>

            {/* Action buttons */}
            <div className="mt-4 space-y-2">
              {order.status === 'DRAFT' && order.paymentStatus !== 'PAID' && (
                <>
                  <button
                    onClick={() => handleRetry('ESEWA')}
                    disabled={!!busyId}
                    className="w-full py-2.5 rounded-lg bg-[#60bb46] hover:bg-[#4da038] text-white font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black italic">e</span>
                    Pay with eSewa
                  </button>
                  <button
                    onClick={() => handleRetry('KHALTI')}
                    disabled={!!busyId}
                    className="w-full py-2.5 rounded-lg bg-[#5c2d91] hover:bg-[#4a2275] text-white font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center text-[9px] font-black">K</span>
                    Pay with Khalti
                  </button>
                </>
              )}
              {['DELIVERED', 'SHIPPED'].includes(order.status) && (
                <button
                  onClick={() => setRefundModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Request Refund
                </button>
              )}
              {CANCELLABLE.includes(order.status) && (
                <button
                  onClick={handleCancel}
                  disabled={busyId === order.orderId}
                  className="w-full py-2 rounded-lg border border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-wide hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {busyId === order.orderId ? '...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-[14px] font-bold text-slate-800">Need Help?</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 mb-3.5">
              If you have any questions about your order, our support team is here to help.
            </p>
            <button className="w-full py-2 rounded-lg border border-emerald-200 text-[#16A34A] font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* ══ Dispute Modal ══ */}
      {disputeOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[510px] rounded-2xl bg-white shadow-2xl overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-gray-100">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 leading-tight">Open a Dispute</h2>
                <p className="mt-1.5 text-[13px] text-gray-500 leading-snug">
                  We're here to help resolve your issue.<br />
                  Please tell us what went wrong with your order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDisputeOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0 ml-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit}>
              <div className="px-6 pt-5 pb-2 space-y-5">

                {/* Alerts */}
                {disputeError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">{disputeError}</div>
                )}
                {disputeSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-700">{disputeSuccess}</div>
                )}

                {/* Dispute Type — styled exactly like "Select Item" card */}
                <div>
                  <p className="text-[13px] font-semibold text-gray-800 mb-2">Dispute Type</p>
                  <div className="relative">
                    <select
                      value={disputeType}
                      onChange={(e) => setDisputeType(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-medium text-gray-800 bg-white outline-none focus:border-gray-400 transition-colors pr-10 cursor-pointer"
                      required
                    >
                      <option value="NOT_RECEIVED">Item Not Received</option>
                      <option value="DAMAGED">Damaged Item Received</option>
                      <option value="COUNTERFEIT">Counterfeit / Fake Product</option>
                      <option value="OTHER">Other Issue</option>
                    </select>
                    <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {/* Describe the Issue — styled exactly like "Additional Details" */}
                <div>
                  <p className="text-[13px] font-semibold text-gray-800 mb-2">
                    Describe the Issue
                  </p>
                  <div className="relative">
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value.slice(0, 300))}
                      placeholder="Describe the issue in detail…"
                      rows={4}
                      className="w-full resize-none border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-700 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400 font-medium"
                      required
                    />
                    <span className="absolute bottom-3 right-3.5 text-[11px] text-gray-400 select-none">
                      {disputeReason.length}/300
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="px-6 pt-4 pb-6 space-y-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDisputeOpen(false)}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disputeSubmitting || !disputeReason.trim()}
                    className="flex-1 py-3 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  >
                    {disputeSubmitting ? 'Submitting…' : 'Submit Dispute'}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span>Your dispute will be reviewed by our team within 1-3 business days.</span>
                </div>
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
