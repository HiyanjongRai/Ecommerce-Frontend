import React, { useState } from 'react';
import { Truck, Barcode, Send } from 'lucide-react';
import { shipReplacement } from '../../../../shared/api/refundApi';

export default function SellerReplacementShipping({
  detail,
  onRefresh,
  setError
}) {
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courier.trim() || !trackingNumber.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await shipReplacement(detail.id, {
        replacementCourier: courier.trim(),
        replacementTrackingNumber: trackingNumber.trim()
      });
      setCourier('');
      setTrackingNumber('');
      onRefresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit replacement shipment information');
    } finally {
      setSubmitting(false);
    }
  };

  if (detail.status !== 'REPLACEMENT_PREPARING') {
    return null;
  }

  return (
    <div className="border border-violet-200 bg-violet-50/20 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 border-b border-violet-100 pb-3">
        <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg">
          <Truck size={16} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-violet-900">Replacement Dispatch Desk</h4>
          <p className="text-[10px] text-violet-600 font-semibold mt-0.5">Please dispatch the replacement product and submit the courier details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Courier Service Name</label>
            <div className="relative">
              <input
                type="text"
                value={courier}
                onChange={e => setCourier(e.target.value)}
                placeholder="e.g. Kathmandu Courier Service"
                className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 bg-white focus:outline-none focus:border-violet-500 font-semibold transition-all shadow-2xs"
                required
              />
              <Truck size={14} className="text-gray-400 absolute left-2.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Replacement Tracking ID</label>
            <div className="relative">
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. TRK-EX-827392"
                className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 bg-white focus:outline-none focus:border-violet-500 font-semibold transition-all shadow-2xs"
                required
              />
              <Barcode size={14} className="text-gray-400 absolute left-2.5 top-3.5" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || !courier.trim() || !trackingNumber.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Send size={13} />
            {submitting ? 'Shipping...' : 'Confirm Shipment & Ship'}
          </button>
        </div>
      </form>
    </div>
  );
}
