import React, { useState } from 'react';
import { uploadRefundFile, submitPayoutProof } from '../../../../shared/api/refundApi';
import { BASE_URL } from '../../../../shared/api/apiClient';
import { QrCode, ClipboardCopy, FileText, CheckCircle, Info, Send } from 'lucide-react';
import { useSellerTheme } from '../../../seller/hooks/useSellerTheme';

export default function SellerPayoutProcessing({
  detail,
  onRefresh,
  setError
}) {
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;
  const [submitting, setSubmitting] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    paymentReference: '',
    paymentComment: ''
  });
  const [payoutFile, setPayoutFile] = useState(null);
  const [uploadingPayout, setUploadingPayout] = useState(false);
  const [copied, setCopied] = useState(false);

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleCopy = () => {
    if (detail.customerAccountDetails) {
      navigator.clipboard.writeText(detail.customerAccountDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutFile) {
      setError('Please select/upload a payment screenshot proof');
      return;
    }
    setSubmitting(true);
    setUploadingPayout(true);
    setError('');
    try {
      const fileRes = await uploadRefundFile(payoutFile);
      const fileUrl = fileRes.data.fileUrl;

      await submitPayoutProof(detail.id, {
        paymentProofUrl: fileUrl,
        paymentReference: payoutForm.paymentReference,
        paymentComment: payoutForm.paymentComment
      });

      setShowPayoutModal(false);
      setPayoutFile(null);
      setPayoutForm({ paymentReference: '', paymentComment: '' });
      onRefresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit refund payout proof.');
    } finally {
      setSubmitting(false);
      setUploadingPayout(false);
    }
  };

  if (detail.status !== 'REFUND_PROCESSING') {
    return null;
  }

  const hasPayoutDetails = detail.customerAccountDetails || detail.customerQrUrl;

  return (
    <div className={`border-t pt-5 space-y-4 font-sans text-xs ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
      <div className={`border rounded-xl p-5 space-y-4 ${
        isDark ? 'bg-orange-955/10 border-orange-500/20' : 'bg-orange-50/10 border-orange-100'
      }`}>
        <h4 className={`text-xs font-black uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
          isDark ? 'text-orange-400 border-white/10' : 'text-orange-850 border-orange-100'
        }`}>
          <QrCode size={14} className="text-orange-500" />
          Customer Refund Payout Details
        </h4>

        {hasPayoutDetails ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Account Details Box */}
            <div className={`md:col-span-2 space-y-2 p-4 border rounded-lg relative ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            }`}>
              <span className={`text-[9px] font-black uppercase tracking-widest block ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>Bank Account / Wallet Details</span>
              <p className={`font-bold font-mono whitespace-pre-wrap leading-relaxed ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                {detail.customerAccountDetails || 'No text details provided.'}
              </p>
              {detail.customerAccountDetails && (
                <button
                  onClick={handleCopy}
                  className={`absolute top-3 right-3 text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0 ${
                    isDark ? 'text-indigo-400 hover:text-indigo-350' : 'text-indigo-650 hover:text-indigo-800'
                  }`}
                >
                  <ClipboardCopy size={12} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* QR Code Scan Box */}
            {detail.customerQrUrl ? (
              <div className={`p-4 border rounded-lg flex flex-col items-center justify-center text-center ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              }`}>
                <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 self-start ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>Scan QR code to pay</span>
                <div className={`border p-2 rounded-lg ${
                  isDark ? 'bg-black/40 border-white/10' : 'bg-gray-55 border-gray-200'
                }`}>
                  <a href={getImgUrl(detail.customerQrUrl)} target="_blank" rel="noreferrer">
                    <img
                      src={getImgUrl(detail.customerQrUrl)}
                      alt="Customer Payment QR"
                      className="max-h-28 object-contain rounded hover:opacity-90"
                    />
                  </a>
                </div>
                <span className={`text-[9px] font-semibold mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Click to view full size</span>
              </div>
            ) : (
              <div className={`p-4 border rounded-lg text-center font-semibold flex flex-col items-center justify-center ${
                isDark ? 'bg-white/5 border-white/10 text-gray-550' : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <QrCode size={24} className="mb-1 text-gray-300" />
                <span>No QR Code Uploaded</span>
              </div>
            )}
          </div>
        ) : (
          <div className={`border p-4 rounded-lg flex items-start gap-2.5 font-semibold leading-normal ${
            isDark ? 'bg-amber-955/20 border-amber-500/20 text-amber-400' : 'bg-amber-55 border-amber-100 text-amber-800'
          }`}>
            <Info size={16} className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-450' : 'text-amber-600'}`} />
            <div>
              Waiting for Customer Payout Details: The customer has not provided their payment account details or QR code screenshot yet. You can contact them, or wait for them to update their details before executing the payout.
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={submitting}
            className="px-5 py-2.5 bg-orange-650 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 border-0"
          >
            <Send size={13} />
            Submit Refund Payout Proof
          </button>
        </div>
      </div>

      {/* Submit Payout Proof Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`border rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-55'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Submit Refund Payout Proof</h3>
              <button type="button" onClick={() => setShowPayoutModal(false)} className={`bg-transparent border-0 cursor-pointer transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-650'}`}>✕</button>
            </div>
            <form onSubmit={handlePayoutSubmit} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Payment Reference / Transaction ID</label>
                <input
                  type="text"
                  value={payoutForm.paymentReference}
                  onChange={e => setPayoutForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder="e.g. TXN-98439284 or Esewa Ref..."
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-orange-500 transition-colors ${
                    isDark 
                      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Payment Proof Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setPayoutFile(e.target.files[0])}
                  className={`w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold ${
                    isDark 
                      ? 'text-gray-400 file:bg-orange-950/25 file:text-orange-400 hover:file:bg-orange-950/40' 
                      : 'text-gray-500 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className={`block text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Payout Remarks / Notes</label>
                <textarea
                  value={payoutForm.paymentComment}
                  onChange={e => setPayoutForm(prev => ({ ...prev, paymentComment: e.target.value }))}
                  placeholder="Write details of the refund payout (method used, bank info etc)..."
                  className={`w-full border rounded-lg p-2.5 font-semibold outline-none focus:border-orange-500 h-20 transition-colors ${
                    isDark 
                      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className={`px-4 py-2 border rounded-lg font-bold cursor-pointer transition-colors bg-transparent ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-655 hover:bg-orange-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer border-0"
                >
                  {uploadingPayout ? 'Uploading proof...' : 'Submit Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
