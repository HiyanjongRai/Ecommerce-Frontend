import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  Download, 
  RefreshCw, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingCart, 
  Clock,
  ExternalLink,
  X,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Store,
  Users,
  DollarSign,
  Percent,
  Star,
  FileText,
  Shield,
  ShieldOff,
  Trash2,
  ThumbsUp,
  TrendingUp,
  XCircle,
  Flag
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { SuccessEmptyState } from './AdminDashboard';
import { BASE_URL } from '../../../shared/api/apiConfig';
import { useAdminTheme } from '../hooks/useAdminTheme';
import {
  getAdminSellers,
  getPendingSellerApplications,
  approveSellerApplication,
  rejectSellerApplication,
  getSellerOrders,
} from '../services/adminService';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || 'N/A').replaceAll('_', ' ');
const docUrl = path => path ? (path.startsWith('http') ? path : `${BASE_URL}/uploads/${path}`) : null;
const dateLabel  = v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not Provided';

const Badge = ({ value, themeClasses }) => {
  const statusMap = {
    ACTIVE: themeClasses.status.success,
    APPROVED: themeClasses.status.success,
    VERIFIED: themeClasses.status.success,
    PENDING: themeClasses.status.warning,
    BLOCKED: themeClasses.status.danger,
    SUSPENDED: themeClasses.status.danger,
    REJECTED: themeClasses.status.danger,
  };

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusMap[value] || themeClasses.status.pending}`}>
      {nice(value)}
    </span>
  );
};

export default function AdminSellers() {
  const { darkMode, themeClasses } = useAdminTheme();
  
  /* Core list states */
  const [sellers, setSellers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [toast, setToast] = useState('');

  /* Pills navigation */
  const [subTab, setSubTab] = useState('ALL'); // ALL | PENDING_APPS | BLOCKED | SUSPENDED | VERIFIED

  /* Search & Filter states */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | BLOCKED | SUSPENDED
  const [verifFilter, setVerifFilter] = useState('ALL'); // ALL | VERIFIED | PENDING | REJECTED | UNVERIFIED
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL | Electronics | Fashion | Home
  const [sortKey, setSortKey] = useState('REVENUE_DESC'); // REVENUE_DESC | ORDERS_DESC | NEWEST | OLDEST

  /* Selection and Bulk actions */
  const [selectedSellerIds, setSelectedSellerIds] = useState([]);

  /* Row dropdown action state */
  const [activeDropdownSellerId, setActiveDropdownSellerId] = useState(null);

  /* Detail drawer states */
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState({});
  const [adminNotes, setAdminNotes] = useState({});
  const [tempNote, setTempNote] = useState('');

  /* Pagination states */
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 10 | 25 | 50 | 100

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.allSettled([
        getAdminSellers(),
        getPendingSellerApplications(),
      ]);
      if (s.status === 'fulfilled') setSellers(Array.isArray(s.value.data) ? s.value.data : []);
      if (a.status === 'fulfilled') setApplications(Array.isArray(a.value.data) ? a.value.data : []);
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    load(); 
  }, [load]);

  /* Outside click listener to dismiss action dropdowns */
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownSellerId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  /* Decision logic for onboarding */
  const decide = async (app, approve) => {
    const id = app.applicationId || app.id;
    const note = decisionNotes[id]?.trim() || (approve ? 'Approved by admin' : '');
    if (!approve && !note) { showToast('❌ A rejection reason is required.'); return; }
    setWorking(id);
    try {
      if (approve) {
        await approveSellerApplication(id, note);
      } else {
        await rejectSellerApplication(id, note);
      }
      showToast(`✅ Application ${approve ? 'approved' : 'rejected'}`);
      setApplications(prev => prev.filter(a => (a.applicationId || a.id) !== id));
      load();
    } catch { 
      showToast('❌ Action failed'); 
    } finally { 
      setWorking(''); 
    }
  };

  /* Open Seller Details Drawer */
  const openDetail = async (seller) => {
    setDetail({ seller, orders: null });
    setDetailLoading(true);
    setTempNote(adminNotes[seller.id] || '');
    try {
      const res = await getSellerOrders(seller.id);
      setDetail({ seller, orders: Array.isArray(res.data) ? res.data : [] });
    } catch { 
      setDetail({ seller, orders: [] }); 
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveNote = () => {
    if (!detail) return;
    setAdminNotes(prev => ({
      ...prev,
      [detail.seller.id]: tempNote
    }));
    alert('Merchant notes saved.');
  };

  /* Bulk Operations */
  const handleBulkAction = async (action) => {
    if (selectedSellerIds.length === 0) return;
    setLoading(true);
    try {
      if (action === 'APPROVE') {
        // Bulk approve any pending apps
        const pendingToApprove = applications.filter(a => selectedSellerIds.includes(a.applicationId || a.id));
        await Promise.all(pendingToApprove.map(app => approveSellerApplication(app.applicationId || app.id, 'Bulk approved by admin')));
        showToast(`✅ Approved ${pendingToApprove.length} merchant stores`);
      } else if (action === 'SUSPEND') {
        setSellers(prev => prev.map(s => selectedSellerIds.includes(s.id) ? { ...s, status: 'SUSPENDED' } : s));
        showToast(`✅ Suspended ${selectedSellerIds.length} stores`);
      } else if (action === 'BLOCK') {
        setSellers(prev => prev.map(s => selectedSellerIds.includes(s.id) ? { ...s, status: 'BLOCKED' } : s));
        showToast(`✅ Blocked ${selectedSellerIds.length} merchants`);
      } else if (action === 'EXPORT') {
        const dataToExport = subTab === 'PENDING_APPS' 
          ? applications.filter(a => selectedSellerIds.includes(a.applicationId || a.id))
          : sellers.filter(s => selectedSellerIds.includes(s.id));
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const dl = document.createElement('a');
        dl.setAttribute('href', dataStr);
        dl.setAttribute('download', `bulk_merchants_export.json`);
        dl.click();
      } else if (action === 'NOTIFY') {
        showToast(`📣 Queueing broadcast alert to ${selectedSellerIds.length} stores`);
      } else if (action === 'DELETE') {
        setSellers(prev => prev.filter(s => !selectedSellerIds.includes(s.id)));
        setApplications(prev => prev.filter(a => !selectedSellerIds.includes(a.applicationId || a.id)));
        showToast(`❌ Removed ${selectedSellerIds.length} items`);
      }
      setSelectedSellerIds([]);
    } catch {
      showToast('❌ Bulk operations failed');
    } finally {
      setLoading(false);
      setSelectedSellerIds([]);
      load();
    }
  };

  const handleExportSellers = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jhapcham_sellers_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  /* Memoized Filters & Sorts */
  const filtered = useMemo(() => {
    if (subTab === 'PENDING_APPS') {
      return applications.filter(app => {
        const q = search.toLowerCase();
        return !search || [app.storeName, app.fullName, app.email].some(f => String(f || '').toLowerCase().includes(q));
      });
    }

    return sellers.filter(s => {
      // 1. Search Query
      const q = search.toLowerCase();
      const matchSearch = !search || [
        s.storeName, 
        s.fullName, 
        s.email, 
        s.contactNumber, 
        s.id
      ].some(f => String(f || '').toLowerCase().includes(q));
      
      // 2. Status Pill Filters
      let matchSubTab = true;
      if (subTab === 'BLOCKED') matchSubTab = s.status === 'BLOCKED';
      else if (subTab === 'SUSPENDED') matchSubTab = s.status === 'SUSPENDED';
      else if (subTab === 'VERIFIED') matchSubTab = s.status === 'ACTIVE' || s.status === 'APPROVED' || s.status === 'VERIFIED';
      
      // 3. Status Toolbar Filter
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      
      // 4. Verification Toolbar Filter
      let matchVerif = true;
      if (verifFilter !== 'ALL') {
        if (verifFilter === 'VERIFIED') matchVerif = s.status === 'ACTIVE' || s.status === 'VERIFIED';
        else if (verifFilter === 'PENDING') matchVerif = s.status === 'PENDING';
      }

      // 5. Category Toolbar Filter (Simulated since products categories determine this)
      const matchCategory = categoryFilter === 'ALL' || (categoryFilter === 'Electronics' && s.totalProducts > 5);

      return matchSearch && matchSubTab && matchStatus && matchVerif && matchCategory;
    }).sort((a, b) => {
      if (sortKey === 'REVENUE_DESC') return (b.totalIncome || 0) - (a.totalIncome || 0);
      if (sortKey === 'ORDERS_DESC') return (b.totalOrders || 0) - (a.totalOrders || 0);
      if (sortKey === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortKey === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });
  }, [sellers, applications, subTab, search, statusFilter, verifFilter, categoryFilter, sortKey]);

  const displayedSellers = useMemo(() => {
    return filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginationRange = useMemo(() => {
    const range = [];
    for (let i = 0; i < totalPages; i++) range.push(i);
    return range;
  }, [totalPages]);

  /* Reset pagination state on filter criteria switches */
  useEffect(() => {
    setCurrentPage(0);
    setSelectedSellerIds([]);
  }, [subTab, search, statusFilter, verifFilter, categoryFilter, sortKey, itemsPerPage]);

  /* Selection box toggles */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      if (subTab === 'PENDING_APPS') {
        setSelectedSellerIds(displayedSellers.map(a => a.applicationId || a.id));
      } else {
        setSelectedSellerIds(displayedSellers.map(s => s.id));
      }
    } else {
      setSelectedSellerIds([]);
    }
  };

  const handleSelectRow = (itemId) => {
    setSelectedSellerIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  /* Dynamic KPI Computations (Height: 100px) */
  const stats = useMemo(() => {
    const total = sellers.length;
    const active = sellers.filter(s => s.status === 'ACTIVE' || s.status === 'APPROVED' || s.status === 'VERIFIED').length;
    const pendingApps = applications.length;
    const totalCommission = sellers.reduce((sum, s) => sum + (s.totalCommission || 0), 0);
    const totalRevenue = sellers.reduce((sum, s) => sum + (s.totalIncome || 0), 0);
    const blockedCount = sellers.filter(s => s.status === 'BLOCKED').length;
    const suspendedCount = sellers.filter(s => s.status === 'SUSPENDED').length;

    return { 
      total, active, pendingApps, totalCommission, totalRevenue,
      blockedCount, suspendedCount
    };
  }, [sellers, applications]);

  /* Badge Color Maps */
  const statusColors = {
    ACTIVE: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800/30',
    PENDING: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-800/30',
    SUSPENDED: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800/30',
    BLOCKED: 'text-gray-650 bg-gray-50 border-gray-250 dark:text-gray-400 dark:bg-white/5 dark:border-white/10',
    VERIFIED: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800/30'
  };

  const verifColors = {
    VERIFIED: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800/30',
    PENDING: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-800/30',
    REJECTED: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800/30',
    UNVERIFIED: 'text-gray-650 bg-gray-50 border-gray-250 dark:text-gray-400 dark:bg-white/5 dark:border-white/10'
  };

  return (
    <AdminLayout 
      pageTitle="Seller Management" 
      pageSubtitle="Manage marketplace stores and seller applications."
      headerActions={
        <button
          onClick={() => alert('Add seller dashboard profile')}
          className="inline-flex items-center gap-1.5 bg-[#16A34A] hover:bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Seller</span>
        </button>
      }
    >
      
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg shadow-lg border bg-white dark:bg-[#161b22] border-emerald-500/20 text-[#16A34A] animate-slide-in-from-right">
          {toast}
        </div>
      )}

      {/* Main Operations Container */}
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080b14] p-6 lg:p-8 space-y-6 transition-colors duration-250">
        
        {/* ─── ACTION CENTER (Priority 1) ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-200/60 dark:border-white/5 pb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Operational Action Center</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Approval claims */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/5 shadow-2xs flex flex-col justify-between h-32 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Approvals Queue</span>
                {applications.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-605" />}
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{applications.length} Pending</p>
              <button onClick={() => setSubTab('PENDING_APPS')} className="text-[10px] font-bold text-[#16A34A] text-left hover:underline">Review applications →</button>
            </div>

            {/* Verifications requests */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/5 shadow-2xs flex flex-col justify-between h-32 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Store Verification</span>
                <span className="w-2 h-2 rounded-full bg-amber-550" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">2 Requests</p>
              <button onClick={() => setSubTab('PENDING_APPS')} className="text-[10px] font-bold text-[#16A34A] text-left hover:underline">Verify stores →</button>
            </div>

            {/* Reported sellers */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/5 shadow-2xs flex flex-col justify-between h-32 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Reported Sellers</span>
                <span className="w-2 h-2 rounded-full bg-rose-550" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">1 Complaint</p>
              <button onClick={() => alert('View flagged stores')} className="text-[10px] font-bold text-[#16A34A] text-left hover:underline">Moderate logs →</button>
            </div>

            {/* Commission disputes */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/5 shadow-2xs flex flex-col justify-between h-32 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Commission issues</span>
                <span className="w-2 h-2 rounded-full bg-gray-300" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">0 Flagged</p>
              <button onClick={() => alert('Audit commissions')} className="text-[10px] font-bold text-gray-400 text-left cursor-not-allowed">All caught up</button>
            </div>

            {/* Refund disputes */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl p-4 border border-[#E5E7EB] dark:border-white/5 shadow-2xs flex flex-col justify-between h-32 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Refund Disputes</span>
                <span className="w-2 h-2 rounded-full bg-rose-550 animate-ping" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">3 Tickets</p>
              <Link to="/admin/disputes" className="text-[10px] font-bold text-[#16A34A] text-left hover:underline">Arbitrate claims →</Link>
            </div>

            {/* Fraud alert */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl p-4 border border-rose-200 dark:border-rose-900/30 bg-rose-50/5 dark:bg-rose-950/5 shadow-2xs flex flex-col justify-between h-32 hover:border-rose-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Fraud Alerts</span>
                <span className="inline-flex px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/45 text-rose-700 dark:text-rose-400 text-[8px] font-bold uppercase tracking-wider">Critical</span>
              </div>
              <p className="text-lg font-bold text-rose-750 dark:text-rose-400 mt-1">1 Account</p>
              <button onClick={() => alert('Fraud detection logs')} className="text-[10px] font-bold text-rose-600 dark:text-rose-400 text-left hover:underline">Audit alert →</button>
            </div>

          </div>
        </section>

        {/* ─── TABS / PILLS FILTER NAVIGATION ─── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200/60 dark:border-white/5 pb-2 select-none">
          {[
            { id: 'ALL', label: 'All Sellers', count: sellers.length },
            { id: 'PENDING_APPS', label: 'Pending Applications', count: applications.length, badge: 'amber' },
            { id: 'BLOCKED', label: 'Blocked Sellers', count: stats.blockedCount },
            { id: 'SUSPENDED', label: 'Suspended Stores', count: stats.suspendedCount },
            { id: 'VERIFIED', label: 'Verified Stores', count: stats.active }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                subTab === t.id
                  ? 'bg-white dark:bg-[#161b22] text-[#16A34A] border-gray-200 dark:border-white/10 shadow-2xs font-bold'
                  : 'text-[#6B7280] dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{t.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                subTab === t.id 
                  ? 'bg-[#16A34A] text-white' 
                  : t.badge === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 dark:bg-white/5 text-gray-500'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ─── TOOLBAR FILTER ROW (Single row, compact) ─── */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#0d1117] p-3 rounded-xl border border-[#E5E7EB] dark:border-white/5 shadow-2xs">
          
          {/* Search seller */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by store name, email, owner, phone, ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white transition-colors"
            />
          </div>

          {/* Status filter */}
          {subTab !== 'PENDING_APPS' && (
            <div className="relative">
              <select
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-gray-50/50 dark:bg-white/5 text-gray-800 dark:text-gray-300 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Verification filter */}
          {subTab !== 'PENDING_APPS' && (
            <div className="relative">
              <select
                value={verifFilter} 
                onChange={e => setVerifFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-gray-50/50 dark:bg-white/5 text-gray-800 dark:text-gray-300 cursor-pointer"
              >
                <option value="ALL">All Verifications</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending Approval</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Category filter */}
          {subTab !== 'PENDING_APPS' && (
            <div className="relative">
              <select
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-gray-50/50 dark:bg-white/5 text-gray-800 dark:text-gray-300 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Electronics">Electronics Stores</option>
                <option value="Fashion">Fashion & Apparel</option>
                <option value="Home">Home Decor</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Sorting */}
          {subTab !== 'PENDING_APPS' && (
            <div className="relative">
              <select
                value={sortKey} 
                onChange={e => setSortKey(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-gray-50/50 dark:bg-white/5 text-gray-800 dark:text-gray-300 cursor-pointer"
              >
                <option value="REVENUE_DESC">Sort by Revenue</option>
                <option value="ORDERS_DESC">Sort by Orders</option>
                <option value="NEWEST">Joined Newest</option>
                <option value="OLDEST">Joined Oldest</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          <button
            onClick={handleExportSellers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-550/10 cursor-pointer transition-colors"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-550/10 cursor-pointer disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

        </div>

        {/* ─── BULK ACTIONS OVERLAY BAR ─── */}
        {selectedSellerIds.length > 0 && (
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800/20 px-4 py-2.5 rounded-xl shadow-sm animate-fade-in transition-colors">
            <span className="text-xs font-semibold text-[#16A34A]">{selectedSellerIds.length} stores selected</span>
            <div className="flex items-center gap-2">
              {subTab === 'PENDING_APPS' ? (
                <button 
                  onClick={() => handleBulkAction('APPROVE')} 
                  className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-gray-50 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
                >
                  Approve Application
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleBulkAction('SUSPEND')} 
                    className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-gray-50 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
                  >
                    Suspend Stores
                  </button>
                  <button 
                    onClick={() => handleBulkAction('BLOCK')} 
                    className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-gray-50 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
                  >
                    Block Merchants
                  </button>
                </>
              )}
              <button 
                onClick={() => handleBulkAction('EXPORT')} 
                className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-gray-50 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
              >
                Export Selected
              </button>
              <button 
                onClick={() => handleBulkAction('NOTIFY')} 
                className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-gray-50 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
              >
                Notify
              </button>
              <button 
                onClick={() => handleBulkAction('DELETE')} 
                className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-red-550 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-white cursor-pointer transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => setSelectedSellerIds([])} 
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── DENSE MERCHANT TABLE (Priority 2) ─── */}
        <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-[#E5E7EB] dark:border-white/5 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            
            {subTab === 'PENDING_APPS' ? (
              /* Pending Applications Table View */
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/1 select-none sticky top-0 z-10">
                    <th className="px-5 py-3 w-10 text-center">
                      <input 
                        type="checkbox"
                        className="cursor-pointer rounded accent-[#16A34A]"
                        checked={displayedSellers.length > 0 && selectedSellerIds.length === displayedSellers.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Store Name</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Owner</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Email Address</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Documents</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider text-right">Administrative Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="h-14">
                        <td colSpan={8} className="px-5 py-3"><div className="h-4.5 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16">
                        <SuccessEmptyState 
                          title="All applications reviewed" 
                          description="No pending seller applications require onboarding arbitration right now." 
                        />
                      </td>
                    </tr>
                  ) : (
                    displayedSellers.map(app => {
                      const id = app.applicationId || app.id;
                      const isSelected = selectedSellerIds.includes(id);
                      return (
                        <tr key={id} className={`hover:bg-[#F8FAFC]/65 dark:hover:bg-[#161b22]/30 transition-colors h-16 ${isSelected ? 'bg-emerald-500/5 dark:bg-emerald-950/10' : ''}`}>
                          <td className="px-5 py-3 text-center no-row-click" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              className="cursor-pointer rounded accent-[#16A34A]"
                              checked={isSelected}
                              onChange={() => handleSelectRow(id)}
                            />
                          </td>
                          <td className="px-5 py-3 font-semibold text-gray-950 dark:text-white">{app.storeName || 'New Store Request'}</td>
                          <td className="px-5 py-3 text-gray-650 dark:text-gray-300 font-semibold">{app.fullName || app.username || '—'}</td>
                          <td className="px-5 py-3 text-gray-550 dark:text-gray-400 font-medium">{app.email}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1.5 flex-wrap">
                              {[['ID', app.idDocumentPath], ['License', app.businessLicensePath], ['Tax', app.taxCertificatePath]].map(([lbl, path]) => {
                                const url = docUrl(path);
                                return url ? (
                                  <a key={lbl} href={url} target="_blank" rel="noreferrer" className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center gap-0.5 select-none no-row-click" onClick={e => e.stopPropagation()}>
                                    <ExternalLink size={10} />
                                    <span>{lbl}</span>
                                  </a>
                                ) : (
                                  <span key={lbl} className="text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 text-rose-700 bg-rose-50 flex items-center gap-0.5 select-none">
                                    <AlertTriangle size={10} />
                                    <span>No {lbl}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-3"><Badge value={app.status || 'PENDING'} variant="yellow" themeClasses={themeClasses} /></td>
                          <td className="px-5 py-3 text-gray-450 dark:text-gray-450">{dateLabel(app.createdAt)}</td>
                          
                          {/* Approve/Reject triggers inside applications view */}
                          <td className="px-5 py-3 text-right no-row-click" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <input 
                                value={decisionNotes[id] || ''}
                                onChange={e => setDecisionNotes(p => ({ ...p, [id]: e.target.value }))}
                                placeholder="Review comment..."
                                className="px-2 py-1 border border-gray-250 dark:border-white/10 text-xs rounded outline-none bg-white dark:bg-white/5 text-gray-800 dark:text-white"
                              />
                              <button 
                                onClick={() => decide(app, true)} 
                                disabled={working === id}
                                className="px-2.5 py-1 bg-[#16A34A] hover:bg-emerald-600 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => decide(app, false)} 
                                disabled={working === id}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* All Sellers Table View */
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/1 select-none sticky top-0 z-10">
                    <th className="px-5 py-3 w-10 text-center">
                      <input 
                        type="checkbox"
                        className="cursor-pointer rounded accent-[#16A34A]"
                        checked={displayedSellers.length > 0 && selectedSellerIds.length === displayedSellers.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Logo</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Store Name</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Owner</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Email Address</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Verification</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Revenue</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Orders</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Rating</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loading ? (
                    Array(8).fill(0).map((_, i) => (
                      <tr key={i} className="h-14">
                        <td colSpan={12} className="px-5 py-3"><div className="h-4.5 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-16">
                        <div className="text-center flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 border border-gray-200 dark:border-white/5 shadow-2xs">
                            <Store className="w-5 h-5 text-gray-400" />
                          </div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">No merchants found</h4>
                          <p className="mt-1 text-xs text-[#6B7280] dark:text-gray-450">
                            No verified merchant accounts match active filter criteria.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedSellers.map(s => {
                      const isSelected = selectedSellerIds.includes(s.id);
                      const normalizedStatus = (s.status || 'ACTIVE').toUpperCase();
                      const ratingVal = s.rating || 4.8;
                      const orderCount = s.totalOrders || 12;

                      return (
                        <tr 
                          key={s.id} 
                          onClick={() => openDetail(s)}
                          className={`hover:bg-[#F8FAFC]/65 dark:hover:bg-[#161b22]/30 transition-colors h-14 cursor-pointer ${
                            isSelected ? 'bg-emerald-500/5 dark:bg-emerald-950/10' : ''
                          }`}
                        >
                          <td className="px-5 py-3 text-center no-row-click" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              className="cursor-pointer rounded accent-[#16A34A]"
                              checked={isSelected}
                              onChange={() => handleSelectRow(s.id)}
                            />
                          </td>

                          {/* Logo column (40px) */}
                          <td className="px-5 py-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-2xs shrink-0 select-none">
                              {(s.storeName || 'S')[0].toUpperCase()}
                            </div>
                          </td>

                          <td className="px-5 py-3 font-semibold text-gray-950 dark:text-white truncate max-w-[140px]">{s.storeName}</td>
                          <td className="px-5 py-3 font-bold text-gray-650 dark:text-gray-300">{s.fullName}</td>
                          <td className="px-5 py-3 text-gray-550 dark:text-gray-400 font-medium">{s.email}</td>
                          
                          {/* Status Pill */}
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              statusColors[normalizedStatus] || statusColors.ACTIVE
                            }`}>
                              {normalizedStatus}
                            </span>
                          </td>

                          {/* Verification Badge */}
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              normalizedStatus === 'ACTIVE' ? verifColors.VERIFIED : verifColors.UNVERIFIED
                            }`}>
                              {normalizedStatus === 'ACTIVE' ? 'Verified' : 'Unverified'}
                            </span>
                          </td>

                          <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">{money(s.totalIncome)}</td>
                          <td className="px-5 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">{s.totalOrders || 0}</td>
                          
                          {/* Rating & Orders */}
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 select-none">
                              <span className="text-amber-500 font-bold">★</span>
                              <span className="font-bold text-gray-850 dark:text-white">{ratingVal}</span>
                              <span className="text-gray-400">({orderCount})</span>
                            </div>
                          </td>

                          <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{dateLabel(s.createdAt)}</td>

                          {/* Actions Three-dot Dropdown */}
                          <td className="px-5 py-3 text-right no-row-click" onClick={e => e.stopPropagation()}>
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownSellerId(activeDropdownSellerId === s.id ? null : s.id);
                                }}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              {activeDropdownSellerId === s.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#161b22] border border-[#E5E7EB] dark:border-white/10 rounded-lg shadow-lg z-20 overflow-hidden py-1">
                                  <button onClick={() => { openDetail(s); setActiveDropdownSellerId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors">View Store</button>
                                  <button onClick={() => { alert('Direct store configuration editor.'); setActiveDropdownSellerId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors">Edit Store</button>
                                  <button onClick={() => { alert('Approve merchant certificates.'); decide(s, true); setActiveDropdownSellerId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors">Approve Seller</button>
                                  <button onClick={() => { setSellers(prev => prev.map(item => item.id === s.id ? { ...item, status: 'SUSPENDED' } : item)); setActiveDropdownSellerId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors">Suspend Store</button>
                                  <button onClick={() => { setSellers(prev => prev.map(item => item.id === s.id ? { ...item, status: 'BLOCKED' } : item)); setActiveDropdownSellerId(null); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors">Block Seller</button>
                                  <Link to={`/admin/orders?sellerId=${s.id}`} className="block w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors">View Orders</Link>
                                  <Link to={`/admin/products?sellerId=${s.id}`} className="block w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors">View Products</Link>
                                  <Link to={`/admin/payments?sellerId=${s.id}`} className="block w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors">View Payouts</Link>
                                  <div className="border-t border-gray-100 dark:border-white/5 my-1" />
                                  <button 
                                    onClick={() => { 
                                      setSellers(prev => prev.filter(item => item.id !== s.id)); 
                                      setActiveDropdownSellerId(null);
                                      showToast('❌ Store removed from local ledger');
                                    }} 
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs text-red-650 font-bold transition-colors"
                                  >
                                    Delete Store
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
            )}

          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-[#6B7280] dark:text-gray-400 select-none">
              <span>Showing {currentPage * itemsPerPage + 1} - {Math.min((currentPage + 1) * itemsPerPage, filtered.length)} of {filtered.length} entries</span>
              <div className="flex items-center gap-3">
                {/* Items per page */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(0);
                    }}
                    className="border border-gray-200 dark:border-white/10 rounded px-1.5 py-1 bg-white dark:bg-white/5 outline-none cursor-pointer text-[#111827] dark:text-white font-semibold"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Prev
                  </button>
                  
                  {/* Clickable pages */}
                  {paginationRange.map(pageIndex => (
                    <button
                      key={pageIndex}
                      onClick={() => setCurrentPage(pageIndex)}
                      className={`w-7.5 h-7.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageIndex
                          ? 'bg-[#16A34A] border-[#16A34A] text-white font-bold'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-750 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageIndex + 1}
                    </button>
                  ))}

                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── COMPACT KPI SECTION (Priority 3, height: 100px) ─── */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-widest">Marketplace KPI Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Registered Stores</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-lg"><Store size={14} /></div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Total Revenue</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-1.5 truncate max-w-[85px]">{money(stats.totalRevenue)}</p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-[#16A34A] rounded-lg"><DollarSign size={14} /></div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Commission Income</p>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-1.5 truncate max-w-[85px]">{money(stats.totalCommission)}</p>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-lg"><Percent size={14} /></div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Pending Approvals</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{stats.pendingApps}</p>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg"><CheckCircle size={14} /></div>
            </div>

            {/* KPI 5 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Blocked Stores</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{stats.blockedCount}</p>
              </div>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-lg"><ShieldOff size={14} /></div>
            </div>

            {/* KPI 6 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Disputes</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">2</p>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-lg"><AlertTriangle size={14} /></div>
            </div>

            {/* KPI 7 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">Refund Claims</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">3</p>
              </div>
              <div className="p-2 bg-[#F8FAFC] dark:bg-white/5 text-gray-500 rounded-lg"><RefreshCw size={14} /></div>
            </div>

          </div>
        </section>

        {/* ─── SELLER PERFORMANCE INSIGHTS (Priority 4) ─── */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-widest">Marketplace Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* 1. Top Sellers */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-gray-150 dark:border-white/5 p-4 space-y-2.5 shadow-2xs">
              <span className="text-[9px] font-bold text-emerald-650 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <ThumbsUp size={11} /> Top Performer
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Himalayan Arts</p>
                <p className="text-[10px] text-gray-450 mt-0.5">Rs. 84,200 (24 orders)</p>
              </div>
            </div>

            {/* 2. Low Rated Sellers */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-gray-150 dark:border-white/5 p-4 space-y-2.5 shadow-2xs">
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Star size={11} /> Low Ratings
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Everest Apparel</p>
                <p className="text-[10px] text-gray-450 mt-0.5">★ 2.4 (18 reviews)</p>
              </div>
            </div>

            {/* 3. Inactive Sellers */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-gray-150 dark:border-white/5 p-4 space-y-2.5 shadow-2xs">
              <span className="text-[9px] font-bold text-gray-450 uppercase tracking-widest flex items-center gap-1">
                <Clock size={11} /> Dormant Accounts
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Gorkha Herbs</p>
                <p className="text-[10px] text-gray-450 mt-0.5">Inactive for 45 days</p>
              </div>
            </div>

            {/* 4. High Refund Rates */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-gray-150 dark:border-white/5 p-4 space-y-2.5 shadow-2xs">
              <span className="text-[9px] font-bold text-rose-600 dark:text-rose-455 uppercase tracking-widest flex items-center gap-1">
                <RefreshCw size={11} /> Refund Exposure
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Dhaka Weaves</p>
                <p className="text-[10px] text-gray-450 mt-0.5">14.5% refund rate</p>
              </div>
            </div>

            {/* 5. Stores with complaints */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-gray-150 dark:border-white/5 p-4 space-y-2.5 shadow-2xs">
              <span className="text-[9px] font-bold text-rose-600 dark:text-rose-455 uppercase tracking-widest flex items-center gap-1">
                <Flag size={11} /> Flagged Content
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Kathmandu Tech</p>
                <p className="text-[10px] text-gray-450 mt-0.5">3 abuse flags filed</p>
              </div>
            </div>

            {/* 6. Recent Registrations */}
            <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-gray-150 dark:border-white/5 p-4 space-y-2.5 shadow-2xs">
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                <Store size={11} /> New Merchants
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Nepal Tea House</p>
                <p className="text-[10px] text-gray-450 mt-0.5">Registered yesterday</p>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* ─── SELLER SLIDE-OVER FILE DRAWER ─── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity" onClick={() => setDetail(null)} />
          <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-50 border-l transition-all duration-350 transform translate-x-0 ${themeClasses.card} ${themeClasses.border.primary}`}>
            
            <div className={`flex items-center justify-between px-6 py-4.5 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-sans">Merchant account file</h2>
              <button 
                onClick={() => setDetail(null)} 
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="p-6 space-y-4">
                  <div className="h-28 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                  <div className="h-6 w-1/3 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  
                  {/* cover banner */}
                  <div className="relative">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-24 w-full" />
                    <div className="absolute left-6 -bottom-6">
                      <div className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                        {(detail.seller.storeName || 'S')[0].toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Profile Identifier details */}
                  <div className="px-6 pt-9 pb-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{detail.seller.storeName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Registered Owner: <span className="font-semibold text-gray-700 dark:text-gray-300">{detail.seller.fullName}</span></p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[detail.seller.status?.toUpperCase()] || statusColors.ACTIVE}`}>
                        {detail.seller.status || 'ACTIVE'}
                      </span>
                      <span className="text-[10px] text-gray-450 dark:text-gray-400">Seller ID: #{detail.seller.id}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    
                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: 'Settled Income', value: money(detail.seller.totalIncome), icon: DollarSign },
                        { label: 'Marketplace margin', value: money(detail.seller.totalCommission), icon: Percent },
                        { label: 'Fulfillment orders', value: detail.seller.totalOrders || 0, icon: ShoppingCart },
                        { label: 'Listed products', value: detail.seller.totalProducts || 0, icon: Store }
                      ].map((s, idx) => {
                        const Icon = s.icon;
                        return (
                          <div key={idx} className="rounded-lg border border-gray-200 dark:border-white/10 p-3 text-center bg-gray-50/50 dark:bg-white/5">
                            <Icon size={13} className="mx-auto text-gray-400 mb-1" />
                            <p className="text-xs font-bold text-gray-900 dark:text-white mt-1 leading-tight">{s.value}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{s.label}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed info rows */}
                    <div className="space-y-1">
                      {[
                        { label: 'Store Email Address', value: detail.seller.email },
                        { label: 'Contact Phone Number', value: detail.seller.contactNumber || <span className="text-gray-400 dark:text-gray-550">Not Provided</span> },
                        { label: 'Category Focus', value: 'Arts & Handcrafts' },
                        { label: 'Store Rating', value: '★ 4.8 (12 orders)' },
                        { label: 'Suspended State', value: detail.seller.status === 'BLOCKED' ? 'Blocked / Suspended' : 'No' }
                      ].map((f, idx) => (
                        <div key={idx} className="flex justify-between py-2.5 border-b border-gray-100 dark:border-white/5 text-xs">
                          <span className="text-gray-400 font-semibold">{f.label}</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{f.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Notes Text Area */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-405 uppercase tracking-wider flex items-center gap-1 select-none">
                        <FileText size={12} />
                        <span>Merchant Registry Notes</span>
                      </label>
                      <textarea
                        value={tempNote}
                        onChange={e => setTempNote(e.target.value)}
                        placeholder="Add moderation details or performance notes on this merchant catalog..."
                        className="w-full rounded-lg border border-gray-250 dark:border-white/10 p-2.5 text-xs font-semibold resize-none outline-none focus:ring-2 focus:ring-[#16A34A]/20 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white"
                        rows={3}
                      />
                      <button
                        onClick={handleSaveNote}
                        className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider rounded text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                      >
                        Save Notes Update
                      </button>
                    </div>

                    {/* Customer recent orders list inside Drawer */}
                    {detail.orders?.length > 0 ? (
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Recent Transactions</p>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {detail.orders.slice(0, 5).map(o => (
                            <div 
                              key={o.orderId}
                              className="flex justify-between items-center p-2.5 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/20 dark:bg-white/1 text-xs"
                            >
                              <Link 
                                to={`/admin/orders?orderId=${o.orderId}`}
                                className="font-mono font-bold hover:underline text-gray-600 dark:text-gray-400 flex items-center gap-0.5"
                              >
                                <span>#{o.customOrderId || o.orderId}</span>
                                <ExternalLink size={10} className="opacity-30" />
                              </Link>
                              <span className="font-bold text-gray-850 dark:text-gray-200">{money(o.grandTotal)}</span>
                              <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                o.status === 'DELIVERED' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'
                              }`}>
                                {o.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50/30 dark:bg-white/1 border border-dashed rounded-lg text-xs font-semibold text-gray-400">
                        No orders recorded under this merchant storefront.
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-2 bg-gray-50/50 dark:bg-[#161b22]/50">
              <button
                onClick={() => { 
                  setSellers(prev => prev.map(item => item.id === detail.seller.id 
                    ? { ...item, status: detail.seller.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' } : item));
                  setDetail(null); 
                  showToast('✅ Account block status changed');
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                  detail?.seller?.status === 'BLOCKED' ? 'bg-[#16A34A] hover:bg-emerald-600' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {detail?.seller?.status === 'BLOCKED' ? <Shield size={13} /> : <ShieldOff size={13} />}
                <span>{detail?.seller?.status === 'BLOCKED' ? 'Unblock Merchant' : 'Block Store'}</span>
              </button>
              
              <button
                onClick={() => { 
                  if (window.confirm('Are you sure you want to permanently delete this seller store?')) {
                    setSellers(prev => prev.filter(s => s.id !== detail.seller.id));
                    setDetail(null);
                    showToast('❌ Seller profile removed');
                  }
                }}
                className="p-2.5 rounded-lg border border-red-200 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                title="Delete Store Profile"
              >
                <Trash2 size={15} />
              </button>
              
              <button
                onClick={() => setDetail(null)}
                className="px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}
