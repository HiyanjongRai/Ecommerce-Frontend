import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getUserOrders, cancelOrder, retryPayment, changePaymentMethod, getEsewaSignature, initiateKhaltiPayment, requestRefund, openDispute } from '../../../shared/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { getProductLink } from '../../../shared/utils/slugHelper';

// Robust image URL builder - handles null, relative paths, and already-absolute paths
const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const STATUS_BORDER = {
  DRAFT:      '#f59e0b',
  PENDING:    '#f59e0b',
  CONFIRMED:  '#3b82f6',
  PROCESSING: '#6366f1',
  PACKED:     '#8b5cf6',
  SHIPPED:    '#0ea5e9',
  DELIVERED:  '#10b981',
  CANCELLED:  '#ef4444',
  REFUNDED:   '#f97316',
  FAILED:     '#ef4444',
};

const STATUS_CLASS = {
  DRAFT:      'bg-amber-50 text-amber-700 border-amber-200',
  PENDING:    'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED:  'bg-blue-50 text-blue-700 border-blue-200',
  PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PACKED:     'bg-violet-50 text-violet-700 border-violet-200',
  SHIPPED:    'bg-sky-50 text-sky-700 border-sky-200',
  DELIVERED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED:  'bg-red-50 text-red-600 border-red-200',
  REFUNDED:   'bg-orange-50 text-orange-600 border-orange-200',
  PAID:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED:     'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABELS = {
  DRAFT: 'Awaiting Payment',
  PENDING: 'Order Placed',
  PROCESSING: 'Processing Order',
  SHIPPED: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PAID: 'Paid',
  FAILED: 'Failed',
  COD_PENDING: 'Pay on Delivery',
};


const PAYMENT_LABELS = {
  PAID:              'Paid',
  COD_PENDING:       'Pay on Delivery',
  PENDING_COD:       'Pay on Delivery',
  REQUIRES_PAYMENT:  'Payment Required',
  PAYMENT_INITIATED: 'Processing Payment',
  REFUND_PENDING:    'Refund Processing',
  REFUNDED:          'Refunded',
  CANCELLED:         'Cancelled',
  FAILED:            'Payment Failed',
  COD_REMITTED:      'Collected (Cash)',
  COD_FAILED:        'COD Collection Failed',
};

const TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'ONGOING', label: 'Ongoing' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const CANCELLABLE = ['DRAFT', 'PENDING', 'PROCESSING', 'COD_PENDING'];
const REFUNDABLE_PAYMENT = ['PAID', 'COD_REMITTED', 'COD_COLLECTED'];
const REFUND_REASONS = [
  { value: 'DAMAGED_ITEM', label: 'Damaged item' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'MISSING_ITEM', label: 'Missing item' },
  { value: 'QUALITY_ISSUE', label: 'Quality issue' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'OTHER', label: 'Other' },
];

const CustomerOrders = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId]     = useState(null);
  const [filter, setFilter]     = useState('ALL');

  useEffect(() => {
    const oId = searchParams.get('orderId');
    if (oId && orders.length > 0) {
      const matched = orders.find(o => String(o.orderId) === oId || String(o.customOrderId || '').toLowerCase() === oId.toLowerCase());
      if (matched) {
        setExpanded(matched.orderId);
      }
    }
  }, [searchParams, orders]);

  const esewaFormRef = useRef(null);
  const [esewaData, setEsewaData] = useState(null);

  useEffect(() => {
    if (esewaData && esewaFormRef.current) {
      esewaFormRef.current.submit();
    }
  }, [esewaData]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch { setOrders([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    setBusyId(orderId);
    try { await cancelOrder(orderId); await load(); }
    catch (e) { alert(e.response?.data?.message || 'Cancel failed'); }
    setBusyId(null);
  };

  // chosenMethod: 'ESEWA' | 'KHALTI' — if different from order.paymentMethod, switch first
  const handleRetry = async (order, chosenMethod) => {
    const method = chosenMethod || order.paymentMethod;
    setBusyId(`${order.orderId}-${method}`);
    try {
      // If the user is switching gateway, update it on the backend first
      if (method !== order.paymentMethod) {
        await changePaymentMethod(order.orderId, method);
      } else {
        await retryPayment(order.orderId);
      }

      const formattedAmount = Number(order.grandTotal).toFixed(2);

      if (method === 'KHALTI') {
        const khaltiRes = await initiateKhaltiPayment({
          orderIds: [order.orderId],
          amount: formattedAmount,
          purchaseOrderId: order.customOrderId || String(order.orderId),
        });
        const paymentUrl = khaltiRes.data?.paymentUrl;
        if (!paymentUrl) throw new Error('Khalti payment URL was not returned');
        window.location.href = paymentUrl;
        return;
      }

      // eSewa
      const transactionUuid = `ORDS-${order.orderId}-${Date.now()}`;
      const sigRes = await getEsewaSignature({
        amount: formattedAmount,
        transactionUuid,
        orderIds: [order.orderId]
      });
      const sigData = sigRes.data;
      setEsewaData({
        amount: formattedAmount,
        tax_amount: '0.00',
        total_amount: formattedAmount,
        transaction_uuid: transactionUuid,
        product_code: sigData.productCode,
        product_service_charge: '0.00',
        product_delivery_charge: '0.00',
        success_url: `http://localhost:3000/payment/success`,
        failure_url: `http://localhost:3000/payment/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: sigData.signature,
        paymentUrl: sigData.paymentUrl
      });
    } catch (e) {
      alert(e.response?.data?.message || 'Retry payment failed. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = orders.filter(o => {
    if (filter === 'ALL') return true;
    if (filter === 'ONGOING') return ['DRAFT', 'PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status);
    if (filter === 'COMPLETED') return o.status === 'DELIVERED';
    if (filter === 'CANCELLED') return o.status === 'CANCELLED' || o.status === 'FAILED';
    return true;
  });

  if (loading) {
    return (
      <div className="py-16 text-center">
        <svg className="animate-spin w-6 h-6 text-[#10B981] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Fetching your orders…</p>
      </div>
    );
  }

  // ── count per tab ──
  const allCount       = orders.length;
  const ongoingCount   = orders.filter(o => ['DRAFT','PENDING','CONFIRMED','PROCESSING','PACKED','SHIPPED'].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter(o => ['CANCELLED','FAILED'].includes(o.status)).length;

  const TAB_COUNTS = { ALL: allCount, ONGOING: ongoingCount, COMPLETED: completedCount, CANCELLED: cancelledCount };

  return (
    <div className="pb-6">
      {expanded ? (
        <OrderDetailView
          order={orders.find(o => o.orderId === expanded)}
          onBack={() => setExpanded(null)}
          busyId={busyId}
          onCancel={handleCancel}
          onRetry={handleRetry}
          onRefundRequested={load}
        />
      ) : (
        <>
          {/* ── Page Header ── */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-sm font-black text-gray-800">My Orders</h2>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{allCount} total order{allCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 mb-4 bg-gray-50 border border-gray-200 rounded-sm p-1">
            {TABS.map(tab => {
              const count = TAB_COUNTS[tab.id];
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm ${
                      isActive ? 'bg-[#10B981] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Order List ── */}
          {filtered.length === 0 ? (
            <div className="text-center py-14 bg-white border border-gray-200 rounded-sm">
              <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-1">No orders found</p>
              <p className="text-[10px] text-gray-400">Try a different filter or place a new order.</p>
              <Link
                to="/"
                className="inline-block mt-4 bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-black uppercase tracking-wider px-5 py-2 rounded-sm transition-colors"
              >
                Explore Storefront →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden divide-y divide-gray-100">
              {filtered.map(order => {
                const statusCls  = STATUS_CLASS[order.status]  || 'bg-gray-50 text-gray-500 border-gray-200';
                const borderColor = STATUS_BORDER[order.status] || '#e5e7eb';
                const label      = STATUS_LABELS[order.status]  || order.status;
                const productLine = order.items?.length > 0
                  ? (order.items.length === 1
                    ? order.items[0].name
                    : `${order.items[0].name} +${order.items.length - 1} more`)
                  : 'Order Products';
                return (
                  <div
                    key={order.orderId}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    style={{ borderLeft: `3px solid ${borderColor}` }}
                    onClick={() => setExpanded(order.orderId)}
                  >
                    {/* Product image */}
                    <div className="w-11 h-11 rounded-sm bg-gray-50 border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {order.items?.[0]?.imagePath ? (
                        <img src={getImgUrl(order.items[0].imagePath)} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[10px] font-black text-gray-700 font-mono">
                          {order.customOrderId || `#${order.orderId}`}
                        </span>
                        <span className={`inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border ${statusCls}`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 truncate">{productLine}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>

                    {/* Amount + action */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">Rs. {(order.grandTotal ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {/* Action button for DRAFT / pay-pending */}
                      {order.status === 'DRAFT' && order.paymentStatus !== 'PAID' ? (
                        <button
                          onClick={e => { e.stopPropagation(); setExpanded(order.orderId); }}
                          className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Hidden eSewa Form */}
      {esewaData && (
        <form ref={esewaFormRef} action={esewaData.paymentUrl} method="POST" style={{ display: 'none' }}>
          <input type="hidden" name="amount" value={esewaData.amount} />
          <input type="hidden" name="tax_amount" value={esewaData.tax_amount} />
          <input type="hidden" name="total_amount" value={esewaData.total_amount} />
          <input type="hidden" name="transaction_uuid" value={esewaData.transaction_uuid} />
          <input type="hidden" name="product_code" value={esewaData.product_code} />
          <input type="hidden" name="product_service_charge" value={esewaData.product_service_charge} />
          <input type="hidden" name="product_delivery_charge" value={esewaData.product_delivery_charge} />
          <input type="hidden" name="success_url" value={esewaData.success_url} />
          <input type="hidden" name="failure_url" value={esewaData.failure_url} />
          <input type="hidden" name="signed_field_names" value={esewaData.signed_field_names} />
          <input type="hidden" name="signature" value={esewaData.signature} />
        </form>
      )}
    </div>
  );
};

// Tracker Steps mapping
const getStatusStep = (status) => {
  switch (status) {
    case 'DRAFT':
    case 'PENDING':
      return 0;
    case 'PROCESSING':
      return 1;
    case 'SHIPPED':
      return 2;
    case 'DELIVERED':
      return 3;
    default:
      return -1;
  }
};

// Sleek Order Tracker Component
const OrderTracker = ({ status }) => {
  const currentStep = getStatusStep(status);
  
  if (currentStep === -1) {
    if (status === 'CANCELLED') {
      return (
        <div className="bg-red-50 border border-red-150 rounded-sm p-4 text-center text-red-600 text-xs font-black uppercase tracking-wider mb-6">
          🚫 This order has been cancelled.
        </div>
      );
    }
    return (
      <div className="bg-red-50 border border-red-150 rounded-sm p-4 text-center text-red-600 text-xs font-black uppercase tracking-wider mb-6">
        ⚠️ Order status: {status}
      </div>
    );
  }

  const steps = [
    { label: 'Placed', desc: 'Awaiting confirmation' },
    { label: 'Processing', desc: 'Preparing package' },
    { label: 'In Transit', desc: 'On its way to you' },
    { label: 'Delivered', desc: 'Package received' },
  ];

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-sm p-5 shadow-2xs">
      <div className="relative flex justify-between items-start">
        {/* Progress bar line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-100 -z-0" />
        <div 
          className="absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-500 -z-0" 
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx <= currentStep;
          const isActive = idx === currentStep;
          return (
            <div key={idx} className="flex flex-col items-center flex-1 text-center z-10 relative">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white font-bold' 
                    : 'bg-white border-gray-300 text-gray-400 font-bold'
                } ${isActive ? 'ring-4 ring-emerald-100 scale-105' : ''}`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider mt-3 ${isCompleted ? 'text-[#222529]' : 'text-gray-450'}`}>
                {step.label}
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5 font-semibold hidden md:block">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Extracted OrderDetailView component
const OrderDetailView = ({ order, onBack, busyId, onCancel, onRetry, onRefundRequested }) => {
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState('ORIGINAL_PAYMENT');
  const [refundEvidence, setRefundEvidence] = useState(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundSpreadSheetLabel, setRefundSpreadSheetLabel] = useState('');
  const [refundSuccess, setRefundSuccess] = useState('');

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeType, setDisputeType] = useState('OTHER');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState('');

  if (!order) return null;

  const refundableItems = (order.items || [])
    .map(item => ({
      orderItemId: item.orderItemId || item.id,
      quantity: item.quantity || 1,
      name: item.name || item.productNameSnapshot || `Product #${item.productId || ''}`,
    }))
    .filter(item => item.orderItemId);

  const canRequestRefund = order.status === 'DELIVERED'
    && REFUNDABLE_PAYMENT.includes(order.paymentStatus)
    && refundableItems.length > 0;

  const handleRefundSubmit = async (event) => {
    event.preventDefault();
    if (!refundReason) {
      setRefundError('Please select a refund reason.');
      return;
    }
    if (refundableItems.length === 0) {
      setRefundError('No refundable order items were found for this order.');
      return;
    }

    try {
      setRefundSubmitting(true);
      setRefundError('');
      setRefundSuccess('');
      await requestRefund(order.orderId, {
        refundType,
        reasonCode: refundReason,
        items: refundableItems.map(item => ({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
        })),
      }, refundEvidence);
      setRefundSuccess('Refund request submitted. You can track it from My Refunds.');
      await onRefundRequested?.();
      setTimeout(() => setRefundOpen(false), 900);
    } catch (error) {
      setRefundError(error.response?.data?.message || 'Refund request failed.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleDisputeSubmit = async (event) => {
    event.preventDefault();
    if (!disputeReason.trim()) {
      setDisputeError('Please describe your dispute complaint.');
      return;
    }
    try {
      setDisputeSubmitting(true);
      setDisputeError('');
      setDisputeSuccess('');
      await openDispute({
        orderId: order.orderId,
        type: disputeType,
        description: disputeReason.trim()
      });
      setDisputeSuccess('Dispute ticket opened successfully. You can track it under My Disputes.');
      await onRefundRequested?.();
      setTimeout(() => setDisputeOpen(false), 1200);
    } catch (error) {
      setDisputeError(error.response?.data?.message || 'Failed to open dispute.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
      </div>

      {/* Visual Tracking Stepper */}
      <OrderTracker status={order.status} />

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <p className="text-sm text-gray-500 mb-1">Order ID: <span className="font-bold text-gray-900">{order.customOrderId || `#${order.orderId}`}</span></p>
            <p className="text-sm text-gray-500">Placed on: <span className="font-medium text-gray-900">{order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${STATUS_CLASS[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
            <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${STATUS_CLASS[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
              {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus || 'Unpaid'}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 text-lg mb-4">Items</h3>
        <div className="divide-y divide-gray-100">
          {order.items && order.items.map((item, idx) => (
            <div key={idx} className="py-4 flex gap-4 items-start justify-between">
              <Link to={getProductLink(item)} className="flex gap-4 items-start hover:underline group flex-1">
                <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 group-hover:border-emerald-300 transition-colors">
                  {item.imagePath ? <img src={getImgUrl(item.imagePath)} className="w-full h-full object-cover rounded-lg" alt="" /> : "📦"}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{item.name || `Product #${item.productId}`}</p>
                  {item.variantLabel && <p className="text-sm text-gray-500">{item.variantLabel}</p>}
                  <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity} × Rs. {(item.unitPrice || 0).toLocaleString()}</p>
                </div>
              </Link>
              <div className="text-right font-bold text-gray-900 shrink-0 pl-4">
                Rs. {(item.lineTotal ?? (item.unitPrice * item.quantity) ?? 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {(order.itemsTotal ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>Rs. {(order.shippingFee ?? 0).toLocaleString()}</span>
            </div>
            {order.vatAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>VAT</span>
                <span>Rs. {(order.vatAmount ?? 0).toLocaleString()}</span>
              </div>
            )}
            {(order.discountTotal > 0 || order.appliedCoupon) && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount {order.appliedCoupon ? `(${order.appliedCoupon})` : ''}</span>
                <span>- Rs. {(order.discountTotal ?? 0).toLocaleString()}</span>
              </div>
            )}
            <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>Rs. {(order.grandTotal ?? 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col gap-3">
            {canRequestRefund && (
              <button
                className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                onClick={() => {
                  setRefundOpen(true);
                  setRefundError('');
                  setRefundSuccess('');
                  setRefundEvidence(null);
                }}
              >
                Request Refund
              </button>
            )}
            {CANCELLABLE.includes(order.status) && (
              <button className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
                disabled={busyId === order.orderId}
                onClick={() => onCancel(order.orderId)}>
                {busyId === order.orderId ? '…' : 'Cancel Order'}
              </button>
            )}
            {order.status !== 'DRAFT' && order.status !== 'PENDING' && (
              <button
                className="w-full py-2.5 rounded-lg border border-[#dbcded] bg-[#f6f0ff]/50 text-[#5c2d91] font-bold hover:bg-[#f6f0ff] transition-colors"
                onClick={() => {
                  setDisputeOpen(true);
                  setDisputeError('');
                  setDisputeSuccess('');
                  setDisputeReason('');
                  setDisputeType('OTHER');
                }}
              >
                ⚖️ File Dispute
              </button>
            )}
            {order.status === 'DRAFT' && order.paymentStatus !== 'PAID' && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 text-center">Choose payment method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="py-2.5 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2 bg-[#60bb46] hover:bg-[#4da038]"
                    disabled={!!busyId}
                    onClick={() => onRetry(order, 'ESEWA')}
                  >
                    {busyId === `${order.orderId}-ESEWA` ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">e</span>
                        eSewa
                      </>
                    )}
                  </button>
                  <button
                    className="py-2.5 rounded-lg text-white font-bold transition-colors flex items-center justify-center gap-2 bg-[#5c2d91] hover:bg-[#4a2275]"
                    disabled={!!busyId}
                    onClick={() => onRetry(order, 'KHALTI')}
                  >
                    {busyId === `${order.orderId}-KHALTI` ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">K</span>
                        Khalti
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            {!canRequestRefund && order.status === 'DELIVERED' && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs font-semibold text-gray-500">
                Refund requests are available only for paid or collected delivered orders.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Delivery & Store Info</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Delivery Address</p>
              <p className="text-sm text-gray-600">{order.shippingAddress || '—'}</p>
              {order.shippingLocation && <p className="text-sm text-gray-500 mt-1">{order.shippingLocation}</p>}
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-1">Store Details</p>
              <p className="text-sm text-gray-600">{order.sellerStoreName || 'Partner Store'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Transaction Card ─────────────────────────────── */}
      {(() => {
        const pm = String(order.paymentMethod || '').toUpperCase();
        const isEsewa  = pm === 'ESEWA';
        const isKhalti = pm === 'KHALTI';
        const isPaid   = ['PAID','COD_REMITTED','COD_COLLECTED'].includes(String(order.paymentStatus).toUpperCase());
        const accentColor = isEsewa ? '#60bb46' : isKhalti ? '#5c2d91' : '#334e68';
        const accentBg    = isEsewa ? '#f0faf0' : isKhalti ? '#f6f0ff' : '#edf2f6';
        const accentBorder= isEsewa ? '#c3e6cb' : isKhalti ? '#dbcded' : '#cbd5e1';

        return (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                💳 Payment Information
              </h3>
              {/* Gateway badge */}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border"
                style={{ backgroundColor: accentBg, color: accentColor, borderColor: accentBorder }}
              >
                {isEsewa  && <><span className="w-4 h-4 rounded-full bg-[#60bb46] flex items-center justify-center text-white text-[8px] font-black">e</span> eSewa</>}
                {isKhalti && <><span className="w-4 h-4 rounded-lg bg-[#5c2d91] flex items-center justify-center text-white text-[8px] font-black">K</span> Khalti</>}
                {!isEsewa && !isKhalti && <>💵 Cash On Delivery</>}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Left: Status + Amount */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-semibold">Payment Status</span>
                  <span className={`inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${STATUS_CLASS[order.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                    {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus || 'Pending'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-semibold">Amount Paid</span>
                  <span className="font-black text-lg" style={{ color: accentColor }}>
                    Rs. {Number(order.grandTotal || 0).toLocaleString()}
                  </span>
                </div>

                {order.paidAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-semibold">Paid At</span>
                    <span className="font-semibold text-gray-700 text-xs">
                      {new Date(order.paidAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {isPaid && (isEsewa || isKhalti) && (
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-2">
                    <svg className="w-3.5 h-3.5 fill-emerald-600 shrink-0" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Payment verified by {isEsewa ? 'eSewa' : 'Khalti'}
                  </div>
                )}
              </div>

              {/* Right: Transaction IDs (only for online payments) */}
              {(isEsewa || isKhalti) && (
                <div
                  className="rounded-xl p-4 space-y-3 border"
                  style={{ backgroundColor: accentBg, borderColor: accentBorder }}
                >
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>
                    {isEsewa ? 'eSewa' : 'Khalti'} Transaction Details
                  </p>

                  {order.transactionUuid && (
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">
                        Transaction Reference
                      </p>
                      <p className="font-mono text-xs font-bold text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-200 break-all select-all">
                        {order.transactionUuid}
                      </p>
                    </div>
                  )}

                  {order.paymentReference && (
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">
                        {isEsewa ? 'eSewa Transaction Code' : 'Khalti Transaction ID'}
                      </p>
                      <p className="font-mono text-xs font-bold text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-200 break-all select-all">
                        {order.paymentReference}
                      </p>
                    </div>
                  )}

                  {order.gatewayReferenceId && (
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">
                        {isEsewa ? 'eSewa Reference ID' : 'Khalti Reference ID'}
                      </p>
                      <p className="font-mono text-xs font-bold text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-200 break-all select-all">
                        {order.gatewayReferenceId}
                      </p>
                    </div>
                  )}

                  {!order.transactionUuid && !order.paymentReference && !order.gatewayReferenceId && (
                    <p className="text-xs text-gray-400 font-semibold italic">
                      Transaction IDs will appear here once payment is confirmed.
                    </p>
                  )}
                </div>
              )}

              {/* COD note */}
              {!isEsewa && !isKhalti && (
                <div className="rounded-xl p-4 bg-gray-50 border border-gray-200 flex flex-col justify-center">
                  <p className="text-sm font-bold text-gray-700 mb-1">💵 Cash On Delivery</p>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Payment will be collected by the delivery agent when your order arrives. 
                    Please keep exact change ready.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {refundOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-emerald-50 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Request Refund</h3>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Order {order.customOrderId || `#${order.orderId}`} will be sent to the seller for review.
                </p>
              </div>
              <button
                onClick={() => setRefundOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4 p-5">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Items included</p>
                <div className="space-y-2">
                  {refundableItems.map(item => (
                    <div key={item.orderItemId} className="flex justify-between gap-3 text-sm">
                      <span className="font-semibold text-gray-700">{item.name}</span>
                      <span className="font-bold text-gray-900">Qty {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-700">
                  Refund Reason
                </label>
                <select
                  value={refundReason}
                  onChange={event => setRefundReason(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-emerald-500 focus:bg-white"
                  required
                >
                  <option value="">Select reason...</option>
                  {REFUND_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>{reason.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-700">
                  Refund Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'ORIGINAL_PAYMENT', label: 'Original Payment' },
                    { value: 'STORE_CREDIT', label: 'Store Credit' },
                  ].map(option => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setRefundType(option.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                        refundType === option.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-700">
                  Evidence Photo or File
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={event => setRefundEvidence(event.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                />
                <p className="mt-1 text-[10px] font-semibold text-gray-400">
                  Optional. Upload a photo, screenshot, or PDF up to 10 MB.
                </p>
                {refundEvidence && (
                  <p className="mt-2 truncate rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    Attached: {refundEvidence.name}
                  </p>
                )}
              </div>

              {refundError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                  {refundError}
                </div>
              )}
              {refundSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                  {refundSuccess}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setRefundOpen(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting || !refundReason}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {refundSubmitting ? 'Submitting...' : 'Submit Refund Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {disputeOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-[#f6f0ff] px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">⚖️ File Dispute Ticket</h3>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Escalate issues for Order {order.customOrderId || `#${order.orderId}`} to administrators.
                </p>
              </div>
              <button
                onClick={() => setDisputeOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4 p-5 text-left font-sans text-[#222529]">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-700">
                  Dispute Type / Category
                </label>
                <select
                  value={disputeType}
                  onChange={event => setDisputeType(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#5c2d91] focus:bg-white"
                  required
                >
                  <option value="NOT_RECEIVED">Item Not Received</option>
                  <option value="DAMAGED">Damaged Item Received</option>
                  <option value="COUNTERFEIT">Counterfeit / Fake Product</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-700">
                  Describe the Issue
                </label>
                <textarea
                  value={disputeReason}
                  onChange={event => setDisputeReason(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#5c2d91] focus:bg-white min-h-[100px]"
                  placeholder="Provide detailed description of the issues faced, defects, or missing items..."
                  required
                />
              </div>

              {disputeError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                  {disputeError}
                </div>
              )}
              {disputeSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                  {disputeSuccess}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDisputeOpen(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeSubmitting || !disputeReason.trim()}
                  className="rounded-lg bg-[#5c2d91] px-5 py-2.5 text-sm font-black text-white hover:bg-[#4a2275] disabled:opacity-50"
                >
                  {disputeSubmitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
