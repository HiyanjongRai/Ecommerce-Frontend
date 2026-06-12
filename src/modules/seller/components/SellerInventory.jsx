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

const imgSrc = (p) => p?.startsWith('http') ? p : `${BASE_URL}${p?.startsWith('/') ? '' : '/'}${p}`;

const Badge = ({ status }) => {
  const s = (status || '').toUpperCase();
  const cls = s === 'ACTIVE' ? 'bg-[#E6FAF5] text-[#05CD99]' : s === 'INACTIVE' ? 'bg-[#FDE9E8] text-[#EE5D50]' : 'bg-[#F4F7FE] text-[#4318FF]';
  return <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${cls}`}>{status}</span>;
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-[8px] font-bold text-[#A3AED0] mb-0.5 uppercase tracking-wider">{label}</label>
    <input className="w-full border border-gray-200 rounded px-2 py-1.5 text-[11px] text-[#2B3674] focus:outline-none focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 transition-all bg-gray-50/50" {...props} />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div>
    <label className="block text-[8px] font-bold text-[#A3AED0] mb-0.5 uppercase tracking-wider">{label}</label>
    <textarea rows={2} className="w-full border border-gray-200 rounded px-2 py-1.5 text-[11px] text-[#2B3674] focus:outline-none focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 transition-all resize-none bg-gray-50/50" {...props} />
  </div>
);

export default function SellerInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(null); // productId being loaded for edit
  const [form, setForm] = useState({});
  const [variants, setVariants] = useState([]);
  // attrKeys: the canonical attribute keys for this product (e.g. ['Color', 'Storage'])
  const [attrKeys, setAttrKeys] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [alerts, setAlerts] = useState([]);

  // Active tab/category selection: null (options screen), 'details', 'inventory', 'images'
  const [activeTab, setActiveTab] = useState(null);
  const [newImages, setNewImages] = useState([]);

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
      // Fetch full product detail to get variant data
      const res = await getProductDetail(pid);
      const full = res.data;
      setEditing(full);
      setForm({
        name: full.name || '',
        shortDescription: full.shortDescription || '',
        description: full.description || '',
        category: full.category || '',
        brand: full.brand || '',
        price: full.price ?? '',
        discountPrice: full.discountPrice ?? '',
        onSale: full.onSale ?? false,
        stockQuantity: full.stockQuantity ?? '',
        specification: full.specification || '',
        features: full.features || '',
        warrantyMonths: full.warrantyMonths ?? '',
        freeShipping: full.freeShipping ?? false,
        insideValleyShipping: full.insideValleyShipping ?? '',
        outsideValleyShipping: full.outsideValleyShipping ?? '',
        hasVariants: full.hasVariants ?? false,
      });
      const vars = full.variants || [];
      const keys = [...new Set(vars.flatMap(v => Object.keys(v.attributes || {})))];
      setAttrKeys(keys);
      setVariants(vars.map(v => ({
        id: v.id,
        sku: v.sku || '',
        price: v.price ?? '',
        stockQuantity: v.stockQuantity ?? '',
        attributes: { ...v.attributes },
      })));
      setNewAttrKey('');
      setActiveTab(null);
      setNewImages([]);
    } catch (e) {
      toast('Failed to load product details.', 'error');
    } finally {
      setLoadingEdit(null);
    }
  };

  const closeEdit = () => { 
    setEditing(null); 
    setForm({}); 
    setVariants([]); 
    setAttrKeys([]); 
    setNewImages([]);
    setActiveTab(null);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Update a top-level field of a variant (sku, price, stockQuantity)
  const updateVariant = (i, k, v) =>
    setVariants(vs => vs.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  // Update a single attribute value inside a variant
  const updateVariantAttr = (i, attrKey, val) =>
    setVariants(vs => vs.map((row, idx) =>
      idx === i ? { ...row, attributes: { ...row.attributes, [attrKey]: val } } : row
    ));

  // Add a new attribute key to ALL variants
  const addAttrKey = () => {
    const key = newAttrKey.trim();
    if (!key || attrKeys.includes(key)) return;
    setAttrKeys(prev => [...prev, key]);
    setVariants(vs => vs.map(v => ({ ...v, attributes: { ...v.attributes, [key]: '' } })));
    setNewAttrKey('');
  };

  // Remove an attribute key from ALL variants
  const removeAttrKey = (key) => {
    setAttrKeys(prev => prev.filter(k => k !== key));
    setVariants(vs => vs.map(v => {
      const attrs = { ...v.attributes };
      delete attrs[key];
      return { ...v, attributes: attrs };
    }));
  };

  const addVariant = () => {
    const blankAttrs = {};
    attrKeys.forEach(k => { blankAttrs[k] = ''; });
    setVariants(vs => [...vs, { sku: '', price: '', stockQuantity: '', attributes: blankAttrs }]);
  };

  // Completely remove variant locally (will sync with backend, making it active=false)
  const removeVariant = (i) => setVariants(vs => vs.filter((_, idx) => idx !== i));

  // New Image addition
  const handleImageUploadChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(prev => [...prev, ...files]);
  };

  const removeNewImage = (idx) => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        // Exclude stockQuantity if product has variants to avoid BusinessValidationException
        if (form.hasVariants && k === 'stockQuantity') {
          return;
        }
        if (v !== '' && v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      
      if (form.hasVariants) {
        const variantsPayload = variants.map(v => ({
          id: v.id,
          sku: v.sku,
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity),
          attributes: v.attributes,
        }));
        fd.append('variantsJson', JSON.stringify(variantsPayload));
      }

      if (newImages.length > 0) {
        newImages.forEach(img => {
          fd.append('newImages', img);
        });
      }

      await updateSellerProduct(editing.id || editing.productId, fd);
      toast('Product updated successfully!', 'success');
      closeEdit();
      load();
    } catch (e) {
      toast(e.response?.data?.message || 'Update failed.', 'error');
    } finally { setSaving(false); }
  };

  const handleStatusToggle = async (p) => {
    const newStatus = (p.status || '').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateSellerProductStatus(p.id || p.productId, newStatus);
      toast(`Product marked ${newStatus}`, 'success');
      load();
    } catch { toast('Status update failed.', 'error'); }
  };

  const handleDelete = async (p) => {
    try {
      await deleteSellerProduct(p.id || p.productId);
      toast('Product deleted.', 'success');
      setConfirmDelete(null);
      load();
    } catch { toast('Delete failed.', 'error'); }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await acknowledgeSellerInventoryAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast('Alert acknowledged.', 'success');
    } catch {
      toast('Failed to acknowledge alert.', 'error');
    }
  };

  const filtered = products.filter(p =>
    !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3.5 max-w-[1400px]">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-[#2B3674]">Inventory</h1>
            <p className="text-[#A3AED0] text-[11px] font-medium">Edit products, variants, stock and pricing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#F4F7FE] rounded-full px-3 py-1.5 w-[180px]">
            <svg className="w-3.5 h-3.5 text-[#A3AED0]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="bg-transparent border-none outline-none text-xs ml-1.5 w-full text-[#2B3674] placeholder-[#A3AED0]" />
          </div>
          <span className="bg-[#F4F7FE] text-[#4318FF] text-[10px] font-bold px-3 py-1.5 rounded-full">{filtered.length} Products</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-800">Inventory Alerts</h2>
              <p className="text-[10px] font-semibold text-amber-700">Low stock and out-of-stock notices from the backend.</p>
            </div>
            <span className="text-[10px] font-black text-amber-800">{alerts.length} open</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white/80 border border-amber-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-gray-800 truncate">{alert.productName}</p>
                  <p className="text-[10px] font-semibold text-gray-500 truncate">{alert.message || alert.alertType}</p>
                  <p className="text-[9px] text-amber-700 font-bold">Stock: {alert.currentStock ?? 0} / Threshold: {alert.thresholdStock ?? '-'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <svg className="animate-spin w-5 h-5 text-[#4318FF]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)]">
          <div className="w-12 h-12 rounded-xl bg-[#F4F7FE] flex items-center justify-center mx-auto mb-3 text-[#4318FF]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <p className="text-[#2B3674] font-semibold text-xs">No products found</p>
          <p className="text-[#A3AED0] text-[10px] mt-0.5">Add products from the Products section.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)] overflow-hidden p-4 md:p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Variants', 'Actions'].map(h => (
                    <th key={h} className="py-2 px-2 text-[10px] font-semibold text-[#A3AED0]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pid = p.id || p.productId;
                  const img = p.imagePaths?.[0];
                  return (
                    <tr key={pid} className="border-b border-gray-50/50 hover:bg-[#F4F7FE]/20 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F4F7FE] overflow-hidden flex-shrink-0 flex items-center justify-center text-sm">
                            {img ? <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} /> : <span>📦</span>}
                          </div>
                          <div>
                            <p className="font-bold text-[#2B3674] text-xs max-w-[180px] truncate">{p.name}</p>
                            <p className="text-[#A3AED0] text-[10px]">{p.brand || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-[#A3AED0] text-xs">{p.category || '—'}</td>
                      <td className="py-2.5 px-2 font-bold text-[#2B3674] text-xs">Rs. {Number(p.price || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-2">
                        <span className={`font-bold text-xs ${(p.stockQuantity || 0) < 5 ? 'text-[#EE5D50]' : 'text-[#2B3674]'}`}>
                          {p.hasVariants ? `${(p.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0)} (var)` : (p.stockQuantity ?? '—')}
                        </span>
                      </td>
                      <td className="py-2.5 px-2"><Badge status={p.status} /></td>
                      <td className="py-2.5 px-2 text-[#A3AED0] text-xs">{p.hasVariants ? (p.variants?.length || 0) : '—'}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            disabled={loadingEdit === pid}
                            className="p-1.5 rounded-lg bg-[#F4F7FE] text-[#4318FF] hover:bg-[#4318FF] hover:text-white transition-all disabled:opacity-60"
                            title="Edit"
                          >
                            {loadingEdit === pid ? (
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            )}
                          </button>
                          <button onClick={() => handleStatusToggle(p)} className="p-1.5 rounded-lg bg-[#F4F7FE] text-[#A3AED0] hover:bg-[#E6FAF5] hover:text-[#05CD99] transition-all" title="Toggle Status">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </button>
                          <button onClick={() => setConfirmDelete(p)} className="p-1.5 rounded-lg bg-[#F4F7FE] text-[#A3AED0] hover:bg-[#FDE9E8] hover:text-[#EE5D50] transition-all" title="Delete">
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-[#2B3674]/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-xs shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-[#FDE9E8] flex items-center justify-center mx-auto mb-3 text-[#EE5D50]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 className="text-sm font-bold text-[#2B3674] text-center mb-1">Delete Product?</h3>
            <p className="text-[#A3AED0] text-[10px] text-center mb-4">This will permanently delete <span className="font-bold text-[#2B3674]">"{confirmDelete.name}"</span>.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-[#2B3674] font-semibold text-xs hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-1.5 rounded-lg bg-[#EE5D50] text-white font-semibold text-xs hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Side Panel */}
      {editing && (
        <div className="fixed inset-0 bg-[#2B3674]/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#2B3674]">
                  {activeTab ? `Edit ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` : 'Select Category to Edit'}
                </h2>
                <p className="text-[#A3AED0] text-[11px] truncate max-w-xs">{editing.name}</p>
              </div>
              <button onClick={closeEdit} className="p-1.5 rounded-lg bg-[#F4F7FE] text-[#A3AED0] hover:text-[#2B3674] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              
              {/* CATEGORY SELECTOR (activeTab is null) */}
              {!activeTab && (
                <div className="space-y-1.5 py-0.5 animate-in fade-in duration-200">
                  <p className="text-[8px] font-black text-[#A3AED0] uppercase tracking-wider mb-1.5">Choose an edit option:</p>
                  
                  {[
                    {
                      id: 'details',
                      title: 'Edit Product Details',
                      desc: 'Modify basic info, description, brand, category, specifications, and warranty.',
                      color: 'text-[#4318FF] bg-[#F4F7FE]',
                      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    },
                    {
                      id: 'inventory',
                      title: 'Edit Inventory & Pricing',
                      desc: 'Adjust price, stock levels, campaigns, fees, or variant attributes.',
                      color: 'text-[#05CD99] bg-[#E6FAF5]',
                      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                    },
                    {
                      id: 'images',
                      title: 'Edit Product Images',
                      desc: 'Preview existing media assets or upload new product photos.',
                      color: 'text-[#FFB547] bg-[#FFF8ED]',
                      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                    }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className="w-full text-left p-1.5 px-2 border border-gray-100/70 rounded-md hover:border-[#4318FF]/20 bg-white hover:bg-[#F4F7FE]/30 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all flex items-center gap-2 group"
                    >
                      <div className={`p-1 rounded ${cat.color} group-hover:scale-105 transition-transform shrink-0`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[10px] text-[#2B3674] group-hover:text-[#4318FF] transition-colors leading-normal">{cat.title}</h3>
                        <p className="text-[8px] text-[#A3AED0] line-clamp-1 leading-normal">{cat.desc}</p>
                      </div>
                      <div className="text-[#A3AED0] group-hover:text-[#4318FF] transition-colors shrink-0">
                        <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* DETAILS FORM */}
              {activeTab === 'details' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <button 
                    onClick={() => setActiveTab(null)} 
                    className="flex items-center gap-1 text-[10px] font-bold text-[#4318FF] hover:underline uppercase tracking-wide mb-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Edit Options
                  </button>
                  
                  <Input label="Product Name" value={form.name} onChange={e => setF('name', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Category" value={form.category} onChange={e => setF('category', e.target.value)} />
                    <Input label="Brand" value={form.brand} onChange={e => setF('brand', e.target.value)} />
                  </div>
                  <Textarea label="Short Description" value={form.shortDescription} onChange={e => setF('shortDescription', e.target.value)} />
                  <Textarea label="Full Description" value={form.description} onChange={e => setF('description', e.target.value)} rows={3} />
                  <Textarea label="Specifications" value={form.specification} onChange={e => setF('specification', e.target.value)} />
                  <Input label="Warranty (months)" type="number" value={form.warrantyMonths} onChange={e => setF('warrantyMonths', e.target.value)} />
                </div>
              )}

              {/* INVENTORY & VARIANT FORM */}
              {activeTab === 'inventory' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <button 
                    onClick={() => setActiveTab(null)} 
                    className="flex items-center gap-1 text-[10px] font-bold text-[#4318FF] hover:underline uppercase tracking-wide mb-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Edit Options
                  </button>

                  {form.hasVariants ? (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-[#2B3674]">Product Variants</h3>
                          <p className="text-[10px] text-[#A3AED0] mt-0.5">Edit variant attributes, pricing, stock levels, or remove them.</p>
                        </div>
                        <span className="bg-[#F4F7FE] text-[#4318FF] text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {variants.length} active variants
                        </span>
                      </div>

                      {/* Attributes Configuration Section */}
                      <div className="bg-[#F4F7FE]/60 rounded-lg p-2.5 space-y-1.5 border border-gray-100/85">
                        <label className="block text-[8px] font-black text-[#2B3674] uppercase tracking-wider">1. Define Attribute Keys (e.g. Color, Storage, Size)</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="e.g. Color"
                            value={newAttrKey}
                            onChange={e => setNewAttrKey(e.target.value)}
                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-[11px] text-[#2B3674] focus:outline-none focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 bg-white"
                          />
                          <button
                            type="button"
                            onClick={addAttrKey}
                            className="px-2.5 py-1 bg-[#4318FF] hover:bg-[#3311cc] text-white text-[11px] font-bold rounded transition-colors shrink-0"
                          >
                            + Add Key
                          </button>
                        </div>
                        
                        {attrKeys.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {attrKeys.map(key => (
                              <span key={key} className="flex items-center gap-1 bg-white border border-gray-200 text-[9px] font-bold text-[#2B3674] pl-2 pr-1 py-0.5 rounded shadow-sm">
                                {key}
                                <button
                                  type="button"
                                  onClick={() => removeAttrKey(key)}
                                  className="text-[#EE5D50] hover:text-red-700 font-bold text-sm leading-none shrink-0"
                                  title={`Remove ${key} from all variants`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] text-[#A3AED0]">Define at least one attribute key before setting up variant options.</p>
                        )}
                      </div>

                      {/* Variant List config */}
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-[8px] font-black text-[#2B3674] uppercase tracking-wider">2. Configure Variants</label>
                          <button
                            type="button"
                            onClick={() => {
                              setF('hasVariants', false);
                            }}
                            className="text-[9px] text-[#EE5D50] font-bold hover:underline"
                          >
                            Disable Variants
                          </button>
                        </div>

                        {variants.length === 0 ? (
                          <div className="text-center py-4 rounded bg-[#F4F7FE]/40 border border-dashed border-gray-200">
                            <p className="text-[#A3AED0] text-[11px]">No variant options configured. Click below to add a variant row.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {variants.map((v, i) => (
                              <div key={v.id || i} className="border border-gray-100 rounded-lg p-2.5 bg-white shadow-[0_1.5px_4px_rgba(0,0,0,0.01)] relative group hover:border-[#4318FF]/20 transition-all space-y-2">
                                
                                {/* Remove Variant Button */}
                                <button
                                  type="button"
                                  onClick={() => removeVariant(i)}
                                  className="absolute top-1.5 right-1.5 p-0.5 rounded text-[#EE5D50] hover:bg-[#FDE9E8] transition-all"
                                  title="Remove Variant"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                
                                <div className="text-[9px] font-black text-[#4318FF]">Variant #{i + 1}</div>

                                {/* Dynamic inputs for attributes */}
                                {attrKeys.length > 0 && (
                                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-dashed border-gray-100">
                                    {attrKeys.map(key => (
                                      <div key={key}>
                                        <label className="block text-[8px] font-bold text-[#A3AED0] mb-0.5 uppercase tracking-wider">{key}</label>
                                        <input
                                          type="text"
                                          value={v.attributes?.[key] || ''}
                                          onChange={e => updateVariantAttr(i, key, e.target.value)}
                                          placeholder={`e.g. Red, XL`}
                                          className="w-full border border-gray-200 rounded px-2 py-1 text-[11px] text-[#2B3674] focus:outline-none focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/10 transition-all bg-gray-50/50"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Editable SKU, Price, Stock fields */}
                                <div className="grid grid-cols-3 gap-2">
                                  <Input
                                    label="SKU"
                                    value={v.sku}
                                    onChange={e => updateVariant(i, 'sku', e.target.value)}
                                    placeholder="SKU"
                                  />
                                  <Input
                                    label="Price (Rs.)"
                                    type="number"
                                    value={v.price}
                                    onChange={e => updateVariant(i, 'price', e.target.value)}
                                    placeholder="Price"
                                  />
                                  <Input
                                    label="Stock"
                                    type="number"
                                    value={v.stockQuantity}
                                    onChange={e => updateVariant(i, 'stockQuantity', e.target.value)}
                                    placeholder="Stock"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Variant Trigger */}
                        <button
                          type="button"
                          onClick={addVariant}
                          className="w-full py-2 rounded-lg border border-dashed border-[#4318FF]/20 hover:border-[#4318FF]/40 text-[#4318FF] hover:bg-[#F4F7FE]/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 group shadow-sm"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add New Variant Row
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Pricing & Stock for single products */
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center pb-1 border-b border-gray-50">
                        <h3 className="text-xs font-bold text-[#2B3674]">Pricing & Stock</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setF('hasVariants', true);
                            if (variants.length === 0) {
                              setAttrKeys(['Size']);
                              setVariants([{ sku: '', price: '', stockQuantity: '', attributes: { 'Size': '' } }]);
                            }
                          }}
                          className="text-[10px] text-[#4318FF] font-bold hover:underline"
                        >
                          Enable Product Variants
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Price (Rs.)" type="number" value={form.price} onChange={e => setF('price', e.target.value)} />
                        <Input label="Stock Quantity" type="number" value={form.stockQuantity} onChange={e => setF('stockQuantity', e.target.value)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.onSale} onChange={e => setF('onSale', e.target.checked)} className="w-3.5 h-3.5 rounded text-[#4318FF] focus:ring-0 accent-[#4318FF] cursor-pointer" />
                          <span className="text-xs font-bold text-[#2B3674]">Product On Sale</span>
                        </label>
                      </div>
                      {form.onSale && (
                        <div className="animate-in slide-in-from-top-1.5 duration-200">
                          <Input label="Discount Price (Rs.)" type="number" value={form.discountPrice} onChange={e => setF('discountPrice', e.target.value)} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shipping Details */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-[#2B3674]">Shipping Config</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.freeShipping} onChange={e => setF('freeShipping', e.target.checked)} className="w-3.5 h-3.5 rounded text-[#4318FF] focus:ring-0 accent-[#4318FF] cursor-pointer" />
                      <span className="text-xs font-bold text-[#2B3674]">Free Shipping Eligible</span>
                    </label>
                    {!form.freeShipping && (
                      <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1.5 duration-200">
                        <Input label="Inside Valley Cost (Rs.)" type="number" value={form.insideValleyShipping} onChange={e => setF('insideValleyShipping', e.target.value)} />
                        <Input label="Outside Valley Cost (Rs.)" type="number" value={form.outsideValleyShipping} onChange={e => setF('outsideValleyShipping', e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* IMAGES FORM */}
              {activeTab === 'images' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <button 
                    onClick={() => setActiveTab(null)} 
                    className="flex items-center gap-1 text-[10px] font-bold text-[#4318FF] hover:underline uppercase tracking-wide mb-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Edit Options
                  </button>

                  {/* Current Active Product Images */}
                  <div>
                    <h3 className="text-xs font-bold text-[#2B3674] mb-2">Active Product Images</h3>
                    {(!editing.imagePaths || editing.imagePaths.length === 0) ? (
                      <p className="text-xs text-[#A3AED0]">No images currently uploaded for this product.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {editing.imagePaths.map((path, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-[#F4F7FE] group">
                            <img src={imgSrc(path)} alt="Product" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[#2B3674]/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold bg-[#4318FF] px-1.5 py-0.5 rounded">Active Image</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Images Section */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div>
                      <h3 className="text-xs font-bold text-[#2B3674]">Add New Images</h3>
                      <p className="text-[10px] text-[#A3AED0] mt-0.5">Select high-quality images to upload.</p>
                    </div>

                    {/* Premium Dropzone File Input */}
                    <div className="relative border border-dashed border-gray-200 hover:border-[#4318FF]/40 rounded-lg p-4 bg-[#F4F7FE]/20 hover:bg-[#F4F7FE]/40 transition-all text-center cursor-pointer group">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageUploadChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-gray-500">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-[#4318FF] group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-[#2B3674] mt-0.5">Browse Images</span>
                        <span className="text-[9px] text-[#A3AED0]">PNG, JPG, JPEG or WEBP</span>
                      </div>
                    </div>

                    {/* Preview Uploading Images */}
                    {newImages.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-[#2B3674]">{newImages.length} images queued</span>
                          <button type="button" onClick={() => setNewImages([])} className="text-[10px] text-[#EE5D50] font-bold hover:underline">Clear all</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {newImages.map((file, idx) => {
                            const url = URL.createObjectURL(file);
                            return (
                              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-[#F4F7FE] group">
                                <img src={url} alt="Queue Preview" className="w-full h-full object-cover" />
                                <button 
                                  type="button" 
                                  onClick={() => removeNewImage(idx)} 
                                  className="absolute top-1 right-1 p-0.5 rounded bg-white/90 text-[#EE5D50] hover:bg-white transition-all shadow-sm"
                                  title="Remove image"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
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
              <button 
                onClick={activeTab ? () => setActiveTab(null) : closeEdit} 
                className="flex-1 py-1.5 rounded-lg border border-gray-200 text-[#2B3674] font-bold text-xs hover:bg-gray-50 transition-colors"
              >
                {activeTab ? 'Back' : 'Cancel'}
              </button>
              
              {activeTab && (
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="flex-1 py-1.5 rounded-lg bg-[#4318FF] text-white font-bold text-xs hover:bg-[#3311cc] disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#4318FF]/10"
                >
                  {saving && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
