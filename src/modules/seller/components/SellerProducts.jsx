import React, { useEffect, useMemo, useState } from 'react';
import { createSellerProduct, getSellerProducts, getSellerProfile, updateSellerProductStatus } from '../services/sellerService';
import { EmptyState, LoadingState, SectionHeader, formatMoney, normalizeList, resolveImageUrl, statusClass } from './SellerSectionUtils';
import FileUpload from '../../../shared/components/ui/FileUpload';

const initialForm = {
  name: '',
  shortDescription: '',
  description: '',
  category: '',
  brand: '',
  specification: '',
  storageSpec: '',
  features: '',
  colorOptions: '',
  price: '',
  stockQuantity: '',
  warrantyMonths: '',
  onSale: false,
  discountPrice: '',
  salePercentage: '',
  freeShipping: false,
  insideValleyShipping: '',
  outsideValleyShipping: '',
  sellerFreeShippingMinOrder: '',
  hasVariants: false,
  images: [],
};

const createInitialVariant = () => ({
  id: Date.now(),
  sku: '',
  price: '',
  stockQuantity: '',
  attributesText: '',
});

const createInitialAttributeGroup = () => ({
  id: Date.now(),
  name: '',
  valuesText: '',
});

const parseVariantAttributes = (attributesText) => {
  return attributesText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((attrs, pair) => {
      const [rawName, ...rawValue] = pair.split('=');
      const name = rawName?.trim();
      const value = rawValue.join('=').trim();
      if (name && value) attrs[name] = value;
      return attrs;
    }, {});
};

const productFormLevels = [
  { key: 'details', label: 'Details' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'shipping', label: 'Shipping Info' },
];

const buildVariantCombinations = (groups, basePrice) => {
  const parsedGroups = groups
    .map((group) => ({
      name: group.name.trim(),
      values: group.valuesText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    }))
    .filter((group) => group.name && group.values.length > 0);

  if (parsedGroups.length === 0) return [];

  const combinations = parsedGroups.reduce((acc, group) => {
    if (acc.length === 0) {
      return group.values.map((value) => ({ [group.name]: value }));
    }
    return acc.flatMap((combo) => group.values.map((value) => ({ ...combo, [group.name]: value })));
  }, []);

  return combinations.map((attributes, index) => ({
    id: Date.now() + index,
    sku: '',
    price: basePrice || '',
    stockQuantity: '',
    attributesText: Object.entries(attributes).map(([name, value]) => `${name}=${value}`).join(', '),
  }));
};

const readApiError = (error, fallback) => {
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  return data?.message || data?.error || error.message || fallback;
};

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(initialForm);
  const [variants, setVariants] = useState([createInitialVariant()]);
  const [attributeGroups, setAttributeGroups] = useState([
    { id: Date.now(), name: 'Model', valuesText: '' },
    { id: Date.now() + 1, name: 'Storage', valuesText: '' },
  ]);
  const [productFormLevel, setProductFormLevel] = useState('details');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [commissionRate, setCommissionRate] = useState('15');
  const [saleMode, setSaleMode] = useState('price');

  // Helper to resolve category-based commission rates
  const getCategoryCommissionRate = (categoryName) => {
    if (!categoryName) return 15;
    const cat = categoryName.toUpperCase().trim();
    if (cat.includes("ELECTRONICS") || cat.includes("GADGETS")) return 7.5;
    if (cat.includes("COMPUTER") || cat.includes("GAMING")) return 6.5;
    if (cat.includes("FASHION") || cat.includes("APPAREL")) return 20;
    if (cat.includes("FOOTWEAR")) return 16;
    if (cat.includes("ACCESSORIES")) return 20;
    if (cat.includes("JEWELRY") || cat.includes("LUXURY")) return 15;
    if (cat.includes("BEAUTY") || cat.includes("PERSONAL")) return 20;
    if (cat.includes("HOME") || cat.includes("LIVING")) return 14;
    if (cat.includes("SPORTS") || cat.includes("FITNESS")) return 12.5;
    if (cat.includes("BAGS") || cat.includes("TRAVEL")) return 15;
    if (cat.includes("BOOKS") || cat.includes("STATIONERY")) return 7.5;
    if (cat.includes("TOYS") || cat.includes("KIDS")) return 14;
    if (cat.includes("AUTOMOTIVE")) return 8.5;
    if (cat.includes("GROCERIES") || cat.includes("ESSENTIALS")) return 3.5;
    return 15;
  };

  // Sync category-based commission rate automatically
  useEffect(() => {
    const rate = getCategoryCommissionRate(form.category);
    setCommissionRate(rate.toString());
  }, [form.category]);

  // Real-time Profit & VAT calculations
  const bp = Number(buyingPrice) || 0;
  const sp = Number(form.price) || 0;
  const commRate = Number(commissionRate) || 0;

  const bpExclVat = bp / 1.13;
  const bpVat = bp - bpExclVat;

  const spExclVat = sp / 1.13;
  const spVat = sp - spExclVat;

  const vatPayable = spVat - bpVat;
  const platformCommission = sp * (commRate / 100);

  const profitExclVat = spExclVat - bpExclVat;
  const netProfit = profitExclVat - (vatPayable > 0 ? vatPayable : 0) - platformCommission;

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
    } catch (error) {
      setMessage(readApiError(error, 'Failed to load seller products.'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => String(p.status).toUpperCase() === 'ACTIVE').length,
    inactive: products.filter((p) => String(p.status).toUpperCase() !== 'ACTIVE').length,
  }), [products]);

  const handleChange = (event) => {
    const { name, value, files, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: files ? Array.from(files) : type === 'checkbox' ? checked : value }));
  };

  const handleProductTypeChange = (hasVariants) => {
    setForm((prev) => ({
      ...prev,
      hasVariants,
      stockQuantity: hasVariants ? '' : prev.stockQuantity,
    }));
    if (hasVariants && variants.length === 0) {
      setVariants([createInitialVariant()]);
    }
  };

  const updateVariant = (id, name, value) => {
    setVariants((prev) => prev.map((variant) => (
      variant.id === id ? { ...variant, [name]: value } : variant
    )));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createInitialVariant()]);
  };

  const removeVariant = (id) => {
    setVariants((prev) => prev.length === 1 ? prev : prev.filter((variant) => variant.id !== id));
  };

  const updateAttributeGroup = (id, name, value) => {
    setAttributeGroups((prev) => prev.map((group) => (
      group.id === id ? { ...group, [name]: value } : group
    )));
  };

  const addAttributeGroup = () => {
    setAttributeGroups((prev) => [...prev, createInitialAttributeGroup()]);
  };

  const removeAttributeGroup = (id) => {
    setAttributeGroups((prev) => prev.length === 1 ? prev : prev.filter((group) => group.id !== id));
  };

  const generateVariantsFromAttributes = () => {
    const generated = buildVariantCombinations(attributeGroups, form.price);
    if (generated.length === 0) {
      setMessage('Add at least one attribute name and value list, for example Model = Pro, Pro Max.');
      return;
    }
    setVariants(generated);
    setMessage(`Generated ${generated.length} variants. Add stock and adjust prices before saving.`);
  };

  const goToNextLevel = () => {
    const currentIndex = productFormLevels.findIndex((level) => level.key === productFormLevel);
    const next = productFormLevels[Math.min(currentIndex + 1, productFormLevels.length - 1)];
    setProductFormLevel(next.key);
  };

  const goToPreviousLevel = () => {
    const currentIndex = productFormLevels.findIndex((level) => level.key === productFormLevel);
    const previous = productFormLevels[Math.max(currentIndex - 1, 0)];
    setProductFormLevel(previous.key);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      if (!form.name.trim()) {
        setProductFormLevel('details');
        throw new Error('Product name is required.');
      }
      if (!form.price) {
        setProductFormLevel('inventory');
        throw new Error('Product price is required.');
      }
      if (form.onSale) {
        const hasSalePrice = form.discountPrice !== '';
        const hasSalePercent = form.salePercentage !== '';
        if (hasSalePrice === hasSalePercent) {
          setProductFormLevel('inventory');
          throw new Error('Enable sale with either a final sale price or a percentage discount.');
        }
        if (hasSalePrice && Number(form.discountPrice) >= Number(form.price)) {
          setProductFormLevel('inventory');
          throw new Error('Sale price must be lower than the selling price.');
        }
        if (hasSalePercent && (Number(form.salePercentage) <= 0 || Number(form.salePercentage) >= 100)) {
          setProductFormLevel('inventory');
          throw new Error('Sale percentage must be between 1 and 99.');
        }
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
      if (buyingPrice !== '') {
        formData.append('buyingPrice', buyingPrice);
      }
      formData.set('hasVariants', form.hasVariants);
      if (!form.hasVariants && form.stockQuantity === '') {
        setProductFormLevel('inventory');
        throw new Error('Stock quantity is required for a non-variant product.');
      }
      if (form.hasVariants) {
        const variantPayload = variants.map((variant) => ({
          sku: variant.sku.trim(),
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          attributes: parseVariantAttributes(variant.attributesText),
        })).filter((variant) => Object.keys(variant.attributes).length > 0);

        if (variantPayload.length === 0) {
          setProductFormLevel('inventory');
          throw new Error('Add at least one variant with attributes like Color=Red.');
        }
        if (variantPayload.some((variant) => !variant.price || variant.stockQuantity === '')) {
          setProductFormLevel('inventory');
          throw new Error('Each variant needs a price and stock quantity.');
        }
        formData.append('stockQuantity', 0);
        formData.append('variantsJson', JSON.stringify(variantPayload));
      }
      form.images.forEach((file) => formData.append('images', file));
      await createSellerProduct(formData);
      
      setForm(initialForm);
      setBuyingPrice('');
      setCommissionRate('15');
      setSaleMode('price');
      setVariants([createInitialVariant()]);
      setAttributeGroups([
        { id: Date.now(), name: 'Model', valuesText: '' },
        { id: Date.now() + 1, name: 'Storage', valuesText: '' },
      ]);
      setProductFormLevel('details');
      setShowForm(false);
      setMessage('Product created successfully.');
      await load();
    } catch (error) {
      setMessage(readApiError(error, 'Product save failed.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (product) => {
    if (!product.id) return;
    const next = String(product.status).toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setMessage('');
    try {
      await updateSellerProductStatus(product.id, next);
      await load();
    } catch (error) {
      setMessage(readApiError(error, 'Status update failed.'));
    }
  };

  const productImage = (product) => {
    const first = product.imagePaths?.[0] || product.mainImage;
    return resolveImageUrl(first);
  };

  if (loading) return <LoadingState label="Loading products..." />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Products"
        subtitle="Create, review, and publish products for your store."
        action={(
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="bg-[#222529] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg transition-colors"
          >
            {showForm ? 'Close Form' : 'Add Product'}
          </button>
        )}
      />

      {message ? <div className="p-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">{message}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {[
          ['Total Products', stats.total],
          ['Active Products', stats.active],
          ['Inactive Products', stats.inactive],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            <p className="text-lg font-black text-[#2B3674] mt-1.5">{value}</p>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
          <div className="p-6 border-b border-gray-100 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-[#222529] tracking-wide">Add Product</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-1">Complete details, inventory, and shipping before saving.</p>
              </div>
              <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                {productFormLevels.map((level, index) => (
                  <button
                    key={level.key}
                    type="button"
                    onClick={() => setProductFormLevel(level.key)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${productFormLevel === level.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
                  >
                    {index + 1}. {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {productFormLevel === 'details' ? (
              <section className="space-y-5">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Details</h4>
                  <p className="text-[11px] text-gray-400 font-semibold mt-1">Add product name, info, images, features, and specifications.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Product name" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                  <input name="brand" value={form.brand} onChange={handleChange} placeholder="Brand" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                  <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                </div>
                
                {/* Interactive File Upload Component */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Product Images
                  </label>
                  <FileUpload
                    label="Upload product images"
                    acceptedTypes="image/*"
                    maxSizeMB={5}
                    onUploadComplete={(file) => {
                      // For multiple files, we need to append to existing images
                      setForm((prev) => ({ 
                        ...prev, 
                        images: prev.images ? [...prev.images, file] : [file] 
                      }));
                    }}
                  />
                  {form.images && form.images.length > 0 && (
                    <p className="text-[10px] text-gray-500 font-semibold mt-2">
                      {form.images.length} {form.images.length === 1 ? 'image' : 'images'} selected
                    </p>
                  )}
                </div>
                <input name="shortDescription" value={form.shortDescription} onChange={handleChange} placeholder="Short product info" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                <textarea name="description" value={form.description} onChange={handleChange} rows="4" placeholder="Detailed product information" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400 resize-none" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="colorOptions" value={form.colorOptions} onChange={handleChange} placeholder="Color options text" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                  <input name="storageSpec" value={form.storageSpec} onChange={handleChange} placeholder="Storage/spec short text" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                </div>
                <textarea name="features" value={form.features} onChange={handleChange} rows="3" placeholder="Key features" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400 resize-none" />
                <textarea name="specification" value={form.specification} onChange={handleChange} rows="3" placeholder="Specifications" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400 resize-none" />
              </section>
            ) : null}

            {productFormLevel === 'inventory' ? (
              <section className="space-y-5">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory</h4>
                  <p className="text-[11px] text-gray-400 font-semibold mt-1">Choose whether this product has variants or uses one stock number.</p>
                </div>
                <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleProductTypeChange(false)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${!form.hasVariants ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
                  >
                    Non Variant
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProductTypeChange(true)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${form.hasVariants ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
                  >
                    Variants
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input name="price" value={form.price} onChange={handleChange} required type="number" min="0" step="0.01" placeholder={form.hasVariants ? 'Base price' : 'Selling price'} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                  {!form.hasVariants ? (
                    <input name="stockQuantity" value={form.stockQuantity} onChange={handleChange} required type="number" min="0" placeholder="Stock quantity" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                  ) : (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Stock By Variant</p>
                      <p className="text-[11px] font-semibold text-blue-500 mt-1">Total stock is calculated from rows below.</p>
                    </div>
                  )}
                  <input name="warrantyMonths" value={form.warrantyMonths} onChange={handleChange} type="number" min="0" placeholder="Warranty months" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                </div>

                <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      name="onSale"
                      type="checkbox"
                      checked={form.onSale}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          onSale: checked,
                          discountPrice: checked ? prev.discountPrice : '',
                          salePercentage: checked ? prev.salePercentage : '',
                        }));
                      }}
                      className="w-4 h-4 rounded accent-emerald-600"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Put this product on sale</span>
                  </label>
                  {form.onSale ? (
                    <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
                      <select
                        value={saleMode}
                        onChange={(event) => {
                          const next = event.target.value;
                          setSaleMode(next);
                          setForm((prev) => ({
                            ...prev,
                            discountPrice: next === 'price' ? prev.discountPrice : '',
                            salePercentage: next === 'percentage' ? prev.salePercentage : '',
                          }));
                        }}
                        className="bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                      >
                        <option value="price">Sale price</option>
                        <option value="percentage">Percentage</option>
                      </select>
                      {saleMode === 'price' ? (
                        <input
                          name="discountPrice"
                          value={form.discountPrice}
                          onChange={handleChange}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Final customer price, e.g. 1499"
                          className="bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
                        />
                      ) : (
                        <input
                          name="salePercentage"
                          value={form.salePercentage}
                          onChange={handleChange}
                          type="number"
                          min="1"
                          max="99"
                          step="0.01"
                          placeholder="Discount percent, e.g. 15"
                          className="bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
                        />
                      )}
                    </div>
                  ) : null}
                  <p className="text-[10px] font-semibold text-emerald-700">
                    Sale applies to the product display price. Variant products can still keep separate variant stock and prices.
                  </p>
                </div>

                {/* Price, VAT & Profit Calculator Panel */}
                <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-5 mt-6 space-y-5">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                    <span className="text-[14px]">📊</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#222529]">Price, VAT & Profit Calculator</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Calculator updates automatically as you adjust prices.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Buying Price Card */}
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
                          📥
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Buying / Cost Price (Include VAT)</span>
                          <span className="text-[9px] text-gray-400 font-semibold">Total price you paid for the product (inclusive of 13% VAT)</span>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={buyingPrice}
                          onChange={(e) => setBuyingPrice(e.target.value)}
                          className="w-full bg-white border border-emerald-200 rounded-lg pl-9 pr-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                      
                      {/* Buying Breakdown */}
                      <div className="pt-2 border-t border-emerald-100/50 text-[10px] font-semibold space-y-1.5 text-gray-500">
                        <div className="flex justify-between">
                          <span>Base Cost (Excl. VAT)</span>
                          <span className="text-[#222529] font-bold">Rs. {bpExclVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT Amount (13%)</span>
                          <span className="text-[#222529] font-bold">Rs. {bpVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-emerald-200 pt-1.5 text-emerald-700 font-bold">
                          <span>Total Buying Price (Incl. VAT)</span>
                          <span>Rs. {bp.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Selling Price Card */}
                    <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                          🏷️
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">Selling Price (Include VAT)</span>
                          <span className="text-[9px] text-gray-400 font-semibold">The price customers will pay at checkout (inclusive of 13% VAT)</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">Rs.</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full bg-white border border-blue-200 rounded-lg pl-7 pr-1.5 py-2 text-[10px] font-bold outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">Comm %</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="15.0"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                            className="w-full bg-white border border-blue-200 rounded-lg pl-12 pr-1.5 py-2 text-[10px] font-bold outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      {/* Selling Breakdown */}
                      <div className="pt-2 border-t border-blue-100/50 text-[10px] font-semibold space-y-1.5 text-gray-500">
                        <div className="flex justify-between">
                          <span>Base Selling Price (Excl. VAT)</span>
                          <span className="text-[#222529] font-bold">Rs. {spExclVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT Collected (13%)</span>
                          <span className="text-[#222529] font-bold">Rs. {spVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span>Platform Commission ({commRate}%)</span>
                          <span className="font-bold">Rs. {platformCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-blue-200 pt-1.5 text-blue-700 font-bold">
                          <span>Total Selling Price (Incl. VAT)</span>
                          <span>Rs. {sp.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VAT Payable Row */}
                  <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="space-y-1 w-full md:w-auto">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">VAT Payable (Output VAT - Input VAT)</span>
                      <div className="text-[10px] font-semibold text-gray-500 space-y-1">
                        <div className="flex justify-between md:justify-start gap-4">
                          <span>VAT Collected on Sales:</span>
                          <span className="text-[#222529] font-bold">Rs. {spVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between md:justify-start gap-4">
                          <span>(-) VAT Paid on Purchase:</span>
                          <span className="text-[#222529] font-bold">Rs. {bpVat.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-100/40 border border-amber-200/50 rounded-lg p-3 text-center min-w-[200px]">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 block">VAT Payable to Government</span>
                      <span className="text-base font-black text-amber-800 block mt-0.5">Rs. {vatPayable.toFixed(2)}</span>
                      <span className="text-[8px] text-gray-400 font-bold block mt-0.5">This is the net VAT you need to pay</span>
                    </div>
                  </div>

                  {/* Profit Summary Section */}
                  <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block mb-3">Profit Summary</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      
                      {/* Net Profit block */}
                      <div className="bg-white border border-purple-100 rounded-lg p-3 text-center shadow-sm">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 block">Net Profit (After VAT)</span>
                        <span className={`text-base font-black block mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          Rs. {netProfit.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold block mt-0.5">Actual profit after VAT adjustment</span>
                      </div>

                      {/* Margin block */}
                      <div className="bg-white border border-purple-100 rounded-lg p-3 text-center shadow-sm">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 block">Profit Margin</span>
                        <span className={`text-base font-black block mt-1 ${profitMargin >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          {profitMargin.toFixed(2)}%
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold block mt-0.5">Based on selling price (excl. VAT)</span>
                      </div>

                      {/* Quick View Summary */}
                      <div className="bg-white border border-purple-100 rounded-lg p-3 text-[9px] font-semibold text-gray-500 space-y-1 shadow-sm">
                        <span className="font-black text-gray-400 uppercase tracking-widest block mb-1">Quick View</span>
                        <div className="flex justify-between">
                          <span>Selling Base Price (Excl. VAT)</span>
                          <span>Rs. {spExclVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Buying Base Cost (Excl. VAT)</span>
                          <span>Rs. {bpExclVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit (Excl. VAT)</span>
                          <span>Rs. {profitExclVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-amber-700">
                          <span>Less: VAT Payable</span>
                          <span>Rs. {vatPayable.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span>Less: Platform Commission</span>
                          <span>Rs. {platformCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed pt-1 font-bold text-purple-700">
                          <span>Net Profit</span>
                          <span>Rs. {netProfit.toFixed(2)}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {form.hasVariants ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Attribute Groups</h4>
                          <p className="text-[11px] text-gray-400 font-semibold mt-1">Example: Model has Pro, Pro Max. Storage has 32, 64, 128.</p>
                        </div>
                        <button type="button" onClick={addAttributeGroup} className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100">
                          Add Attribute
                        </button>
                      </div>

                      <div className="space-y-3">
                        {attributeGroups.map((group) => (
                          <div key={group.id} className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3">
                            <input
                              value={group.name}
                              onChange={(event) => updateAttributeGroup(group.id, 'name', event.target.value)}
                              placeholder="Attribute name"
                              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-400"
                            />
                            <input
                              value={group.valuesText}
                              onChange={(event) => updateAttributeGroup(group.id, 'valuesText', event.target.value)}
                              placeholder="Values separated by comma, e.g. Pro, Pro Max"
                              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-400"
                            />
                            <button type="button" onClick={() => removeAttributeGroup(group.id)} disabled={attributeGroups.length === 1} className="text-[10px] font-black uppercase tracking-widest text-red-600 disabled:text-gray-300 px-2">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <button type="button" onClick={generateVariantsFromAttributes} className="bg-[#222529] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg">
                        Generate Variants
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Variants</h4>
                        <p className="text-[11px] text-gray-400 font-semibold mt-1">Generated variants can still be edited manually.</p>
                      </div>
                      <button type="button" onClick={addVariant} className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100">
                        Add Manual Row
                      </button>
                    </div>
                    <div className="space-y-3">
                      {variants.map((variant, index) => (
                        <div key={variant.id} className="grid grid-cols-1 lg:grid-cols-[1fr_120px_120px_120px_auto] gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                          <input value={variant.attributesText} onChange={(event) => updateVariant(variant.id, 'attributesText', event.target.value)} required placeholder={`Variant ${index + 1}: Color=Red, Size=M`} className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-400" />
                          <input value={variant.price} onChange={(event) => updateVariant(variant.id, 'price', event.target.value)} required type="number" min="0" step="0.01" placeholder="Price" className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-400" />
                          <input value={variant.stockQuantity} onChange={(event) => updateVariant(variant.id, 'stockQuantity', event.target.value)} required type="number" min="0" placeholder="Stock" className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-400" />
                          <input value={variant.sku} onChange={(event) => updateVariant(variant.id, 'sku', event.target.value)} placeholder="SKU optional" className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-400" />
                          <button type="button" onClick={() => removeVariant(variant.id)} disabled={variants.length === 1} className="text-[10px] font-black uppercase tracking-widest text-red-600 disabled:text-gray-300 px-2">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {productFormLevel === 'shipping' ? (
              <section className="space-y-5">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping Info</h4>
                  <p className="text-[11px] text-gray-400 font-semibold mt-1">Set delivery fees and product-level free shipping rules.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="insideValleyShipping" value={form.insideValleyShipping} onChange={handleChange} type="number" min="0" step="0.01" placeholder="Inside valley shipping" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                  <input name="outsideValleyShipping" value={form.outsideValleyShipping} onChange={handleChange} type="number" min="0" step="0.01" placeholder="Outside valley shipping" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                </div>
                <label className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <input name="freeShipping" checked={form.freeShipping} onChange={handleChange} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs font-black text-[#222529]">Enable product-level free shipping</span>
                </label>
                {form.freeShipping ? (
                  <input name="sellerFreeShippingMinOrder" value={form.sellerFreeShippingMinOrder} onChange={handleChange} type="number" min="0" step="0.01" placeholder="Minimum order for free shipping" className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-blue-400" />
                ) : null}
              </section>
            ) : null}

            <div className="flex items-center justify-between border-t border-gray-100 pt-5">
              <button type="button" onClick={goToPreviousLevel} disabled={productFormLevel === 'details'} className="text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:text-gray-300 px-4 py-2">
                Back
              </button>
              {productFormLevel === 'shipping' ? (
                <button
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving…
                    </>
                  ) : (
                    form.hasVariants ? 'Save Variant Product' : 'Save Product'
                  )}
                </button>
              ) : (
                <button type="button" onClick={goToNextLevel} className="bg-[#222529] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg">
                  Next
                </button>
              )}
            </div>
          </div>
        </form>
      ) : null}

      {products.length === 0 ? (
        <EmptyState title="No products yet" text="Add your first product to start selling." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400">Product</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400">Category</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400">Stock</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400">Price</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[11px]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/20 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-gray-100 overflow-hidden flex items-center justify-center text-[9px] text-gray-400 flex-shrink-0">
                          {productImage(product) ? <img src={productImage(product)} alt={product.name} className="w-full h-full object-cover" /> : 'Img'}
                        </div>
                        <span className="font-bold text-[#2B3674]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-500 font-semibold">{product.category || '-'}</td>
                    <td className="px-3 py-2 text-gray-500 font-semibold">{product.stockQuantity ?? 0}</td>
                    <td className="px-3 py-2 font-bold text-[#2B3674]">{formatMoney(product.price)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${statusClass(product.status)}`}>
                        {product.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleStatus(product)} className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800">
                        Toggle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
