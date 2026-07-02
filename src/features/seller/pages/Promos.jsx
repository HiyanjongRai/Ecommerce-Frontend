import React, { useEffect, useState, useMemo } from 'react';
import { getSellerPromos, createSellerPromo, getSellerProfile } from '../api/sellerApi';
import { normalizeList, formatMoney, SectionHeader } from './SectionUtils';
import { useSellerTheme } from '../hooks/useSellerTheme';
import { 
  Ticket, Percent, Calendar, Plus, RefreshCw, AlertCircle, CheckCircle, Clock, Info, X
} from 'lucide-react';

const SellerPromos = () => {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

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
  const [homepageFeatured, setHomepageFeatured] = useState(false);
  const [homepageOrder, setHomepageOrder] = useState('');
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
        homepageFeatured,
        homepageOrder: homepageOrder === '' ? null : Number(homepageOrder),
      };
      await createSellerPromo(payload);
      setMessage('Promo code created successfully!');
      setFormOpen(false);
      setCode(''); setDiscountType('PERCENTAGE'); setDiscountValue('');
      setMinOrderValue(''); setUsageLimit(''); setPerUserUsageLimit('1');
      setHomepageFeatured(false); setHomepageOrder('');
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

  const inputCls = `w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
    isDark 
      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-650 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15' 
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-405 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
  }`;

  const selectCls = `w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all appearance-none cursor-pointer ${
    isDark 
      ? 'bg-[#111827] border-white/10 text-white focus:border-[#16A34A]' 
      : 'bg-white border-gray-200 text-gray-900 focus:border-[#16A34A]'
  }`;

  if (loading) return (
    <div className={`flex flex-col items-center justify-center h-64 gap-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <svg className="animate-spin w-6 h-6 text-[#16A34A]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-xs font-bold uppercase tracking-wider">Loading promo codes...</span>
    </div>
  );

  return (
    <div className={`space-y-4 max-w-[1400px] animate-in fade-in-50 duration-200 font-sans ${themeClasses.bg.primary}`}>

      {/* â”€â”€ Page Header Banner â”€â”€ */}
      <SectionHeader
        title="Promo Codes Desk"
        subtitle="Generate shop-wide coupons, specify minimum order thresholds, and review usage ledger details."
        tag="Voucher Center"
        action={
          <div className="flex flex-wrap gap-2 shrink-0">
            <button 
              type="button" 
              onClick={loadData} 
              className="h-10 rounded-xl px-4 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 cursor-pointer shadow-sm"
            >
              <RefreshCw size={12} className={`shrink-0 ${loading ? 'animate-spin' : ''}`} />
              Sync Ledger
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="h-10 rounded-xl px-5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-white text-gray-950 hover:bg-gray-150 active:scale-95 cursor-pointer shadow-sm border border-gray-200"
            >
              <Plus size={12} />
              Create Promo
            </button>
          </div>
        }
      />

      {/* â”€â”€ Alerts Banners â”€â”€ */}
      {errorMsg && (
        <div className={`p-4 border rounded-xl text-xs font-black flex items-center gap-3 tracking-wide uppercase animate-in fade-in duration-205 ${
          isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-750'
        }`}>
          <AlertCircle size={16} className="shrink-0" />
          {errorMsg}
        </div>
      )}
      {message && (
        <div className={`p-4 border rounded-xl text-xs font-black flex items-center gap-3 tracking-wide uppercase animate-in fade-in duration-205 ${
          isDark ? 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]' : 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#152F17]'
        }`}>
          <CheckCircle size={16} className="shrink-0" />
          {message}
        </div>
      )}

      {/* â”€â”€ Telemetry Stats Grid â”€â”€ */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Promo Codes', value: metrics.active, icon: Ticket, color: isDark ? 'text-emerald-450 bg-[#16A34A]/100/10' : 'text-[#152F17] bg-[#16A34A]/10' },
          { label: 'Total Times Used', value: metrics.totalUses, icon: Clock, color: isDark ? 'text-blue-450 bg-blue-500/10' : 'text-blue-700 bg-blue-50' },
          { label: 'Total Registered', value: metrics.totalCount, icon: Percent, color: isDark ? 'text-purple-450 bg-purple-500/10' : 'text-purple-700 bg-purple-50' }
        ].map(s => {
          const IconComp = s.icon;
          return (
            <div key={s.label} className={`border rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all hover:-translate-y-0.5 duration-300 ${
              isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
            }`}>
              <div>
                <h3 className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</h3>
                <div className={`text-xl font-black leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
              </div>
              <div className={`p-2.5 rounded-xl ${s.color}`}>
                <IconComp size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* â”€â”€ Promos Ledger Table â”€â”€ */}
      <div className={`border rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-colors overflow-hidden ${
        isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-5 py-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Promo Voucher Ledger</p>
          <p className={`text-[10px] font-bold ${isDark ? 'text-gray-550' : 'text-gray-450'}`}>{promos.length} coupon code{promos.length !== 1 ? 's' : ''}</p>
        </div>

        {promos.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={32} className={`mx-auto mb-3.5 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Vouchers Generated Yet</p>
            <p className={`text-[10px] font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Launch store discount voucher codes to boost customer conversion.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto custom-scrollbar rounded-b-2xl ${
            isDark ? 'bg-[#0c0c0e]/20' : 'bg-white'
          }`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[9px] font-black uppercase tracking-widest ${
                  isDark ? 'bg-[#111827] border-white/10 text-gray-400' : 'bg-gray-50/80 border-gray-100 text-gray-450'
                }`}>
                  <th className="px-5 py-3.5">Coupon Code</th>
                  <th className="px-5 py-3.5">Discount Rate</th>
                  <th className="px-5 py-3.5">Min Order Threshold</th>
                  <th className="px-5 py-3.5">Usage Limit</th>
                  <th className="px-5 py-3.5">Times Redeemed</th>
                  <th className="px-5 py-3.5">Validity Range</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5 text-gray-300' : 'divide-gray-100 text-gray-750'} text-xs font-semibold`}>
                {promos.map((item, index) => {
                  const isActive = item.isActive;
                  const discountStr = item.discountType === 'PERCENTAGE'
                    ? `${item.discountValue}%`
                    : formatMoney(item.discountValue);
                  return (
                    <tr key={item.id || index} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-mono font-black border uppercase tracking-wider ${
                          isDark 
                            ? 'bg-[#111827] border-white/10 text-[#16A34A] shadow-[0_2px_8px_rgba(52,211,153,0.06)]' 
                            : 'bg-[#16A34A]/10 border-emerald-100 text-emerald-800'
                        }`}>
                          {item.code}
                        </span>
                      </td>
                      <td className={`px-5 py-4 font-black text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{discountStr}</td>
                      <td className={`px-5 py-4 font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatMoney(item.minOrderValue)}</td>
                      <td className={`px-5 py-4 font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.usageLimit || 'Unlimited'}</td>
                      <td className={`px-5 py-4 font-black text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.usedCount || 0}Ã—</td>
                      <td className={`px-5 py-4 text-[10px] font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(item.startDate).toLocaleDateString()} â€“ {new Date(item.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isActive
                            ? (isDark ? 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20' : 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/30')
                            : (isDark ? 'bg-white/5 text-gray-500 border-white/10' : 'bg-gray-100 text-gray-500 border-gray-200')
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

      {/* â”€â”€ Coupon Creation Modal Overlay â”€â”€ */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`relative rounded-2xl border w-full max-w-md flex flex-col max-h-[88vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>

            {/* Modal Header */}
            <div className={`flex-shrink-0 px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50/50'
            }`}>
              <div>
                <h2 className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Generate Promo Code</h2>
                <p className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configure discounts and limits for custom vouchers.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-405 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Scrollable Body */}
            <form onSubmit={handleCreatePromo} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs font-semibold">

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Coupon Voucher Code Name</label>
                <input
                  type="text" required
                  placeholder="e.g. FLASH50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={`${inputCls} uppercase font-mono font-black text-xs tracking-wider`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Calculation Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className={selectCls}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Value (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-455'}`}>Discount value</label>
                  <div className="relative">
                    <input
                      type="number" required min="1"
                      placeholder={discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 500'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className={inputCls}
                    />
                    <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black ${isDark ? 'text-gray-650' : 'text-gray-400'}`}>
                      {discountType === 'PERCENTAGE' ? '%' : 'Rs.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Min Order Threshold</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black ${isDark ? 'text-gray-550' : 'text-gray-400'}`}>Rs.</span>
                    <input
                      type="number" min="0" placeholder="e.g. 1000"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Max Global Uses</label>
                  <input
                    type="number" min="1" placeholder="e.g. 500"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Max usage Per Customer</label>
                <input
                  type="number" min="1" required
                  value={perUserUsageLimit}
                  onChange={(e) => setPerUserUsageLimit(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/5 text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`}>
                  <input
                    type="checkbox"
                    checked={homepageFeatured}
                    onChange={(e) => setHomepageFeatured(e.target.checked)}
                  />
                  Feature on homepage
                </label>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Homepage Order</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Lower first"
                    value={homepageOrder}
                    onChange={(e) => setHomepageOrder(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Validity Start Date</label>
                  <input
                    type="datetime-local" required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Validity End Date</label>
                  <input
                    type="datetime-local" required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Informative advice */}
              <div className={`border p-3 rounded-xl flex items-start gap-2.5 ${
                isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'
              }`}>
                <Info size={14} className="shrink-0 mt-0.5" />
                <p className="text-[9.5px] leading-normal font-semibold">
                  Once activated, this coupon code can be distributed to customers immediately and will be validated automatically at checkout based on minimum order and validity rules.
                </p>
              </div>

              {/* Modal Footer Actions */}
              <div className={`pt-5 mt-2 border-t flex items-center justify-end gap-3 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
                    isDark ? 'border-white/15 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
                    isDark ? 'bg-[#16A34A] text-white hover:bg-[#059669]' : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Activating...
                    </>
                  ) : 'Activate Coupon'}
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



