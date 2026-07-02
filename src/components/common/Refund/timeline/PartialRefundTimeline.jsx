import React from 'react';
import TimelineLogList from './TimelineLogList';

export default function PartialRefundTimeline({ auditLogs = [], description = '', isDark = false, actorRole = 'SELLER' }) {
  const filtered = auditLogs.filter(log => 
    ['OFFER_MADE', 'CUSTOMER_ACCEPTS', 'SELLER_APPROVED'].includes(log.newStatus) ||
    log.notes?.toLowerCase().includes('partial') ||
    log.notes?.toLowerCase().includes('proposal') ||
    log.notes?.toLowerCase().includes('negotiat')
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
