import React, { useEffect, useMemo, useState } from 'react';
import { getProductDetail, getSellerInventory, updateSellerProduct } from '../services/sellerService';
import { EmptyState, LoadingState, formatMoney, normalizeList, resolveImageUrl } from './SellerSectionUtils';

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

const ProductThumb = ({ product }) => {
  const src = resolveImageUrl(product.imagePaths?.[0] || product.mainImage);
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-gray-100 bg-gray-50">
      {src ? <img src={src} alt={product.name} className="h-full w-full object-cover" /> : null}
    </div>
  );
};

const PreviewCard = ({ product, variant, rule }) => {
  const name = variant ? `${product?.name || 'Product'} - ${variant.variantLabel || variant.sku}` : product?.name || 'Select a product';
  const basePrice = variant?.price ?? product?.price ?? 0;
  const finalPrice = calculatePrice(basePrice, rule);
  const pct = discountPercent(basePrice, finalPrice);
  const showSaleBadge = rule.saleEnabled && rule.promotionMode === 'SALE';
  const showDiscountBadge = rule.saleEnabled && rule.promotionMode === 'DISCOUNT' && pct > 0;

  return (
    <div className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-gray-50">
        {showSaleBadge ? (
          <span className="absolute left-2 top-2 z-10 bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            {rule.saleLabel || 'SALE'}
          </span>
        ) : null}
        {showDiscountBadge ? (
          <span className="absolute left-2 top-2 z-10 bg-black px-2 py-1 text-[10px] font-black text-white">
            -{pct}%
          </span>
        ) : null}
        <span className="text-xs font-black uppercase tracking-widest text-gray-300">Preview</span>
      </div>
      <div className="p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
          {variant ? 'Variant product' : product?.hasVariants ? 'Parent product rule' : 'Non-variant product'}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[38px] text-sm font-black text-[#222529]">{name}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-black text-emerald-600">{formatMoney(finalPrice)}</span>
          {pct > 0 ? <span className="text-xs font-bold text-gray-400 line-through">{formatMoney(basePrice)}</span> : null}
        </div>
      </div>
    </div>
  );
};

export default function SellerDiscountSales() {
  const [products, setProducts] = useState([]);
  const [fullProduct, setFullProduct] = useState(null);
  const [rule, setRule] = useState(initialRule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getSellerInventory();
      const list = normalizeList(res.data);
      setProducts(list);
    } catch (error) {
      setProducts([]);
      setMessage('Failed to load inventory products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = !search || (product.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'ALL' || (typeFilter === 'VARIANT' ? product.hasVariants : !product.hasVariants);
      const stock = toNumber(product.stockQuantity);
      const matchesStock = stockFilter === 'ALL' || (stockFilter === 'OUT' ? stock <= 0 : stock > 0 && stock <= 5);
      return matchesSearch && matchesType && matchesStock;
    });
  }, [products, search, typeFilter, stockFilter]);

  const targetProducts = useMemo(() => {
    if (rule.scope === 'category') {
      return products.filter((product) => product.category === rule.category);
    }
    const selected = new Set(rule.selectedProductIds.map(String));
    return products.filter((product) => selected.has(String(product.id || product.productId)));
  }, [products, rule.category, rule.scope, rule.selectedProductIds]);

  const previewProduct = fullProduct || targetProducts[0] || filteredProducts[0];
  const previewVariant = rule.target === 'VARIANT'
    ? (fullProduct?.variants || []).find((variant) => rule.selectedVariantIds.includes(String(variant.id))) || fullProduct?.variants?.[0]
    : null;

  const toggleProduct = async (product) => {
    const productId = String(product.id || product.productId);
    setRule((prev) => {
      const exists = prev.selectedProductIds.includes(productId);
      return {
        ...prev,
        selectedProductIds: exists ? prev.selectedProductIds.filter((id) => id !== productId) : [...prev.selectedProductIds, productId],
      };
    });
    if (!fullProduct || String(fullProduct.productId || fullProduct.id) !== productId) {
      try {
        const res = await getProductDetail(product.id || product.productId);
        setFullProduct(res.data);
        if (res.data?.hasVariants && rule.target === 'VARIANT') {
          setRule((prev) => ({
            ...prev,
            selectedVariantIds: (res.data.variants || []).map((variant) => String(variant.id)),
          }));
        }
      } catch {
        setFullProduct(null);
      }
    }
  };

  const toggleVariant = (variantId) => {
    const id = String(variantId);
    setRule((prev) => ({
      ...prev,
      selectedVariantIds: prev.selectedVariantIds.includes(id)
        ? prev.selectedVariantIds.filter((value) => value !== id)
        : [...prev.selectedVariantIds, id],
    }));
  };

  const updateRule = (key, value) => {
    setRule((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'target' && value === 'VARIANT' && fullProduct?.hasVariants) {
        next.scope = 'selected';
        next.selectedProductIds = [String(fullProduct.productId || fullProduct.id)];
        next.selectedVariantIds = (fullProduct.variants || []).map((variant) => String(variant.id));
      }
      if (key === 'target' && value === 'PRODUCT') {
        next.selectedVariantIds = [];
      }
      return next;
    });
  };

  const selectAllVariants = () => {
    setRule((prev) => ({
      ...prev,
      selectedVariantIds: (fullProduct?.variants || []).map((variant) => String(variant.id)),
    }));
  };

  const clearVariants = () => {
    setRule((prev) => ({ ...prev, selectedVariantIds: [] }));
  };

  const editPromotion = async (product) => {
    const productId = String(product.id || product.productId);
    setMessage('');
    try {
      const res = await getProductDetail(product.id || product.productId);
      const detail = res.data;
      const basePrice = toNumber(detail.price || product.price);
      const finalPrice = toNumber(detail.salePrice || (detail.discountPrice ? basePrice - toNumber(detail.discountPrice) : 0));
      const hasPercentage = toNumber(detail.salePercentage) > 0;
      const fixedAmount = finalPrice > 0 && basePrice > finalPrice ? finalPrice.toFixed(2) : '';
      const nextRule = {
        ...initialRule,
        scope: 'selected',
        promotionMode: isDiscountDisplayMode(detail.saleLabel) ? 'DISCOUNT' : 'SALE',
        discountType: hasPercentage ? 'PERCENTAGE' : 'FIXED',
        discountValue: hasPercentage ? String(detail.salePercentage) : fixedAmount,
        saleEnabled: Boolean(detail.onSale),
        target: 'PRODUCT',
        selectedProductIds: [productId],
        selectedVariantIds: [],
        category: detail.category || product.category || '',
        startDate: toLocalDateTimeValue(detail.saleStartTime),
        endDate: toLocalDateTimeValue(detail.saleEndTime),
        saleLabel: isDiscountDisplayMode(detail.saleLabel) ? 'SALE' : (detail.saleLabel || 'SALE'),
      };
      setFullProduct(detail);
      setRule(nextRule);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load product promotion for editing.');
    }
  };

  const resetRule = () => {
    setRule(initialRule);
    setFullProduct(null);
    setMessage('');
  };

  const applyRule = async () => {
    const targets = targetProducts;
    if (!targets.length) {
      setMessage('Select at least one product or category before applying.');
      return;
    }
    if (rule.saleEnabled && (!rule.discountValue || toNumber(rule.discountValue) <= 0)) {
      setMessage('Enter a discount value greater than zero.');
      return;
    }
    if (rule.discountType === 'PERCENTAGE' && toNumber(rule.discountValue) >= 100) {
      setMessage('Percentage discount must be below 100%.');
      return;
    }
    if (rule.target === 'VARIANT') {
      if (targets.length !== 1) {
        setMessage('Specific variant rules work on one selected product at a time.');
        return;
      }
      if (!rule.selectedVariantIds.length) {
        setMessage('Choose at least one variant, or use Product price / inherited variants.');
        return;
      }
    }
    if (rule.discountType === 'FIXED') {
      const selectedVariants = rule.target === 'VARIANT'
        ? (fullProduct?.variants || []).filter((variant) => rule.selectedVariantIds.includes(String(variant.id)))
        : [];
      const invalidVariant = selectedVariants.find((variant) => toNumber(rule.discountValue) >= toNumber(variant.price));
      const invalidFixedTarget = rule.target !== 'VARIANT' && targets.find((product) => toNumber(rule.discountValue) >= toNumber(product.price));
      if (invalidVariant) {
        setMessage('Fixed selling price must be lower than every selected variant price.');
        return;
      }
      if (invalidFixedTarget) {
        setMessage('Fixed amount is the final selling price, so it must be lower than the regular product price.');
        return;
      }
    }

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
          if (rule.startDate) {
            fd.append('saleStartTime', rule.startDate);
          }
          if (rule.endDate) {
            fd.append('saleEndTime', rule.endDate);
          }
          fd.append('salePercentage', rule.discountValue);
        } else {
          fd.append('onSale', true);
          fd.append('saleLabel', rule.promotionMode === 'DISCOUNT' ? 'DISCOUNT' : (rule.saleLabel || 'SALE'));
          if (rule.startDate) {
            fd.append('saleStartTime', rule.startDate);
          }
          if (rule.endDate) {
            fd.append('saleEndTime', rule.endDate);
          }
          fd.append('discountPrice', calculatePrice(detail.price, rule).toFixed(2));
        }

        await updateSellerProduct(productId, fd);
      }

      setMessage(`Applied sale rule to ${targets.length} product${targets.length === 1 ? '' : 's'}.`);
      await load();
      if (previewProduct?.id || previewProduct?.productId) {
        const res = await getProductDetail(previewProduct.id || previewProduct.productId);
        setFullProduct(res.data);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to apply sale rule.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading discount and sale manager..." />;

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Page header — same height as Commission/Dashboard */}
      <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="shrink-0">
            <h2 className="text-sm font-black text-gray-900 tracking-tight">Discount & Sales</h2>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Apply product-level discounts, variant overrides, category sales, and visible sale badges.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={resetRule}
              className="h-8 rounded-sm border border-gray-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
            >
              New Rule
            </button>
            <button
              type="button"
              onClick={applyRule}
              disabled={saving}
              className="h-8 rounded-sm bg-[#10B981] px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#059669] disabled:opacity-60"
            >
              {saving ? 'Applying...' : 'Apply Rule'}
            </button>
          </div>
        </div>
        {message ? (
          <div className="border-t border-gray-100 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50">
            {message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-800">Product selector</h2>
              <p className="text-[10px] font-semibold text-gray-400">Choose one product, many products, or an entire category.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                className="h-9 rounded-sm border border-gray-200 bg-gray-50 px-3 text-xs font-semibold outline-none focus:border-emerald-500"
              />
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-9 rounded-sm border border-gray-200 bg-white px-2 text-xs font-bold">
                <option value="ALL">All types</option>
                <option value="VARIANT">Variant</option>
                <option value="NON_VARIANT">Non-variant</option>
              </select>
              <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="h-9 rounded-sm border border-gray-200 bg-white px-2 text-xs font-bold">
                <option value="ALL">All stock</option>
                <option value="LOW">Low stock</option>
                <option value="OUT">Out of stock</option>
              </select>
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Apply scope
              <select value={rule.scope} onChange={(event) => updateRule('scope', event.target.value)} className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-[#222529]">
                <option value="selected">Selected products</option>
                <option value="category">Category products</option>
              </select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Category
              <select value={rule.category} onChange={(event) => updateRule('category', event.target.value)} disabled={rule.scope !== 'category'} className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-[#222529] disabled:opacity-50">
                <option value="">Choose category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Target
              <select value={rule.target} onChange={(event) => updateRule('target', event.target.value)} className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-[#222529]">
                <option value="PRODUCT">Product price / inherited variants</option>
                <option value="VARIANT">Specific variant prices</option>
              </select>
            </label>
          </div>

          {filteredProducts.length ? (
            <div className="max-h-[520px] overflow-auto rounded-sm border border-gray-200">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Select</th>
                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Product</th>
                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Type</th>
                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Price</th>
                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Current offer</th>
                    <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product) => {
                    const id = String(product.id || product.productId);
                    const checked = rule.selectedProductIds.includes(id);
                    return (
                      <tr key={id} className={`transition-colors ${checked ? 'bg-emerald-50/60' : 'hover:bg-gray-50'}`}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={checked} onChange={() => toggleProduct(product)} className="h-4 w-4 accent-[#10B981] cursor-pointer" />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <ProductThumb product={product} />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-gray-800">{product.name}</p>
                              <p className="text-[10px] font-semibold text-gray-400">{product.category || 'No category'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-sm bg-gray-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-gray-600">
                            {product.hasVariants ? 'Variant' : 'Non-variant'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs font-black text-gray-800">{formatMoney(product.price)}</td>
                        <td className="px-3 py-2">
                          {product.onSale ? (
                            isDiscountDisplayMode(product.saleLabel) ? (
                              <span className="bg-[#222529] px-2 py-1 text-[9px] font-black text-white">DISCOUNT</span>
                            ) : (
                              <span className="bg-red-600 px-2 py-1 text-[9px] font-black text-white">SALE</span>
                            )
                          ) : <span className="text-[10px] font-bold text-gray-400">Normal</span>}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => editPromotion(product)}
                            className="rounded-sm border border-gray-200 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#222529] transition hover:border-emerald-500 hover:text-emerald-600"
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
          ) : (
            <EmptyState title="No matching products" text="Try changing the search or filters." />
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black text-gray-800">Discount & sale rule</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-sm border border-gray-100 bg-gray-50 px-3 py-2">
                <span className="text-xs font-black text-gray-800">Rule active</span>
                <input type="checkbox" checked={rule.saleEnabled} onChange={(event) => updateRule('saleEnabled', event.target.checked)} className="h-5 w-5 accent-[#10B981] cursor-pointer" />
              </label>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Badge shown on product card</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'DISCOUNT', label: 'Discount %' },
                    { value: 'SALE', label: 'SALE text' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateRule('promotionMode', option.value)}
                      className={`h-10 rounded-sm border text-[10px] font-black uppercase tracking-widest transition ${
                        rule.promotionMode === option.value
                          ? option.value === 'SALE'
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-[#10B981] bg-[#10B981] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-[#10B981] hover:text-[#10B981]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Discount type
                  <select value={rule.discountType} onChange={(event) => updateRule('discountType', event.target.value)} className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#10B981]">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed selling price</option>
                  </select>
                </label>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {rule.discountType === 'PERCENTAGE' ? 'Discount %' : 'Selling price'}
                  <input value={rule.discountValue} onChange={(event) => updateRule('discountValue', event.target.value)} type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#10B981]" />
                </label>
              </div>
              {rule.promotionMode === 'SALE' ? (
                <input value={rule.saleLabel} onChange={(event) => updateRule('saleLabel', event.target.value)} placeholder="Sale label" className="h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-[#222529]" />
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Start date
                  <input value={rule.startDate} onChange={(event) => updateRule('startDate', event.target.value)} type="datetime-local" className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-2 text-xs font-bold text-[#222529]" />
                </label>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  End date
                  <input value={rule.endDate} onChange={(event) => updateRule('endDate', event.target.value)} type="datetime-local" className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-2 text-xs font-bold text-[#222529]" />
                </label>
              </div>
            </div>
          </div>

          {fullProduct?.hasVariants && rule.target === 'VARIANT' ? (
            <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-gray-800">Variant price overrides</h2>
                  <p className="text-[10px] font-semibold text-gray-400">Choose the exact variants that get this discount or sale price.</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={selectAllVariants} className="rounded-sm bg-[#10B981] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white hover:bg-[#059669] transition">
                    All
                  </button>
                  <button type="button" onClick={clearVariants} className="rounded-sm border border-gray-200 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:border-gray-400 transition">
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-3 rounded-sm border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700">
                {rule.selectedVariantIds.length} of {(fullProduct.variants || []).length} variants selected
              </div>
              <div className="mt-3 max-h-[250px] space-y-2 overflow-auto">
                {(fullProduct.variants || []).map((variant) => {
                  const selected = rule.selectedVariantIds.includes(String(variant.id));
                  const finalPrice = variantFinalPrice(variant, rule);
                  const pct = discountPercent(variant.price, finalPrice);
                  return (
                    <label key={variant.id} className={`flex items-center justify-between gap-3 rounded-sm border px-3 py-2 ${selected ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-100'}`}>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-gray-800">{variant.variantLabel || variant.sku}</p>
                        <p className="text-[10px] font-semibold text-gray-400">Stock {variant.stockQuantity}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs font-black text-gray-800">{formatMoney(selected ? finalPrice : variant.price)}</p>
                        {selected && pct > 0 ? (
                          <p className="text-[10px] font-bold text-gray-400">
                            <span className="line-through">{formatMoney(variant.price)}</span> -{pct}%
                          </p>
                        ) : null}
                      </div>
                      <input type="checkbox" checked={selected} onChange={() => toggleVariant(variant.id)} className="h-4 w-4 accent-[#10B981] cursor-pointer" />
                    </label>
                  );
                })}
                {!fullProduct.variants?.length ? (
                  <div className="rounded-sm border border-gray-100 px-3 py-4 text-xs font-bold text-gray-400">No variants found for this product.</div>
                ) : null}
              </div>
            </div>
          ) : null}

          <PreviewCard product={previewProduct} variant={previewVariant} rule={rule} />
        </section>
      </div>
    </div>
  );
}
