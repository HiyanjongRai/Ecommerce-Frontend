import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, EyeOff, ChevronDown, Package, ShoppingBag } from 'lucide-react';
import AdminLayout from '../../../components/layout/AdminLayout/AdminLayout';
import { autoFeatureAdminProducts, getAdminProducts, setAdminProductVisibility, updateAdminProductFlags } from '../../../services/adminApi';
import { BASE_URL } from '../../../services/apiConfig';
import { useAdminTheme } from '../../../hooks/useAdminTheme';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || 'N/A').replaceAll('_', ' ');

export default function AdminProducts() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [filter,   setFilter]     = useState('ALL');
  const [working,  setWorking]    = useState('');
  const [toast,    setToast]      = useState('');
  const [page,     setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [autoLimit, setAutoLimit] = useState(12);
  const [replaceFeatured, setReplaceFeatured] = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await getAdminProducts(p, 50);
      const data = res.data;
      if (data?.content) {
        setProducts(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || data.content.length || 0);
      } else {
        setProducts(Array.isArray(data) ? data : []);
        setTotalElements(Array.isArray(data) ? data.length : 0);
      }
    } catch { 
      setProducts([]); 
      setTotalElements(0);
    } finally { 
      setLoading(false); 
    }
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

  const toggleFlag = async (product, flag) => {
    setWorking(product.id);
    try {
      const nextValue = !Boolean(product[flag]);
      const res = await updateAdminProductFlags(product.id, { [flag]: nextValue });
      const updated = res.data;
      setProducts((prev) => prev.map((entry) => (entry.id === product.id ? { ...entry, ...updated } : entry)));
      showToast(`✅ ${flag} updated`);
    } catch {
      showToast('❌ Failed to update product flags');
    } finally {
      setWorking('');
    }
  };

  const autoFeature = async () => {
    setWorking('AUTO');
    try {
      await autoFeatureAdminProducts(autoLimit, replaceFeatured);
      showToast('✅ Featured products updated from product metrics');
      await load(page);
    } catch {
      showToast('❌ Failed to auto-feature products');
    } finally {
      setWorking('');
    }
  };

  const filtered = products.filter(p => {
    const matchStatus = filter === 'ALL' || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || [p.name, p.category, p.sellerStoreName].some(f => f?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const stats = React.useMemo(() => {
    const total = totalElements;
    const visible = products.filter(p => p.status === 'ACTIVE' || p.visible === true).length;
    const hidden = products.filter(p => p.status === 'INACTIVE' || p.visible === false).length;
    return { total, visible, hidden };
  }, [products, totalElements]);

  const imgUrl = path => path ? (path.startsWith('http') ? path : `${BASE_URL}/uploads/${path}`) : null;

  return (
    <AdminLayout pageTitle="Product Management" pageSubtitle={`${totalElements} total products registered`}>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-[20px] shadow-2xl border transition-all ${themeClasses.bg.secondary} ${themeClasses.border.accent} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      <div className={`p-4 lg:p-6 space-y-6 min-h-[calc(100vh-80px)] ${themeClasses.bg.secondary}`}>
        
        {/* Statistics KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
          
          {/* Total Catalog Items */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Catalog Size</span>
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-2xs border ${darkMode ? 'bg-white/10 border-white/10 text-slate-300' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                <Package size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.total}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.tertiary}`}>Total registered items</p>
            </div>
          </div>

          {/* Visible Products */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Visible Products</span>
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-2xs border ${darkMode ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                <ShoppingBag size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.visible}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.success}`}>Active in shop front</p>
            </div>
          </div>

          {/* Hidden Products */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Hidden Products</span>
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-2xs border ${darkMode ? 'bg-amber-950/40 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                <EyeOff size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.hidden}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.warning}`}>Draft/Deactivated items</p>
            </div>
          </div>

        </div>

        {/* Filters */}
        <div className={`rounded-[20px] border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-wrap items-center gap-4 transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search products, sellers, categories…"
              className={`w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`} 
            />
          </div>
          <div className="relative">
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className={`appearance-none pl-3.5 pr-8 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Hidden</option>
            </select>
            <ChevronDown size={13} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${themeClasses.text.tertiary}`} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              min="1"
              max="100"
              value={autoLimit}
              onChange={(e) => setAutoLimit(Number(e.target.value || 12))}
              className={`w-24 px-3 py-2.5 text-xs font-semibold rounded-xl border ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
            />
            <label className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
              <input type="checkbox" checked={replaceFeatured} onChange={(e) => setReplaceFeatured(e.target.checked)} />
              Replace existing
            </label>
            <button
              type="button"
              onClick={autoFeature}
              disabled={working === 'AUTO'}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border ${themeClasses.button.primary}`}
            >
              {working === 'AUTO' ? 'Applying...' : 'Auto Feature'}
            </button>
          </div>
        </div>

        <div className={`rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['#','Image','Product Name','Seller','Category','Price','Status','Flags','Actions'].map(h => (
                    <th key={h} className={`px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${themeClasses.border.primary}`}>
                {loading ? Array(10).fill(0).map((_, i) => (
                  <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                    {Array(9).fill(0).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                    ))}
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={`text-center py-16 font-semibold transition-colors ${themeClasses.text.tertiary}`}>
                      No products found
                    </td>
                  </tr>
                ) : filtered.map((p, i) => {
                  const isActive = p.status === 'ACTIVE' || p.visible === true;
                  const thumb    = imgUrl(p.imagePath || p.images?.[0]?.imagePath);
                  return (
                    <tr key={p.id} className={`transition-colors hover:${themeClasses.bg.secondary}`}>
                      <td className={`px-5 py-4 text-xs font-semibold transition-colors ${themeClasses.text.tertiary}`}>{i + 1}</td>
                      <td className="px-5 py-4">
                        {thumb ? (
                          <img src={thumb} alt={p.name} className={`w-10 h-10 rounded-xl object-cover border transition-colors ${themeClasses.border.primary}`} />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.tertiary}`}>IMG</div>
                        )}
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className={`font-bold truncate transition-colors ${themeClasses.text.primary}`}>{p.name}</p>
                      </td>
                      <td className={`px-5 py-4 text-xs font-semibold transition-colors ${themeClasses.text.secondary}`}>{p.sellerStoreName || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}>{nice(p.category)}</span>
                      </td>
                      <td className={`px-5 py-4 font-bold transition-colors ${themeClasses.text.primary}`}>{money(p.price)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border
                          ${isActive ? themeClasses.status.success : themeClasses.status.pending}`}>
                          {isActive ? '● Visible' : '○ Hidden'}
                        </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          ['featured', 'Featured'],
                          ['trending', 'Trending'],
                          ['newArrival', 'New'],
                          ['bestSeller', 'Best'],
                          ['flashSale', 'Flash'],
                        ].map(([key, label]) => {
                          const active = Boolean(p[key]);
                          return (
                            <button
                              key={key}
                              onClick={() => toggleFlag(p, key)}
                              disabled={working === p.id}
                              className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                                active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : `${themeClasses.bg.secondary} ${themeClasses.text.tertiary} ${themeClasses.border.primary}`
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleVisibility(p)}
                          disabled={working === p.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50 border cursor-pointer
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
              <p className={`text-xs font-semibold transition-colors ${themeClasses.text.tertiary}`}>Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))} 
                  disabled={page === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-colors border cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                  disabled={page >= totalPages - 1}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-colors border cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                >
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


