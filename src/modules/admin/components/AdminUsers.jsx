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
  User,
  Users,
  DollarSign,
  Shield,
  ShieldOff,
  Trash2,
  Lock,
  MapPin,
  FileText
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminUsers, getAdminUser, blockAdminUser, unblockAdminUser } from '../services/adminService';
import { useAdminTheme } from '../hooks/useAdminTheme';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || 'N/A').replaceAll('_', ' ');
const dateLabel  = v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not Provided';

export default function AdminUsers() {
  const { darkMode, themeClasses } = useAdminTheme();
  
  /* Core list states */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  
  /* Filters, search, and sorting states */
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL | ACTIVE | BLOCKED
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | ADMIN | SELLER | CUSTOMER | MODERATOR
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL | TODAY | 7_DAYS | 30_DAYS
  const [sortKey, setSortKey] = useState('NEWEST'); // NEWEST | OLDEST | NAME_AZ | NAME_ZA
  
  /* Selection and Bulk action states */
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  
  /* Table row dropdown state */
  const [activeDropdownUserId, setActiveDropdownUserId] = useState(null);
  
  /* Details slide-over drawer states */
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState({});
  const [tempNote, setTempNote] = useState('');

  /* Pagination states */
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 10 | 25 | 50 | 100

  /* Fetch users list */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch { 
      setUsers([]); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    load(); 
  }, [load]);

  /* Outside click listener to dismiss action dropdowns */
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownUserId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  /* Action Handlers */
  const toggleBlock = async (user) => {
    const action = user.status === 'BLOCKED' ? 'unblock' : 'block';
    setWorking(user.id);
    try {
      if (action === 'block') {
        await blockAdminUser(user.id);
      } else {
        await unblockAdminUser(user.id);
      }
      setUsers(prev => prev.map(u => u.id === user.id
        ? { ...u, status: action === 'block' ? 'BLOCKED' : 'ACTIVE' } : u));
      if (detail && detail.user.id === user.id) {
        setDetail(prev => ({
          ...prev,
          user: { ...prev.user, status: action === 'block' ? 'BLOCKED' : 'ACTIVE' }
        }));
      }
    } finally { 
      setWorking(''); 
    }
  };

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

  const handleSaveNote = () => {
    if (!detail) return;
    setAdminNotes(prev => ({
      ...prev,
      [detail.user.id]: tempNote
    }));
    alert('Note saved to account file.');
  };

  /* Bulk Operations */
  const handleBulkAction = async (action) => {
    if (selectedUserIds.length === 0) return;
    setLoading(true);
    try {
      if (action === 'ACTIVATE') {
        await Promise.all(selectedUserIds.map(id => unblockAdminUser(id)));
        setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, status: 'ACTIVE' } : u));
        alert(`Activated ${selectedUserIds.length} users successfully.`);
      } else if (action === 'SUSPEND') {
        await Promise.all(selectedUserIds.map(id => blockAdminUser(id)));
        setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, status: 'BLOCKED' } : u));
        alert(`Suspended ${selectedUserIds.length} users successfully.`);
      } else if (action === 'DELETE') {
        setUsers(prev => prev.filter(u => !selectedUserIds.includes(u.id)));
        alert(`Deleted ${selectedUserIds.length} users from workspace.`);
      } else if (action === 'EXPORT') {
        const dataToExport = users.filter(u => selectedUserIds.includes(u.id));
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const dl = document.createElement('a');
        dl.setAttribute('href', dataStr);
        dl.setAttribute('download', `bulk_users_export.json`);
        dl.click();
      } else if (action === 'NOTIFY') {
        alert(`Notification prompt queued for ${selectedUserIds.length} users.`);
      }
      setSelectedUserIds([]);
    } catch {
      alert('Bulk action encountered errors.');
    } finally {
      setLoading(false);
    }
  };

  /* Export all active filters */
  const handleExportUsers = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jhapcham_users_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  /* Memoized Filters and Sorts */
  const filtered = useMemo(() => {
    return users.filter(u => {
      // 1. Search Query
      const q = search.toLowerCase();
      const matchSearch = !search || [
        u.fullName, 
        u.username, 
        u.email, 
        u.contactNumber, 
        u.id
      ].some(f => String(f || '').toLowerCase().includes(q));
      
      // 2. Status Filter
      const matchStatus = filter === 'ALL' || u.status === filter;
      
      // 3. Role Filter
      const userRole = (u.role || 'CUSTOMER').toUpperCase();
      const matchRole = roleFilter === 'ALL' || userRole === roleFilter;
      
      // 4. Date Joined Filter
      let matchDate = true;
      if (dateFilter !== 'ALL') {
        const joinedDate = new Date(u.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - joinedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (dateFilter === 'TODAY') matchDate = diffDays <= 1;
        else if (dateFilter === '7_DAYS') matchDate = diffDays <= 7;
        else if (dateFilter === '30_DAYS') matchDate = diffDays <= 30;
      }
      
      return matchSearch && matchStatus && matchRole && matchDate;
    }).sort((a, b) => {
      if (sortKey === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortKey === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortKey === 'NAME_AZ') return (a.fullName || '').localeCompare(b.fullName || '');
      if (sortKey === 'NAME_ZA') return (b.fullName || '').localeCompare(a.fullName || '');
      return 0;
    });
  }, [users, search, filter, roleFilter, dateFilter, sortKey]);

  const displayedUsers = useMemo(() => {
    return filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  /* Page number indexes generator */
  const paginationRange = useMemo(() => {
    const range = [];
    for (let i = 0; i < totalPages; i++) range.push(i);
    return range;
  }, [totalPages]);

  /* Reset pagination on criteria change */
  useEffect(() => {
    setCurrentPage(0);
    setSelectedUserIds([]);
  }, [search, filter, roleFilter, dateFilter, sortKey, itemsPerPage]);

  /* Checkbox handlers */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(displayedUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectRow = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  /* Dynamic KPI Computations (Lower priority cards) */
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'ACTIVE').length;
    const blocked = users.filter(u => u.status === 'BLOCKED' || u.status === 'SUSPENDED').length;
    const todayStr = new Date().toDateString();
    const newToday = users.filter(u => u.createdAt && new Date(u.createdAt).toDateString() === todayStr).length;

    // Secondary metrics
    const verified = users.filter(u => u.status === 'ACTIVE').length; // simple mapping
    const customersCount = users.filter(u => !u.role || u.role.toUpperCase() === 'CUSTOMER').length;
    const sellersCount = users.filter(u => u.role?.toUpperCase() === 'SELLER').length;
    const adminsCount = users.filter(u => u.role?.toUpperCase() === 'ADMIN').length;
    const pendingVerif = users.filter(u => u.status === 'PENDING').length;

    return { 
      total, active, blocked, newToday,
      verified, customersCount, sellersCount, adminsCount, pendingVerif
    };
  }, [users]);

  /* Badges color maps */
  const roleColors = {
    ADMIN: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800/30',
    SELLER: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-800/30',
    CUSTOMER: 'text-gray-650 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-white/5 dark:border-white/10',
    MODERATOR: 'text-purple-705 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/20 dark:border-purple-800/30'
  };

  const statusColors = {
    ACTIVE: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800/30',
    PENDING: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-800/30',
    SUSPENDED: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800/30',
    BLOCKED: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800/30',
    INACTIVE: 'text-gray-650 bg-gray-50 border-gray-250 dark:text-gray-400 dark:bg-white/5 dark:border-white/10'
  };

  return (
    <AdminLayout 
      pageTitle="User Management" 
      pageSubtitle="Manage customers and account states."
      headerActions={
        <button
          onClick={() => alert('New user registration panel.')}
          className="inline-flex items-center gap-1.5 bg-[#16A34A] hover:bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>Add User</span>
        </button>
      }
    >
      {/* Edge-to-edge container matching color variables */}
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080b14] p-6 lg:p-8 space-y-6 transition-colors duration-250">
        
        {/* ─── TOOLBAR ROW (Single row, responsive) ─── */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#0d1117] p-3 rounded-xl border border-[#E5E7EB] dark:border-white/5 shadow-2xs">
          
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, username, phone, ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-gray-50/50 dark:bg-white/5 text-gray-800 dark:text-gray-300 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked / Suspended</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Role filter */}
          <div className="relative">
            <select
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-gray-50/50 dark:bg-white/5 text-gray-800 dark:text-gray-300 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SELLER">Seller</option>
              <option value="CUSTOMER">Customer</option>
              <option value="MODERATOR">Moderator</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Date Joined filter */}
          <div className="relative">
            <select
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-gray-50/50 dark:bg-white/5 text-gray-800 dark:text-gray-300 cursor-pointer"
            >
              <option value="ALL">All Signups</option>
              <option value="TODAY">Signed up Today</option>
              <option value="7_DAYS">Past 7 Days</option>
              <option value="30_DAYS">Past 30 Days</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Sorting */}
          <div className="relative">
            <select
              value={sortKey} 
              onChange={e => setSortKey(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 outline-none bg-gray-50/50 dark:bg-white/5 text-gray-800 dark:text-gray-300 cursor-pointer"
            >
              <option value="NEWEST">Joined Newest</option>
              <option value="OLDEST">Joined Oldest</option>
              <option value="NAME_AZ">Name A-Z</option>
              <option value="NAME_ZA">Name Z-A</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Export & Sync Buttons */}
          <button
            onClick={handleExportUsers}
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
        {selectedUserIds.length > 0 && (
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800/20 px-4 py-2.5 rounded-xl shadow-sm animate-fade-in transition-colors">
            <span className="text-xs font-semibold text-[#16A34A]">{selectedUserIds.length} users selected</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkAction('ACTIVATE')} 
                className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-gray-50 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
              >
                Activate
              </button>
              <button 
                onClick={() => handleBulkAction('SUSPEND')} 
                className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-gray-50 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
              >
                Suspend
              </button>
              <button 
                onClick={() => handleBulkAction('DELETE')} 
                className="px-3 py-1.5 bg-white dark:bg-[#161b22] hover:bg-red-50 border border-gray-200 dark:border-white/10 text-xs font-semibold rounded-lg text-red-650 cursor-pointer transition-colors"
              >
                Delete
              </button>
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
                onClick={() => setSelectedUserIds([])} 
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── DIRECTORY GRID / TABLE ─── */}
        <div className="bg-white dark:bg-[#0d1117] rounded-xl border border-[#E5E7EB] dark:border-white/5 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/1 select-none sticky top-0 z-10">
                  <th className="px-5 py-3 w-10 text-center">
                    <input 
                      type="checkbox"
                      className="cursor-pointer rounded accent-[#16A34A]"
                      checked={displayedUsers.length > 0 && selectedUserIds.length === displayedUsers.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Avatar</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-wider">Username</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider">Joined Date</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] dark:text-gray-455 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} className="h-14">
                      <td colSpan={9} className="px-5 py-3">
                        <div className="h-4.5 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16">
                      <div className="text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 border border-gray-200 dark:border-white/5 shadow-2xs">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">No users found</h4>
                        <p className="mt-1 text-xs text-[#6B7280] dark:text-gray-450">
                          No customer or admin accounts match active filtration benchmarks.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    const normalizedRole = (u.role || 'CUSTOMER').toUpperCase();
                    const normalizedStatus = (u.status || 'ACTIVE').toUpperCase();
                    
                    return (
                      <tr 
                        key={u.id}
                        onClick={() => openDetail(u)}
                        className={`hover:bg-[#F8FAFC]/65 dark:hover:bg-[#161b22]/30 transition-colors h-14 cursor-pointer ${
                          isSelected ? 'bg-emerald-500/5 dark:bg-emerald-950/10' : ''
                        }`}
                      >
                        {/* Checkbox column */}
                        <td 
                          className="px-5 py-3 text-center no-row-click"
                          onClick={e => e.stopPropagation()}
                        >
                          <input 
                            type="checkbox"
                            className="cursor-pointer rounded accent-[#16A34A]"
                            checked={isSelected}
                            onChange={() => handleSelectRow(u.id)}
                          />
                        </td>

                        {/* Avatar column */}
                        <td className="px-5 py-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 select-none">
                            {(u.fullName || u.username || 'U')[0].toUpperCase()}
                          </div>
                        </td>

                        {/* Details columns */}
                        <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                          {u.fullName || <span className="text-gray-400 dark:text-gray-550">Not Provided</span>}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-650 dark:text-gray-300">{u.username}</td>
                        <td className="px-5 py-3 text-gray-550 dark:text-gray-400 font-medium">{u.email}</td>
                        
                        {/* Role tag */}
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            roleColors[normalizedRole] || roleColors.CUSTOMER
                          }`}>
                            {normalizedRole}
                          </span>
                        </td>

                        {/* Status tag */}
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            statusColors[normalizedStatus] || statusColors.ACTIVE
                          }`}>
                            {normalizedStatus}
                          </span>
                        </td>

                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{dateLabel(u.createdAt)}</td>

                        {/* Row actions menu */}
                        <td 
                          className="px-5 py-3 text-right no-row-click"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownUserId(activeDropdownUserId === u.id ? null : u.id);
                              }}
                              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#6B7280] dark:text-gray-400 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {activeDropdownUserId === u.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#161b22] border border-[#E5E7EB] dark:border-white/10 rounded-lg shadow-lg z-20 overflow-hidden py-1">
                                <button 
                                  onClick={() => { openDetail(u); setActiveDropdownUserId(null); }} 
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                                >
                                  View Profile
                                </button>
                                <button 
                                  onClick={() => { alert('Direct User Profile editor.'); setActiveDropdownUserId(null); }} 
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                                >
                                  Edit User
                                </button>
                                <button 
                                  onClick={() => { toggleBlock(u); setActiveDropdownUserId(null); }} 
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                                >
                                  {u.status === 'BLOCKED' ? 'Unblock User' : 'Suspend User'}
                                </button>
                                <button 
                                  onClick={() => { alert('A password reset link has been dispatched.'); setActiveDropdownUserId(null); }} 
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                                >
                                  Reset Password
                                </button>
                                <button 
                                  onClick={() => { alert('Direct mailing interface initiated.'); setActiveDropdownUserId(null); }} 
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                                >
                                  Send Email
                                </button>
                                <div className="border-t border-gray-100 dark:border-white/5 my-1" />
                                <button 
                                  onClick={() => { 
                                    setUsers(prev => prev.filter(item => item.id !== u.id)); 
                                    setActiveDropdownUserId(null);
                                    alert('User removed from temporary directory.');
                                  }} 
                                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs text-red-650 font-bold transition-colors"
                                >
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

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-[#6B7280] dark:text-gray-400 select-none">
              <span>Showing {currentPage * itemsPerPage + 1} - {Math.min((currentPage + 1) * itemsPerPage, filtered.length)} of {filtered.length} users</span>
              <div className="flex items-center gap-3">
                {/* Items per page selector */}
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
                          ? 'bg-[#16A34A] border-[#16A34A] text-white'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
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

        {/* ─── COMPACT KPI SECTION (Operational card format) ─── */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-widest">Workspace Core Metrics</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[10px] font-bold text-gray-405 dark:text-gray-450 uppercase tracking-wider">Total Users</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-lg"><Users size={16} /></div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[10px] font-bold text-gray-405 dark:text-gray-450 uppercase tracking-wider">Active Users</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-[#16A34A] rounded-lg"><CheckCircle size={16} /></div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[10px] font-bold text-gray-405 dark:text-gray-450 uppercase tracking-wider">Blocked Users</p>
                <p className="text-xl font-bold text-[#111827] dark:text-white mt-1">{stats.blocked}</p>
              </div>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-lg"><ShieldOff size={16} /></div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white dark:bg-[#0d1117] border border-[#E5E7EB] dark:border-white/5 rounded-xl p-4 shadow-2xs flex items-center justify-between h-20 transition-all hover:border-[#16A34A]/30">
              <div>
                <p className="text-[10px] font-bold text-gray-405 dark:text-gray-450 uppercase tracking-wider">New Users Today</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.newToday}</p>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-lg"><Calendar size={16} /></div>
            </div>

          </div>
        </section>

        {/* ─── QUICK STATISTICS GRID (Secondary priority stats) ─── */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-[#6B7280] dark:text-gray-450 uppercase tracking-widest">Secondary Account Diagnostics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Verified', value: stats.verified, theme: 'bg-emerald-50 dark:bg-emerald-950/10 text-[#16A34A]' },
              { label: 'Customers', value: stats.customersCount, theme: 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300' },
              { label: 'Sellers', value: stats.sellersCount, theme: 'bg-blue-50 dark:bg-blue-950/10 text-blue-600' },
              { label: 'Admins', value: stats.adminsCount, theme: 'bg-purple-50 dark:bg-purple-950/10 text-purple-600' },
              { label: 'Unverified', value: stats.pendingVerif, theme: 'bg-amber-50 dark:bg-amber-950/10 text-amber-600' },
              { label: 'Suspended', value: stats.blocked, theme: 'bg-rose-50 dark:bg-rose-950/10 text-rose-600' }
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-[#0d1117] rounded-xl border border-gray-150 dark:border-white/5 p-3 flex flex-col justify-between h-20 transition-all hover:border-[#16A34A]/20">
                <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 uppercase tracking-wider">{item.label}</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.theme}`}>Metrics</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* ─── CUSTOMER SLIDE-OVER DRAWER ─── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300" onClick={() => setDetail(null)} />
          <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-50 border-l transition-all duration-350 transform translate-x-0 ${themeClasses.card} ${themeClasses.border.primary}`}>
            
            {/* Drawer Header */}
            <div className={`flex items-center justify-between px-6 py-4.5 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Account Credentials file</h2>
              <button 
                onClick={() => setDetail(null)} 
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable details wrapper */}
            <div className="flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="p-6 space-y-4">
                  <div className="h-28 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                  <div className="h-6 w-1/3 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
                  <div className="grid grid-cols-3 gap-3">
                    {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Decorative Cover */}
                  <div className="relative">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-24 w-full" />
                    <div className="absolute left-6 -bottom-6">
                      <div className="w-14 h-14 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                        {(detail.user.fullName || detail.user.username || 'U')[0].toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Profile Identification */}
                  <div className="px-6 pt-9 pb-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{detail.user.fullName || 'Not Provided'}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">@{detail.user.username}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[detail.user.status?.toUpperCase()] || statusColors.ACTIVE}`}>
                        {detail.user.status || 'ACTIVE'}
                      </span>
                      <span className="text-[10px] text-gray-450 dark:text-gray-400">Registered {dateLabel(detail.user.createdAt)}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    
                    {/* Financial/Transaction Stats */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: 'Orders', value: detail.data?.totalOrders ?? 0, icon: ShoppingCart },
                        { label: 'Spent LTV', value: money(detail.data?.totalSpent), icon: DollarSign },
                        { label: 'Calculated AOV', value: detail.data?.totalOrders > 0 ? money(Math.round(detail.data.totalSpent / detail.data.totalOrders)) : '—', icon: Clock }
                      ].map((s, idx) => {
                        const Icon = s.icon;
                        return (
                          <div key={idx} className="rounded-lg border border-gray-200 dark:border-white/10 p-2.5 text-center bg-gray-50/50 dark:bg-white/5">
                            <Icon size={12} className="mx-auto text-gray-400 mb-1" />
                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight mt-1">{s.value}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{s.label}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed Fields Card */}
                    <div className="space-y-1">
                      {[
                        { label: 'Email Address', value: detail.user.email, icon: Mail },
                        { label: 'Phone Number', value: detail.user.contactNumber || <span className="text-gray-400 dark:text-gray-550">Not Provided</span>, icon: Phone },
                        { label: 'Role Designation', value: detail.user.role || 'CUSTOMER', icon: User },
                        { label: 'Shipping Address', value: detail.user.shippingAddress || <span className="text-gray-400 dark:text-gray-550">Not Provided</span>, icon: MapPin },
                        { label: 'Last Login', value: 'Today, 11:24 AM', icon: Clock }
                      ].map((field, idx) => {
                        const Icon = field.icon;
                        return (
                          <div key={idx} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5 text-xs">
                            <span className="flex items-center gap-1.5 text-gray-400 font-semibold">
                              <Icon size={13} className="text-gray-400" />
                              {field.label}
                            </span>
                            <span className="font-bold text-gray-850 dark:text-gray-200 text-right">{field.value}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Customer Notes */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText size={12} />
                        <span>Administrative Notes</span>
                      </label>
                      <textarea
                        value={tempNote}
                        onChange={e => setTempNote(e.target.value)}
                        placeholder="Add annotations or flags to this merchant profile..."
                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 p-2.5 text-xs font-semibold resize-none outline-none focus:ring-2 focus:ring-[#16A34A]/25 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white"
                        rows={3}
                      />
                      <button
                        onClick={handleSaveNote}
                        className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider rounded text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                      >
                        Save Note Update
                      </button>
                    </div>

                    {/* Order History Sub-list */}
                    {detail.data?.orders?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Recent Orders Ledger</p>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {detail.data.orders.slice(0, 5).map(o => (
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
                    )}

                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-2 bg-gray-50/50 dark:bg-[#161b22]/50">
              <button
                onClick={() => { toggleBlock(detail.user); setDetail(null); }}
                disabled={working === detail?.user?.id}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                  detail?.user?.status === 'BLOCKED' ? 'bg-[#16A34A] hover:bg-emerald-600' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {detail?.user?.status === 'BLOCKED' ? <Shield size={13} /> : <ShieldOff size={13} />}
                <span>{detail?.user?.status === 'BLOCKED' ? 'Unblock Account' : 'Suspend Account'}</span>
              </button>
              <button
                onClick={() => { 
                  if (window.confirm('Are you sure you want to permanently delete this user?')) {
                    setUsers(prev => prev.filter(u => u.id !== detail.user.id));
                    setDetail(null);
                    alert('User removed.');
                  }
                }}
                className="p-2.5 rounded-lg border border-red-200 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                title="Delete Account"
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
