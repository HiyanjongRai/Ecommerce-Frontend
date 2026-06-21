import React from 'react';
import { Truck, Package, Info } from 'lucide-react';

export default function InspectProductPage({
  detail,
  hooksContext,
  isDark = false
}) {
  const {
    handleConfirmReceived,
    setInspectionForm,
    setShowInspectionModal,
    submitting
  } = hooksContext;

  const isShipped = detail.status === 'RETURN_SHIPPED';

  return (
    <div className={`border rounded-2xl p-5 shadow-2xs animate-in slide-in-from-top-4 duration-300 ${
      isShipped
        ? 'bg-gradient-to-r from-teal-500/10 to-teal-500/5 border-teal-500/20'
        : 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-[#16A34A]/20'
    }`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between font-sans text-xs">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${
            isShipped ? 'bg-teal-500/10 text-teal-500' : 'bg-[#16A34A]/10 text-[#16A34A]'
          }`}>
            {isShipped ? <Truck size={20} /> : <Package size={20} />}
          </div>
          <div className="space-y-1">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isShipped 
                ? 'text-teal-600 bg-teal-500/10 border-teal-500/20' 
                : 'text-[#16A34A] bg-[#16A34A]/100/10 border-[#16A34A]/20'
            }`}>
              {isShipped ? 'Return Product Shipped' : 'Return Product Received'}
            </span>
            <h3 className={`text-sm font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {isShipped ? (
                <>
                  Customer has shipped back the item! Tracking number:{' '}
                  <span className="text-teal-600 font-mono font-black">{detail.trackingNumber || 'Not Provided'}</span>
                </>
              ) : (
                'The return shipment has been confirmed received. Please proceed with quality inspection.'
              )}
            </h3>
            <p className={`text-xs font-semibold leading-relaxed mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isShipped 
                ? 'Verify the parcel once it arrives and confirm receipt to unlock the quality inspection checklist.'
                : 'Submit the inspection report specifying any physical or water damage to finalize the refund resolution.'
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          {isShipped ? (
            <button
              type="button"
              onClick={handleConfirmReceived}
              disabled={submitting}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer border-0 active:scale-[0.98] transition-all"
            >
              {submitting ? 'Confirming...' : 'Confirm Product Received'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setInspectionForm({
                  physicalDamage: false,
                  waterDamage: false,
                  missingParts: false,
                  burnDamage: false,
                  tampering: false,
                  packagingIntact: true,
                  productMatches: true,
                  severityScore: 1,
                  inspectorNotes: '',
                  verdict: 'VALID_DAMAGE'
                });
                setShowInspectionModal(true);
              }}
              disabled={submitting}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#16A34A] hover:bg-[#152F17] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer border-0 active:scale-[0.98] transition-all"
            >
              Continue Quality Inspection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
