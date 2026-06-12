import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, RefreshCw, Tag, X, Calendar, Hash,
  Percent, DollarSign, AlertCircle
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

  /* ─────────────────────────────────────────────────────────── */
  return (
    <AdminLayout
      pageTitle="Promo Codes"
      pageSubtitle="Platform-wide coupon management"
      headerActions={
        <button
          onClick={() => { setForm(blankForm()); setShowCreate(true); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow ${themeClasses.button.primary}`}
        >
          <Plus size={14} /> Create Promo Code
        </button>
      }
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-sm font-bold px-4 py-3 rounded-xl shadow-xl backdrop-blur-md transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      {/* Refresh bar */}
      <div className={`px-6 py-3 border-b transition-colors ${themeClasses.card} flex justify-end`}>
        <button
          onClick={loadPromos}
          className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-colors ${themeClasses.button.outline}`}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className={`p-6 transition-colors ${themeClasses.bg.primary}`}>
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Code', 'Type', 'Discount', 'Min Order', 'Max Uses', 'Uses Left', 'Valid From', 'Valid Until', 'Seller', 'Status'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(10).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.secondary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : promos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16">
                      <div className={`flex flex-col items-center gap-2 transition-colors ${themeClasses.text.secondary}`}>
                        <Tag size={28} className={`transition-colors ${themeClasses.text.tertiary}`} />
                        <p className="font-medium">No promo codes found.</p>
                        <button
                          onClick={() => { setForm(blankForm()); setShowCreate(true); }}
                          className={`mt-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${themeClasses.button.primary}`}
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
                    <tr key={promoId} className={`border-b transition-colors ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`}>
                      {/* Code */}
                      <td className="px-4 py-3">
                        <span className={`font-mono font-black text-sm tracking-widest px-2 py-0.5 rounded-lg border transition-colors ${themeClasses.status.info}`}>
                          {promo.code}
                        </span>
                      </td>
                      {/* Type */}
                      <td className={`px-4 py-3 flex items-center gap-1 text-xs font-semibold transition-colors ${themeClasses.text.secondary}`}>
                        {promo.discountType === 'PERCENTAGE' ? <Percent size={11} className="text-violet-500" /> : <DollarSign size={11} className="text-emerald-500" />}
                        {nice(promo.discountType)}
                      </td>
                      {/* Discount */}
                      <td className={`px-4 py-3 font-bold text-sm transition-colors ${themeClasses.text.primary}`}>
                        {promo.discountType === 'PERCENTAGE'
                          ? `${promo.discountValue}%`
                          : money(promo.discountValue)
                        }
                      </td>
                      {/* Min Order */}
                      <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.secondary}`}>
                        {promo.minOrderAmount ? money(promo.minOrderAmount) : <span className={`transition-colors ${themeClasses.text.tertiary}`}>—</span>}
                      </td>
                      {/* Max Uses */}
                      <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.secondary}`}>
                        {promo.maxUses ?? <span className={`transition-colors ${themeClasses.text.tertiary}`}>∞</span>}
                      </td>
                      {/* Uses Left */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold transition-colors ${usesLeft === 0 ? 'text-red-500' : usesLeft <= 10 ? darkMode ? 'text-amber-400' : 'text-amber-600' : themeClasses.text.secondary}`}>
                          {promo.maxUses ? usesLeft : '∞'}
                        </span>
                      </td>
                      {/* Valid From */}
                      <td className={`px-4 py-3 text-xs whitespace-nowrap transition-colors ${themeClasses.text.secondary}`}>
                        <span className="flex items-center gap-1"><Calendar size={10} />{date(promo.startDate)}</span>
                      </td>
                      {/* Valid Until */}
                      <td className={`px-4 py-3 text-xs whitespace-nowrap transition-colors ${themeClasses.text.secondary}`}>
                        <span className="flex items-center gap-1"><Calendar size={10} />{date(promo.endDate)}</span>
                      </td>
                      {/* Seller */}
                      <td className="px-4 py-3">
                        {promo.sellerId
                          ? <span className={`text-xs transition-colors ${themeClasses.text.secondary}`}>{promo.sellerName || `Seller #${promo.sellerId}`}</span>
                          : <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border transition-colors ${themeClasses.status.info}`}>Platform-wide</span>
                        }
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3"><StatusBadge promo={promo} themeClasses={themeClasses} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Create Promo Modal ───────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className={`relative rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transition-colors ${themeClasses.card}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className={`font-black text-base flex items-center gap-2 transition-colors ${themeClasses.text.primary}`}>
                <Tag size={18} className="text-emerald-600" />
                Create Platform Promo Code
              </h2>
              <button onClick={() => setShowCreate(false)} className={`p-2 rounded-lg transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`}><X size={18} /></button>
            </div>
            <div className={`p-6 space-y-4 max-h-[70vh] overflow-y-auto transition-colors ${themeClasses.bg.primary}`}>

              {/* Platform note */}
              <div className={`rounded-xl p-3 text-xs flex items-start gap-2 border transition-colors ${themeClasses.status.info}`}>
                <AlertCircle size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                This promo will be <strong>platform-wide</strong> (no seller restriction). It applies to all products and sellers.
              </div>

              {/* Code */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Promo Code *</label>
                <div className="relative">
                  <Hash size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
                  <input
                    value={form.code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="SUMMER25"
                    maxLength={20}
                    className={`w-full pl-9 pr-4 py-2.5 text-sm font-mono font-bold tracking-widest border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 uppercase transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                  />
                </div>
                <p className={`text-[10px] mt-1 transition-colors ${themeClasses.text.tertiary}`}>Letters, numbers, hyphens and underscores only. Auto-capitalized.</p>
              </div>

              {/* Discount Type */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>Discount Type *</label>
                <div className="flex gap-4">
                  {[['PERCENTAGE', 'Percentage %'], ['FLAT', 'Flat Amount (NPR)']].map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="discountType" value={val} checked={form.discountType === val}
                        onChange={() => setForm(f => ({ ...f, discountType: val }))} className="accent-emerald-600" />
                      <span className={`text-sm font-semibold transition-colors ${themeClasses.text.secondary}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                  Discount Value * {form.discountType === 'PERCENTAGE' ? '(max 100%)' : '(NPR)'}
                </label>
                <input
                  type="number" min="0" max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 500'}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                />
              </div>

              {/* Min Order + Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Min Order (NPR)</label>
                  <input type="number" min="0" value={form.minOrderAmount}
                    onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                    placeholder="e.g. 1000"
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
                </div>
                <div>
                  <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Max Total Uses</label>
                  <input type="number" min="1" value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Leave blank = unlimited"
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
                </div>
              </div>

              {/* Per User Limit */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Per-User Limit</label>
                <input type="number" min="1" value={form.perUserLimit}
                  onChange={e => setForm(f => ({ ...f, perUserLimit: e.target.value }))}
                  placeholder="Times each user can use this code"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Start Date *</label>
                  <input type="datetime-local" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
                </div>
                <div>
                  <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>End Date *</label>
                  <input type="datetime-local" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
                </div>
              </div>

              {/* Applicable To */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>Applicable To</label>
                <select
                  value={form.applicableTo}
                  onChange={e => setForm(f => ({ ...f, applicableTo: e.target.value }))}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                >
                  <option value="ALL">All Products</option>
                  <option value="SPECIFIC_CATEGORY">Specific Category</option>
                  <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                </select>
              </div>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <button onClick={() => setShowCreate(false)} className={`px-4 py-2 border rounded-xl text-xs font-bold transition-colors ${themeClasses.button.outline}`}>Cancel</button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className={`px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors ${themeClasses.button.primary}`}
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
