import React from 'react';
import TimelineLogList from './TimelineLogList';

export default function ExchangeTimeline({ auditLogs = [], description = '', isDark = false, actorRole = 'SELLER' }) {
  const filtered = auditLogs.filter(log => 
    ['REPLACEMENT_PREPARING', 'REPLACEMENT_SHIPPED', 'EXCHANGE_COMPLETED'].includes(log.newStatus) ||
    log.notes?.toLowerCase().includes('replacement') ||
    log.notes?.toLowerCase().includes('exchange')
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
