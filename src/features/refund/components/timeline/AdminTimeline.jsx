import React from 'react';
import TimelineLogList from './TimelineLogList';

export default function AdminTimeline({ auditLogs = [], description = '', isDark = false, actorRole = 'SELLER' }) {
  const filtered = auditLogs.filter(log => 
    ['ADMIN_REVIEW', 'ADMIN_APPROVED_REFUND', 'ADMIN_REJECTED_REFUND'].includes(log.newStatus) ||
    log.notes?.toLowerCase().includes('admin') ||
    log.notes?.toLowerCase().includes('escalat')
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
