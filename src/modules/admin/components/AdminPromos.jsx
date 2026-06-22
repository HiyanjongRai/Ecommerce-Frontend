import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, RefreshCw, Tag, X, Calendar, Hash,
  Percent, DollarSign, AlertCircle, CheckCircle
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { getAdminPromos, createAdminPromo } from '../services/adminService';

const nice  = v => String(v || '').replaceAll('_', ' ');
const date  = v => v ? new Date(v).toLocaleDateString() : 'N/A';
const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;

/* ─── Status badge ───────────────────────────────────────────── */
const StatusBadge = ({ promo, themeClasses }) => {
  const now = Date.now();
  const start = promo.startDate ? new Date(promo.startDate).getTime() : 0;
  const end   = promo.endDate   ? new Date(promo.endDate).getTime()   : Infinity;
  const usesLeft = promo.usesLeft ?? ((promo.maxUses || 0) - (promo.timesUsed || 0));
  if (now > end || usesLeft === 0) {
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border transition-colors ${themeClasses.status.pending}`}>Expired</span>;
  }
  if (now < start) {
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border transition-colors ${themeClasses.status.info}`}>Scheduled</span>;
  }
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border transition-colors ${themeClasses.status.success}`}>Active</span>;
};

/* ─── Blank form ─────────────────────────────────────────────── */
const blankForm = () => ({
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minOrderAmount: '',
  maxUses: '',
  perUserLimit: '',
  startDate: '',
  endDate: '',
  applicableTo: 'ALL',
});

export default function AdminPromos() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [promos, setPromos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState('');
  const [working, setWorking]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]           = useState(blankForm());
  const [saving, setSaving]       = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3200); };

  /* ── Load ──────────────────────────────────────────────────── */
  const loadPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminPromos();
      setPromos(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('❌ Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPromos(); }, [loadPromos]);

  /* ── Create Promo ──────────────────────────────────────────── */
  const handleCreate = async () => {
    if (!form.code.trim())     { showToast('❌ Promo code is required'); return; }
    if (!form.discountValue)   { showToast('❌ Discount value is required'); return; }
    if (!form.startDate || !form.endDate) { showToast('❌ Start and End date are required'); return; }

    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit) : null,
        startDate: form.startDate,
        endDate: form.endDate,
        applicableTo: form.applicableTo,
        sellerId: null,   // Platform-wide — no seller restriction
      };
      const res = await createAdminPromo(payload);
      setPromos(prev => [res.data, ...prev]);
      showToast('✅ Platform promo code created');
      setShowCreate(false);
      setForm(blankForm());
    } catch {
      showToast('❌ Failed to create promo code');
    } finally {
      setSaving(false);
    }
  };

  /* ── Auto-uppercase code field ─────────────────────────────── */
  const setCode = val => setForm(f => ({ ...f, code: val.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }));

  /* Stats calculation */
  const stats = React.useMemo(() => {
    const total = promos.length;
    const now = Date.now();
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    promos.forEach(p => {
      const start = p.startDate ? new Date(p.startDate).getTime() : 0;
      const end   = p.endDate   ? new Date(p.endDate).getTime()   : Infinity;
      const usesLeft = p.usesLeft ?? ((p.maxUses || 0) - (p.timesUsed || 0));
      if (now > end || usesLeft === 0) {
        expired++;
      } else if (now < start) {
        scheduled++;
      } else {
        active++;
      }
    });
    return { total, active, scheduled, expired };
  }, [promos]);

  /* ─────────────────────────────────────────────────────────── */
  return (
    <AdminLayout
      pageTitle="Promo Codes"
      pageSubtitle="Platform-wide coupon management"
      headerActions={
        <button
          onClick={() => { setForm(blankForm()); setShowCreate(true); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow ${themeClasses.button.primary}`}
        >
          <Plus size={14} /> Create Promo Code
        </button>
      }
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-[20px] shadow-2xl border transition-all ${themeClasses.bg.secondary} ${themeClasses.border.accent} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      <div className="p-4 lg:p-6 space-y-6">
        {/* Dynamic Statistics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          
          {/* Total Promos */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Total Promos</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-2xs">
                <Tag size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.total}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.tertiary}`}>Registered coupons</p>
            </div>
          </div>

          {/* Active */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Active</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CheckCircle size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.active}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.success}`}>Currently valid</p>
            </div>
          </div>

          {/* Scheduled */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Scheduled</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <Calendar size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.scheduled}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.info}`}>Future campaigns</p>
            </div>
          </div>

          {/* Expired */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Expired</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
                <AlertCircle size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.expired}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.warning}`}>Out of date/uses</p>
            </div>
          </div>

        </div>

        {/* Refresh bar */}
        <div className={`rounded-[20px] border p-4 shadow-sm flex items-center justify-end transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          <button
            onClick={loadPromos}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.outline}`}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Table container */}
        <div className={`rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Code', 'Type', 'Discount', 'Min Order', 'Max Uses', 'Uses Left', 'Valid From', 'Valid Until', 'Seller', 'Status'].map(h => (
                    <th key={h} className={`px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${themeClasses.border.primary}`}>
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(10).fill(0).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : promos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16">
                      <div className={`flex flex-col items-center gap-2 transition-colors ${themeClasses.text.secondary}`}>
                        <Tag size={28} className={`transition-colors ${themeClasses.text.tertiary}`} />
                        <p className="font-bold">No promo codes found.</p>
                        <button
                          onClick={() => { setForm(blankForm()); setShowCreate(true); }}
                          className={`mt-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-colors ${themeClasses.button.primary}`}
                        >
                          Create First Promo
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : promos.map((promo, idx) => {
                  const promoId = promo.id || promo.promoId || idx;
                  const usesLeft = promo.usesLeft ?? ((promo.maxUses || 0) - (promo.timesUsed || 0));
                  return (
                    <tr key={promoId} className={`transition-colors hover:${themeClasses.bg.secondary}`}>
                      {/* Code */}
                      <td className="px-5 py-4">
                        <span className={`font-mono font-black text-xs tracking-widest px-2.5 py-1 rounded-xl border transition-colors ${themeClasses.status.info}`}>
                          {promo.code}
                        </span>
                      </td>
                      {/* Type */}
                      <td className={`px-5 py-4 flex items-center gap-1 font-semibold transition-colors ${themeClasses.text.secondary}`}>
                        {promo.discountType === 'PERCENTAGE' ? <Percent size={11} className="text-violet-500" /> : <DollarSign size={11} className="text-emerald-500" />}
                        {nice(promo.discountType)}
                      </td>
                      {/* Discount */}
                      <td className={`px-5 py-4 font-black transition-colors ${themeClasses.text.primary}`}>
                        {promo.discountType === 'PERCENTAGE'
                          ? `${promo.discountValue}%`
                          : money(promo.discountValue)
                        }
                      </td>
                      {/* Min Order */}
                      <td className={`px-5 py-4 font-semibold transition-colors ${themeClasses.text.secondary}`}>
                        {promo.minOrderAmount ? money(promo.minOrderAmount) : <span className={`transition-colors ${themeClasses.text.tertiary}`}>—</span>}
                      </td>
                      {/* Max Uses */}
                      <td className={`px-5 py-4 font-semibold transition-colors ${themeClasses.text.secondary}`}>
                        {promo.maxUses ?? <span className={`transition-colors ${themeClasses.text.tertiary}`}>∞</span>}
                      </td>
                      {/* Uses Left */}
                      <td className="px-5 py-4">
                        <span className={`font-bold transition-colors ${usesLeft === 0 ? 'text-red-500' : usesLeft <= 10 ? darkMode ? 'text-amber-400' : 'text-amber-600' : themeClasses.text.secondary}`}>
                          {promo.maxUses ? usesLeft : '∞'}
                        </span>
                      </td>
                      {/* Valid From */}
                      <td className={`px-5 py-4 font-semibold whitespace-nowrap transition-colors ${themeClasses.text.secondary}`}>
                        <span className="flex items-center gap-1"><Calendar size={10} />{date(promo.startDate)}</span>
                      </td>
                      {/* Valid Until */}
                      <td className={`px-5 py-4 font-semibold whitespace-nowrap transition-colors ${themeClasses.text.secondary}`}>
                        <span className="flex items-center gap-1"><Calendar size={10} />{date(promo.endDate)}</span>
                      </td>
                      {/* Seller */}
                      <td className="px-5 py-4">
                        {promo.sellerId
                          ? <span className={`font-semibold transition-colors ${themeClasses.text.secondary}`}>{promo.sellerName || `Seller #${promo.sellerId}`}</span>
                          : <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border transition-colors ${themeClasses.status.info}`}>Platform-wide</span>
                        }
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4"><StatusBadge promo={promo} themeClasses={themeClasses} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Create Promo Drawer ───────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" onClick={() => setShowCreate(false)} />
          <div className={`relative w-full max-w-lg h-full shadow-2xl flex flex-col z-50 border-l transition-all duration-300 transform translate-x-0 ${themeClasses.card} ${themeClasses.border.primary}`}>
            
            <div className={`flex items-center justify-between px-6 py-5 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className={`font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-colors ${themeClasses.text.primary}`}>
                <Tag size={16} className="text-emerald-600" />
                Create Platform Promo Code
              </h2>
              <button 
                onClick={() => setShowCreate(false)} 
                className={`p-2 rounded-xl border transition-colors ${themeClasses.text.tertiary} ${themeClasses.border.primary} hover:${themeClasses.bg.secondary} cursor-pointer`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Platform note */}
              <div className={`rounded-xl p-4 text-xs flex items-start gap-2.5 border transition-colors ${themeClasses.status.info}`}>
                <AlertCircle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Platform-wide Campaign:</span> This promo code will apply to all products and sellers, with no seller-specific restriction.
                </div>
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Promo Code *</label>
                <div className="relative">
                  <Hash size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
                  <input
                    value={form.code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="SUMMER2026"
                    maxLength={20}
                    className={`w-full pl-9 pr-4 py-2.5 text-xs font-mono font-black tracking-widest border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 uppercase transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                  />
                </div>
                <p className={`text-[9px] font-bold transition-colors ${themeClasses.text.tertiary}`}>Letters, numbers, hyphens and underscores only. Auto-capitalized.</p>
              </div>

              {/* Discount Type */}
              <div className="space-y-2">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Discount Type *</label>
                <div className="flex gap-6">
                  {[['PERCENTAGE', 'Percentage %'], ['FLAT', 'Flat Amount (NPR)']].map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="discountType" value={val} checked={form.discountType === val}
                        onChange={() => setForm(f => ({ ...f, discountType: val }))} className="accent-emerald-600" />
                      <span className={`text-xs font-semibold transition-colors ${themeClasses.text.secondary}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>
                  Discount Value * {form.discountType === 'PERCENTAGE' ? '(max 100%)' : '(NPR)'}
                </label>
                <input
                  type="number" min="0" max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 500'}
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                />
              </div>

              {/* Min Order + Max Uses */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Min Order (NPR)</label>
                  <input type="number" min="0" value={form.minOrderAmount}
                    onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                    placeholder="e.g. 1000"
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Max Total Uses</label>
                  <input type="number" min="1" value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Leave blank = ∞"
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
                </div>
              </div>

              {/* Per User Limit */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Per-User Limit</label>
                <input type="number" min="1" value={form.perUserLimit}
                  onChange={e => setForm(f => ({ ...f, perUserLimit: e.target.value }))}
                  placeholder="Times each user can use this code"
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Start Date *</label>
                  <input type="datetime-local" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>End Date *</label>
                  <input type="datetime-local" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
                </div>
              </div>

              {/* Applicable To */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Applicable To</label>
                <select
                  value={form.applicableTo}
                  onChange={e => setForm(f => ({ ...f, applicableTo: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                >
                  <option value="ALL">All Products</option>
                  <option value="SPECIFIC_CATEGORY">Specific Category</option>
                  <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                </select>
              </div>
            </div>

            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <button 
                onClick={() => setShowCreate(false)} 
                className={`px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.outline}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-colors ${themeClasses.button.primary}`}
              >
                {saving ? 'Creating...' : 'Create Promo Code'}
              </button>
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  );
}
