import React from 'react';
import { useSellerTheme } from '../../../../hooks/useSellerTheme';

export default function SellerRefundCompleted({ detail }) {
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;
  return (
    <div className={`border-t pt-5 flex items-center justify-between p-4 rounded-xl transition-colors ${
      isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/50'
    }`}>
      <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Dispute case closed. No further merchant action required.
      </span>
    </div>
  );
}
