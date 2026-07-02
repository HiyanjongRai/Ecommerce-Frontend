import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, RefreshCw, X, Megaphone, Calendar, Package, Clock, Tag,
  Image as ImageIcon, CheckCircle, AlertCircle, TrendingUp, BarChart3,
  ChevronDown, SlidersHorizontal, Download, Play, Pause, Copy, Edit3,
  MoreVertical, UploadCloud, Check, HelpCircle, Eye, ShoppingCart,
  Search, DollarSign, Filter, Target, Settings
} from 'lucide-react';
import AdminLayout from '../../../components/layout/AdminLayout/AdminLayout';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { BASE_URL } from '../../../services/apiConfig';
import {
  getAdminCampaigns,
  createAdminCampaign,
  createAdminCampaignWithImage,
  deleteAdminCampaign,
} from '../../../services/adminApi';

// Resolve full campaign image url
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
const formatDate = v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
const formatTime = v => v ? new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

export default function AdminCampaigns() {
  const { darkMode, themeClasses } = useAdminTheme();
  const navigate = useNavigate();

  // Core Campaign List State
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [working, setWorking] = useState(null);

  // Search & Filter Panel State
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, SCHEDULED, DRAFT, PAUSED, EXPIRED
  const [filterType, setFilterType] = useState('ALL'); // ALL, PERCENTAGE, FLAT
  const [filterMinRevenue, setFilterMinRevenue] = useState(0);
  const [filterMinProducts, setFilterMinProducts] = useState(0);

  // Selection & Bulk Operations State
  const [selectedIds, setSelectedIds] = useState([]);

  // Create Campaign Drawer States
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Form Fields State
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxProducts: '',
    applyTo: 'ALL', // ALL, SELECTED_PRODUCTS, SELECTED_CATEGORIES
    targetProducts: [],
    targetCategories: [],
    targetBrands: [],
    targetSellers: [],
    autoStart: true,
    autoEnd: true,
    featured: false,
    homepageBanner: false,
    sendNotifications: false
  });

  // Form Validation State
  const [errors, setErrors] = useState({});

  // Product Targeting lists (Mock data for targeting select drawer)
  const targetMockData = {
    products: ['Premium Headphones', 'Mechanical Keyboard', 'Smart Fitness Band', 'Wireless Mouse', 'Gaming Console'],
    categories: ['Electronics', 'Fashion', 'Home & Living', 'Beauty & Personal Care', 'Sports & Outdoors'],
    brands: ['Sony', 'Logitech', 'Samsung', 'Apple', 'Dell'],
    sellers: ['Jhapcham Marketplace', 'Gamer Hub', 'Urban Trendz', 'A1 Electronics']
  };

  // Row dropdown state
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Delete modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteCampaign, setDeleteCampaign] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── Load Campaigns ──────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCampaigns();
      const raw = Array.isArray(res.data) ? res.data : [];
      
      // Inject some mock business metrics for analytics demo (since API has basic details)
      const mapped = raw.map((c, i) => {
        // Deterministic mock calculations based on ID
        const seed = c.id || i;
        const revenue = seed % 2 === 0 ? 120000 + (seed * 8500) : 45000 + (seed * 12000);
        const orders = Math.round(revenue / 1850);
        const views = Math.round(revenue * 0.12);
        const ctr = parseFloat((2.1 + (seed % 3) * 0.8).toFixed(1));
        const conversion = parseFloat((1.5 + (seed % 4) * 0.6).toFixed(1));
        
        // Status determination mapping
        let status = 'ACTIVE';
        const now = Date.now();
        const start = c.startTime ? new Date(c.startTime).getTime() : 0;
        const end = c.endTime ? new Date(c.endTime).getTime() : Infinity;
        if (now < start) status = 'SCHEDULED';
        else if (now > end) status = 'EXPIRED';
        else if (seed % 5 === 0) status = 'PAUSED';

        return {
          ...c,
          revenue,
          orders,
          views,
          ctr,
          conversion,
          status
        };
      });
      setCampaigns(mapped);
    } catch {
      showToast('❌ Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadCampaigns(); 
  }, [loadCampaigns]);

  // Outside click listener for action dropdown menus
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Form Inline Validation
  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Campaign name is required';
    else if (form.name.length > 50) newErrors.name = 'Name must be 50 characters or less';

    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    const dVal = parseFloat(form.discountValue);
    if (isNaN(dVal) || dVal <= 0) {
      newErrors.discountValue = 'Discount value must be a positive number';
    } else if (form.discountType === 'PERCENTAGE' && dVal > 90) {
      newErrors.discountValue = 'Percentage discount cannot exceed 90%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Create campaign ─────────────────────────────────────────
  const handleCreate = async () => {
    if (!validateForm()) {
      showToast('❌ Please correct form validation errors');
      return;
    }
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
          name: form.name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          discountType: form.discountType,
          discountValue: parseFloat(form.discountValue),
          maxProducts: form.maxProducts ? parseInt(form.maxProducts) : null,
        };
        res = await createAdminCampaign(payload);
      }

      // Add default mock analytics values to the new item in state
      const newItem = {
        ...res.data,
        revenue: 0,
        orders: 0,
        views: 0,
        ctr: 0.0,
        conversion: 0.0,
        status: form.autoStart ? 'ACTIVE' : 'DRAFT'
      };
      
      setCampaigns(prev => [newItem, ...prev]);
      showToast('✅ Campaign created successfully');
      setShowCreate(false);
      
      // Reset Form State
      setForm({
        name: '', description: '', startDate: '', endDate: '',
        discountType: 'PERCENTAGE', discountValue: '', maxProducts: '',
        applyTo: 'ALL', targetProducts: [], targetCategories: [],
        targetBrands: [], targetSellers: [], autoStart: true, autoEnd: true,
        featured: false, homepageBanner: false, sendNotifications: false
      });
      setImageFile(null);
      setImagePreview(null);
      setErrors({});
    } catch {
      showToast('❌ Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  // ── Drag & Drop Image Handlers ──────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      showToast('❌ Invalid file. Please drop an image.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Delete campaign ─────────────────────────────────────────
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

  // Bulk operation handlers
  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;
    
    if (action === 'DELETE') {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} campaigns?`)) {
        selectedIds.forEach(async id => {
          try {
            await deleteAdminCampaign(id);
          } catch (e) {
            console.error(e);
          }
        });
        setCampaigns(prev => prev.filter(c => !selectedIds.includes(c.id || c.campaignId)));
        showToast(`✅ Deleted ${selectedIds.length} campaigns`);
        setSelectedIds([]);
      }
    } else if (action === 'PAUSE') {
      setCampaigns(prev => prev.map(c => selectedIds.includes(c.id || c.campaignId) ? { ...c, status: 'PAUSED' } : c));
      showToast(`⏸️ Paused ${selectedIds.length} campaigns`);
      setSelectedIds([]);
    } else if (action === 'ACTIVATE') {
      setCampaigns(prev => prev.map(c => selectedIds.includes(c.id || c.campaignId) ? { ...c, status: 'ACTIVE' } : c));
      showToast(`▶️ Activated ${selectedIds.length} campaigns`);
      setSelectedIds([]);
    } else if (action === 'EXPORT') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(campaigns.filter(c => selectedIds.includes(c.id || c.campaignId)), null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute('href', dataStr);
      anchor.setAttribute('download', 'exported_campaigns.json');
      anchor.click();
      setSelectedIds([]);
    }
  };

  // Toggle single status (Pause/Activate)
  const toggleCampaignStatus = (campaign) => {
    const cId = campaign.id || campaign.campaignId;
    const isPaused = campaign.status === 'PAUSED';
    setCampaigns(prev => prev.map(c => (c.id || c.campaignId) === cId ? { ...c, status: isPaused ? 'ACTIVE' : 'PAUSED' } : c));
    showToast(isPaused ? `▶️ Campaign activated` : `⏸️ Campaign paused`);
  };

  // Dynamic calculations for advanced filter + search queries
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || [c.name, c.description].some(txt => String(txt || '').toLowerCase().includes(q));

      const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
      const matchType = filterType === 'ALL' || c.discountType === filterType;
      
      const revenue = c.revenue ?? 0;
      const matchRevenue = revenue >= filterMinRevenue;

      const productsCount = c.totalProducts ?? 0;
      const matchProducts = productsCount >= filterMinProducts;

      return matchSearch && matchStatus && matchType && matchRevenue && matchProducts;
    });
  }, [campaigns, search, filterStatus, filterType, filterMinRevenue, filterMinProducts]);

  // Statistics calculation for the 6 KPIs
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'ACTIVE').length;
    const scheduled = campaigns.filter(c => c.status === 'SCHEDULED').length;
    const expired = campaigns.filter(c => c.status === 'EXPIRED').length;

    // Financial summaries
    const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue ?? 0), 0);
    const totalOrders = campaigns.reduce((acc, c) => acc + (c.orders ?? 0), 0);
    
    // Average discount math
    const discountSum = campaigns.reduce((acc, c) => acc + (c.discountValue ?? 0), 0);
    const avgDiscount = total > 0 ? Math.round(discountSum / total) : 0;

    // Conversion rate average
    const convSum = campaigns.reduce((acc, c) => acc + (c.conversion ?? 0), 0);
    const avgConv = total > 0 ? parseFloat((convSum / total).toFixed(1)) : 0.0;

    return {
      total, active, scheduled, expired,
      totalRevenue, totalOrders, avgDiscount, avgConv
    };
  }, [campaigns]);

  // SVG Chart points calculation: plots cumulative campaign revenue over time
  const revenueChartPoints = useMemo(() => {
    if (filteredCampaigns.length === 0) return { path: 'M 50,150 L 450,150', fillPath: 'M 50,150 L 450,150 Z', points: [] };
    const sorted = [...filteredCampaigns].sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0));
    
    const count = sorted.length;
    const maxVal = Math.max(...sorted.map(c => c.revenue ?? 0), 1);
    
    const points = sorted.map((c, i) => {
      const x = 50 + (i / Math.max(count - 1, 1)) * 400;
      const y = 160 - ((c.revenue ?? 0) / maxVal) * 110;
      return { x, y, name: c.name, revenue: c.revenue };
    });

    const path = points.reduce((acc, p, i) => i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');
    const fillPath = points.length > 0 ? `${path} L ${points[points.length - 1].x},160 L ${points[0].x},160 Z` : '';
    
    return { path, fillPath, points };
  }, [filteredCampaigns]);

  // Select all checkboxes handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredCampaigns.map(c => c.id || c.campaignId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Helper toggle list selection for Product Targeting section
  const handleToggleTargetItem = (field, item) => {
    setForm(prev => {
      const current = prev[field] || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, [field]: updated };
    });
  };

  return (
    <AdminLayout
      pageTitle="Campaign Management"
      pageSubtitle="Configure and monitor promotional campaigns"
      notifications={3}
      headerActions={
        <div className="flex items-center gap-3">
          {/* Header search bar */}
          <div className="relative flex items-center border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-white/5 focus-within:border-emerald-500 w-64 shadow-2xs">
            <Search size={14} className="absolute left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-transparent outline-none placeholder-gray-400 text-gray-900 dark:text-white font-semibold"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer ${
              showFilters ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 bg-white'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>

          <button
            onClick={() => { setForm(f => ({ ...f, name: '', description: '', startDate: '', endDate: '', discountValue: '', maxProducts: '' })); setShowCreate(true); }}
            className="inline-flex items-center gap-1.5 bg-[#16A34A] hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Campaign</span>
          </button>
        </div>
      }
    >
      {/* Toast Alert popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 text-xs font-bold px-5 py-3.5 rounded-xl shadow-2xl bg-white border border-gray-150 text-slate-800 transition-all flex items-center gap-2">
          <CheckCircle size={15} className="text-emerald-500" />
          {toast}
        </div>
      )}

      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080b14] p-6 lg:p-8 space-y-6 transition-colors duration-250">

        {/* ─── ADVANCED FILTERS PANEL ─── */}
        {showFilters && (
          <div className="bg-white dark:bg-[#0d1117] p-5 rounded-xl border border-gray-200 dark:border-white/5 shadow-2xs space-y-4 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Advanced Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Campaign Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Campaign Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PAUSED">Paused</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount Type</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="PERCENTAGE">Percentage %</option>
                  <option value="FLAT">Flat NPR</option>
                </select>
              </div>

              {/* Revenue range minimum */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Min Revenue (NPR {filterMinRevenue.toLocaleString()})
                </label>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={filterMinRevenue}
                  onChange={e => setFilterMinRevenue(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer accent-emerald-600 mt-2"
                />
              </div>

              {/* Product count limit */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Min Products Target ({filterMinProducts} items)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={filterMinProducts}
                  onChange={e => setFilterMinProducts(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer accent-emerald-600 mt-2"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={() => { setFilterStatus('ALL'); setFilterType('ALL'); setFilterMinRevenue(0); setFilterMinProducts(0); }}
                className="px-3.5 py-1.5 border border-gray-250 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-3.5 py-1.5 bg-[#16A34A] text-white rounded-lg text-xs font-bold hover:bg-emerald-600 cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* ─── ANALYTICS OVERVIEW SECTION (6 KPI CARDS) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          
          {/* Card 1: Total campaigns */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total campaigns</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Megaphone size={14} /></div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-black text-gray-950 dark:text-white">{stats.total}</p>
              <p className="text-[8px] text-gray-450 mt-1 font-semibold flex items-center gap-0.5">
                <span className="text-emerald-500">▲ +12%</span> this month
              </p>
            </div>
          </div>

          {/* Card 2: Active */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</span>
              <div className="w-8 h-8 rounded-lg bg-[#EEFCF2] text-[#16A34A] flex items-center justify-center"><CheckCircle size={14} /></div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-black text-gray-950 dark:text-white">{stats.active}</p>
              <p className="text-[8px] text-gray-450 mt-1 font-semibold flex items-center gap-0.5">
                <span className="text-emerald-500">▲ +8.2%</span> relative active
              </p>
            </div>
          </div>

          {/* Card 3: Revenue Influenced */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue Generated</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign size={14} /></div>
            </div>
            <div className="mt-2.5">
              <p className="text-lg font-black text-gray-950 dark:text-white truncate">NPR {stats.totalRevenue.toLocaleString()}</p>
              <p className="text-[8px] text-gray-450 mt-1 font-semibold flex items-center gap-0.5">
                <span className="text-emerald-500">▲ +18.4%</span> this month
              </p>
            </div>
          </div>

          {/* Card 4: Orders influenced */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Orders Influenced</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><ShoppingCart size={14} /></div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-black text-gray-950 dark:text-white">{stats.totalOrders}</p>
              <p className="text-[8px] text-gray-450 mt-1 font-semibold flex items-center gap-0.5">
                <span className="text-emerald-500">▲ +14.1%</span> vs last period
              </p>
            </div>
          </div>

          {/* Card 5: Conversion Rate */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp size={14} /></div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-black text-gray-950 dark:text-white">{stats.avgConv}%</p>
              <p className="text-[8px] text-gray-450 mt-1 font-semibold flex items-center gap-0.5">
                <span className="text-emerald-500">▲ +1.5%</span> avg conversions
              </p>
            </div>
          </div>

          {/* Card 6: Average Discount */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Average Discount</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><Tag size={14} /></div>
            </div>
            <div className="mt-2.5">
              <p className="text-xl font-black text-gray-950 dark:text-white">{stats.avgDiscount}% OFF</p>
              <p className="text-[8px] text-gray-450 mt-1 font-semibold flex items-center gap-0.5">
                <span className="text-red-500">▼ -0.8%</span> target margins
              </p>
            </div>
          </div>

        </div>

        {/* ─── CAMPAIGN PERFORMANCE CHART SECTION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Revenue Over Time */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 rounded-xl p-5 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-gray-900 dark:text-white">Campaign Revenue Trend</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Displays loaded campaigns mapped sequentially</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-bold">
                <BarChart3 size={14} />
                <span>NPR {stats.totalRevenue.toLocaleString()} Total</span>
              </div>
            </div>
            {/* SVG line graph */}
            <div className="mt-6 w-full relative">
              <svg viewBox="0 0 500 150" className="w-full h-32 overflow-visible">
                <defs>
                  <linearGradient id="chartRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Gridlines */}
                {[30, 70, 110, 150].map((y, idx) => (
                  <line key={idx} x1="40" y1={y} x2="460" y2={y} stroke="#F3F4F6" strokeWidth="1" />
                ))}
                {revenueChartPoints.points.length > 0 ? (
                  <>
                    <path d={revenueChartPoints.fillPath} fill="url(#chartRevenueGlow)" />
                    <path d={revenueChartPoints.path} fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
                    {revenueChartPoints.points.map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r="4.5" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" className="cursor-pointer group relative" />
                    ))}
                  </>
                ) : (
                  <text x="250" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="11" fontWeight="600">No data points</text>
                )}
              </svg>
            </div>
          </div>

          {/* Chart 2: Campaign Performance Breakdown */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 rounded-xl p-5 shadow-3xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black uppercase text-gray-900 dark:text-white">Performance Metrics</h4>
              <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Overview of marketplace conversion levels</p>
            </div>

            <div className="space-y-3.5 mt-4">
              {[
                { label: 'Revenue Influenced', pct: 85, color: 'bg-emerald-500', value: `NPR ${(stats.totalRevenue).toLocaleString()}` },
                { label: 'Orders Captured', pct: 60, color: 'bg-blue-500', value: `${stats.totalOrders} checkouts` },
                { label: 'Avg Conversion Level', pct: stats.avgConv * 10, color: 'bg-amber-500', value: `${stats.avgConv}% conversion` },
                { label: 'Customer Click Ratio (CTR)', pct: 45, color: 'bg-purple-500', value: '3.2% average CTR' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                    <span>{item.label}</span>
                    <span className="text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5">
                    <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${Math.min(item.pct, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── STICKY BULK ACTIONS BAR ─── */}
        {selectedIds.length > 0 && (
          <div className="sticky bottom-6 z-25 bg-[#0d1117] border border-white/8 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
            <span className="text-xs font-bold text-emerald-400">{selectedIds.length} campaigns selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('ACTIVATE')}
                className="bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play size={13} className="text-emerald-500" /> Activate
              </button>
              <button
                onClick={() => handleBulkAction('PAUSE')}
                className="bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Pause size={13} className="text-amber-500" /> Pause
              </button>
              <button
                onClick={() => handleBulkAction('DELETE')}
                className="bg-white/10 hover:bg-red-950/30 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 size={13} /> Delete
              </button>
              <button
                onClick={() => handleBulkAction('EXPORT')}
                className="bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={13} /> Export
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── CAMPAIGN DIRECTORY TABLE ─── */}
        <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-gray-200 dark:border-white/5 shadow-3xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-150 dark:border-white/5 bg-gray-50/50 dark:bg-white/1 select-none">
                  <th className="px-5 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded accent-[#16A34A]"
                      checked={filteredCampaigns.length > 0 && selectedIds.length === filteredCampaigns.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discount</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Products</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Orders</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Views</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">CTR</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Conv. Rate</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="h-14">
                      <td colSpan={12} className="px-5 py-3">
                        <div className="h-5 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-20">
                      {/* Premium Empty State */}
                      <div className="text-center flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-4 border border-emerald-100">
                          <Megaphone size={22} className="animate-bounce" />
                        </div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">No Campaigns Yet</h4>
                        <p className="mt-2 text-xs text-gray-450 leading-relaxed font-semibold">
                          Create your first promotional campaign to increase sales and product visibility.
                        </p>
                        <button
                          onClick={() => { setForm(f => ({ ...f, name: '', description: '', startDate: '', endDate: '', discountValue: '', maxProducts: '' })); setShowCreate(true); }}
                          className="mt-5 bg-[#16A34A] hover:bg-emerald-600 text-white font-bold text-xs py-2 px-5 rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          Create Campaign
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((c) => {
                    const cId = c.id || c.campaignId;
                    const isSelected = selectedIds.includes(cId);
                    const imageUrl = resolveImageUrl(c.imagePath);

                    return (
                      <tr
                        key={cId}
                        className={`hover:bg-[#F8FAFC]/80 dark:hover:bg-[#161b22]/30 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-500/5 dark:bg-emerald-950/10' : ''
                        }`}
                        onClick={() => navigate(`/admin/campaigns/${cId}`)}
                      >
                        {/* Checkbox */}
                        <td
                          className="px-5 py-3 text-center no-row-click"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="cursor-pointer rounded accent-[#16A34A]"
                            checked={isSelected}
                            onChange={() => handleSelectRow(cId)}
                          />
                        </td>

                        {/* Banner & Campaign Info */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-11 rounded-lg border border-gray-150 overflow-hidden bg-slate-50 flex-shrink-0 flex items-center justify-center">
                              {imageUrl ? (
                                <img src={imageUrl} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                              ) : (
                                <ImageIcon size={14} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{c.name}</p>
                              {c.description && <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[150px]">{c.description}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Status Badges */}
                        <td className="px-5 py-3 font-semibold">
                          {c.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1.5 bg-[#EEFCF2] text-[#16A34A] border border-emerald-150 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> ACTIVE
                            </span>
                          )}
                          {c.status === 'SCHEDULED' && (
                            <span className="inline-flex items-center gap-1.5 bg-[#FFFBEB] text-[#D97706] border border-[#FCD34D] px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> SCHEDULED
                            </span>
                          )}
                          {c.status === 'PAUSED' && (
                            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-650 border border-red-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> PAUSED
                            </span>
                          )}
                          {c.status === 'DRAFT' && (
                            <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> DRAFT
                            </span>
                          )}
                          {c.status === 'EXPIRED' && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-350 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> EXPIRED
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-5 py-3 text-slate-500 font-semibold leading-relaxed">
                          <div>{formatDate(c.startTime || c.startDate)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            to {formatDate(c.endTime || c.endDate)}
                          </div>
                        </td>

                        {/* Discount */}
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 bg-[#EFF6FF] text-[#1D4ED8] border border-blue-150 px-2 py-0.5 rounded-md font-bold">
                            <Tag size={10} />
                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`}
                          </span>
                        </td>

                        {/* Products count */}
                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">{c.totalProducts ?? 0} items</td>

                        {/* Business performance metrics */}
                        <td className="px-5 py-3 font-bold text-gray-950 dark:text-white text-right">NPR {(c.revenue ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-white text-right">{c.orders ?? 0}</td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-450 font-semibold text-right">{(c.views ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-450 font-bold text-right">{c.ctr ?? 0.0}%</td>
                        <td className="px-5 py-3 text-[#16A34A] font-bold text-right">{c.conversion ?? 0.0}%</td>

                        {/* Actions menu vertical dots */}
                        <td
                          className="px-5 py-3 text-right no-row-click"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === cId ? null : cId);
                              }}
                              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                            
                            {activeMenuId === cId && (
                              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#161b22] border border-[#E5E7EB] dark:border-white/10 rounded-lg shadow-lg z-25 overflow-hidden py-1">
                                <button
                                  onClick={() => { navigate(`/admin/campaigns/${cId}`); setActiveMenuId(null); }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                                >
                                  <Eye size={12} /> View Details
                                </button>
                                <button
                                  onClick={() => { toggleCampaignStatus(c); setActiveMenuId(null); }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                                >
                                  {c.status === 'PAUSED' ? <Play size={12} className="text-emerald-500" /> : <Pause size={12} className="text-amber-500" />}
                                  {c.status === 'PAUSED' ? 'Activate Campaign' : 'Pause Campaign'}
                                </button>
                                <button
                                  onClick={() => { 
                                    setForm({
                                      name: `${c.name} (Copy)`,
                                      description: c.description || '',
                                      startDate: c.startTime || c.startDate || '',
                                      endDate: c.endTime || c.endDate || '',
                                      discountType: c.discountType,
                                      discountValue: c.discountValue || '',
                                      maxProducts: c.maxProducts || '',
                                      applyTo: 'ALL', targetProducts: [], targetCategories: [],
                                      targetBrands: [], targetSellers: [], autoStart: true, autoEnd: true,
                                      featured: false, homepageBanner: false, sendNotifications: false
                                    });
                                    setShowCreate(true);
                                    setActiveMenuId(null);
                                    showToast('📋 Duplicated form ready');
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                                >
                                  <Copy size={12} /> Duplicate Campaign
                                </button>
                                <button
                                  onClick={() => { 
                                    setForm({
                                      name: c.name,
                                      description: c.description || '',
                                      startDate: c.startTime || c.startDate || '',
                                      endDate: c.endTime || c.endDate || '',
                                      discountType: c.discountType,
                                      discountValue: c.discountValue || '',
                                      maxProducts: c.maxProducts || '',
                                      applyTo: 'ALL', targetProducts: [], targetCategories: [],
                                      targetBrands: [], targetSellers: [], autoStart: true, autoEnd: true,
                                      featured: false, homepageBanner: false, sendNotifications: false
                                    });
                                    setShowCreate(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                                >
                                  <Edit3 size={12} /> Edit Campaign
                                </button>
                                <div className="border-t border-gray-100 dark:border-white/5 my-1" />
                                <button
                                  onClick={() => { setDeleteCampaign(c); setShowDelete(true); setActiveMenuId(null); }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-xs font-bold text-red-600 flex items-center gap-1.5"
                                >
                                  <Trash2 size={12} /> Delete Campaign
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ─── CREATE/EDIT CAMPAIGN DRAWER (700PX WIDTH) ─── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-[700px] h-full shadow-2xl bg-white dark:bg-[#0d1117] border-l border-gray-200 dark:border-white/5 flex flex-col z-50 transform translate-x-0 transition-transform duration-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-white/5">
              <div>
                <h2 className="font-black text-sm uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                  <Megaphone size={16} className="text-[#16A34A]" />
                  Campaign Configuration
                </h2>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Setup targeted campaign parameters & details</p>
              </div>
              <button 
                onClick={() => setShowCreate(false)} 
                className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Structured Multi-Section Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* SECTION 1: Campaign Information */}
              <div className="bg-gray-50/50 dark:bg-white/1 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-gray-150 pb-2">
                  Section 1: Campaign Information
                </h3>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Campaign Name *</label>
                  <input 
                    value={form.name} 
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(err => ({ ...err, name: '' })); }}
                    placeholder="e.g. New Year 2026 Mega Sale"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-semibold transition-all ${
                      errors.name ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-emerald-500/20'
                    }`} 
                  />
                  {errors.name ? (
                    <p className="text-[9px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</p>
                  ) : (
                    <p className="text-[9px] text-gray-400 font-medium">Max 50 characters</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe target audience and key selling taglines..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-semibold resize-none" 
                  />
                </div>
              </div>

              {/* SECTION 2: Campaign Duration */}
              <div className="bg-gray-50/50 dark:bg-white/1 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-gray-150 pb-2">
                  Section 2: Campaign Duration
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Start Date *</label>
                    <input 
                      type="datetime-local" 
                      value={form.startDate} 
                      onChange={e => { setForm(f => ({ ...f, startDate: e.target.value })); if (errors.startDate) setErrors(err => ({ ...err, startDate: '' })); }}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-semibold ${
                        errors.startDate ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-emerald-500/20'
                      }`} 
                    />
                    {errors.startDate && <p className="text-[9px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.startDate}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">End Date *</label>
                    <input 
                      type="datetime-local" 
                      value={form.endDate} 
                      onChange={e => { setForm(f => ({ ...f, endDate: e.target.value })); if (errors.endDate) setErrors(err => ({ ...err, endDate: '' })); }}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-semibold ${
                        errors.endDate ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-emerald-500/20'
                      }`} 
                    />
                    {errors.endDate && <p className="text-[9px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.endDate}</p>}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Discount Configuration */}
              <div className="bg-gray-50/50 dark:bg-white/1 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-gray-150 pb-2">
                  Section 3: Discount Configuration
                </h3>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount Type *</label>
                  <div className="flex gap-4">
                    {['PERCENTAGE', 'FLAT', 'FREE_SHIPPING'].map(t => (
                      <label key={t} className={`flex-1 flex items-center justify-center gap-2 border rounded-lg p-2.5 cursor-pointer font-bold transition-all ${
                        form.discountType === t 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                          : 'border-gray-200 text-gray-500 bg-white dark:bg-white/5 hover:bg-gray-50'
                      }`}>
                        <input 
                          type="radio" 
                          name="discountType" 
                          value={t} 
                          checked={form.discountType === t}
                          onChange={() => { setForm(f => ({ ...f, discountType: t, discountValue: t === 'FREE_SHIPPING' ? '0' : f.discountValue })); if (errors.discountValue) setErrors(err => ({ ...err, discountValue: '' })); }} 
                          className="sr-only" 
                        />
                        <span className="text-xs">{nice(t)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {form.discountType !== 'FREE_SHIPPING' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Discount Value {form.discountType === 'PERCENTAGE' ? '(%)' : '(NPR)'} *
                    </label>
                    <input 
                      type="number" 
                      value={form.discountValue} 
                      onChange={e => { setForm(f => ({ ...f, discountValue: e.target.value })); if (errors.discountValue) setErrors(err => ({ ...err, discountValue: '' })); }}
                      placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 500'}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-semibold ${
                        errors.discountValue ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-emerald-500/20'
                      }`} 
                    />
                    {errors.discountValue ? (
                      <p className="text-[9px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.discountValue}</p>
                    ) : (
                      <p className="text-[9px] text-gray-400 font-medium">
                        {form.discountType === 'PERCENTAGE' ? 'Allowed values: 1% to 90%' : 'Must be a positive numeric amount'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 4: Product Targeting */}
              <div className="bg-gray-50/50 dark:bg-white/1 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-4">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-gray-150 pb-2">
                  Section 4: Product Targeting & Scope
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Products */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Products ({form.targetProducts.length} selected)</label>
                    <div className="border border-gray-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 bg-white dark:bg-white/5">
                      {targetMockData.products.map(p => {
                        const active = form.targetProducts.includes(p);
                        return (
                          <div 
                            key={p} onClick={() => handleToggleTargetItem('targetProducts', p)}
                            className={`p-1.5 rounded text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                              active ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span>{p}</span>
                            {active && <Check size={11} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Categories */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Categories ({form.targetCategories.length} selected)</label>
                    <div className="border border-gray-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 bg-white dark:bg-white/5">
                      {targetMockData.categories.map(c => {
                        const active = form.targetCategories.includes(c);
                        return (
                          <div 
                            key={c} onClick={() => handleToggleTargetItem('targetCategories', c)}
                            className={`p-1.5 rounded text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                              active ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span>{c}</span>
                            {active && <Check size={11} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Brands */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Brands ({form.targetBrands.length} selected)</label>
                    <div className="border border-gray-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 bg-white dark:bg-white/5">
                      {targetMockData.brands.map(b => {
                        const active = form.targetBrands.includes(b);
                        return (
                          <div 
                            key={b} onClick={() => handleToggleTargetItem('targetBrands', b)}
                            className={`p-1.5 rounded text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                              active ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span>{b}</span>
                            {active && <Check size={11} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Sellers */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Sellers ({form.targetSellers.length} selected)</label>
                    <div className="border border-gray-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 bg-white dark:bg-white/5">
                      {targetMockData.sellers.map(s => {
                        const active = form.targetSellers.includes(s);
                        return (
                          <div 
                            key={s} onClick={() => handleToggleTargetItem('targetSellers', s)}
                            className={`p-1.5 rounded text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                              active ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span>{s}</span>
                            {active && <Check size={11} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Campaign Banner Upload */}
              <div className="bg-gray-50/50 dark:bg-white/1 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-gray-150 pb-2">
                  Section 5: Campaign Banner Upload
                </h3>

                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragActive ? 'border-emerald-600 bg-emerald-50/30' : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-white/5'
                  }`}
                >
                  <UploadCloud size={28} className="text-gray-400 mb-2" />
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Drag & drop your campaign banner image here</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">Recommended size: 1920 × 600 px (Max 10MB)</p>
                  
                  <label className="mt-4 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0">
                    Browse File
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                </div>

                {/* Banner Preview Card */}
                {imagePreview && (
                  <div className="border border-gray-200 rounded-xl p-3 bg-white dark:bg-white/5 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Image Preview</span>
                      <button onClick={removeImage} className="text-red-500 hover:underline">Remove</button>
                    </div>
                    <div className="w-full aspect-[3/1] rounded-lg overflow-hidden border border-gray-150 flex items-center justify-center bg-slate-50">
                      <img src={imagePreview} alt="Campaign banner" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 6: Campaign Rules */}
              <div className="bg-gray-50/50 dark:bg-white/1 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-gray-150 pb-2">
                  Section 6: Campaign Rules
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Max Products per Seller</label>
                    <input 
                      type="number" 
                      min="1"
                      value={form.maxProducts}
                      onChange={e => setForm(prev => ({ ...prev, maxProducts: e.target.value }))}
                      placeholder="Leave blank for unlimited"
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Rule Apply To</label>
                    <select
                      value={form.applyTo}
                      onChange={e => setForm(prev => ({ ...prev, applyTo: e.target.value }))}
                      className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Products</option>
                      <option value="SELECTED_PRODUCTS">Selected Products Only</option>
                      <option value="SELECTED_CATEGORIES">Selected Categories Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 7: Campaign Settings */}
              <div className="bg-gray-50/50 dark:bg-white/1 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-gray-150 pb-2">
                  Section 7: Campaign Settings
                </h3>

                <div className="grid grid-cols-2 gap-y-3 gap-x-6 pt-1">
                  {[
                    { key: 'autoStart', label: 'Auto Start Campaign' },
                    { key: 'autoEnd', label: 'Auto End Campaign' },
                    { key: 'featured', label: 'Featured Campaign' },
                    { key: 'homepageBanner', label: 'Display on Homepage' },
                    { key: 'sendNotifications', label: 'Notify Customers' }
                  ].map(toggle => (
                    <label key={toggle.key} className="flex items-center gap-3 cursor-pointer select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={form[toggle.key]}
                          onChange={e => setForm(prev => ({ ...prev, [toggle.key]: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`w-9 h-5 rounded-full transition-colors ${form[toggle.key] ? 'bg-[#16A34A]' : 'bg-gray-200 dark:bg-white/10'}`} />
                        <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-md transition-transform transform ${form[toggle.key] ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{toggle.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-white/5 bg-gray-50/50">
              <button 
                onClick={() => setShowCreate(false)} 
                className="px-4 py-2 border border-gray-250 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate} 
                disabled={saving}
                className="px-5 py-2.5 bg-[#16A34A] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Campaign'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── DELETE MODAL ─── */}
      {showDelete && deleteCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" onClick={() => setShowDelete(false)} />
          <div className="relative rounded-xl border border-gray-200 dark:border-white/5 shadow-2xl w-full max-w-sm overflow-hidden bg-white dark:bg-[#0d1117] transform scale-100 transition-all duration-300">
            <div className="px-6 py-5 border-b border-gray-150 dark:border-white/5">
              <h2 className="font-black text-sm uppercase tracking-wider text-gray-900 dark:text-white">Delete Campaign</h2>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold leading-relaxed text-gray-500">
                Are you sure you want to delete <span className="font-bold text-red-500">{deleteCampaign.name}</span>? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50">
              <button 
                onClick={() => setShowDelete(false)} 
                className="px-4 py-2 border border-gray-250 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                disabled={working}
                className="px-5 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
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
