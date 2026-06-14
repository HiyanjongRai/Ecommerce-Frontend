import React, { useEffect, useState, useCallback } from 'react';
import { 
  getSellerOrderDetail, 
  updateSellerOrderStatus,
  cancelSellerOrder,
  sendSellerMessage
} from '../services/sellerService';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useSellerTheme } from '../hooks/useSellerTheme';
import { toast } from '../../../shared/contexts/ToastContext';
import { 
  ChevronDown, ChevronUp, MapPin, Mail, Phone,
  AlertCircle, MessageSquare, CreditCard, Copy, Check,
  Clock, Package, Truck, CheckCircle, X
} from 'lucide-react';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Timeline steps
const TIMELINE_STEPS = [
  { key: 'PENDING', label: 'Pending', icon: Clock, color: 'bg-gray-400' },
  { key: 'PROCESSING', label: 'Processing', icon: Package, color: 'bg-blue-500' },
  { key: 'PACKED', label: 'Packed', icon: Package, color: 'bg-blue-500' },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck, color: 'bg-amber-500' },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-500' },
];

// Status transitions — mirrors backend OrderStatusService.VALID_TRANSITIONS exactly
const STATUS_TRANSITIONS = {
  DRAFT:              ['PROCESSING', 'CANCELLED'],
  PENDING:            ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  COD_PENDING:        ['CONFIRMED_BY_CALL', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  INITIATED:          ['PROCESSING', 'CANCELLED'],
  CONFIRMED:          ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  CONFIRMED_BY_CALL:  ['PROCESSING', 'PACKED', 'SHIPPED', 'CANCELLED'],
  PROCESSING:         ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  PACKED:             ['SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  SHIPPED:            ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_REQUESTED', 'CANCELLED'],
  OUT_FOR_DELIVERY:   ['DELIVERED', 'RETURN_REQUESTED', 'CANCELLED'],
  RETURN_REQUESTED:   ['RETURNED'],
  RETURNED:           [],
  DELIVERED:          [],
  CANCELLED:          [],
  FAILED:             [],
  REFUNDED:           [],
  REFUND_REQUESTED:   [],
  REFUND_APPROVED:    [],
  DISPUTE_OPEN:       [],
  DISPUTE_RESOLVED:   [],
};

// Human-readable labels for terminal state explanations
const TERMINAL_STATUS_REASONS = {
  REFUNDED: 'This order has been refunded and cannot be updated.',
  CANCELLED: 'This order has been cancelled and cannot be updated.',
  DELIVERED: 'This order has been delivered. No further updates needed.',
  RETURNED: 'This order has been returned and cannot be updated.',
  FAILED: 'This order failed and cannot be updated.',
  REFUND_REQUESTED: 'A refund has been requested for this order.',
  REFUND_APPROVED: 'The refund has been approved for this order.',
  DISPUTE_OPEN: 'A dispute is open for this order.',
  DISPUTE_RESOLVED: 'The dispute on this order has been resolved.',
};

const sanitizeName = (raw) => {
  if (!raw) return 'N/A';
  const cleaned = String(raw).replace(/^(admin|customer_user|admincustomer_user|seller_user|user_)/i, '').trim();
  return cleaned || 'N/A';
};

const sanitizeEmail = (raw) => {
  if (!raw) return 'N/A';
  const cleaned = String(raw).replace(/^(admin|customer_user|admincustomer_user|seller_user|user_)/i, '').trim();
  return cleaned || 'N/A';
};

const renderGatewayResponse = (response) => {
  if (!response) return null;
  let data = response;
  if (typeof response === 'string') {
    try {
      data = JSON.parse(response);
    } catch (e) {
      return <p className="text-[11px] font-mono break-all bg-gray-50 dark:bg-zinc-800/40 p-2 rounded border border-gray-200 dark:border-zinc-700">{response}</p>;
    }
  }
  
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data).filter(([key, val]) => {
      return typeof val !== 'object' && String(key).toLowerCase() !== 'signature';
    });
    
    if (entries.length === 0) return <code className="text-[10px] break-all">{JSON.stringify(data)}</code>;
    
    return (
      <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-[11px] font-semibold">
        {entries.map(([key, val]) => (
          <div key={key} className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">{key.replace(/_/g, ' ')}</span>
            <span className="text-gray-800 dark:text-gray-200 truncate" title={String(val)}>{String(val)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-[11px] font-mono break-all bg-gray-50 dark:bg-zinc-800/40 p-2 rounded border border-gray-200 dark:border-zinc-700">{String(response)}</p>;
};

const SellerOrderDetails = ({ orderId, onClose }) => {
  const { darkMode, themeClasses } = useSellerTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [copied, setCopied] = useState(null);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState(null);

  const loadOrderDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSellerOrderDetail(orderId);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const handleStatusUpdateClick = (newStatus) => {
    setStatusToConfirm(newStatus);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusToConfirm) return;
    const targetStatus = statusToConfirm;
    setStatusToConfirm(null);
    setActionInProgress(true);
    try {
      await updateSellerOrderStatus(orderId, targetStatus);
      await loadOrderDetails();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to update order status.';
      toast(msg, 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast('Please provide a cancellation reason.', 'warning');
      return;
    }
    setActionInProgress(true);
    try {
      await cancelSellerOrder(order.sellerId, orderId, cancelReason);
      await loadOrderDetails();
      setShowCancelModal(false);
      setCancelReason('');
      toast('Order cancelled successfully.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to cancel order.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSendingMessage(true);
    try {
      await sendSellerMessage({
        receiverId: order.customerId,
        content: message
      });
      setMessage('');
      toast('Message sent successfully.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send message.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStepStatus = (stepKey) => {
    if (!order) return 'inactive';
    const currentStatus = order.status?.toUpperCase();
    const stepIndex = TIMELINE_STEPS.findIndex(s => s.key === stepKey);
    const currentIndex = TIMELINE_STEPS.findIndex(s => s.key === currentStatus);
    
    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'inactive';
  };

  const getAvailableTransitions = () => {
    if (!order) return [];
    const status = String(order.status || '').toUpperCase().trim();
    // Only return defined transitions — never fall back to offering buttons for unknown/terminal statuses
    return STATUS_TRANSITIONS[status] ?? [];
  };

  const getTerminalStatusReason = () => {
    if (!order) return null;
    const status = String(order.status || '').toUpperCase().trim();
    return TERMINAL_STATUS_REASONS[status] || null;
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm`}>
        <div className={`${themeClasses.card} rounded-lg p-8 shadow-xl border`}>
          <div className="animate-spin w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto"></div>
          <p className={`text-center mt-4 ${themeClasses.text.secondary} font-semibold text-sm`}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm`}>
        <div className={`${themeClasses.card} rounded-lg p-8 shadow-xl max-w-md border`}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className={`text-center ${themeClasses.text.primary} font-semibold mb-4`}>{error || 'Not found'}</p>
          <button
            onClick={onClose}
            className={`w-full ${themeClasses.button.secondary} rounded-lg px-4 py-2.5 font-bold text-sm`}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${darkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm`}>
      <div className={`${themeClasses.card} w-full max-w-xl h-full shadow-2xl border-l ${themeClasses.border.primary} flex flex-col animate-slide-in-from-right`}>
        
        {/* Header */}
        <div className={`${themeClasses.bg.secondary} px-6 py-4 border-b ${themeClasses.border.primary} flex items-center justify-between flex-shrink-0`}>
          <div>
            <h2 className={`text-lg font-black ${themeClasses.text.primary}`}>Order #{order.customOrderId || order.orderId}</h2>
            <p className={`text-xs ${themeClasses.text.tertiary} mt-1`}>
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-lg ${themeClasses.bg.tertiary} hover:${themeClasses.bg.secondary} flex items-center justify-center ${themeClasses.text.secondary} transition-colors`}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {error && (
            <div className={`p-4 ${themeClasses.bg.danger} border ${themeClasses.border.danger} rounded-lg flex items-start gap-3`}>
              <AlertCircle className={`w-5 h-5 ${themeClasses.text.danger} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm font-semibold ${themeClasses.text.danger}`}>{error}</p>
            </div>
          )}

          {/* Timeline */}
          <div className={`${themeClasses.bg.secondary} rounded-lg p-6 border ${themeClasses.border.primary}`}>
            <h3 className={`text-sm font-black uppercase tracking-wider ${themeClasses.text.tertiary} mb-4`}>Order Timeline</h3>
            <div className="flex items-center justify-between gap-2">
              {TIMELINE_STEPS.map((step, idx) => {
                const status = getStepStatus(step.key);
                const Icon = step.icon;
                const isLast = idx === TIMELINE_STEPS.length - 1;
                
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    {/* Step Circle */}
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                        status === 'active' ? 'bg-emerald-500 border-emerald-500 text-white ring-4 ring-emerald-200 scale-110' :
                        `${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'} ${themeClasses.text.tertiary}`
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`text-xs font-bold mt-2 text-center ${
                        status === 'active' ? 'text-emerald-600 font-black' : themeClasses.text.tertiary
                      }`}>
                        {step.label}
                      </p>
                    </div>
                    
                    {/* Connector Line */}
                    {!isLast && (
                      <div className={`h-1 flex-1 mx-1 rounded-full ${
                        status === 'completed' ? 'bg-emerald-500' : 
                        `${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stacked Layout for Side Drawer */}
          <div className="space-y-4">

            {/* ── Status Actions Panel (PROMINENT — top of details) ── */}
            <div className={`${themeClasses.card} rounded-lg p-4 border-2 ${
              getAvailableTransitions().length > 0
                ? (darkMode ? 'border-emerald-700' : 'border-emerald-300')
                : (darkMode ? 'border-gray-700' : 'border-gray-200')
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${
                  getAvailableTransitions().length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <h4 className={`text-sm font-black ${themeClasses.text.primary}`}>
                  Update Order Status
                </h4>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-2">
                {getAvailableTransitions().map((nextStatus) => {
                  const isCancel = nextStatus === 'CANCELLED';
                  const statusLabels = {
                    CONFIRMED_BY_CALL: '📞 Confirm by Call',
                    PROCESSING: '⚙️ Mark as Processing',
                    PACKED: '📦 Mark as Packed',
                    SHIPPED: '🚚 Mark as Shipped',
                    OUT_FOR_DELIVERY: '🏍️ Out for Delivery',
                    DELIVERED: '✅ Mark as Delivered',
                    RETURN_REQUESTED: '↩️ Mark Return Requested',
                    RETURNED: '📬 Mark as Returned',
                    CANCELLED: '✕ Cancel Order',
                  };
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => {
                        if (isCancel) {
                          setShowCancelModal(true);
                        } else {
                          handleStatusUpdateClick(nextStatus);
                        }
                      }}
                      disabled={actionInProgress}
                      className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                        isCancel
                          ? 'bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                      }`}
                    >
                      {actionInProgress ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                      ) : (
                        statusLabels[nextStatus] || `→ ${nextStatus}`
                      )}
                    </button>
                  );
                })}

                {getAvailableTransitions().length === 0 && (
                  <div className={`rounded-lg p-3 text-center ${
                    darkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    {getTerminalStatusReason() ? (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                            Order Locked
                          </span>
                        </div>
                        <p className={`text-xs ${themeClasses.text.secondary} leading-relaxed`}>
                          {getTerminalStatusReason()}
                        </p>
                      </>
                    ) : (
                      <p className={`text-xs ${themeClasses.text.tertiary}`}>No status actions available</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer */}
            <div className={`${themeClasses.card} rounded-lg p-4 border ${themeClasses.border.primary}`}>
              <h4 className={`text-sm font-black ${themeClasses.text.primary} mb-3`}>Customer</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={themeClasses.text.secondary}>Name</span>
                  <span className={`font-bold ${themeClasses.text.primary}`}>{sanitizeName(order.customerName) || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={themeClasses.text.secondary}>Phone</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${themeClasses.text.primary}`}>{order.customerPhone || 'N/A'}</span>
                    {order.customerPhone && (
                      <button onClick={() => copyToClipboard(order.customerPhone, 'phone')} className="p-1">
                        {copied === 'phone' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className={themeClasses.text.secondary}>Email</span>
                  <span className={`font-bold ${themeClasses.text.primary} text-xs`}>{sanitizeEmail(order.customerEmail) || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={`${themeClasses.card} rounded-lg p-4 border ${themeClasses.border.primary}`}>
              <h4 className={`text-sm font-black ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <MapPin className="w-4 h-4" /> Address
              </h4>
              <p className={`text-sm ${themeClasses.text.secondary} leading-relaxed`}>
                {order.shippingAddress || 'No address'}
              </p>
            </div>

            {/* Items */}
            <div className={`${themeClasses.card} rounded-lg overflow-hidden border ${themeClasses.border.primary}`}>
              <div className={`${themeClasses.bg.secondary} px-4 py-3 border-b ${themeClasses.border.primary}`}>
                <h4 className={`text-sm font-black ${themeClasses.text.primary}`}>Order Items ({order.items?.length || 0})</h4>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    const name = item.productName || item.name || 'Product';
                    const img = item.productImage || item.imagePath;
                    const qty = item.quantity || 1;
                    const price = item.price || item.unitPrice || 0;
                    const total = item.lineTotal || (price * qty) || 0;
                    const sku = item.sku || item.SKU || 'N/A';
                    const discount = item.discount || item.discountAmount || 0;
                    const variants = item.variants || item.variantAttributes || {};

                    return (
                      <div key={idx} className={`p-4 hover:${themeClasses.bg.secondary} transition-colors`}>
                        <button
                          onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 flex-1 text-left">
                            {img && (
                              <img
                                src={getImgUrl(img)}
                                alt={name}
                                className="w-12 h-12 rounded object-cover border"
                              />
                            )}
                            <div className="flex-1">
                              <p className={`font-bold text-sm ${themeClasses.text.primary}`}>{name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">SKU: {sku}</span>
                                <span className={`text-xs ${themeClasses.text.tertiary}`}>Qty: {qty}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${themeClasses.text.primary}`}>Rs. {total?.toLocaleString()}</p>
                            {expandedItem === idx ? <ChevronUp className="w-4 h-4 mt-1" /> : <ChevronDown className="w-4 h-4 mt-1" />}
                          </div>
                        </button>

                        {expandedItem === idx && (
                          <div className={`mt-4 pt-4 border-t ${themeClasses.border.primary} space-y-3`}>
                            <div className={`${themeClasses.bg.secondary} p-3 rounded-lg space-y-2 text-xs`}>
                              <p className={`font-black ${themeClasses.text.tertiary} uppercase tracking-wider`}>Pricing</p>
                              <div className="flex justify-between">
                                <span className={themeClasses.text.secondary}>Unit Price</span>
                                <span className={`font-bold ${themeClasses.text.primary}`}>Rs. {price?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={themeClasses.text.secondary}>Quantity</span>
                                <span className={`font-bold ${themeClasses.text.primary}`}>{qty}</span>
                              </div>
                              {discount > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>Discount</span>
                                  <span className="font-bold">-Rs. {discount?.toLocaleString()}</span>
                                </div>
                              )}
                              <div className={`border-t ${themeClasses.border.primary} pt-2 flex justify-between font-bold`}>
                                <span className={themeClasses.text.primary}>Subtotal</span>
                                <span className="text-emerald-600">Rs. {total?.toLocaleString()}</span>
                              </div>
                            </div>
                            {variants && Object.keys(variants).length > 0 && (
                              <div className={`${themeClasses.bg.secondary} p-3 rounded-lg space-y-2 text-xs`}>
                                <p className={`font-black ${themeClasses.text.tertiary} uppercase tracking-wider`}>Variants</p>
                                <div className="space-y-1">
                                  {Object.entries(variants).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className={`${themeClasses.text.secondary} capitalize`}>{key}</span>
                                      <span className={`font-bold ${themeClasses.text.primary} bg-purple-100 text-purple-800 px-2 py-0.5 rounded`}>
                                        {String(value).toUpperCase()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className={`${themeClasses.bg.secondary} p-3 rounded-lg space-y-2 text-xs`}>
                              <p className={`font-black ${themeClasses.text.tertiary} uppercase tracking-wider`}>Details</p>
                              <div className="flex justify-between">
                                <span className={themeClasses.text.secondary}>SKU</span>
                                <code className={`font-mono font-bold ${themeClasses.text.primary}`}>{sku}</code>
                              </div>
                              {item.productId && (
                                <div className="flex justify-between">
                                  <span className={themeClasses.text.secondary}>Product ID</span>
                                  <code className={`font-mono font-bold ${themeClasses.text.primary} text-xs`}>{item.productId}</code>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className={`p-4 text-center ${themeClasses.text.tertiary}`}>No items</div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className={`${themeClasses.card} rounded-lg p-4 border ${themeClasses.border.primary}`}>
              <h4 className={`text-sm font-black ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <CreditCard className="w-4 h-4" /> Payment Details
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className={themeClasses.text.secondary}>Method</span>
                  <span className={`font-bold px-3 py-1 rounded-lg text-xs ${
                    order.paymentMethod === 'ESEWA' ? 'bg-green-100 text-green-800' :
                    order.paymentMethod === 'KHALTI' ? 'bg-purple-100 text-purple-800' :
                    order.paymentMethod === 'COD' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.paymentMethod || 'COD'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={themeClasses.text.secondary}>Status</span>
                  <span className={`font-bold px-3 py-1 rounded-lg text-xs ${
                    order.paymentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    order.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.paymentStatus || 'PENDING'}
                  </span>
                </div>
                {(order.referenceNumber || order.reference || order.paymentReference || order.refNumber) && (
                  <div className={`pt-2 border-t ${themeClasses.border.primary}`}>
                    <p className={`text-xs ${themeClasses.text.tertiary} mb-1`}>Reference Number</p>
                    <div className="flex items-center gap-2">
                      <code className={`text-xs ${themeClasses.bg.secondary} px-2 py-1 rounded flex-1 truncate font-mono`}>
                        {order.referenceNumber || order.reference || order.paymentReference || order.refNumber}
                      </code>
                      <button onClick={() => copyToClipboard(order.referenceNumber || order.reference || order.paymentReference || order.refNumber, 'ref')} className="p-1">
                        {copied === 'ref' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
                {order.orderId && (
                  <div className={`pt-2 border-t ${themeClasses.border.primary}`}>
                    <p className={`text-xs ${themeClasses.text.tertiary} mb-1`}>Order ID</p>
                    <div className="flex items-center gap-2">
                      <code className={`text-xs ${themeClasses.bg.secondary} px-2 py-1 rounded flex-1 truncate font-mono`}>{order.orderId}</code>
                      <button onClick={() => copyToClipboard(order.orderId, 'orderId')} className="p-1">
                        {copied === 'orderId' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
                {order.customOrderId && (
                  <div className={`pt-2 border-t ${themeClasses.border.primary}`}>
                    <p className={`text-xs ${themeClasses.text.tertiary} mb-1`}>Custom Order ID</p>
                    <div className="flex items-center gap-2">
                      <code className={`text-xs ${themeClasses.bg.secondary} px-2 py-1 rounded flex-1 truncate font-mono`}>{order.customOrderId}</code>
                      <button onClick={() => copyToClipboard(order.customOrderId, 'customId')} className="p-1">
                        {copied === 'customId' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
                {order.transactionUuid && (
                  <div className={`pt-2 border-t ${themeClasses.border.primary}`}>
                    <p className={`text-xs ${themeClasses.text.tertiary} mb-1`}>Transaction ID</p>
                    <div className="flex items-center gap-2">
                      <code className={`text-xs ${themeClasses.bg.secondary} px-2 py-1 rounded flex-1 truncate font-mono`}>{order.transactionUuid}</code>
                      <button onClick={() => copyToClipboard(order.transactionUuid, 'txn')} className="p-1">
                        {copied === 'txn' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
                {order.invoiceNumber && (
                  <div className={`pt-2 border-t ${themeClasses.border.primary}`}>
                    <p className={`text-xs ${themeClasses.text.tertiary} mb-1`}>Invoice Number</p>
                    <div className="flex items-center gap-2">
                      <code className={`text-xs ${themeClasses.bg.secondary} px-2 py-1 rounded flex-1 truncate font-mono`}>{order.invoiceNumber}</code>
                      <button onClick={() => copyToClipboard(order.invoiceNumber, 'invoice')} className="p-1">
                        {copied === 'invoice' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
                {order.paymentGatewayResponse && (
                  <div className={`pt-2 border-t ${themeClasses.border.primary}`}>
                    <p className={`text-xs ${themeClasses.text.tertiary} mb-2`}>Gateway Response</p>
                    {renderGatewayResponse(order.paymentGatewayResponse)}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className={`${themeClasses.card} rounded-lg p-4 border ${themeClasses.border.primary}`}>
              <h4 className={`text-sm font-black ${themeClasses.text.primary} mb-3`}>Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={themeClasses.text.secondary}>Items</span>
                  <span className={`font-bold ${themeClasses.text.primary}`}>Rs. {(order.itemsTotal || order.totalAmount || 0)?.toLocaleString()}</span>
                </div>
                {(order.marketplaceCommission || 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Commission</span>
                    <span className="font-bold">-Rs. {order.marketplaceCommission?.toLocaleString()}</span>
                  </div>
                )}
                {(order.inputVatAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className={themeClasses.text.secondary}>VAT</span>
                    <span className={`font-bold ${themeClasses.text.primary}`}>Rs. {order.inputVatAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className={`border-t ${themeClasses.border.primary} pt-2 flex justify-between`}>
                  <span className={`font-black ${themeClasses.text.primary}`}>Your Earnings</span>
                  <span className="font-black text-emerald-600 text-lg">Rs. {(order.sellerNetAmount || 0)?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Message Customer */}
            <div className={`${themeClasses.card} rounded-lg p-4 border ${themeClasses.border.primary}`}>
              <h4 className={`text-sm font-black ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <MessageSquare className="w-4 h-4" /> Message Customer
              </h4>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type message to customer..."
                className={`w-full px-3 py-2 ${themeClasses.bg.secondary} ${themeClasses.text.primary} border ${themeClasses.border.primary} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                rows="3"
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !message.trim()}
                className={`w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2.5 font-bold text-sm transition-all disabled:opacity-50`}
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>

          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className={`fixed inset-0 z-[60] flex items-center justify-center ${darkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm p-4`}>
            <div className={`${themeClasses.card} rounded-lg shadow-xl max-w-md w-full p-6 border`}>
              <h3 className={`text-lg font-black ${themeClasses.text.primary} mb-4`}>Cancel Order</h3>
              <p className={`text-sm ${themeClasses.text.secondary} mb-4`}>Reason:</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason..."
                className={`w-full px-3 py-2 ${themeClasses.bg.secondary} ${themeClasses.text.primary} border ${themeClasses.border.primary} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none`}
                rows="4"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className={`flex-1 ${themeClasses.button.secondary} rounded-lg px-4 py-2.5 font-bold text-sm transition-all`}
                >
                  Keep
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionInProgress || !cancelReason.trim()}
                  className={`flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2.5 font-bold text-sm transition-all disabled:opacity-50`}
                >
                  {actionInProgress ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Status Confirmation Modal */}
        {statusToConfirm && (
          <div className={`fixed inset-0 z-[60] flex items-center justify-center ${darkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm p-4`}>
            <div className={`${themeClasses.card} rounded-xl shadow-2xl max-w-sm w-full p-6 border ${themeClasses.border.primary} transform scale-100 transition-all duration-300`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full">
                  <Package className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className={`text-base font-black ${themeClasses.text.primary}`}>Update Status</h3>
              </div>
              <p className={`text-sm ${themeClasses.text.secondary} leading-relaxed`}>
                Are you sure you want to update the order status to <span className="font-bold text-[#2B3674] dark:text-blue-400">{statusToConfirm}</span>?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStatusToConfirm(null)}
                  disabled={actionInProgress}
                  className={`flex-1 px-4 py-2 border rounded-lg text-xs font-bold transition-colors ${
                    darkMode 
                      ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                      : 'border-gray-250 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusUpdate}
                  disabled={actionInProgress}
                  className={`flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg px-4 py-2.5 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15`}
                >
                  {actionInProgress ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrderDetails;
