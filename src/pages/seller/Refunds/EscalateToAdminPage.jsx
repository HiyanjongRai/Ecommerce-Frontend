import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function EscalateToAdminPage({
  detail,
  isDark = false
}) {
  const isArbitration = detail.status === 'ADMIN_REVIEW';

  return (
    <div className={`p-5 border rounded-2xl space-y-4 ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
    }`}>
      <div className="flex items-start gap-3 text-xs">
        <ShieldAlert size={18} className="text-pink-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-pink-700 dark:text-pink-400">
            {isArbitration ? 'Dispute Under Admin Arbitration' : 'Admin Dispute Closed'}
          </h4>
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
            {isArbitration 
              ? 'This refund dispute has been escalated to administrator arbitration. The admin is currently reviewing the evidence logs to determine a verdict.'
              : `Admin finalized this case. Resolution outcome: ${detail.status.replace(/_/g, ' ')}.`
            }
          </p>
        </div>
      </div>
      
      {detail.adminDecision && (
        <div className={`p-3.5 border rounded-xl mt-2 text-xs leading-relaxed font-sans ${
          isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-pink-50/20 border-pink-100 text-gray-850'
        }`}>
          <strong className="text-pink-700 block mb-0.5 text-[9px] uppercase tracking-wider">Admin Decision Remark</strong>
          "{detail.adminDecision}"
        </div>
      )}
    </div>
  );
}
