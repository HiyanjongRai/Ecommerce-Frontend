import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, Minus, X, Search, LayoutGrid, List } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getProducts, searchProducts } from '../../customer/api/customerApi';
import { categoryMatches } from '../utils/categoryUtils';

const PAGE_SIZE_OPTIONS = [12, 24, 48];
const ABSOLUTE_MAX_PRICE = 5000;

// Optional extra filter groups. Each is only rendered if the loaded
// product set actually has values for that field — no hardcoded options.
const EXTRA_FILTER_GROUPS = [
  { key: 'discount', label: 'Discount', field: 'discountLabel' },
  { key: 'availability', label: 'Availability', field: 'availability' },
  { key: 'screenSize', label: 'Screen Size', field: 'screenSize' },
  { key: 'ram', label: 'RAM', field: 'ram' },
  { key: 'storage', label: 'Storage', field: 'storage' },
  { key: 'color', label: 'Color', field: 'color' },
  { key: 'deliveryOption', label: 'Delivery Option', field: 'deliveryOption' },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  // Filters
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('popularity');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [extraSelections, setExtraSelections] = useState({});
  const [openExtraGroups, setOpenExtraGroups] = useState({});

  // Collapsible section state for the main groups
  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    rating: true,
  });

  const q = searchParams.get('q');
  const isOnSaleFilter = searchParams.get('onSale') === 'true';
  const catParam = searchParams.get('category');

  useEffect(() => {
    if (catParam) {
      setSelectedCategories(new Set([catParam]));
    } else {
      setSelectedCategories(new Set());
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

  const saleFilteredProducts = useMemo(
    () => (isOnSaleFilter ? products.filter((p) => Boolean(p.onSale)) : products),
    [products, isOnSaleFilter]
  );

  // Category/brand option lists AND their counts are derived from the
  // currently loaded product set — no hardcoded numbers.
  const categoryCounts = useMemo(() => {
    const map = new Map();
    saleFilteredProducts.forEach((p) => {
      if (!p.category) return;
      map.set(p.category, (map.get(p.category) || 0) + 1);
    });
    return map;
  }, [saleFilteredProducts]);

  const brandCounts = useMemo(() => {
    const map = new Map();
    saleFilteredProducts.forEach((p) => {
      if (!p.brand) return;
      map.set(p.brand, (map.get(p.brand) || 0) + 1);
    });
    return map;
  }, [saleFilteredProducts]);

  const categories = useMemo(
    () => Array.from(categoryCounts.keys()).sort(),
    [categoryCounts]
  );
  const brands = useMemo(
    () => Array.from(brandCounts.keys()).sort(),
    [brandCounts]
  );

  const ratingCounts = useMemo(() => {
    const map = new Map();
    saleFilteredProducts.forEach((p) => {
      const r = Math.floor(Number(p.averageRating || p.rating) || 0);
      for (let i = 1; i <= r; i++) {
        map.set(i, (map.get(i) || 0) + 1);
      }
    });
    return map;
  }, [saleFilteredProducts]);

  const extraFilterData = useMemo(() => {
    return EXTRA_FILTER_GROUPS.map((group) => {
      const map = new Map();
      saleFilteredProducts.forEach((p) => {
        const val = p[group.field];
        if (val === undefined || val === null || val === '') return;
        const values = Array.isArray(val) ? val : [val];
        values.forEach((v) => map.set(v, (map.get(v) || 0) + 1));
      });
      return { ...group, counts: map, options: Array.from(map.keys()).sort() };
    }).filter((group) => group.options.length > 0);
  }, [saleFilteredProducts]);

  const visibleBrands = useMemo(() => {
    const list = brandSearch
      ? brands.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()))
      : brands;
    return showAllBrands ? list : list.slice(0, 6);
  }, [brands, brandSearch, showAllBrands]);

  const filtered = useMemo(() => {
    let list = saleFilteredProducts.slice();
    if (selectedCategories.size) {
      list = list.filter((p) => Array.from(selectedCategories).some((selected) => categoryMatches(p.category, selected)));
    }
    if (selectedBrands.size) list = list.filter((p) => selectedBrands.has(p.brand));
    if (priceMin) list = list.filter((p) => (Number(p.price) || Number(p.minPrice) || 0) >= Number(priceMin));
    if (priceMax) list = list.filter((p) => (Number(p.price) || Number(p.maxPrice) || 0) <= Number(priceMax));
    if (minRating) list = list.filter((p) => (Number(p.averageRating || p.rating) || 0) >= Number(minRating));

    Object.entries(extraSelections).forEach(([field, values]) => {
      if (!values || values.size === 0) return;
      list = list.filter((p) => {
        const val = p[field];
        const productValues = Array.isArray(val) ? val : [val];
        return productValues.some((v) => values.has(v));
      });
    });

    if (sortBy === 'price_asc') list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sortBy === 'price_desc') list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || b.createdDate || 0) - new Date(a.createdAt || a.createdDate || 0));
    }

    return list;
  }, [saleFilteredProducts, selectedCategories, selectedBrands, priceMin, priceMax, minRating, extraSelections, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Auto-reset page when filters or page size change
  useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedBrands, priceMin, priceMax, minRating, extraSelections, pageSize]);

  const toggleSet = (setter, setRef, value) => {
    const copy = new Set(setRef);
    if (copy.has(value)) copy.delete(value);
    else copy.add(value);
    setter(copy);
  };

  const toggleExtra = (field, value) => {
    setExtraSelections((prev) => {
      const next = { ...prev };
      const current = new Set(next[field] || []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      next[field] = current;
      return next;
    });
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExtraGroup = (key) => {
    setOpenExtraGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setExtraSelections({});
    setSortBy('popularity');
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
    setExtraSelections({});
    setSortBy('popularity');
    setPage(1);
    setSearchParams({});
  };

  // Active filter chips — built from real selections, not placeholders.
  const activeChips = useMemo(() => {
    const chips = [];
    selectedCategories.forEach((c) => chips.push({ key: `cat-${c}`, label: c, onRemove: () => toggleSet(setSelectedCategories, selectedCategories, c) }));
    selectedBrands.forEach((b) => chips.push({ key: `brand-${b}`, label: b, onRemove: () => toggleSet(setSelectedBrands, selectedBrands, b) }));
    if (priceMin || priceMax) {
      chips.push({
        key: 'price',
        label: `Price: $${priceMin || '0'} – $${priceMax || ABSOLUTE_MAX_PRICE}`,
        onRemove: () => { setPriceMin(''); setPriceMax(''); },
      });
    }
    if (minRating) {
      chips.push({ key: 'rating', label: `${minRating}★ & up`, onRemove: () => setMinRating(0) });
    }
    Object.entries(extraSelections).forEach(([field, values]) => {
      (values || new Set()).forEach((v) => {
        chips.push({
          key: `${field}-${v}`,
          label: v,
          onRemove: () => toggleExtra(field, v),
        });
      });
    });
    return chips;
  }, [selectedCategories, selectedBrands, priceMin, priceMax, minRating, extraSelections]);

  const activeFiltersCount = activeChips.length;

  const pageTitle = q ? `Search Results for "${q}"` : catParam || 'All Products';

  const SectionHeader = ({ title, sectionKey }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between mb-4 text-left"
    >
      <h3 className="font-semibold text-base text-slate-900">{title}</h3>
      {openSections[sectionKey] ? (
        <Minus className="w-4 h-4 text-gray-400" />
      ) : (
        <Plus className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );

  const priceRangePercent = (value) => {
    const num = Number(value);
    if (!num) return 0;
    return Math.min(100, (num / ABSOLUTE_MAX_PRICE) * 100);
  };

  const filterSidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg text-slate-900">Filters</h2>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <SectionHeader title="Price Range" sectionKey="price" />
        {openSections.price && (
          <>
            <div className="relative h-1.5 rounded-full bg-gray-200 mb-5">
              <div
                className="absolute h-1.5 rounded-full bg-emerald-600"
                style={{
                  left: `${priceRangePercent(priceMin)}%`,
                  right: `${100 - priceRangePercent(priceMax || ABSOLUTE_MAX_PRICE)}%`,
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow"
                style={{ left: `calc(${priceRangePercent(priceMin)}% - 8px)` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow"
                style={{ left: `calc(${priceRangePercent(priceMax || ABSOLUTE_MAX_PRICE)}% - 8px)` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1 border border-gray-300 rounded-md px-2 py-1.5">
                <span className="text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={priceMin}
                  placeholder="0"
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full text-sm outline-none"
                />
              </div>
              <span className="text-gray-400 text-sm">To</span>
              <div className="flex items-center gap-1 flex-1 border border-gray-300 rounded-md px-2 py-1.5">
                <span className="text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={priceMax}
                  placeholder={String(ABSOLUTE_MAX_PRICE)}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Brand */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <SectionHeader title="Brand" sectionKey="brand" />
        {openSections.brand && (
          <>
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Search brand"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {visibleBrands.map((b) => (
                <label key={b} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.has(b)}
                    onChange={() => toggleSet(setSelectedBrands, selectedBrands, b)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="group-hover:text-slate-900 truncate">{b}</span>
                  <span className="ml-auto text-xs text-gray-400">({brandCounts.get(b)})</span>
                </label>
              ))}
              {brands.length === 0 && (
                <p className="text-xs text-gray-400">No brands available</p>
              )}
              {brands.length > 0 && visibleBrands.length === 0 && (
                <p className="text-xs text-gray-400">No brands match "{brandSearch}"</p>
              )}
            </div>
            {brands.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllBrands((v) => !v)}
                className="text-emerald-600 text-sm font-medium mt-3 hover:text-emerald-700"
              >
                {showAllBrands ? 'Show Less' : 'Show More'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Customer Rating */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <SectionHeader title="Customer Rating" sectionKey="rating" />
        {openSections.rating && (
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={minRating === rating}
                  onChange={() => setMinRating(minRating === rating ? 0 : rating)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="flex items-center gap-0.5 group-hover:text-slate-900">
                  {[...Array(rating)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
                  {[...Array(5 - rating)].map((_, i) => <span key={i} className="text-gray-300 text-sm">★</span>)}
                </span>
                <span className="text-gray-500">& Up</span>
                <span className="ml-auto text-xs text-gray-400">({ratingCounts.get(rating) || 0})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Optional extra groups - only shown when the product data has them */}
      {extraFilterData.map((group) => (
        <div key={group.key} className="mb-2 border-b border-gray-200 last:border-b-0">
          <button
            type="button"
            onClick={() => toggleExtraGroup(group.key)}
            className="w-full flex items-center justify-between py-4 text-left"
          >
            <h3 className="font-semibold text-base text-slate-900">{group.label}</h3>
            {openExtraGroups[group.key] ? (
              <Minus className="w-4 h-4 text-gray-400" />
            ) : (
              <Plus className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {openExtraGroups[group.key] && (
            <div className="space-y-2.5 pb-4">
              {group.options.map((opt) => (
                <label key={opt} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(extraSelections[group.field] || new Set()).has(opt)}
                    onChange={() => toggleExtra(group.field, opt)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="group-hover:text-slate-900 truncate">{opt}</span>
                  <span className="ml-auto text-xs text-gray-400">({group.counts.get(opt)})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm text-gray-500">
            <a href="/" className="hover:text-gray-700">Home</a>
            {catParam && (
              <>
                <span className="mx-2">›</span>
                <span className="text-gray-900">{catParam}</span>
              </>
            )}
            {!catParam && (
              <>
                <span className="mx-2">›</span>
                <span className="text-gray-900">Shop</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
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
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {filterSidebarContent()}
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
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                {filtered.length > 0 ? (
                  <>
                    Showing{' '}
                    <span className="font-medium">
                      {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}
                    </span>{' '}
                    of <span className="font-medium">{filtered.length}</span> results
                  </>
                ) : (
                  'No results'
                )}
              </p>

              {/* Active filter chips */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {activeChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700"
                    >
                      {chip.label}
                      <button type="button" onClick={chip.onRemove} aria-label={`Remove ${chip.label}`}>
                        <X className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-emerald-600 text-xs font-semibold hover:text-emerald-700"
                  >
                    Clear All
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <label className="text-gray-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-700">Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
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
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                      : 'grid grid-cols-1 gap-4'
                  }
                >
                  {pageItems.map((p) => (
                    <ProductCard key={p.id || p.productId} product={p} layout={viewMode} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
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
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
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