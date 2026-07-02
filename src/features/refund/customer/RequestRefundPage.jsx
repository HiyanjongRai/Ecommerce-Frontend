import React from 'react';
import CustomerUnderReview from './status-views/CustomerUnderReview';

export default function RequestRefundPage({
  detail,
  onRefresh,
  setActionError
}) {
  return (
    <div className="space-y-4">
      <CustomerUnderReview
        detail={detail}
        onRefresh={onRefresh}
        setActionError={setActionError}
      />
    </div>
  );
}
