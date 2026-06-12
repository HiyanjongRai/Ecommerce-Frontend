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
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);
  const pageItems = filtered.slice((page-1)*pageSize, page*pageSize);

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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#0f1720]">
      <main className="max-w-[1400px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black">Filters</h2>
            <button onClick={clearFilters} className="text-sm text-emerald-600">Clear</button>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Categories</h3>
            <div className="max-h-44 overflow-auto pr-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-2 text-sm mb-1">
                  <input type="checkbox" checked={selectedCategories.has(cat)} onChange={() => toggleSet(setSelectedCategories, selectedCategories, cat)} />
                  <span className="truncate">{cat}</span>
                </label>
              ))}
              {categories.length === 0 && <div className="text-xs text-gray-400">No categories</div>}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Brand</h3>
            <div className="max-h-44 overflow-auto pr-2">
              {brands.map(b => (
                <label key={b} className="flex items-center gap-2 text-sm mb-1">
                  <input type="checkbox" checked={selectedBrands.has(b)} onChange={() => toggleSet(setSelectedBrands, selectedBrands, b)} />
                  <span className="truncate">{b}</span>
                </label>
              ))}
              {brands.length === 0 && <div className="text-xs text-gray-400">No brands</div>}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Price</h3>
            <div className="flex gap-2">
              <input placeholder="Min" value={priceMin} onChange={e=>setPriceMin(e.target.value)} className="w-1/2 px-2 py-1 border rounded text-sm" />
              <input placeholder="Max" value={priceMax} onChange={e=>setPriceMax(e.target.value)} className="w-1/2 px-2 py-1 border rounded text-sm" />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Minimum Rating</h3>
            <select value={minRating} onChange={e=>setMinRating(Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm">
              <option value={0}>Any</option>
              <option value={1}>1 ★ & up</option>
              <option value={2}>2 ★ & up</option>
              <option value={3}>3 ★ & up</option>
              <option value={4}>4 ★ & up</option>
            </select>
          </div>

          <div className="mb-2">
            <button onClick={() => setPage(1)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-bold">Apply Filters</button>
          </div>
        </aside>

        <section className="lg:col-span-9">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black">
                {isOnSaleFilter 
                  ? 'Flash Sale' 
                  : q 
                    ? `Search Results for "${q}"` 
                    : 'Browse Products'}
              </h1>
              <p className="text-sm text-gray-600">Showing {filtered.length} results</p>
            </div>

            <div className="flex items-center gap-3">
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-3 py-2 border rounded text-sm">
                <option value="relevance">Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
              <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
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
              <h3 className="text-lg font-bold text-slate-800 mb-1">No products found</h3>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                {q 
                  ? `We couldn't find anything matching "${q}". Try checking your spelling or using different keywords.`
                  : "We couldn't find any products matching your selected filters. Try clearing some filters."}
              </p>
              <button 
                onClick={resetAll} 
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pageItems.map(p => (
                  <ProductCard key={p.id || p.productId} product={p} />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                <button disabled={page<=1} onClick={()=>setPage(page-1)} className="px-3 py-1 border rounded">Prev</button>
                <span className="px-3">{page} / {totalPages}</span>
                <button disabled={page>=totalPages} onClick={()=>setPage(page+1)} className="px-3 py-1 border rounded">Next</button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
