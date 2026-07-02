import React from 'react';
import { Scale } from 'lucide-react';
import CustomerPayoutTracking from './status-views/CustomerPayoutTracking';

export default function PartialRefundResponsePage({
  detail,
  onRefresh,
  setActionError
}) {
  const offerLog = detail.auditLogs 
    ? [...detail.auditLogs].reverse().find(log => 
        log.newStatus === 'OFFER_MADE' || 
        log.notes?.toLowerCase().includes('partial refund')
      )
    : null;
  const notesStr = offerLog?.notes || '';
  const amountMatch = notesStr.match(/(?:NPR|Rs\.|Rs)\s*([\d,]+)/i);
  const amount = amountMatch ? amountMatch[1] : '—';
  const noteMatch = notesStr.match(/Note:\s*(.*)$/i);
  const note = noteMatch ? noteMatch[1] : '';

  return (
    <div className="bg-gradient-to-r from-indigo-50/50 to-indigo-100/30 border border-indigo-200 rounded-2xl p-5 mb-4 shadow-[0_4px_20px_rgba(79,70,229,0.06)] animate-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0 flex items-center justify-center">
            <Scale size={24} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Action Required: Proposal Offered
            </span>
            <h3 className="text-sm font-extrabold text-gray-900 leading-tight">
              Merchant has proposed a Partial Refund of{' '}
              <span className="text-[#10B981] font-black text-lg">Rs. {amount}</span>
            </h3>
            {note && (
              <p className="text-xs text-gray-600 font-medium bg-white/70 border border-indigo-100/50 rounded-xl p-3 mt-2 leading-relaxed">
                <strong className="text-indigo-650 font-bold block mb-0.5 text-[10px] uppercase tracking-wider">Merchant Remark</strong>
                "{note}"
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <CustomerPayoutTracking
            detail={detail}
            onRefresh={onRefresh}
            setActionError={setActionError}
          />
        </div>
      </div>
    </div>
  );
}
