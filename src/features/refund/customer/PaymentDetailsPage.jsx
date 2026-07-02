import React from 'react';
import CustomerRefundProcessing from './status-views/CustomerRefundProcessing';

export default function PaymentDetailsPage({
  detail,
  onRefresh,
  setActionError
}) {
  return (
    <div className="space-y-4">
      <CustomerRefundProcessing
        detail={detail}
        onRefresh={onRefresh}
        setActionError={setActionError}
      />
    </div>
  );
}
