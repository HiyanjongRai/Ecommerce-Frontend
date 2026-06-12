import React, { useEffect, useState, useMemo } from 'react';
import { getSellerPromos, createSellerPromo, getSellerProfile } from '../services/sellerService';
import { normalizeList, formatMoney } from './SellerSectionUtils';

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

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('Promo code is required.');
      return;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      setErrorMsg('Discount value must be greater than 0.');
      return;
    }
    if (discountType === 'PERCENTAGE' && Number(discountValue) > 100) {
      setErrorMsg('Percentage discount cannot exceed 100%.');
      return;
    }

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
      
      // Reset form
      setCode('');
      setDiscountType('PERCENTAGE');
      setDiscountValue('');
      setMinOrderValue('');
      setUsageLimit('');
      setPerUserUsageLimit('1');
      setStartDate('');
      setEndDate('');

      // Reload
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Failed to create promo code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const active = promos.filter(p => p.isActive).length;
    const totalUses = promos.reduce((sum, p) => sum + (p.usedCount || 0), 0);
    return { active, totalUses, totalCount: promos.length };
  }, [promos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-[#A3AED0]">
          <svg className="animate-spin w-5 h-5 text-[#4318FF]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm font-semibold">Loading promotions…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header card */}
      <div className="bg-white rounded-[12px] p-4 md:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.015)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FCEBF9] text-[#E029B3] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-[#2B3674]">Promo Codes</h1>
              <p className="text-[#A3AED0] text-[11px] font-medium mt-0.5">Manage exclusive store discount coupons and review customer use history.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 bg-[#4318FF] text-white px-4 py-2 rounded-xl text-xs font-black transition-transform hover:scale-105 active:scale-95 shadow-md"
          >
            + Create New Promo
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-[11px] font-semibold text-red-600">
            {errorMsg}
          </div>
        )}
        {message && (
          <div className="mt-3 rounded-lg border border-green-100 bg-green-50/50 px-3 py-2 text-[11px] font-semibold text-green-600">
            {message}
          </div>
        )}
      </div>

      {/* Metrics deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-[12px] p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.015)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E6FAF5] text-[#05CD99] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#A3AED0] uppercase tracking-wider mb-0.5">Active Promos</p>
            <p className="text-xl font-black text-[#2B3674]">{metrics.active}</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.015)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5FF] text-[#4318FF] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#A3AED0] uppercase tracking-wider mb-0.5">Total Uses</p>
            <p className="text-xl font-black text-[#2B3674]">{metrics.totalUses} times</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.015)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] text-[#4318FF] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#A3AED0] uppercase tracking-wider mb-0.5">Total Registered</p>
            <p className="text-xl font-black text-[#2B3674]">{metrics.totalCount}</p>
          </div>
        </div>
      </div>

      {/* Promos Table Card */}
      <div className="bg-white rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.015)] overflow-hidden p-4 md:p-5">
        <h2 className="text-sm font-bold text-[#2B3674] tracking-tight mb-4">Promo Ledger</h2>

        {promos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-[#F4F7FE] flex items-center justify-center mx-auto mb-3 text-[#E029B3]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-[#2B3674] font-semibold text-xs">No store promo codes found</p>
            <p className="text-[#A3AED0] text-[10px] mt-1">Create exclusive promo codes to attract more customers to your store.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2.5 px-2 text-[10px] font-semibold text-[#A3AED0]">Code</th>
                  <th className="py-2.5 px-2 text-[10px] font-semibold text-[#A3AED0]">Discount</th>
                  <th className="py-2.5 px-2 text-[10px] font-semibold text-[#A3AED0]">Min Order</th>
                  <th className="py-2.5 px-2 text-[10px] font-semibold text-[#A3AED0]">Usage Limit</th>
                  <th className="py-2.5 px-2 text-[10px] font-semibold text-[#A3AED0]">Used Count</th>
                  <th className="py-2.5 px-2 text-[10px] font-semibold text-[#A3AED0]">Validity Range</th>
                  <th className="py-2.5 px-2 text-[10px] font-semibold text-[#A3AED0]">Status</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((item, index) => {
                  const isActive = item.isActive;
                  const discountStr = item.discountType === 'PERCENTAGE' 
                    ? `${item.discountValue}%` 
                    : formatMoney(item.discountValue);
                  
                  return (
                    <tr key={item.id || index} className="border-b border-gray-50/50 hover:bg-[#F4F7FE]/30 transition-colors">
                      <td className="py-2.5 px-2 font-black text-[#2B3674] text-xs">
                        <span className="bg-[#FCEBF9] text-[#E029B3] px-2 py-0.5 rounded text-[11px] font-mono border border-[#E029B3]/10 uppercase">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-[#2B3674] text-xs">
                        {discountStr}
                      </td>
                      <td className="py-2.5 px-2 text-[#A3AED0] font-semibold text-xs">
                        {formatMoney(item.minOrderValue)}
                      </td>
                      <td className="py-2.5 px-2 text-[#A3AED0] font-semibold text-xs">
                        {item.usageLimit || 'Unlimited'}
                      </td>
                      <td className="py-2.5 px-2 font-black text-[#4318FF] text-xs">
                        {item.usedCount || 0} times
                      </td>
                      <td className="py-2.5 px-2 text-[#A3AED0] font-semibold text-[10px]">
                        {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                          isActive 
                            ? 'bg-[#E6FAF5] text-[#05CD99]' 
                            : 'bg-gray-100 text-gray-500'
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

      {/* Creation Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[6px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#FCEBF9]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FCEBF9] text-[#E029B3] flex items-center justify-center">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2B3674]">Create Store Promo Code</h3>
                  <p className="text-[10px] text-[#A3AED0] font-semibold">Offer discount rates to customers.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-[#A3AED0] hover:text-[#2B3674] hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreatePromo} className="flex-1 overflow-y-auto p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">
                  Coupon Code Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER30"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full text-xs font-bold text-[#2B3674] bg-[#F4F7FE] border border-gray-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#E029B3] focus:bg-white transition-all uppercase placeholder-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full text-xs font-bold text-[#2B3674] bg-[#F4F7FE] border border-gray-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#E029B3] focus:bg-white transition-all"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed amount (Rs.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 30' : 'e.g. 150'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full text-xs font-bold text-[#2B3674] bg-[#F4F7FE] border border-gray-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#E029B3] focus:bg-white transition-all placeholder-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">
                    Min Order Value (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1000"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full text-xs font-bold text-[#2B3674] bg-[#F4F7FE] border border-gray-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#E029B3] focus:bg-white transition-all placeholder-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">
                    Max Total Uses Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full text-xs font-bold text-[#2B3674] bg-[#F4F7FE] border border-gray-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#E029B3] focus:bg-white transition-all placeholder-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">
                  Usage Limit Per Customer
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={perUserUsageLimit}
                  onChange={(e) => setPerUserUsageLimit(e.target.value)}
                  className="w-full text-xs font-bold text-[#2B3674] bg-[#F4F7FE] border border-gray-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#E029B3] focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-bold text-[#2B3674] bg-[#F4F7FE] border border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#E029B3] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-bold text-[#2B3674] bg-[#F4F7FE] border border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#E029B3] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="text-xs font-bold text-gray-500 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#E029B3] hover:bg-[#B51E8F] text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating…
                    </>
                  ) : (
                    'Activate Promo'
                  )}
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
