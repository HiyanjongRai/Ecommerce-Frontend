import React, { useEffect, useState, useCallback } from 'react';
import {
  getSellerInventory,
  updateSellerProduct,
  updateSellerProductStatus,
  deleteSellerProduct,
  getProductDetail,
  getSellerUnacknowledgedAlerts,
  acknowledgeSellerInventoryAlert,
} from '../services/sellerService';
import { BASE_URL } from '../../../shared/api/apiClient';
import { toast } from '../../../shared/contexts/ToastContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const imgSrc = (p) => p?.startsWith('http') ? p : `${BASE_URL}${p?.startsWith('/') ? '' : '/'}${p}`;

const inputCls = "w-full bg-white border border-gray-200 rounded-sm px-2.5 py-1.5 text-[11px] text-gray-700 placeholder-gray-300 outline-none focus:border-gray-400 transition-all";
const labelCls = "block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5";

// ─── Micro Components ─────────────────────────────────────────────────────────

const StatusPill = ({ status }) => {
  const s = (status || '').toUpperCase();
  const map = {
    ACTIVE:   'bg-green-50 text-green-700 border border-green-200',
    INACTIVE: 'bg-red-50 text-red-600 border border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide inline-block ${map[s] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
      {status || 'Draft'}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SellerInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(null);
  const [form, setForm] = useState({});
  const [variants, setVariants] = useState([]);
  const [attrKeys, setAttrKeys] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [newImages, setNewImages] = useState([]);
  const [updatingStockId, setUpdatingStockId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerInventory();
      const list = res.data?.content || res.data || [];
      setProducts(Array.isArray(list) ? list : []);
      const alertRes = await getSellerUnacknowledgedAlerts().catch(() => ({ data: [] }));
      setAlerts(Array.isArray(alertRes.data) ? alertRes.data : []);
    } catch { setProducts([]); setAlerts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = async (p) => {
    const pid = p.id || p.productId;
    setLoadingEdit(pid);
    try {
      const res = await getProductDetail(pid);
      const full = res.data;
      setEditing(full);
      setForm({
        name: full.name || '', shortDescription: full.shortDescription || '',
        description: full.description || '', category: full.category || '',
        brand: full.brand || '', price: full.price ?? '', discountPrice: full.discountPrice ?? '',
        onSale: full.onSale ?? false, stockQuantity: full.stockQuantity ?? '',
        specification: full.specification || '', features: full.features || '',
        warrantyMonths: full.warrantyMonths ?? '', freeShipping: full.freeShipping ?? false,
        insideValleyShipping: full.insideValleyShipping ?? '',
        outsideValleyShipping: full.outsideValleyShipping ?? '',
        hasVariants: full.hasVariants ?? false,
      });
      const vars = full.variants || [];
      const keys = [...new Set(vars.flatMap(v => Object.keys(v.attributes || {})))];
      setAttrKeys(keys);
      setVariants(vars.map(v => ({ id: v.id, sku: v.sku || '', price: v.price ?? '', stockQuantity: v.stockQuantity ?? '', attributes: { ...v.attributes } })));
      setNewAttrKey(''); setActiveTab('details'); setNewImages([]);
    } catch { toast('Failed to load product details.', 'error'); }
    finally { setLoadingEdit(null); }
  };

  const closeEdit = () => { setEditing(null); setForm({}); setVariants([]); setAttrKeys([]); setNewImages([]); setActiveTab('details'); };
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateVariant = (i, k, v) => setVariants(vs => vs.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
  const updateVariantAttr = (i, attrKey, val) => setVariants(vs => vs.map((row, idx) => idx === i ? { ...row, attributes: { ...row.attributes, [attrKey]: val } } : row));
  const addAttrKey = () => {
    const key = newAttrKey.trim();
    if (!key || attrKeys.includes(key)) return;
    setAttrKeys(prev => [...prev, key]);
    setVariants(vs => vs.map(v => ({ ...v, attributes: { ...v.attributes, [key]: '' } })));
    setNewAttrKey('');
  };
  const removeAttrKey = (key) => {
    setAttrKeys(prev => prev.filter(k => k !== key));
    setVariants(vs => vs.map(v => { const attrs = { ...v.attributes }; delete attrs[key]; return { ...v, attributes: attrs }; }));
  };
  const addVariant = () => {
    const blankAttrs = {};
    attrKeys.forEach(k => { blankAttrs[k] = ''; });
    setVariants(vs => [...vs, { sku: '', price: '', stockQuantity: '', attributes: blankAttrs }]);
  };
  const removeVariant = (i) => setVariants(vs => vs.filter((_, idx) => idx !== i));
  const handleImageUploadChange = (e) => setNewImages(prev => [...prev, ...Array.from(e.target.files)]);
  const removeNewImage = (idx) => setNewImages(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (form.hasVariants && k === 'stockQuantity') return;
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (form.hasVariants) {
        fd.append('variantsJson', JSON.stringify(variants.map(v => ({ id: v.id, sku: v.sku, price: Number(v.price), stockQuantity: Number(v.stockQuantity), attributes: v.attributes }))));
      }
      newImages.forEach(img => fd.append('newImages', img));
      await updateSellerProduct(editing.id || editing.productId, fd);
      toast('Product updated successfully!', 'success');
      closeEdit(); load();
    } catch (e) { toast(e.response?.data?.message || 'Update failed.', 'error'); }
    finally { setSaving(false); }
  };

  const handleStatusToggle = async (p) => {
    const newStatus = (p.status || '').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try { await updateSellerProductStatus(p.id || p.productId, newStatus); toast(`Product marked ${newStatus}`, 'success'); load(); }
    catch { toast('Status update failed.', 'error'); }
  };

  const handleDelete = async (p) => {
    try { await deleteSellerProduct(p.id || p.productId); toast('Product deleted.', 'success'); setConfirmDelete(null); load(); }
    catch { toast('Delete failed.', 'error'); }
  };

  const acknowledgeAlert = async (alertId) => {
    try { await acknowledgeSellerInventoryAlert(alertId); setAlerts(prev => prev.filter(a => a.id !== alertId)); toast('Alert acknowledged.', 'success'); }
    catch { toast('Failed to acknowledge alert.', 'error'); }
  };

  const handleDirectStockUpdate = async (p, isIncrement) => {
    const pid = p.id || p.productId;
    if (p.hasVariants) { toast('Use the Edit panel to adjust variant stock quantities.', 'info'); return; }
    const currentStock = p.stockQuantity ?? 0;
    const nextStock = isIncrement ? currentStock + 1 : Math.max(0, currentStock - 1);
    setUpdatingStockId(pid);
    try {
      const fd = new FormData();
      fd.append('name', p.name || ''); fd.append('price', p.price ?? ''); fd.append('stockQuantity', nextStock);
      await updateSellerProduct(pid, fd);
      const matchedAlerts = alerts.filter(a => a.productId === pid);
      for (const alert of matchedAlerts) await acknowledgeSellerInventoryAlert(alert.id).catch(() => {});
      toast(`Stock updated to ${nextStock}`, 'success'); await load();
    } catch (e) { toast(e.response?.data?.message || 'Failed to update stock.', 'error'); }
    finally { setUpdatingStockId(null); }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => (p.status || '').toUpperCase() === 'ACTIVE').length,
    inactive: products.filter(p => (p.status || '').toUpperCase() === 'INACTIVE').length,
    lowStock: products.filter(p => !p.hasVariants && (p.stockQuantity ?? 0) <= 5 && (p.stockQuantity ?? 0) > 0).length,
    outOfStock: products.filter(p => !p.hasVariants && (p.stockQuantity ?? 0) === 0).length,
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || (p.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (p.status || '').toUpperCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="flex items-center gap-3 text-gray-400">
        <svg className="animate-spin w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-sm font-semibold">Loading inventory…</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-[1400px]">

      {/* ── Page Header ── */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-sm font-black text-gray-900 tracking-tight">Inventory</h1>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Edit products, manage variants, update stock and pricing.</p>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-sm">
            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            <span className="text-[10px] font-black text-amber-800">{alerts.length} stock alert{alerts.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { title: 'Total Products', value: stats.total,      positive: true  },
          { title: 'Active',         value: stats.active,     positive: true  },
          { title: 'Inactive',       value: stats.inactive,   positive: false },
          { title: 'Low Stock',      value: stats.lowStock,   positive: false },
          { title: 'Out of Stock',   value: stats.outOfStock, positive: false },
        ].map(({ title, value, positive }) => (
          <div key={title} className="bg-white border border-gray-200 rounded-sm shadow-sm p-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">{title}</h3>
              <div className={`text-base font-black leading-none ${positive || value === 0 ? 'text-gray-900' : value > 0 ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Inventory Alerts ── */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm shadow-sm p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[9px] font-black uppercase tracking-wider text-amber-800">Inventory Alerts</h2>
            <span className="text-[9px] font-black text-amber-700">{alerts.length} open</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white border border-amber-100 rounded-sm px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-gray-800 truncate">{alert.productName}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{alert.message || alert.alertType}</p>
                  <p className="text-[9px] text-amber-700 font-bold">Stock: {alert.currentStock ?? 0} / Min: {alert.thresholdStock ?? '—'}</p>
                </div>
                <button onClick={() => acknowledgeAlert(alert.id)}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm transition-colors">
                  Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Product Table ── */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 pt-3.5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            {['ALL', 'ACTIVE', 'INACTIVE'].map(tab => (
              <button key={tab} onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider transition-colors ${
                  statusFilter === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}>
                {tab === 'ALL' ? `All (${stats.total})` : tab === 'ACTIVE' ? `Active (${stats.active})` : `Inactive (${stats.inactive})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="border border-gray-200 rounded-sm px-3 py-1.5 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 w-52"
            />
            <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">{filtered.length} products</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-14">
            <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <p className="text-xs font-semibold text-gray-500">No products match your search</p>
            <button onClick={() => { setSearch(''); setStatusFilter('ALL'); }} className="mt-1 text-[10px] text-blue-600 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Variants', 'Actions'].map(h => (
                    <th key={h} className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pid = p.id || p.productId;
                  const img = p.imagePaths?.[0];
                  const qty = p.hasVariants
                    ? (p.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0)
                    : (p.stockQuantity ?? 0);
                  const isLow = qty <= 5 && qty > 0;
                  const isOut = qty === 0;
                  const isActive = (p.status || '').toUpperCase() === 'ACTIVE';

                  return (
                    <tr key={pid} className="border-b border-gray-50/50 hover:bg-gray-50/60 transition-colors">

                      {/* Product */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-sm bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {img
                              ? <img src={imgSrc(img)} alt={p.name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                              : <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-gray-800 max-w-[160px] truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{p.brand || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 text-[11px] text-gray-500 font-medium">{p.category || '—'}</td>

                      {/* Price */}
                      <td className="py-2.5 px-3">
                        <p className="text-[11px] font-black text-gray-800">Rs. {Number(p.price || 0).toLocaleString()}</p>
                        {p.onSale && p.discountPrice && (
                          <p className="text-[9px] text-green-600 font-bold">→ Rs. {Number(p.discountPrice).toLocaleString()}</p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-2.5 px-3">
                        {p.hasVariants ? (
                          <div>
                            <span className={`text-[11px] font-black ${isOut ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-gray-700'}`}>{qty} (var)</span>
                            <p className="text-[9px] text-gray-400">{p.variants?.length || 0} variants</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 select-none">
                              <button onClick={() => handleDirectStockUpdate(p, false)} disabled={updatingStockId === pid}
                                className="w-5 h-5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-sm flex items-center justify-center font-bold text-xs transition-colors">−</button>
                              {updatingStockId === pid ? (
                                <svg className="animate-spin w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                              ) : (
                                <span className={`text-[11px] font-black w-6 text-center ${isOut ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-gray-700'}`}>{qty}</span>
                              )}
                              <button onClick={() => handleDirectStockUpdate(p, true)} disabled={updatingStockId === pid}
                                className="w-5 h-5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-sm flex items-center justify-center font-bold text-xs transition-colors">+</button>
                            </div>
                            {(isOut || isLow) && (
                              <span className={`text-[9px] font-black uppercase tracking-wide ${isOut ? 'text-red-500' : 'text-amber-600'}`}>
                                {isOut ? 'Out of Stock' : 'Low Stock'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3"><StatusPill status={p.status} /></td>

                      {/* Variants */}
                      <td className="py-2.5 px-3 text-[11px] text-gray-400 font-medium">
                        {p.hasVariants ? `${p.variants?.length || 0}` : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(p)} disabled={loadingEdit === pid}
                            className="flex items-center gap-1 rounded-sm bg-gray-50 border border-gray-200 px-2 py-1 text-[9px] font-black uppercase text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                            {loadingEdit === pid
                              ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                              : <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>}
                            Edit
                          </button>
                          <button onClick={() => handleStatusToggle(p)}
                            className={`rounded-sm border px-2 py-1 text-[9px] font-black uppercase transition-colors ${
                              isActive ? 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                            }`}>
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => setConfirmDelete(p)}
                            className="p-1.5 rounded-sm text-gray-400 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-200 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50 flex flex-wrap items-center gap-4 text-[10px] text-gray-400 font-semibold">
            <span>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
            {stats.lowStock > 0 && <><span className="text-gray-300">|</span><span className="text-amber-600 font-black">{stats.lowStock} low stock</span></>}
            {stats.outOfStock > 0 && <><span className="text-gray-300">|</span><span className="text-red-500 font-black">{stats.outOfStock} out of stock</span></>}
            {stats.lowStock === 0 && stats.outOfStock === 0 && <><span className="text-gray-300">|</span><span className="text-green-600">All stock levels OK</span></>}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-5 w-full max-w-xs shadow-xl border border-gray-200">
            <div className="w-10 h-10 rounded-sm bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 className="text-xs font-black text-gray-900 text-center mb-1">Delete Product?</h3>
            <p className="text-[10px] text-gray-400 text-center mb-4">This permanently deletes <span className="font-bold text-gray-700">"{confirmDelete.name}"</span> and cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 rounded-sm border border-gray-200 text-[10px] font-black text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-1.5 rounded-sm bg-red-500 hover:bg-red-600 text-white text-[10px] font-black transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Panel ── */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] overflow-hidden">

            {/* Panel Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-gray-900">Edit Product</h2>
                <p className="text-[10px] text-gray-400 font-medium truncate max-w-xs mt-0.5">{editing.name}</p>
              </div>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex gap-1.5 shrink-0">
              {[
                { id: 'details',   label: 'Details' },
                { id: 'inventory', label: 'Inventory & Pricing' },
                { id: 'images',    label: 'Images' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3">

              {/* ── DETAILS ── */}
              {activeTab === 'details' && (
                <div className="space-y-2.5">
                  <div><label className={labelCls}>Product Name</label><input value={form.name} onChange={e => setF('name', e.target.value)} className={inputCls} placeholder="Product name" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}>Category</label><input value={form.category} onChange={e => setF('category', e.target.value)} className={inputCls} placeholder="e.g. Electronics" /></div>
                    <div><label className={labelCls}>Brand</label><input value={form.brand} onChange={e => setF('brand', e.target.value)} className={inputCls} placeholder="e.g. Apple" /></div>
                  </div>
                  <div><label className={labelCls}>Short Description</label><textarea rows={2} value={form.shortDescription} onChange={e => setF('shortDescription', e.target.value)} className={`${inputCls} resize-none`} placeholder="Brief summary…" /></div>
                  <div><label className={labelCls}>Full Description</label><textarea rows={3} value={form.description} onChange={e => setF('description', e.target.value)} className={`${inputCls} resize-none`} placeholder="Detailed description…" /></div>
                  <div><label className={labelCls}>Specifications</label><textarea rows={2} value={form.specification} onChange={e => setF('specification', e.target.value)} className={`${inputCls} resize-none`} placeholder="Technical specs…" /></div>
                  <div><label className={labelCls}>Warranty (months)</label><input type="number" value={form.warrantyMonths} onChange={e => setF('warrantyMonths', e.target.value)} className={inputCls} placeholder="e.g. 12" /></div>
                </div>
              )}

              {/* ── INVENTORY & PRICING ── */}
              {activeTab === 'inventory' && (
                <div className="space-y-3">
                  {form.hasVariants ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-gray-800">Product Variants</h3>
                          <p className="text-[10px] text-gray-400 mt-0.5">Edit attributes, pricing, stock per variant.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-sm">{variants.length} variants</span>
                          <button onClick={() => setF('hasVariants', false)} className="text-[9px] text-red-500 font-bold hover:underline">Disable</button>
                        </div>
                      </div>

                      {/* Attribute Keys */}
                      <div className="bg-gray-50 border border-gray-200 rounded-sm p-2.5 space-y-2">
                        <label className={labelCls}>1. Attribute Keys (e.g. Color, Size)</label>
                        <div className="flex gap-1.5">
                          <input type="text" value={newAttrKey} onChange={e => setNewAttrKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAttrKey()} placeholder="e.g. Color" className={inputCls} />
                          <button onClick={addAttrKey} className="shrink-0 bg-gray-900 hover:bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-sm transition-colors">+ Add</button>
                        </div>
                        {attrKeys.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {attrKeys.map(key => (
                              <span key={key} className="flex items-center gap-1 bg-white border border-gray-200 text-[9px] font-bold text-gray-700 pl-2 pr-1 py-0.5 rounded-sm shadow-sm">
                                {key}
                                <button onClick={() => removeAttrKey(key)} className="text-red-400 hover:text-red-600 text-sm leading-none">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Variant Rows */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className={labelCls}>2. Configure Variants</label>
                          <button onClick={addVariant} className="text-[9px] text-gray-700 font-black hover:underline">+ Add Row</button>
                        </div>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {variants.length === 0 ? (
                            <div className="text-center py-4 rounded-sm border border-dashed border-gray-200 bg-gray-50">
                              <p className="text-[10px] text-gray-400">No variants configured. Click "+ Add Row" above.</p>
                            </div>
                          ) : variants.map((v, i) => (
                            <div key={v.id || i} className="border border-gray-200 rounded-sm p-2.5 bg-white space-y-2 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-gray-600 uppercase">Variant #{i + 1}</span>
                                <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              </div>
                              {attrKeys.length > 0 && (
                                <div className={`grid gap-1.5 ${attrKeys.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                  {attrKeys.map(key => (
                                    <div key={key}>
                                      <label className={labelCls}>{key}</label>
                                      <input type="text" value={v.attributes?.[key] || ''} onChange={e => updateVariantAttr(i, key, e.target.value)} placeholder="e.g. Red" className={inputCls} />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-gray-100">
                                {[
                                  { lbl: 'SKU', field: 'sku', type: 'text', ph: 'SKU-001' },
                                  { lbl: 'Price (Rs.)', field: 'price', type: 'number', ph: '0.00' },
                                  { lbl: 'Stock', field: 'stockQuantity', type: 'number', ph: '0' },
                                ].map(f => (
                                  <div key={f.field}>
                                    <label className={labelCls}>{f.lbl}</label>
                                    <input type={f.type} value={v[f.field]} onChange={e => updateVariant(i, f.field, e.target.value)} placeholder={f.ph} className={inputCls} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Single Product */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                        <h3 className="text-xs font-bold text-gray-800">Pricing & Stock</h3>
                        <button onClick={() => { setF('hasVariants', true); if (variants.length === 0) { setAttrKeys(['Size']); setVariants([{ sku: '', price: '', stockQuantity: '', attributes: { 'Size': '' } }]); } }}
                          className="text-[10px] text-blue-600 font-bold hover:underline">Enable Variants</button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={labelCls}>Price (Rs.)</label><input type="number" value={form.price} onChange={e => setF('price', e.target.value)} className={inputCls} placeholder="0.00" /></div>
                        <div><label className={labelCls}>Stock Quantity</label><input type="number" value={form.stockQuantity} onChange={e => setF('stockQuantity', e.target.value)} className={inputCls} placeholder="0" /></div>
                      </div>

                      {/* On Sale */}
                      <div className={`border rounded-sm p-2.5 ${form.onSale ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.onSale} onChange={e => setF('onSale', e.target.checked)} className="w-3.5 h-3.5 rounded accent-amber-600 cursor-pointer" />
                          <span className="text-[11px] font-bold text-gray-800">Product On Sale</span>
                        </label>
                        {form.onSale && (
                          <div className="mt-2 pt-2 border-t border-amber-200">
                            <label className={labelCls}>Discount Price (Rs.)</label>
                            <input type="number" value={form.discountPrice} onChange={e => setF('discountPrice', e.target.value)} className={inputCls} placeholder="0.00" />
                          </div>
                        )}
                      </div>

                      {/* Shipping */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className={labelCls}>Shipping</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.freeShipping} onChange={e => setF('freeShipping', e.target.checked)} className="w-3.5 h-3.5 rounded accent-gray-900 cursor-pointer" />
                          <span className="text-[11px] font-bold text-gray-800">Free Shipping Eligible</span>
                        </label>
                        {!form.freeShipping && (
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className={labelCls}>Inside Valley (Rs.)</label><input type="number" value={form.insideValleyShipping} onChange={e => setF('insideValleyShipping', e.target.value)} className={inputCls} placeholder="100" /></div>
                            <div><label className={labelCls}>Outside Valley (Rs.)</label><input type="number" value={form.outsideValleyShipping} onChange={e => setF('outsideValleyShipping', e.target.value)} className={inputCls} placeholder="200" /></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── IMAGES ── */}
              {activeTab === 'images' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 mb-2">Active Product Images</h3>
                    {(!editing.imagePaths || editing.imagePaths.length === 0) ? (
                      <p className="text-[10px] text-gray-400">No images uploaded for this product.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {editing.imagePaths.map((path, idx) => (
                          <div key={idx} className="relative aspect-square rounded-sm overflow-hidden border border-gray-200 bg-gray-50 group">
                            <img src={imgSrc(path)} alt="Product" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gray-900/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <span className="text-[8px] text-white font-black bg-gray-900/60 px-1.5 py-0.5 rounded-sm">Image {idx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-800">Add New Images</h3>
                      <p className="text-[9px] text-gray-400">PNG, JPG, WEBP</p>
                    </div>
                    <div className="relative border border-dashed border-gray-200 hover:border-gray-400 rounded-sm p-4 bg-gray-50/20 hover:bg-gray-50 transition-all text-center cursor-pointer group">
                      <input type="file" multiple accept="image/*" onChange={handleImageUploadChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="p-1.5 bg-white border border-gray-200 rounded-sm group-hover:border-gray-400 transition-colors shadow-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600">Browse Images</span>
                        <span className="text-[9px] text-gray-400">New images will be appended on save</span>
                      </div>
                    </div>
                    {newImages.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-600">{newImages.length} image{newImages.length > 1 ? 's' : ''} queued</span>
                          <button onClick={() => setNewImages([])} className="text-[10px] text-red-500 font-bold hover:underline">Clear all</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {newImages.map((file, idx) => {
                            const url = URL.createObjectURL(file);
                            return (
                              <div key={idx} className="relative aspect-square rounded-sm overflow-hidden border border-gray-200 bg-gray-50 group">
                                <img src={url} alt="Queue Preview" className="w-full h-full object-cover" />
                                <button onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 p-0.5 rounded-sm bg-white/90 text-red-500 hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2.5">
              <button onClick={closeEdit} className="flex-1 py-1.5 rounded-sm border border-gray-200 text-[10px] font-black text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-1.5 rounded-sm bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors">
                {saving && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
