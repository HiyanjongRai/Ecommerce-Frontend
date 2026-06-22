import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, RefreshCw, X, Megaphone, Calendar, Package, Clock, Tag, Image as ImageIcon, CheckCircle, AlertCircle
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
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.includes('/') || url.includes('\\')) {
    const fileName = url.split(/[/\\]/).pop();
    return `${BASE_URL}/api/campaigns/image/${fileName}`;
  }
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

  /* Stats calculation */
  const stats = React.useMemo(() => {
    const total = campaigns.length;
    const now = Date.now();
    let active = 0;
    let upcoming = 0;
    let ended = 0;
    campaigns.forEach(c => {
      const start = c.startTime ? new Date(c.startTime).getTime() : 0;
      const end   = c.endTime   ? new Date(c.endTime).getTime()   : Infinity;
      if (now < start)      upcoming++;
      else if (now > end)   ended++;
      else                  active++;
    });
    return { total, active, upcoming, ended };
  }, [campaigns]);

  /* ─────────────────────────────────────────────────────────── */
  return (
    <AdminLayout
      pageTitle="Campaign Management"
      pageSubtitle={`${campaigns.length} campaigns configured`}
      headerActions={
        <button
          onClick={() => { setForm(blankForm()); setShowCreate(true); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow ${themeClasses.button.primary}`}
        >
          <Plus size={14} /> Create Campaign
        </button>
      }
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-[20px] shadow-2xl border transition-all ${themeClasses.bg.secondary} ${themeClasses.border.accent} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      <div className="p-4 lg:p-6 space-y-6">
        
        {/* Dynamic Statistics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          
          {/* Total Campaigns */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Total Campaigns</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-2xs">
                <Megaphone size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.total}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.tertiary}`}>Configured systems</p>
            </div>
          </div>

          {/* Active */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Active</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CheckCircle size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.active}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.success}`}>Live promotions</p>
            </div>
          </div>

          {/* Upcoming */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Upcoming</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <Calendar size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.upcoming}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.info}`}>Scheduled launch</p>
            </div>
          </div>

          {/* Ended */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[110px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Ended</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
                <Clock size={15} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.ended}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.warning}`}>Past campaigns</p>
            </div>
          </div>

        </div>

        {/* Refresh bar */}
        <div className={`rounded-[20px] border p-4 shadow-sm flex items-center justify-end transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          <button
            onClick={loadCampaigns}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.outline}`}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Table container */}
        <div className={`rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Image', 'Campaign', 'Duration', 'Discount', 'Products', 'Pending Approval', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${themeClasses.border.primary}`}>
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className={`flex flex-col items-center gap-2 transition-colors ${themeClasses.text.secondary}`}>
                        <Megaphone size={28} className={`transition-colors ${themeClasses.text.tertiary}`} />
                        <p className="font-bold">No campaigns yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : campaigns.map(c => {
                  const cId = c.id || c.campaignId;
                  const imageUrl = resolveImageUrl(c.imagePath);
                  return (
                    <tr key={cId} className={`transition-colors hover:${themeClasses.bg.secondary}`}>
                      {/* Image Column */}
                      <td className="px-5 py-4">
                        <div className={`w-16 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border transition-colors ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}>
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
                            <ImageIcon size={18} className={`transition-colors ${themeClasses.text.tertiary}`} />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className={`font-bold transition-colors ${themeClasses.text.primary}`}>{c.name}</p>
                        {c.description && <p className={`text-[10px] font-semibold mt-0.5 truncate max-w-[200px] transition-colors ${themeClasses.text.tertiary}`}>{c.description}</p>}
                      </td>
                      <td className={`px-5 py-4 font-semibold transition-colors ${themeClasses.text.secondary}`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5"><Calendar size={11} /> {date(c.startTime)}</span>
                          <span className={`flex items-center gap-1.5 transition-colors ${themeClasses.text.tertiary}`}><Clock size={11} /> {date(c.endTime)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-colors ${themeClasses.status.info}`}>
                          <Tag size={9} />
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `Rs. ${c.discountValue}`}
                          &nbsp;{nice(c.discountType)}
                        </span>
                      </td>
                      <td className={`px-5 py-4 font-bold transition-colors ${themeClasses.text.primary}`}>{c.totalProducts ?? 0}</td>
                      <td className="px-5 py-4">
                        {(c.pendingProducts > 0) ? (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-colors ${themeClasses.status.warning}`}>
                            {c.pendingProducts} Pending
                          </span>
                        ) : (
                          <span className={`transition-colors ${themeClasses.text.tertiary}`}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4"><CampaignBadge campaign={c} themeClasses={themeClasses} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/campaigns/${cId}`)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                          >
                            <Package size={12} /> View
                          </button>
                          <button
                            onClick={() => { setDeleteCampaign(c); setShowDelete(true); }}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${themeClasses.border.primary} hover:${themeClasses.bg.secondary} ${themeClasses.text.danger}`}
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

      {/* ── Create Campaign Drawer ────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" onClick={() => setShowCreate(false)} />
          <div className={`relative w-full max-w-lg h-full shadow-2xl flex flex-col z-50 border-l transition-all duration-300 transform translate-x-0 ${themeClasses.card} ${themeClasses.border.primary}`}>
            
            <div className={`flex items-center justify-between px-6 py-5 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className={`font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-colors ${themeClasses.text.primary}`}>
                <Megaphone size={16} className="text-emerald-600" />
                Create New Campaign
              </h2>
              <button 
                onClick={() => setShowCreate(false)} 
                className={`p-2 rounded-xl border transition-colors ${themeClasses.text.tertiary} ${themeClasses.border.primary} hover:${themeClasses.bg.secondary} cursor-pointer`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Campaign Name *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dashain Festival Sale 2026"
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} 
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Description</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Provide promotional taglines or rules..."
                  rows={3}
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors resize-none ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} 
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Start Date *</label>
                  <input 
                    type="datetime-local" 
                    value={form.startDate} 
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>End Date *</label>
                  <input 
                    type="datetime-local" 
                    value={form.endDate} 
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} 
                  />
                </div>
              </div>

              {/* Discount Type */}
              <div className="space-y-2">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Discount Type *</label>
                <div className="flex gap-6">
                  {['PERCENTAGE', 'FLAT'].map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="discountType" 
                        value={t} 
                        checked={form.discountType === t}
                        onChange={() => setForm(f => ({ ...f, discountType: t }))} 
                        className="accent-emerald-600" 
                      />
                      <span className={`text-xs font-semibold transition-colors ${themeClasses.text.secondary}`}>
                        {t === 'PERCENTAGE' ? 'Percentage %' : 'Flat NPR'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>
                  Discount Value * {form.discountType === 'PERCENTAGE' ? '(%)' : '(NPR)'}
                </label>
                <input 
                  type="number" 
                  min="0" 
                  value={form.discountValue} 
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 200'}
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} 
                />
              </div>

              {/* Max Products */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Max Products Allowed</label>
                <input 
                  type="number" 
                  min="1" 
                  value={form.maxProducts} 
                  onChange={e => setForm(f => ({ ...f, maxProducts: e.target.value }))}
                  placeholder="Leave blank for unlimited"
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} 
                />
              </div>

              {/* Campaign Image */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Campaign Banner Image</label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className={`w-full h-40 rounded-xl overflow-hidden border flex items-center justify-center transition-colors ${themeClasses.border.accent} ${themeClasses.bg.tertiary}`}>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover animate-in fade-in" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} 
                  />
                  <p className={`text-[9px] font-bold transition-colors ${themeClasses.text.tertiary}`}>JPG, PNG, WEBP — Max 10MB file size</p>
                </div>
              </div>
            </div>

            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <button 
                onClick={() => setShowCreate(false)} 
                className={`px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.outline}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate} 
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-colors ${themeClasses.button.primary}`}
              >
                {saving ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Delete Campaign Modal ────────────────────────────────── */}
      {showDelete && deleteCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" onClick={() => setShowDelete(false)} />
          <div className={`relative rounded-[20px] border shadow-2xl w-full max-w-sm overflow-hidden transition-all duration-300 transform scale-100 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className={`px-6 py-5 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className={`font-black text-sm uppercase tracking-wider transition-colors ${themeClasses.text.primary}`}>Delete Campaign</h2>
            </div>
            <div className="p-6">
              <p className={`text-xs font-semibold leading-relaxed transition-colors ${themeClasses.text.secondary}`}>
                Are you sure you want to delete <span className="font-bold text-red-500">{deleteCampaign.name}</span>? This action cannot be undone and will detach all related items.
              </p>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <button 
                onClick={() => setShowDelete(false)} 
                className={`px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.outline}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                disabled={working}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer`}
              >
                {working ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}



