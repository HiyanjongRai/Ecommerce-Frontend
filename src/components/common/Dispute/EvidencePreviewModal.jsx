import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getAccessToken } from '../../../utils/storage';

const isPdf = (url = '') => url.toLowerCase().split('?')[0].endsWith('.pdf');

export default function EvidencePreviewModal({ url, title = 'Customer Evidence', onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!url) {
      setPreviewUrl(null);
      return undefined;
    }

    let objectUrl = null;
    let cancelled = false;

    const loadEvidence = async () => {
      try {
        setLoading(true);
        setError('');
        setPreviewUrl(null);

        const token = getAccessToken();
        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Evidence could not be loaded (${response.status})`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setPreviewUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Evidence could not be loaded.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEvidence();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">{title}</h3>
            <p className="mt-0.5 text-xs font-semibold text-gray-400">Previewing the uploaded refund evidence.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close evidence preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-[320px] overflow-auto bg-gray-50 p-4">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center text-sm font-bold text-gray-400">
              Loading evidence...
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-red-100 bg-red-50 p-6 text-center">
              <p className="text-sm font-black text-red-700">{error}</p>
              <p className="mt-2 max-w-md text-xs font-semibold text-red-500">
                Restart the backend if you just added the evidence security rule, then reopen this preview.
              </p>
            </div>
          ) : isPdf(url) ? (
            <iframe
              src={previewUrl}
              title={title}
              className="h-[72vh] w-full rounded-lg border border-gray-200 bg-white"
            />
          ) : (
            <img
              src={previewUrl}
              alt={title}
              className="mx-auto max-h-[72vh] max-w-full rounded-lg border border-gray-200 bg-white object-contain shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}


