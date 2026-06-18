import React, { useState } from 'react';
import { createRefund, uploadRefundFile } from '../../../shared/api/refundApi';
import { Upload, X, ShieldAlert } from 'lucide-react';

export default function CreateRefundModal({ isOpen, onClose, order, onCreated }) {
  const [type, setType] = useState('REFUND');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');
    const newFiles = [...files];

    try {
      for (const file of selectedFiles) {
        const res = await uploadRefundFile(file);
        if (res.data && res.data.fileUrl) {
          newFiles.push({
            name: file.name,
            url: res.data.fileUrl
          });
        }
      }
      setFiles(newFiles);
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed. Supported formats: JPG, PNG, WEBP, PDF.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for this request.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        orderId: order.orderId,
        type,
        reason,
        description,
        fileUrls: files.map(f => f.url)
      };

      const res = await createRefund(payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit refund request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-emerald-50 px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">📦 Request Refund / Exchange</h3>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              For Order {order.customOrderId || `#${order.orderId}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-left text-sm font-sans text-gray-800">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 flex items-start gap-2 text-xs">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Request Type */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Request Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'REFUND', label: 'Full Refund' },
                { id: 'EXCHANGE', label: 'Exchange Item' },
                { id: 'PARTIAL_REFUND', label: 'Partial Refund' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`py-1.5 rounded-md border text-xs font-bold text-center transition-all ${
                    type === opt.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Select */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Reason
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
              required
            >
              <option value="">Select a reason...</option>
              <option value="DEFECTIVE_PRODUCT">Defective / Damaged product</option>
              <option value="WRONG_ITEM">Wrong product delivered</option>
              <option value="QUALITY_UNSATISFACTORY">Quality not as expected</option>
              <option value="MISSING_PARTS">Missing parts / accessories</option>
              <option value="EXPIRED">Expired product</option>
              <option value="OTHER">Other reason</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Additional Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows="2"
              placeholder="Describe the issue in detail..."
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* File Uploads */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Evidence Upload
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500 font-semibold">
                    {uploading ? 'Uploading files...' : 'Click to upload evidence'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Images or PDF (max 10MB)</p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Files Preview */}
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between border border-gray-100 rounded-lg p-2 bg-gray-50 text-xs font-semibold">
                    <span className="truncate flex-1 pr-2">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-md border border-gray-200 text-xs text-gray-500 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-xs text-white font-bold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
