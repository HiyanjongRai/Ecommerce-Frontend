import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle, DollarSign, Hash, Plus, RefreshCw, Tag, X } from 'lucide-react';
import AdminLayout from '../../../app/layouts/AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { createAdminPromo, getAdminPromos, getAdminSellers } from '../api/adminApi';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;
const date = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

const blankForm = () => ({
  code: '',
  description: '',
  bannerImage: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minOrderValue: '',
  usageLimit: '',
  perUserUsageLimit: '',
  startDate: '',
  endDate: '',
  sellerScope: 'GLOBAL',
  sellerId: '',
  homepageFeatured: false,
  homepageOrder: '',
});

const statusBadge = (promo, themeClasses) => {
  const now = Date.now();
  const start = promo.startDate ? new Date(promo.startDate).getTime() : 0;
  const end = promo.endDate ? new Date(promo.endDate).getTime() : Infinity;
  const usesLeft = promo.usageLimit ? Math.max(0, (promo.usageLimit || 0) - (promo.usedCount || 0)) : Infinity;

  if (now > end || usesLeft === 0) {
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${themeClasses.status.pending}`}>Expired</span>;
  }
  if (now < start) {
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${themeClasses.status.info}`}>Scheduled</span>;
  }
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${themeClasses.status.success}`}>Active</span>;
};

export default function AdminPromos() {
  const { themeClasses, darkMode } = useAdminTheme();
  const [promos, setPromos] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState(blankForm());

  const sellerMap = useMemo(() => {
    return new Map(sellers.map((seller) => [
      seller.id,
      seller.storeName || seller.fullName || seller.email || `Seller #${seller.id}`,
    ]));
  }, [sellers]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [promoRes, sellerRes] = await Promise.all([getAdminPromos(), getAdminSellers()]);
      setPromos(Array.isArray(promoRes.data) ? promoRes.data : []);
      setSellers(Array.isArray(sellerRes.data) ? sellerRes.data : []);
    } catch {
      setPromos([]);
      setSellers([]);
      showToast('❌ Failed to load promo data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.code.trim()) return showToast('❌ Promo code is required');
    if (!form.discountValue) return showToast('❌ Discount value is required');
    if (!form.startDate || !form.endDate) return showToast('❌ Start and end dates are required');
    if (form.sellerScope === 'SELLER' && !form.sellerId) return showToast('❌ Please select a seller');

    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        bannerImage: form.bannerImage || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 1,
        perUserUsageLimit: form.perUserUsageLimit ? Number(form.perUserUsageLimit) : 1,
        startDate: form.startDate,
        endDate: form.endDate,
        sellerId: form.sellerScope === 'SELLER' ? Number(form.sellerId) : null,
        homepageFeatured: Boolean(form.homepageFeatured),
        homepageOrder: form.homepageOrder === '' ? null : Number(form.homepageOrder),
      };

      await createAdminPromo(payload);
      await load();
      setShowCreate(false);
      setForm(blankForm());
      showToast(form.sellerScope === 'SELLER' ? '✅ Seller promo created' : '✅ Platform promo created');
    } catch (error) {
      showToast(error?.response?.data?.message || '❌ Failed to create promo code');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const now = Date.now();
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    promos.forEach((promo) => {
      const start = promo.startDate ? new Date(promo.startDate).getTime() : 0;
      const end = promo.endDate ? new Date(promo.endDate).getTime() : Infinity;
      const usesLeft = promo.usageLimit ? Math.max(0, (promo.usageLimit || 0) - (promo.usedCount || 0)) : Infinity;
      if (now > end || usesLeft === 0) expired += 1;
      else if (now < start) scheduled += 1;
      else active += 1;
    });
    return { total: promos.length, active, scheduled, expired };
  }, [promos]);

  return (
    <AdminLayout
      pageTitle="Promo Codes"
      pageSubtitle="Platform, seller, and homepage coupon management"
      headerActions={(
        <button
          onClick={() => { setForm(blankForm()); setShowCreate(true); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${themeClasses.button.primary}`}
        >
          <Plus size={14} /> Create Promo Code
        </button>
      )}
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-[20px] shadow-2xl border ${themeClasses.bg.secondary} ${themeClasses.border.accent} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Total', stats.total, <Tag size={15} />],
            ['Active', stats.active, <CheckCircle size={15} />],
            ['Scheduled', stats.scheduled, <Calendar size={15} />],
            ['Expired', stats.expired, <AlertCircle size={15} />],
          ].map(([label, value, icon]) => (
            <div key={label} className={`rounded-[20px] border p-5 ${themeClasses.card} ${themeClasses.border.primary}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>{label}</span>
                <div className="w-8.5 h-8.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                  {icon}
                </div>
              </div>
              <div className="mt-3">
                <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className={`rounded-[20px] border p-4 flex justify-end ${themeClasses.card} ${themeClasses.border.primary}`}>
          <button
            onClick={load}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${themeClasses.button.outline}`}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className={`rounded-[20px] border overflow-hidden ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className={themeClasses.bg.secondary}>
                <tr>
                  {['Code', 'Type', 'Discount', 'Seller', 'Homepage', 'Status'].map((label) => (
                    <th key={label} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center">Loading...</td></tr>
                ) : promos.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center">No promo codes yet.</td></tr>
                ) : promos.map((promo) => (
                  <tr key={promo.id} className={`border-t ${themeClasses.border.primary}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-black text-xs tracking-widest px-2.5 py-1 rounded-xl border">
                        {promo.code}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${themeClasses.text.secondary}`}>{promo.discountType?.replaceAll('_', ' ') || '—'}</td>
                    <td className={`px-4 py-3 font-black ${themeClasses.text.primary}`}>
                      {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : money(promo.discountValue)}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${themeClasses.text.secondary}`}>
                      {promo.sellerId ? (sellerMap.get(promo.sellerId) || `Seller #${promo.sellerId}`) : 'Platform-wide'}
                    </td>
                    <td className="px-4 py-3">
                      {promo.homepageFeatured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 border border-emerald-200">
                          Homepage {promo.homepageOrder != null ? `#${promo.homepageOrder}` : ''}
                        </span>
                      ) : (
                        <span className={`text-[11px] ${themeClasses.text.tertiary}`}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(promo, themeClasses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setShowCreate(false)} />
          <div className={`relative z-10 w-full max-w-lg h-full border-l shadow-2xl flex flex-col ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className={`flex items-center justify-between px-6 py-5 border-b ${themeClasses.border.primary}`}>
              <h2 className={`font-black text-sm uppercase tracking-wider flex items-center gap-2 ${themeClasses.text.primary}`}>
                <Tag size={16} className="text-emerald-600" />
                Create Promo Code
              </h2>
              <button onClick={() => setShowCreate(false)} className={`p-2 rounded-xl border ${themeClasses.border.primary}`}>
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className={`rounded-xl p-4 text-xs flex items-start gap-2.5 border ${themeClasses.status.info}`}>
                <AlertCircle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Homepage-ready promo:</span> feature the code on the storefront, or keep it platform-wide / seller-specific only.
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Code *</label>
                  <div className="relative">
                    <Hash size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${themeClasses.text.tertiary}`} />
                    <input
                      value={form.code}
                      onChange={(e) => setForm((current) => ({ ...current, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
                      placeholder="SUMMER2026"
                      className={`w-full pl-9 pr-4 py-2.5 text-xs font-mono font-black tracking-widest uppercase border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                    placeholder="Optional coupon description"
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Scope</label>
                  <select
                    value={form.sellerScope}
                    onChange={(e) => setForm((current) => ({ ...current, sellerScope: e.target.value, sellerId: e.target.value === 'GLOBAL' ? '' : current.sellerId }))}
                    className={`w-full px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                  >
                    <option value="GLOBAL">Platform-wide</option>
                    <option value="SELLER">Seller-specific</option>
                  </select>
                </div>

                {form.sellerScope === 'SELLER' && (
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Seller</label>
                    <select
                      value={form.sellerId}
                      onChange={(e) => setForm((current) => ({ ...current, sellerId: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    >
                      <option value="">Select seller</option>
                      {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>{sellerMap.get(seller.id)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={form.homepageFeatured}
                      onChange={(e) => setForm((current) => ({ ...current, homepageFeatured: e.target.checked }))}
                    />
                    Feature on homepage
                  </label>
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Homepage order</label>
                    <input
                      type="number"
                      min="0"
                      value={form.homepageOrder}
                      onChange={(e) => setForm((current) => ({ ...current, homepageOrder: e.target.value }))}
                      placeholder="Lower first"
                      className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Discount Type</label>
                  <div className="flex gap-6">
                    {[
                      ['PERCENTAGE', 'Percentage %'],
                      ['FLAT', 'Flat Amount'],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discountType"
                          value={value}
                          checked={form.discountType === value}
                          onChange={() => setForm((current) => ({ ...current, discountType: value }))}
                        />
                        <span className={`text-xs font-semibold ${themeClasses.text.secondary}`}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>
                    Discount Value {form.discountType === 'PERCENTAGE' ? '(max 100%)' : '(NPR)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm((current) => ({ ...current, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 500'}
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Min Order Value</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minOrderValue}
                      onChange={(e) => setForm((current) => ({ ...current, minOrderValue: e.target.value }))}
                      placeholder="e.g. 1000"
                      className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Total Uses</label>
                    <input
                      type="number"
                      min="1"
                      value={form.usageLimit}
                      onChange={(e) => setForm((current) => ({ ...current, usageLimit: e.target.value }))}
                      placeholder="Leave blank = unlimited"
                      className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Per-User Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={form.perUserUsageLimit}
                    onChange={(e) => setForm((current) => ({ ...current, perUserUsageLimit: e.target.value }))}
                    placeholder="Times each user can use this code"
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>Start Date *</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm((current) => ({ ...current, startDate: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>End Date *</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm((current) => ({ ...current, endDate: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <button onClick={() => setShowCreate(false)} className={`px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider ${themeClasses.button.outline}`}>
                Cancel
              </button>
              <button
                onClick={create}
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 ${themeClasses.button.primary}`}
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
