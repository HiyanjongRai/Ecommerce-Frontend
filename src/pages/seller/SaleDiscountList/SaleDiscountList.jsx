import React, { useEffect, useMemo, useState } from 'react';
import { getProductDetail, getSellerInventory, updateSellerProduct } from '../../../services/sellerApi';
import { formatMoney, normalizeList, resolveImageUrl, SectionHeader } from '../SectionUtils/SectionUtils';
import { useSellerTheme } from '../../../hooks/useSellerTheme';
import { 
  Tag, Layers, Percent, Search, RefreshCw, Trash2, Edit3, X, SlidersHorizontal, Package, ArrowUpRight
} from 'lucide-react';

const toNumber = (value) => Number(value || 0);

const initialEdit = {
  promotionMode: 'DISCOUNT',
  discountType: 'PERCENTAGE',
  discountValue: '',
  saleLabel: 'SALE',
  selectedVariantIds: [],
  variantValues: {},
};

const isDiscountDisplayMode = (saleLabel) => {
  const label = String(saleLabel || '').toUpperCase();
  return label.includes('DISCOUNT') || label.includes('OFF') || label.includes('%');
};

const calculateFinalPrice = (price, edit) => {
  const base = toNumber(price);
  const value = toNumber(edit.discountValue);
  if (base <= 0 || value <= 0) return base;
  if (edit.discountType === 'PERCENTAGE') return Math.max(0, base - (base * value) / 100);
  return Math.max(0, value);
};

const discountPercent = (price, finalPrice) => {
  const base = toNumber(price);
  const final = toNumber(finalPrice);
  if (base <= 0 || final >= base) return 0;
  return Math.round(((base - final) / base) * 100);
};

const variantName = (variant) => {
  if (variant?.variantLabel) return variant.variantLabel;
  const attrs = variant?.attributes || {};
  const attrText = Object.entries(attrs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  return attrText || variant?.sku || 'Variant';
};

const resolveVariantFinalPrice = (variant) => {
  const base = toNumber(variant?.price);
  if (variant?.salePrice) return toNumber(variant.salePrice);
  if (variant?.finalPrice) return toNumber(variant.finalPrice);
  if (variant?.discountPrice && base > toNumber(variant.discountPrice)) return base - toNumber(variant.discountPrice);
  if (variant?.salePercentage && base > 0) return base - (base * toNumber(variant.salePercentage)) / 100;
  return base;
};

const collectPromotions = (details) => {
  return details.flatMap((product) => {
    const productId = String(product.id || product.productId);
    const rows = [];
    if (product.onSale) {
      rows.push({
        id: `product-${productId}`,
        scope: 'PRODUCT',
        product,
        title: product.name,
        subtitle: product.category || 'Product-level promotion',
        selectedVariantIds: [],
        count: 0,
        mode: isDiscountDisplayMode(product.saleLabel) ? 'DISCOUNT' : 'SALE',
        type: product.salePercentage ? 'PERCENTAGE' : 'FIXED',
        value: product.salePercentage || product.salePrice || '',
        originalPrice: product.price,
        finalPrice: product.salePrice || (product.discountPrice ? toNumber(product.price) - toNumber(product.discountPrice) : product.price),
      });
    }

    const activeVariants = (product.variants || []).filter((variant) => variant.onSale);
    if (activeVariants.length) {
      const first = activeVariants[0];
      const variantPromotions = activeVariants.map((variant) => {
        const finalPrice = resolveVariantFinalPrice(variant);
        const pct = discountPercent(variant.price, finalPrice);
        return {
          id: String(variant.id),
          name: variantName(variant),
          originalPrice: variant.price,
          finalPrice,
          type: variant.salePercentage ? 'PERCENTAGE' : 'FIXED',
          value: variant.salePercentage || finalPrice,
          percent: pct,
        };
      });
      rows.push({
        id: `variant-${productId}`,
        scope: 'VARIANT',
        product,
        title: product.name,
        subtitle: `${activeVariants.length} variant${activeVariants.length === 1 ? '' : 's'} on promotion`,
        selectedVariantIds: activeVariants.map((variant) => String(variant.id)),
        count: activeVariants.length,
        variantPromotions,
        mode: first.salePercentage ? 'DISCOUNT' : 'SALE',
        type: first.salePercentage ? 'PERCENTAGE' : 'FIXED',
        value: first.salePercentage || resolveVariantFinalPrice(first) || '',
        originalPrice: first.price,
        finalPrice: resolveVariantFinalPrice(first),
      });
    }
    return rows;
  });
};

const ProductThumb = ({ product, isDark }) => {
  const src = resolveImageUrl(product.imagePaths?.[0] || product.mainImage);
  return (
    <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${
      isDark ? 'bg-[#111827] border-white/10' : 'bg-gray-50 border-gray-200 shadow-xs'
    }`}>
      {src ? <img src={src} alt={product.name} className="h-full w-full object-cover" /> : <svg className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
    </div>
  );
};

export default function SellerSaleDiscountList() {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [edit, setEdit] = useState(initialEdit);

  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('ALL'); // ALL, PRODUCT, VARIANT

  const load = async () => {
    setLoading(true);
    try {
      const inventory = normalizeList((await getSellerInventory()).data);
      const productDetails = await Promise.all(
        inventory.map(async (product) => {
          try {
            return (await getProductDetail(product.id || product.productId)).data;
          } catch {
            return product;
          }
        })
      );
      setDetails(productDetails);
    } catch (error) {
      setDetails([]);
      setMessage('Failed to load sale and discount list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rawRows = useMemo(() => collectPromotions(details), [details]);

  // Apply filters
  const rows = useMemo(() => {
    return rawRows.filter(row => {
      const matchesSearch = searchQuery.trim() === '' || 
        row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesScope = scopeFilter === 'ALL' || row.scope === scopeFilter;

      return matchesSearch && matchesScope;
    });
  }, [rawRows, searchQuery, scopeFilter]);

  // Telemetry metrics
  const metrics = useMemo(() => {
    const total = rawRows.length;
    const productCount = rawRows.filter(r => r.scope === 'PRODUCT').length;
    const variantCount = rawRows.filter(r => r.scope === 'VARIANT').length;
    
    // Calculate highest discount
    let highest = 0;
    rawRows.forEach(r => {
      if (r.scope === 'VARIANT') {
        (r.variantPromotions || []).forEach(vp => {
          if (vp.percent > highest) highest = vp.percent;
        });
      } else {
        const pct = discountPercent(r.originalPrice, r.finalPrice);
        if (pct > highest) highest = pct;
      }
    });

    return { total, productCount, variantCount, highest };
  }, [rawRows]);

  const startEdit = (row) => {
    const variantValues = row.scope === 'VARIANT'
      ? Object.fromEntries((row.variantPromotions || []).map((variant) => [variant.id, String(variant.value || '')]))
      : {};
    setEditingRow(row);
    setEdit({
      promotionMode: row.mode,
      discountType: row.type,
      discountValue: String(row.value || ''),
      saleLabel: row.mode === 'SALE' ? 'SALE' : 'SALE',
      selectedVariantIds: row.selectedVariantIds,
      variantValues,
    });
    setMessage('');
  };

  const saveEdit = async () => {
    if (!editingRow) return;
    if (editingRow.scope !== 'VARIANT') {
      if (!edit.discountValue || toNumber(edit.discountValue) <= 0) {
        setMessage('Enter a discount value or selling price greater than zero.');
        return;
      }
      if (edit.discountType === 'PERCENTAGE' && toNumber(edit.discountValue) >= 100) {
        setMessage('Percentage discount must be below 100%.');
        return;
      }
    }

    const productId = editingRow.product.id || editingRow.product.productId;
    const fd = new FormData();
    setSaving(true);
    setMessage('');
    try {
      if (editingRow.scope === 'VARIANT') {
        if (!edit.selectedVariantIds.length) {
          setMessage('Choose at least one variant for this promotion.');
          setSaving(false);
          return;
        }
        const selected = new Set(edit.selectedVariantIds.map(String));
        const selectedVariants = (editingRow.product.variants || []).filter((variant) => selected.has(String(variant.id)));
        const missingValue = selectedVariants.find((variant) => toNumber(edit.variantValues?.[String(variant.id)] || edit.discountValue) <= 0);
        if (missingValue) {
          setMessage('Enter a discount value or selling price for every selected variant.');
          setSaving(false);
          return;
        }
        if (edit.discountType === 'PERCENTAGE') {
          const invalidPercentage = selectedVariants.find((variant) => toNumber(edit.variantValues?.[String(variant.id)] || edit.discountValue) >= 100);
          if (invalidPercentage) {
            setMessage('Each variant percentage discount must be below 100%.');
            setSaving(false);
            return;
          }
        } else {
          const invalidFixed = selectedVariants.find((variant) => toNumber(edit.variantValues?.[String(variant.id)] || edit.discountValue) >= toNumber(variant.price));
          if (invalidFixed) {
            setMessage(`${variantName(invalidFixed)} selling price must be lower than ${formatMoney(invalidFixed.price)}.`);
            setSaving(false);
            return;
          }
        }
        fd.append('hasVariants', true);
        fd.append('variantsJson', JSON.stringify((editingRow.product.variants || []).map((variant) => {
          const basePrice = toNumber(variant.price);
          const existingPercentage = toNumber(variant.salePercentage);
          const existingFinalPrice = toNumber(variant.salePrice)
            || (toNumber(variant.discountPrice) > 0 ? basePrice - toNumber(variant.discountPrice) : 0);
          const base = {
            id: variant.id,
            sku: variant.sku || '',
            price: basePrice,
            stockQuantity: toNumber(variant.stockQuantity),
            attributes: variant.attributes || {},
            onSale: Boolean(variant.onSale),
            salePercentage: existingPercentage > 0 ? variant.salePercentage : null,
            discountPrice: existingPercentage > 0 ? null : (existingFinalPrice > 0 && existingFinalPrice < basePrice ? existingFinalPrice.toFixed(2) : null),
          };
          if (!selected.has(String(variant.id))) return base;
          const variantValue = edit.variantValues?.[String(variant.id)] || edit.discountValue;
          if (edit.discountType === 'PERCENTAGE') {
            return { ...base, onSale: true, salePercentage: variantValue, discountPrice: null };
          }
          return { ...base, onSale: true, salePercentage: null, discountPrice: toNumber(variantValue).toFixed(2) };
        })));
      } else {
        if (edit.discountType === 'FIXED' && toNumber(edit.discountValue) >= toNumber(editingRow.product.price)) {
          setMessage('Fixed selling price must be lower than the regular product price.');
          setSaving(false);
          return;
        }
        fd.append('onSale', true);
        fd.append('saleLabel', edit.promotionMode === 'DISCOUNT' ? 'DISCOUNT' : (edit.saleLabel || 'SALE'));
        if (edit.discountType === 'PERCENTAGE') {
          fd.append('salePercentage', edit.discountValue);
        } else {
          fd.append('discountPrice', calculateFinalPrice(editingRow.product.price, edit).toFixed(2));
        }
      }
      await updateSellerProduct(productId, fd);
      setMessage('Promotion updated successfully!');
      setEditingRow(null);
      setEdit(initialEdit);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to update promotion.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row) => {
    const productId = row.product.id || row.product.productId;
    const fd = new FormData();
    setSaving(true);
    setMessage('');
    try {
      if (row.scope === 'VARIANT') {
        const remove = new Set(row.selectedVariantIds.map(String));
        fd.append('hasVariants', true);
        fd.append('variantsJson', JSON.stringify((row.product.variants || []).map((variant) => {
          const basePrice = toNumber(variant.price);
          const existingPercentage = toNumber(variant.salePercentage);
          const existingFinalPrice = toNumber(variant.salePrice)
            || (toNumber(variant.discountPrice) > 0 ? basePrice - toNumber(variant.discountPrice) : 0);
          return {
            id: variant.id,
            sku: variant.sku || '',
            price: basePrice,
            stockQuantity: toNumber(variant.stockQuantity),
            attributes: variant.attributes || {},
            onSale: remove.has(String(variant.id)) ? false : Boolean(variant.onSale),
            salePercentage: remove.has(String(variant.id)) ? null : (existingPercentage > 0 ? variant.salePercentage : null),
            discountPrice: remove.has(String(variant.id)) ? null : (existingPercentage > 0 ? null : (existingFinalPrice > 0 && existingFinalPrice < basePrice ? existingFinalPrice.toFixed(2) : null)),
          };
        })));
      } else {
        fd.append('onSale', false);
      }
      await updateSellerProduct(productId, fd);
      setMessage('Promotion removed successfully.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to remove promotion.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
    isDark 
      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15' 
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
  }`;
  
  const labelCls = `block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`;
  
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
      <span className="text-xs font-bold uppercase tracking-wider">Loading sale and discount list...</span>
    </div>
  );

  return (
    <div className={`space-y-4 max-w-[1400px] animate-in fade-in-50 duration-200 font-sans ${themeClasses.bg.primary}`}>
      
      {/* ── Page Header Banner ── */}
      <SectionHeader
        title="Active Product Promotions"
        subtitle="Inspect and adjust active markdowns, store-wide sales, and variant price drops."
        tag="Marketing Tool"
        action={
          <button 
            type="button" 
            onClick={load} 
            className="bg-white hover:bg-gray-150 text-gray-900 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border border-gray-200 shadow-sm h-10 flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={`shrink-0 ${loading ? 'animate-spin' : ''}`} />
            Sync Records
          </button>
        }
      />

      {/* ── Status Message Alert Banner ── */}
      {message && (
        <div className={`p-4 border rounded-xl text-xs font-black flex items-center gap-3 tracking-wide uppercase animate-in fade-in duration-200 ${
          message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
            ? (isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-750')
            : (isDark ? 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]' : 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#152F17]')
        }`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message}
        </div>
      )}

      {/* ── Telemetry Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Promotions', value: metrics.total, icon: Tag, color: isDark ? 'text-[#2E5E2C] bg-[#16A34A]/100/10' : 'text-[#152F17] bg-[#16A34A]/10' },
          { label: 'Product Promotions', value: metrics.productCount, icon: Package, color: isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-700 bg-blue-50' },
          { label: 'Variant Promotions', value: metrics.variantCount, icon: Layers, color: isDark ? 'text-purple-400 bg-purple-500/10' : 'text-purple-700 bg-purple-50' },
          { label: 'Highest Discount', value: `${metrics.highest}% OFF`, icon: Percent, color: isDark ? 'text-amber-400 bg-amber-500/10' : 'text-amber-700 bg-amber-50' }
        ].map((card) => {
          const IconComp = card.icon;
          return (
            <div key={card.label} className={`border rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all hover:-translate-y-0.5 duration-300 ${
              isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-1">
                <h3 className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{card.label}</h3>
                <div className={`text-xl font-black leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</div>
              </div>
              <div className={`p-2.5 rounded-xl ${card.color}`}>
                <IconComp size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Edit Promotion Modal Panel (Drawer style) ── */}
      {editingRow && (
        <section className={`rounded-2xl border p-5 shadow-xl transition-all animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden ${
          isDark ? 'bg-[#0b0c10] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-200'
        }`}>
          {/* Subtle glow header */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-dashed border-gray-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                  editingRow.scope === 'VARIANT' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'
                }`}>
                  {editingRow.scope} PROMOTION
                </span>
                <span className={`text-[9px] font-bold font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{editingRow.id}</span>
              </div>
              <h2 className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingRow.title}</h2>
              <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{editingRow.subtitle}</p>
            </div>
            
            <button 
              type="button" 
              onClick={() => setEditingRow(null)} 
              className={`rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                isDark ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <X size={12} />
              Cancel
            </button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <label className="block relative">
              <span className={labelCls}>Badge Type</span>
              <select value={edit.promotionMode} onChange={(event) => setEdit((prev) => ({ ...prev, promotionMode: event.target.value }))} className={selectCls}>
                <option value="DISCOUNT">Discount Mode</option>
                <option value="SALE">Sale Mode</option>
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Calculation Rule</span>
              <select value={edit.discountType} onChange={(event) => setEdit((prev) => ({ ...prev, discountType: event.target.value }))} className={selectCls}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Price (Rs.)</option>
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>
                {editingRow.scope === 'VARIANT'
                  ? (edit.discountType === 'PERCENTAGE' ? 'Default Discount %' : 'Default Target Price')
                  : (edit.discountType === 'PERCENTAGE' ? 'Discount %' : 'Selling Price')}
              </span>
              <div className="relative">
                <input value={edit.discountValue} onChange={(event) => setEdit((prev) => ({ ...prev, discountValue: event.target.value }))} type="number" min="0" step="0.01" className={inputCls} placeholder="e.g. 15" />
                <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {edit.discountType === 'PERCENTAGE' ? '%' : 'Rs.'}
                </span>
              </div>
            </label>
            <button 
              type="button" 
              disabled={saving} 
              onClick={saveEdit} 
              className={`h-[42px] rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer ${
                isDark ? 'bg-[#16A34A] hover:bg-[#059669]' : 'bg-[#152F17] hover:bg-[#0D1E0F] shadow-md shadow-[#16A34A]/10'
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Saving...
                </>
              ) : (
                <>
                  <ArrowUpRight size={12} />
                  Publish Promotion
                </>
              )}
            </button>
          </div>

          {/* Variants Grid configuration list */}
          {editingRow.scope === 'VARIANT' && (
            <div className={`mt-5 pt-5 border-t border-dashed grid gap-3 md:grid-cols-2 ${isDark ? 'border-white/10' : 'border-gray-150'}`}>
              {(editingRow.product.variants || []).map((variant) => {
                const selected = edit.selectedVariantIds.includes(String(variant.id));
                const variantValue = edit.variantValues?.[String(variant.id)] || edit.discountValue;
                const finalPrice = calculateFinalPrice(variant.price, { ...edit, discountValue: variantValue });
                const pct = discountPercent(variant.price, finalPrice);
                return (
                  <div key={variant.id} className={`grid gap-3 rounded-xl border px-4 py-3 sm:grid-cols-[1fr_132px_auto] sm:items-center transition-all ${
                    selected 
                      ? (isDark ? 'border-[#16A34A]/30 bg-[#16A34A]/5 shadow-[0_2px_12px_rgba(16,185,129,0.04)]' : 'border-[#16A34A]/30 bg-[#16A34A]/10/40 shadow-xs') 
                      : (isDark ? 'border-white/5 bg-[#111827]/40' : 'border-gray-100 bg-gray-50/50')
                  }`}>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div className="relative flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => setEdit((prev) => ({
                            ...prev,
                            selectedVariantIds: selected
                              ? prev.selectedVariantIds.filter((id) => id !== String(variant.id))
                              : [...prev.selectedVariantIds, String(variant.id)],
                            variantValues: selected
                              ? prev.variantValues
                              : { ...(prev.variantValues || {}), [String(variant.id)]: prev.variantValues?.[String(variant.id)] || prev.discountValue || String(resolveVariantFinalPrice(variant)) },
                          }))}
                          className="peer sr-only"
                        />
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          selected 
                            ? 'bg-[#16A34A] border-[#16A34A] shadow-[0_2px_6px_rgba(16,185,129,0.2)]' 
                            : (isDark ? 'border-gray-750 bg-transparent' : 'border-gray-300 bg-white')
                        }`}>
                          {selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate text-xs font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{variantName(variant)}</p>
                        <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatMoney(variant.price)} · Stock: <span className="font-bold">{variant.stockQuantity}</span></p>
                      </div>
                    </label>
                    <label className="block">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-600' : 'text-gray-450'}`}>
                        {edit.discountType === 'PERCENTAGE' ? 'Discount %' : 'Selling Price'}
                      </span>
                      <div className="relative">
                        <input
                          value={variantValue}
                          onChange={(event) => setEdit((prev) => ({
                            ...prev,
                            variantValues: { ...(prev.variantValues || {}), [String(variant.id)]: event.target.value },
                          }))}
                          disabled={!selected}
                          type="number"
                          min="0"
                          step="0.01"
                          className={`mt-1 h-9 w-full rounded-lg border pl-3 pr-7 text-xs font-bold focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-[#0b0c10] border-white/10 text-white disabled:bg-[#111827] disabled:text-gray-700 disabled:border-transparent focus:border-[#16A34A]' 
                              : 'bg-white border-gray-200 text-[#222529] disabled:bg-gray-50/50 disabled:text-gray-300 focus:border-[#16A34A]'
                          }`}
                        />
                        <span className={`absolute right-2.5 top-[23px] text-[9px] font-black ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {edit.discountType === 'PERCENTAGE' ? '%' : 'Rs.'}
                        </span>
                      </div>
                    </label>
                    <div className="text-right">
                      <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected ? formatMoney(finalPrice) : formatMoney(variant.price)}</p>
                      {selected && pct > 0 ? <p className="text-[10px] font-black text-[#16A34A]">-{pct}% off</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Table Filters and Search Toolbar ── */}
      <div className={`border rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-colors ${
        isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Scope Segment Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Promotions' },
              { id: 'PRODUCT', label: 'Product Level' },
              { id: 'VARIANT', label: 'Variant Level' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setScopeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                  scopeFilter === tab.id 
                    ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white shadow-sm') 
                    : (isDark ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-550 hover:text-gray-900 hover:bg-gray-50')
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search product name or rule…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputCls} pl-9 pr-8 w-full md:w-64`}
            />
            <Search size={13} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                  isDark ? 'text-gray-500 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-950'
                }`}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Promotions Master Table ── */}
      <section className={`rounded-2xl border p-5 shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-colors ${
        isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
      }`}>
        {rows.length ? (
          <div className={`overflow-x-auto rounded-xl border custom-scrollbar ${
            isDark ? 'border-white/10 bg-[#0c0c0e]/20' : 'border-gray-150/80 bg-white'
          }`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[9px] font-black uppercase tracking-widest ${
                  isDark ? 'bg-[#111827] border-white/10 text-gray-400' : 'bg-gray-50/80 border-gray-100 text-gray-450'
                }`}>
                  <th className="px-5 py-3.5">Product & Promotion Details</th>
                  <th className="px-5 py-3.5">Scope</th>
                  <th className="px-5 py-3.5">Badge Badge</th>
                  <th className="px-5 py-3.5">Rule Applied</th>
                  <th className="px-5 py-3.5">Discount Pricing</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5 text-gray-300' : 'divide-gray-100 text-gray-700'} text-xs font-semibold`}>
                {rows.map((row) => (
                  <tr key={row.id} className={`transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50/60'}`}>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3.5">
                        <ProductThumb product={row.product} isDark={isDark} />
                        <div className="space-y-1">
                          <p className={`text-xs font-black transition-colors ${
                            isDark ? 'text-white group-hover:text-[#16A34A]' : 'text-gray-900 group-hover:text-[#152F17]'
                          }`}>{row.title}</p>
                          <p className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{row.subtitle}</p>
                          
                          {row.scope === 'VARIANT' && row.variantPromotions?.length ? (
                            <div className="mt-3 grid gap-1.5 max-w-lg">
                              {row.variantPromotions.map((variant) => (
                                <div key={variant.id} className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2 transition-colors ${
                                  isDark ? 'bg-[#111827] border-white/5 hover:border-white/10' : 'border-gray-100 bg-gray-50'
                                }`}>
                                  <span className={`text-[10px] font-black ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{variant.name}</span>
                                  <span className={`whitespace-nowrap text-[10px] font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatMoney(variant.finalPrice)}
                                    {Number(variant.originalPrice) > Number(variant.finalPrice) ? (
                                      <span className={`ml-2 font-bold line-through ${isDark ? 'text-gray-650' : 'text-gray-400'}`}>
                                        {formatMoney(variant.originalPrice)}
                                      </span>
                                    ) : null}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top pt-5">
                      <span className={`rounded-md px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border ${
                        row.scope === 'VARIANT' 
                          ? (isDark ? 'bg-purple-950/20 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-100')
                          : (isDark ? 'bg-blue-950/20 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-100')
                      }`}>
                        {row.scope === 'VARIANT' ? 'Variants' : 'Product'}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top pt-5">
                      {row.mode === 'DISCOUNT' ? (
                        <span className={`rounded-md px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border ${
                          isDark ? 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/25' : 'bg-[#16A34A]/10 text-[#152F17] border-emerald-150'
                        }`}>
                          DISCOUNT
                        </span>
                      ) : (
                        <span className={`rounded-md px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border ${
                          isDark ? 'bg-red-950/25 text-red-400 border-red-500/25 animate-pulse' : 'bg-red-50 text-red-600 border-red-150'
                        }`}>
                          SALE
                        </span>
                      )}
                    </td>
                    <td className={`px-5 py-4 align-top pt-5 text-xs font-black ${isDark ? 'text-gray-250' : 'text-gray-700'}`}>
                      {row.scope === 'VARIANT' && row.variantPromotions?.length ? (
                        <div className="grid gap-2">
                          {row.variantPromotions.map((variant) => (
                            <span key={variant.id} className="text-[10px] font-black text-gray-500 dark:text-gray-400">
                              {variant.type === 'PERCENTAGE' ? `${variant.value}% off` : `${formatMoney(variant.finalPrice)} sale`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        row.type === 'PERCENTAGE' ? `${row.value}% off` : `${formatMoney(row.finalPrice)} sale`
                      )}
                    </td>
                    <td className={`px-5 py-4 align-top pt-5 text-xs font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {row.scope === 'VARIANT' && row.variantPromotions?.length ? (
                        <div className="grid gap-2">
                          {row.variantPromotions.map((variant) => (
                            <span key={variant.id} className="whitespace-nowrap text-[10px] font-black block">
                              {formatMoney(variant.finalPrice)}
                              {Number(variant.originalPrice) > Number(variant.finalPrice) ? (
                                <span className={`ml-1.5 font-bold line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {formatMoney(variant.originalPrice)}
                                </span>
                              ) : null}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="whitespace-nowrap">
                          {formatMoney(row.finalPrice)}
                          {row.originalPrice && Number(row.originalPrice) > Number(row.finalPrice) ? (
                            <span className={`ml-2 text-[10px] font-bold line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                              {formatMoney(row.originalPrice)}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top pt-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          type="button" 
                          onClick={() => startEdit(row)} 
                          className={`rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer ${
                            isDark ? 'border-white/10 text-gray-400 hover:border-[#16A34A] hover:text-[#16A34A] hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:border-[#16A34A] hover:text-[#16A34A] hover:bg-gray-50'
                          }`}
                        >
                          <Edit3 size={11} />
                          Edit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { if (window.confirm('Remove this sale or discount?')) deleteRow(row); }} 
                          className={`rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer ${
                            isDark ? 'border-transparent text-gray-500 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400' : 'border-red-200 text-red-650 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 size={11} />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`rounded-xl border p-12 text-center transition-colors ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}>
            <Tag size={36} className={`mx-auto mb-3.5 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>No Active Promotions Found</h3>
            <p className={`text-[10px] font-semibold mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Create a product or variant markdown promotion, and it will be indexed in this list.</p>
          </div>
        )}
      </section>
    </div>
  );
}
