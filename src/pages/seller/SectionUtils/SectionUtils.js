import { BASE_URL } from '../../../services/apiConfig';

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

export const EmptyState = ({ title, text }) => {
  const isDark = localStorage.getItem('seller-theme') === 'dark';
  return (
    <div 
      className={`border rounded-[20px] p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] ${
        isDark ? 'bg-zinc-950/45 border-white/[0.08] text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      <h3 className="text-xs font-black uppercase tracking-wider">{title}</h3>
      <p className="text-[10px] text-gray-400 font-semibold mt-2">{text}</p>
    </div>
  );
};

export const SectionHeader = ({ title, subtitle, tag = 'Seller Portal', action }) => {
  const isDark = localStorage.getItem('seller-theme') === 'dark';
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border transition-all ${
        isDark ? 'border-white/[0.08]' : 'border-gray-200'
      }`}
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #0b0c10 0%, #111827 40%, rgba(22, 163, 74, 0.15) 100%)' 
          : 'linear-gradient(135deg, #111827 0%, #16A34A 100%)',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '20px'
      }}
    >
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
        <div>
          <p className="text-emerald-100/70 text-[9px] font-black uppercase tracking-[0.25em] bg-white/10 border border-white/10 rounded-full px-2.5 py-0.5 inline-block mb-1">
            {tag}
          </p>
          <h1 className="text-white text-xl font-bold leading-tight tracking-tight mt-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-emerald-100/70 text-xs font-normal mt-1.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};


