import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, EyeOff, ChevronDown } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminProducts, setAdminProductVisibility } from '../services/adminService';
import { BASE_URL } from '../../../shared/api/apiConfig';
import { useAdminTheme } from '../hooks/useAdminTheme';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || 'N/A').replaceAll('_', ' ');

export default function AdminProducts() {
  const { themeClasses } = useAdminTheme();
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [filter,   setFilter]     = useState('ALL');
  const [working,  setWorking]    = useState('');
  const [toast,    setToast]      = useState('');
  const [page,     setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await getAdminProducts(p, 50);
      const data = res.data;
      if (data?.content) {
        setProducts(data.content);
        setTotalPages(data.totalPages || 1);
      } else {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch { setProducts([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(page); }, [load, page]);

  const toggleVisibility = async (product) => {
    const isActive = product.status === 'ACTIVE' || product.visible === true;
    setWorking(product.id);
    try {
      await setAdminProductVisibility(product.id, !isActive);
      setProducts(prev => prev.map(p => p.id === product.id
        ? { ...p, status: isActive ? 'INACTIVE' : 'ACTIVE', visible: !isActive } : p));
      showToast(`✅ Product ${isActive ? 'hidden' : 'shown'} successfully`);
    } catch { showToast('❌ Failed to update visibility'); }
    finally { setWorking(''); }
  };

  const filtered = products.filter(p => {
    const matchStatus = filter === 'ALL' || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || [p.name, p.category, p.sellerStoreName].some(f => f?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const imgUrl = path => path ? (path.startsWith('http') ? path : `${BASE_URL}/uploads/${path}`) : null;

  return (
    <AdminLayout pageTitle="Product Management" pageSubtitle={`${products.length} products loaded`}>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-sm font-bold px-4 py-3 rounded-xl transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary}`}>{toast}</div>
      )}

      {/* Filters */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center gap-4 transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, sellers, categories…"
            className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`} />
        </div>
        <div className="relative">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className={`appearance-none pl-3 pr-8 py-2.5 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Hidden</option>
          </select>
          <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${themeClasses.text.tertiary}`} />
        </div>
      </div>

      <div className="p-6">
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['#','Image','Product Name','Seller','Category','Price','Status','Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(10).fill(0).map((_, i) => (
                  <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                    ))}
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className={`text-center py-16 font-medium transition-colors ${themeClasses.text.tertiary}`}>No products found</td></tr>
                ) : filtered.map((p, i) => {
                  const isActive = p.status === 'ACTIVE' || p.visible === true;
                  const thumb    = imgUrl(p.imagePath || p.images?.[0]?.imagePath);
                  return (
                    <tr key={p.id} className={`border-b transition-colors ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`}>
                      <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.tertiary}`}>{i + 1}</td>
                      <td className="px-4 py-3">
                        {thumb ? (
                          <img src={thumb} alt={p.name} className={`w-10 h-10 rounded-lg object-cover border transition-colors ${themeClasses.border.primary}`} />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.tertiary}`}>IMG</div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className={`font-semibold truncate transition-colors ${themeClasses.text.primary}`}>{p.name}</p>
                      </td>
                      <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.secondary}`}>{p.sellerStoreName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}>{nice(p.category)}</span>
                      </td>
                      <td className={`px-4 py-3 font-bold transition-colors ${themeClasses.text.primary}`}>{money(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-colors border
                          ${isActive ? themeClasses.status.success : themeClasses.status.pending}`}>
                          {isActive ? '● Visible' : '○ Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleVisibility(p)}
                          disabled={working === p.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 border
                            ${isActive
                              ? `${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`
                              : `${themeClasses.status.success}`}`}
                        >
                          {isActive ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-6 py-4 border-t transition-colors ${themeClasses.border.primary}`}>
              <p className={`text-xs transition-colors ${themeClasses.text.tertiary}`}>Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}>
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


