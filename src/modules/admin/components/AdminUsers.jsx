import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  X,
  MoreVertical,
  CheckCircle,
  User,
  Users,
  DollarSign,
  Shield,
  ShieldOff,
  Trash2,
  Lock,
  MapPin,
  FileText,
  LockOpen,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  UserCheck,
  UserX,
  Eye,
  Send,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  BarChart2
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminUsers, getAdminUser, blockAdminUser, unblockAdminUser } from '../services/adminService';
import { useAdminTheme } from '../hooks/useAdminTheme';

// ─── Formatters ──────────────────────────────────────────────────────────────

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const dateLabel = v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not Provided';
const timeLabel = v => v ? new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const relativeTime = v => {
  if (!v) return 'Never';
  const diff = Date.now() - new Date(v).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

// Deterministic avatar color based on name
const getAvatarColor = (name) => {
  const palettes = [
    { bg: '#DCFCE7', text: '#16A34A', ring: '#BBF7D0' },
    { bg: '#DBEAFE', text: '#1D4ED8', ring: '#BFDBFE' },
    { bg: '#EDE9FE', text: '#7C3AED', ring: '#DDD6FE' },
    { bg: '#FCE7F3', text: '#BE185D', ring: '#FBCFE8' },
    { bg: '#FEF3C7', text: '#D97706', ring: '#FDE68A' },
    { bg: '#CFFAFE', text: '#0E7490', ring: '#A5F3FC' },
  ];
  const code = String(name || 'U').charCodeAt(0);
  return palettes[code % palettes.length];
};

// ─── Sub-components ──────────────────────────────────────────────────────────

// Toast notification
function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const isError = message.startsWith('❌');
  const isSuccess = message.startsWith('✅') || message.startsWith('🎉');

  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold animate-fade-in max-w-sm ${
      isError ? 'bg-red-50 border-red-200 text-red-700' :
      isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
      'bg-white border-gray-200 text-gray-700 dark:bg-[#161b22] dark:border-white/10 dark:text-gray-200'
    }`}>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-100 cursor-pointer">
        <X size={14} />
      </button>
    </div>
  );
}

// KPI Metric Card
function KpiCard({ icon: Icon, label, value, subtitle, accent, trend, trendUp }) {
  return (
    <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 group relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at top left, ${accent}12, transparent 70%)` }} />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{label}</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-1.5">{subtitle}</p>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: `${accent}18`, color: accent }}>
          <Icon size={20} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5">
          {trendUp ? <TrendingUp size={11} className="text-emerald-500" /> : <TrendingDown size={11} className="text-rose-500" />}
          <span className={`text-[10px] font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>{trend}</span>
          <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
        </div>
      )}
    </div>
  );
}

// Status Badge
function StatusBadge({ status }) {
  const map = {
    ACTIVE: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30', dot: 'bg-emerald-500' },
    BLOCKED: { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30', dot: 'bg-red-500' },
    SUSPENDED: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30', dot: 'bg-amber-500' },
    PENDING: { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30', dot: 'bg-blue-500' },
    INACTIVE: { cls: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10', dot: 'bg-gray-400' },
  };
  const norm = (status || 'ACTIVE').toUpperCase();
  const cfg = map[norm] || map.ACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {norm}
    </span>
  );
}

// Role Badge
function RoleBadge({ role }) {
  const map = {
    ADMIN: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    SELLER: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    MODERATOR: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
    CUSTOMER: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10',
  };
  const norm = (role || 'CUSTOMER').toUpperCase();
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${map[norm] || map.CUSTOMER}`}>
      {norm}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { darkMode, themeClasses } = useAdminTheme();

  /* Core data */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [toast, setToast] = useState('');

  /* Filters & search */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('NEWEST');

  /* Selection & bulk */
  const [selectedIds, setSelectedIds] = useState([]);

  /* Row dropdown */
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  /* Detail drawer */
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState({});
  const [tempNote, setTempNote] = useState('');

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showToast = msg => { setToast(msg); };

  /* Load users */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setUsers([]);
      showToast('❌ Failed to load users. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Dismiss dropdowns on outside click */
  useEffect(() => {
    const fn = () => setActiveDropdownId(null);
    window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, []);

  /* Block / Unblock */
  const toggleBlock = async (user) => {
    const action = user.status === 'BLOCKED' || user.status === 'SUSPENDED' ? 'unblock' : 'block';
    setWorking(user.id);
    try {
      if (action === 'block') await blockAdminUser(user.id);
      else await unblockAdminUser(user.id);
      const newStatus = action === 'block' ? 'BLOCKED' : 'ACTIVE';
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      if (detail?.user?.id === user.id) {
        setDetail(prev => ({ ...prev, user: { ...prev.user, status: newStatus } }));
      }
      showToast(`✅ User ${action === 'block' ? 'blocked' : 'unblocked'} successfully.`);
    } catch {
      showToast('❌ Action failed. Please try again.');
    } finally {
      setWorking('');
    }
  };

  /* Open detail drawer */
  const openDetail = async (user) => {
    setDetail({ user, data: null });
    setDetailLoading(true);
    setTempNote(adminNotes[user.id] || '');
    try {
      const res = await getAdminUser(user.id);
      setDetail({ user, data: res.data });
    } catch {
      setDetail({ user, data: null });
    } finally {
      setDetailLoading(false);
    }
  };

  /* Save admin note */
  const handleSaveNote = () => {
    if (!detail) return;
    setAdminNotes(prev => ({ ...prev, [detail.user.id]: tempNote }));
    showToast('✅ Note saved to account file.');
  };

  /* Bulk operations */
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      if (action === 'ACTIVATE') {
        await Promise.all(selectedIds.map(id => unblockAdminUser(id)));
        setUsers(prev => prev.map(u => selectedIds.includes(u.id) ? { ...u, status: 'ACTIVE' } : u));
        showToast(`✅ Activated ${selectedIds.length} users.`);
      } else if (action === 'SUSPEND') {
        await Promise.all(selectedIds.map(id => blockAdminUser(id)));
        setUsers(prev => prev.map(u => selectedIds.includes(u.id) ? { ...u, status: 'BLOCKED' } : u));
        showToast(`✅ Suspended ${selectedIds.length} users.`);
      } else if (action === 'DELETE') {
        setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
        showToast(`🎉 Removed ${selectedIds.length} users from directory.`);
      } else if (action === 'EXPORT') {
        const data = users.filter(u => selectedIds.includes(u.id));
        const url = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selected_users_export.json';
        a.click();
        showToast(`✅ Exported ${selectedIds.length} users.`);
      }
      setSelectedIds([]);
    } catch {
      showToast('❌ Bulk action encountered errors.');
    } finally {
      setLoading(false);
    }
  };

  /* Export all filtered */
  const handleExport = () => {
    const url = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jhapcham_users.json';
    a.click();
    showToast('✅ User data exported.');
  };

  /* KPI stats */
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'ACTIVE').length;
    const blocked = users.filter(u => u.status === 'BLOCKED' || u.status === 'SUSPENDED').length;
    const todayStr = new Date().toDateString();
    const newToday = users.filter(u => u.createdAt && new Date(u.createdAt).toDateString() === todayStr).length;
    const customers = users.filter(u => !u.role || u.role.toUpperCase() === 'CUSTOMER').length;
    const sellers = users.filter(u => u.role?.toUpperCase() === 'SELLER').length;
    const admins = users.filter(u => u.role?.toUpperCase() === 'ADMIN').length;
    const pending = users.filter(u => u.status === 'PENDING' || u.status === 'UNVERIFIED').length;

    return {
      total, active, blocked, newToday,
      customers, sellers, admins, pending,
      activePct: total > 0 ? Math.round((active / total) * 100) : 0,
      blockedPct: total > 0 ? Math.round((blocked / total) * 100) : 0,
    };
  }, [users]);

  /* Filtered & sorted list */
  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !search || [u.fullName, u.username, u.email, u.contactNumber, u.id]
        .some(f => String(f || '').toLowerCase().includes(q));
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchRole = roleFilter === 'ALL' || (u.role || 'CUSTOMER').toUpperCase() === roleFilter;
      let matchDate = true;
      if (dateFilter !== 'ALL') {
        const days = Math.ceil((Date.now() - new Date(u.createdAt).getTime()) / 86400000);
        if (dateFilter === 'TODAY') matchDate = days <= 1;
        else if (dateFilter === '7_DAYS') matchDate = days <= 7;
        else if (dateFilter === '30_DAYS') matchDate = days <= 30;
      }
      return matchSearch && matchStatus && matchRole && matchDate;
    }).sort((a, b) => {
      if (sortKey === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortKey === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortKey === 'NAME_AZ') return (a.fullName || '').localeCompare(b.fullName || '');
      if (sortKey === 'NAME_ZA') return (b.fullName || '').localeCompare(a.fullName || '');
      return 0;
    });
  }, [users, search, statusFilter, roleFilter, dateFilter, sortKey]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  useEffect(() => {
    setCurrentPage(0);
    setSelectedIds([]);
  }, [search, statusFilter, roleFilter, dateFilter, sortKey, itemsPerPage]);

  /* Checkbox handlers */
  const handleSelectAll = e => {
    setSelectedIds(e.target.checked ? displayed.map(u => u.id) : []);
  };
  const handleSelectRow = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  /* Donut chart */
  const donut = useMemo(() => {
    const total = stats.total || 1;
    const C = 2 * Math.PI * 40;
    const sellerArc = (stats.sellers / total) * C;
    const customerArc = (stats.customers / total) * C;
    const adminArc = (stats.admins / total) * C;
    return {
      C,
      sellerDash: `${sellerArc} ${C}`,
      customerDash: `${customerArc} ${C}`,
      adminDash: `${adminArc} ${C}`,
      sellerOff: 0,
      customerOff: -sellerArc,
      adminOff: -(sellerArc + customerArc),
    };
  }, [stats]);

  /* Growth sparkline */
  const sparkline = useMemo(() => {
    if (!users.length) return { path: '', fill: '', pts: [], labels: [] };
    const sorted = [...users].filter(u => u.createdAt).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const labels = [], counts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 5);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      counts.push(sorted.filter(u => new Date(u.createdAt) <= d).length);
    }
    const max = Math.max(...counts, 1);
    const pts = counts.map((c, i) => ({ x: 40 + i * 72, y: 130 - (c / max) * 100 }));
    const path = pts.reduce((acc, p, i) => i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');
    const fill = `${path} L ${pts[pts.length - 1].x},130 L ${pts[0].x},130 Z`;
    return { path, fill, pts, labels };
  }, [users]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout
      pageTitle="User Management"
      pageSubtitle="Manage platform accounts, roles, and access control."
      notifications={stats.newToday}
      headerActions={
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/25 text-gray-900 dark:text-white placeholder-gray-400 w-52 transition-all"
            />
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={() => showToast('👤 New user invitation form coming soon.')}
            className="inline-flex items-center gap-1.5 bg-[#16A34A] hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            Add User
          </button>
        </div>
      }
    >
      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast('')} />}

      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080b14] p-6 lg:p-8 space-y-6 transition-colors duration-250">

        {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0f3d2e] via-[#16503a] to-[#0e3429] px-7 py-6 flex items-center justify-between shadow-[0_8px_32px_rgba(22,163,74,0.18)]">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          {/* Gradient orbs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-8 left-1/3 w-32 h-32 rounded-full bg-teal-400/10 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-emerald-400/20 flex items-center justify-center">
                <Users size={11} className="text-emerald-300" />
              </div>
              <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">User Directory</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              {stats.total.toLocaleString()} <span className="text-emerald-300">Registered Accounts</span>
            </h1>
            <p className="text-sm text-emerald-100/60 font-medium mt-1">
              {stats.active} active · {stats.blocked} blocked · {stats.newToday} new today
            </p>
          </div>

          <div className="relative z-10 hidden md:flex items-center gap-4">
            {[
              { label: 'Customers', value: stats.customers, color: '#6EE7B7' },
              { label: 'Sellers', value: stats.sellers, color: '#93C5FD' },
              { label: 'Admins', value: stats.admins, color: '#C4B5FD' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wide">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI CARDS ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            label="Total Users"
            value={stats.total.toLocaleString()}
            subtitle="All registered accounts"
            accent="#16A34A"
          />
          <KpiCard
            icon={UserCheck}
            label="Active Users"
            value={stats.active.toLocaleString()}
            subtitle={`${stats.activePct}% of total accounts`}
            accent="#16A34A"
            trend="+12%"
            trendUp
          />
          <KpiCard
            icon={UserX}
            label="Blocked / Suspended"
            value={stats.blocked.toLocaleString()}
            subtitle={`${stats.blockedPct}% restricted access`}
            accent="#EF4444"
          />
          <KpiCard
            icon={Zap}
            label="New Today"
            value={stats.newToday.toLocaleString()}
            subtitle="Registered in last 24h"
            accent="#8B5CF6"
            trend={stats.newToday > 0 ? `+${stats.newToday}` : '0'}
            trendUp={stats.newToday > 0}
          />
        </div>

        {/* ── FILTER TOOLBAR ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, username, phone, ID..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/25 placeholder-gray-400 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Role filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SELLER">Seller</option>
              <option value="CUSTOMER">Customer</option>
              <option value="MODERATOR">Moderator</option>
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Date filter */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7_DAYS">Last 7 Days</option>
              <option value="30_DAYS">Last 30 Days</option>
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="NAME_AZ">Name A–Z</option>
              <option value="NAME_ZA">Name Z–A</option>
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Items per page */}
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Download size={12} />
              Export
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-950/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── BULK OPERATIONS BAR ──────────────────────────────────────────── */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/30 px-5 py-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
                {selectedIds.length}
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {selectedIds.length} user{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: 'Activate', action: 'ACTIVATE', cls: 'text-emerald-700 hover:bg-emerald-100' },
                { label: 'Suspend', action: 'SUSPEND', cls: 'text-amber-700 hover:bg-amber-50' },
                { label: 'Export', action: 'EXPORT', cls: 'text-blue-700 hover:bg-blue-50' },
                { label: 'Delete', action: 'DELETE', cls: 'text-red-700 hover:bg-red-50' },
              ].map(btn => (
                <button
                  key={btn.action}
                  onClick={() => handleBulkAction(btn.action)}
                  className={`px-3 py-1.5 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-white/10 text-xs font-bold rounded-lg cursor-pointer transition-colors ${btn.cls}`}
                >
                  {btn.label}
                </button>
              ))}
              <button
                onClick={() => setSelectedIds([])}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── USERS TABLE ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0d1117] rounded-2xl border border-[#E5E7EB] dark:border-white/5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">User Directory</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Showing <span className="font-semibold text-gray-600 dark:text-gray-300">{filtered.length}</span> of <span className="font-semibold text-gray-600 dark:text-gray-300">{users.length}</span> users
              </p>
            </div>
            {(statusFilter !== 'ALL' || roleFilter !== 'ALL' || dateFilter !== 'ALL' || search) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('ALL'); setRoleFilter('ALL'); setDateFilter('ALL'); }}
                className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X size={10} /> Clear filters
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.02]">
                  <th className="w-10 px-5 py-4">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded accent-[#16A34A]"
                      checked={displayed.length > 0 && selectedIds.length === displayed.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                {loading ? (
                  Array(7).fill(0).map((_, i) => (
                    <tr key={i} className="h-16">
                      <td colSpan={7} className="px-5 py-3">
                        <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20">
                      <div className="flex flex-col items-center gap-3">
                        {/* Empty state illustration */}
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                          <Users size={28} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No users found</p>
                          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter criteria.</p>
                        </div>
                        <button
                          onClick={() => { setSearch(''); setStatusFilter('ALL'); setRoleFilter('ALL'); setDateFilter('ALL'); }}
                          className="mt-1 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/30 cursor-pointer hover:bg-emerald-100 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayed.map(u => {
                    const isSelected = selectedIds.includes(u.id);
                    const avatarColor = getAvatarColor(u.fullName || u.username);
                    const initial = (u.fullName || u.username || 'U')[0].toUpperCase();

                    return (
                      <tr
                        key={u.id}
                        onClick={() => openDetail(u)}
                        className={`group cursor-pointer transition-all duration-150 hover:bg-[#F0FDF4] dark:hover:bg-emerald-950/10 ${
                          isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="cursor-pointer rounded accent-[#16A34A]"
                            checked={isSelected}
                            onChange={() => handleSelectRow(u.id)}
                          />
                        </td>

                        {/* User identity */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ring-2 transition-all group-hover:ring-emerald-300 dark:group-hover:ring-emerald-700"
                              style={{ backgroundColor: avatarColor.bg, color: avatarColor.text, ringColor: avatarColor.ring }}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                                {u.fullName || <span className="text-gray-400 italic font-normal">No Name</span>}
                              </p>
                              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[180px]">{u.email}</p>
                            {u.contactNumber && (
                              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{u.contactNumber}</p>
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          <RoleBadge role={u.role} />
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={u.status} />
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(u.createdAt)}</p>
                          </div>
                        </td>

                        {/* Actions dropdown */}
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setActiveDropdownId(activeDropdownId === u.id ? null : u.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {activeDropdownId === u.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#161b22] border border-[#E5E7EB] dark:border-white/10 rounded-xl shadow-xl z-30 overflow-hidden py-1 animate-fade-in">
                                {[
                                  { label: 'View Profile', icon: Eye, fn: () => { openDetail(u); setActiveDropdownId(null); } },
                                  { label: u.status === 'BLOCKED' || u.status === 'SUSPENDED' ? 'Unblock User' : 'Suspend User', icon: u.status === 'BLOCKED' ? LockOpen : Lock, fn: () => { toggleBlock(u); setActiveDropdownId(null); } },
                                  { label: 'Reset Password', icon: RotateCcw, fn: () => { showToast('🔑 Password reset link dispatched.'); setActiveDropdownId(null); } },
                                  { label: 'Send Email', icon: Send, fn: () => { showToast('📧 Direct mail interface queued.'); setActiveDropdownId(null); } },
                                ].map((item, idx) => (
                                  <button
                                    key={idx}
                                    onClick={item.fn}
                                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors cursor-pointer"
                                  >
                                    <item.icon size={12} className="text-gray-400" />
                                    {item.label}
                                  </button>
                                ))}
                                <div className="border-t border-gray-100 dark:border-white/5 my-1" />
                                <button
                                  onClick={() => {
                                    setUsers(prev => prev.filter(x => x.id !== u.id));
                                    setActiveDropdownId(null);
                                    showToast('🗑 User removed from directory.');
                                  }}
                                  className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs text-red-600 font-bold transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                  Delete User
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Page <span className="font-bold text-gray-700 dark:text-gray-300">{currentPage + 1}</span> of <span className="font-bold text-gray-700 dark:text-gray-300">{totalPages}</span>
                &nbsp;·&nbsp; {filtered.length} total users
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const page = totalPages <= 7 ? i : (currentPage <= 3 ? i : (currentPage >= totalPages - 4 ? totalPages - 7 + i : currentPage - 3 + i));
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm shadow-emerald-500/30'
                          : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── ANALYTICS SECTION ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Growth Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">User Growth</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Cumulative registrations over time</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-white">
                <BarChart2 size={14} className="text-emerald-500" />
                {stats.total} Total
              </div>
            </div>
            <div className="w-full">
              <svg viewBox="0 0 500 160" className="w-full h-36 overflow-visible">
                <defs>
                  <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[30, 60, 90, 120].map(y => (
                  <line key={y} x1="30" y1={y} x2="480" y2={y} stroke={darkMode ? '#ffffff08' : '#E5E7EB'} strokeWidth="1" strokeDasharray="4 3" />
                ))}
                {sparkline.fill && <path d={sparkline.fill} fill="url(#ugGrad)" />}
                {sparkline.path && <path d={sparkline.path} fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                {sparkline.pts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#16A34A" stroke="#fff" strokeWidth="2" className="cursor-pointer" />
                  </g>
                ))}
                {sparkline.labels.map((lbl, i) => (
                  <text key={i} x={sparkline.pts[i]?.x ?? 40 + i * 72} y="154" textAnchor="middle" fill="#9CA3AF" fontSize="9.5" fontWeight="600">{lbl}</text>
                ))}
              </svg>
            </div>
          </div>

          {/* Role Breakdown */}
          <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-5">Role Breakdown</h4>
            <div className="flex flex-col items-center gap-5">
              {/* Donut chart */}
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke={darkMode ? '#1f2937' : '#F3F4F6'} strokeWidth="10" />
                  {stats.sellers > 0 && (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#16A34A" strokeWidth="10"
                      strokeDasharray={donut.sellerDash} strokeDashoffset={donut.sellerOff} className="transition-all duration-700" />
                  )}
                  {stats.customers > 0 && (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="10"
                      strokeDasharray={donut.customerDash} strokeDashoffset={donut.customerOff} className="transition-all duration-700" />
                  )}
                  {stats.admins > 0 && (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" strokeWidth="10"
                      strokeDasharray={donut.adminDash} strokeDashoffset={donut.adminOff} className="transition-all duration-700" />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-gray-900 dark:text-white">{stats.total}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-3">
                {[
                  { label: 'Customers', count: stats.customers, color: '#3B82F6' },
                  { label: 'Sellers', count: stats.sellers, color: '#16A34A' },
                  { label: 'Admins', count: stats.admins, color: '#8B5CF6' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white w-6 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── PROFILE DETAIL DRAWER ─────────────────────────────────────────── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDetail(null)}
          />
          <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-50 border-l overflow-hidden ${themeClasses.card} ${themeClasses.border.primary} transition-all duration-300`}>

            {/* Drawer header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${themeClasses.border.primary}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <User size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account Profile</h2>
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="p-6 space-y-4 animate-pulse">
                  <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />
                  <div className="h-5 w-32 bg-gray-100 dark:bg-white/5 rounded" />
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile Hero Banner */}
                  <div className="relative h-24 bg-gradient-to-r from-[#0f3d2e] via-[#16503a] to-[#0e3429] shrink-0">
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    <div className="absolute left-6 -bottom-7 z-10">
                      {(() => {
                        const c = getAvatarColor(detail.user.fullName || detail.user.username);
                        return (
                          <div
                            className="w-14 h-14 rounded-full border-4 border-white dark:border-[#0d1117] flex items-center justify-center text-xl font-black shadow-lg"
                            style={{ backgroundColor: c.bg, color: c.text }}
                          >
                            {(detail.user.fullName || detail.user.username || 'U')[0].toUpperCase()}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Identity */}
                  <div className={`px-6 pt-10 pb-4 border-b ${themeClasses.border.primary}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {detail.user.fullName || <span className="text-gray-400 italic">No Name</span>}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">@{detail.user.username}</p>
                      </div>
                      <StatusBadge status={detail.user.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <RoleBadge role={detail.user.role} />
                      <span className="text-[10px] text-gray-400">Joined {dateLabel(detail.user.createdAt)}</span>
                    </div>
                  </div>

                  {/* KPI Metrics */}
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Orders', value: detail.data?.totalOrders ?? 0, icon: ShoppingCart, color: '#16A34A' },
                        { label: 'Total Spent', value: money(detail.data?.totalSpent), icon: DollarSign, color: '#3B82F6' },
                        { label: 'Avg. Order', value: detail.data?.totalOrders > 0 ? money(Math.round(detail.data.totalSpent / detail.data.totalOrders)) : '—', icon: TrendingUp, color: '#8B5CF6' },
                      ].map((m, i) => {
                        const Icon = m.icon;
                        return (
                          <div key={i} className="rounded-xl border border-gray-100 dark:border-white/5 p-3 text-center bg-gray-50/60 dark:bg-white/[0.03]">
                            <div className="w-7 h-7 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                              <Icon size={13} style={{ color: m.color }} />
                            </div>
                            <p className="text-xs font-black text-gray-900 dark:text-white leading-tight">{m.value}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.label}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Contact & Info Fields */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Account Details</p>
                      <div className="space-y-0">
                        {[
                          { label: 'Email', value: detail.user.email, icon: Mail },
                          { label: 'Phone', value: detail.user.contactNumber || <span className="text-gray-400 italic">Not Provided</span>, icon: Phone },
                          { label: 'Role', value: (detail.user.role || 'CUSTOMER').toUpperCase(), icon: Shield },
                          { label: 'Address', value: detail.user.shippingAddress || <span className="text-gray-400 italic">Not Provided</span>, icon: MapPin },
                          { label: 'Member Since', value: dateLabel(detail.user.createdAt), icon: Calendar },
                        ].map((f, i) => {
                          const Icon = f.icon;
                          return (
                            <div key={i} className={`flex items-center justify-between py-3 border-b ${themeClasses.border.primary} text-xs last:border-0`}>
                              <span className="flex items-center gap-2 text-gray-400 font-semibold shrink-0">
                                <Icon size={12} />
                                {f.label}
                              </span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200 text-right ml-4 truncate max-w-[200px]">{f.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        <FileText size={11} />
                        Admin Notes
                      </label>
                      <textarea
                        value={tempNote}
                        onChange={e => setTempNote(e.target.value)}
                        placeholder="Add internal notes or flags for this account..."
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 p-3 text-xs font-medium resize-none outline-none focus:ring-2 focus:ring-emerald-500/25 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                      />
                      <button
                        onClick={handleSaveNote}
                        className="mt-2 w-full py-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className={`p-4 border-t shrink-0 flex gap-2.5 bg-gray-50/50 dark:bg-[#161b22]/50 ${themeClasses.border.primary}`}>
              <button
                onClick={() => { toggleBlock(detail.user); setDetail(null); }}
                disabled={working === detail?.user?.id}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm ${
                  detail?.user?.status === 'BLOCKED' || detail?.user?.status === 'SUSPENDED'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/25'
                }`}
              >
                {detail?.user?.status === 'BLOCKED' || detail?.user?.status === 'SUSPENDED'
                  ? <><LockOpen size={13} /> Unblock Account</>
                  : <><Lock size={13} /> Suspend Account</>
                }
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to permanently delete this user?')) {
                    setUsers(prev => prev.filter(u => u.id !== detail.user.id));
                    setDetail(null);
                    showToast('🗑 User permanently removed.');
                  }
                }}
                className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                title="Delete Account"
              >
                <Trash2 size={15} />
              </button>

              <button
                onClick={() => setDetail(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
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
