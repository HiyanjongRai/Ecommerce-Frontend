import React from 'react';
import CustomerReplacementTracking from './status-views/CustomerReplacementTracking';

export default function ExchangeDecisionPage({
  detail,
  onRefresh,
  setActionError
}) {
  return (
    <div className="space-y-4">
      <CustomerReplacementTracking
        detail={detail}
        onRefresh={onRefresh}
        setActionError={setActionError}
      />
    </div>
  );
}
