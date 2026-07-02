import React from 'react';
import TimelineLogList from './TimelineLogList';

export default function FullRefundTimeline({ auditLogs = [], description = '', isDark = false, actorRole = 'SELLER' }) {
  const filtered = auditLogs.filter(log => 
    ['SELLER_APPROVED', 'REFUND_PROCESSING', 'REFUND_COMPLETED', 'PENDING_ADMIN_VERIFICATION'].includes(log.newStatus) ||
    log.notes?.toLowerCase().includes('approve') ||
    log.notes?.toLowerCase().includes('payout')
  );
  return (
    <TimelineLogList 
      auditLogs={filtered.length > 0 ? filtered : auditLogs} 
      description={description} 
      isDark={isDark} 
      actorRole={actorRole} 
    />
  );
}
