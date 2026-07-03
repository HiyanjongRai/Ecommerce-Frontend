import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Printer, ShieldAlert, Package, Check, X, ShieldCheck,
  HelpCircle, FileText, Download, MessageSquare, Phone, Info,
  Clock, AlertTriangle, AlertCircle
} from 'lucide-react';
import { useSellerTheme } from '../../seller/hooks/useSellerTheme';
import { useSellerRefund } from '../hooks/useSellerRefund';
import { getStatusLabel } from '../constants/RefundConstants';
import { BASE_URL } from '../../../shared/api/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';

const TIMELINE_STEPS = [
  { key: 'REQUESTED', label: 'Refund Requested' },
  { key: 'SELLER_REVIEW', label: 'Seller Review' },
  { key: 'AWAITING_CUSTOMER', label: 'Awaiting Customer' },
  { key: 'RETURN', label: 'Product Return' },
  { key: 'INSPECTION', label: 'Inspection' },
  { key: 'APPROVED', label: 'Refund Approved' },
  { key: 'COMPLETED', label: 'Completed' }
];

const getTimelineStepIndex = (status) => {
  const s = String(status || '').toUpperCase();
  if (s.includes('SUBMIT') || s.includes('PENDING_SELLER') || s.includes('SELLER_REVIEW') || s.includes('UNDER_REVIEW')) return 1;
  if (s.includes('AWAITING_CUSTOMER')) return 2;
  if (s.includes('RETURN') || s.includes('SHIPPED')) return 3;
  if (s.includes('INSPECT')) return 4;
  if (s.includes('APPROV')) return 5;
  if (s.includes('COMPLET') || s.includes('RESOLV')) return 6;
  return 1;
};

export default function SellerRefundDetails({
  detail,
  onBack,
  onRefresh,
  error,
  setError
}) {
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;

  const hooksContext = useSellerRefund({ detail, onRefresh, error, setError });
  const {
    submitting,
    copied,
    copyToClipboard,
    showRejectModal,
    setShowRejectModal,
    rejectNotes,
    setRejectNotes,
    showOfferModal,
    setShowOfferModal,
    offerType,
    setOfferType,
    offerNotes,
    setOfferNotes,
    offerAmount,
    setOfferAmount,
    acceptStep,
    setAcceptStep,
    needsReturn,
    setNeedsReturn,
    showInspectionModal,
    setShowInspectionModal,
    inspectionForm,
    setInspectionForm,
    showPayoutModal,
    setShowPayoutModal,
    payoutForm,
    setPayoutForm,
    payoutFile,
    setPayoutFile,
    uploadingPayout,
    showShippingModal,
    setShowShippingModal,
    shippingCourier,
    setShippingCourier,
    shippingTracking,
    setShippingTracking,
    handleApproveWithReturn,
    handleRequestEvidence,
    handleConfirmReceived,
    handleEscalateClaim,
    handleAcceptNegotiation,
    handleAskPayment,
    handleRejectSubmit,
    handleInspectionSubmit,
    handleOfferSubmit,
    handlePayoutSubmit,
    handleShippingSubmit
  } = hooksContext;

  const [sellerNotes, setSellerNotes] = useState([
    'Customer has requested refund before (2 times) in last 6 months.',
    'Packaging appears slightly damaged in the delivery photo.',
    'Need warehouse confirmation about the product condition.'
  ]);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSellerNotes(prev => [...prev, newNote.trim()]);
    setNewNote('');
  };

  if (!detail) return null;

  const activeStepIdx = getTimelineStepIndex(detail.status);
  const items = detail.items || [];
  const primaryItem = items[0] || {};

  return (
    <div className={`space-y-6 max-w-[1400px] font-sans pb-16 text-slate-800 ${isDark ? 'text-slate-100' : ''}`}>

      {/* Breadcrumb Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Refund Request</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-gray-650 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Back to Refunds
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold text-gray-650 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Top Summary Grid */}
      <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-4 gap-x-6 text-xs">
          <div>
            <p className="text-gray-400 font-medium mb-1">Refund ID</p>
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-900 dark:text-white">{detail.refundNumber || '#RF-2024-000128'}</span>
              <button
                onClick={() => copyToClipboard(detail.refundNumber || '#RF-2024-000128', 'refundId')}
                className="text-gray-400 hover:text-emerald-600"
              >
                {copied === 'refundId' ? <Check size={13} className="text-emerald-600" /> : <Check size={13} />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-gray-400 font-medium mb-1">Status</p>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-100 dark:border-amber-500/20">
              {detail.status ? getStatusLabel(detail.status) : 'Under Review'}
            </span>
          </div>

          <div>
            <p className="text-gray-400 font-medium mb-1">Requested On</p>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {detail.createdAt
                ? new Date(detail.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '20 May, 2024 at 02:15 PM'}
            </span>
          </div>

          <div>
            <p className="text-gray-400 font-medium mb-1">Respond By</p>
            <span className="font-bold text-red-500 flex items-center gap-1">
              <Clock size={13} />
              22 May, 2024 (2d 18h left)
            </span>
          </div>

          <div>
            <p className="text-gray-400 font-medium mb-1">Order ID</p>
            <span className="font-bold text-emerald-600 dark:text-emerald-500 hover:underline cursor-pointer">
              {detail.orderNumber || detail.orderId || '#ORD-2024-000123'}
            </span>
          </div>

          <div>
            <p className="text-gray-400 font-medium mb-1">Order Date</p>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              18 May, 2024 at 10:30 AM
            </span>
          </div>
        </div>
      </div>

      {/* Progress Stepper Timeline */}
      <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
        <div className="relative flex items-center justify-between max-w-4xl mx-auto px-4">
          <div className="absolute top-[18px] left-[5%] right-[5%] h-[2px] bg-gray-100 dark:bg-white/5 -z-10" />
          <div
            className="absolute top-[18px] left-[5%] h-[2px] bg-emerald-600 transition-all duration-500 -z-10"
            style={{ width: `${(activeStepIdx / (TIMELINE_STEPS.length - 1)) * 90}%` }}
          />

          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIdx;
            const isActive = idx === activeStepIdx;

            return (
              <div key={step.key} className="flex flex-col items-center flex-1 text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#0b0c10] transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-white border-2 border-emerald-600 text-emerald-600'
                      : 'bg-white border border-gray-200 text-gray-300 dark:bg-white/5 dark:border-white/10'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : isActive ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-white/10" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold mt-2 leading-tight max-w-[80px] ${
                    isActive ? 'text-emerald-600' : isCompleted ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT COLUMN (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer's Refund Request */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Customer's Refund Request</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-gray-150 bg-gray-50 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                  {primaryItem.imagePath || detail.productImage ? (
                    <img
                      src={getImgUrl(primaryItem.imagePath || detail.productImage)}
                      alt="Product"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  ) : (
                    <Package size={24} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{primaryItem.productName || 'iPhone 15 Pro Max'}</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {[primaryItem.variantLabel, primaryItem.color].filter(Boolean).join(', ') || '256GB, Black Titanium'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">SKU: {primaryItem.sku || 'IP15PM-256-BK'} • Qty: {primaryItem.quantity || 1}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-xs text-right w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 justify-between sm:justify-end">
                <div>
                  <p className="text-gray-400 font-medium mb-1">Purchase Price</p>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{money(primaryItem.unitPrice || 25500)}</span>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1">Refund Amount</p>
                  <span className="font-bold text-emerald-600 dark:text-emerald-500">{money(detail.refundAmount || 25500)}</span>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1">Refund Type</p>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-100 dark:border-emerald-500/20">
                    Full Refund
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reason */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Customer Reason</h3>
            <div className="relative bg-gray-55 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4.5">
              <span className="absolute top-2.5 left-3 text-4xl text-gray-300 font-serif leading-none select-none">“</span>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed pl-6 pr-4">
                {detail.description || 'Received damaged product. The screen has a green line and touch is not working properly.'}
              </p>
              <span className="absolute bottom-1 right-4 text-4xl text-gray-300 font-serif leading-none select-none">”</span>
            </div>
          </div>

          {/* Uploaded Evidence */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
              Uploaded Evidence ({detail.evidence?.length || 3})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {detail.evidence && detail.evidence.length > 0 ? (
                detail.evidence.map((file, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <a
                      href={getImgUrl(file.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="relative group aspect-square rounded-xl border border-gray-250 bg-gray-50 flex items-center justify-center p-1.5 overflow-hidden shadow-2xs hover:border-gray-300 transition-colors"
                    >
                      <img src={getImgUrl(file.fileUrl)} alt="Evidence" className="max-w-full max-h-full object-contain rounded" />
                    </a>
                    <p className="text-[10px] text-gray-400 font-semibold truncate text-center">{file.name || `image_${String(idx+1).padStart(3, '0')}.jpg`}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="relative group aspect-square rounded-xl border border-gray-150 bg-gray-50 flex items-center justify-center p-1.5 overflow-hidden shadow-2xs">
                      <div className="w-full h-full bg-slate-800 rounded flex items-center justify-center text-white text-[10px] font-bold">Image Preview</div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold text-center">image_001.jpg</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="relative group aspect-square rounded-xl border border-gray-150 bg-gray-50 flex items-center justify-center p-1.5 overflow-hidden shadow-2xs">
                      <div className="w-full h-full bg-slate-700 rounded flex items-center justify-center text-white text-[10px] font-bold">Image Preview 2</div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold text-center">image_002.jpg</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="relative group aspect-square rounded-xl border border-gray-150 bg-gray-50 flex items-center justify-center p-1.5 overflow-hidden shadow-2xs">
                      <div className="w-full h-full bg-slate-900 rounded flex items-center justify-center text-white text-[10px] font-bold">Video Clip</div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold text-center">video_001.mp4</p>
                  </div>
                  <div className="space-y-1.5">
                    <button className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-250 hover:border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-gray-550 transition-colors">
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-[11px] font-bold">View All</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-5">Order Timeline</h3>
            <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">
              <div className="absolute top-[18px] left-[5%] right-[5%] h-[2px] bg-emerald-600 -z-10" />
              
              {[
                { label: 'Ordered', date: '18 May, 2024', time: '10:30 AM' },
                { label: 'Packed', date: '18 May, 2024', time: '04:15 PM' },
                { label: 'Shipped', date: '19 May, 2024', time: '11:20 AM' },
                { label: 'Delivered', date: '20 May, 2024', time: '01:10 PM' },
                { label: 'Refund Requested', date: '20 May, 2024', time: '02:15 PM', highlight: true }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#0b0c10] text-white ${step.highlight ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-900 dark:text-white mt-2 leading-tight">{step.label}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 font-medium">{step.date}</span>
                  <span className="text-[9px] text-gray-400 font-medium">{step.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seller Notes (Internal Only) */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Seller Notes (Internal Only)</h3>
            
            <div className="bg-amber-50/60 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl p-4.5 mb-5 space-y-2">
              <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-400 space-y-1.5 font-medium">
                {sellerNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleAddNote} className="flex gap-3">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a private note..."
                className="flex-1 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs bg-white dark:bg-white/5 outline-none focus:border-emerald-600 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border-0"
              >
                Add Note
              </button>
            </form>
          </div>

          {/* Activity Log */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Activity Log</h3>
              <button className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-wide border-0 bg-transparent cursor-pointer">View All Activity</button>
            </div>
            
            <div className="relative border-l border-gray-150 dark:border-white/10 pl-6 ml-3 space-y-5">
              {[
                { time: '20 May, 2024 02:15 PM', desc: 'Customer requested refund' },
                { time: '20 May, 2024 02:18 PM', desc: 'Customer uploaded 3 evidence files' },
                { time: '20 May, 2024 02:25 PM', desc: 'Seller viewed this refund request' },
                { time: '20 May, 2024 02:30 PM', desc: 'Warehouse team notified' },
                { time: '20 May, 2024 02:30 PM', desc: 'Waiting for seller decision' }
              ].map((act, idx) => (
                <div key={idx} className="relative flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold gap-1">
                  <div className="absolute -left-[31px] w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-[#0b0c10]" />
                  <span className="text-gray-400 font-medium">{act.time}</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right sm:text-left">{act.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1 Col) */}
        <div className="space-y-6">

          {/* Customer Information */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Customer Information</h3>
            
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0">
                HR
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{detail.customerName || 'Hiyan Jung Rai'}</span>
                  <span className="inline-flex px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[8px] font-bold border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-wide">
                    ✓ Verified
                  </span>
                </div>
                <span className="text-[10.5px] text-gray-400 font-medium">{detail.customerEmail || 'hiyanrai23@gmail.com'}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs border-b border-gray-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
                <Phone size={13} />
                <span>+977 9841234567</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
                <ShieldCheck size={13} />
                <span>Member since Jan 2021</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-4 text-xs font-semibold">
              <div>
                <p className="text-gray-400 font-medium mb-1">Total Orders</p>
                <span className="text-gray-900 dark:text-white text-[13px] font-bold">11</span>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Completed Orders</p>
                <span className="text-gray-900 dark:text-white text-[13px] font-bold">9</span>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Cancelled Orders</p>
                <span className="text-gray-900 dark:text-white text-[13px] font-bold">1</span>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Previous Refunds</p>
                <span className="text-gray-900 dark:text-white text-[13px] font-bold text-red-500">2</span>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Fraud Risk</p>
                <span className="text-emerald-600 font-bold uppercase text-[11px]">Low</span>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Customer Rating</p>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-[13px]">★</span>
                  <span className="text-gray-800 dark:text-gray-200">4.8 <span className="text-gray-400 font-medium text-[10px]">(128)</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Order Summary</h3>
            <div className="space-y-3.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Order ID</span>
                <span className="font-mono text-gray-900 dark:text-white">#ORD-2024-000123</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Payment Method</span>
                <span>eSewa</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Courier</span>
                <span>Sparrow Express</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Tracking Number</span>
                <span className="text-emerald-600 dark:text-emerald-500 hover:underline cursor-pointer">SPX123456789NP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Delivered On</span>
                <span>20 May, 2024</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Return Window</span>
                <span className="text-emerald-600 dark:text-emerald-500">7 days left (27 May, 2024)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Warranty</span>
                <span>1 Year</span>
              </div>
              
              <button className="w-full mt-2 py-2.5 bg-gray-50 hover:bg-gray-105 border border-gray-200 dark:bg-white/5 dark:border-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <FileText size={14} />
                View Invoice
              </button>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Product Information</h3>
            
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg border border-gray-150 bg-gray-55 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                {primaryItem.imagePath || detail.productImage ? (
                  <img
                    src={getImgUrl(primaryItem.imagePath || detail.productImage)}
                    alt="Product"
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : (
                  <Package size={20} className="text-gray-400" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-950 dark:text-white leading-tight">{primaryItem.productName || 'iPhone 15 Pro Max'}</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Apple • 256GB, Black Titanium</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">SKU: {primaryItem.sku || 'IP15PM-256-BK'}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold text-gray-800 dark:text-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Price</span>
                <span>Rs. 25,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Seller Warranty</span>
                <span>1 Year Official Warranty</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Stock Remaining</span>
                <span>12 units</span>
              </div>
            </div>
          </div>

          {/* Refund Summary */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Refund Summary</h3>
            <div className="space-y-3.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Paid Amount</span>
                <span>Rs. 25,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Refund Requested</span>
                <span className="text-red-500 font-bold">Rs. 25,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Shipping Refund</span>
                <span className="text-emerald-600 dark:text-emerald-500">Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Platform Fee</span>
                <span>Rs. 0</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-150 dark:border-white/10 pt-3.5 mt-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Estimated Refund</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-500">Rs. 25,500</span>
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Risk Analysis</h3>
            
            <div className="relative flex flex-col items-center justify-center py-4 mb-4">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="#16A34A" strokeWidth="8" fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * 18) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[17px] font-black text-slate-800">18<span className="text-gray-400 font-bold text-xs">/100</span></span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">Low Risk</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              {[
                'Verified customer',
                'No previous disputes in last 6 months',
                'Account age: 3 years',
                'High customer review score'
              ].map((point, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    ✓
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Footer Large Action Buttons */}
      <div className="bg-white dark:bg-[#0b0c10] border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowOfferModal(true)}
            className="py-4 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer shadow-sm border-0"
          >
            <span className="text-sm font-black flex items-center gap-1.5">
              <Check size={16} strokeWidth={3} /> Approve Refund
            </span>
            <span className="text-[10px] text-white/80 font-semibold">Approve and process refund</span>
          </button>
          
          <button
            onClick={() => setShowRejectModal(true)}
            className="py-4 bg-red-600 hover:bg-red-750 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer shadow-sm border-0"
          >
            <span className="text-sm font-black flex items-center gap-1.5">
              <X size={16} strokeWidth={3} /> Reject Refund
            </span>
            <span className="text-[10px] text-white/80 font-semibold">Deny this refund request</span>
          </button>

          <button
            onClick={handleRequestEvidence}
            className="py-4 bg-[#EA580C] hover:bg-orange-700 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer shadow-sm border-0"
          >
            <span className="text-sm font-black flex items-center gap-1.5">
              <HelpCircle size={16} /> Request More Evidence
            </span>
            <span className="text-[10px] text-white/80 font-semibold">Ask customer for more proof</span>
          </button>
        </div>

        {/* Small Bottom Row actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <button
            onClick={() => handleApproveWithReturn()}
            className="py-3 bg-gray-55 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Package size={14} />
            Request Product Return
          </button>
          <button
            className="py-3 bg-gray-55 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={14} />
            Chat with Customer
          </button>
          <button
            className="py-3 bg-gray-55 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Phone size={14} />
            Contact Customer
          </button>
          <button
            className="py-3 bg-gray-55 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download size={14} />
            Download Invoice
          </button>
        </div>
      </div>

      {/* Approve Option / Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden bg-white text-gray-700">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Choose Approval / Counter Option</h3>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-650 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="w-full bg-gray-100 h-1">
              <div
                className="bg-[#16A34A] h-full transition-all duration-500 ease-out"
                style={{ width: acceptStep === 'return_check' ? '50%' : '100%' }}
              />
            </div>

            <form onSubmit={handleOfferSubmit} className="p-5 space-y-5 text-xs font-semibold">
              {acceptStep === 'return_check' ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#16A34A]">Step 1 of 2: Return Requirement</p>
                    <h4 className="text-xs font-bold text-gray-900">
                      Do you require the customer to return the item(s)?
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOfferModal(false);
                        handleApproveWithReturn();
                      }}
                      className="flex gap-4 p-4 rounded-xl border border-gray-250 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-xs cursor-pointer bg-transparent w-full group hover:border-[#16A34A]/50 hover:bg-[#16A34A]/5 text-gray-750"
                    >
                      <div className="p-3 rounded-xl shrink-0 flex items-center justify-center bg-[#16A34A]/10 text-[#16A34A]">
                        <Package size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-[11px] uppercase tracking-wider text-[#16A34A]">
                          Need Return (Return Required)
                        </p>
                        <p className="text-[10px] font-semibold text-gray-400 mt-1 leading-relaxed">
                          Customer must ship the item(s) back. Once you receive and inspect the package, the resolution will be completed.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNeedsReturn(false);
                        setAcceptStep('resolution_select');
                        setOfferType('FULL_REFUND');
                      }}
                      className="flex gap-4 p-4 rounded-xl border border-gray-250 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-xs cursor-pointer bg-transparent w-full group hover:border-[#16A34A]/50 hover:bg-[#16A34A]/5 text-gray-750"
                    >
                      <div className="p-3 rounded-xl shrink-0 flex items-center justify-center bg-[#16A34A]/10 text-[#16A34A]">
                        <Package size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-[11px] uppercase tracking-wider text-[#16A34A]">
                          No Need Return (Direct Resolution)
                        </p>
                        <p className="text-[10px] font-semibold text-gray-400 mt-1 leading-relaxed">
                          No shipping return required. Directly disburse a full refund, negotiate a partial refund, or send a replacement.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#16A34A]">Step 2 of 2: Resolution Type</p>
                    <button
                      type="button"
                      onClick={() => setAcceptStep('return_check')}
                      className="text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-[#16A34A] bg-transparent border-0 cursor-pointer flex items-center gap-1 transition-colors duration-200"
                    >
                      ← Back to Step 1
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400">Select Resolution Offer</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setOfferType('FULL_REFUND')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent gap-1.5 ${offerType === 'FULL_REFUND'
                            ? 'border-[#16A34A] bg-[#16A34A]/15 text-[#16A34A] shadow-xs scale-[1.02]'
                            : 'border-gray-250 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                      >
                        <Package size={16} />
                        Full Refund
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferType('PARTIAL_REFUND')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent gap-1.5 ${offerType === 'PARTIAL_REFUND'
                            ? 'border-[#16A34A] bg-[#16A34A]/15 text-[#16A34A] shadow-xs scale-[1.02]'
                            : 'border-gray-250 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                      >
                        <Package size={16} />
                        Partial Refund
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferType('EXCHANGE')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent gap-1.5 ${offerType === 'EXCHANGE'
                            ? 'border-[#16A34A] bg-[#16A34A]/15 text-[#16A34A] shadow-xs scale-[1.02]'
                            : 'border-gray-250 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                      >
                        <Package size={16} />
                        Exchange Item
                      </button>
                    </div>
                  </div>

                  {offerType === 'PARTIAL_REFUND' && (
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Partial Offer Amount (NPR)</label>
                      <input
                        type="number"
                        value={offerAmount}
                        onChange={e => setOfferAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full border rounded-xl p-3 font-semibold outline-none focus:border-[#16A34A] bg-white text-gray-900 border-gray-200"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Explanation Note</label>
                    <textarea
                      value={offerNotes}
                      onChange={e => setOfferNotes(e.target.value)}
                      placeholder="Provide resolution offer details or counter proposal remarks..."
                      className="w-full border border-gray-250 rounded-xl p-3 font-semibold outline-none h-20 focus:border-[#16A34A] bg-white text-gray-900 border-gray-200"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold cursor-pointer bg-transparent transition-colors"
                >
                  Cancel
                </button>
                {acceptStep === 'resolution_select' && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50 cursor-pointer border-0 shadow-xs"
                  >
                    Submit Offer
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden bg-white text-gray-700">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-55 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Reject Refund Claim</h3>
              <button type="button" onClick={() => setShowRejectModal(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Rejection Explanation Reason</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Explain exactly why you are rejecting this request..."
                  className="w-full border border-gray-250 rounded-lg p-2.5 font-semibold outline-none focus:border-red-500 h-24 bg-white text-gray-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border rounded-lg font-bold cursor-pointer bg-transparent border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 border-0 cursor-pointer shadow-xs"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quality Inspection Assessment Report Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="border border-gray-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden bg-white text-gray-750">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-55 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Quality Inspection Report</h3>
              <button type="button" onClick={() => setShowInspectionModal(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-650">✕</button>
            </div>

            <form onSubmit={handleInspectionSubmit} className="p-5 space-y-4 text-xs font-semibold leading-relaxed">
              <div className="grid grid-cols-2 gap-3.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inspectionForm.physicalDamage}
                    onChange={e => setInspectionForm(prev => ({ ...prev, physicalDamage: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]/15"
                  />
                  <span>Physical Damage Detected</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inspectionForm.waterDamage}
                    onChange={e => setInspectionForm(prev => ({ ...prev, waterDamage: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]/15"
                  />
                  <span>Water Damage / Moisture</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inspectionForm.missingParts}
                    onChange={e => setInspectionForm(prev => ({ ...prev, missingParts: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]/15"
                  />
                  <span>Missing Accessories / Parts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inspectionForm.burnDamage}
                    onChange={e => setInspectionForm(prev => ({ ...prev, burnDamage: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]/15"
                  />
                  <span>Circuit Burn / Shortage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inspectionForm.tampering}
                    onChange={e => setInspectionForm(prev => ({ ...prev, tampering: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]/15"
                  />
                  <span>Product Tampering / Refurbish</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inspectionForm.packagingIntact}
                    onChange={e => setInspectionForm(prev => ({ ...prev, packagingIntact: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]/15"
                  />
                  <span>Original Packaging Intact</span>
                </label>
              </div>

              <div className="border-t border-dashed pt-3.5 space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Severity Damage Score (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={inspectionForm.severityScore}
                      onChange={e => setInspectionForm(prev => ({ ...prev, severityScore: Number(e.target.value) }))}
                      className="w-full border rounded-lg p-2 font-semibold outline-none focus:border-[#16A34A] bg-white border-gray-200"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Inspection Verdict Decision</label>
                    <select
                      value={inspectionForm.verdict}
                      onChange={e => setInspectionForm(prev => ({ ...prev, verdict: e.target.value }))}
                      className="w-full border rounded-lg p-2 font-semibold outline-none focus:border-[#16A34A] bg-white border-gray-200"
                    >
                      <option value="VALID_DAMAGE">Valid Product Damage</option>
                      <option value="CUSTOMER_FRAUD">Suspicious / Customer Fault</option>
                      <option value="NO_DAMAGE">No Damage Detected</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Inspection Inspector Notes</label>
                  <textarea
                    value={inspectionForm.inspectorNotes}
                    onChange={e => setInspectionForm(prev => ({ ...prev, inspectorNotes: e.target.value }))}
                    placeholder="Enter detailed observation notes about product quality..."
                    className="w-full border rounded-lg p-2 h-20 font-semibold outline-none focus:border-[#16A34A] bg-white border-gray-200"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 border rounded-lg font-bold cursor-pointer bg-transparent border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg font-bold disabled:opacity-50 border-0 cursor-pointer shadow-xs"
                >
                  Submit Inspection Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seller Refund Payout Proof Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden bg-white text-gray-700">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Submit Refund Payout Proof</h3>
              <button type="button" onClick={() => setShowPayoutModal(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-650">✕</button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-5 space-y-4 text-xs font-semibold leading-relaxed">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Transaction Reference Code / ID</label>
                <input
                  type="text"
                  value={payoutForm.paymentReference}
                  onChange={e => setPayoutForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder="eSewa TxnID / Bank Ref Code"
                  className="w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-[#16A34A] bg-white border-gray-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Payment Payout Proof screenshot</label>
                <input
                  type="file"
                  onChange={e => setPayoutFile(e.target.files[0])}
                  className="w-full border rounded-lg p-2 font-semibold bg-white border-gray-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Merchant Remarks (Optional)</label>
                <textarea
                  value={payoutForm.paymentComment}
                  onChange={e => setPayoutForm(prev => ({ ...prev, paymentComment: e.target.value }))}
                  placeholder="Enter comments about this payment payout transaction..."
                  className="w-full border rounded-lg p-2 h-16 font-semibold outline-none focus:border-[#16A34A] bg-white border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 border rounded-lg font-bold cursor-pointer bg-transparent border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingPayout}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg font-bold disabled:opacity-50 border-0 cursor-pointer shadow-xs"
                >
                  {uploadingPayout ? 'Uploading...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replacement Shipment tracking Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden bg-white text-gray-700">
            <div className="px-5 py-4 border-b border-gray-150 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Submit Replacement Shipment details</h3>
              <button type="button" onClick={() => setShowShippingModal(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-650">✕</button>
            </div>

            <form onSubmit={handleShippingSubmit} className="p-5 space-y-4 text-xs font-semibold leading-relaxed">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Replacement Courier Agency Name</label>
                <input
                  type="text"
                  value={shippingCourier}
                  onChange={e => setShippingCourier(e.target.value)}
                  placeholder="e.g. Kathmandu Courier Service"
                  className="w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-[#16A34A] bg-white border-gray-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Courier Tracking Number</label>
                <input
                  type="text"
                  value={shippingTracking}
                  onChange={e => setShippingTracking(e.target.value)}
                  placeholder="e.g. KCS-984392849"
                  className="w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-[#16A34A] bg-white border-gray-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShippingModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg font-bold cursor-pointer bg-transparent hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 border-0 cursor-pointer shadow-xs"
                >
                  Submit Tracking details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
