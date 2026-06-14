import React, { useEffect, useState, useMemo } from 'react';
import { getSellerPromos, createSellerPromo, getSellerProfile } from '../services/sellerService';
import { normalizeList, formatMoney, SectionHeader, LoadingState } from './SellerSectionUtils';

const inputCls = 'w-full text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:border-gray-400 transition-colors placeholder-gray-300';

const SellerPromos = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerUserId, setSellerUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserUsageLimit, setPerUserUsageLimit] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileRes = await getSellerProfile();
      const sellerId = profileRes.data?.userId;
      setSellerUserId(sellerId);
      if (sellerId) {
        const promosRes = await getSellerPromos(sellerId);
        setPromos(normalizeList(promosRes.data));
      }
    } catch (err) {
      setErrorMsg('Failed to load store promo codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setErrorMsg('Promo code is required.'); return; }
    if (!discountValue || Number(discountValue) <= 0) { setErrorMsg('Discount value must be greater than 0.'); return; }
    if (discountType === 'PERCENTAGE' && Number(discountValue) > 100) { setErrorMsg('Percentage discount cannot exceed 100%.'); return; }

    setIsSubmitting(true);
    setErrorMsg('');
    setMessage('');

    try {
      const payload = {
        code: code.toUpperCase().trim(),
        sellerId: sellerUserId,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        usageLimit: usageLimit ? Number(usageLimit) : 9999,
        perUserUsageLimit: perUserUsageLimit ? Number(perUserUsageLimit) : 1,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      };
      await createSellerPromo(payload);
      setMessage('Promo code created successfully!');
      setFormOpen(false);
      setCode(''); setDiscountType('PERCENTAGE'); setDiscountValue('');
      setMinOrderValue(''); setUsageLimit(''); setPerUserUsageLimit('1');
      setStartDate(''); setEndDate('');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Failed to create promo code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const metrics = useMemo(() => {
    const active = promos.filter(p => p.isActive).length;
    const totalUses = promos.reduce((sum, p) => sum + (p.usedCount || 0), 0);
    return { active, totalUses, totalCount: promos.length };
  }, [promos]);

  if (loading) return <LoadingState label="Loading promo codes…" />;

  return (
    <div className="space-y-4 max-w-[1400px]">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Promo Codes"
          subtitle="Manage exclusive store discount coupons and review customer use history."
        />
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors"
        >
          + Create Promo
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs font-bold text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errorMsg}
        </div>
      )}
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs font-bold text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Active Promos',     value: metrics.active,               },
          { label: 'Total Uses',        value: `${metrics.totalUses} times`,  },
          { label: 'Total Registered',  value: metrics.totalCount,            },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-sm shadow-sm p-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">{s.label}</h3>
              <div className="text-base font-black text-gray-900 leading-none">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Promos Table */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Promo Ledger</p>
          <p className="text-[10px] text-gray-400 font-medium">{promos.length} code{promos.length !== 1 ? 's' : ''}</p>
        </div>

        {promos.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-xs font-black text-gray-800 uppercase tracking-wider mb-1">No promo codes yet</p>
            <p className="text-[10px] text-gray-400 font-medium">Create exclusive promo codes to attract more customers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Code</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Discount</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Min Order</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Usage Limit</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Used</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Validity</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((item, index) => {
                  const isActive = item.isActive;
                  const discountStr = item.discountType === 'PERCENTAGE'
                    ? `${item.discountValue}%`
                    : formatMoney(item.discountValue);
                  return (
                    <tr key={item.id || index} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-sm text-[10px] font-mono font-black border border-gray-200 uppercase tracking-wider">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-black text-[11px] text-gray-900">{discountStr}</td>
                      <td className="py-2.5 px-3 font-semibold text-[11px] text-gray-500">{formatMoney(item.minOrderValue)}</td>
                      <td className="py-2.5 px-3 font-semibold text-[11px] text-gray-500">{item.usageLimit || 'Unlimited'}</td>
                      <td className="py-2.5 px-3 font-black text-[11px] text-gray-900">{item.usedCount || 0}×</td>
                      <td className="py-2.5 px-3 text-[10px] text-gray-400 font-medium">
                        {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wide inline-block border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-2xl border border-gray-200 w-full max-w-md flex flex-col max-h-[88vh]">

            {/* Modal Header */}
            <div className="flex-shrink-0 px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-gray-900">Create Promo Code</h2>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Offer discount rates to customers.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePromo} className="flex-1 overflow-y-auto p-4 space-y-3">

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Coupon Code Name</label>
                <input
                  type="text" required
                  placeholder="e.g. SUMMER30"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={`${inputCls} uppercase`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Discount Value</label>
                  <input
                    type="number" required min="1"
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 30' : 'e.g. 150'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Min Order (Rs.)</label>
                  <input
                    type="number" min="0" placeholder="e.g. 1000"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Max Total Uses</label>
                  <input
                    type="number" min="1" placeholder="e.g. 100"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Uses Per Customer</label>
                <input
                  type="number" min="1" required
                  value={perUserUsageLimit}
                  onChange={(e) => setPerUserUsageLimit(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="datetime-local" required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="datetime-local" required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="text-[10px] font-black text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-sm transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gray-900 hover:bg-black text-white text-[10px] font-black px-4 py-1.5 rounded-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating…
                    </>
                  ) : 'Activate Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPromos;
