import { BASE_URL } from '../../../shared/api/apiConfig';

export const resolveImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

export const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

export const statusClass = (status = '') => {
  const key = String(status).toLowerCase();
  if (key.includes('active') || key.includes('delivered') || key.includes('paid') || key.includes('approved') || key.includes('refunded') || key.includes('received')) {
    return 'bg-green-50 text-green-700 border-green-100';
  }
  if (key.includes('pending') || key.includes('processing') || key.includes('shipped') || key.includes('requested') || key.includes('viewed') || key.includes('review') || key.includes('waiting') || key.includes('transit')) {
    return 'bg-blue-50 text-blue-700 border-blue-100';
  }
  if (key.includes('cancel') || key.includes('reject') || key.includes('inactive') || key.includes('due') || key.includes('failed') || key.includes('escalated')) {
    return 'bg-red-50 text-red-700 border-red-100';
  }
  return 'bg-gray-50 text-gray-600 border-gray-100';
};

export const LoadingState = ({ label = 'Loading...' }) => (
  <div className="flex items-center gap-2 py-10 text-gray-400 text-sm">
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
    {label}
  </div>
);

export const EmptyState = ({ title, text }) => (
  <div className="bg-white border border-gray-200 rounded-sm p-6 text-center shadow-sm">
    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">{title}</h3>
    <p className="text-[10px] text-gray-500 font-semibold mt-1">{text}</p>
  </div>
);

export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="bg-white rounded-sm p-4 shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h2 className="text-sm font-black text-gray-900 tracking-tight">{title}</h2>
      {subtitle ? <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);


