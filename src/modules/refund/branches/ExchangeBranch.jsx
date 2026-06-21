import React from 'react';
import ExchangeDecisionPage from '../customer/ExchangeDecisionPage';
import OfferExchangePage from '../seller/OfferExchangePage';
import RefundCompletedPage from '../customer/RefundCompletedPage';
import InspectProductPage from '../seller/InspectProductPage';
import { Clock } from 'lucide-react';

export default function ExchangeBranch({
  actorRole,
  detail,
  onRefresh,
  setActionError,
  hooksContext,
  isDark = false
}) {
  if (actorRole === 'CUSTOMER') {
    if (['EXCHANGE_COMPLETED', 'CLOSED'].includes(detail.status)) {
      return <RefundCompletedPage detail={detail} />;
    }
    return (
      <ExchangeDecisionPage
        detail={detail}
        onRefresh={onRefresh}
        setActionError={setActionError}
      />
    );
  }

  if (detail.status === 'RETURN_PENDING') {
    return (
      <div className={`p-5 border rounded-2xl flex items-start gap-3.5 ${
        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
      }`}>
        <Clock className="text-amber-500 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1 text-xs">
          <h4 className="font-black uppercase tracking-wider text-amber-600">Waiting for Return Shipment</h4>
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
            The return request has been approved. The customer must ship back the product and provide tracking information before you can confirm receipt and perform the quality inspection.
          </p>
        </div>
      </div>
    );
  }
  if (['RETURN_SHIPPED', 'RETURN_RECEIVED', 'PRODUCT_INSPECTION'].includes(detail.status)) {
    return (
      <InspectProductPage
        detail={detail}
        hooksContext={hooksContext}
        isDark={isDark}
      />
    );
  }

  return (
    <OfferExchangePage
      detail={detail}
      hooksContext={hooksContext}
      isDark={isDark}
    />
  );
}
