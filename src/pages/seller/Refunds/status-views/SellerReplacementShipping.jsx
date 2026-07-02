import React, { useState } from 'react';
import { Truck, Barcode, Send } from 'lucide-react';
import { shipReplacement } from '../../../../services/refundApi';
import { useSellerTheme } from '../../../../hooks/useSellerTheme';

export default function SellerReplacementShipping({
  detail,
  onRefresh,
  setError
}) {
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;
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
    <div className={`border rounded-xl p-5 space-y-4 animate-in fade-in duration-200 ${
      isDark ? 'border-[#16A34A]/20 bg-[#16A34A]/5' : 'border-[#16A34A]/15 bg-[#16A34A]/5'
    }`}>
      <div className={`flex items-center gap-2 border-b pb-3 ${
        isDark ? 'border-[#16A34A]/10' : 'border-[#16A34A]/10'
      }`}>
        <div className={`p-1.5 rounded-lg ${
          isDark ? 'bg-black/40 text-[#16A34A]' : 'bg-[#16A34A]/10 text-[#16A34A]'
        }`}>
          <Truck size={16} />
        </div>
        <div>
          <h4 className={`text-xs font-black uppercase tracking-wider ${
            isDark ? 'text-[#16A34A]' : 'text-gray-900'
          }`}>Replacement Dispatch Desk</h4>
          <p className={`text-[10px] font-semibold mt-0.5 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>Please dispatch the replacement product and submit the courier details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-black uppercase tracking-wider block ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>Courier Service Name</label>
            <div className="relative">
              <input
                type="text"
                value={courier}
                onChange={e => setCourier(e.target.value)}
                placeholder="e.g. Kathmandu Courier Service"
                className={`w-full text-xs border rounded-lg pl-8 pr-3 py-2.5 focus:outline-none font-semibold transition-all shadow-2xs ${
                  isDark 
                    ? 'bg-[#111827] border-white/10 text-white focus:border-[#16A34A] placeholder-gray-600' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-[#16A34A] placeholder-gray-400'
                }`}
                required
              />
              <Truck size={14} className="text-gray-400 absolute left-2.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-[10px] font-black uppercase tracking-wider block ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>Replacement Tracking ID</label>
            <div className="relative">
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. TRK-EX-827392"
                className={`w-full text-xs border rounded-lg pl-8 pr-3 py-2.5 focus:outline-none font-semibold transition-all shadow-2xs ${
                  isDark 
                    ? 'bg-[#111827] border-white/10 text-white focus:border-[#16A34A] placeholder-gray-600' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-[#16A34A] placeholder-gray-400'
                }`}
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
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer border-0"
          >
            <Send size={13} />
            {submitting ? 'Shipping...' : 'Confirm Shipment & Ship'}
          </button>
        </div>
      </form>
    </div>
  );
}
