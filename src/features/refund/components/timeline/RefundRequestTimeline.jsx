import React from 'react';
import TimelineLogList from './TimelineLogList';

export default function RefundRequestTimeline({ auditLogs = [], description = '', isDark = false, actorRole = 'SELLER' }) {
  const filtered = auditLogs.filter(log => 
    log.newStatus === 'REQUEST_CREATED' || 
    log.notes?.toLowerCase().includes('created') || 
    log.notes?.toLowerCase().includes('submitted')
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
