import React, { useEffect, useMemo, useState } from 'react';
import { getProductDetail, getSellerInventory, updateSellerProduct } from '../services/sellerService';
import { formatMoney, normalizeList, resolveImageUrl, SectionHeader } from './SellerSectionUtils';
import { useSellerTheme } from '../hooks/useSellerTheme';

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const initialRule = {
  scope: 'selected',
  promotionMode: 'DISCOUNT',
  discountType: 'PERCENTAGE',
  discountValue: '',
  saleEnabled: true,
  target: 'PRODUCT',
  selectedProductIds: [],
  selectedVariantIds: [],
  category: '',
  startDate: '',
  endDate: '',
  saleLabel: 'SALE',
};

const toNumber = (value) => Number(value || 0);

const calculatePrice = (price, rule) => {
  const base = toNumber(price);
  const value = toNumber(rule.discountValue);
  if (!rule.saleEnabled || value <= 0 || base <= 0) return base;
  if (rule.discountType === 'PERCENTAGE') {
    return Math.max(0, base - (base * value) / 100);
  }
  return Math.max(0, value);
};

const discountPercent = (price, finalPrice) => {
  const base = toNumber(price);
  const final = toNumber(finalPrice);
  if (base <= 0 || final >= base) return 0;
  return Math.round(((base - final) / base) * 100);
};

const variantFinalPrice = (variant, rule) => calculatePrice(variant?.price ?? 0, rule);

const isDiscountDisplayMode = (saleLabel) => {
  const label = String(saleLabel || '').toUpperCase();
  return label.includes('DISCOUNT') || label.includes('OFF') || label.includes('%');
};

const toLocalDateTimeValue = (value) => {
  if (!value) return '';
  return String(value).slice(0, 16);
};

const buildVariantJson = (variants, rule) => {
  const selected = new Set(rule.selectedVariantIds.map(String));
  return variants.map((variant) => {
    const shouldApply = rule.target === 'PRODUCT' || selected.has(String(variant.id));
    const basePrice = toNumber(variant.price);
    const existingPercentage = toNumber(variant.salePercentage);
    const existingFinalPrice = toNumber(variant.salePrice)
      || (toNumber(variant.discountPrice) > 0 ? basePrice - toNumber(variant.discountPrice) : 0);
    const next = {
      id: variant.id,
      sku: variant.sku || '',
      price: basePrice,
      stockQuantity: toNumber(variant.stockQuantity),
      attributes: variant.attributes || {},
      onSale: Boolean(variant.onSale),
      salePercentage: existingPercentage > 0 ? variant.salePercentage : null,
      discountPrice: existingPercentage > 0 ? null : (existingFinalPrice > 0 && existingFinalPrice < basePrice ? existingFinalPrice.toFixed(2) : null),
    };

    if (!shouldApply) return next;
    if (!rule.saleEnabled) {
      return { ...next, onSale: false, salePercentage: null, discountPrice: null };
    }
    if (rule.discountType === 'PERCENTAGE') {
      return { ...next, onSale: true, salePercentage: rule.discountValue, discountPrice: null };
    }
    return {
      ...next,
      onSale: true,
      salePercentage: null,
      discountPrice: calculatePrice(basePrice, rule).toFixed(2),
    };
  });
};

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
  green:    '#22C55E',
  greenDk:  '#16A34A',
  bg:       '#F9FAFB',
  card:     '#FFFFFF',
  text:     '#111827',
  sub:      '#6B7280',
  border:   '#E5E7EB',
  warn:     '#FB923C',
  yellow:   '#FACC15',
  info:     '#38BDF8',
  red:      '#EF4444',
};

// ─── Micro Components ─────────────────────────────────────────────────────────

const Pill = ({ color = '#6B7280', bg = '#F3F4F6', children }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border"
    style={{ color, background: bg, borderColor: color + '33' }}>
    {children}
  </span>
);

const StockBadge = ({ stock, hasVariants }) => {
  if (hasVariants) return <Pill color={T.info} bg="#F0F9FF">Variants</Pill>;
  const s = toNumber(stock);
  if (s <= 0) return <Pill color={T.red} bg="#FEF2F2">Out of Stock</Pill>;
  if (s <= 5)  return <Pill color={T.warn} bg="#FFF7ED">Low Stock</Pill>;
  return <Pill color={T.green} bg="#F0FDF4">In Stock</Pill>;
};

const SaleBadge = ({ product }) => {
  if (!product.onSale) return <Pill color={T.sub} bg="#F9FAFB">None</Pill>;
  if (isDiscountDisplayMode(product.saleLabel))
    return <Pill color="#111827" bg="#F3F4F6">DISCOUNT</Pill>;
  return <Pill color="#FFFFFF" bg="#EF4444">SALE</Pill>;
};

const ProductThumb = ({ product }) => {
  const src = resolveImageUrl(product.imagePaths?.[0] || product.mainImage);
  return (
    <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shadow-sm">
      {src
        ? <img src={src} alt={product.name} className="w-full h-full object-cover" />
        : <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
      }
    </div>
  );
};

// Badge preview chips
const BADGE_OPTIONS = [
  { label: 'SALE',          bg: '#EF4444', text: '#fff' },
  { label: 'HOT DEAL',      bg: '#FB923C', text: '#fff' },
  { label: 'LIMITED OFFER', bg: '#8B5CF6', text: '#fff' },
  { label: 'FLASH SALE',    bg: '#FACC15', text: '#111' },
  { label: 'BEST VALUE',    bg: '#22C55E', text: '#fff' },
];

// Live Preview Card
const PreviewCard = ({ product, variant, rule }) => {
  const name = variant
    ? `${product?.name || 'Product'} – ${variant.variantLabel || variant.sku}`
    : product?.name || 'Select a product';
  const basePrice = variant?.price ?? product?.price ?? 0;
  const finalPrice = calculatePrice(basePrice, rule);
  const pct = discountPercent(basePrice, finalPrice);
  const showSaleBadge    = rule.saleEnabled && rule.promotionMode === 'SALE';
  const showDiscountBadge= rule.saleEnabled && rule.promotionMode === 'DISCOUNT' && pct > 0;
  const badgeOpt = BADGE_OPTIONS.find(b => b.label === rule.saleLabel) || BADGE_OPTIONS[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-white">
      {/* Image placeholder */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b border-gray-100">
        {showSaleBadge && (
          <span className="absolute top-3 left-3 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest animate-pulse shadow-lg"
            style={{ background: badgeOpt.bg, color: badgeOpt.text }}>
            {rule.saleLabel || 'SALE'}
          </span>
        )}
        {showDiscountBadge && (
          <span className="absolute top-3 left-3 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest shadow-lg bg-gray-900 text-white">
            -{pct}% OFF
          </span>
        )}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-200">Live Preview</span>
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">
          {variant ? 'Variant' : product?.hasVariants ? 'Parent product' : 'Standard product'}
        </p>
        <h3 className="text-sm font-black text-gray-900 line-clamp-2 leading-snug mb-3">{name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-emerald-600">{formatMoney(finalPrice)}</span>
          {pct > 0 && (
            <span className="text-xs font-bold line-through text-gray-400">{formatMoney(basePrice)}</span>
          )}
          {pct > 0 && (
            <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
              Save {pct}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Step indicator
const Steps = ({ current }) => {
  const steps = [
    { n: 1, label: 'Select Products' },
    { n: 2, label: 'Configure Discount' },
    { n: 3, label: 'Review' },
    { n: 4, label: 'Save & Activate' },
  ];
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, idx) => {
        const done   = step.n < current;
        const active = step.n === current;
        return (
          <React.Fragment key={step.n}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
                done   ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.35)]'
                : active ? 'bg-white border-emerald-500 text-emerald-600 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]'
                : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {done
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  : step.n
                }
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                active ? 'text-emerald-600' : done ? 'text-emerald-500' : 'text-gray-400'
              }`}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 rounded-full transition-all duration-500 ${
                done ? 'bg-emerald-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SellerDiscountSales() {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  // ── All existing state (preserved verbatim) ──
  const [products,    setProducts]    = useState([]);
  const [fullProduct, setFullProduct] = useState(null);
  const [rule,        setRule]        = useState(initialRule);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [message,     setMessage]     = useState('');
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [catFilter,   setCatFilter]   = useState('ALL');

  // Step + UI state
  const [step,          setStep]          = useState(1);
  const [errors,        setErrors]        = useState({});
  const [successMsg,    setSuccessMsg]    = useState('');

  // ── Data loading (preserved verbatim) ──
  const load = async () => {
    setLoading(true);
    try {
      const res = await getSellerInventory();
      const list = normalizeList(res.data);
      setProducts(list);
    } catch {
      setProducts([]);
      setMessage('Failed to load inventory products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived (preserved verbatim) ──
  const categories = useMemo(
    () => [...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchSearch  = !search || (product.name || '').toLowerCase().includes(search.toLowerCase());
      const matchType    = typeFilter === 'ALL' || (typeFilter === 'VARIANT' ? product.hasVariants : !product.hasVariants);
      const stock        = toNumber(product.stockQuantity);
      const matchStock   = stockFilter === 'ALL'
        || (stockFilter === 'OUT'  ? stock <= 0 : stock > 0 && stock <= 5);
      const matchCat     = catFilter === 'ALL' || product.category === catFilter;
      return matchSearch && matchType && matchStock && matchCat;
    });
  }, [products, search, typeFilter, stockFilter, catFilter]);

  const targetProducts = useMemo(() => {
    if (rule.scope === 'category') {
      return products.filter(p => p.category === rule.category);
    }
    const selected = new Set(rule.selectedProductIds.map(String));
    return products.filter(p => selected.has(String(p.id || p.productId)));
  }, [products, rule.category, rule.scope, rule.selectedProductIds]);

  const previewProduct = fullProduct || targetProducts[0] || filteredProducts[0];
  const previewVariant = rule.target === 'VARIANT'
    ? (fullProduct?.variants || []).find(v => rule.selectedVariantIds.includes(String(v.id))) || fullProduct?.variants?.[0]
    : null;

  // ── All action handlers (preserved verbatim) ──
  const toggleProduct = async (product) => {
    const productId = String(product.id || product.productId);
    setRule(prev => {
      const exists = prev.selectedProductIds.includes(productId);
      return {
        ...prev,
        selectedProductIds: exists
          ? prev.selectedProductIds.filter(id => id !== productId)
          : [...prev.selectedProductIds, productId],
      };
    });
    if (!fullProduct || String(fullProduct.productId || fullProduct.id) !== productId) {
      try {
        const res = await getProductDetail(product.id || product.productId);
        setFullProduct(res.data);
        if (res.data?.hasVariants && rule.target === 'VARIANT') {
          setRule(prev => ({
            ...prev,
            selectedVariantIds: (res.data.variants || []).map(v => String(v.id)),
          }));
        }
      } catch {
        setFullProduct(null);
      }
    }
  };

  const toggleVariant = (variantId) => {
    const id = String(variantId);
    setRule(prev => ({
      ...prev,
      selectedVariantIds: prev.selectedVariantIds.includes(id)
        ? prev.selectedVariantIds.filter(v => v !== id)
        : [...prev.selectedVariantIds, id],
    }));
  };

  const updateRule = (key, value) => {
    setErrors(prev => ({ ...prev, [key]: '' }));
    setRule(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'target' && value === 'VARIANT' && fullProduct?.hasVariants) {
        next.scope = 'selected';
        next.selectedProductIds = [String(fullProduct.productId || fullProduct.id)];
        next.selectedVariantIds = (fullProduct.variants || []).map(v => String(v.id));
      }
      if (key === 'target' && value === 'PRODUCT') {
        next.selectedVariantIds = [];
      }
      return next;
    });
  };

  const selectAllVariants = () =>
    setRule(prev => ({
      ...prev,
      selectedVariantIds: (fullProduct?.variants || []).map(v => String(v.id)),
    }));

  const clearVariants = () =>
    setRule(prev => ({ ...prev, selectedVariantIds: [] }));

  const selectAll = () =>
    setRule(prev => ({
      ...prev,
      selectedProductIds: filteredProducts.map(p => String(p.id || p.productId)),
    }));

  const clearSelection = () =>
    setRule(prev => ({ ...prev, selectedProductIds: [] }));

  const editPromotion = async (product) => {
    const productId = String(product.id || product.productId);
    setMessage('');
    setErrors({});
    try {
      const res = await getProductDetail(product.id || product.productId);
      const detail = res.data;
      const basePrice    = toNumber(detail.price || product.price);
      const finalPrice   = toNumber(detail.salePrice || (detail.discountPrice ? basePrice - toNumber(detail.discountPrice) : 0));
      const hasPercentage= toNumber(detail.salePercentage) > 0;
      const fixedAmount  = finalPrice > 0 && basePrice > finalPrice ? finalPrice.toFixed(2) : '';
      const nextRule = {
        ...initialRule,
        scope:              'selected',
        promotionMode:      isDiscountDisplayMode(detail.saleLabel) ? 'DISCOUNT' : 'SALE',
        discountType:       hasPercentage ? 'PERCENTAGE' : 'FIXED',
        discountValue:      hasPercentage ? String(detail.salePercentage) : fixedAmount,
        saleEnabled:        Boolean(detail.onSale),
        target:             'PRODUCT',
        selectedProductIds: [productId],
        selectedVariantIds: [],
        category:           detail.category || product.category || '',
        startDate:          toLocalDateTimeValue(detail.saleStartTime),
        endDate:            toLocalDateTimeValue(detail.saleEndTime),
        saleLabel:          isDiscountDisplayMode(detail.saleLabel) ? 'SALE' : (detail.saleLabel || 'SALE'),
      };
      setFullProduct(detail);
      setRule(nextRule);
      setStep(2);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load product promotion for editing.');
    }
  };

  const resetRule = () => {
    setRule(initialRule);
    setFullProduct(null);
    setMessage('');
    setErrors({});
    setSuccessMsg('');
    setStep(1);
  };

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!targetProducts.length) e.products = 'Select at least one product before applying.';
    if (rule.saleEnabled) {
      if (!rule.discountValue || toNumber(rule.discountValue) <= 0)
        e.discountValue = 'Enter a discount value greater than zero.';
      if (rule.discountType === 'PERCENTAGE' && toNumber(rule.discountValue) >= 100)
        e.discountValue = 'Percentage discount must be between 1 and 99.';
    }
    if (rule.endDate && rule.startDate && rule.endDate < rule.startDate)
      e.endDate = 'End date must be after the start date.';
    if (rule.target === 'VARIANT') {
      if (targetProducts.length !== 1) e.products = 'Variant rules apply to one product at a time.';
      if (!rule.selectedVariantIds.length) e.variants = 'Choose at least one variant.';
    }
    if (rule.discountType === 'FIXED') {
      const selectedVariants = rule.target === 'VARIANT'
        ? (fullProduct?.variants || []).filter(v => rule.selectedVariantIds.includes(String(v.id)))
        : [];
      if (selectedVariants.find(v => toNumber(rule.discountValue) >= toNumber(v.price)))
        e.discountValue = 'Fixed price must be lower than every selected variant price.';
      if (rule.target !== 'VARIANT' && targetProducts.find(p => toNumber(rule.discountValue) >= toNumber(p.price)))
        e.discountValue = 'Fixed price must be lower than the product price.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Apply rule (preserved verbatim) ──
  const applyRule = async () => {
    if (!validate()) return;
    const targets = targetProducts;
    setSaving(true);
    setMessage('');
    try {
      for (const product of targets) {
        const productId = product.id || product.productId;
        const detail = String(fullProduct?.productId || fullProduct?.id) === String(productId)
          ? fullProduct
          : (await getProductDetail(productId)).data;
        const fd = new FormData();

        if (!rule.saleEnabled) {
          fd.append('hasVariants', Boolean(detail.hasVariants));
          if (rule.target === 'VARIANT' && detail.hasVariants) {
            fd.append('variantsJson', JSON.stringify(buildVariantJson(detail.variants || [], rule)));
          } else {
            fd.append('onSale', false);
          }
        } else if (rule.target === 'VARIANT' && detail.hasVariants) {
          fd.append('hasVariants', true);
          fd.append('variantsJson', JSON.stringify(buildVariantJson(detail.variants || [], rule)));
        } else if (rule.discountType === 'PERCENTAGE') {
          fd.append('onSale', true);
          fd.append('saleLabel', rule.promotionMode === 'DISCOUNT' ? 'DISCOUNT' : (rule.saleLabel || 'SALE'));
          if (rule.startDate) fd.append('saleStartTime', rule.startDate);
          if (rule.endDate)   fd.append('saleEndTime',   rule.endDate);
          fd.append('salePercentage', rule.discountValue);
        } else {
          fd.append('onSale', true);
          fd.append('saleLabel', rule.promotionMode === 'DISCOUNT' ? 'DISCOUNT' : (rule.saleLabel || 'SALE'));
          if (rule.startDate) fd.append('saleStartTime', rule.startDate);
          if (rule.endDate)   fd.append('saleEndTime',   rule.endDate);
          fd.append('discountPrice', calculatePrice(detail.price, rule).toFixed(2));
        }

        await updateSellerProduct(productId, fd);
      }

      setSuccessMsg(`✓ Promotion applied to ${targets.length} product${targets.length === 1 ? '' : 's'} successfully.`);
      setStep(4);
      await load();
      if (previewProduct?.id || previewProduct?.productId) {
        const res = await getProductDetail(previewProduct.id || previewProduct.productId);
        setFullProduct(res.data);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to apply promotion rule.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Computed for summary ───
  const duration = useMemo(() => {
    if (!rule.startDate || !rule.endDate) return null;
    const diff = Math.ceil((new Date(rule.endDate) - new Date(rule.startDate)) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days` : null;
  }, [rule.startDate, rule.endDate]);

  // ─── Style helpers ────────────────────────────────────────────────────────────

  const cardCls = `bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,.05)] p-6`;
  const darkCard = isDark ? 'bg-[#0b0c10] border-white/10' : '';

  const inputCls = `w-full border rounded-xl px-4 py-2.5 text-[13px] font-medium focus:outline-none transition-all ${
    isDark
      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
      : 'bg-white border-[#E5E7EB] text-[#111827] placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
  }`;

  const selectCls = `w-full border rounded-xl px-4 py-2.5 text-[13px] font-medium focus:outline-none transition-all appearance-none cursor-pointer ${
    isDark
      ? 'bg-[#111827] border-white/10 text-white focus:border-emerald-500'
      : 'bg-white border-[#E5E7EB] text-[#111827] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
  }`;

  const labelCls = `block text-[11px] font-black uppercase tracking-[0.08em] mb-1.5 ${isDark ? 'text-gray-400' : 'text-[#6B7280]'}`;
  const helperCls = `text-[11px] mt-1 ${isDark ? 'text-gray-600' : 'text-[#9CA3AF]'}`;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
      <div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
      <span className="text-xs font-bold uppercase tracking-wider">Loading inventory...</span>
    </div>
  );

  return (
    <div className={`max-w-[1400px] animate-in fade-in-50 duration-200 font-sans pb-10 ${isDark ? themeClasses.bg.primary : 'bg-[#F9FAFB]'}`}>

      {/* ── Page Header Banner ── */}
      <SectionHeader
        title="Promotion Manager"
        subtitle="Create and manage product promotions to increase conversions and drive more sales."
        tag="Marketing Tools"
        action={
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={resetRule}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm h-10 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              New Promotion
            </button>
            <button
              type="button"
              onClick={applyRule}
              disabled={saving}
              className="bg-white hover:bg-gray-150 text-gray-900 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-gray-200 shadow-sm h-10 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        }
      />

      {/* ── Global messages ── */}
      {message && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-[12px] font-semibold"
          style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          {message}
        </div>
      )}
      {successMsg && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-[12px] font-semibold"
          style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {successMsg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP INDICATOR
      ══════════════════════════════════════════════════════════ */}
      <div className={`${cardCls} ${darkCard} mb-6`}>
        <Steps current={step} />
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT GRID
      ══════════════════════════════════════════════════════════ */}
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">

          {/* ────────────────────────────────────────────────────
              STEP 1: SELECT PRODUCTS
          ──────────────────────────────────────────────────── */}
          <div className={`${cardCls} ${darkCard}`}>
            {/* Card header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
                  style={{ background: T.green }}>1</div>
                <div>
                  <h2 className="text-[16px] font-bold" style={{ color: isDark ? '#fff' : T.text }}>Select Products</h2>
                  <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>
                    Choose one or more products to include in this promotion.
                  </p>
                </div>
              </div>
              {rule.selectedProductIds.length > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black text-white shrink-0"
                  style={{ background: T.green }}>
                  {rule.selectedProductIds.length} selected
                </span>
              )}
            </div>

            {/* Scope + Category + Target selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 p-4 rounded-2xl border"
              style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB', borderColor: isDark ? 'rgba(255,255,255,0.06)' : T.border }}>
              <div className="relative">
                <label className={labelCls}>Apply Scope</label>
                <select value={rule.scope} onChange={e => updateRule('scope', e.target.value)} className={selectCls}>
                  <option value="selected">Selected products</option>
                  <option value="category">By category</option>
                </select>
                <svg className="absolute right-3 bottom-[11px] w-3.5 h-3.5 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
              <div className="relative">
                <label className={labelCls}>Category</label>
                <select value={rule.category} onChange={e => updateRule('category', e.target.value)} disabled={rule.scope !== 'category'} className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}>
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className="absolute right-3 bottom-[11px] w-3.5 h-3.5 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
              <div className="relative">
                <label className={labelCls}>Target</label>
                <select value={rule.target} onChange={e => updateRule('target', e.target.value)} className={selectCls}>
                  <option value="PRODUCT">Product price / variants</option>
                  <option value="VARIANT">Specific variant prices</option>
                </select>
                <svg className="absolute right-3 bottom-[11px] w-3.5 h-3.5 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-2xl border"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : T.border, background: isDark ? 'rgba(255,255,255,0.02)' : '#fff' }}>
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className={`${inputCls} pl-9 py-2`}
                />
              </div>
              {/* Category filter */}
              <div className="relative shrink-0">
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className={`${selectCls} py-2 pl-3 pr-8 text-[12px] min-w-[130px]`}>
                  <option value="ALL">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
              {/* Type filter */}
              <div className="relative shrink-0">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className={`${selectCls} py-2 pl-3 pr-8 text-[12px] min-w-[120px]`}>
                  <option value="ALL">All Types</option>
                  <option value="VARIANT">Variant</option>
                  <option value="NON_VARIANT">Standard</option>
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
              {/* Stock filter */}
              <div className="relative shrink-0">
                <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
                  className={`${selectCls} py-2 pl-3 pr-8 text-[12px] min-w-[120px]`}>
                  <option value="ALL">All Stock</option>
                  <option value="LOW">Low Stock</option>
                  <option value="OUT">Out of Stock</option>
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
              {/* Reset */}
              {(search || typeFilter !== 'ALL' || stockFilter !== 'ALL' || catFilter !== 'ALL') && (
                <button type="button"
                  onClick={() => { setSearch(''); setTypeFilter('ALL'); setStockFilter('ALL'); setCatFilter('ALL'); }}
                  className="text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border transition-colors cursor-pointer"
                  style={{ borderColor: T.border, color: T.sub, background: isDark ? 'transparent' : '#fff' }}>
                  Reset
                </button>
              )}
            </div>

            {/* Bulk selection controls */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.sub }}>
                {filteredProducts.length} products
              </span>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button type="button" onClick={selectAll}
                className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-colors cursor-pointer"
                style={{ borderColor: T.green + '40', color: T.greenDk, background: '#F0FDF4' }}>
                Select All
              </button>
              <button type="button" onClick={clearSelection}
                className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-colors cursor-pointer"
                style={{ borderColor: T.border, color: T.sub, background: isDark ? 'transparent' : '#fff' }}>
                Clear
              </button>
            </div>

            {errors.products && (
              <p className="mb-3 text-[11px] font-semibold flex items-center gap-1.5" style={{ color: T.red }}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/>
                </svg>
                {errors.products}
              </p>
            )}

            {/* Product table */}
            {filteredProducts.length ? (
              <div className="rounded-2xl border overflow-hidden"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : T.border }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className={`sticky top-0 z-10 border-b`}
                      style={{ background: isDark ? '#111827' : '#F9FAFB', borderColor: isDark ? 'rgba(255,255,255,0.06)' : T.border }}>
                      <tr>
                        <th className="pl-4 pr-2 py-3 w-10">
                          <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer"
                            style={{ borderColor: T.border, background: '#fff' }}
                            onClick={() => rule.selectedProductIds.length === filteredProducts.length ? clearSelection() : selectAll()}>
                            {rule.selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 && (
                              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            )}
                          </div>
                        </th>
                        {['Product','Category','Stock','Price','Offer','Actions'].map(h => (
                          <th key={h} className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em]"
                            style={{ color: T.sub }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product, idx) => {
                        const id      = String(product.id || product.productId);
                        const checked = rule.selectedProductIds.includes(id);
                        return (
                          <tr key={id}
                            className="transition-all duration-150 border-b last:border-b-0"
                            style={{
                              background: checked
                                ? '#F0FDF4'
                                : isDark ? (idx % 2 === 0 ? '#0b0c10' : '#111827') : (idx % 2 === 0 ? '#fff' : '#FAFAFA'),
                              borderColor: checked ? '#BBF7D0' : (isDark ? 'rgba(255,255,255,0.04)' : T.border),
                              borderLeft: checked ? `3px solid ${T.green}` : '3px solid transparent',
                            }}>
                            {/* Checkbox */}
                            <td className="pl-3 pr-2 py-4">
                              <label className="relative flex cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={() => toggleProduct(product)} className="sr-only peer" />
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                  checked ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]' : 'border-gray-300 bg-white hover:border-gray-400'
                                }`}>
                                  {checked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                                </div>
                              </label>
                            </td>
                            {/* Product */}
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <ProductThumb product={product} />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-bold max-w-[180px]"
                                    style={{ color: isDark ? '#fff' : T.text }}>
                                    {product.name}
                                  </p>
                                  <p className="text-[11px] mt-0.5 truncate max-w-[180px]"
                                    style={{ color: T.sub }}>
                                    SKU: {product.sku || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {/* Category */}
                            <td className="px-3 py-4">
                              <span className="text-[12px] font-medium" style={{ color: T.sub }}>
                                {product.category || '—'}
                              </span>
                            </td>
                            {/* Stock */}
                            <td className="px-3 py-4">
                              <StockBadge stock={product.stockQuantity} hasVariants={product.hasVariants} />
                            </td>
                            {/* Price */}
                            <td className="px-3 py-4">
                              <span className="text-[13px] font-black" style={{ color: isDark ? '#fff' : T.text }}>
                                {formatMoney(product.price)}
                              </span>
                            </td>
                            {/* Offer */}
                            <td className="px-3 py-4">
                              <SaleBadge product={product} />
                            </td>
                            {/* Actions */}
                            <td className="px-3 py-4">
                              <button
                                type="button"
                                onClick={() => editPromotion(product)}
                                className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm"
                                style={{
                                  borderColor: T.border,
                                  color: isDark ? '#9CA3AF' : T.sub,
                                  background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = T.green; e.currentTarget.style.color = T.greenDk; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = isDark ? '#9CA3AF' : T.sub; }}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border p-12 text-center"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : T.border, background: isDark ? '#111827' : '#fff' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#F9FAFB', border: `1px solid ${T.border}` }}>
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <p className="text-[13px] font-bold" style={{ color: T.text }}>No products found</p>
                <p className="text-[12px] mt-1" style={{ color: T.sub }}>Try changing the search or filters.</p>
              </div>
            )}

            {/* Continue button */}
            {rule.selectedProductIds.length > 0 && step === 1 && (
              <div className="mt-5 flex justify-end">
                <button type="button" onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-[0_4px_12px_rgba(34,197,94,0.25)]"
                  style={{ background: T.green }}>
                  Continue to Configure
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ────────────────────────────────────────────────────
              STEP 2: CONFIGURE DISCOUNT
          ──────────────────────────────────────────────────── */}
          <div className={`${cardCls} ${darkCard} ${step < 2 ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                style={{ background: step >= 2 ? T.green : T.border, color: step >= 2 ? '#fff' : T.sub }}>
                2
              </div>
              <div>
                <h2 className="text-[16px] font-bold" style={{ color: isDark ? '#fff' : T.text }}>Configure Discount</h2>
                <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>
                  Set discount values, promotion type, duration, and visibility.
                </p>
              </div>
            </div>

            {/* Rule active toggle */}
            <div className="mb-5 flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all"
              style={{
                background: rule.saleEnabled ? '#F0FDF4' : (isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB'),
                borderColor: rule.saleEnabled ? '#BBF7D0' : (isDark ? 'rgba(255,255,255,0.06)' : T.border),
              }}
              onClick={() => updateRule('saleEnabled', !rule.saleEnabled)}>
              <div>
                <p className="text-[13px] font-bold" style={{ color: isDark ? '#fff' : T.text }}>
                  {rule.saleEnabled ? '🟢 Promotion Active' : '⚪ Promotion Disabled'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: T.sub }}>
                  {rule.saleEnabled ? 'Discount is visible to customers' : 'Discount is hidden — no effect on prices'}
                </p>
              </div>
              <div className="relative shrink-0">
                <div className={`w-12 h-6 rounded-full transition-all duration-300 ${rule.saleEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${rule.saleEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: Discount type + value */}
              <div className="space-y-4">
                {/* Promotion mode */}
                <div>
                  <label className={labelCls}>Badge Displayed on Product Card</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { value: 'DISCOUNT', label: '% Discount Badge', desc: 'Shows –X% OFF on card' },
                      { value: 'SALE',     label: 'Sale Badge',        desc: 'Shows custom SALE label' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => updateRule('promotionMode', opt.value)}
                        className="h-[64px] rounded-xl border-2 text-left px-4 transition-all cursor-pointer"
                        style={{
                          borderColor: rule.promotionMode === opt.value ? T.green : (isDark ? 'rgba(255,255,255,0.08)' : T.border),
                          background: rule.promotionMode === opt.value ? '#F0FDF4' : (isDark ? 'rgba(255,255,255,0.02)' : '#fff'),
                        }}>
                        <p className="text-[12px] font-black" style={{ color: rule.promotionMode === opt.value ? T.greenDk : (isDark ? '#fff' : T.text) }}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: T.sub }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount type */}
                <div className="relative">
                  <label className={labelCls}>Discount Type</label>
                  <select value={rule.discountType} onChange={e => updateRule('discountType', e.target.value)} className={selectCls}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed selling price (Rs.)</option>
                  </select>
                  <svg className="absolute right-3 bottom-[11px] w-3.5 h-3.5 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </div>

                {/* Discount value – HERO FIELD */}
                <div>
                  <label className={labelCls}>
                    {rule.discountType === 'PERCENTAGE' ? 'Discount Percentage' : 'Fixed Selling Price (Rs.)'}
                  </label>
                  <div className="relative">
                    <input
                      value={rule.discountValue}
                      onChange={e => updateRule('discountValue', e.target.value)}
                      type="number" min="0" step="0.01"
                      placeholder={rule.discountType === 'PERCENTAGE' ? '20' : '999'}
                      className={`w-full border-2 rounded-xl px-5 text-[28px] font-black focus:outline-none transition-all ${
                        errors.discountValue ? 'border-red-400' : ''
                      }`}
                      style={{
                        height: '64px',
                        color: isDark ? '#fff' : T.text,
                        background: isDark ? '#111827' : '#fff',
                        borderColor: errors.discountValue ? T.red : (rule.discountValue ? T.green : (isDark ? 'rgba(255,255,255,0.10)' : T.border)),
                        boxShadow: rule.discountValue && !errors.discountValue
                          ? '0 0 0 3px rgba(34,197,94,0.12)'
                          : errors.discountValue ? '0 0 0 3px rgba(239,68,68,0.12)' : 'none',
                      }}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[22px] font-black pointer-events-none"
                      style={{ color: T.sub }}>
                      {rule.discountType === 'PERCENTAGE' ? '%' : 'Rs'}
                    </span>
                  </div>
                  {errors.discountValue ? (
                    <p className="mt-1.5 text-[11px] font-semibold" style={{ color: T.red }}>{errors.discountValue}</p>
                  ) : (
                    <p className={helperCls}>
                      {rule.discountType === 'PERCENTAGE'
                        ? '20 means customers receive 20% off the original price.'
                        : 'This becomes the final selling price shown to customers.'}
                    </p>
                  )}
                </div>

                {/* Sale label */}
                {rule.promotionMode === 'SALE' && (
                  <div>
                    <label className={labelCls}>Custom Sale Label</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {['SALE', 'HOT DEAL', 'FLASH SALE'].map(l => (
                        <button key={l} type="button" onClick={() => updateRule('saleLabel', l)}
                          className="py-2 rounded-xl border text-[10px] font-black tracking-wider cursor-pointer transition-all"
                          style={{
                            borderColor: rule.saleLabel === l ? T.green : T.border,
                            background: rule.saleLabel === l ? '#F0FDF4' : (isDark ? 'rgba(255,255,255,0.02)' : '#fff'),
                            color: rule.saleLabel === l ? T.greenDk : T.sub,
                          }}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <input value={rule.saleLabel} onChange={e => updateRule('saleLabel', e.target.value)}
                      placeholder="or type custom label…"
                      className={inputCls} />
                    <p className={helperCls}>This label appears on the product card badge.</p>
                  </div>
                )}
              </div>

              {/* Right: Dates + Variant overrides */}
              <div className="space-y-4">
                {/* Date range */}
                <div>
                  <label className={labelCls}>Promotion Start Date</label>
                  <input value={rule.startDate} onChange={e => updateRule('startDate', e.target.value)}
                    type="datetime-local" className={inputCls} />
                  <p className={helperCls}>Promotion becomes active and visible on this date.</p>
                </div>
                <div>
                  <label className={labelCls}>Promotion End Date</label>
                  <input value={rule.endDate} onChange={e => updateRule('endDate', e.target.value)}
                    type="datetime-local" className={`${inputCls} ${errors.endDate ? 'border-red-400' : ''}`} />
                  {errors.endDate
                    ? <p className="mt-1.5 text-[11px] font-semibold" style={{ color: T.red }}>{errors.endDate}</p>
                    : <p className={helperCls}>Promotion automatically expires after this date.</p>
                  }
                </div>

                {duration && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border"
                    style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}>
                    <span className="text-lg">⏱</span>
                    <div>
                      <p className="text-[12px] font-black" style={{ color: '#92400E' }}>Campaign Duration</p>
                      <p className="text-[11px]" style={{ color: '#B45309' }}>{duration}</p>
                    </div>
                  </div>
                )}

                {/* Variant overrides (if applicable) */}
                {fullProduct?.hasVariants && rule.target === 'VARIANT' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelCls}>Variant Overrides</label>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={selectAllVariants}
                          className="text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer text-white"
                          style={{ background: T.green }}>All</button>
                        <button type="button" onClick={clearVariants}
                          className="text-[10px] font-black px-2.5 py-1 rounded-lg border cursor-pointer"
                          style={{ borderColor: T.border, color: T.sub }}>Clear</button>
                      </div>
                    </div>
                    {errors.variants && (
                      <p className="mb-2 text-[11px] font-semibold" style={{ color: T.red }}>{errors.variants}</p>
                    )}
                    <div className="text-[10px] font-black uppercase tracking-wider mb-2 px-3 py-1.5 rounded-lg"
                      style={{ background: '#F0FDF4', color: T.greenDk }}>
                      {rule.selectedVariantIds.length} / {(fullProduct.variants || []).length} selected
                    </div>
                    <div className="max-h-[200px] space-y-2 overflow-auto pr-1">
                      {(fullProduct.variants || []).map(variant => {
                        const sel = rule.selectedVariantIds.includes(String(variant.id));
                        const fp  = variantFinalPrice(variant, rule);
                        const pct = discountPercent(variant.price, fp);
                        return (
                          <label key={variant.id}
                            className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all"
                            style={{
                              borderColor: sel ? '#BBF7D0' : (isDark ? 'rgba(255,255,255,0.06)' : T.border),
                              background: sel ? '#F0FDF4' : (isDark ? '#111827' : '#fff'),
                            }}>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-bold truncate" style={{ color: isDark ? '#fff' : T.text }}>
                                {variant.variantLabel || variant.sku}
                              </p>
                              <p className="text-[10px]" style={{ color: T.sub }}>Stock: {variant.stockQuantity}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[12px] font-black" style={{ color: isDark ? '#fff' : T.text }}>
                                {formatMoney(sel ? fp : variant.price)}
                              </p>
                              {sel && pct > 0 && (
                                <p className="text-[10px]" style={{ color: T.sub }}>
                                  <span className="line-through">{formatMoney(variant.price)}</span> −{pct}%
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 transition-all"
                              style={{
                                borderColor: sel ? T.green : '#D1D5DB',
                                background: sel ? T.green : '#fff',
                              }}
                              onClick={() => toggleVariant(variant.id)}>
                              {sel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {step === 2 && (
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border text-[12px] font-black uppercase tracking-wider cursor-pointer"
                  style={{ borderColor: T.border, color: T.sub, background: '#fff' }}>
                  ← Back
                </button>
                <button type="button" onClick={() => { if (validate()) setStep(3); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider text-white cursor-pointer shadow-[0_4px_12px_rgba(34,197,94,0.25)]"
                  style={{ background: T.green }}>
                  Review Promotion
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ────────────────────────────────────────────────────
              STEP 3: REVIEW
          ──────────────────────────────────────────────────── */}
          {step >= 3 && (
            <div className={`${cardCls} ${darkCard}`}>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 text-white"
                  style={{ background: T.green }}>3</div>
                <div>
                  <h2 className="text-[16px] font-bold" style={{ color: isDark ? '#fff' : T.text }}>Review Promotion</h2>
                  <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>Verify your settings before saving.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Products Selected',  value: `${rule.selectedProductIds.length} product${rule.selectedProductIds.length !== 1 ? 's' : ''}` },
                  { label: 'Discount Type',       value: rule.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Price' },
                  { label: 'Discount Value',      value: rule.discountType === 'PERCENTAGE' ? `${rule.discountValue || '—'}%` : `Rs. ${rule.discountValue || '—'}` },
                  { label: 'Promotion Mode',      value: rule.promotionMode },
                  { label: 'Badge Label',         value: rule.saleLabel || 'SALE' },
                  { label: 'Status',              value: rule.saleEnabled ? '🟢 Active' : '⚪ Disabled' },
                  ...(rule.startDate ? [{ label: 'Start Date', value: new Date(rule.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }] : []),
                  ...(rule.endDate   ? [{ label: 'End Date',   value: new Date(rule.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }] : []),
                  ...(duration       ? [{ label: 'Duration',   value: duration }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="p-3.5 rounded-xl border"
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : T.border, background: isDark ? '#111827' : '#F9FAFB' }}>
                    <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: T.sub }}>{label}</p>
                    <p className="text-[13px] font-black" style={{ color: isDark ? '#fff' : T.text }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border text-[12px] font-black uppercase tracking-wider cursor-pointer"
                  style={{ borderColor: T.border, color: T.sub, background: '#fff' }}>
                  ← Edit
                </button>
                <button type="button" onClick={applyRule} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-black text-white cursor-pointer disabled:opacity-50 shadow-[0_4px_16px_rgba(34,197,94,0.30)]"
                  style={{ background: saving ? '#6B7280' : T.green }}>
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : '✓ Save & Activate Promotion'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 success */}
          {step === 4 && successMsg && (
            <div className={`${cardCls} ${darkCard} text-center py-10`}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
                style={{ background: '#F0FDF4', border: `2px solid #BBF7D0` }}>
                🎉
              </div>
              <h2 className="text-[18px] font-black mb-2" style={{ color: T.text }}>Promotion Activated!</h2>
              <p className="text-[13px] mb-6" style={{ color: T.sub }}>{successMsg}</p>
              <button type="button" onClick={resetRule}
                className="px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider text-white cursor-pointer"
                style={{ background: T.green }}>
                + Create Another Promotion
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: SUMMARY + PREVIEW ── */}
        <div className="space-y-5">

          {/* Promotion Summary (sticky) */}
          <div className={`${cardCls} ${darkCard} sticky top-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-black" style={{ color: isDark ? '#fff' : T.text }}>Summary</h3>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: '#F0FDF4', color: T.greenDk, border: `1px solid #BBF7D0` }}>
                Live
              </span>
            </div>

            {rule.selectedProductIds.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-[12px] font-bold" style={{ color: T.sub }}>No products selected</p>
                <p className="text-[11px] mt-1" style={{ color: '#D1D5DB' }}>
                  Select one or more products to create a promotion.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Products Selected', value: `${rule.selectedProductIds.length}` },
                  { label: 'Discount Type',     value: rule.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Price' },
                  { label: 'Discount',          value: rule.discountType === 'PERCENTAGE' ? `${rule.discountValue || '–'}%` : `Rs. ${rule.discountValue || '–'}` },
                  ...(duration ? [{ label: 'Duration', value: duration }] : []),
                  { label: 'Badge',             value: rule.saleLabel || 'SALE' },
                  { label: 'Status',            value: rule.saleEnabled ? 'Active' : 'Disabled', dot: rule.saleEnabled ? '#22C55E' : '#9CA3AF' },
                ].map(({ label, value, dot }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b last:border-b-0"
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6' }}>
                    <span className="text-[11px]" style={{ color: T.sub }}>{label}</span>
                    <span className="text-[12px] font-black flex items-center gap-1.5" style={{ color: isDark ? '#fff' : T.text }}>
                      {dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />}
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action */}
            {rule.selectedProductIds.length > 0 && step < 4 && (
              <button type="button" onClick={applyRule} disabled={saving}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-black text-white cursor-pointer disabled:opacity-50 transition-all"
                style={{ background: saving ? '#6B7280' : T.green, boxShadow: '0 4px 14px rgba(34,197,94,0.30)' }}>
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </div>

          {/* Badge Preview */}
          {rule.promotionMode === 'SALE' && rule.saleEnabled && (
            <div className={`${cardCls} ${darkCard}`}>
              <h3 className="text-[13px] font-black mb-3" style={{ color: isDark ? '#fff' : T.text }}>Badge Preview</h3>
              <div className="flex flex-wrap gap-2">
                {BADGE_OPTIONS.map(b => (
                  <button key={b.label} type="button"
                    onClick={() => updateRule('saleLabel', b.label)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest cursor-pointer border-2 transition-all"
                    style={{
                      background: b.bg,
                      color: b.text,
                      borderColor: rule.saleLabel === b.label ? '#111827' : 'transparent',
                      opacity: rule.saleLabel === b.label ? 1 : 0.75,
                    }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live product preview */}
          <div className={`${cardCls} ${darkCard}`}>
            <h3 className="text-[13px] font-black mb-3" style={{ color: isDark ? '#fff' : T.text }}>
              Product Card Preview
            </h3>
            <PreviewCard product={previewProduct} variant={previewVariant} rule={rule} />
          </div>
        </div>
      </div>
    </div>
  );
}
