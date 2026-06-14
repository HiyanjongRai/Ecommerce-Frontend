import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, searchProducts } from '../../../shared/api/customerApi';

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const pageSize = 24;

  const q = searchParams.get('q');
  const isOnSaleFilter = searchParams.get('onSale') === 'true';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let res;
        if (q) {
          res = await searchProducts(q);
        } else {
          res = await getProducts({ page: 0, size: 200 });
        }
        const raw = res.data?.content || res.data || [];
        setProducts(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error('Failed to load products', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q]);

  const saleFilteredProducts = useMemo(() => {
    return isOnSaleFilter ? products.filter(p => Boolean(p.onSale)) : products;
  }, [products, isOnSaleFilter]);

  const categories = useMemo(() => Array.from(new Set(saleFilteredProducts.map(p => p.category).filter(Boolean))).sort(), [saleFilteredProducts]);
  const brands = useMemo(() => Array.from(new Set(saleFilteredProducts.map(p => p.brand).filter(Boolean))).sort(), [saleFilteredProducts]);

  const filtered = useMemo(() => {
    let list = saleFilteredProducts.slice();
    if (selectedCategories.size) list = list.filter(p => selectedCategories.has(p.category));
    if (selectedBrands.size) list = list.filter(p => selectedBrands.has(p.brand));
    if (priceMin) list = list.filter(p => (Number(p.price) || Number(p.minPrice) || 0) >= Number(priceMin));
    if (priceMax) list = list.filter(p => (Number(p.price) || Number(p.maxPrice) || 0) <= Number(priceMax));
    if (minRating) list = list.filter(p => (Number(p.averageRating || p.rating) || 0) >= Number(minRating));

    if (sortBy === 'price_asc') list.sort((a,b) => (Number(a.price)||0) - (Number(b.price)||0));
    if (sortBy === 'price_desc') list.sort((a,b) => (Number(b.price)||0) - (Number(a.price)||0));
    if (sortBy === 'newest') list.sort((a,b) => new Date(b.createdAt || b.createdDate || 0) - new Date(a.createdAt || a.createdDate || 0));

    return list;
  }, [saleFilteredProducts, selectedCategories, selectedBrands, priceMin, priceMax, minRating, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page-1)*pageSize, page*pageSize);
  
  // Auto-reset page when filter states update
  useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedBrands, priceMin, priceMax, minRating]);

  const toggleSet = (setter, setRef, value) => {
    const copy = new Set(setRef);
    if (copy.has(value)) copy.delete(value); else copy.add(value);
    setter(copy);
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setSortBy('relevance');
    setPage(1);
    const nextParams = {};
    if (q) nextParams.q = q;
    if (isOnSaleFilter) nextParams.onSale = 'true';
    setSearchParams(nextParams);
  };

  const resetAll = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setSortBy('relevance');
    setPage(1);
    setSearchParams({});
  };

  const activeFiltersCount = selectedCategories.size + selectedBrands.size + (priceMin || priceMax ? 1 : 0) + (minRating ? 1 : 0);

  const filterSidebarContent = (isMobile = false) => (
    <>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h2 className="font-black text-slate-800">Filters</h2>
        <button onClick={clearFilters} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider">Clear All</button>
      </div>

      <div className="mb-5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Categories</h3>
        <div className="max-h-48 overflow-y-auto pr-2 space-y-1.5 scrollbar-thin">
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={selectedCategories.has(cat)} onChange={() => toggleSet(setSelectedCategories, selectedCategories, cat)} className="w-3.5 h-3.5 accent-emerald-650 rounded border-gray-300" />
              <span className="truncate">{cat}</span>
            </label>
          ))}
          {categories.length === 0 && <div className="text-xs text-gray-400">No categories</div>}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Brand</h3>
        <div className="max-h-48 overflow-y-auto pr-2 space-y-1.5 scrollbar-thin">
          {brands.map(b => (
            <label key={b} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={selectedBrands.has(b)} onChange={() => toggleSet(setSelectedBrands, selectedBrands, b)} className="w-3.5 h-3.5 accent-emerald-650 rounded border-gray-300" />
              <span className="truncate">{b}</span>
            </label>
          ))}
          {brands.length === 0 && <div className="text-xs text-gray-400">No brands</div>}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Price</h3>
        <div className="flex gap-2">
          <input placeholder="Min" value={priceMin} onChange={e=>setPriceMin(e.target.value)} className="w-1/2 px-2.5 py-1.5 border rounded-lg text-xs font-semibold focus:border-slate-800 outline-none" />
          <input placeholder="Max" value={priceMax} onChange={e=>setPriceMax(e.target.value)} className="w-1/2 px-2.5 py-1.5 border rounded-lg text-xs font-semibold focus:border-slate-800 outline-none" />
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Minimum Rating</h3>
        <select value={minRating} onChange={e=>setMinRating(Number(e.target.value))} className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold text-slate-750 bg-white focus:border-slate-800 outline-none">
          <option value={0}>Any Rating</option>
          <option value={1}>1 ★ & up</option>
          <option value={2}>2 ★ & up</option>
          <option value={3}>3 ★ & up</option>
          <option value={4}>4 ★ & up</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#0f1720]">
      <main className="max-w-[1400px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Desktop Filter Sidebar (Hidden on mobile) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border rounded-xl p-5 shadow-sm h-fit">
          {filterSidebarContent()}
        </aside>

        {/* Mobile Filter Slide-Over Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-[9999] lg:hidden bg-black/60 backdrop-blur-xs flex justify-end">
            <div className="w-80 max-w-[90%] bg-white h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250">
              <div>
                <div className="flex items-center justify-between pb-3 border-b mb-4">
                  <h2 className="font-black text-lg">Filters</h2>
                  <button 
                    onClick={() => setShowMobileFilters(false)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-gray-500 hover:bg-gray-150 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                {filterSidebarContent(true)}
              </div>
              
              <div className="pt-4 border-t mt-4 flex gap-2">
                <button 
                  onClick={() => { clearFilters(); setShowMobileFilters(false); }}
                  className="w-1/2 py-2.5 border border-gray-250 rounded-lg text-xs font-black uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider"
                >
                  Apply ({filtered.length})
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="lg:col-span-9">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                {isOnSaleFilter 
                  ? 'Flash Sale' 
                  : q 
                    ? `Search Results for "${q}"` 
                    : 'Browse Products'}
              </h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              
              {/* Mobile Filter Trigger Button */}
              <button 
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 border rounded-lg bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-gray-50 transition-colors active:scale-[0.98]"
              >
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg text-xs font-bold text-slate-700 bg-white outline-none focus:border-slate-800">
                <option value="relevance">Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
              
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-white px-3 py-2 border rounded-lg">
                Page {page} / {totalPages}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-2xl shadow-sm text-center px-4">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No products found</h3>
              <p className="text-xs text-gray-500 max-w-sm mb-6 font-medium">
                {q 
                  ? `We couldn't find anything matching "${q}". Try checking your spelling or using different keywords.`
                  : "We couldn't find any products matching your selected filters. Try clearing some filters."}
              </p>
              <button 
                onClick={resetAll} 
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {pageItems.map(p => (
                  <ProductCard key={p.id || p.productId} product={p} />
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                <button disabled={page<=1} onClick={()=>setPage(page-1)} className="px-3 py-1.5 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors">Prev</button>
                <span className="px-4 py-1.5 bg-white border rounded-lg select-none">{page} / {totalPages}</span>
                <button disabled={page>=totalPages} onClick={()=>setPage(page+1)} className="px-3 py-1.5 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors">Next</button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
