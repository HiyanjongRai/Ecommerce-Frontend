import React, { useState } from 'react';
import { Truck, Barcode } from 'lucide-react';
import { uploadTracking } from '../../api/refundApi';

export default function CustomerReturnShipping({
  detail,
  onRefresh,
  setActionError
}) {
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submittingTracking, setSubmittingTracking] = useState(false);

  const handleUploadTracking = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setSubmittingTracking(true);
    setActionError('');
    const finalTracking = courier.trim() ? `${courier.trim()} - ${trackingNumber.trim()}` : trackingNumber.trim();

    try {
      await uploadTracking(detail.id, {
        trackingNumber: finalTracking
      });
      setCourier('');
      setTrackingNumber('');
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to submit tracking info');
    } finally {
      setSubmittingTracking(false);
    }
  };

  if (detail.status !== 'RETURN_PENDING' || detail.trackingNumber) {
    return null;
  }

  return (
    <form onSubmit={handleUploadTracking} className="border-t border-dashed border-gray-200 pt-3.5 space-y-3 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-gray-500 block mb-1">Courier Name</label>
          <div className="relative">
            <input
              type="text"
              value={courier}
              onChange={e => setCourier(e.target.value)}
              placeholder="e.g. Narayani Express"
              className="w-full text-[11px] border border-gray-200 rounded-lg pl-8 pr-2 py-2.5 bg-white focus:outline-none focus:border-indigo-500 font-semibold"
              required
            />
            <Truck size={12} className="text-gray-400 absolute left-2.5 top-3.5" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 block mb-1">Tracking Number</label>
          <div className="relative">
            <input
              type="text"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="w-full text-[11px] border border-gray-200 rounded-lg pl-8 pr-2 py-2.5 bg-white focus:outline-none focus:border-indigo-500 font-semibold"
              required
            />
            <Barcode size={12} className="text-gray-400 absolute left-2.5 top-3.5" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submittingTracking || !trackingNumber.trim()}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {submittingTracking ? 'Submitting...' : 'Submit tracking'}
        </button>
      </div>
    </form>
  );
}
