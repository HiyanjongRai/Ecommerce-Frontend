import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, RefreshCw, X, Megaphone, Calendar, Package, Clock, Tag, Image as ImageIcon
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { BASE_URL } from '../../../shared/api/apiConfig';
import {
  getAdminCampaigns,
  createAdminCampaign,
  createAdminCampaignWithImage,
  deleteAdminCampaign,
} from '../services/adminService';

const resolveImageUrl = (url) => {
  if (!url) return '';
  // If it's already an absolute URL (http, https, data), use as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // If it's a relative file path like "campaigns/filename.png", serve through API endpoint
  if (url.includes('/') || url.includes('\\')) {
    const fileName = url.split(/[/\\]/).pop(); // Extract filename from path
    return `${BASE_URL}/api/campaigns/image/${fileName}`;
  }
  // Fallback to BASE_URL + path
  return url.startsWith('/') ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
};

const nice = v => String(v || '').replaceAll('_', ' ');
const date = v => v ? new Date(v).toLocaleDateString() : 'N/A';

/* ─── Campaign status badge ─────────────────────────────────── */
const CampaignBadge = ({ campaign, themeClasses }) => {
  const now  = Date.now();
  const start = campaign.startTime ? new Date(campaign.startTime).getTime() : 0;
  const end   = campaign.endTime   ? new Date(campaign.endTime).getTime()   : Infinity;
  let label, cls;
  if (now < start)      { label = 'UPCOMING'; cls = themeClasses.status.info; }
  else if (now > end)   { label = 'ENDED';    cls = themeClasses.status.pending; }
  else                  { label = 'ACTIVE';   cls = themeClasses.status.success; }
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border transition-colors ${cls}`}>
      {label}
    </span>
  );
};

/* ─── Blank form ─────────────────────────────────────────────── */
const blankForm = () => ({
  name: '', description: '', startDate: '', endDate: '',
  discountType: 'PERCENTAGE', discountValue: '', maxProducts: '', imageUrl: '',
});

export default function AdminCampaigns() {
  const { darkMode, themeClasses } = useAdminTheme();
  const navigate = useNavigate();
  const [campaigns, setCampaigns]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState('');
  const [working, setWorking]       = useState(null);

  /* create modal */
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(blankForm());
  const [saving, setSaving]         = useState(false);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  /* delete modal */
  const [showDelete, setShowDelete] = useState(false);
  const [deleteCampaign, setDeleteCampaign] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Load campaigns ────────────────────────────────────────── */
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCampaigns();
      setCampaigns(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('❌ Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  /* ── Create campaign ───────────────────────────────────────── */
  const handleCreate = async () => {
    if (!form.name.trim()) { showToast('❌ Campaign name is required'); return; }
    if (!form.startDate || !form.endDate) { showToast('❌ Start and End date are required'); return; }
    if (!form.discountValue) { showToast('❌ Discount value is required'); return; }
    setSaving(true);
    try {
      let res;
      
      if (imageFile) {
        // Use multipart form data for file upload
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description);
        formData.append('startDate', form.startDate);
        formData.append('endDate', form.endDate);
        formData.append('discountType', form.discountType);
        formData.append('discountValue', form.discountValue);
        if (form.maxProducts) {
          formData.append('maxProducts', form.maxProducts);
        }
        formData.append('image', imageFile);
        
        res = await createAdminCampaignWithImage(formData);
      } else {
        // Use JSON for no file upload
        const payload = {
          ...form,
          discountValue: parseFloat(form.discountValue),
          maxProducts: form.maxProducts ? parseInt(form.maxProducts) : null,
        };
        res = await createAdminCampaign(payload);
      }
      
      setCampaigns(prev => [res.data, ...prev]);
      showToast('✅ Campaign created successfully');
      setShowCreate(false);
      setForm(blankForm());
      setImageFile(null);
      setImagePreview(null);
    } catch {
      showToast('❌ Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /* ── Delete campaign ───────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteCampaign) return;
    const cId = deleteCampaign.id || deleteCampaign.campaignId;
    setWorking(cId);
    try {
      await deleteAdminCampaign(cId);
      setCampaigns(prev => prev.filter(c => (c.id || c.campaignId) !== cId));
      showToast('✅ Campaign deleted');
      setShowDelete(false);
      setDeleteCampaign(null);
    } catch {
      showToast('❌ Failed to delete campaign');
    } finally {
      setWorking(null);
    }
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <AdminLayout
      pageTitle="Campaign Management"
      pageSubtitle={`${campaigns.length} campaigns configured`}
      headerActions={
        <button
          onClick={() => { setForm(blankForm()); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow"
        >
          <Plus size={14} /> Create Campaign
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
          onClick={loadCampaigns}
          className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-colors ${themeClasses.button.outline}`}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className={`p-6 transition-colors ${themeClasses.bg.primary}`}>
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Image', 'Campaign', 'Duration', 'Discount', 'Products', 'Pending', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.secondary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className={`flex flex-col items-center gap-2 transition-colors ${themeClasses.text.secondary}`}>
                        <Megaphone size={28} className={`transition-colors ${themeClasses.text.tertiary}`} />
                        <p className="font-medium">No campaigns yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : campaigns.map(c => {
                  const cId = c.id || c.campaignId;
                  const imageUrl = resolveImageUrl(c.imagePath);
                  return (
                    <tr key={cId} className={`border-b transition-colors ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`}>
                      {/* Image Column */}
                      <td className="px-4 py-3">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={c.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageIcon size={24} className={`transition-colors ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-bold transition-colors ${themeClasses.text.primary}`}>{c.name}</p>
                        {c.description && <p className={`text-[11px] truncate max-w-[180px] transition-colors ${themeClasses.text.secondary}`}>{c.description}</p>}
                      </td>
                      <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.secondary}`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {date(c.startTime)}</span>
                          <span className={`flex items-center gap-1 transition-colors ${themeClasses.text.tertiary}`}><Clock size={11} /> {date(c.endTime)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border transition-colors ${themeClasses.status.info}`}>
                          <Tag size={9} />
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `Rs. ${c.discountValue}`}
                          &nbsp;{nice(c.discountType)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center font-bold transition-colors ${themeClasses.text.primary}`}>{c.totalProducts ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {(c.pendingProducts > 0) ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border transition-colors ${themeClasses.status.warning}`}>
                            {c.pendingProducts} Pending
                          </span>
                        ) : (
                          <span className={`text-xs transition-colors ${themeClasses.text.tertiary}`}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><CampaignBadge campaign={c} themeClasses={themeClasses} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/campaigns/${cId}`)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${themeClasses.status.success}`}
                          >
                            <Package size={12} /> View
                          </button>
                          <button
                            onClick={() => { setDeleteCampaign(c); setShowDelete(true); }}
                            className={`p-1.5 rounded-lg border transition-colors ${themeClasses.status.danger}`}
                          >
                            <Trash2 size={13} />
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
      </div>

      {/* ── Create Campaign Modal ────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className={`relative rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`font-black text-base transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Create New Campaign</h2>
              <button onClick={() => setShowCreate(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Campaign Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dashain Sale 2025"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
              </div>
              {/* Description */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of this campaign..."
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Start Date *</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>End Date *</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`} />
                </div>
              </div>
              {/* Discount Type */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-2 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Discount Type *</label>
                <div className="flex gap-3">
                  {['PERCENTAGE', 'FLAT'].map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="discountType" value={t} checked={form.discountType === t}
                        onChange={() => setForm(f => ({ ...f, discountType: t }))} className="accent-emerald-600" />
                      <span className={`text-sm font-semibold transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t === 'PERCENTAGE' ? 'Percentage %' : 'Flat NPR'}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Discount Value */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  Discount Value * {form.discountType === 'PERCENTAGE' ? '(%)' : '(NPR)'}
                </label>
                <input type="number" min="0" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 200'}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
              </div>
              {/* Max Products */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Max Products Allowed</label>
                <input type="number" min="1" value={form.maxProducts} onChange={e => setForm(f => ({ ...f, maxProducts: e.target.value }))}
                  placeholder="Leave blank for unlimited"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
              </div>
              {/* Campaign Image URL or File */}
              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Campaign Image</label>
                <div className="space-y-2">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className={`w-full h-40 rounded-lg overflow-hidden border-2 border-emerald-500 flex items-center justify-center transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  {/* File Upload */}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`} 
                  />
                  <p className={`text-[10px] transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>JPG, PNG, WEBP - Max 10MB</p>
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <button onClick={() => setShowCreate(false)} className={`px-4 py-2 border rounded-lg text-xs font-bold transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors">
                {saving ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Campaign Modal ────────────────────────────────── */}
      {showDelete && deleteCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className={`relative rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`font-black text-base transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Delete Campaign</h2>
            </div>
            <div className="p-6">
              <p className={`text-sm transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to delete <span className="font-bold">{deleteCampaign.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <button onClick={() => setShowDelete(false)} className={`px-4 py-2 border rounded-lg text-xs font-bold transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={handleDelete} disabled={working}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors">
                {working ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}


