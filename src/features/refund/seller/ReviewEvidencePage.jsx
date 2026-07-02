import React from 'react';
import { Eye, FileText, AlertCircle } from 'lucide-react';
import { toast } from '../../../shared/contexts/ToastContext';

export default function ReviewEvidencePage({
  detail,
  hooksContext,
  isDark = false
}) {
  const { handleRequestEvidence, submitting } = hooksContext;

  return (
    <div className={`p-5 border rounded-2xl space-y-4 ${
      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
    }`}>
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider">Evidence Review Requested</h4>
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
            The customer has been asked to upload photos. Please review any files attached under 'Evidence Photos' below.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleRequestEvidence}
          disabled={submitting}
          className="w-full py-2.5 border rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer bg-transparent border-indigo-650 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-650 hover:text-white"
        >
          Request Additional Evidence Files
        </button>
      </div>
    </div>
  );
}
