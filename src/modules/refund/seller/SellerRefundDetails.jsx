import React, { useMemo } from 'react';
import { 
  ArrowLeft, AlertCircle, Scale, CheckCircle, Package, Info, 
  Printer, ShieldAlert, Coins, Truck, User, Copy, Check, ClipboardCopy, X
} from 'lucide-react';
import { useSellerTheme } from '../../seller/hooks/useSellerTheme';
import { SectionHeader } from '../../seller/components/SellerSectionUtils';
import { useSellerRefund } from '../hooks/useSellerRefund';
import HorizontalProgressStepper from '../timeline/HorizontalProgressStepper';
import TimelineLogList from '../timeline/TimelineLogList';
import RefundWorkflowEngine from '../workflow/RefundWorkflowEngine';
import { 
  getCustomerRiskProfile, 
  getCustomerCounterLog, 
  parseCustomerCounterOffer, 
  getSellerActionTimerWarning, 
  getStatusInstructionText 
} from '../workflow/SellerActions';
import RefundOverviewCard from '../components/RefundOverviewCard';
import PayoutInfoCard from '../components/PayoutInfoCard';
import CustomerInfoCard from '../components/CustomerInfoCard';
import OrderSummaryCard from '../components/OrderSummaryCard';
import RiskAnalysisCard from '../components/RiskAnalysisCard';
import RefundItemCard from '../components/RefundItemCard';
import { getBadgeClass, getStatusLabel } from '../models/RefundConstants';
import { BASE_URL } from '../../../shared/api/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function SellerRefundDetails({
  detail,
  onBack,
  onRefresh,
  error,
  setError
}) {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  // Seller Action controller hooks state
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
    handleShippingSubmit,
    isActionActive
  } = hooksContext;

  // Extracted mock spent customer stats profile
  const customerProfile = useMemo(() => {
    return getCustomerRiskProfile(detail.customerName);
  }, [detail.customerName]);

  // Extract customer counter offer logs
  const customerCounterLog = useMemo(() => {
    return getCustomerCounterLog(detail);
  }, [detail]);

  const hasPendingCounterOffer = customerCounterLog !== null;

  const { amount: counterOfferAmount, note: counterOfferNote } = useMemo(() => {
    return parseCustomerCounterOffer(detail, customerCounterLog);
  }, [detail, customerCounterLog]);

  return (
    <div className={`space-y-6 max-w-[1400px] font-sans animate-in fade-in duration-300 ${themeClasses.bg.primary}`}>
      
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
        <span className="cursor-pointer hover:text-[#16A34A] transition-colors" onClick={onBack}>Refunds</span>
        <span>&gt;</span>
        <span className="text-[#16A34A] font-black">Refund Details</span>
      </div>

      {/* ── Unified Section Header ── */}
      <SectionHeader
        tag={`Refund claim · ${detail.refundNumber}`}
        title={`Refund Details`}
        subtitle={`Requested on ${new Date(detail.createdAt).toLocaleDateString()} • Current Status: ${getStatusLabel(detail.status)}`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-white hover:bg-gray-150 text-gray-900 border border-gray-200 shadow-sm shrink-0 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Back to Refunds
            </button>
            <button
              onClick={() => window.print()}
              className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#152F17] text-white shrink-0 cursor-pointer border-0 shadow-sm"
            >
              <Printer size={13} />
              Print
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 border text-xs font-black uppercase tracking-wide rounded-xl bg-red-500/10 border-red-500/20 text-red-400 flex items-center gap-3 shadow-2xs">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Progress Stepper Timeline Card ── */}
      <HorizontalProgressStepper
        status={detail.status}
        actorRole="SELLER"
        isDark={isDark}
      />

      {/* Timeline Status Alert Banner */}
      <div className={`p-3.5 border rounded-xl flex items-start gap-2.5 font-semibold text-xs leading-normal ${
        isDark ? 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]' : 'bg-[#e8f5ee]/80 border-[#16A34A]/15 text-[#16A34A]'
      }`}>
        <Info size={16} className="shrink-0 mt-0.5 text-[#16A34A]" />
        <div>{getStatusInstructionText(detail.status)}</div>
      </div>

      {/* ── Main workflow engine branch dispatcher ── */}
      <div className="mb-4">
        <RefundWorkflowEngine
          actorRole="SELLER"
          detail={detail}
          onRefresh={onRefresh}
          setActionError={setError}
          hooksContext={hooksContext}
          customerCounterLog={customerCounterLog}
          hasPendingCounterOffer={hasPendingCounterOffer}
          isDark={isDark}
        />
      </div>

      {/* ── Main Two-Column Split Dashboard ── */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Left Columns (70%) */}
        <div className="flex-1 lg:max-w-[70%] space-y-6">
          
          {/* Card 1: Refund Overview */}
          <RefundOverviewCard
            detail={detail}
            customerProfile={customerProfile}
            isDark={isDark}
          />

          {/* Card 2: Customer Payout Details */}
          <PayoutInfoCard
            detail={detail}
            isDark={isDark}
          />

          {/* Card 3: Reason for Refund */}
          <div className={`border rounded-2xl p-5 space-y-3.5 transition-colors shadow-2xs ${
            isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2 ${
              isDark ? 'text-white border-white/10' : 'text-gray-800 border-gray-150'
            }`}>Reason for Refund</h3>
            <p className={`text-xs font-medium rounded-xl p-3.5 leading-relaxed font-sans border ${
              isDark ? 'text-gray-300 bg-white/5 border-white/10' : 'text-gray-800 bg-gray-50 border-gray-150'
            }`}>
              {detail.description || 'Customer notes: Product arrived damaged. Needs full return.'}
            </p>
          </div>

          {/* Card 4: Evidence Photos */}
          <div className={`border rounded-2xl p-5 space-y-4 transition-colors shadow-2xs ${
            isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2.5 ${
              isDark ? 'text-white border-white/10' : 'text-gray-800 border-gray-150'
            }`}>
              Evidence Photos ({detail.evidence?.length || 0})
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {detail.evidence?.map((e, idx) => (
                <a
                  key={e.id || idx} 
                  href={getImgUrl(e.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className={`relative group rounded-xl overflow-hidden border aspect-square flex items-center justify-center p-1.5 transition-all duration-300 hover:scale-105 shadow-2xs ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                  }`}
                >
                  <img
                    src={getImgUrl(e.fileUrl)}
                    alt="Evidence Claim Upload"
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Card 5: Timeline Log feed */}
          <TimelineLogList
            auditLogs={detail.auditLogs || []}
            description={detail.description || ''}
            actorRole="SELLER"
            isDark={isDark}
          />

          {/* Card 6: Refund Items */}
          <RefundItemCard
            items={detail.items || []}
            refundAmount={detail.refundAmount}
            isDark={isDark}
          />

          {/* Bottom warning banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
            <CheckCircle size={14} className="shrink-0" />
            Communicate professionally with customers. Abusive behaviour may result in penalty.
          </div>

        </div>

        {/* Right Sidebar Column (30%) */}
        <div className="w-full lg:w-[30%] space-y-6 shrink-0">
          
          {/* Customer Information Card */}
          <CustomerInfoCard
            customerName={detail.customerName}
            customerEmail={detail.customerEmail}
            customerProfile={customerProfile}
            isDark={isDark}
          />

          {/* Order Summary Card */}
          <OrderSummaryCard
            detail={detail}
            isDark={isDark}
            copied={copied}
            copyToClipboard={copyToClipboard}
          />

          {/* Risk Analysis Card */}
          <RiskAnalysisCard
            customerProfile={customerProfile}
            isDark={isDark}
          />



        </div>

      </div>

      {/* ─── MODALS ─── */}

      {/* Approve Option / Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`border rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white">Choose Approval / Counter Option</h3>
              <button 
                type="button" 
                onClick={() => setShowOfferModal(false)} 
                className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Step Progress Indicator */}
            <div className="w-full bg-gray-100 dark:bg-white/5 h-1">
              <div 
                className="bg-[#16A34A] h-full transition-all duration-500 ease-out" 
                style={{ width: acceptStep === 'return_check' ? '50%' : '100%' }} 
              />
            </div>

            <form onSubmit={handleOfferSubmit} className="p-5 space-y-5 text-xs font-semibold">
              
              {acceptStep === 'return_check' ? (
                /* Step 1: Return requirement */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#16A34A]">Step 1 of 2: Return Requirement</p>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                      className={`flex gap-4 p-4 rounded-xl border text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-xs cursor-pointer bg-transparent w-full group ${
                        isDark 
                          ? 'border-white/10 hover:border-[#16A34A]/50 hover:bg-[#16A34A]/100/5 text-white' 
                          : 'border-gray-200 hover:border-[#16A34A]/50 hover:bg-[#16A34A]/10/5 text-gray-700'
                      }`}
                    >
                      <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300 ${
                        isDark ? 'bg-[#16A34A]/100/10 text-[#2E5E2C] group-hover:bg-[#16A34A]/20' : 'bg-[#16A34A]/10 text-[#16A34A] group-hover:bg-[#16A34A]/20'
                      }`}>
                        <Package size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-[11px] uppercase tracking-wider text-[#16A34A] dark:text-[#2E5E2C]">
                          Need Return (Return Required)
                        </p>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
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
                      className={`flex gap-4 p-4 rounded-xl border text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-xs cursor-pointer bg-transparent w-full group ${
                        isDark 
                          ? 'border-white/10 hover:border-[#16A34A]/50 hover:bg-[#16A34A]/100/5 text-white' 
                          : 'border-gray-200 hover:border-[#16A34A]/50 hover:bg-[#16A34A]/10/5 text-gray-700'
                      }`}
                    >
                      <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300 ${
                        isDark ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-[#16A34A]/20' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                      }`}>
                        <Coins size={20} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-[11px] uppercase tracking-wider text-[#16A34A] dark:text-[#2E5E2C]">
                          No Need Return (Direct Resolution)
                        </p>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
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
                      className="text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-[#16A34A] bg-transparent border-0 cursor-pointer flex items-center gap-1 transition-all duration-200"
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
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent gap-1.5 ${
                          offerType === 'FULL_REFUND' 
                            ? 'border-[#16A34A] bg-[#16A34A]/15 text-[#16A34A] shadow-xs scale-[1.02] ring-2 ring-[#16A34A]/20' 
                            : (isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600')
                        }`}
                      >
                        <Coins size={16} />
                        Full Refund
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferType('PARTIAL_REFUND')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent gap-1.5 ${
                          offerType === 'PARTIAL_REFUND' 
                            ? 'border-[#16A34A] bg-[#16A34A]/15 text-[#16A34A] shadow-xs scale-[1.02] ring-2 ring-[#16A34A]/20' 
                            : (isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600')
                        }`}
                      >
                        <Scale size={16} />
                        Partial Refund
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferType('EXCHANGE')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer bg-transparent gap-1.5 ${
                          offerType === 'EXCHANGE' 
                            ? 'border-[#16A34A] bg-[#16A34A]/15 text-[#16A34A] shadow-xs scale-[1.02] ring-2 ring-[#16A34A]/20' 
                            : (isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600')
                        }`}
                      >
                        <Truck size={16} />
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
                        className={`w-full border rounded-xl p-3 font-semibold outline-none focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 transition-all duration-200 ${
                          isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}
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
                      className={`w-full border rounded-xl p-3 font-semibold outline-none h-20 focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 transition-all duration-200 ${
                        isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className={`px-5 py-2.5 border rounded-xl font-bold cursor-pointer bg-transparent transition-all duration-200 ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                {acceptStep === 'resolution_select' && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-xl font-bold disabled:opacity-50 cursor-pointer border-0 shadow-xs active:scale-[0.98] transition-all duration-200"
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
          <div className={`border rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white">Reject Refund Claim</h3>
              <button type="button" onClick={() => setShowRejectModal(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Rejection Explanation Reason</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Explain exactly why you are rejecting this request..."
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-red-500 h-24 transition-colors ${
                    isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className={`px-4 py-2 border rounded-lg font-bold cursor-pointer bg-transparent ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-650 hover:bg-red-700 bg-red-600 text-white rounded-lg font-bold disabled:opacity-50 border-0 cursor-pointer shadow-xs"
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
          <div className={`border rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white">Quality Inspection Report</h3>
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
                      className={`w-full border rounded-lg p-2 font-semibold outline-none focus:border-[#16A34A] ${
                        isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200'
                      }`}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Inspection Verdict Decision</label>
                    <select
                      value={inspectionForm.verdict}
                      onChange={e => setInspectionForm(prev => ({ ...prev, verdict: e.target.value }))}
                      className={`w-full border rounded-lg p-2 font-semibold outline-none focus:border-[#16A34A] ${
                        isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200'
                      }`}
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
                    className={`w-full border rounded-lg p-2 h-20 font-semibold outline-none focus:border-[#16A34A] ${
                      isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className={`px-4 py-2 border rounded-lg font-bold cursor-pointer bg-transparent ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
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
          <div className={`border rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white">Submit Refund Payout Proof</h3>
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
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-[#16A34A] ${
                    isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Payment Payout Proof screenshot</label>
                <input
                  type="file"
                  onChange={e => setPayoutFile(e.target.files[0])}
                  className={`w-full border rounded-lg p-2 font-semibold ${
                    isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Merchant Remarks (Optional)</label>
                <textarea
                  value={payoutForm.paymentComment}
                  onChange={e => setPayoutForm(prev => ({ ...prev, paymentComment: e.target.value }))}
                  placeholder="Enter comments about this payment payout transaction..."
                  className={`w-full border rounded-lg p-2 h-16 font-semibold outline-none focus:border-[#16A34A] ${
                    isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className={`px-4 py-2 border rounded-lg font-bold cursor-pointer bg-transparent ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-55 text-gray-700'
                  }`}
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
          <div className={`border rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white">Submit Replacement Shipment details</h3>
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
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-[#16A34A] ${
                    isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200'
                  }`}
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
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-[#16A34A] ${
                    isDark ? 'bg-[#111827] border-white/10 text-white' : 'bg-white border-gray-200'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShippingModal(false)}
                  className={`px-4 py-2 border rounded-lg font-bold cursor-pointer bg-transparent ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg font-bold disabled:opacity-50 border-0 cursor-pointer shadow-xs"
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
