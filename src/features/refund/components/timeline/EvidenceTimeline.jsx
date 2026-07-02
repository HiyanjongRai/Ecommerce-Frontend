import React from 'react';
import TimelineLogList from './TimelineLogList';

export default function EvidenceTimeline({ auditLogs = [], description = '', isDark = false, actorRole = 'SELLER' }) {
  const filtered = auditLogs.filter(log => 
    log.newStatus === 'MORE_EVIDENCE_REQUESTED' || 
    log.notes?.toLowerCase().includes('evidence') || 
    log.notes?.toLowerCase().includes('proof')
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
