import React from 'react';
import { Clock, Scale, AlertTriangle, CheckCircle, Truck } from 'lucide-react';

const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const formatStepDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getLogIcon = (status) => {
  switch (status) {
    case 'REQUEST_CREATED':
      return <Clock size={12} className="text-blue-500" />;
    case 'UNDER_REVIEW':
    case 'ADMIN_REVIEW':
      return <Scale size={12} className="text-amber-500" />;
    case 'MORE_EVIDENCE_REQUESTED':
      return <AlertTriangle size={12} className="text-red-500" />;
    case 'SELLER_APPROVED':
    case 'ADMIN_APPROVED_REFUND':
    case 'REFUND_COMPLETED':
    case 'EXCHANGE_COMPLETED':
      return <CheckCircle size={12} className="text-[#10B981]" />;
    case 'RETURN_PENDING':
    case 'RETURN_SHIPPED':
      return <Truck size={12} className="text-[#10B981]" />;
    default:
      return <CheckCircle size={12} className="text-gray-400" />;
  }
};

const getLogCircleStyle = (status) => {
  switch (status) {
    case 'MORE_EVIDENCE_REQUESTED':
    case 'SELLER_REJECTED':
    case 'ADMIN_REJECTED_REFUND':
      return 'bg-red-50 ring-red-100 border-red-200';
    case 'SELLER_APPROVED':
    case 'ADMIN_APPROVED_REFUND':
    case 'REFUND_COMPLETED':
    case 'EXCHANGE_COMPLETED':
      return 'bg-[#e8f3e9] ring-[#bbf7d0] border-[#10B981]/20';
    case 'REQUEST_CREATED':
    case 'UNDER_REVIEW':
      return 'bg-blue-50 ring-blue-100 border-blue-200';
    default:
      return 'bg-gray-50 ring-gray-100 border-gray-200';
  }
};

export default function TimelineLogList({
  auditLogs = [],
  description = '',
  isDark = false,
  actorRole = 'SELLER' // SELLER or CUSTOMER
}) {
  if (actorRole === 'CUSTOMER') {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
        <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4">
          Return Activity Timeline
        </h3>

        <div className="space-y-5 relative pl-3 before:absolute before:top-2 before:bottom-2 before:left-[21px] before:w-[3px] before:bg-gray-100">
          {auditLogs.map((log, idx) => (
            <div key={idx} className="flex gap-3 items-start text-[11px] leading-relaxed relative">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white ${getLogCircleStyle(log.newStatus)}`}>
                {getLogIcon(log.newStatus)}
              </div>
              <div className="flex-1 flex justify-between flex-wrap gap-2 pt-0.5 bg-gray-50 border border-gray-100 rounded-xl p-2.5">
                <div>
                  <span className="font-black text-gray-900 block mb-0.5">
                    {log.notes || 'Status updated'}
                  </span>
                  <span className="text-gray-500 font-semibold text-[10px]">
                    Action by <span className="uppercase text-gray-700 font-bold">{log.actorRole?.toLowerCase() || 'System'}</span> &bull; Status: {log.newStatus ? log.newStatus.replace(/_/g, ' ') : 'N/A'}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 font-bold mt-0.5">
                  {formatStepDate(log.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Seller Timeline
  return (
    <div className={`border rounded-2xl p-5 space-y-4 max-h-[380px] overflow-y-auto transition-colors shadow-2xs ${
      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2 flex items-center justify-between ${
        isDark ? 'text-white border-white/10' : 'text-gray-800 border-gray-150'
      }`}>
        <span>Timeline Log</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#16A34A] cursor-pointer hover:underline">View All Events</span>
      </h3>

      <div className={`space-y-4 relative pl-3 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-0.5 ${
        isDark ? 'before:bg-white/10' : 'before:bg-gray-200'
      }`}>
        {auditLogs.slice().reverse().map((log, idx) => (
          <div key={log.id || idx} className="flex gap-4 items-start text-xs leading-relaxed relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] ring-4 ring-[#16A34A]/15 shrink-0 mt-1.5 z-10" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{log.notes || 'Status updated'}</span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {log.actorRole} · {dateLabel(log.createdAt)}
                </span>
              </div>
              {log.notes?.toLowerCase().includes('created') && (
                <div className={`p-3 rounded-lg border leading-relaxed ${
                  isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-purple-50/30 border-purple-200/40 text-gray-800'
                }`}>
                  <strong>Reason:</strong> {description || 'Product arrived damaged and not working.'}
                </div>
              )}
              {log.notes?.toLowerCase().includes('evidence') && (
                <div className={`p-3 rounded-lg border leading-relaxed ${
                  isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-orange-50/30 border-orange-200/40 text-gray-800'
                }`}>
                  <strong>Message:</strong> Please upload clear photos of the damaged area.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
