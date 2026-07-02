import React from 'react';
import { CheckCircle, Clock, Box, Truck } from 'lucide-react';
import { TIMELINE_STEPS } from '../../../../utils/refundConstants';

const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function HorizontalProgressStepper({
  status,
  isDark,
  actorRole = 'SELLER', // SELLER or CUSTOMER
  auditLogs = []
}) {
  if (actorRole === 'CUSTOMER') {
    // Customer timeline date calculator
    const getTimelineDates = () => {
      const dates = { requested: null, approved: null, shipped: null, returned: null, processing: null, refunded: null };
      if (auditLogs) {
        auditLogs.forEach(log => {
          const statusVal = log.newStatus;
          if ((statusVal === 'SELLER_APPROVED' || statusVal === 'ADMIN_APPROVED_REFUND') && !dates.approved) dates.approved = log.createdAt;
          if (log.notes?.toLowerCase().includes('tracking') && !dates.shipped) dates.shipped = log.createdAt;
          if (statusVal === 'RETURN_RECEIVED' && !dates.returned) dates.returned = log.createdAt;
          if (statusVal === 'REFUND_PROCESSING' && !dates.processing) dates.processing = log.createdAt;
          if ((statusVal === 'REFUND_COMPLETED' || statusVal === 'EXCHANGE_COMPLETED' || statusVal === 'CLOSED') && !dates.refunded) dates.refunded = log.createdAt;
        });
      }
      return dates;
    };

    const stepDates = getTimelineDates();
    const HORIZ_STEPS = [
      { label: 'Requested', date: stepDates.requested || auditLogs[0]?.createdAt },
      { label: 'Approved', date: stepDates.approved },
      { label: 'Received', date: stepDates.returned },
      { label: 'Processing', date: stepDates.processing || (status === 'REFUND_PROCESSING' ? auditLogs[auditLogs.length - 1]?.createdAt : null) },
      { label: 'Completed', date: stepDates.refunded }
    ];

    let activeIdx = 0;
    if (['SELLER_APPROVED', 'ADMIN_APPROVED_REFUND', 'RETURN_PENDING', 'RETURN_SHIPPED'].includes(status)) {
      activeIdx = 1;
    } else if (['RETURN_RECEIVED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE'].includes(status)) {
      activeIdx = 2;
    } else if (['REFUND_PROCESSING'].includes(status)) {
      activeIdx = 3;
    } else if (['REFUND_COMPLETED', 'REPLACEMENT_PREPARING', 'REPLACEMENT_SHIPPED', 'EXCHANGE_COMPLETED', 'CLOSED', 'CUSTOMER_ACCEPTS', 'ADMIN_REJECTED_REFUND'].includes(status)) {
      activeIdx = 4;
    }

    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="relative flex justify-between items-start w-full max-w-3xl mx-auto my-2 px-6">
          <div className="absolute top-5 left-8 right-8 h-[3px] bg-gray-100 -z-0 rounded-full" />
          <div 
            className="absolute top-5 left-8 h-[3px] bg-[#16A34A] transition-all duration-500 ease-out -z-0 rounded-full" 
            style={{ width: `${(activeIdx / (HORIZ_STEPS.length - 1)) * 95}%` }}
          />
          {HORIZ_STEPS.map((step, idx) => {
            const completed = idx < activeIdx;
            const current = idx === activeIdx;
            
            let CircleIcon = null;
            if (idx === 0 || idx === 1) CircleIcon = <CheckCircle size={18} />;
            else if (idx === 2) CircleIcon = <Box size={18} />;
            else if (idx === 3) CircleIcon = <Clock size={18} />;
            else CircleIcon = <CheckCircle size={18} />;

            return (
              <div key={idx} className="flex flex-col items-center flex-1 text-center z-10 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  completed 
                    ? 'bg-[#16A34A] border-[#16A34A] text-white font-bold' 
                    : current
                      ? 'bg-white border-[#16A34A] text-[#16A34A] font-bold shadow-md ring-4 ring-emerald-50 scale-105'
                      : 'bg-white border-gray-200 text-gray-300'
                }`}>
                  {completed ? <span className="text-white text-sm font-extrabold">✓</span> : CircleIcon}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider mt-3 ${completed || current ? 'text-slate-800' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                <span className="text-[11px] text-gray-500 mt-1 block font-semibold">
                  {step.date ? dateLabel(step.date) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Seller Timeline Stepper
  const getStepState = (stepKey) => {
    const stepOrder = {
      REQUESTED: 1,
      VIEWED: 2,
      UNDER_REVIEW: 3,
      WAITING_FOR_RETURN: 4,
      INSPECTION_PENDING: 5,
      APPROVED: 6,
      REFUNDED: 7
    };

    let activeIndex = 1;
    if (status === 'REQUEST_CREATED') activeIndex = 1;
    else if (['UNDER_REVIEW', 'MORE_EVIDENCE_REQUESTED'].includes(status)) activeIndex = 3;
    else if (['RETURN_PENDING', 'RETURN_SHIPPED'].includes(status)) activeIndex = 4;
    else if (['RETURN_RECEIVED', 'PRODUCT_INSPECTION'].includes(status)) activeIndex = 5;
    else if (['INSPECTION_COMPLETE', 'SELLER_APPROVED', 'REFUND_PROCESSING', 'PENDING_ADMIN_VERIFICATION', 'REPLACEMENT_PREPARING', 'REPLACEMENT_SHIPPED', 'CUSTOMER_ACCEPTS', 'OFFER_MADE'].includes(status)) activeIndex = 6;
    else if (['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED', 'SELLER_REJECTED', 'ADMIN_REJECTED_REFUND'].includes(status)) activeIndex = 7;
    else activeIndex = 2; // Default viewed

    const currentOrder = stepOrder[stepKey];
    if (currentOrder < activeIndex) return 'completed';
    if (currentOrder === activeIndex) return 'active';
    return 'inactive';
  };

  return (
    <div className={`border rounded-2xl p-5 md:p-6 space-y-6 transition-colors shadow-2xs ${
      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
    }`}>
      <div className="relative pt-2 pb-2">
        <div className="flex items-center justify-between gap-1 text-[10px]">
          {TIMELINE_STEPS.map((step, idx) => {
            const statusState = getStepState(step.key);
            const isLast = idx === TIMELINE_STEPS.length - 1;
            
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1 relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    statusState === 'completed' ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-[0_0_8px_rgba(5,146,18,0.2)]' :
                    statusState === 'active' ? 'bg-[#16A34A] border-[#16A34A] text-white ring-4 ring-[#16A34A]/15 scale-105' :
                    `${isDark ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'}`
                  }`}>
                    {statusState === 'completed' ? (
                      <CheckCircle size={14} strokeWidth={3} />
                    ) : (
                      <Clock size={14} className={statusState === 'active' ? 'animate-pulse' : ''} />
                    )}
                  </div>
                  <span className={`font-black mt-2 text-center uppercase tracking-wider text-[8px] whitespace-nowrap ${
                    statusState === 'active' ? 'text-[#16A34A]' : (isDark ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full ${
                    statusState === 'completed' ? 'bg-[#16A34A]' : (isDark ? 'bg-gray-800' : 'bg-gray-200')
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
