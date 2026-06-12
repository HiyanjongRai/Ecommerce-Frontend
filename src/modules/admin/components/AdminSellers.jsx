import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, CheckCircle, XCircle, ExternalLink, X, ChevronDown } from 'lucide-react';
import AdminLayout from './AdminLayout';
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

const Badge = ({ value, variant = 'neutral', themeClasses }) => {
  const styles = { 
    green: themeClasses.status.success, 
    red: themeClasses.status.danger, 
    yellow: themeClasses.status.warning, 
    blue: themeClasses.status.info, 
    neutral: themeClasses.status.pending
  };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border transition-colors ${styles[variant]}`}>{nice(value)}</span>;
};

const Modal = ({ open, onClose, title, children, themeClasses }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transition-colors ${themeClasses.card}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${themeClasses.border.primary}`}>
          <h2 className={`font-black transition-colors ${themeClasses.text.primary}`}>{title}</h2>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`}><X size={18} /></button>
        </div>
        <div className={`p-6 transition-colors ${themeClasses.bg.primary}`}>{children}</div>
      </div>
    </div>
  );
};

const docUrl = path => path ? (path.startsWith('http') ? path : `${BASE_URL}/uploads/${path}`) : null;

export default function AdminSellers() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [tab,          setTab]          = useState('sellers');
  const [sellers,      setSellers]      = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [working,      setWorking]      = useState('');
  const [detail,       setDetail]       = useState(null);
  const [notes,        setNotes]        = useState({});
  const [toast,        setToast]        = useState('');

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
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const decide = async (app, approve) => {
    const id   = app.applicationId || app.id;
    const note = notes[id]?.trim() || (approve ? 'Approved by admin' : '');
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
    } catch { showToast('❌ Action failed'); } finally { setWorking(''); }
  };

  const openDetail = async (seller) => {
    setDetail({ seller, orders: null });
    try {
      const res = await getSellerOrders(seller.id);
      setDetail(d => ({ ...d, orders: Array.isArray(res.data) ? res.data : [] }));
    } catch { setDetail(d => ({ ...d, orders: [] })); }
  };

  const filtered = sellers.filter(s => {
    const q = search.toLowerCase();
    return !search || [s.storeName, s.fullName, s.email].some(f => f?.toLowerCase().includes(q));
  });

  return (
    <AdminLayout pageTitle="Seller Management" pageSubtitle={`${sellers.length} sellers · ${applications.length} pending applications`}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-sm font-bold px-4 py-3 rounded-xl shadow-xl animate-pulse transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      {/* Sub-tabs */}
      <div className={`px-6 py-3 border-b flex items-center gap-1 transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
        {[
          { id: 'sellers',      label: `All Sellers (${sellers.length})` },
          { id: 'applications', label: `Pending Applications (${applications.length})`, badge: applications.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors relative ${tab === t.id ? 'bg-indigo-600 text-white' : `${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}`}>
            {t.label}
            {t.badge > 0 && tab !== t.id && (
              <span className="ml-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full inline-flex items-center justify-center">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* All Sellers Tab */}
        {tab === 'sellers' && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sellers…"
                  className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`} />
              </div>
            </div>
            <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                      {['Store','Owner','Email','Products','Orders','Revenue','Delivered','Commission','Actions'].map(h => (
                        <th key={h} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? Array(6).fill(0).map((_, i) => (
                      <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                        {Array(9).fill(0).map((_, j) => (
                          <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                        ))}
                      </tr>
                    )) : filtered.map(s => (
                      <tr key={s.id} className={`border-b transition-colors ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                              {(s.storeName || 'S')[0].toUpperCase()}
                            </div>
                            <span className={`font-semibold transition-colors ${themeClasses.text.primary}`}>{s.storeName || '—'}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 font-medium transition-colors ${themeClasses.text.secondary}`}>{s.fullName}</td>
                        <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.tertiary}`}>{s.email}</td>
                        <td className={`px-4 py-3 text-center font-bold transition-colors ${themeClasses.text.primary}`}>{s.totalProducts || 0}</td>
                        <td className={`px-4 py-3 text-center font-bold transition-colors ${themeClasses.text.primary}`}>{s.totalOrders || 0}</td>
                        <td className={`px-4 py-3 font-bold transition-colors ${themeClasses.text.primary}`}>{money(s.totalIncome)}</td>
                        <td className={`px-4 py-3 text-center font-bold transition-colors ${themeClasses.text.primary}`}>{s.totalDelivered || 0}</td>
                        <td className={`px-4 py-3 font-bold transition-colors ${themeClasses.text.accent}`}>{money(s.totalCommission)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => openDetail(s)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${themeClasses.button.outline}`}>
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={9} className={`text-center py-16 transition-colors ${themeClasses.text.tertiary}`}>No sellers found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Applications Tab */}
        {tab === 'applications' && (
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className={`rounded-2xl p-6 animate-pulse h-40 transition-colors ${themeClasses.bg.secondary}`} />)
            ) : applications.length === 0 ? (
              <div className={`rounded-2xl p-16 text-center font-medium shadow-sm border transition-colors ${themeClasses.card} ${themeClasses.text.tertiary}`}>
                ✅ No pending seller applications
              </div>
            ) : applications.map(app => {
              const id = app.applicationId || app.id;
              return (
                <div key={id} className={`rounded-2xl shadow-sm border p-6 transition-colors ${themeClasses.card}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className={`font-black text-lg transition-colors ${themeClasses.text.primary}`}>{app.storeName || 'New Seller'}</p>
                      <p className={`text-sm mt-0.5 transition-colors ${themeClasses.text.secondary}`}>{app.username || app.email} · {app.address || 'No address provided'}</p>
                    </div>
                    <Badge value={app.status || 'PENDING'} variant="yellow" themeClasses={themeClasses} />
                  </div>
                  {/* Documents */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[['ID Document', app.idDocumentPath], ['Business License', app.businessLicensePath], ['Tax Certificate', app.taxCertificatePath]].map(([label, path]) => {
                      const url = docUrl(path);
                      return url ? (
                        <a key={label} href={url} target="_blank" rel="noreferrer"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${themeClasses.status.info}`}>
                          <ExternalLink size={11} /> {label}
                        </a>
                      ) : (
                        <span key={label} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${themeClasses.status.danger}`}>
                          {label} missing
                        </span>
                      );
                    })}
                  </div>
                  <textarea
                    value={notes[id] || ''}
                    onChange={e => setNotes(p => ({ ...p, [id]: e.target.value }))}
                    placeholder="Add note (required for rejection)…"
                    className={`w-full rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 mb-3 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    rows={2}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => decide(app, true)} disabled={working === id}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${themeClasses.button.primary}`}>
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button onClick={() => decide(app, false)} disabled={working === id}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${themeClasses.button.danger}`}>
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seller Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Seller: ${detail?.seller?.storeName || ''}`} themeClasses={themeClasses}>
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Orders',   value: detail.seller.totalOrders || 0 },
                { label: 'Total Products', value: detail.seller.totalProducts || 0 },
                { label: 'Total Revenue',  value: money(detail.seller.totalIncome) },
                { label: 'Commission',     value: money(detail.seller.totalCommission) },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-4 text-center transition-colors ${themeClasses.bg.secondary}`}>
                  <p className={`text-xl font-black transition-colors ${themeClasses.text.primary}`}>{s.value}</p>
                  <p className={`text-xs font-medium mt-1 transition-colors ${themeClasses.text.tertiary}`}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[['Email', detail.seller.email], ['Phone', detail.seller.contactNumber || '—'], ['Status', nice(detail.seller.status)]].map(([k, v]) => (
                <div key={k} className={`flex justify-between py-2 border-b text-sm transition-colors ${themeClasses.border.primary}`}>
                  <span className={`font-medium transition-colors ${themeClasses.text.tertiary}`}>{k}</span>
                  <span className={`font-bold transition-colors ${themeClasses.text.primary}`}>{v}</span>
                </div>
              ))}
            </div>
            {detail.orders === null ? (
              <p className={`text-sm animate-pulse transition-colors ${themeClasses.text.tertiary}`}>Loading orders…</p>
            ) : detail.orders.length > 0 ? (
              <div>
                <p className={`text-xs font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>Recent Orders</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detail.orders.slice(0, 6).map(o => (
                    <div key={o.orderId} className={`flex justify-between items-center p-3 rounded-xl text-sm transition-colors ${themeClasses.bg.tertiary}`}>
                      <span className={`font-semibold transition-colors ${themeClasses.text.secondary}`}>#{o.customOrderId || o.orderId}</span>
                      <span className={`text-xs transition-colors ${themeClasses.text.tertiary}`}>{o.customerName}</span>
                      <span className={`font-bold transition-colors ${themeClasses.text.primary}`}>{money(o.grandTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}


