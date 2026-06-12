import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Edit, RefreshCw, ToggleLeft, ToggleRight,
  Image, Link2, X, Check, UploadCloud, Package
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  getAdminBanners,
  getAdminProducts,
  uploadAdminBannerImage,
  createAdminBanner,
  updateAdminBanner,
  toggleAdminBanner,
  deleteAdminBanner,
  attachAdminBannerProduct,
  detachAdminBannerProduct,
} from '../services/adminService';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { BASE_URL } from '../../../shared/api/apiConfig';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return url.startsWith('/') ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
};

/* ─── Badge ────────────────────────────────────────────────── */
const StatusBadge = ({ active, themeClasses }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border transition-colors
    ${active ? themeClasses.status.success : themeClasses.status.pending}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : (themeClasses.darkMode ? 'bg-gray-500' : 'bg-gray-400')}`} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

/* ─── Blank banner form ─────────────────────────────────────── */
const blankForm = () => ({
  title: '',
  subtitle: '',
  linkUrl: '',
  position: 1,
  active: true,
  imageUrl: '',
  bannerType: 'DISCOUNT_PRODUCT',
});

export default function AdminBanners() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [working, setWorking] = useState(null);

  // Create / Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);   // null = create mode
  const [form, setForm] = useState(blankForm());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Attach products modal
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachBanner, setAttachBanner] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [attachWorking, setAttachWorking] = useState(false);

  // Delete confirm
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBanner, setDeleteBanner] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3200); };

  /* ── Load ─────────────────────────────────────────────────── */
  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminBanners();
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('❌ Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBanners(); }, [loadBanners]);

  /* ── Image Upload ─────────────────────────────────────────── */
  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadAdminBannerImage(fd);
      const url = res.data?.imageUrl || res.data?.url || res.data;
      setForm(f => ({ ...f, imageUrl: url }));
      showToast('✅ Image uploaded successfully');
    } catch {
      showToast('❌ Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  /* ── Save (create / edit) ─────────────────────────────────── */
  const handleSave = async () => {
    if (!form.title.trim()) { showToast('❌ Title is required'); return; }
    setWorking('save');
    try {
      if (editingBanner) {
        const bId = editingBanner.id || editingBanner.bannerId;
        await updateAdminBanner(bId, form);
        setBanners(prev => prev.map(b => (b.id || b.bannerId) === bId ? { ...b, ...form } : b));
        showToast('✅ Banner updated');
      } else {
        const res = await createAdminBanner(form);
        setBanners(prev => [...prev, res.data]);
        showToast('✅ Banner created');
      }
      setShowFormModal(false);
      setEditingBanner(null);
      setForm(blankForm());
    } catch {
      showToast('❌ Failed to save banner');
    } finally {
      setWorking(null);
    }
  };

  /* ── Toggle ─────────────────────────────────────────────────  */
  const handleToggle = async (banner) => {
    const bId = banner.id || banner.bannerId;
    setWorking(bId);
    try {
      await toggleAdminBanner(bId);
      setBanners(prev => prev.map(b => (b.id || b.bannerId) === bId ? { ...b, active: !b.active } : b));
      showToast('✅ Banner visibility toggled');
    } catch {
      showToast('❌ Toggle failed');
    } finally {
      setWorking(null);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────  */
  const handleDelete = async () => {
    if (!deleteBanner) return;
    const bId = deleteBanner.id || deleteBanner.bannerId;
    setWorking(bId);
    try {
      await deleteAdminBanner(bId);
      setBanners(prev => prev.filter(b => (b.id || b.bannerId) !== bId));
      showToast('✅ Banner deleted');
      setShowDeleteModal(false);
      setDeleteBanner(null);
    } catch {
      showToast('❌ Delete failed');
    } finally {
      setWorking(null);
    }
  };

  /* ── Load Products for Attach ─────────────────────────────── */
  const openAttachModal = async (banner) => {
    setAttachBanner(banner);
    setSelectedProducts([]);
    setProductSearch('');
    setShowAttachModal(true);
    try {
      const res = await getAdminProducts(0, 200);
      setAllProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('❌ Failed to load products');
    }
  };

  /* ── Attach Product ─────────────────────────────────────────  */
  const handleAttach = async (productId) => {
    if (!attachBanner) return;
    const bId = attachBanner.id || attachBanner.bannerId;
    setAttachWorking(true);
    try {
      await attachAdminBannerProduct(bId, productId);
      setSelectedProducts(prev => [...prev, productId]);
      showToast('✅ Product attached to banner');
    } catch {
      showToast('❌ Failed to attach product');
    } finally {
      setAttachWorking(false);
    }
  };

  /* ── Remove Product from Banner ─────────────────────────────  */
  const handleDetach = async (productId) => {
    if (!attachBanner) return;
    const bId = attachBanner.id || attachBanner.bannerId;
    setAttachWorking(true);
    try {
      await detachAdminBannerProduct(bId, productId);
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      showToast('✅ Product removed from banner');
    } catch {
      showToast('❌ Failed to remove product');
    } finally {
      setAttachWorking(false);
    }
  };

  const filteredProducts = allProducts.filter(p =>
    !productSearch || (p.name || p.productName || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  /* ─────────────────────────────────────────────────────────── */
  return (
    <AdminLayout
      pageTitle="Banner Management"
      pageSubtitle={`${banners.length} banners configured`}
      headerActions={
        <button
          onClick={() => { setEditingBanner(null); setForm(blankForm()); setShowFormModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow"
        >
          <Plus size={14} /> Create Banner
        </button>
      }
    >
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900/90 backdrop-blur-md text-white text-sm font-bold px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Refresh bar */}
      <div className={`px-6 py-3 border-b transition-colors ${themeClasses.card} flex justify-end`}>
        <button
          onClick={loadBanners}
          className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-colors ${themeClasses.button.outline}`}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className={`p-6 transition-colors ${themeClasses.bg.primary}`}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className={`rounded-2xl border shadow-sm overflow-hidden animate-pulse transition-colors ${themeClasses.card}`}>
                <div className={`h-40 transition-colors ${themeClasses.bg.secondary}`} />
                <div className="p-4 space-y-2">
                  <div className={`h-4 rounded w-3/4 transition-colors ${themeClasses.bg.secondary}`} />
                  <div className={`h-3 rounded w-1/2 transition-colors ${themeClasses.bg.secondary}`} />
                </div>
              </div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 gap-3 transition-colors ${themeClasses.text.secondary}`}>
            <Image size={40} className={`transition-colors ${themeClasses.text.tertiary}`} />
            <p className="font-medium">No banners configured yet.</p>
            <button
              onClick={() => { setEditingBanner(null); setForm(blankForm()); setShowFormModal(true); }}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
            >
              Create First Banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {banners.map(banner => {
              const bId = banner.id || banner.bannerId;
              return (
                <div key={bId} className={`rounded-2xl border shadow-sm overflow-hidden group hover:shadow-md transition-all ${themeClasses.card}`}>
                  {/* Image */}
                  <div className={`relative h-44 overflow-hidden transition-colors ${themeClasses.bg.secondary}`}>
                    {banner.imageUrl ? (
                      <img src={resolveImageUrl(banner.imageUrl)} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={32} className={`transition-colors ${themeClasses.text.tertiary}`} />
                      </div>
                    )}
                    {/* Active overlay badge */}
                    <div className="absolute top-2 left-2">
                      <StatusBadge active={banner.active} themeClasses={themeClasses} />
                    </div>
                    {banner.position && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        #{banner.position}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className={`font-black text-sm truncate transition-colors ${themeClasses.text.primary}`}>{banner.title || 'Untitled Banner'}</h3>
                    {banner.subtitle && (
                      <p className={`text-xs truncate mt-0.5 transition-colors ${themeClasses.text.secondary}`}>{banner.subtitle}</p>
                    )}
                    {banner.linkUrl && (
                      <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-medium transition-colors ${themeClasses.text.accent}`}>
                        <Link2 size={10} />
                        <span className="truncate">{banner.linkUrl}</span>
                      </div>
                    )}

                    <div className={`flex items-center justify-between mt-4 pt-3 border-t transition-colors ${themeClasses.border.primary}`}>
                      <div className={`text-[10px] font-medium transition-colors ${themeClasses.text.tertiary}`}>
                        Clicks: {banner.clickCount || 0}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Toggle */}
                        <button
                          title={banner.active ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggle(banner)}
                          disabled={working === bId}
                          className={`p-1.5 rounded-lg border transition-colors ${themeClasses.button.outline}`}
                        >
                          {banner.active ? <ToggleRight size={15} className="text-emerald-600" /> : <ToggleLeft size={15} />}
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit"
                          onClick={() => {
                            setEditingBanner(banner);
                            setForm({
                              title: banner.title || '',
                              subtitle: banner.subtitle || '',
                              linkUrl: banner.linkUrl || '',
                              position: banner.position || 1,
                              active: banner.active ?? true,
                              imageUrl: banner.imageUrl || '',
                              bannerType: banner.bannerType || 'DISCOUNT_PRODUCT',
                            });
                            setShowFormModal(true);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'border-gray-600 text-emerald-400 hover:bg-emerald-900/30' : 'border-gray-200 text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          <Edit size={14} />
                        </button>

                        {/* Attach Products */}
                        <button
                          title="Attach Products"
                          onClick={() => openAttachModal(banner)}
                          className={`p-1.5 rounded-lg border transition-colors ${darkMode ? 'border-gray-600 text-violet-400 hover:bg-violet-900/30' : 'border-gray-200 text-violet-600 hover:bg-violet-50'}`}
                        >
                          <Package size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          title="Delete"
                          onClick={() => { setDeleteBanner(banner); setShowDeleteModal(true); }}
                          className={`p-1.5 rounded-lg border transition-colors ${themeClasses.status.danger}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-colors ${darkMode ? 'bg-black/50' : 'bg-black/40'}`} onClick={() => setShowFormModal(false)} />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] transition-colors ${themeClasses.bg.primary}`}>
            
            {/* Form Fields (Left Side) */}
            <div className={`flex-1 p-6 space-y-4 overflow-y-auto transition-colors ${themeClasses.card} border-r`}>
              <div className={`flex items-center justify-between pb-3 border-b transition-colors ${themeClasses.border.primary}`}>
                <h2 className={`font-black text-base transition-colors ${themeClasses.text.primary}`}>
                  {editingBanner ? 'Edit Banner Settings' : 'Create New Banner'}
                </h2>
                <button onClick={() => setShowFormModal(false)} className={`p-2 rounded-lg md:hidden transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.secondary}`}>
                  <X size={18} />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Summer Sale"
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Subtitle</label>
                <input
                  value={form.subtitle}
                  onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  placeholder="e.g. 70% OFF or New Summer Arrivals"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                />
              </div>

              {/* Link URL */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Link URL</label>
                <input
                  value={form.linkUrl}
                  onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://jhapcham.com/..."
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                />
              </div>

              {/* Banner Type Selection Dropdown */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Banner Type *</label>
                <select
                  value={form.bannerType}
                  onChange={e => setForm(f => ({ ...f, bannerType: e.target.value }))}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                >
                  <option value="DISCOUNT_PRODUCT">Discount Product</option>
                  <option value="FESTIVAL">Festival</option>
                  <option value="CUSTOM_PROMOTION">Custom Promotion</option>
                  <option value="CATEGORY">Category</option>
                </select>
              </div>

              {/* Position */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Display Position / Order</label>
                <input
                  type="number"
                  min={1}
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: parseInt(e.target.value) || 1 }))}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>Banner Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-6 cursor-pointer transition-all ${darkMode ? 'border-emerald-800 hover:border-emerald-600 hover:bg-emerald-900/20' : 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30'}`}
                >
                  {form.imageUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={resolveImageUrl(form.imageUrl)} alt="preview" className="max-h-24 rounded-lg object-cover" />
                      <span className={`text-xs font-semibold transition-colors ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Click to replace image</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={22} className={`mb-1 transition-colors ${darkMode ? 'text-emerald-600' : 'text-emerald-300'}`} />
                      <p className={`text-xs font-medium transition-colors ${themeClasses.text.secondary}`}>Drag & drop or <span className={`font-bold transition-colors ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>click to upload</span></p>
                    </>
                  )}
                  {uploading && <p className={`text-xs font-bold mt-2 animate-pulse transition-colors ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Uploading...</p>}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageUpload(e.target.files[0])}
                />
              </div>

              {/* Active Toggle */}
              <div className={`flex items-center justify-between py-2 border-t transition-colors ${themeClasses.border.primary}`}>
                <div>
                  <p className={`text-sm font-bold transition-colors ${themeClasses.text.primary}`}>Active</p>
                  <p className={`text-xs transition-colors ${themeClasses.text.secondary}`}>Visible to customers on homepage</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.active ? 'bg-emerald-600' : (darkMode ? 'bg-gray-600' : 'bg-gray-200')}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className={`pt-4 flex justify-end gap-3 border-t transition-colors ${themeClasses.border.primary}`}>
                <button
                  onClick={() => setShowFormModal(false)}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold transition-colors ${themeClasses.button.outline}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={working === 'save' || uploading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {working === 'save' ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </div>

            {/* LIVE PREVIEW SCREEN (Right Side) */}
            <div className={`hidden md:flex flex-col w-[380px] p-6 justify-between select-none transition-colors ${themeClasses.bg.secondary}`}>
              <div className={`space-y-4 transition-colors ${themeClasses.text.primary}`}>
                <div className={`flex justify-between items-center border-b pb-2 transition-colors ${themeClasses.border.primary}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Live Customer Preview</span>
                  <button onClick={() => setShowFormModal(false)} className={`p-1 rounded transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`}>
                    <X size={16} />
                  </button>
                </div>

                {/* Live Preview Item 1: Homepage Hero Style */}
                <div className="space-y-2">
                  <span className={`text-[9px] uppercase font-bold tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Style A: Main Hero Carousel</span>
                  <div className={`relative overflow-hidden rounded-lg border h-[170px] flex items-center p-4 transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
                    <div className="relative z-10 max-w-[55%] space-y-1">
                      <p className={`text-[8px] uppercase tracking-widest leading-none font-semibold transition-colors ${themeClasses.text.tertiary}`}>Boundaries</p>
                      <h3 className={`text-lg font-extrabold leading-tight break-words transition-colors ${themeClasses.text.primary}`}>
                        {form.title || 'Summer Sale'}
                      </h3>
                      <p className={`text-[14px] font-black leading-tight break-words transition-colors ${themeClasses.text.accent}`}>
                        {form.subtitle || '70% OFF'}
                      </p>
                      <div className="pt-1">
                        <span className={`inline-block text-white text-[8px] font-bold uppercase tracking-wider px-3 py-1 transition-colors ${darkMode ? 'bg-gray-100' : 'bg-gray-900'}`}>Shop Now</span>
                      </div>
                    </div>
                    {form.imageUrl ? (
                      <div 
                        className="absolute inset-y-0 right-0 w-[45%] bg-cover bg-center"
                        style={{ backgroundImage: `url(${resolveImageUrl(form.imageUrl)})` }}
                      />
                    ) : (
                      <div className={`absolute inset-y-0 right-0 w-[45%] flex items-center justify-center text-[10px] transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.tertiary}`}>
                        No Image
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Preview Item 2: Promo Card Style */}
                <div className="space-y-2 pt-2">
                  <span className={`text-[9px] uppercase font-bold tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Style B: Triple Promo Grid</span>
                  <div className={`relative overflow-hidden rounded border h-[100px] flex items-center p-3 transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
                    {form.imageUrl ? (
                      <div className="absolute inset-y-0 right-0 w-[40%] bg-cover bg-center" style={{ backgroundImage: `url(${resolveImageUrl(form.imageUrl)})` }} />
                    ) : (
                      <div className={`absolute inset-y-0 right-0 w-[40%] transition-colors ${themeClasses.bg.secondary}`} />
                    )}
                    <div className="relative z-10 space-y-0.5 max-w-[55%]">
                      <h4 className={`text-[10px] font-bold uppercase tracking-wider truncate transition-colors ${themeClasses.text.tertiary}`}>{form.title || 'Promo Category'}</h4>
                      <p className={`text-sm font-black truncate transition-colors ${themeClasses.text.primary}`}>{form.subtitle || '40% OFF'}</p>
                      <span className={`inline-block text-[8px] font-black uppercase border-b pb-0.5 transition-colors ${themeClasses.text.primary}`}>Shop Now</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`text-[9px] leading-normal border-t pt-3 transition-colors ${themeClasses.border.primary} ${themeClasses.text.tertiary}`}>
                * Real-time rendering simulates desktop layouts on the customer interface. Image uploads will reflect instantly in both preview blocks.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Attach Products Modal ──────────────────────────────── */}
      {showAttachModal && attachBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm`} onClick={() => setShowAttachModal(false)} />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`font-black transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Attach Products to Banner</h2>
              <button onClick={() => setShowAttachModal(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className={`px-6 py-3 border-b transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products…"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className={`text-center py-8 text-sm transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>No products found.</p>
              ) : filteredProducts.map(p => {
                const pId = p.productId || p.id;
                const attached = selectedProducts.includes(pId);
                return (
                  <div key={pId} className={`flex items-center justify-between px-4 py-3 border-b transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                    <div>
                      <p className={`text-sm font-semibold transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{p.name || p.productName}</p>
                      <p className={`text-xs transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Rs. {p.price?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => attached ? handleDetach(pId) : handleAttach(pId)}
                      disabled={attachWorking}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                        attached
                          ? darkMode ? 'bg-red-900/30 text-red-300 border border-red-800 hover:bg-red-900/50' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                          : darkMode ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {attached ? <><X size={11} /> Remove</> : <><Check size={11} /> Attach</>}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className={`px-6 py-4 border-t transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} flex justify-end`}>
              <button
                onClick={() => setShowAttachModal(false)}
                className={`px-4 py-2 border rounded-xl text-xs font-bold transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────── */}
      {showDeleteModal && deleteBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className={`relative rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`font-black text-base transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Delete Banner?</h2>
              <button onClick={() => setShowDeleteModal(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}>
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className={`text-sm transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                This will permanently delete <span className={`font-bold transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>"{deleteBanner.title}"</span> from the platform. This action cannot be undone.
              </p>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <button onClick={() => setShowDeleteModal(false)} className={`px-4 py-2 border rounded-xl text-xs font-bold transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={working === (deleteBanner.id || deleteBanner.bannerId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
              >
                {working === (deleteBanner.id || deleteBanner.bannerId) ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}


