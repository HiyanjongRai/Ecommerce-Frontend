import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useHomeTheme } from './useHomeTheme';
import ProductCard from '../Product/ProductCard';
import { getProductLink } from '../../utils/slugHelper';
import {
  getBestSellers,
  getTopRated,
  getTrendingProducts,
  getMostWishlisted,
  getRecommendations,
} from '../../services/homepageApi';

const BASE_URL = 'http://localhost:8080';

const CategoryNavbar = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'best-sellers';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');
  const [filterPrice, setFilterPrice] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;
  const { darkMode, toggleDarkMode } = useHomeTheme();

  // Category configuration
  const categories = {
    'best-sellers': {
      label: 'Best Sellers',
      icon: '⭐',
      color: 'from-blue-500 to-blue-600',
      fetchFn: () => getBestSellers(0, 50),
    },
    'new-arrivals': {
      label: 'New Arrivals',
      icon: '✨',
      color: 'from-purple-500 to-purple-600',
      fetchFn: () => getRecommendations(50),
    },
    'todays-deals': {
      label: 'Active Deals',
      icon: '🔥',
      color: 'from-red-500 to-red-600',
      fetchFn: () => getTrendingProducts(0, 50),
    },
    'special-offers': {
      label: 'Special Offers',
      icon: '🎁',
      color: 'from-green-500 to-green-600',
      fetchFn: () => getMostWishlisted(0, 50),
    },
  };

  const currentCategory = categories[category] || categories['best-sellers'];
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setCurrentPage(0);
      try {
        const response = await currentCategory.fetchFn();
        const data = response.content || response.data || response || [];
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  // Sort products
  const sortProducts = (productsToSort) => {
    const sorted = [...productsToSort];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'newest':
        return sorted.reverse();
      default:
        return sorted;
    }
  };

  // Filter products by price
  const filterProducts = (productsToFilter) => {
    if (filterPrice === 'all') return productsToFilter;
    
    return productsToFilter.filter(p => {
      const price = p.salePrice || p.price || 0;
      switch (filterPrice) {
        case 'under-5k':
          return price < 5000;
        case '5k-10k':
          return price >= 5000 && price < 10000;
        case '10k-20k':
          return price >= 10000 && price < 20000;
        case '20k-50k':
          return price >= 20000 && price < 50000;
        case 'above-50k':
          return price >= 50000;
        default:
          return true;
      }
    });
  };

  const displayProducts = filterProducts(sortProducts(products));
  const totalPages = Math.ceil(displayProducts.length / itemsPerPage);
  const paginatedProducts = displayProducts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const CategoryButton = ({ id, label, icon }) => {
    const isActive = category === id;

    return (
      <Link
        to={`/category?category=${id}`}
        onClick={(e) => {
          // If the clicked category is already active, force a navigation push
          // so effects depending on the location/search params re-run.
          if (isActive) {
            e.preventDefault();
            navigate(`/category?category=${id}`, { state: { force: Date.now() } });
          }
        }}
        className={`px-3 py-2 rounded text-xs font-bold uppercase transition-all whitespace-nowrap ${
          isActive
            ? 'bg-[#28c76f] text-white shadow-md'
            : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-800 hover:border-[#28c76f]'
        }`}
      >
        <span className="mr-1">{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-[#090a0f] text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* Navbar */}
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* Category Hero */}
      <section className={`bg-gradient-to-r ${currentCategory.color} py-6 text-white`}> 
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-white shadow-sm shadow-black/20">
                <span>{currentCategory.icon}</span>
                {currentCategory.label}
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-3xl md:text-4xl">
                Simple shopping for {currentCategory.label}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                Clear product cards, smarter filters, and easy browsing built for customers who want fast decision-making.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 px-3 py-2 text-xs text-white/85 border border-white/10">
                  <p className="font-black uppercase tracking-[0.20em] text-emerald-200 text-[9px]">Total items</p>
                  <p className="mt-2 text-base font-black">{products.length}</p>
                </div>
                <div className="rounded-3xl bg-white/10 px-3 py-2 text-xs text-white/85 border border-white/10">
                  <p className="font-black uppercase tracking-[0.20em] text-emerald-200 text-[9px]">Category</p>
                  <p className="mt-2 text-base font-black">{currentCategory.label}</p>
                </div>
                <div className="rounded-3xl bg-white/10 px-3 py-2 text-xs text-white/85 border border-white/10">
                  <p className="font-black uppercase tracking-[0.20em] text-emerald-200 text-[9px]">Ready to shop</p>
                  <p className="mt-2 text-base font-black">Fast browsing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className={`${darkMode ? 'bg-zinc-900 border-b border-zinc-800' : 'bg-gray-50 border-b border-gray-200'} py-4`}> 
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-3">
            <CategoryButton id="best-sellers" label="Best Sellers" icon="⭐" />
            <CategoryButton id="new-arrivals" label="New Arrivals" icon="✨" />
            <CategoryButton id="todays-deals" label="Active Deals" icon="🔥" />
            <CategoryButton id="special-offers" label="Special Offers" icon="🎁" />
          </div>
        </div>
      </section>

      {/* Filters and Sort */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full">
        <div className={`rounded-3xl border p-4 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.2fr_0.9fr] items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] text-gray-500 dark:text-gray-400">Refine results</p>
              <h2 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">Sort, filter, and find the best products fast.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.22em] font-black text-gray-500 dark:text-gray-400 mb-2">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(0); }}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-emerald-400`}
                >
                  <option value="popular">Popular</option>
                  <option value="price-low">Price ↑</option>
                  <option value="price-high">Price ↓</option>
                  <option value="rating">Rating</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.22em] font-black text-gray-500 dark:text-gray-400 mb-2">Price</label>
                <select
                  value={filterPrice}
                  onChange={(e) => { setFilterPrice(e.target.value); setCurrentPage(0); }}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-emerald-400`}
                >
                  <option value="all">All prices</option>
                  <option value="under-5k">Under Rs. 5,000</option>
                  <option value="5k-10k">Rs. 5,000 - 10,000</option>
                  <option value="10k-20k">Rs. 10,000 - 20,000</option>
                  <option value="20k-50k">Rs. 20,000 - 50,000</option>
                  <option value="above-50k">Above Rs. 50,000</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => { setFilterPrice('all'); setSortBy('popular'); setCurrentPage(0); }}
                  className="w-full rounded-2xl border border-emerald-500 bg-emerald-500/10 px-4 py-3 text-sm font-black uppercase tracking-[0.22em] text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full flex-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className={`h-48 rounded-[24px] border ${
                  darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'
                } animate-pulse`}
              />
            ))}
          </div>
        ) : paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-4">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id || product.productId} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className={`px-3 py-2 text-xs font-black rounded-full ${
                    currentPage === 0
                      ? 'bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-[#28c76f] text-black hover:bg-emerald-400'
                  }`}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`px-3 py-2 text-xs font-black rounded-full ${
                      currentPage === idx
                        ? 'bg-black text-white border border-emerald-500'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-500 hover:text-black'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className={`px-3 py-2 text-xs font-black rounded-full ${
                    currentPage === totalPages - 1
                      ? 'bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-[#28c76f] text-black hover:bg-emerald-400'
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={`text-center py-12 rounded-[28px] border-2 border-dashed ${
            darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-gray-200 bg-white'
          }`}>
            <p className="text-4xl mb-3">📭</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              No products found
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters or come back later.
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CategoryNavbar;
