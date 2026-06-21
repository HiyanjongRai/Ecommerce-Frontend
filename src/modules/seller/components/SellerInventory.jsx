import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getSellerInventory,
  updateSellerProduct,
  updateSellerProductStatus,
  deleteSellerProduct,
  getProductDetail,
  getSellerUnacknowledgedAlerts,
  acknowledgeSellerInventoryAlert,
  createSellerProduct,
} from '../services/sellerService';
import { toast } from '../../../shared/contexts/ToastContext';
import { useSellerTheme } from '../hooks/useSellerTheme';

// ── Sub-components ────────────────────────────────────────────────────────────
import { SkeletonCard, SkeletonRow } from './inventory/InventoryComponents';
import InventoryToolbar   from './inventory/InventoryToolbar';
import InventoryAlerts    from './inventory/InventoryAlerts';
import InventoryTable     from './inventory/InventoryTable';
import InventoryBulkBar   from './inventory/InventoryBulkBar';
import InventoryInsights  from './inventory/InventoryInsights';
import InventoryModals    from './inventory/InventoryModals';

// ─────────────────────────────────────────────────────────────────────────────

export default function SellerInventory() {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  const [searchParams, setSearchParams] = useSearchParams();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [products,  setProducts]  = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ── Filters / search / sort ───────────────────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('ALL');
  const [categoryFilter,  setCategoryFilter]  = useState('ALL');
  const [sortBy,          setSortBy]          = useState('DEFAULT');

  // ── Edit / create panel ───────────────────────────────────────────────────
  const [editing,      setEditing]      = useState(null);
  const [loadingEdit,  setLoadingEdit]  = useState(null);
  const [form,         setForm]         = useState({});
  const [variants,     setVariants]     = useState([]);
  const [attrKeys,     setAttrKeys]     = useState([]);
  const [newAttrKey,   setNewAttrKey]   = useState('');
  const [activeTab,    setActiveTab]    = useState('details');
  const [newImages,    setNewImages]    = useState([]);
  const [saving,       setSaving]       = useState(false);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Stock updater ─────────────────────────────────────────────────────────
  const [updatingStockId, setUpdatingStockId] = useState(null);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // ── Bulk selection ────────────────────────────────────────────────────────
  const [selectedIds,     setSelectedIds]     = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerInventory();
      const list = res.data?.content || res.data || [];
      setProducts(Array.isArray(list) ? list : []);
      const alertRes = await getSellerUnacknowledgedAlerts().catch(() => ({ data: [] }));
      setAlerts(Array.isArray(alertRes.data) ? alertRes.data : []);
    } catch {
      setProducts([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Reset pagination when filters change
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, categoryFilter, sortBy]);

  // Handle productId URL param (e.g. from notifications deep-link)
  useEffect(() => {
    const pid = searchParams.get('productId');
    if (pid && products.length > 0) {
      const p = products.find((prod) => String(prod.id || prod.productId) === String(pid));
      if (p) {
        openEdit(p);
        const next = new URLSearchParams(searchParams);
        next.delete('productId');
        setSearchParams(next);
      }
    }
  }, [searchParams, products]);

  // ─────────────────────────────────────────────────────────────────────────
  // Form helpers
  // ─────────────────────────────────────────────────────────────────────────

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ─────────────────────────────────────────────────────────────────────────
  // Edit / Create panel handlers
  // ─────────────────────────────────────────────────────────────────────────

  const openEdit = async (p) => {
    const pid = p.id || p.productId;
    setLoadingEdit(pid);
    try {
      const res  = await getProductDetail(pid);
      const full = res.data;
      setEditing(full);
      setForm({
        name:                 full.name                 || '',
        shortDescription:     full.shortDescription     || '',
        description:          full.description          || '',
        category:             full.category             || '',
        brand:                full.brand                || '',
        price:                full.price                ?? '',
        discountPrice:        full.discountPrice        ?? '',
        onSale:               full.onSale               ?? false,
        stockQuantity:        full.stockQuantity        ?? '',
        specification:        full.specification        || '',
        features:             full.features             || '',
        warrantyMonths:       full.warrantyMonths        ?? '',
        freeShipping:         full.freeShipping         ?? false,
        insideValleyShipping: full.insideValleyShipping ?? '',
        outsideValleyShipping:full.outsideValleyShipping?? '',
        hasVariants:          full.hasVariants          ?? false,
      });
      const vars = full.variants || [];
      const keys = [...new Set(vars.flatMap((v) => Object.keys(v.attributes || {})))];
      setAttrKeys(keys);
      setVariants(
        vars.map((v) => ({
          id:            v.id,
          sku:           v.sku          || '',
          price:         v.price         ?? '',
          stockQuantity: v.stockQuantity ?? '',
          attributes:    { ...v.attributes },
        }))
      );
      setNewAttrKey('');
      setActiveTab('details');
      setNewImages([]);
    } catch {
      toast('Failed to load product details.', 'error');
    } finally {
      setLoadingEdit(null);
    }
  };

  const openCreate = () => {
    setEditing({ id: 'new', isCreation: true, name: 'New Product' });
    setForm({
      name: '', shortDescription: '', description: '', category: '',
      brand: '', price: '', discountPrice: '',
      onSale: false, stockQuantity: '',
      specification: '', features: '',
      warrantyMonths: '', freeShipping: false,
      insideValleyShipping: '', outsideValleyShipping: '',
      hasVariants: false,
    });
    setAttrKeys(['Size']);
    setVariants([{ sku: '', price: '', stockQuantity: '', attributes: { Size: '' } }]);
    setNewAttrKey('');
    setActiveTab('details');
    setNewImages([]);
  };

  const closeEdit = () => {
    setEditing(null);
    setForm({});
    setVariants([]);
    setAttrKeys([]);
    setNewImages([]);
    setActiveTab('details');
  };

  // ── Variant field helpers ─────────────────────────────────────────────────

  const updateVariant = (i, k, v) =>
    setVariants((vs) => vs.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  const updateVariantAttr = (i, attrKey, val) =>
    setVariants((vs) =>
      vs.map((row, idx) =>
        idx === i ? { ...row, attributes: { ...row.attributes, [attrKey]: val } } : row
      )
    );

  const addAttrKey = () => {
    const key = newAttrKey.trim();
    if (!key || attrKeys.includes(key)) return;
    setAttrKeys((prev) => [...prev, key]);
    setVariants((vs) => vs.map((v) => ({ ...v, attributes: { ...v.attributes, [key]: '' } })));
    setNewAttrKey('');
  };

  const removeAttrKey = (key) => {
    setAttrKeys((prev) => prev.filter((k) => k !== key));
    setVariants((vs) =>
      vs.map((v) => {
        const attrs = { ...v.attributes };
        delete attrs[key];
        return { ...v, attributes: attrs };
      })
    );
  };

  const addVariant = () => {
    const blankAttrs = {};
    attrKeys.forEach((k) => { blankAttrs[k] = ''; });
    setVariants((vs) => [...vs, { sku: '', price: '', stockQuantity: '', attributes: blankAttrs }]);
  };

  const removeVariant = (i) => setVariants((vs) => vs.filter((_, idx) => idx !== i));

  // Called by the "Enable variants mode" button inside the modal
  const handleEnableVariantsMode = () => {
    setF('hasVariants', true);
    if (variants.length === 0) {
      setAttrKeys(['Size']);
      setVariants([{ sku: '', price: '', stockQuantity: '', attributes: { Size: '' } }]);
    }
  };

  // ── Image helpers ─────────────────────────────────────────────────────────

  const handleImageUploadChange = (e) =>
    setNewImages((prev) => [...prev, ...Array.from(e.target.files)]);

  const removeNewImage = (idx) => {
    if (idx === -1) {
      setNewImages([]);                                   // clear all (queue clear button)
    } else {
      setNewImages((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Save handler
  // ─────────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!form.name?.trim()) {
        setActiveTab('details');
        throw new Error('Product name is required.');
      }
      if (!form.price) {
        setActiveTab('inventory');
        throw new Error('Selling price is required.');
      }
      if (!form.hasVariants && (form.stockQuantity === '' || form.stockQuantity == null)) {
        setActiveTab('inventory');
        throw new Error('Stock quantity is required.');
      }
      if (form.hasVariants) {
        if (variants.length === 0) {
          setActiveTab('inventory');
          throw new Error('Please configure at least one variant.');
        }
        if (variants.some((v) => !v.price || v.stockQuantity === '')) {
          setActiveTab('inventory');
          throw new Error('Each variant requires a price and stock quantity.');
        }
      }

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (form.hasVariants && k === 'stockQuantity') return;
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (form.hasVariants) {
        fd.append(
          'variantsJson',
          JSON.stringify(
            variants.map((v) => ({
              id:            v.id,
              sku:           v.sku,
              price:         Number(v.price),
              stockQuantity: Number(v.stockQuantity),
              attributes:    v.attributes,
            }))
          )
        );
      }

      if (editing?.isCreation) {
        newImages.forEach((img) => fd.append('images', img));
        await createSellerProduct(fd);
        toast('Product created successfully!', 'success');
      } else {
        newImages.forEach((img) => fd.append('newImages', img));
        await updateSellerProduct(editing.id || editing.productId, fd);
        toast('Product updated successfully!', 'success');
      }

      closeEdit();
      load();
    } catch (e) {
      toast(e.message || e.response?.data?.message || 'Action failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Product action handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleStatusToggle = async (p, forceStatus) => {
    const pid        = p.id || p.productId;
    const nextStatus = forceStatus || ((p.status || '').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    try {
      await updateSellerProductStatus(pid, nextStatus);
      toast(`Product marked ${nextStatus.toLowerCase()}`, 'success');
      load();
    } catch {
      toast('Status update failed.', 'error');
    }
  };

  const handleDuplicate = async (p) => {
    const pid = p.id || p.productId;
    try {
      const res  = await getProductDetail(pid);
      const full = res.data;
      setEditing({ id: 'new', isCreation: true, name: `${full.name || ''} (Copy)` });
      setForm({
        name:                 `${full.name || ''} (Copy)`,
        shortDescription:     full.shortDescription     || '',
        description:          full.description          || '',
        category:             full.category             || '',
        brand:                full.brand                || '',
        price:                full.price                ?? '',
        discountPrice:        full.discountPrice        ?? '',
        onSale:               full.onSale               ?? false,
        stockQuantity:        full.stockQuantity        ?? '',
        specification:        full.specification        || '',
        features:             full.features             || '',
        warrantyMonths:       full.warrantyMonths        ?? '',
        freeShipping:         full.freeShipping         ?? false,
        insideValleyShipping: full.insideValleyShipping ?? '',
        outsideValleyShipping:full.outsideValleyShipping?? '',
        hasVariants:          full.hasVariants          ?? false,
      });
      const vars = full.variants || [];
      const keys = [...new Set(vars.flatMap((v) => Object.keys(v.attributes || {})))];
      setAttrKeys(keys);
      setVariants(
        vars.map((v) => ({
          sku:           v.sku ? `${v.sku}-COPY` : '',
          price:         v.price         ?? '',
          stockQuantity: v.stockQuantity ?? '',
          attributes:    { ...v.attributes },
        }))
      );
      setNewAttrKey('');
      setActiveTab('details');
      setNewImages([]);
      toast('Product duplicated. Click Create Listing to save.', 'success');
    } catch {
      toast('Failed to duplicate product.', 'error');
    }
  };

  const handleArchive = async (p) => {
    try {
      await updateSellerProductStatus(p.id || p.productId, 'INACTIVE');
      toast('Product archived (marked inactive)', 'success');
      load();
    } catch {
      toast('Failed to archive product.', 'error');
    }
  };

  const handleDelete = async (p) => {
    try {
      await deleteSellerProduct(p.id || p.productId);
      toast('Product deleted.', 'success');
      setConfirmDelete(null);
      load();
    } catch {
      toast('Delete failed.', 'error');
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await acknowledgeSellerInventoryAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast('Alert acknowledged.', 'success');
    } catch {
      toast('Failed to acknowledge alert.', 'error');
    }
  };

  const handleDirectStockUpdate = async (p, isIncrement) => {
    const pid = p.id || p.productId;
    if (p.hasVariants) {
      toast('Use the Edit panel to adjust variant stock quantities.', 'info');
      return;
    }
    const currentStock = p.stockQuantity ?? 0;
    const nextStock    = isIncrement ? currentStock + 1 : Math.max(0, currentStock - 1);
    setUpdatingStockId(pid);
    try {
      const fd = new FormData();
      fd.append('name',          p.name  || '');
      fd.append('price',         p.price ?? '');
      fd.append('stockQuantity', nextStock);
      await updateSellerProduct(pid, fd);
      const matched = alerts.filter((a) => a.productId === pid);
      for (const alert of matched) {
        await acknowledgeSellerInventoryAlert(alert.id).catch(() => {});
      }
      toast(`Stock updated to ${nextStock}`, 'success');
      await load();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to update stock.', 'error');
    } finally {
      setUpdatingStockId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Bulk action handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleBulkDeactivate = async () => {
    setIsBulkProcessing(true);
    let ok = 0, fail = 0;
    await Promise.allSettled(
      selectedIds.map(async (id) => {
        try { await updateSellerProductStatus(id, 'INACTIVE'); ok++; }
        catch { fail++; }
      })
    );
    toast(`Deactivated ${ok} products.${fail ? ` ${fail} failed.` : ''}`, ok ? 'success' : 'error');
    setSelectedIds([]);
    setIsBulkProcessing(false);
    load();
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete the ${selectedIds.length} selected products?`)) return;
    setIsBulkProcessing(true);
    let ok = 0, fail = 0;
    await Promise.allSettled(
      selectedIds.map(async (id) => {
        try { await deleteSellerProduct(id); ok++; }
        catch { fail++; }
      })
    );
    toast(`Deleted ${ok} products.${fail ? ` ${fail} failed.` : ''}`, ok ? 'success' : 'error');
    setSelectedIds([]);
    setIsBulkProcessing(false);
    load();
  };

  const handleBulkExport = () => {
    const sel = products.filter((p) => selectedIds.includes(p.id || p.productId));
    if (!sel.length) return;
    const headers = ['ID','Name','Category','Brand','Price','Discount Price','On Sale','Stock','Status','Has Variants'];
    const rows = sel.map((p) => {
      const pid = p.id || p.productId;
      const qty = p.hasVariants
        ? (p.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0)
        : (p.stockQuantity ?? 0);
      return [
        pid,
        `"${(p.name        || '').replace(/"/g,'""')}"`,
        `"${(p.category    || '').replace(/"/g,'""')}"`,
        `"${(p.brand       || '').replace(/"/g,'""')}"`,
        p.price         || 0,
        p.discountPrice || '',
        p.onSale ? 'YES' : 'NO',
        qty,
        p.status  || 'DRAFT',
        p.hasVariants ? 'YES' : 'NO',
      ];
    });
    const csv  = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `jhapcham_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast(`Exported ${sel.length} products to CSV`, 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Dropdown toggle
  // ─────────────────────────────────────────────────────────────────────────

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setActiveDropdownId((prev) => (prev === id ? null : id));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived data (computed from state)
  // ─────────────────────────────────────────────────────────────────────────

  const stats = {
    total:      products.length,
    active:     products.filter((p) => (p.status || '').toUpperCase() === 'ACTIVE').length,
    inactive:   products.filter((p) => (p.status || '').toUpperCase() === 'INACTIVE').length,
    lowStock:   products.filter((p) => !p.hasVariants && (p.stockQuantity ?? 0) <= 5 && (p.stockQuantity ?? 0) > 0).length,
    outOfStock: products.filter((p) => !p.hasVariants && (p.stockQuantity ?? 0) === 0).length,
    inventoryValue: products.reduce((sum, p) => {
      const qty = p.hasVariants
        ? (p.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0)
        : (p.stockQuantity ?? 0);
      return sum + qty * Number(p.price || 0);
    }, 0),
  };

  const dynamicCategories = ['ALL', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    const matchSearch = !search || ['name','brand','category'].some(
      (k) => (p[k] || '').toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus   = statusFilter   === 'ALL' || (p.status   || '').toUpperCase() === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'DEFAULT') return 0;
    const qty = (p) =>
      p.hasVariants
        ? (p.variants || []).reduce((s, v) => s + (v.stockQuantity || 0), 0)
        : (p.stockQuantity ?? 0);
    switch (sortBy) {
      case 'name_asc':   return (a.name || '').localeCompare(b.name || '');
      case 'name_desc':  return (b.name || '').localeCompare(a.name || '');
      case 'price_asc':  return Number(a.price || 0) - Number(b.price || 0);
      case 'price_desc': return Number(b.price || 0) - Number(a.price || 0);
      case 'stock_asc':  return qty(a) - qty(b);
      case 'stock_desc': return qty(b) - qty(a);
      case 'status_asc': return (a.status || '').localeCompare(b.status || '');
      case 'status_desc':return (b.status || '').localeCompare(a.status || '');
      default: return 0;
    }
  });

  const totalItems     = sorted.length;
  const totalPages     = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const paginatedIds   = paginatedProducts.map((p) => p.id || p.productId);
  const isAllSelected  = paginatedIds.length > 0 && paginatedIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = paginatedIds.length > 0 && paginatedIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...paginatedIds])]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end   = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2)              end   = 4;
      if (currentPage >= totalPages - 1) start = totalPages - 3;
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleReset = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('DEFAULT');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading skeleton
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`space-y-6 max-w-[1400px] animate-in fade-in-50 duration-300 font-sans ${themeClasses.bg.primary} p-1`}>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-150 dark:bg-zinc-900 rounded w-96 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="p-4 border rounded-xl border-gray-150 dark:border-white/[0.06] bg-white dark:bg-zinc-950 flex flex-col md:flex-row items-center gap-3">
          <div className="h-9 bg-gray-200 dark:bg-zinc-800 rounded-xl flex-1 w-full animate-pulse" />
          <div className="h-9 bg-gray-200 dark:bg-zinc-800 rounded-xl w-full md:w-44 animate-pulse" />
          <div className="h-9 bg-gray-200 dark:bg-zinc-800 rounded-xl w-full md:w-40 animate-pulse" />
          <div className="h-9 bg-gray-200 dark:bg-zinc-800 rounded-xl w-full md:w-28 animate-pulse" />
        </div>
        <div className="border rounded-2xl border-gray-150 dark:border-white/[0.08] bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-zinc-900/40 border-b border-gray-100 dark:border-white/[0.05]">
              <tr>
                {['','Product','Category','Price','Stock','Status','Actions'].map((h, i) => (
                  <th key={i} className="py-3.5 px-5 text-[10px] font-bold uppercase tracking-wider text-gray-300 dark:text-zinc-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-5 max-w-[1400px] animate-in fade-in-50 duration-300 font-sans pb-16 ${themeClasses.bg.primary}`}>

      {/* Header + Metrics + Filters toolbar */}
      <InventoryToolbar
        stats={stats}
        alerts={alerts}
        statusFilter={statusFilter}
        search={search}
        categoryFilter={categoryFilter}
        sortBy={sortBy}
        isDark={isDark}
        dynamicCategories={dynamicCategories}
        onStatusFilter={setStatusFilter}
        onSearch={setSearch}
        onCategory={setCategoryFilter}
        onSort={setSortBy}
        onReset={handleReset}
        onOpenCreate={openCreate}
      />

      {/* Stock alerts center (hidden when empty) */}
      <InventoryAlerts
        alerts={alerts}
        products={products}
        isDark={isDark}
        onAcknowledge={acknowledgeAlert}
        onOpenEdit={openEdit}
      />

      {/* Product table + pagination */}
      <InventoryTable
        paginatedProducts={paginatedProducts}
        isDark={isDark}
        selectedIds={selectedIds}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        activeDropdownId={activeDropdownId}
        updatingStockId={updatingStockId}
        loadingEdit={loadingEdit}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        stats={stats}
        sortBy={sortBy}
        onSort={setSortBy}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onOpenEdit={openEdit}
        onStatusToggle={handleStatusToggle}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onConfirmDelete={setConfirmDelete}
        onDirectStockUpdate={handleDirectStockUpdate}
        onToggleDropdown={toggleDropdown}
        onCloseDropdown={() => setActiveDropdownId(null)}
        onPageChange={setCurrentPage}
        onReset={handleReset}
        onOpenCreate={openCreate}
        getPageNumbers={getPageNumbers}
      />

      {/* Inventory Intelligence section */}
      <InventoryInsights products={products} onEdit={openEdit} />

      {/* Floating bulk action bar */}
      <InventoryBulkBar
        selectedIds={selectedIds}
        isBulkProcessing={isBulkProcessing}
        isDark={isDark}
        onDeactivate={handleBulkDeactivate}
        onExport={handleBulkExport}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Edit/Create panel + Delete confirm dialog */}
      <InventoryModals
        editing={editing}
        form={form}
        variants={variants}
        attrKeys={attrKeys}
        activeTab={activeTab}
        saving={saving}
        newImages={newImages}
        isDark={isDark}
        newAttrKey={newAttrKey}
        onClose={closeEdit}
        onSave={handleSave}
        onTabChange={setActiveTab}
        onFormChange={setF}
        onVariantChange={updateVariant}
        onVariantAttrChange={updateVariantAttr}
        onAddAttrKey={addAttrKey}
        onRemoveAttrKey={removeAttrKey}
        onAddVariant={addVariant}
        onRemoveVariant={removeVariant}
        onEnableVariantsMode={handleEnableVariantsMode}
        onImageChange={handleImageUploadChange}
        onRemoveImage={removeNewImage}
        onSetNewAttrKey={setNewAttrKey}
        confirmDelete={confirmDelete}
        onCancelDelete={() => setConfirmDelete(null)}
        onDeleteConfirm={handleDelete}
      />
    </div>
  );
}
