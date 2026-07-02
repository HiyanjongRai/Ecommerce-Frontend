import React, { useState } from 'react';
import { createRefund, uploadRefundFile } from '../../refund/api/refundApi';
import { Upload, X, ShieldAlert } from 'lucide-react';
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
    return message || 'A refund or exchange request already exists for this order item. Please check My Disputes/Refunds instead of submitting another request.';
  }

  return message || 'Failed to submit refund request.';
};

export default function CreateRefundModal({ isOpen, onClose, order, onCreated }) {
  const [type, setType] = useState('REFUND');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedItems, setSelectedItems] = useState(() => {
    const init = {};
    if (order && order.items) {
      order.items.forEach(item => {
        init[item.id] = {
          selected: false,
          quantity: 1,
          maxQuantity: item.quantity,
          disabled: hasActiveRefund(item),
        };
      });
    }
    return init;
  });

  if (!isOpen || !order) return null;

  const toggleItem = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: prev[itemId]?.disabled
        ? prev[itemId]
        : { ...prev[itemId], selected: !prev[itemId].selected }
    }));
  };

  const changeQuantity = (itemId, delta) => {
    setSelectedItems(prev => {
      const current = prev[itemId];
      const newQ = Math.max(1, Math.min(current.maxQuantity, current.quantity + delta));
      return { ...prev, [itemId]: { ...current, quantity: newQ } };
    });
  };

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
      const itemsPayload = Object.entries(selectedItems)
        .filter(([_, data]) => data.selected && !data.disabled)
        .map(([id, data]) => ({ orderItemId: Number(id), quantity: data.quantity }));

      if (itemsPayload.length === 0) {
        setError('Please select at least one item.');
        setSubmitting(false);
        return;
      }

      const payload = {
        orderId: order.orderId,
        type,
        reason,
        description,
        fileUrls: files.map(f => f.url),
        items: itemsPayload
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

          {/* Select Items */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Select Items to Return / Refund
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {order.items?.map(item => {
                const state = selectedItems[item.id] || { selected: false, quantity: 1, maxQuantity: 1 };
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${state.disabled ? 'border-gray-100 bg-gray-100 opacity-70' : state.selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      checked={state.selected}
                      disabled={state.disabled}
                      onChange={() => toggleItem(item.id)}
                    />
                    <div className="w-10 h-10 bg-white rounded flex-shrink-0 border border-gray-100 overflow-hidden flex items-center justify-center">
                      {item.imagePath ? (
                        <img src={getImgUrl(item.imagePath)} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-400">No img</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.productName}</p>
                      <p className="text-[10px] font-semibold text-gray-500 truncate">{item.variantLabel || 'Standard'}</p>
                      {state.disabled && (
                        <p className="text-[10px] font-bold text-amber-600 mt-0.5">Refund request already exists</p>
                      )}
                    </div>
                    {state.selected && state.maxQuantity > 1 && (
                      <div className="flex items-center gap-2 bg-white rounded-md border border-emerald-200 px-1 py-0.5">
                        <button type="button" onClick={() => changeQuantity(item.id, -1)} disabled={state.quantity <= 1} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 font-bold">-</button>
                        <span className="text-xs font-bold w-4 text-center">{state.quantity}</span>
                        <button type="button" onClick={() => changeQuantity(item.id, 1)} disabled={state.quantity >= state.maxQuantity} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 font-bold">+</button>
                      </div>
                    )}
                  </div>
                );
              })}
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
