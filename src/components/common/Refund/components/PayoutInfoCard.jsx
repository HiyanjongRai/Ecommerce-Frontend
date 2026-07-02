import React from 'react';
import { QrCode, Info, ClipboardCopy } from 'lucide-react';
import { toast } from '../../../../context/ToastContext';
import { BASE_URL } from '../../../../services/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function PayoutInfoCard({
  detail,
  isDark = false
}) {
  const showInfo = detail.status === 'REFUND_PROCESSING' || detail.customerAccountDetails || detail.customerQrUrl;
  if (!showInfo) return null;

  return (
    <div className={`border rounded-2xl p-5 space-y-4 transition-colors shadow-2xs ${
      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
        isDark ? 'text-orange-400 border-white/10' : 'text-orange-850 border-orange-100'
      }`}>
        <QrCode size={14} className="text-orange-500" /> Customer Payout Information
      </h3>
      
      {detail.customerAccountDetails || detail.customerQrUrl ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start text-xs font-semibold">
          <div className={`md:col-span-2 space-y-2 p-4 border rounded-xl relative ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-150'
          }`}>
            <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${
              isDark ? 'text-gray-500' : 'text-gray-405'
            }`}>Bank / Wallet Account details</span>
            <p className={`font-bold font-mono whitespace-pre-wrap leading-relaxed text-xs ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              {detail.customerAccountDetails || 'No bank/account text details provided.'}
            </p>
            {detail.customerAccountDetails && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(detail.customerAccountDetails);
                  toast('Account details copied to clipboard!', 'success');
                }}
                className={`absolute top-3 right-3 text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0 ${
                  isDark ? 'text-indigo-400 hover:text-indigo-350' : 'text-indigo-650 hover:text-indigo-800'
                }`}
              >
                <ClipboardCopy size={12} />
                Copy Details
              </button>
            )}
          </div>

          {detail.customerQrUrl ? (
            <div className={`p-4 border rounded-xl flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-150'
            }`}>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 self-start ${
                isDark ? 'text-gray-500' : 'text-gray-405'
              }`}>QR Code Scan</span>
              <div className="border p-2 rounded-lg bg-white border-gray-250">
                <a href={getImgUrl(detail.customerQrUrl)} target="_blank" rel="noreferrer">
                  <img
                    src={getImgUrl(detail.customerQrUrl)}
                    alt="Customer QR Code"
                    className="max-h-28 object-contain rounded hover:opacity-90 transition-opacity"
                  />
                </a>
              </div>
              <span className={`text-[8.5px] font-semibold mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Click to view full size</span>
            </div>
          ) : (
            <div className={`p-4 border rounded-xl text-center font-semibold flex flex-col items-center justify-center min-h-[140px] ${
              isDark ? 'bg-white/5 border-white/10 text-gray-550' : 'bg-gray-50/50 border-gray-200 text-gray-400'
            }`}>
              <QrCode size={24} className="mb-1 text-gray-300" />
              <span>No QR code uploaded</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`p-4 border rounded-xl flex items-start gap-2.5 font-semibold leading-normal ${
          isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-800'
        }`}>
          <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
          <div>
            Waiting for Customer Payout Details: The customer has not provided their payment account details or QR code screenshot yet.
          </div>
        </div>
      )}
    </div>
  );
}
