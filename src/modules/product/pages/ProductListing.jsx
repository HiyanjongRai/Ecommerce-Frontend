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
  const [sortBy, setSortBy] = useState('popularity');
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const pageSize = 12;

  const q = searchParams.get('q');
  const isOnSaleFilter = searchParams.get('onSale') === 'true';
  const catParam = searchParams.get('category');

  useEffect(() => {
    if (catParam) {
      setSelectedCategories(new Set([catParam]));
    }
  }, [catParam]);

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
  // Debug: log a sample product to inspect variant fields when troubleshooting
  useEffect(() => {
    if (pageItems.length > 0) {
      // Log the first item for inspection in browser devtools
      // Remove this after debugging
      // eslint-disable-next-line no-console
      console.log('DEBUG: sample product for pageItems', pageItems[0]);
    }
  }, [pageItems]);
  
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
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
        <h2 className="font-semibold text-base text-slate-900">Categories</h2>
      </div>

      <div className="mb-6">
        <div className="space-y-2.5">
          <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
            <input 
              type="radio" 
              name="category"
              checked={selectedCategories.size === 0} 
              onChange={clearFilters} 
              className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" 
            />
            <span className="group-hover:text-slate-900 font-medium">All Categories</span>
            <span className="ml-auto text-xs text-gray-400">(324)</span>
          </label>
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedCategories.has(cat)} 
                onChange={() => toggleSet(setSelectedCategories, selectedCategories, cat)} 
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" 
              />
              <span className="group-hover:text-slate-900 font-medium truncate">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6 pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-base text-slate-900 mb-4">Brands</h3>
        <div className="max-h-48 overflow-y-auto space-y-2.5">
          {brands.map(b => (
            <label key={b} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedBrands.has(b)} 
                onChange={() => toggleSet(setSelectedBrands, selectedBrands, b)} 
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" 
              />
              <span className="group-hover:text-slate-900 font-medium truncate">{b}</span>
            </label>
          ))}
        </div>
        {brands.length > 5 && <button className="text-emerald-600 text-sm font-medium mt-3 hover:text-emerald-700">Show More</button>}
      </div>

      <div className="mb-6 pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-base text-slate-900 mb-4">Price Range</h3>
        <div className="flex gap-3 items-center">
          <input 
            type="number"
            placeholder="$0" 
            value={priceMin} 
            onChange={e=>setPriceMin(e.target.value)} 
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" 
          />
          <span className="text-gray-400">—</span>
          <input 
            type="number"
            placeholder="$1000" 
            value={priceMax} 
            onChange={e=>setPriceMax(e.target.value)} 
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="mt-4">
          <input type="range" min="0" max="1000" className="w-full accent-emerald-600" />
        </div>
      </div>

      <div className="mb-6 pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-base text-slate-900 mb-4">Customer Rating</h3>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map(rating => (
            <label key={rating} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer group">
              <input 
                type="radio" 
                name="rating"
                checked={minRating === rating} 
                onChange={() => setMinRating(rating)} 
                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" 
              />
              <span className="flex items-center gap-1 group-hover:text-slate-900">
                {[...Array(rating)].map((_, i) => <span key={i} className="text-amber-400">★</span>)}
                {[...Array(5 - rating)].map((_, i) => <span key={i} className="text-gray-300">★</span>)}
              </span>
              <span className="text-gray-400 text-xs">& up</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex text-sm text-gray-500">
            <a href="/" className="hover:text-gray-700">Home</a>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Shop</span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
        
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-4">
              {filterSidebarContent()}
            </div>
          </aside>

          {/* Mobile Filter Overlay */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button onClick={() => setShowMobileFilters(false)} className="text-gray-400 hover:text-gray-600">
                      <span className="text-2xl">×</span>
                    </button>
                  </div>
                  {filterSidebarContent(true)}
                  <button 
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full mt-6 py-3 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700"
                  >
                    View Results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {q ? `Search Results for "${q}"` : 'All Products'}
                </h1>
                <button 
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Filters
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500">
                  Showing <span className="font-medium">{(page-1)*pageSize + 1}–{Math.min(page*pageSize, filtered.length)}</span> of <span className="font-medium">{filtered.length}</span> results
                </p>
                
                <div className="flex items-center gap-4">
                  <label className="text-gray-700 font-medium">Sort by:</label>
                  <select 
                    value={sortBy} 
                    onChange={e=>setSortBy(e.target.value)} 
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : pageItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-lg text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button 
                  onClick={resetAll} 
                  className="px-6 py-3 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pageItems.map(p => (
                    <ProductCard key={p.id || p.productId} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button 
                    disabled={page<=1} 
                    onClick={()=>setPage(page-1)} 
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            page === pageNum
                              ? 'bg-emerald-600 text-white'
                              : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="px-2 py-2">...</span>}
                    {totalPages > 5 && (
                      <button
                        onClick={() => setPage(totalPages)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                      >
                        {totalPages}
                      </button>
                    )}
                  </div>
                  
                  <button 
                    disabled={page>=totalPages} 
                    onClick={()=>setPage(page+1)} 
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
