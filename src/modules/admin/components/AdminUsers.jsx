import React, { useEffect, useState, useCallback } from 'react';
import { Search, Shield, ShieldOff, Eye, X, ChevronDown } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminUsers, getAdminUser, blockAdminUser, unblockAdminUser } from '../services/adminService';
import { useAdminTheme } from '../hooks/useAdminTheme';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || 'N/A').replaceAll('_', ' ');
const date  = v => v ? new Date(v).toLocaleDateString() : 'N/A';

const Badge = ({ value, variant = 'neutral', themeClasses }) => {
  const styles = {
    green:  themeClasses.status.success,
    red:    themeClasses.status.danger,
    yellow: themeClasses.status.warning,
    blue:   themeClasses.status.info,
    neutral: themeClasses.status.pending,
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${styles[variant]}`}>
      {nice(value)}
    </span>
  );
};

const Modal = ({ open, onClose, title, children, themeClasses }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transition-colors ${themeClasses.card} border`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${themeClasses.border.primary}`}>
          <h2 className={`font-black transition-colors ${themeClasses.text.primary}`}>{title}</h2>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`}>
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default function AdminUsers() {
  const { themeClasses } = useAdminTheme();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('ALL');
  const [working,  setWorking]  = useState('');
  const [detail,   setDetail]   = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

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
    } finally { setWorking(''); }
  };

  const openDetail = async (user) => {
    setDetail({ user, data: null });
    setDetailLoading(true);
    try {
      const res = await getAdminUser(user.id);
      setDetail({ user, data: res.data });
    } catch { setDetail({ user, data: null }); }
    finally { setDetailLoading(false); }
  };

  const filtered = users.filter(u => {
    const matchStatus = filter === 'ALL' || u.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || [u.fullName, u.username, u.email, u.contactNumber]
      .some(f => f?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  return (
    <AdminLayout pageTitle="User Management" pageSubtitle={`${users.length} total customers`}>
      {/* Filters */}
      <div className={`px-6 py-4 border-b transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary} flex flex-wrap items-center gap-4`}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${themeClasses.bg.secondary} ${themeClasses.text.primary} border ${themeClasses.border.primary}`}
          />
        </div>
        <div className="relative">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className={`appearance-none pl-3 pr-8 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} border ${themeClasses.border.primary}`}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${themeClasses.text.tertiary}`} />
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['#','Full Name','Username','Email','Phone','Status','Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className={`text-center py-16 font-medium transition-colors ${themeClasses.text.tertiary}`}>No users found</td></tr>
                ) : filtered.map((u, i) => (
                  <tr key={u.id} className={`border-b transition-colors ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`}>
                    <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.tertiary}`}>{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {(u.fullName || u.username || 'U')[0].toUpperCase()}
                        </div>
                        <span className={`font-semibold transition-colors ${themeClasses.text.primary}`}>{u.fullName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 transition-colors ${themeClasses.text.secondary}`}>{u.username}</td>
                    <td className={`px-4 py-3 transition-colors ${themeClasses.text.secondary}`}>{u.email}</td>
                    <td className={`px-4 py-3 transition-colors ${themeClasses.text.secondary}`}>{u.contactNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge value={u.status} variant={u.status === 'ACTIVE' ? 'green' : u.status === 'BLOCKED' ? 'red' : 'neutral'} themeClasses={themeClasses} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(u)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => toggleBlock(u)}
                          disabled={working === u.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50
                            ${u.status === 'BLOCKED'
                              ? `${themeClasses.status.success} border`
                              : `${themeClasses.status.danger} border`}`}
                        >
                          {u.status === 'BLOCKED' ? <><ShieldOff size={12} /> Unblock</> : <><Shield size={12} /> Block</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Customer: ${detail?.user?.fullName || ''}`} themeClasses={themeClasses}>
        {detailLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array(6).fill(0).map((_, i) => <div key={i} className={`h-5 rounded transition-colors ${themeClasses.bg.tertiary}`} />)}
          </div>
        ) : detail?.data ? (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Orders',  value: detail.data.totalOrders },
                { label: 'Total Spent',   value: money(detail.data.totalSpent) },
                { label: 'Fav. Payment',  value: nice(detail.data.favoritePaymentMethod) },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-4 text-center transition-colors ${themeClasses.bg.secondary}`}>
                  <p className={`text-lg font-black transition-colors ${themeClasses.text.primary}`}>{s.value}</p>
                  <p className={`text-xs font-medium mt-2 transition-colors ${themeClasses.text.tertiary}`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="space-y-2">
              {[
                ['Email',  detail.data.email],
                ['Phone',  detail.data.contactNumber || '—'],
                ['Status', nice(detail.data.status)],
              ].map(([k, v]) => (
                <div key={k} className={`flex justify-between py-2 border-b transition-colors ${themeClasses.border.primary} text-sm`}>
                  <span className={`font-medium transition-colors ${themeClasses.text.tertiary}`}>{k}</span>
                  <span className={`font-bold transition-colors ${themeClasses.text.primary}`}>{v}</span>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            {detail.data.orders?.length > 0 && (
              <div>
                <p className={`text-xs font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>Recent Orders</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detail.data.orders.slice(0, 5).map(o => (
                    <div key={o.orderId} className={`flex justify-between items-center p-3 rounded-xl text-sm transition-colors ${themeClasses.bg.secondary}`}>
                      <span className={`font-semibold transition-colors ${themeClasses.text.secondary}`}>#{o.customOrderId || o.orderId}</span>
                      <span className={`font-bold transition-colors ${themeClasses.text.primary}`}>{money(o.grandTotal)}</span>
                      <Badge value={o.status} variant={o.status === 'DELIVERED' ? 'green' : o.status === 'CANCELLED' ? 'red' : 'yellow'} themeClasses={themeClasses} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { toggleBlock(detail.user); setDetail(null); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors
                  ${detail.user.status === 'BLOCKED'
                    ? themeClasses.button.primary
                    : themeClasses.button.danger}`}
              >
                {detail.user.status === 'BLOCKED' ? 'Unblock User' : 'Block User'}
              </button>
              <button onClick={() => setDetail(null)} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm transition-colors ${themeClasses.text.tertiary}`}>Failed to load user details.</p>
        )}
      </Modal>
    </AdminLayout>
  );
}
