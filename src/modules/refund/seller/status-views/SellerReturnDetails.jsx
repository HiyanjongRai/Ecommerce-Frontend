import React, { useState } from 'react';
import { confirmReturnReceived } from '../../../../shared/api/refundApi';

export default function SellerReturnDetails({
  detail,
  onRefresh,
  setError
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmReceived = async () => {
    setSubmitting(true);
    setError('');
    try {
      await confirmReturnReceived(detail.id);
      onRefresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to confirm return received.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-5 flex flex-wrap gap-3 items-center justify-end bg-gray-50/50 p-4 rounded-xl">
      <div className="flex gap-3">
        {detail.status === 'RETURN_SHIPPED' && (
          <button
            onClick={handleConfirmReceived}
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {submitting ? 'Confirming...' : 'Confirm Return Received'}
          </button>
        )}
      </div>
    </div>
  );
}
