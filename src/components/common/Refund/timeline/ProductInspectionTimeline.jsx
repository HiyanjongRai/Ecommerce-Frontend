import React from 'react';
import TimelineLogList from './TimelineLogList';

export default function ProductInspectionTimeline({ auditLogs = [], description = '', isDark = false, actorRole = 'SELLER' }) {
  const filtered = auditLogs.filter(log => 
    ['RETURN_PENDING', 'RETURN_SHIPPED', 'RETURN_RECEIVED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE'].includes(log.newStatus) ||
    log.notes?.toLowerCase().includes('return') ||
    log.notes?.toLowerCase().includes('inspect')
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
