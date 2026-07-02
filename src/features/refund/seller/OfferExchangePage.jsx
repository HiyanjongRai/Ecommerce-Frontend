import React from 'react';
import { Truck, CheckCircle } from 'lucide-react';

export default function OfferExchangePage({
  detail,
  hooksContext,
  isDark = false
}) {
  const { setShowShippingModal, setShippingCourier, setShippingTracking, submitting } = hooksContext;

  return (
    <div className={`p-5 border rounded-2xl space-y-4 ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
    }`}>
      <div className="flex items-start gap-3 text-xs">
        <Truck size={18} className="text-violet-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-violet-650 dark:text-violet-400">Exchange Replacement Selected</h4>
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
            Prepare and ship the replacement item, then submit courier and tracking details.
          </p>
        </div>
      </div>
      
      {detail.status === 'REPLACEMENT_PREPARING' && (
        <div className="pt-2">
          <button
            onClick={() => {
              setShippingCourier('');
              setShippingTracking('');
              setShowShippingModal(true);
            }}
            disabled={submitting}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border-0 active:scale-[0.98]"
          >
            Ship Replacement
          </button>
        </div>
      )}
    </div>
  );
}
