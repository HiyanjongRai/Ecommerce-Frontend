import React, { useState } from 'react';
import { createRefund, uploadRefundFile } from '../../refund/api/refundApi';
import { X, Upload, ChevronDown, ShieldCheck } from 'lucide-react';
import { BASE_URL } from '../../../shared/api/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const hasActiveRefund = (item) => {
  const status = String(item.refundStatus || item.returnStatus || '').toUpperCase();
  return Boolean(
    item.refundId ||
    item.refundRequestId ||
    item.activeRefund ||
    (status && !['NONE', 'CLOSED', 'REJECTED', 'CANCELLED', 'REFUND_COMPLETED', 'EXCHANGE_COMPLETED'].includes(status))
  );
};

const getApiErrorMessage = (err) => {
  const status = err.response?.status;
  const data = err.response?.data;
  const message =
    data?.message ||
    data?.error ||
    data?.detail ||
    (typeof data === 'string' ? data : '');
  if (status === 409) {
    return message || 'A refund request already exists for this item. Check My Disputes/Refunds.';
  }
  return message || 'Failed to submit refund request.';
};

const REFUND_REASONS = [
  { value: '', label: 'Select a reason...' },
  { value: 'ITEM_NOT_AS_DESCRIBED', label: 'Item is not as described' },
  { value: 'DEFECTIVE_PRODUCT', label: 'Defective / Damaged product' },
  { value: 'WRONG_ITEM', label: 'Wrong product delivered' },
  { value: 'QUALITY_UNSATISFACTORY', label: 'Quality not as expected' },
  { value: 'MISSING_PARTS', label: 'Missing parts / accessories' },
  { value: 'EXPIRED', label: 'Expired product' },
  { value: 'OTHER', label: 'Other reason' },
];

const MAX_CHARS = 300;

export default function CreateRefundModal({ isOpen, onClose, order, onCreated }) {
  const [selectedItemId, setSelectedItemId] = useState(() => {
    if (order?.items?.length) {
      const first = order.items.find(i => !hasActiveRefund(i));
      return first ? String(first.id) : '';
    }
    return '';
  });
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen || !order) return null;

  const items = order.items || [];
  const selectedItem = items.find(i => String(i.id) === selectedItemId);

  const processFiles = async (fileList) => {
    const selected = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!selected.length) return;
    setUploading(true);
    setError('');
    const newFiles = [...files];
    try {
      for (const file of selected) {
        const res = await uploadRefundFile(file);
        if (res.data?.fileUrl) {
          newFiles.push({ name: file.name, url: res.data.fileUrl, preview: URL.createObjectURL(file) });
        }
      }
      setFiles(newFiles);
    } catch (err) {
      setError('File upload failed. Supported formats: JPG, PNG (max 5MB each).');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => processFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) { setError('Please select an item to return.'); return; }
    if (!reason) { setError('Please select a reason for the refund.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        orderId: order.orderId,
        type: 'REFUND',
        reason,
        description,
        fileUrls: files.map(f => f.url),
        items: [{ orderItemId: Number(selectedItemId), quantity: 1 }],
      };
      const res = await createRefund(payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Request Refund</h2>
            <p className="mt-1 text-[12px] text-gray-500 font-medium leading-snug">
              {"We're sorry to hear that you want a refund."}<br />
              Please tell us why you want to return this item.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0 ml-4"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Select Item */}
            <div>
              <p className="text-[13px] font-semibold text-gray-800 mb-2">Select Item</p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setItemDropdownOpen(o => !o)}
                  className="w-full flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2.5 bg-white hover:border-gray-300 transition-colors text-left"
                >
                  {selectedItem ? (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {selectedItem.imagePath ? (
                          <img src={getImgUrl(selectedItem.imagePath)} alt={selectedItem.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded bg-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{selectedItem.productName || selectedItem.name}</p>
                        <p className="text-[11px] text-gray-500 font-medium">{selectedItem.variantLabel || selectedItem.color || 'Standard'}</p>
                      </div>
                      <span className="text-[13px] font-bold text-gray-800 flex-shrink-0 mr-1">
                        {selectedItem.lineTotal != null
                          ? `Rs. ${Number(selectedItem.lineTotal).toLocaleString()}`
                          : selectedItem.unitPrice != null
                          ? `Rs. ${Number(selectedItem.unitPrice * (selectedItem.quantity || 1)).toLocaleString()}`
                          : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] text-gray-400 font-medium flex-1">Choose an item...</span>
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${itemDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {itemDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {items.map(item => {
                      const disabled = hasActiveRefund(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => { setSelectedItemId(String(item.id)); setItemDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            disabled
                              ? 'opacity-50 cursor-not-allowed bg-gray-50'
                              : String(item.id) === selectedItemId
                              ? 'bg-emerald-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {item.imagePath ? (
                              <img src={getImgUrl(item.imagePath)} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-4 h-4 rounded bg-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{item.productName || item.name}</p>
                            <p className="text-[11px] text-gray-500 font-medium">
                              {item.variantLabel || item.color || 'Standard'}
                              {disabled && <span className="ml-2 text-amber-600">• Refund exists</span>}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Reason for Refund */}
            <div>
              <p className="text-[13px] font-semibold text-gray-800 mb-2">Reason for Refund</p>
              <div className="relative">
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-medium text-gray-700 bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors pr-10 cursor-pointer"
                  required
                >
                  {REFUND_REASONS.map(r => (
                    <option key={r.value} value={r.value} disabled={r.value === ''}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <p className="text-[13px] font-semibold text-gray-800 mb-2">
                Additional Details <span className="text-gray-400 font-normal">(Optional)</span>
              </p>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full resize-none border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-medium text-gray-700 bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-gray-400"
                />
                <span className="absolute bottom-3 right-3 text-[11px] text-gray-400 font-medium select-none">
                  {description.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Upload Images */}
            <div>
              <p className="text-[13px] font-semibold text-gray-800 mb-2">
                Upload Images <span className="text-gray-400 font-normal">(Optional)</span>
              </p>
              <label
                className={`flex flex-col items-center justify-center w-full h-[90px] border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload size={20} className="text-gray-400 mb-1.5" />
                <p className="text-[12px] text-gray-500 font-semibold">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG up to 5MB</p>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
              </label>

              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <div className="w-14 h-14 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400 text-center px-1">{file.name}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 pb-6 flex-shrink-0 space-y-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 py-3 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Refund Request'}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
              <ShieldCheck size={13} className="text-gray-400 flex-shrink-0" />
              <span>Your request will be reviewed within 1-2 business days.</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
