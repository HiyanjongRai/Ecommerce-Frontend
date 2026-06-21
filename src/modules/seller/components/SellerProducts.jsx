import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSellerProducts, getSellerProfile, updateSellerProductStatus } from '../services/sellerService';
import { LoadingState, SectionHeader, formatMoney, normalizeList, resolveImageUrl } from './SellerSectionUtils';
import { Plus, Search, Package, Tag, TrendingUp, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useSellerTheme } from '../hooks/useSellerTheme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const readApiError = (err, fallback) => {
  const d = err.response?.data;
  return (typeof d === 'string' ? d : d?.message || d?.error || err.message) || fallback;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, isDark }) => {
  const colors = {
    gray:    isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500',
    emerald: isDark ? 'bg-emerald-950/20 border-emerald-900/50 text-[#16A34A]' : 'bg-emerald-50 border-emerald-100 text-emerald-600',
    amber:   isDark ? 'bg-amber-950/20 border-amber-900/50 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-600',
    orange:  isDark ? 'bg-orange-950/20 border-orange-900/50 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-600',
  };
  return (
    <div className={`border rounded-[20px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
      isDark
        ? 'bg-zinc-950/45 hover:border-white/[0.15] border-white/[0.08] text-white'
        : 'bg-white hover:border-gray-300 border-gray-200 text-[#111827]'
    }`}>
      <div>
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border mb-3.5 ${colors[color] || colors.gray}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-550 block mb-1">{label}</p>
        <p className="text-[20px] font-bold tracking-tight leading-none text-[#111827] dark:text-white block mt-1">{value}</p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SellerProducts = () => {
  const navigate   = useNavigate();
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;
  const [products, setProducts]         = useState([]);
  const [loading,  setLoading]          = useState(true);
  const [message,  setMessage]          = useState({ text: '', type: '' });
  const [search,   setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const profileRes = await getSellerProfile();
      const userId = profileRes.data?.userId;
      if (userId) {
        const productsRes = await getSellerProducts(userId);
        setProducts(normalizeList(productsRes.data));
      }
    } catch (err) {
      setMessage({ text: readApiError(err, 'Failed to load products.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total:    products.length,
    active:   products.filter(p => String(p.status).toUpperCase() === 'ACTIVE').length,
    inactive: products.filter(p => String(p.status).toUpperCase() !== 'ACTIVE').length,
    onSale:   products.filter(p => p.onSale || p.discountPrice || p.salePercentage).length,
  }), [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      const matchSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || String(p.status).toUpperCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const toggleStatus = async (product) => {
    if (!product.id) return;
    const next = String(product.status).toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setMessage({ text: '', type: '' });
    try {
      await updateSellerProductStatus(product.id, next);
      await load();
    } catch (err) {
      setMessage({ text: readApiError(err, 'Status update failed.'), type: 'error' });
    }
  };

  const productImage = (p) => resolveImageUrl(p.imagePaths?.[0] || p.mainImage);

  if (loading) return <LoadingState label="Loading your catalog…" />;

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Page Header ── */}
      <SectionHeader
        title="Product Catalog"
        subtitle="Browse and manage all your published listings. Add, activate, or update products."
        action={
          <Link
            to="/seller/add-product"
            className="bg-white hover:bg-gray-150 text-gray-900 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border border-gray-200 shadow-sm h-10 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Link>
        }
      />

      {/* ── Alert ── */}
      {message.text && (
        <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : message.type === 'error'  ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          }
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="opacity-50 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats.total}    icon={Package}   color="gray"    isDark={isDark} />
        <StatCard label="Active"         value={stats.active}   icon={CheckCircle2} color="emerald" isDark={isDark} />
        <StatCard label="Inactive"       value={stats.inactive} icon={AlertCircle}  color="amber"   isDark={isDark} />
        <StatCard label="On Sale"        value={stats.onSale}   icon={Tag}          color="orange"  isDark={isDark} />
      </div>

      {/* ── Product List ── */}
      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-14 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-sm font-black text-gray-900">Start building your catalog</h3>
          <p className="text-[11px] text-gray-400 font-medium mt-1.5 max-w-xs mx-auto leading-relaxed">
            Create your first product listing and start selling to customers across Nepal.
          </p>
          <Link
            to="/seller/add-product"
            className="inline-flex items-center gap-2 mt-5 bg-[#16A34A] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#15803D] transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className={`border rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden ${
          isDark ? 'bg-zinc-950/45 border-white/[0.08]' : 'bg-white border-gray-200'
        }`}>

          {/* Toolbar */}
          <div className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between ${
            isDark ? 'border-white/[0.08]' : 'border-gray-105'
          }`}>
            <div className="flex items-center gap-1">
              {['ALL', 'ACTIVE', 'INACTIVE'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                    statusFilter === tab
                      ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                      : isDark ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {tab === 'ALL'      ? `All (${stats.total})`
                   : tab === 'ACTIVE' ? `Active (${stats.active})`
                   :                    `Inactive (${stats.inactive})`}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text" placeholder="Search products…"
                value={search} onChange={e => setSearch(e.target.value)}
                className={`pl-9 pr-8 py-2 border rounded-xl text-[11px] font-semibold outline-none focus:border-[#16A34A] transition-all w-52 ${
                  isDark ? 'bg-zinc-900 border-white/[0.08] text-white placeholder-zinc-550' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400'
                }`}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-14 text-center">
              <p className="text-sm font-black text-gray-400">No products match "{search}"</p>
              <button onClick={() => setSearch('')} className="mt-3 text-xs text-[#16A34A] font-bold hover:underline">Clear search</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`border-b ${isDark ? 'bg-zinc-900 border-white/[0.06]' : 'bg-gray-50 border-gray-100'}`}>
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Product</th>
                    <th className="px-3 py-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Category</th>
                    <th className="px-3 py-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Stock</th>
                    <th className="px-3 py-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Price</th>
                    <th className="px-3 py-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Sale</th>
                    <th className="px-3 py-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-3 py-3 text-[9px] font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-gray-50'}`}>
                  {filteredProducts.map(product => {
                    const qty      = product.stockQuantity ?? 0;
                    const isActive = String(product.status).toUpperCase() === 'ACTIVE';
                    const isOnSale = product.onSale || product.discountPrice || product.salePercentage;
                    const img      = productImage(product);
                    const stockPct = Math.min((qty / 120) * 100, 100);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50/70 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border ${
                              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'
                            }`}>
                              {img ? (
                                <img src={img} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className={`text-[11px] font-black group-hover:text-[#16A34A] transition-colors ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>{product.name}</p>
                              {product.brand && <p className="text-[9px] text-gray-400 font-medium">{product.brand}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${
                            isDark ? 'text-zinc-300 bg-zinc-900' : 'text-gray-500 bg-gray-100'
                          }`}>{product.category || '—'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-1 min-w-[72px]">
                            {qty === 0 ? (
                              <span className="text-[9px] font-black text-red-650 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg">Out of Stock</span>
                            ) : qty <= 5 ? (
                              <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-lg">{qty} left — Low</span>
                            ) : (
                              <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{qty} units</span>
                            )}
                            <div className={`w-14 h-1 rounded-full overflow-hidden ${
                              isDark ? 'bg-zinc-800' : 'bg-gray-100'
                            }`}>
                              <div
                                className={`h-full rounded-full transition-all ${qty === 0 ? 'bg-red-400' : qty <= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.max(stockPct, qty === 0 ? 0 : 3)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatMoney(product.price)}</p>
                          {isOnSale && product.discountPrice && (
                            <p className="text-[9px] text-[#16A34A] font-bold">→ {formatMoney(product.discountPrice)}</p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isOnSale ? (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
                              <Tag className="w-2 h-2" /> SALE
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-300 font-medium">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                            isActive 
                              ? isDark ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {product.status || 'Draft'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/seller/inventory?productId=${product.id}`)}
                              className={`flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-lg border transition-colors uppercase tracking-wider ${
                                isDark 
                                  ? 'text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/20 hover:bg-[#16A34A]/20' 
                                  : 'text-[#16A34A] bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              <TrendingUp className="w-2.5 h-2.5" /> Edit
                            </button>
                            <button
                              onClick={() => toggleStatus(product)}
                              className={`text-[8px] font-black px-2 py-1 rounded-lg border transition-colors uppercase tracking-wider ${
                                isActive
                                  ? isDark ? 'text-zinc-400 border-white/10 hover:bg-white/5' : 'text-gray-600 border-gray-200 hover:bg-gray-100'
                                  : isDark ? 'text-[#16A34A] border-[#16A34A]/20 bg-[#16A34A]/10 hover:bg-[#16A34A]/20' : 'text-[#16A34A] border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className={`px-5 py-3 border-t flex items-center justify-between ${
            isDark ? 'border-white/[0.08]' : 'border-gray-100'
          }`}>
            <p className="text-[9px] text-gray-400 font-semibold">
              Showing {filteredProducts.length} of {products.length} products{search && ` matching "${search}"`}
            </p>
            <p className="text-[9px] text-gray-400 font-semibold">
              {stats.active} active · {stats.inactive} inactive · {stats.onSale} on sale
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
