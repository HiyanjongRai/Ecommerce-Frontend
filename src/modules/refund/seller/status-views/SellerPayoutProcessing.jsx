import React, { useState } from 'react';
import { uploadRefundFile, submitPayoutProof } from '../../../../shared/api/refundApi';
import { BASE_URL } from '../../../../shared/api/apiClient';
import { QrCode, ClipboardCopy, FileText, CheckCircle, Info, Send } from 'lucide-react';

export default function SellerPayoutProcessing({
  detail,
  onRefresh,
  setError
}) {
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
    <div className="border-t border-gray-200 pt-5 space-y-4 font-sans text-xs">
      <div className="bg-orange-50/10 border border-orange-100 rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-orange-850 border-b border-orange-100 pb-2 flex items-center gap-2">
          <QrCode size={14} className="text-orange-650" />
          Customer Refund Payout Details
        </h4>

        {hasPayoutDetails ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Account Details Box */}
            <div className="md:col-span-2 space-y-2 bg-white p-4 border border-gray-200 rounded-lg relative">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Bank Account / Wallet Details</span>
              <p className="text-gray-800 font-bold font-mono whitespace-pre-wrap leading-relaxed">
                {detail.customerAccountDetails || 'No text details provided.'}
              </p>
              {detail.customerAccountDetails && (
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardCopy size={12} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* QR Code Scan Box */}
            {detail.customerQrUrl ? (
              <div className="bg-white p-4 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 self-start">Scan QR code to pay</span>
                <div className="border p-2 bg-gray-50 rounded-lg">
                  <a href={getImgUrl(detail.customerQrUrl)} target="_blank" rel="noreferrer">
                    <img
                      src={getImgUrl(detail.customerQrUrl)}
                      alt="Customer Payment QR"
                      className="max-h-28 object-contain rounded hover:opacity-90"
                    />
                  </a>
                </div>
                <span className="text-[9px] text-gray-400 font-semibold mt-1">Click to view full size</span>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg text-center text-gray-400 font-semibold flex flex-col items-center justify-center">
                <QrCode size={24} className="mb-1 text-gray-300" />
                <span>No QR Code Uploaded</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-start gap-2.5 text-amber-905 font-semibold leading-normal">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              Waiting for Customer Payout Details: The customer has not provided their payment account details or QR code screenshot yet. You can contact them, or wait for them to update their details before executing the payout.
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={submitting}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Send size={13} />
            Submit Refund Payout Proof
          </button>
        </div>
      </div>

      {/* Submit Payout Proof Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-205">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Submit Refund Payout Proof</h3>
              <button type="button" onClick={() => setShowPayoutModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handlePayoutSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Payment Reference / Transaction ID</label>
                <input
                  type="text"
                  value={payoutForm.paymentReference}
                  onChange={e => setPayoutForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder="e.g. TXN-98439284 or Esewa Ref..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-white font-semibold outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Payment Proof Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setPayoutFile(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400">Payout Remarks / Notes</label>
                <textarea
                  value={payoutForm.paymentComment}
                  onChange={e => setPayoutForm(prev => ({ ...prev, paymentComment: e.target.value }))}
                  placeholder="Write details of the refund payout (method used, bank info etc)..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-white font-semibold outline-none focus:border-orange-500 h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
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
