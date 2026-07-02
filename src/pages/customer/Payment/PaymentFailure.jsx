import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BASE_URL } from '../../../services/apiConfig';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderIds = searchParams.get('orderIds') || '';
  const gateway = searchParams.get('gateway') || 'payment';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 font-sans text-[#222529]">
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-sm shadow-sm text-center">
        <div className="text-4xl text-red-500 mb-4 select-none">⚠️</div>
        <h2 className="text-sm font-black uppercase tracking-widest text-red-600 mb-2">Payment Cancelled or Failed</h2>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Your {gateway} transaction could not be processed successfully. If funds were deducted, please contact your gateway support.
        </p>

        <div className="flex flex-col gap-2">
          {orderIds && (
            <button
              onClick={() => navigate('/customer/orders')}
              className="w-full bg-[#222529] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest py-3.5 px-4 rounded-sm transition-all"
            >
              Retry Payment from Orders
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-200 hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest py-3.5 px-4 rounded-sm transition-all"
          >
            Go Back to Shop
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;

