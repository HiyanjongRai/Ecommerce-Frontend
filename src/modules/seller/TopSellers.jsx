import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTopSellers, getTopRatedSellers } from '../../shared/api/customerApi';
import { Store, Star, Award, TrendingUp, Search, ArrowRight } from 'lucide-react';
import Footer from '../../shared/components/Footer/Footer';

export default function TopSellers() {
  const [topSellers, setTopSellers] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [activeTab, setActiveTab] = useState('selling'); // 'selling' or 'rated'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const loadSellers = async () => {
      setLoading(true);
      try {
        const [sellersRes, ratedRes] = await Promise.all([
          getTopSellers(30),
          getTopRatedSellers(30)
        ]);
        setTopSellers(Array.isArray(sellersRes.data) ? sellersRes.data : []);
        setTopRated(Array.isArray(ratedRes.data) ? ratedRes.data : []);
      } catch (err) {
        console.error('Failed to load top sellers:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSellers();
  }, []);

  const activeList = activeTab === 'selling' ? topSellers : topRated;

  const filteredSellers = useMemo(() => {
    return activeList.filter(seller => 
      String(seller.storeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(seller.sellerFullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeList, searchQuery]);

  const resolveLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    return logoPath.startsWith('http') ? logoPath : `${BASE_URL}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans text-[#1c241e]">
      
      {/* Premium Forest Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0a120c] to-[#162a1c] text-[#f7fee7] py-16 px-6 shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#84cc16_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-moss/20 border border-moss/30 rounded-full text-xs font-black uppercase tracking-wider text-[#bef264] mb-3">
              <Award className="w-3.5 h-3.5" /> Jhapcham Verified Stores
            </div>
            <h1 className="text-4xl md:text-5xl font-fraunces font-black leading-tight mb-3">
              Meet Our Top Sellers
            </h1>
            <p className="text-[#a3b899] text-base md:text-lg max-w-2xl font-medium">
              Discover local artisans, trusted distributors, and dynamic creators who are shaping the Jhapcham marketplace.
            </p>
          </div>
          
          {/* Quick Stats Banner */}
          <div className="flex gap-4 sm:gap-6 flex-wrap">
            <div className="bg-[#122216]/60 border border-moss/20 backdrop-blur-md rounded-2xl p-4 min-w-[140px] shadow-sm">
              <div className="text-2xl font-black text-[#bef264]">30+</div>
              <div className="text-xs text-[#a3b899] font-bold">Top Storefronts</div>
            </div>
            <div className="bg-[#122216]/60 border border-moss/20 backdrop-blur-md rounded-2xl p-4 min-w-[140px] shadow-sm">
              <div className="text-2xl font-black text-[#bef264]">100%</div>
              <div className="text-xs text-[#a3b899] font-bold">Verified Trust</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 py-10">
        
        {/* Toolbar & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-white border border-stone/15 rounded-2xl p-4 shadow-sm">
          
          {/* Toggle Tabs */}
          <div className="flex p-1 bg-stone/10 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('selling')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'selling'
                  ? 'bg-moss text-linen shadow-sm'
                  : 'text-stone hover:text-forest-black'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Top Sellers By Sales</span>
            </button>
            <button
              onClick={() => setActiveTab('rated')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'rated'
                  ? 'bg-moss text-linen shadow-sm'
                  : 'text-stone hover:text-forest-black'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Top Rated Stores</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Search store name or merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone/5 border border-stone/15 rounded-xl text-sm placeholder-stone focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-all"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <svg className="animate-spin w-10 h-10 text-moss mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <span className="text-sm text-stone font-bold">Polishing merchant directory...</span>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone/15 rounded-3xl text-center px-4 shadow-sm">
            <div className="text-5xl mb-4">🏪</div>
            <h3 className="text-lg font-bold text-[#1c241e] mb-1">No Stores Found</h3>
            <p className="text-sm text-stone max-w-md mb-6">
              We couldn't find any verified Jhapcham stores matching "{searchQuery}". Double check your spelling or try another keyword.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-5 py-2.5 bg-moss text-linen hover:bg-forest-black rounded-xl font-bold transition-all text-xs"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSellers.map((seller, index) => {
              const rank = index + 1;
              const logo = resolveLogoUrl(seller.logoImagePath);
              
              return (
                <div 
                  key={seller.sellerUserId || index}
                  className="group relative bg-white border border-stone/15 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between"
                >
                  {/* Rank Badge */}
                  <span className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-xs font-black bg-stone/10 text-stone group-hover:bg-moss/10 group-hover:text-moss transition-colors">
                    #{rank}
                  </span>

                  <div>
                    {/* Header Info */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-xl border border-stone/10 bg-stone/5 flex items-center justify-center overflow-hidden shrink-0">
                        {logo ? (
                          <img src={logo} alt={seller.storeName} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-stone" />
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-forest-black truncate leading-tight group-hover:text-moss transition-colors">
                          {seller.storeName || 'Unnamed Store'}
                        </h3>
                        <p className="text-xs text-stone mt-1 truncate">
                          Merchant: <span className="font-semibold text-[#1c241e]">{seller.sellerFullName || 'Jhapcham Partner'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Stats Blocks */}
                    <div className="grid grid-cols-2 gap-3 bg-stone/5 rounded-xl p-3 mb-5 border border-stone/10 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone mb-0.5">Sold items</div>
                        <div className="text-sm font-black text-[#1c241e]">
                          {seller.soldQuantity ? Number(seller.soldQuantity).toLocaleString() : '0'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone mb-0.5">Feedback</div>
                        <div className="text-sm font-black text-[#1c241e] flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#e0a800] text-[#e0a800]" />
                          <span>{seller.averageRating ? seller.averageRating.toFixed(1) : '5.0'}</span>
                          <span className="text-[10px] font-normal text-stone">({seller.totalReviews || 0})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visit Store Button */}
                  <Link
                    to={`/seller-profile/${seller.sellerUserId}`}
                    className="w-full py-2.5 border border-moss/45 text-moss hover:bg-moss hover:text-linen text-xs font-black uppercase tracking-wider rounded-xl text-center transition-colors duration-250 flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-moss/20 outline-none"
                  >
                    <span>Visit Storefront</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
