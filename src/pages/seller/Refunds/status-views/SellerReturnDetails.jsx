import React, { useState } from 'react';
import { confirmReturnReceived } from '../../../../services/refundApi';
import { useSellerTheme } from '../../../../hooks/useSellerTheme';

export default function SellerReturnDetails({
  detail,
  onRefresh,
  setError
}) {
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;
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
    <div className={`border-t pt-5 flex flex-wrap gap-3 items-center justify-end p-4 rounded-xl transition-colors ${
      isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/50'
    }`}>
      <div className="flex gap-3">
        {detail.status === 'RETURN_SHIPPED' && (
          <button
            onClick={handleConfirmReceived}
            disabled={submitting}
            className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer border-0"
          >
            {submitting ? 'Confirming...' : 'Confirm Return Received'}
          </button>
        )}
      </div>
    </div>
  );
}
