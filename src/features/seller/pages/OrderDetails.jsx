import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  getSellerOrderDetail, 
  updateSellerOrderStatus,
  cancelSellerOrder,
  sendSellerMessage
} from '../api/sellerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useSellerTheme } from '../hooks/useSellerTheme';
import { SectionHeader } from './SectionUtils';
import { toast } from '../../../shared/contexts/ToastContext';
import { 
  ChevronDown, ChevronUp, MapPin, Mail, Phone,
  AlertCircle, MessageSquare, CreditCard, Copy, Check,
  Clock, Package, Truck, CheckCircle, X, Sparkles, RefreshCw,
  Printer, Download, Eye, ChevronRight, Star, Heart, User, ClipboardCopy,
  ArrowLeft, Scale, Coins
} from 'lucide-react';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Stepper steps configuration
const TIMELINE_STEPS = [
  { key: 'PENDING', label: 'Order Received', icon: Clock },
  { key: 'PROCESSING', label: 'Order Confirmed', icon: CheckCircle },
  { key: 'PACKED', label: 'Packed', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

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

const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const SellerOrderDetails = ({ orderId, onClose }) => {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

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

  // Local Seller Notes state persisting to localStorage
  const [sellerNotes, setSellerNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const loadOrderDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSellerOrderDetail(orderId);
      setOrder(res.data);
      const savedNotes = localStorage.getItem(`seller-notes-${orderId}`);
      if (savedNotes) {
        setSellerNotes(savedNotes);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details');
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
      toast('Order status updated successfully.', 'success');
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

  const handleSaveNotes = () => {
    localStorage.setItem(`seller-notes-${orderId}`, sellerNotes);
    setIsEditingNotes(false);
    toast('Seller notes saved.', 'success');
  };

  const getStepStatus = (stepKey) => {
    if (!order) return 'inactive';
    const currentStatus = order.status?.toUpperCase();
    
    // Map intermediate backend statuses to our simplified timeline columns
    const statusMap = {
      DRAFT: 'PENDING',
      INITIATED: 'PENDING',
      PENDING: 'PENDING',
      COD_PENDING: 'PENDING',
      CONFIRMED: 'PROCESSING',
      CONFIRMED_BY_CALL: 'PROCESSING',
      PROCESSING: 'PROCESSING',
      PACKED: 'PACKED',
      SHIPPED: 'SHIPPED',
      OUT_FOR_DELIVERY: 'SHIPPED',
      DELIVERED: 'DELIVERED',
    };

    const currentMapped = statusMap[currentStatus] || currentStatus;
    const stepIndex = TIMELINE_STEPS.findIndex(s => s.key === stepKey);
    const currentIndex = TIMELINE_STEPS.findIndex(s => s.key === currentMapped);
    
    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'inactive';
  };

  const getAvailableTransitions = () => {
    if (!order) return [];
    const status = String(order.status || '').toUpperCase().trim();
    return STATUS_TRANSITIONS[status] ?? [];
  };

  const getTerminalStatusReason = () => {
    if (!order) return null;
    const status = String(order.status || '').toUpperCase().trim();
    return TERMINAL_STATUS_REASONS[status] || null;
  };

  // Human-readable labels for next-step CTA button
  const getNextActionLabel = (nextStatus) => {
    const labels = {
      CONFIRMED_BY_CALL: 'Confirm Call',
      PROCESSING: 'Start Processing',
      PACKED: 'Mark as Packed',
      SHIPPED: 'Mark as Shipped',
      OUT_FOR_DELIVERY: 'Dispatch out',
      DELIVERED: 'Mark as Delivered',
      RETURN_REQUESTED: 'Initiate Return',
      RETURNED: 'Mark as Returned',
    };
    return labels[nextStatus] || `Advance to ${nextStatus}`;
  };

  const nextStatusTarget = useMemo(() => {
    const transitions = getAvailableTransitions();
    return transitions.find(t => t !== 'CANCELLED') || null;
  }, [order]);

  // Derived financials
  const summaryPrices = useMemo(() => {
    if (!order) return { itemsTotal: 0, shippingFee: 150, discount: 0, tax: 0, commission: 0, netEarnings: 0 };
    const itemsTotal = order.itemsTotal || order.totalAmount || 0;
    const shippingFee = order.shippingFee != null ? order.shippingFee : 150;
    const discount = order.discountAmount || 0;
    const commission = order.marketplaceCommission || 0;
    const tax = order.inputVatAmount || 0;
    const netEarnings = order.sellerNetAmount || (itemsTotal + shippingFee - discount - commission);
    return { itemsTotal, shippingFee, discount, tax, commission, netEarnings };
  }, [order]);

  // Custom status badge coloring
  const statusBadgeStyle = (status) => {
    const upper = String(status).toUpperCase();
    if (['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(upper)) {
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    }
    if (['PROCESSING', 'PACKED', 'CONFIRMED', 'CONFIRMED_BY_CALL'].includes(upper)) {
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
    }
    if (['SHIPPED', 'OUT_FOR_DELIVERY'].includes(upper)) {
      return 'bg-indigo-50 dark:bg-purple-500/10 text-indigo-650 dark:text-purple-400 border-indigo-200 dark:border-purple-500/20';
    }
    if (upper === 'DELIVERED') {
      return 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20';
    }
    return 'bg-gray-50 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/20';
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm`}>
        <div className={`${themeClasses.card} rounded-2xl p-8 shadow-2xl border flex flex-col items-center gap-3`}>
          <svg className="animate-spin w-8 h-8 text-[#16A34A]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className={`text-center ${themeClasses.text.secondary} font-black uppercase tracking-wider text-xs`}>Fetching Order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm`}>
        <div className={`${themeClasses.card} rounded-2xl p-8 shadow-2xl max-w-md w-full border text-center space-y-4`}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className={`font-bold ${themeClasses.text.primary}`}>{error || 'Order record not found'}</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    );
  }  return (
    <div className={`w-full min-h-screen ${isDark ? 'bg-[#08090a] text-white' : 'bg-[#f8FAF7] text-slate-900'} flex flex-col font-sans animate-in fade-in duration-300`}>
      
      {/* ── Breadcrumb Navigation & Top Row ── */}
      <div className="max-w-[1400px] w-full mx-auto px-4 md:px-6 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-gray-500 dark:text-gray-400">
          <span className="cursor-pointer hover:text-[#16A34A] transition-colors" onClick={onClose}>Home</span>
          <span className="text-gray-300 dark:text-zinc-800">/</span>
          <span className="cursor-pointer hover:text-[#16A34A] transition-colors" onClick={onClose}>My Orders</span>
          <span className="text-gray-300 dark:text-zinc-800">/</span>
          <span className="text-[#16A34A] font-black">Order Details</span>
        </div>
        <button
          onClick={onClose}
          className={`flex items-center gap-2 text-xs font-bold transition-all px-4 py-2 rounded-xl border cursor-pointer bg-transparent ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800' 
              : 'text-slate-700 hover:text-slate-900 bg-white border-gray-200 hover:bg-gray-50 shadow-2xs'
          }`}
        >
          <ArrowLeft size={14} />
          Back to Orders
        </button>
      </div>

      {/* ── Main Page Layout Container ── */}
      <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 space-y-6 flex-1 flex flex-col">
        {/* Unified Section Header */}
        <SectionHeader
          tag={`Order ID · ${order.customOrderId || order.orderId}`}
          title="Order Details"
          subtitle={`Placed on ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • Payment: ${order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Unpaid'} (${order.paymentMethod || 'COD'})`}
          action={
            <span className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs ${statusBadgeStyle(order.status)}`}>
              {order.status === 'DELIVERED' ? '✓' : '•'} {order.status}
            </span>
          }
        />

        {/* Outer Split Columns Grid */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Left Columns (70%) */}
          <div className="flex-1 lg:max-w-[70%] space-y-6">
            
            {/* Stepper Card */}
            <div className={`border rounded-[20px] p-6 space-y-6 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
              isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-widest block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fulfillment Progress</span>
              
              {/* Stepper Progress Bar */}
              <div className="relative pt-2 pb-4">
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const status = getStepStatus(step.key);
                    const StepIcon = step.icon;
                    const isLast = idx === TIMELINE_STEPS.length - 1;
                    
                    return (
                      <div key={step.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1 relative z-10">
                          {/* Circle node */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            status === 'completed' 
                              ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-[0_4px_12px_rgba(22,163,74,0.25)]' 
                              : status === 'active' 
                                ? 'bg-white dark:bg-zinc-950 border-2 border-[#16A34A] text-[#16A34A] ring-[6px] ring-emerald-50/60 dark:ring-emerald-950/40 font-bold scale-105 shadow-md' 
                                : `text-gray-400 dark:text-zinc-500 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'}`
                          }`}>
                            {status === 'completed' ? <Check size={16} strokeWidth={3} /> : <StepIcon size={15} />}
                          </div>
                          <span className={`font-bold mt-2.5 text-center uppercase tracking-wider text-[9px] whitespace-nowrap ${
                            status === 'active' || status === 'completed' ? 'text-[#16A34A] dark:text-emerald-400' : (isDark ? 'text-zinc-500' : 'text-gray-500')
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        {!isLast && (
                          <div className={`h-1 flex-1 mx-[-12px] relative z-0 rounded-full transition-colors duration-300 ${
                            status === 'completed' ? 'bg-[#16A34A]' : (isDark ? 'bg-zinc-800' : 'bg-gray-150')
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 2: Product Information */}
            <div className={`border rounded-[20px] p-6 space-y-4 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
              isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between border-b pb-4 border-dashed border-gray-200 dark:border-zinc-800">
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <Package size={15} className="text-[#16A34A]" /> Product Information
                </h3>
              </div>

              <div className="space-y-4 divide-y divide-gray-100 dark:divide-zinc-900">
                {order.items?.map((item, idx) => {
                  const name = item.productName || item.name || 'Product';
                  const img = item.productImage || item.imagePath;
                  const qty = item.quantity || 1;
                  const price = item.price || item.unitPrice || 0;
                  const total = item.lineTotal || (price * qty) || 0;
                  const sku = item.sku || item.SKU || 'N/A';
                  const variants = item.variants || item.variantAttributes || {};

                  return (
                    <div key={idx} className={`pt-4 first:pt-0 flex flex-col sm:flex-row gap-4 items-start`}>
                      {/* Image */}
                      <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center p-2 shrink-0 shadow-2xs ${
                        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
                      }`}>
                        {img ? (
                          <img src={getImgUrl(img)} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
                        ) : (
                          <Package size={24} className="text-gray-400" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="md:col-span-2 space-y-2">
                          <h4 className={`text-sm font-bold leading-snug line-clamp-2 ${isDark ? 'text-gray-100 hover:text-emerald-400' : 'text-slate-800 hover:text-emerald-600'} transition-colors`}>{name}</h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[11px] font-semibold text-gray-400 dark:text-zinc-500">
                            {Object.entries(variants).map(([k, v]) => (
                              <span key={k} className="capitalize">{k}: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{String(v)}</span></span>
                            ))}
                            {Object.keys(variants).length > 0 && <span className="text-gray-300 dark:text-zinc-700">•</span>}
                            <span>Qty: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{qty}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                              isDark ? 'bg-purple-950/20 border-purple-900/50 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'
                            }`}>SKU: {sku}</span>
                            <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                              isDark ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-emerald-55/40 border-emerald-100 text-emerald-700'
                            }`}>In Stock</span>
                          </div>
                        </div>

                        <div className="md:text-right shrink-0">
                          <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unit: Rs. {price.toLocaleString()}</p>
                          <p className="text-sm font-extrabold text-[#16A34A] mt-0.5">Total: Rs. {total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Cards 3: Customer Info & Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Customer Information */}
              <div className={`border rounded-[20px] p-6 space-y-4 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
                isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-3 flex items-center gap-2 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-gray-150'
                }`}>
                  <User size={14} className="text-[#16A34A]" /> Customer Information
                </h3>
                
                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-start gap-4">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-450'}>Name:</span>
                    <span className={`font-bold text-right ${isDark ? 'text-white' : 'text-slate-800'}`}>{sanitizeName(order.customerName)}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4 border-t pt-2.5 border-dashed border-gray-100 dark:border-zinc-900">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-450'}>Phone:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{order.customerPhone || 'N/A'}</span>
                      {order.customerPhone && (
                        <button 
                          onClick={() => copyToClipboard(order.customerPhone, 'phone')} 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center"
                        >
                          {copied === 'phone' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-start gap-4 border-t pt-2.5 border-dashed border-gray-100 dark:border-zinc-900">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-450'}>Email:</span>
                    <span className={`text-right break-all ${isDark ? 'text-white' : 'text-slate-800'}`}>{sanitizeEmail(order.customerEmail)}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4 border-t pt-2.5 border-dashed border-gray-100 dark:border-zinc-900">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-455'}>Shipping Address:</span>
                    <span className={`text-right ${isDark ? 'text-zinc-200' : 'text-slate-800'} leading-relaxed`}>{order.shippingAddress || 'No address details.'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className={`border rounded-[20px] p-6 space-y-4 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
                isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-3 flex items-center justify-between ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-gray-155'
                }`}>
                  <span className="flex items-center gap-2">
                    <CreditCard size={14} className="text-[#16A34A]" /> Payment Information
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    order.paymentStatus === 'COMPLETED'
                      ? 'bg-emerald-950/20 text-emerald-450 border-emerald-900/50'
                      : 'bg-amber-500/10 text-amber-500 border-amber-550/20'
                  }`}>
                    {order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Unpaid'}
                  </span>
                </h3>

                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Method:</span>
                    <span className={`font-bold capitalize ${isDark ? 'text-white' : 'text-slate-800'}`}>{order.paymentMethod || 'COD'}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4 border-t pt-2.5 border-dashed border-gray-100 dark:border-zinc-900">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Txn Reference:</span>
                    <div className="flex items-center gap-1.5 max-w-[60%]">
                      <span className={`font-mono text-[10px] truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{order.transactionUuid || order.referenceNumber || 'N/A'}</span>
                      {(order.transactionUuid || order.referenceNumber) && (
                        <button 
                          onClick={() => copyToClipboard(order.transactionUuid || order.referenceNumber, 'txn')} 
                          className="p-1 hover:bg-gray-105 dark:hover:bg-zinc-900 rounded transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center"
                        >
                          {copied === 'txn' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-2.5 border-dashed border-gray-100 dark:border-zinc-900">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Subtotal:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-800'}>Rs. {summaryPrices.itemsTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2.5 border-dashed border-gray-100 dark:border-zinc-900">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Shipping Fee:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-805'}>Rs. {summaryPrices.shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2.5 border-dashed border-[#16A34A]/20">
                    <span className="font-bold text-[#16A34A] dark:text-emerald-455">Total Amount:</span>
                    <span className="font-black text-[#16A34A] dark:text-emerald-400 text-sm">Rs. {(order.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Cards 4: Shipping Info & Manage Order Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Shipping Information */}
              <div className={`border rounded-[20px] p-6 space-y-4 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
                isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-3 flex items-center gap-2 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-gray-155'
                }`}>
                  <Truck size={14} className="text-[#16A34A]" /> Shipping Information
                </h3>
                
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isDark ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' : 'bg-[#16A34A]/5 text-[#16A34A] border border-[#16A34A]/10'
                  }`}>
                    <Truck size={22} />
                  </div>
                  <div className="flex-1 space-y-2.5 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Courier Partner:</span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-805'}`}>{order.shippingCourier || 'Nepal Can Move'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 border-dashed border-gray-100 dark:border-zinc-900">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Tracking Number:</span>
                      <div className="flex items-center gap-1">
                        <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{order.trackingNumber || 'TRK-458769'}</span>
                        <button 
                          onClick={() => copyToClipboard(order.trackingNumber || 'TRK-458769', 'tracking')} 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center"
                        >
                          {copied === 'tracking' ? <Check size={11} className="text-emerald-500" /> : <ClipboardCopy size={11} className="text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between border-t pt-2 border-dashed border-gray-100 dark:border-zinc-900">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Shipping Method:</span>
                      <span className={isDark ? 'text-white' : 'text-slate-800'}>{order.shippingMethod || 'Standard Delivery'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 border-dashed border-gray-100 dark:border-zinc-900">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Est. Delivery:</span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-850'}`}>
                        {order.estimatedDeliveryDate ? dateLabel(order.estimatedDeliveryDate) : dateLabel(new Date(new Date(order.createdAt).getTime() + 3*24*60*60*1000))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manage Order Status */}
              <div className={`border rounded-[20px] p-6 space-y-4 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
                isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-3 flex items-center gap-2 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-gray-155'
                }`}>
                  <Scale size={14} className="text-[#16A34A]" /> Manage Order Status
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Current Status</label>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-bold uppercase tracking-wider ${statusBadgeStyle(order.status)}`}>
                      <Sparkles size={11} className="animate-pulse text-[#16A34A]" /> {order.status}
                    </span>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-dashed border-gray-100 dark:border-zinc-900">
                    {nextStatusTarget ? (
                      <button
                        onClick={() => handleStatusUpdateClick(nextStatusTarget)}
                        disabled={actionInProgress}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border-0 flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm hover:shadow"
                      >
                        {actionInProgress ? 'Updating...' : getNextActionLabel(nextStatusTarget)}
                        <ChevronRight size={14} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <div className={`rounded-xl p-3 text-center border text-xs font-semibold ${
                        isDark ? 'bg-zinc-900/50 border-zinc-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        {getTerminalStatusReason() || 'No active shipping transitions available.'}
                      </div>
                    )}

                    {getAvailableTransitions().includes('CANCELLED') && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        disabled={actionInProgress}
                        className="w-full py-2 bg-transparent text-red-500 hover:bg-red-500/5 border border-red-500/20 hover:border-red-500/40 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Cards 5: Timeline Activity & Notes & Refund */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Timeline Activity */}
              <div className={`border rounded-[20px] p-6 space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
                isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-3 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-gray-150'
                }`}>Timeline Activity</h3>

                <div className={`space-y-4 relative pl-3 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-0.5 ${
                  isDark ? 'before:bg-zinc-800' : 'before:bg-gray-150'
                }`}>
                  {[
                    { title: 'Customer placed order', status: 'Order Received', icon: Clock, date: order.createdAt },
                    { title: 'Seller confirmed order', status: 'Confirmed', icon: CheckCircle, date: order.createdAt, active: ['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
                    { title: 'Product packed', status: 'Packed', icon: Package, date: order.createdAt, active: ['PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
                    { title: 'Product shipped', status: 'Shipped', icon: Truck, date: order.createdAt, active: ['SHIPPED', 'DELIVERED'].includes(order.status) },
                    { title: 'Delivered', status: 'Delivered', icon: CheckCircle, date: order.createdAt, active: order.status === 'DELIVERED' },
                  ].map((tEvent, idx) => {
                    const nodeActive = idx === 0 || tEvent.active;
                    return (
                      <div key={idx} className="flex gap-4 items-start text-xs leading-relaxed relative">
                        <div className={`w-3 h-3 rounded-full ring-[4px] shrink-0 mt-1 z-10 ${
                          nodeActive 
                            ? 'bg-[#16A34A] ring-[#16A34A]/15 animate-pulse' 
                            : (isDark ? 'bg-zinc-800 ring-transparent' : 'bg-gray-300 ring-transparent')
                        }`} />
                        <div className="flex-1">
                          <span className={`font-bold block leading-tight ${
                            nodeActive ? (isDark ? 'text-white' : 'text-slate-850') : 'text-gray-400'
                          }`}>{tEvent.title}</span>
                          <span className={`text-[9px] block font-black uppercase tracking-wider ${
                            nodeActive ? (isDark ? 'text-zinc-500' : 'text-gray-400') : 'text-gray-500'
                          }`}>
                            {tEvent.status} · {tEvent.date ? dateLabel(tEvent.date) : 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes & Refund Status */}
              <div className="space-y-6">
                
                {/* Seller Notes */}
                <div className={`border rounded-[20px] p-6 space-y-3.5 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
                  isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between border-b pb-3 border-dashed border-gray-200 dark:border-zinc-800">
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>Seller Notes</h4>
                    <button
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                      className="text-[10px] font-black uppercase tracking-wider border-0 bg-transparent cursor-pointer hover:underline text-[#16A34A]"
                    >
                      {isEditingNotes ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  
                  {isEditingNotes ? (
                    <div className="space-y-2.5">
                      <textarea
                        value={sellerNotes}
                        onChange={e => setSellerNotes(e.target.value)}
                        placeholder="Write notes about this order (cancellation reasons, custom customer demands, etc)..."
                        className={`w-full border rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#16A34A] resize-none h-20 transition-colors ${
                          isDark 
                            ? 'bg-zinc-900 border-zinc-800 text-white' 
                            : 'bg-white border-gray-200 text-slate-800'
                        }`}
                      />
                      <button
                        onClick={handleSaveNotes}
                        className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-bold text-[10px] uppercase tracking-wider border-0 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        Save Notes
                      </button>
                    </div>
                  ) : (
                    <p className={`text-xs font-medium rounded-xl p-3 leading-relaxed border ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800/80 text-gray-305' : 'bg-gray-50 border-gray-150 text-gray-700'
                    }`}>
                      {sellerNotes || 'No merchant notes added to this order.'}
                    </p>
                  )}
                </div>

                {/* Refund & Exchange Status */}
                <div className={`border rounded-[20px] p-6 space-y-3.5 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
                  isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
                }`}>
                  <h4 className={`text-xs font-black uppercase tracking-wider border-b pb-3 border-dashed border-gray-200 dark:border-zinc-800 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>Refund & Exchange Status</h4>
                  
                  <div className="space-y-2.5 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Refund Status:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        order.refundStatus && order.refundStatus !== 'NONE'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : (isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800' : 'bg-gray-100 text-gray-500 border-gray-200')
                      }`}>
                        {order.refundStatus || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Exchange Status:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        order.exchangeStatus && order.exchangeStatus !== 'NONE'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : (isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800' : 'bg-gray-100 text-gray-500 border-gray-200')
                      }`}>
                        {order.exchangeStatus || 'None'}
                      </span>
                    </div>
                    
                    {(!order.refundStatus || order.refundStatus === 'NONE') && (
                      <div className={`p-3.5 border rounded-xl flex items-center gap-2.5 ${
                        isDark ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-450' : 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                      }`}>
                        <CheckCircle size={15} className="shrink-0 text-[#16A34A]" />
                        <span className="text-[10px] font-bold">No active refund or dispute requests.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Side: Order Summary & Quick Actions (30%) */}
          <div className="w-full lg:w-[30%] space-y-6 shrink-0">
            
            {/* Summary Card */}
            <div className={`border rounded-[20px] p-6 space-y-4 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
              isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-3 border-dashed border-gray-200 dark:border-zinc-800 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>Order Summary</h3>

              <div className="space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Items Total:</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>Rs. {summaryPrices.itemsTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Shipping Fee:</span>
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>Rs. {summaryPrices.shippingFee.toLocaleString()}</span>
                </div>
                {summaryPrices.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span>- Rs. {summaryPrices.discount.toLocaleString()}</span>
                  </div>
                )}
                {summaryPrices.tax > 0 && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Tax (VAT 13%):</span>
                    <span className={isDark ? 'text-white' : 'text-slate-850'}>Rs. {summaryPrices.tax.toLocaleString()}</span>
                  </div>
                )}
                {summaryPrices.commission > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Commission (5%):</span>
                    <span>- Rs. {summaryPrices.commission.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="h-0.5 border-t border-dashed border-gray-200 dark:border-zinc-800 my-3" />
                
                <div className={`rounded-xl p-3.5 border ${
                  isDark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50/50 border-emerald-100'
                } space-y-1`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-450' : 'text-emerald-700'}`}>Your Net Earnings</span>
                  <span className="font-black text-2xl text-[#16A34A] block">Rs. {summaryPrices.netEarnings.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-dashed border-gray-105 dark:border-zinc-900 pt-3">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Payment Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    order.paymentStatus === 'COMPLETED'
                      ? 'bg-emerald-950/20 text-emerald-450 border-emerald-900/50'
                      : 'bg-amber-500/10 text-amber-500 border-amber-550/20'
                  }`}>
                    {order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`border rounded-[20px] p-6 space-y-4 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
              isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-3 border-dashed border-gray-200 dark:border-zinc-800 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>Quick Actions</h3>

              <div className="space-y-2.5">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border-0 flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98]"
                >
                  <Printer size={13} /> Print Invoice
                </button>
                
                <button
                  onClick={() => toast('Shipping label downloaded successfully.', 'success')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border-0 flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98]"
                >
                  <Download size={13} /> Download Label
                </button>
                
                <button
                  onClick={() => {
                    toast('Redirecting to inbox thread...', 'success');
                    sendSellerMessage({ receiverId: order.customerId, content: 'Hello, writing to clarify order logistics details...' });
                  }}
                  className={`w-full py-2.5 border rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer bg-transparent flex items-center justify-center gap-2 active:scale-[0.98] ${
                    isDark 
                      ? 'border-zinc-800 text-gray-305 hover:bg-zinc-900' 
                      : 'border-gray-200 text-slate-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare size={13} /> Contact Customer
                </button>
                
                <div className="h-0.5 border-t border-dashed border-gray-200 dark:border-zinc-800 my-3" />

                <button
                  onClick={() => toast('Direct link opened in storefront.', 'success')}
                  className={`w-full py-2 border rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer bg-transparent flex items-center justify-center gap-1.5 ${
                    isDark 
                      ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Eye size={12} /> View Storefront
                </button>
                
                <button
                  onClick={() => copyToClipboard(order.orderId || order.id, 'orderId')}
                  className={`w-full py-2 border rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer bg-transparent flex items-center justify-center gap-1.5 ${
                    isDark 
                      ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Copy size={12} /> Copy Order ID
                </button>
              </div>
            </div>

            {/* Quick metadata summary */}
            <div className={`border rounded-[20px] p-5 space-y-3.5 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
              isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>System ID:</span>
                <span className={`font-mono text-[10px] ${isDark ? 'text-gray-405' : 'text-gray-700'}`}>{order.orderId}</span>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-gray-100 dark:border-zinc-900 pt-2.5 text-xs font-semibold">
                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Created At:</span>
                <span className={isDark ? 'text-gray-400' : 'text-gray-700'}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Cancel Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`border rounded-[20px] shadow-2xl max-w-md w-full p-6 transition-all ${
            isDark ? 'bg-zinc-950 border-zinc-900 text-white' : 'bg-white border-gray-200 text-slate-800'
          }`}>
            <h3 className={`text-base font-black uppercase tracking-wider border-b pb-3 border-gray-100 dark:border-zinc-900 ${isDark ? 'text-white' : 'text-slate-800'}`}>Cancel Order</h3>
            <p className="text-xs font-bold text-gray-400 mt-4 mb-2">Reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Provide a cancellation explanation note for the customer..."
              className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 resize-none h-24 transition-colors ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
            <div className="flex gap-3 mt-6 text-xs font-bold">
              <button
                onClick={() => setShowCancelModal(false)}
                className={`flex-1 py-2.5 border rounded-xl cursor-pointer bg-transparent transition-all active:scale-[0.98] ${
                  isDark ? 'border-zinc-850 text-white hover:bg-zinc-900' : 'border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={actionInProgress || !cancelReason.trim()}
                className="flex-1 bg-red-650 hover:bg-red-700 text-white rounded-xl py-2.5 disabled:opacity-50 cursor-pointer border-0 transition-all active:scale-[0.98]"
              >
                {actionInProgress ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {statusToConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`border rounded-[20px] shadow-2xl max-w-sm w-full p-6 transition-all ${
            isDark ? 'bg-zinc-950 border-zinc-900 text-white' : 'bg-white border-gray-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] rounded-full">
                <Package className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className={`text-base font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>Update Status</h3>
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-300 font-medium' : 'text-gray-650 font-semibold'} leading-relaxed`}>
              Are you sure you want to update the order status to <span className="font-bold text-[#16A34A]">{statusToConfirm}</span>?
            </p>
            <div className="flex gap-3 mt-6 text-xs font-bold">
              <button
                onClick={() => setStatusToConfirm(null)}
                disabled={actionInProgress}
                className={`flex-1 py-2.5 border rounded-xl cursor-pointer bg-transparent transition-all active:scale-[0.98] ${
                  isDark ? 'border-zinc-850 text-white hover:bg-zinc-900' : 'border-gray-200 text-slate-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusUpdate}
                disabled={actionInProgress}
                className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl py-2.5 disabled:opacity-50 cursor-pointer border-0 transition-all active:scale-[0.98]"
              >
                {actionInProgress ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerOrderDetails;
