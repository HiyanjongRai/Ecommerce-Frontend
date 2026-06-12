import React, { useEffect, useMemo, useState } from 'react';
import { getProductDetail, getSellerInventory, updateSellerProduct } from '../services/sellerService';
import { EmptyState, LoadingState, formatMoney, normalizeList, resolveImageUrl } from './SellerSectionUtils';

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

const ProductThumb = ({ product }) => {
  const src = resolveImageUrl(product.imagePaths?.[0] || product.mainImage);
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-gray-100 bg-gray-50">
      {src ? <img src={src} alt={product.name} className="h-full w-full object-cover" /> : null}
    </div>
  );
};

export default function SellerSaleDiscountList() {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [edit, setEdit] = useState(initialEdit);

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

  const rows = useMemo(() => collectPromotions(details), [details]);

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
      setMessage('Promotion updated.');
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
      setMessage('Promotion removed.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to remove promotion.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading sale and discount list..." />;

  return (
    <div className="max-w-[1400px] space-y-4">
      <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Product Management</p>
            <h1 className="mt-1 text-xl font-black text-[#222529]">Sale & Discount Products</h1>
            <p className="mt-1 text-xs font-semibold text-gray-400">Review, edit, or remove active product and variant promotions.</p>
          </div>
          <button type="button" onClick={load} className="h-10 rounded-sm bg-[#222529] px-5 text-[10px] font-black uppercase tracking-widest text-white">
            Refresh
          </button>
        </div>
        {message ? <div className="mt-4 rounded-sm border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{message}</div> : null}
      </div>

      {editingRow ? (
        <section className="rounded-sm border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[#222529]">Edit Promotion</h2>
              <p className="text-[10px] font-semibold text-gray-400">{editingRow.title} - {editingRow.scope === 'VARIANT' ? 'variant promotion' : 'product promotion'}</p>
            </div>
            <button type="button" onClick={() => setEditingRow(null)} className="rounded-sm border border-gray-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#222529]">Cancel</button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Badge
              <select value={edit.promotionMode} onChange={(event) => setEdit((prev) => ({ ...prev, promotionMode: event.target.value }))} className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-[#222529]">
                <option value="DISCOUNT">Discount %</option>
                <option value="SALE">Sale text</option>
              </select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Type
              <select value={edit.discountType} onChange={(event) => setEdit((prev) => ({ ...prev, discountType: event.target.value }))} className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-[#222529]">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed selling price</option>
              </select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {editingRow.scope === 'VARIANT'
                ? (edit.discountType === 'PERCENTAGE' ? 'Default discount %' : 'Default selling price')
                : (edit.discountType === 'PERCENTAGE' ? 'Discount %' : 'Selling price')}
              <input value={edit.discountValue} onChange={(event) => setEdit((prev) => ({ ...prev, discountValue: event.target.value }))} type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-[#222529]" />
            </label>
            <button type="button" disabled={saving} onClick={saveEdit} className="mt-5 h-10 rounded-sm bg-emerald-600 px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {editingRow.scope === 'VARIANT' ? (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {(editingRow.product.variants || []).map((variant) => {
                const selected = edit.selectedVariantIds.includes(String(variant.id));
                const variantValue = edit.variantValues?.[String(variant.id)] || edit.discountValue;
                const finalPrice = calculateFinalPrice(variant.price, { ...edit, discountValue: variantValue });
                const pct = discountPercent(variant.price, finalPrice);
                return (
                  <div key={variant.id} className={`grid gap-3 rounded-sm border px-3 py-2 sm:grid-cols-[1fr_132px_auto] sm:items-center ${selected ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-100'}`}>
                    <label className="flex items-center gap-3">
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
                        className="h-4 w-4 accent-emerald-600"
                      />
                      <span>
                        <p className="text-xs font-black text-[#222529]">{variantName(variant)}</p>
                        <p className="text-[10px] font-semibold text-gray-400">{formatMoney(variant.price)} stock {variant.stockQuantity}</p>
                      </span>
                    </label>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {edit.discountType === 'PERCENTAGE' ? 'Discount %' : 'Selling price'}
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
                        className="mt-1 h-9 w-full rounded-sm border border-gray-200 bg-white px-2 text-xs font-bold text-[#222529] disabled:bg-gray-50 disabled:text-gray-300"
                      />
                    </label>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#222529]">{selected ? formatMoney(finalPrice) : formatMoney(variant.price)}</p>
                      {selected && pct > 0 ? <p className="text-[10px] font-bold text-gray-400">-{pct}%</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-sm border border-gray-100 bg-white p-4 shadow-sm">
        {rows.length ? (
          <div className="overflow-auto rounded-sm border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Product</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Scope</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Badge</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Rule</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Price</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ProductThumb product={row.product} />
                        <div>
                          <p className="text-xs font-black text-[#222529]">{row.title}</p>
                          <p className="text-[10px] font-semibold text-gray-400">{row.subtitle}</p>
                          {row.scope === 'VARIANT' && row.variantPromotions?.length ? (
                            <div className="mt-2 grid gap-1">
                              {row.variantPromotions.map((variant) => (
                                <div key={variant.id} className="flex min-w-[300px] items-center justify-between gap-3 rounded-sm border border-gray-100 bg-gray-50 px-2 py-1">
                                  <span className="text-[10px] font-black text-[#222529]">{variant.name}</span>
                                  <span className="whitespace-nowrap text-[10px] font-black text-[#222529]">
                                    {formatMoney(variant.finalPrice)}
                                    {Number(variant.originalPrice) > Number(variant.finalPrice) ? (
                                      <span className="ml-1 font-bold text-gray-400 line-through">{formatMoney(variant.originalPrice)}</span>
                                    ) : null}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2"><span className="rounded-sm bg-gray-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-gray-600">{row.scope === 'VARIANT' ? 'Variants' : 'Product'}</span></td>
                    <td className="px-3 py-2">{row.mode === 'DISCOUNT' ? <span className="bg-[#222529] px-2 py-1 text-[9px] font-black text-white">DISCOUNT</span> : <span className="bg-red-600 px-2 py-1 text-[9px] font-black text-white">SALE</span>}</td>
                    <td className="px-3 py-2 text-xs font-black text-[#222529]">
                      {row.scope === 'VARIANT' && row.variantPromotions?.length ? (
                        <div className="grid gap-1">
                          {row.variantPromotions.map((variant) => (
                            <span key={variant.id} className="text-[10px] font-black text-[#222529]">
                              {variant.type === 'PERCENTAGE' ? `${variant.value}% off` : `${formatMoney(variant.finalPrice)} selling price`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        row.type === 'PERCENTAGE' ? `${row.value}% off` : `${formatMoney(row.finalPrice)} selling price`
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs font-black text-[#222529]">
                      {row.scope === 'VARIANT' && row.variantPromotions?.length ? (
                        <div className="grid gap-1">
                          {row.variantPromotions.map((variant) => (
                            <span key={variant.id} className="whitespace-nowrap text-[10px] font-black text-[#222529]">
                              {formatMoney(variant.finalPrice)}
                              {Number(variant.originalPrice) > Number(variant.finalPrice) ? <span className="ml-1 font-bold text-gray-400 line-through">{formatMoney(variant.originalPrice)}</span> : null}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <>
                          {formatMoney(row.finalPrice)}
                          {row.originalPrice && Number(row.originalPrice) > Number(row.finalPrice) ? <span className="ml-2 text-[10px] font-bold text-gray-400 line-through">{formatMoney(row.originalPrice)}</span> : null}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(row)} className="rounded-sm border border-gray-200 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#222529] hover:border-emerald-500 hover:text-emerald-600">Edit</button>
                        <button type="button" onClick={() => { if (window.confirm('Remove this sale or discount?')) deleteRow(row); }} className="rounded-sm border border-red-200 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No active sale or discount" text="Create a product or variant promotion and it will appear here." />
        )}
      </section>
    </div>
  );
}
