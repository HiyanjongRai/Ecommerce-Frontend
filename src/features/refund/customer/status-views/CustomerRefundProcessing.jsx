import React, { useState } from 'react';
import { Upload, CheckCircle2, QrCode, ClipboardList, HelpCircle } from 'lucide-react';
import { uploadRefundFile, submitPayoutDetails } from '../../api/refundApi';
import { BASE_URL } from '../../../../shared/api/apiClient';

export default function CustomerRefundProcessing({
  detail,
  onRefresh,
  setActionError
}) {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [qrUrl, setQrUrl] = useState(detail.customerQrUrl || '');
  const [accountDetails, setAccountDetails] = useState(detail.customerAccountDetails || '');
  const [isEditing, setIsEditing] = useState(!detail.customerAccountDetails && !detail.customerQrUrl);

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleQrUploadChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQrFile(file);
    
    setUploadingQr(true);
    setActionError('');
    try {
      const uploadRes = await uploadRefundFile(file);
      const fileUrl = uploadRes.data?.fileUrl;
      if (!fileUrl) throw new Error('File URL not returned');
      setQrUrl(fileUrl);
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to upload QR code screenshot.');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountDetails.trim() && !qrUrl) {
      setActionError('Please provide either bank details or upload a payout QR code.');
      return;
    }

    setSubmitting(true);
    setActionError('');
    try {
      await submitPayoutDetails(detail.id, {
        customerQrUrl: qrUrl,
        customerAccountDetails: accountDetails.trim()
      });
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to submit payout details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (detail.status !== 'REFUND_PROCESSING') {
    return null;
  }

  return (
    <div className="bg-orange-50/15 border border-orange-200 rounded-xl p-5 mb-6 space-y-4 font-sans text-xs">
      <div className="flex items-center gap-2 border-b border-orange-100 pb-3 justify-between">
        <div className="flex items-center gap-2">
          <QrCode size={16} className="text-orange-650" />
          <h3 className="text-xs font-black text-gray-950 uppercase tracking-widest">Refund Payout Details Request</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-2.5 py-1 text-[10px] border border-orange-200 hover:bg-orange-50/50 text-orange-700 rounded-md font-bold transition-all cursor-pointer"
          >
            Update Payout Info
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-start gap-2.5 text-amber-900 leading-normal font-semibold">
            <HelpCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              Please share your payout information (QR Code screenshot and/or Bank details) so the merchant can execute the refund transfer to your account.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Account Details Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                Account Details / Bank Info
              </label>
              <textarea
                value={accountDetails}
                onChange={e => setAccountDetails(e.target.value)}
                placeholder="e.g. eSewa ID: 98XXXXXXXX&#10;Or bank details:&#10;Bank Name: Global IME Bank&#10;A/C Name: John Doe&#10;A/C Number: 1234567890"
                rows="5"
                className="w-full border border-gray-250 rounded-lg p-3 bg-white focus:outline-none focus:border-orange-500 font-semibold leading-relaxed shadow-xs"
                required={!qrUrl}
              />
            </div>

            {/* QR Code Upload Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                Payment QR Code Screenshot (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-white hover:border-orange-400 transition-all relative aspect-video">
                {qrUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <img
                      src={getImgUrl(qrUrl)}
                      alt="Uploaded QR Code"
                      className="max-h-24 object-contain mb-1 rounded border"
                    />
                    <span className="text-[9px] text-[#16A34A] font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> QR Code Uploaded Successfully
                    </span>
                    <button
                      type="button"
                      onClick={() => setQrUrl('')}
                      className="absolute top-0 right-0 text-[10px] font-bold text-red-500 hover:text-red-700 bg-white border border-red-100 rounded px-1.5 py-0.5"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <Upload size={22} className="text-gray-400 mb-1" />
                    <span className="text-[10px] font-bold text-gray-600">
                      {uploadingQr ? 'Uploading QR Code screenshot...' : 'Upload QR Code Screenshot'}
                    </span>
                    <span className="text-[8px] text-gray-400 mt-0.5">JPG, PNG &bull; Max 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUploadChange}
                      className="hidden"
                      disabled={uploadingQr}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {!detail.customerAccountDetails && !detail.customerQrUrl ? null : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-250 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || uploadingQr}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting Details...' : 'Submit Payout Details'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[#16A34A]/10 border border-emerald-100 p-3 rounded-lg flex items-start gap-2.5 text-emerald-900 leading-normal font-semibold">
            <CheckCircle2 size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
            <div>
              You have submitted your payout details. The merchant is currently processing your refund payment. Once paid, the payment receipt screenshot will be verified by the Admin.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Account details show */}
            <div className="bg-white border border-gray-200 p-4 rounded-xl space-y-2.5">
              <span className="text-[9px] font-black text-gray-450 uppercase tracking-widest block mb-1">
                Your Shared Account / Wallet Details
              </span>
              <p className="text-gray-805 font-bold font-mono whitespace-pre-wrap leading-relaxed text-xs">
                {accountDetails || 'No bank/account text details provided.'}
              </p>
            </div>

            {/* QR code show */}
            {qrUrl && (
              <div className="bg-white border border-gray-200 p-4 rounded-xl space-y-2">
                <span className="text-[9px] font-black text-gray-450 uppercase tracking-widest block mb-2">
                  Your Shared QR Code
                </span>
                <div className="border border-gray-150 rounded-lg p-2 bg-gray-50/50 w-fit">
                  <a href={getImgUrl(qrUrl)} target="_blank" rel="noreferrer">
                    <img
                      src={getImgUrl(qrUrl)}
                      alt="Payout QR Code"
                      className="max-h-36 object-contain rounded hover:opacity-85 transition-opacity"
                    />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
