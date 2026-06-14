import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSellerProduct, getSellerProducts, getSellerProfile, updateSellerProductStatus } from '../services/sellerService';
import { EmptyState, LoadingState, SectionHeader, formatMoney, normalizeList, resolveImageUrl, statusClass } from './SellerSectionUtils';
import FileUpload from '../../../shared/components/ui/FileUpload';

// ─── Constants ───────────────────────────────────────────────────────────────

const initialForm = {
  name: '', shortDescription: '', description: '', category: '', brand: '',
  specification: '', storageSpec: '', features: '', colorOptions: '',
  price: '', stockQuantity: '', warrantyMonths: '', onSale: false,
  discountPrice: '', salePercentage: '', freeShipping: false,
  insideValleyShipping: '', outsideValleyShipping: '',
  sellerFreeShippingMinOrder: '', hasVariants: false, images: [],
};

const CATEGORIES = [
  'Electronics', 'Computers & Gaming', 'Fashion & Apparel', 'Footwear',
  'Accessories', 'Jewelry & Luxury', 'Beauty & Personal Care', 'Home & Living',
  'Sports & Fitness', 'Bags & Travel', 'Books & Stationery', 'Toys & Kids',
  'Automotive', 'Groceries & Essentials',
];

const COMMISSION_BY_CATEGORY = {
  electronics: 7.5, 'computers & gaming': 6.5, 'fashion & apparel': 20,
  footwear: 16, accessories: 20, 'jewelry & luxury': 15,
  'beauty & personal care': 20, 'home & living': 14, 'sports & fitness': 12.5,
  'bags & travel': 15, 'books & stationery': 7.5, 'toys & kids': 14,
  automotive: 8.5, 'groceries & essentials': 3.5,
};

const getCategoryCommission = (cat) => {
  if (!cat) return 15;
  const key = cat.toLowerCase().trim();
  for (const [k, v] of Object.entries(COMMISSION_BY_CATEGORY)) {
    if (key.includes(k)) return v;
  }
  return 15;
};

const createInitialVariant = () => ({ id: Date.now(), sku: '', price: '', stockQuantity: '', attributesText: '' });
const createInitialAttributeGroup = () => ({ id: Date.now(), name: '', valuesText: '' });

const parseVariantAttributes = (text) =>
  text.split(',').map(p => p.trim()).filter(Boolean).reduce((attrs, pair) => {
    const [rawName, ...rawValue] = pair.split('=');
    const name = rawName?.trim(); const value = rawValue.join('=').trim();
    if (name && value) attrs[name] = value;
    return attrs;
  }, {});

const buildVariantCombinations = (groups, basePrice) => {
  const parsed = groups
    .map(g => ({ name: g.name.trim(), values: g.valuesText.split(',').map(v => v.trim()).filter(Boolean) }))
    .filter(g => g.name && g.values.length > 0);
  if (parsed.length === 0) return [];
  const combos = parsed.reduce((acc, g) =>
    acc.length === 0 ? g.values.map(v => ({ [g.name]: v })) : acc.flatMap(c => g.values.map(v => ({ ...c, [g.name]: v }))), []);
  return combos.map((attrs, i) => ({
    id: Date.now() + i, sku: '', price: basePrice || '', stockQuantity: '',
    attributesText: Object.entries(attrs).map(([n, v]) => `${n}=${v}`).join(', '),
  }));
};

const readApiError = (err, fallback) => {
  const d = err.response?.data;
  return (typeof d === 'string' ? d : d?.message || d?.error || err.message) || fallback;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3.5">
    <h3 className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">{label}</h3>
    <div className="text-base font-black text-gray-900 leading-none">{value}</div>
  </div>
);

const FormInput = ({ label, required, hint, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {hint && <p className="text-[10px] text-gray-400 font-medium">{hint}</p>}
  </div>
);

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 outline-none focus:border-emerald-400 focus:bg-white transition-all";

const StepIndicator = ({ steps, current, onChange }) => (
  <div className="flex items-center gap-0">
    {steps.map((step, i) => {
      const idx = steps.findIndex(s => s.key === current);
      const isActive = step.key === current;
      const isDone = i < idx;
      return (
        <React.Fragment key={step.key}>
          <button
            type="button"
            onClick={() => onChange(step.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider transition-all ${
              isActive ? 'bg-gray-900 text-white' :
              isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-black border ${
              isActive ? 'border-white/40 bg-white/20 text-white' :
              isDone ? 'border-emerald-400 bg-emerald-100 text-emerald-700' :
              'border-gray-200 text-gray-400'
            }`}>
              {isDone ? (
                <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              ) : (i + 1)}
            </span>
            {step.label}
          </button>
          {i < steps.length - 1 && (
            <svg className="w-2.5 h-2.5 text-gray-200 mx-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const STEPS = [
  { key: 'details', label: 'Product Info' },
  { key: 'inventory', label: 'Pricing & Stock' },
  { key: 'shipping', label: 'Shipping' },
];

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [variants, setVariants] = useState([createInitialVariant()]);
  const [attributeGroups, setAttributeGroups] = useState([
    { id: Date.now(), name: 'Model', valuesText: '' },
    { id: Date.now() + 1, name: 'Storage', valuesText: '' },
  ]);
  const [step, setStep] = useState('details');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [commissionRate, setCommissionRate] = useState('15');
  const [saleMode, setSaleMode] = useState('price');
  const [showVatLedger, setShowVatLedger] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    const rate = getCategoryCommission(form.category);
    setCommissionRate(rate.toString());
  }, [form.category]);

  const bp = Number(buyingPrice) || 0;
  const sp = Number(form.price) || 0;
  const commRate = Number(commissionRate) || 0;
  const bpExclVat = bp / 1.13;
  const bpVat = bp - bpExclVat;
  const spExclVat = sp / 1.13;
  const spVat = sp - spExclVat;
  const vatPayable = spVat - bpVat;
  const platformCommission = sp * (commRate / 100);
  const netProfit = (spExclVat - bpExclVat) - (vatPayable > 0 ? vatPayable : 0) - platformCommission;
  const profitMargin = sp > 0 ? (netProfit / sp) * 100 : 0;

  const load = async () => {
    setLoading(true);
    try {
      const profileRes = await getSellerProfile();
      const userId = profileRes.data?.userId;
      if (userId) {
        const productsRes = await getSellerProducts(userId);
        setProducts(normalizeList(productsRes.data));
      }
    } catch (err) {
      setMessage({ text: readApiError(err, 'Failed to load products.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => String(p.status).toUpperCase() === 'ACTIVE').length,
    inactive: products.filter(p => String(p.status).toUpperCase() !== 'ACTIVE').length,
    onSale: products.filter(p => p.onSale || p.discountPrice || p.salePercentage).length,
  }), [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      const matchSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || String(p.status).toUpperCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: files ? Array.from(files) : type === 'checkbox' ? checked : value }));
  };

  const handleProductTypeChange = (hasVariants) => {
    setForm(prev => ({ ...prev, hasVariants, stockQuantity: hasVariants ? '' : prev.stockQuantity }));
    if (hasVariants && variants.length === 0) setVariants([createInitialVariant()]);
  };

  const updateVariant = (id, name, value) =>
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [name]: value } : v));
  const addVariant = () => setVariants(prev => [...prev, createInitialVariant()]);
  const removeVariant = (id) => setVariants(prev => prev.length === 1 ? prev : prev.filter(v => v.id !== id));
  const updateAttributeGroup = (id, name, value) =>
    setAttributeGroups(prev => prev.map(g => g.id === id ? { ...g, [name]: value } : g));
  const addAttributeGroup = () => setAttributeGroups(prev => [...prev, createInitialAttributeGroup()]);
  const removeAttributeGroup = (id) => setAttributeGroups(prev => prev.length === 1 ? prev : prev.filter(g => g.id !== id));

  const generateVariantsFromAttributes = () => {
    const generated = buildVariantCombinations(attributeGroups, form.price);
    if (generated.length === 0) { setMessage({ text: 'Add at least one attribute with values, e.g. Color = Red, Blue', type: 'error' }); return; }
    setVariants(generated);
    setMessage({ text: `Generated ${generated.length} variants. Set stock and prices before saving.`, type: 'success' });
  };

  const resetForm = () => {
    setForm(initialForm); setBuyingPrice(''); setCommissionRate('15'); setSaleMode('price');
    setVariants([createInitialVariant()]);
    setAttributeGroups([{ id: Date.now(), name: 'Model', valuesText: '' }, { id: Date.now() + 1, name: 'Storage', valuesText: '' }]);
    setStep('details');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'info' });
    try {
      if (!form.name.trim()) { setStep('details'); throw new Error('Product name is required.'); }
      if (!form.price) { setStep('inventory'); throw new Error('Selling price is required.'); }
      if (form.onSale) {
        const hasSalePrice = form.discountPrice !== '';
        const hasSalePercent = form.salePercentage !== '';
        if (hasSalePrice === hasSalePercent) { setStep('inventory'); throw new Error('Set either a sale price or a percentage discount, not both.'); }
        if (hasSalePrice && Number(form.discountPrice) >= Number(form.price)) { setStep('inventory'); throw new Error('Sale price must be lower than the selling price.'); }
        if (hasSalePercent && (Number(form.salePercentage) <= 0 || Number(form.salePercentage) >= 100)) { setStep('inventory'); throw new Error('Discount percentage must be between 1% and 99%.'); }
      }
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'images') return;
        if (key === 'stockQuantity' && form.hasVariants) return;
        if (!form.onSale && (key === 'discountPrice' || key === 'salePercentage')) return;
        if (form.onSale && saleMode === 'price' && key === 'salePercentage') return;
        if (form.onSale && saleMode === 'percentage' && key === 'discountPrice') return;
        if (value !== '') formData.append(key, value);
      });
      if (buyingPrice !== '') formData.append('buyingPrice', buyingPrice);
      formData.set('hasVariants', form.hasVariants);
      if (!form.hasVariants && form.stockQuantity === '') { setStep('inventory'); throw new Error('Stock quantity is required.'); }
      if (form.hasVariants) {
        const variantPayload = variants.map(v => ({
          sku: v.sku.trim(), price: v.price, stockQuantity: v.stockQuantity,
          attributes: parseVariantAttributes(v.attributesText),
        })).filter(v => Object.keys(v.attributes).length > 0);
        if (variantPayload.length === 0) { setStep('inventory'); throw new Error('Add at least one variant with attributes like Color=Red.'); }
        if (variantPayload.some(v => !v.price || v.stockQuantity === '')) { setStep('inventory'); throw new Error('Each variant needs a price and stock quantity.'); }
        formData.append('stockQuantity', 0);
        formData.append('variantsJson', JSON.stringify(variantPayload));
      }
      form.images.forEach(file => formData.append('images', file));
      await createSellerProduct(formData);
      resetForm();
      setShowForm(false);
      setMessage({ text: 'Product created and published successfully!', type: 'success' });
      await load();
    } catch (err) {
      setMessage({ text: readApiError(err, 'Product save failed.'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (product) => {
    if (!product.id) return;
    const next = String(product.status).toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setMessage({ text: '', type: 'info' });
    try {
      await updateSellerProductStatus(product.id, next);
      await load();
    } catch (err) {
      setMessage({ text: readApiError(err, 'Status update failed.'), type: 'error' });
    }
  };

  const productImage = (p) => resolveImageUrl(p.imagePaths?.[0] || p.mainImage);

  const stepIdx = STEPS.findIndex(s => s.key === step);

  if (loading) return <LoadingState label="Loading products…" />;

  return (
    <div className="space-y-4 max-w-[1400px]">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Product Catalog"
          subtitle="Add, manage, and publish products to your storefront."
        />
        <button
          type="button"
          onClick={() => { setShowForm(v => !v); if (!showForm) setStep('details'); }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider transition-all ${
            showForm ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' : 'bg-gray-900 text-white hover:bg-black'
          }`}
        >
          {showForm ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              Close Form
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              + Add Product
            </>
          )}
        </button>
      </div>

      {/* ── Alert Message ────────────────────────────────────── */}
      {message.text && (
        <div className={`flex items-start gap-3 p-3 rounded-sm border text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {message.type === 'success' ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/> :
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>}
          </svg>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: 'info' })} className="ml-auto text-current opacity-50 hover:opacity-100">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* ── Stats Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Products" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
        <StatCard label="On Sale" value={stats.onSale} />
      </div>

      {/* ── Add Product Form ─────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">

          {/* Form Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50/40">
            <div>
              <h3 className="text-xs font-black text-gray-900">Add New Product</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Fill in product details across all 3 steps, then publish.</p>
            </div>
            <StepIndicator steps={STEPS} current={step} onChange={setStep} />
          </div>

          <div className="p-4 space-y-4">

            {/* ── STEP 1: Product Info ──────────────────────── */}
            {step === 'details' && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-sm bg-emerald-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-gray-900 uppercase tracking-wider">Product Information</h4>
                    <p className="text-[9px] text-gray-400 font-medium">Name, category, images, description, and specifications.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput label="Product Name" required>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. iPhone 15 Pro Max" className={inputCls} />
                  </FormInput>
                  <FormInput label="Brand">
                    <input name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Apple" className={inputCls} />
                  </FormInput>

                  {/* Searchable Category */}
                  <FormInput label="Category" required>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className={`${inputCls} flex justify-between items-center`}
                      >
                        <span className={form.category ? 'text-gray-800' : 'text-gray-400'}>
                          {form.category || 'Select a category'}
                        </span>
                        <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                      </button>
                      {showCategoryDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm shadow-xl z-50 overflow-hidden">
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                placeholder="Search categories…"
                                value={categorySearch}
                                onChange={e => setCategorySearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-sm px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-400"
                                onClick={e => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                            <div className="p-2 max-h-52 overflow-y-auto space-y-0.5">
                              {CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                                <button
                                  key={cat} type="button"
                                  onClick={() => { setForm(p => ({ ...p, category: cat })); setShowCategoryDropdown(false); setCategorySearch(''); }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-sm text-[11px] font-semibold transition-colors ${form.category === cat ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700'}`}
                                >
                                  {cat}
                                </button>
                              ))}
                              {CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                                <p className="text-center text-[10px] text-gray-400 py-3">No categories found</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </FormInput>
                </div>

                {/* Image Upload */}
                <FormInput label="Product Images" hint={form.images?.length > 0 ? `${form.images.length} image${form.images.length > 1 ? 's' : ''} selected` : 'Upload high-quality images. First image becomes the main display image.'}>
                  <FileUpload
                    label="Click to upload or drag & drop product images"
                    acceptedTypes="image/*"
                    maxSizeMB={5}
                    onUploadComplete={file => setForm(prev => ({ ...prev, images: [...(prev.images || []), file] }))}
                  />
                </FormInput>

                <FormInput label="Short Description" hint="Shown in search results and product cards. Keep under 120 characters.">
                  <input name="shortDescription" value={form.shortDescription} onChange={handleChange} placeholder="e.g. Flagship smartphone with titanium build and A17 Pro chip" className={inputCls} />
                </FormInput>

                <FormInput label="Full Description" hint="Detailed product overview shown on the product page.">
                  <textarea name="description" value={form.description} onChange={handleChange} rows="4" placeholder="Write a detailed description covering what makes this product special, who it's for, and what's in the box…" className={`${inputCls} resize-none`} />
                </FormInput>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Color Options" hint="e.g. Black, White, Natural Titanium">
                    <input name="colorOptions" value={form.colorOptions} onChange={handleChange} placeholder="Separate colors with commas" className={inputCls} />
                  </FormInput>
                  <FormInput label="Storage / Spec" hint="Short spec text shown on product card">
                    <input name="storageSpec" value={form.storageSpec} onChange={handleChange} placeholder="e.g. 256GB, 512GB" className={inputCls} />
                  </FormInput>
                </div>

                <FormInput label="Key Features" hint="List main selling points, one per line or separated by commas.">
                  <textarea name="features" value={form.features} onChange={handleChange} rows="3" placeholder="e.g. 48MP main camera, 5x optical zoom, USB-C, USB 3 speed…" className={`${inputCls} resize-none`} />
                </FormInput>

                <FormInput label="Technical Specifications" hint="Full spec sheet: dimensions, weight, battery, connectivity, etc.">
                  <textarea name="specification" value={form.specification} onChange={handleChange} rows="3" placeholder="e.g. Display: 6.7-inch ProMotion OLED, Chip: A17 Pro, Battery: 4422mAh…" className={`${inputCls} resize-none`} />
                </FormInput>
              </section>
            )}

            {/* ── STEP 2: Pricing & Stock ───────────────────── */}
            {step === 'inventory' && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-gray-900 uppercase tracking-wider">Pricing & Stock</h4>
                    <p className="text-[9px] text-gray-400 font-medium">Set selling price, stock quantity, variants, and sale options.</p>
                  </div>
                </div>

                {/* Product Type Toggle */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Product Type</p>
                  <div className="inline-flex bg-gray-100 p-0.5 rounded-sm gap-0.5">
                    {[{ label: 'Single Product', val: false, hint: 'One price, one stock' }, { label: 'Has Variants', val: true, hint: 'Different sizes, colors, SKUs' }].map(opt => (
                      <button
                        key={String(opt.val)} type="button"
                        onClick={() => handleProductTypeChange(opt.val)}
                        className={`px-3 py-1.5 rounded-sm text-[9px] font-black transition-all ${form.hasVariants === opt.val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {opt.label}
                        <span className="block text-[8px] font-medium opacity-60">{opt.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price / Stock / Warranty Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput label={form.hasVariants ? 'Base Price (Rs.)' : 'Selling Price (Rs.)'} required hint="Customer-facing price including VAT">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rs.</span>
                      <input name="price" value={form.price} onChange={handleChange} required type="number" min="0" step="0.01" placeholder="0.00" className={`${inputCls} pl-9`} />
                    </div>
                  </FormInput>

                  {!form.hasVariants ? (
                    <FormInput label="Stock Quantity" required hint="Total units available for sale">
                      <input name="stockQuantity" value={form.stockQuantity} onChange={handleChange} required type="number" min="0" placeholder="e.g. 50" className={inputCls} />
                    </FormInput>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-sm px-3 py-2 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <div>
                        <p className="text-[9px] font-black text-blue-800 uppercase tracking-wider">Stock by Variant</p>
                        <p className="text-[9px] text-blue-600 font-medium mt-0.5">Set stock per variant row below.</p>
                      </div>
                    </div>
                  )}

                  <FormInput label="Warranty (months)" hint="Leave blank if no warranty applies">
                    <input name="warrantyMonths" value={form.warrantyMonths} onChange={handleChange} type="number" min="0" placeholder="e.g. 12" className={inputCls} />
                  </FormInput>
                </div>

                {/* Sale Toggle */}
                <div className="bg-orange-50/60 border border-orange-200 rounded-sm p-3.5 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        name="onSale" type="checkbox" checked={form.onSale}
                        onChange={e => { const c = e.target.checked; setForm(prev => ({ ...prev, onSale: c, discountPrice: c ? prev.discountPrice : '', salePercentage: c ? prev.salePercentage : '' })); }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-orange-500 transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-900">Put this product on sale</span>
                      <span className="block text-[10px] text-gray-500 font-medium">A sale badge will appear on the product card when active</span>
                    </div>
                  </label>

                  {form.onSale && (
                    <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 pt-1">
                      <FormInput label="Discount Type">
                        <select
                          value={saleMode}
                          onChange={e => { setSaleMode(e.target.value); setForm(prev => ({ ...prev, discountPrice: '', salePercentage: '' })); }}
                          className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-orange-400 transition-all"
                        >
                          <option value="price">Final Sale Price</option>
                          <option value="percentage">Percentage Off (%)</option>
                        </select>
                      </FormInput>
                      {saleMode === 'price' ? (
                        <FormInput label="Sale Price (Rs.)" hint={`Must be less than selling price of Rs. ${form.price || '—'}`}>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rs.</span>
                            <input name="discountPrice" value={form.discountPrice} onChange={handleChange} type="number" min="0" step="0.01" placeholder="e.g. 1499" className={`${inputCls} pl-9 border-orange-200 focus:border-orange-400`} />
                          </div>
                        </FormInput>
                      ) : (
                        <FormInput label="Discount %" hint="Customer saves this % off the selling price">
                          <div className="relative">
                            <input name="salePercentage" value={form.salePercentage} onChange={handleChange} type="number" min="1" max="99" step="0.01" placeholder="e.g. 15" className={`${inputCls} pr-8 border-orange-200 focus:border-orange-400`} />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">%</span>
                          </div>
                        </FormInput>
                      )}
                    </div>
                  )}
                </div>

                {/* Profit Calculator */}
                <div className="border border-gray-200 rounded-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowVatLedger(!showVatLedger)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 7h.01M9 7H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h10M7 12h10"/></svg>
                      <div>
                        <span className="text-xs font-black text-gray-800">Profit & VAT Calculator</span>
                        <span className="block text-[10px] text-gray-400 font-medium">Real-time profit margin, VAT payable, and platform commission</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sp > 0 && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {netProfit >= 0 ? '+' : ''}Rs. {netProfit.toFixed(0)} profit
                        </span>
                      )}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${showVatLedger ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </button>

                  {showVatLedger && (
                    <div className="p-5 space-y-4 border-t border-gray-200">
                      {/* Input row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput label="1. Cost Price (Incl. VAT)" hint="What you paid per unit including VAT">
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rs.</span>
                            <input type="number" min="0" step="0.01" placeholder="0.00" value={buyingPrice} onChange={e => setBuyingPrice(e.target.value)} className={`${inputCls} pl-9`} />
                          </div>
                        </FormInput>
                        <FormInput label="2. Selling Price (Incl. VAT)" hint="Auto-synced with price field above">
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rs.</span>
                            <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={`${inputCls} pl-9`} />
                          </div>
                        </FormInput>
                        <FormInput label="3. Platform Commission %" hint="Auto-set by category — editable">
                          <div className="relative">
                            <input type="number" min="0" max="100" step="0.5" placeholder="15.0" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} className={`${inputCls} pr-8`} />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">%</span>
                          </div>
                        </FormInput>
                      </div>

                      {/* Results Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: 'Net Profit', value: `Rs. ${netProfit.toFixed(2)}`, good: netProfit >= 0, highlight: true },
                          { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, good: profitMargin >= 0, highlight: false },
                          { label: 'Platform Fee', value: `Rs. ${platformCommission.toFixed(2)}`, good: false, highlight: false, neutral: true },
                          { label: 'VAT Payable', value: `Rs. ${vatPayable.toFixed(2)}`, good: false, highlight: false, neutral: true },
                        ].map(m => (
                          <div key={m.label} className={`rounded-sm p-2.5 border text-center ${m.highlight ? (m.good ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') : 'bg-gray-50 border-gray-200'}`}>
                            <span className="block text-[9px] font-black uppercase tracking-wider text-gray-400">{m.label}</span>
                            <span className={`block text-sm font-black mt-1 ${m.neutral ? 'text-gray-700' : m.good ? 'text-emerald-700' : 'text-red-600'}`}>{m.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* VAT Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-sm p-2.5 space-y-1.5">
                          <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wider mb-1.5">Purchase (Input VAT)</p>
                          <div className="flex justify-between text-gray-600"><span>Cost excl. VAT</span><span className="font-bold text-gray-800">Rs. {bpExclVat.toFixed(2)}</span></div>
                          <div className="flex justify-between text-gray-600"><span>VAT paid (13%)</span><span className="font-bold text-gray-800">Rs. {bpVat.toFixed(2)}</span></div>
                          <div className="flex justify-between font-bold text-emerald-800 border-t border-emerald-100 pt-1.5"><span>Total cost</span><span>Rs. {bp.toFixed(2)}</span></div>
                        </div>
                        <div className="bg-blue-50/40 border border-blue-100 rounded-sm p-2.5 space-y-1.5">
                          <p className="text-[9px] font-black text-blue-800 uppercase tracking-wider mb-1.5">Sale (Output VAT)</p>
                          <div className="flex justify-between text-gray-600"><span>Price excl. VAT</span><span className="font-bold text-gray-800">Rs. {spExclVat.toFixed(2)}</span></div>
                          <div className="flex justify-between text-gray-600"><span>VAT collected (13%)</span><span className="font-bold text-gray-800">Rs. {spVat.toFixed(2)}</span></div>
                          <div className="flex justify-between font-bold text-blue-800 border-t border-blue-100 pt-1.5"><span>Total price</span><span>Rs. {sp.toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Variant Builder */}
                {form.hasVariants && (
                  <div className="space-y-4">
                    {/* Attribute Groups */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">Attribute Groups</h5>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">e.g. "Color" with values "Red, Blue, White" or "Storage" with "64GB, 128GB"</p>
                        </div>
                        <button type="button" onClick={addAttributeGroup} className="flex items-center gap-1.5 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                          Add Attribute
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {attributeGroups.map(group => (
                          <div key={group.id} className="grid grid-cols-[160px_1fr_auto] gap-2.5">
                            <input value={group.name} onChange={e => updateAttributeGroup(group.id, 'name', e.target.value)} placeholder="Attribute name" className={inputCls} />
                            <input value={group.valuesText} onChange={e => updateAttributeGroup(group.id, 'valuesText', e.target.value)} placeholder="Values, separated by commas (e.g. Red, Blue, Green)" className={inputCls} />
                            <button type="button" onClick={() => removeAttributeGroup(group.id)} disabled={attributeGroups.length === 1} className="px-3 text-red-400 hover:text-red-600 disabled:text-gray-200 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={generateVariantsFromAttributes} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477"/></svg>
                        Auto-Generate Variants
                      </button>
                    </div>

                    {/* Variant Rows */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">Variants ({variants.length})</h5>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Set price and stock for each variant combination.</p>
                        </div>
                        <button type="button" onClick={addVariant} className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                          + Add Row
                        </button>
                      </div>
                      {/* Header */}
                      <div className="grid grid-cols-[1fr_100px_80px_100px_32px] gap-2 px-2">
                        {['Attributes (Color=Red, Size=M)', 'Price', 'Stock', 'SKU (opt.)', ''].map((h, i) => (
                          <p key={i} className="text-[9px] font-black uppercase tracking-widest text-gray-400">{h}</p>
                        ))}
                      </div>
                      {variants.map((v, i) => (
                        <div key={v.id} className="grid grid-cols-[1fr_100px_80px_100px_32px] gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                          <input value={v.attributesText} onChange={e => updateVariant(v.id, 'attributesText', e.target.value)} placeholder={`e.g. Color=Red, Size=M`} className={inputCls} />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">Rs.</span>
                            <input value={v.price} onChange={e => updateVariant(v.id, 'price', e.target.value)} required type="number" min="0" step="0.01" placeholder="0.00" className={`${inputCls} pl-7 text-[10px]`} />
                          </div>
                          <input value={v.stockQuantity} onChange={e => updateVariant(v.id, 'stockQuantity', e.target.value)} required type="number" min="0" placeholder="0" className={`${inputCls} text-center`} />
                          <input value={v.sku} onChange={e => updateVariant(v.id, 'sku', e.target.value)} placeholder="SKU-001" className={inputCls} />
                          <button type="button" onClick={() => removeVariant(v.id)} disabled={variants.length === 1} className="flex items-center justify-center text-red-400 hover:text-red-600 disabled:text-gray-200 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── STEP 3: Shipping ─────────────────────────── */}
            {step === 'shipping' && (
              <section className="space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Shipping & Delivery</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Set delivery fees and free shipping rules for this product.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Inside Valley Delivery (Rs.)" hint="Delivery fee for Kathmandu Valley orders">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rs.</span>
                      <input name="insideValleyShipping" value={form.insideValleyShipping} onChange={handleChange} type="number" min="0" step="0.01" placeholder="e.g. 100" className={`${inputCls} pl-9`} />
                    </div>
                  </FormInput>
                  <FormInput label="Outside Valley Delivery (Rs.)" hint="Delivery fee for orders outside Kathmandu Valley">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rs.</span>
                      <input name="outsideValleyShipping" value={form.outsideValleyShipping} onChange={handleChange} type="number" min="0" step="0.01" placeholder="e.g. 200" className={`${inputCls} pl-9`} />
                    </div>
                  </FormInput>
                </div>

                <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 cursor-pointer hover:bg-gray-100/70 transition-colors group">
                  <div className="relative flex-shrink-0">
                    <input name="freeShipping" checked={form.freeShipping} onChange={handleChange} type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-gray-900">Enable product-level free shipping</span>
                    <span className="block text-[10px] text-gray-500 font-medium">Overrides global shipping rules for this product only</span>
                  </div>
                </label>

                {form.freeShipping && (
                  <FormInput label="Minimum Order for Free Shipping (Rs.)" hint="Leave blank to offer free shipping on all order sizes">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rs.</span>
                      <input name="sellerFreeShippingMinOrder" value={form.sellerFreeShippingMinOrder} onChange={handleChange} type="number" min="0" step="0.01" placeholder="e.g. 500" className={`${inputCls} bg-emerald-50/40 border-emerald-200 pl-9`} />
                    </div>
                  </FormInput>
                )}

                {/* Summary before save */}
                <div className="bg-gray-50 border border-gray-200 rounded-sm p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Review Before Publishing</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                    {[
                      { label: 'Product Name', value: form.name || '—' },
                      { label: 'Category', value: form.category || '—' },
                      { label: 'Selling Price', value: form.price ? `Rs. ${form.price}` : '—' },
                      { label: 'Stock', value: form.hasVariants ? `${variants.length} variant(s)` : (form.stockQuantity || '—') },
                      { label: 'On Sale', value: form.onSale ? (saleMode === 'price' ? `Rs. ${form.discountPrice || '—'}` : `${form.salePercentage || '—'}% off`) : 'No' },
                      { label: 'Images', value: form.images?.length > 0 ? `${form.images.length} uploaded` : 'None' },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{item.label}</p>
                        <p className="text-xs font-black text-gray-900 mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Form Navigation ─────────────────────────── */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3.5">
              <div className="flex items-center gap-2">
                {stepIdx > 0 && (
                  <button type="button" onClick={() => setStep(STEPS[stepIdx - 1].key)} className="flex items-center gap-1 text-[9px] font-black text-gray-600 hover:text-gray-900 px-3 py-1.5 hover:bg-gray-100 rounded-sm transition-colors uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    Back
                  </button>
                )}
                {stepIdx < STEPS.length - 1 && (
                  <button type="button" onClick={() => setStep(STEPS[stepIdx + 1].key)} className="flex items-center gap-1 bg-gray-900 hover:bg-black text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-sm transition-colors">
                    Continue
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                )}
              </div>
              <button
                type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[9px] font-black uppercase tracking-wider px-4 py-1.5 rounded-sm transition-all shadow-sm"
              >
                {saving ? (
                  <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving…</>
                ) : (
                  <><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Save & Publish</>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Product List ─────────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm p-10 text-center shadow-sm">
          <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">No products yet</h3>
          <p className="text-[10px] text-gray-400 font-medium mt-1.5">Add your first product to start selling on Jhapcham.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 bg-gray-900 text-white text-[9px] font-black uppercase tracking-wider px-4 py-1.5 rounded-sm hover:bg-black transition-colors">
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">

          {/* List Toolbar */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:justify-between">
            <div className="flex items-center gap-1">
              {['ALL', 'ACTIVE', 'INACTIVE'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider transition-colors ${
                    statusFilter === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {tab === 'ALL' ? `All (${stats.total})` : tab === 'ACTIVE' ? `Active (${stats.active})` : `Inactive (${stats.inactive})`}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-[11px] font-semibold text-gray-700 placeholder-gray-400 outline-none focus:border-emerald-400 transition-all w-48"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-black text-gray-500">No products match "{search}"</p>
              <button onClick={() => setSearch('')} className="mt-3 text-xs text-emerald-600 font-bold hover:underline">Clear search</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-3.5 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400">Product</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400">Category</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400">Stock</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400">Price</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400">Sale</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map(product => {
                    const qty = product.stockQuantity ?? 0;
                    const isActive = String(product.status).toUpperCase() === 'ACTIVE';
                    const isOnSale = product.onSale || product.discountPrice || product.salePercentage;
                    const img = productImage(product);
                    const maxQty = 120;
                    const stockPct = Math.min((qty / maxQty) * 100, 100);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50/70 transition-colors group">
                        {/* Product */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-sm bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-200">
                              {img ? (
                                <img src={img} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
                              )}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-gray-900 group-hover:text-emerald-700 transition-colors">{product.name}</p>
                              {product.brand && <p className="text-[9px] text-gray-400 font-medium">{product.brand}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-3 py-2.5">
                          <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
                            {product.category || '—'}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="px-3 py-2.5">
                          <div className="space-y-1 min-w-[72px]">
                            {qty === 0 ? (
                              <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm">Out of Stock</span>
                            ) : qty <= 5 ? (
                              <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">{qty} left — Low</span>
                            ) : (
                              <span className="text-[11px] font-bold text-gray-700">{qty} units</span>
                            )}
                            <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${qty === 0 ? 'bg-red-400' : qty <= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.max(stockPct, qty === 0 ? 0 : 3)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-3 py-2.5">
                          <p className="text-[11px] font-black text-gray-900">{formatMoney(product.price)}</p>
                          {isOnSale && product.discountPrice && (
                            <p className="text-[9px] text-emerald-600 font-bold">→ {formatMoney(product.discountPrice)}</p>
                          )}
                        </td>

                        {/* Sale Badge */}
                        <td className="px-3 py-2.5">
                          {isOnSale ? (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-sm">
                              <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/></svg>
                              SALE
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-300 font-medium">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                            <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {product.status || 'Draft'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/seller/inventory?productId=${product.id}`)}
                              className="flex items-center gap-1 text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-sm hover:bg-emerald-100 transition-colors uppercase tracking-wider"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
                              Edit
                            </button>
                            <button
                              onClick={() => toggleStatus(product)}
                              className={`text-[8px] font-black px-2 py-1 rounded-sm border transition-colors uppercase tracking-wider ${
                                isActive ? 'text-gray-600 border-gray-200 hover:bg-gray-100' : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[9px] text-gray-400 font-semibold">
              Showing {filteredProducts.length} of {products.length} products
              {search && ` matching "${search}"`}
            </p>
            <p className="text-[9px] text-gray-400 font-semibold">{stats.active} active · {stats.inactive} inactive · {stats.onSale} on sale</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
