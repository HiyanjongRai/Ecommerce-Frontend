import React from 'react';
import EscalateToAdminPage from '../../seller/EscalateToAdminPage';
import { ShieldAlert } from 'lucide-react';

export default function AdminEscalationBranch({
  actorRole,
  detail,
  isDark = false
}) {
  if (actorRole === 'CUSTOMER') {
    const isArbitration = detail.status === 'ADMIN_REVIEW';
    return (
      <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 text-center space-y-3 max-w-xl mx-auto shadow-sm text-xs font-semibold">
        <ShieldAlert size={36} className="text-pink-500 mx-auto animate-pulse" />
        <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">
          {isArbitration ? 'Case Escalated to Admin' : 'Admin Dispute Verdict Issued'}
        </h3>
        <p className="text-gray-600 leading-relaxed font-semibold">
          {isArbitration 
            ? 'This claim has been escalated to administration review. An arbitration agent is reviewing details to issue a verdict.'
            : `Case resolved by administrator arbitration. Status: ${detail.status.replace(/_/g, ' ')}.`
          }
        </p>
        {detail.adminDecision && (
          <div className="bg-white border border-pink-100 rounded-xl p-3 text-left leading-relaxed mt-2 text-pink-900">
            <strong className="text-pink-700 block mb-0.5 text-[9px] uppercase tracking-wider">Admin Remarks</strong>
            "{detail.adminDecision}"
          </div>
        )}
      </div>
    );
  }

  return (
    <EscalateToAdminPage
      detail={detail}
      isDark={isDark}
    />
  );
}
