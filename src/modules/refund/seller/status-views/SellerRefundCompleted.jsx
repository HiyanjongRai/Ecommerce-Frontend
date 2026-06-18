import React from 'react';

export default function SellerRefundCompleted({ detail }) {
  return (
    <div className="border-t border-gray-200 pt-5 flex items-center justify-between bg-gray-50/50 p-4 rounded-xl">
      <span className="text-xs font-semibold text-gray-500">
        Dispute case closed. No further merchant action required.
      </span>
    </div>
  );
}
