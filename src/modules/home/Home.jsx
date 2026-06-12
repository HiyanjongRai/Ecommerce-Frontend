import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../../shared/components/Footer/Footer';
import ProductCard from '../product/components/ProductCard';
import Navbar from '../../shared/components/Navbar/Navbar';
import { getProducts } from '../../shared/api/customerApi';
import { 
  getHomepageAggregated,
  getHomepageTrendingProducts,
  getNewArrivalProducts,
  getTopSellingProducts,
  getMostLovedProducts,
  getHighestDiscountProducts,
  getFeaturedProducts
} from './services/homepageService';
import { 
  Flower2, 
  Sprout, 
  Droplet, 
  Wrench, 
  Compass, 
  Image as ImageIcon, 
  Box, 
  Sparkles, 
  Cpu, 
  Tag,
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Lock, 
  Headphones, 
  ArrowRight, 
  Mail,
  User,
  Store
} from 'lucide-react';
import { toast } from 'react-toastify';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns true if the product looks like backend seed / test data and should be hidden. */
const isTestProduct = (p) => {
  const name = String(p.name || '').trim();
  if (!name || name.length < 3) return true;
  // Detect repetitive single-char names like "aaaa", "zzz", "iiii", "yyyy"
  if (/^(.)\1{2,}$/i.test(name)) return true;
  // Price sanity: hide products priced below Rs. 50 (clearly seed data)
  const price = Number(p.price || p.minPrice || p.salePrice || 0);
  if (price > 0 && price < 50) return true;
  return false;
};

const isTestBanner = (b) => {
  const title = String(b.title || '').trim().toLowerCase();
  return !title || title.length < 3 || /^(.)\1{2,}$/i.test(title) || title === 'test' || title === 'aaa';
};

export default function Home() {
  const navigate = useNavigate();
  const [activeSidebarCat, setActiveSidebarCat] = useState('Electronics & Gadgets');
  
  // Dynamic Homepage States
  const [banners, setBanners] = useState([]);
  const [activePromoCodes, setActivePromoCodes] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeBestsellerTab, setActiveBestsellerTab] = useState('All');
  
  // Product States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  
  // Single shared Flash Sale countdown — used in both the promo card and the nav bar label
  const [flashTimeLeft, setFlashTimeLeft] = useState(6 * 3600 + 44 * 60 + 12);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlashTimeLeft((prev) => (prev > 0 ? prev - 1 : 24 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Fetch aggregated homepage DTO on mount
  useEffect(() => {
    const loadAggregatedHomepage = async () => {
      setLoading(true);
      try {
        const [data, allRes] = await Promise.all([
          getHomepageAggregated(8),
          getProducts({ page: 0, size: 24 })
        ]);
        const rawBanners = data.banners || [];
        setBanners(rawBanners.filter(b => !isTestBanner(b)));
        setActivePromoCodes(data.activePromoCodes || []);
        setActiveCampaigns(data.activeCampaigns || []);
        
        // Default tab is 'All' — load all products, filter out seed/test entries
        const allProducts = allRes.data?.content || allRes.data || [];
        setProducts((Array.isArray(allProducts) ? allProducts : []).filter(p => !isTestProduct(p)));
      } catch (err) {
        console.error('Failed to load dynamic homepage aggregation:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadAggregatedHomepage();
  }, []);

  // Cycle Banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  // Lazy load product tabs
  const loadTabProducts = useCallback(async (tab) => {
    setLoading(true);
    try {
      let data = [];
      if (tab === 'All') {
        const res = await getProducts({ page: 0, size: 24 });
        const raw = res.data?.content || res.data || [];
        data = Array.isArray(raw) ? raw : [];
      } else if (tab === 'Trending') {
        data = await getHomepageTrendingProducts(8);
      } else if (tab === 'New Arrivals') {
        data = await getNewArrivalProducts(8);
      } else if (tab === 'Top Selling') {
        data = await getTopSellingProducts(8);
      } else if (tab === 'Most Loved') {
        data = await getMostLovedProducts(8);
      } else if (tab === 'Highest Discount') {
        data = await getHighestDiscountProducts(8);
      } else if (tab === 'Featured') {
        data = await getFeaturedProducts(8);
      }
      
      const fetched = (Array.isArray(data) ? data : []).filter(p => !isTestProduct(p));
      setProducts(fetched);
    } catch (err) {
      console.error(`Failed to fetch tab ${tab} products:`, err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveBestsellerTab(tab);
    loadTabProducts(tab);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
    toast.success('Joined the Jhapcham newsletter list!');
  };

  // 10 Categories for Sidebar
  const sidebarCategories = [
    { name: 'Electronics & Gadgets', icon: Cpu },
    { name: 'Fashion & Apparel', icon: Tag },
    { name: 'Computers & Gaming', icon: Cpu },
    { name: 'Home & Living', icon: Box },
    { name: 'Beauty & Personal Care', icon: Droplet },
    { name: 'Sports & Fitness', icon: Compass },
    { name: 'Bags & Travel', icon: Box },
    { name: 'Books & Stationery', icon: ImageIcon },
    { name: 'Automotive', icon: Wrench },
    { name: 'Groceries & Essentials', icon: Sprout },
  ];

  const bestsellerTabs = ['All', 'Trending', 'New Arrivals', 'Top Selling', 'Most Loved', 'Highest Discount', 'Featured'];

  // ─── Promo Deals ─────────────────────────────────────────────────────────
  // All cards share the same editorial dark style; color is used only for the category badge.
  const promoDeals = [];

  activeCampaigns.forEach((c) => {
    promoDeals.push({
      type: 'CAMPAIGN',
      tag: 'ACTIVE CAMPAIGN',
      title: c.campaignName || 'Special Campaign',
      desc: c.description || 'Exclusive seller discounts for a limited time.',
      link: `/promo/campaign?campaign=${c.id}`,
      badge: c.status || 'CAMPAIGN',
      badgeColor: 'bg-emerald-600 text-white',
      tagColor: 'bg-emerald-600',
    });
  });

  activePromoCodes.forEach((p) => {
    promoDeals.push({
      type: 'PROMO',
      tag: 'PROMO CODE',
      title: p.title || `Coupon ${p.code}`,
      desc: p.description || `Use code ${p.code} at checkout to save.`,
      link: `/promo?code=${p.code}`,
      badge: p.discountType === 'PERCENTAGE' ? `${p.discountValue}% OFF` : `Rs. ${p.discountValue} OFF`,
      badgeColor: 'bg-ochre text-linen',
      tagColor: 'bg-ochre',
    });
  });

  // Static fallbacks — unified editorial card style
  if (promoDeals.length < 3) {
    promoDeals.push({
      type: 'STATIC_FLASH',
      tag: 'FLASH SALE',
      title: 'Up to 30% Off Electronics',
      desc: 'Limited-time deals on gaming keyboards, premium smartwatches, and noise-canceling headphones. Ends when the timer hits zero.',
      link: '/product-list?onSale=true',
      badge: 'ENDS SOON',
      badgeColor: 'bg-ochre text-linen',
      tagColor: 'bg-ochre',
      showTimer: true,
    });
  }
  if (promoDeals.length < 3) {
    promoDeals.push({
      type: 'STATIC_NEW',
      tag: 'NEW ARRIVALS',
      title: 'Fresh Drops This Week',
      desc: 'First looks at the latest fashion-forward arrivals — tailored outerwear, premium footwear, and statement accessories.',
      link: '/product-list?category=Fashion',
      badge: 'JUST IN',
      badgeColor: 'bg-emerald-600 text-white',
      tagColor: 'bg-emerald-600',
    });
  }
  if (promoDeals.length < 3) {
    promoDeals.push({
      type: 'STATIC_BEST',
      tag: 'BESTSELLERS',
      title: 'Home & Living Essentials',
      desc: 'Top-rated kitchen equipment, ergonomic furniture, and premium home decor — consistently loved by thousands of customers.',
      link: '/product-list?category=Home',
      badge: 'TOP RATED',
      badgeColor: 'bg-slate-900 text-white',
      tagColor: 'bg-gray-400',
    });
  }

  const displayDeals = promoDeals.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 overflow-x-hidden selection:bg-emerald-50 selection:text-emerald-700">
      {/* Dynamic Botanical Navbar */}
      <Navbar />

      {/* Hero Grid Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            {/* Sidebar heading aligned with product section headings */}
            <h2 className="font-bold text-base text-slate-800 tracking-tight mb-4 hidden lg:block border-b border-gray-200 pb-2">
              Categories
            </h2>
            
            {/* Horizontal Scroll on Mobile / Vertical on Desktop */}
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-3 lg:pb-0 scroll-smooth whitespace-nowrap lg:whitespace-normal">
              {sidebarCategories.map((cat) => {
                const Icon = cat.icon;
                const active = activeSidebarCat === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setActiveSidebarCat(cat.name);
                      navigate(`/product-list?category=${encodeURIComponent(cat.name)}`);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xs transition-all duration-200 text-left w-full border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                      active 
                        ? 'border-l-4 border-l-emerald-500 border-transparent bg-emerald-50 text-emerald-600 font-extrabold' 
                        : 'border-transparent hover:bg-gray-100 text-slate-700'
                    }`}
                  >
                    {/* Brand-consistent icon treatment */}
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Hero Banner Container */}
          <div className="lg:col-span-3">
            {banners.length > 0 ? (
              // Dynamic slideshow banners
              <div 
                className="relative bg-slate-900 text-white rounded-card p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl min-h-[500px] flex flex-col justify-between transition-all duration-500 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(15,23,42,0.65), rgba(15,23,42,0.85)), url(${
                    banners[currentBannerIndex].image.startsWith('http') 
                      ? banners[currentBannerIndex].image 
                      : `${BASE_URL}/banners/${banners[currentBannerIndex].image}`
                  })`
                }}
              >
                <div className="relative z-10 max-w-2xl text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-3">
                    EST. 2024 / JHAPCHAM SPOTLIGHT
                  </span>
                  
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight animate-in fade-in duration-300">
                    {banners[currentBannerIndex].title || 'Premium Products, Delivered Fast'}
                  </h1>
                  
                  <p className="font-inter text-gray-300 text-xs sm:text-sm leading-relaxed max-w-lg mb-8 animate-in fade-in duration-500">
                    {banners[currentBannerIndex].subtitle || 'Discover verified electronics, fashion, home essentials and more — curated from trusted sellers across Nepal.'}
                  </p>

                  <div className="flex flex-wrap gap-4 mb-8">
                    <Link 
                      to={banners[currentBannerIndex].redirectUrl || "/product-list"} 
                      className="bg-emerald-500 hover:bg-white text-white hover:text-slate-900 text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 shadow-md focus:ring-2 focus:ring-emerald-500/40 outline-none flex items-center gap-2"
                    >
                      <span>Shop This Deal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex gap-2 relative z-10 justify-start mb-6">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        currentBannerIndex === idx ? 'bg-emerald-500 w-6' : 'bg-gray-600 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>

                {/* Bottom Row: Stats Row */}
                <div className="border-t border-gray-700/60 pt-6 relative z-10">
                  <div className="grid grid-cols-3 gap-4 text-left">
                    <div>
                      <span className="font-bold text-lg sm:text-xl text-emerald-400 block">12,000+</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Products Listed</span>
                    </div>
                    <div>
                      <span className="font-bold text-lg sm:text-xl text-emerald-400 block">99.4%</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Authenticity Rate</span>
                    </div>
                    <div>
                      <span className="font-bold text-lg sm:text-xl text-emerald-400 block">100%</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Secure Delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback curated block — premium editorial hero
              <div className="relative bg-slate-900 text-white rounded-card p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl min-h-[500px] flex flex-col justify-between">
                
                {/* Geometric background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                  <svg className="w-full h-full" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 100 Q 150 50, 250 150 T 450 100 T 650 200" fill="none" stroke="currentColor" strokeWidth="2" className="text-white" />
                    <path d="M100 500 Q 300 400, 400 550 T 700 450" fill="none" stroke="currentColor" strokeWidth="2" className="text-white" />
                    <circle cx="200" cy="300" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-white" />
                    <circle cx="600" cy="250" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-white" />
                  </svg>
                </div>

                {/* Top Row: Tagline and Headline */}
                <div className="relative z-10 max-w-2xl text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-3">
                    EST. 2024 / NEPAL'S PREMIUM MARKETPLACE
                  </span>
                  
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                    Quality products, <span className="font-normal italic text-emerald-400">verified</span> sellers, delivered fast.
                  </h1>
                  
                  <p className="font-inter text-gray-300 text-xs sm:text-sm leading-relaxed max-w-lg mb-8">
                    Jhapcham connects you to trusted sellers across Nepal — from premium electronics and fashion to home essentials and lifestyle goods. Every listing is quality-checked and shipped securely.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-4 mb-8">
                    <Link 
                      to="/product-list" 
                      className="bg-emerald-500 hover:bg-white text-white hover:text-slate-900 text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 shadow-md focus:ring-2 focus:ring-emerald-500/40 outline-none flex items-center gap-2"
                    >
                      <span>Browse Catalog</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link 
                      to="/product-list?onSale=true" 
                      className="border border-gray-600 hover:border-white text-white text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 focus:ring-2 focus:ring-gray-600/40 outline-none"
                    >
                      View Flash Sale
                    </Link>
                  </div>
                </div>

                {/* Bottom Row: Stats Row */}
                <div className="border-t border-gray-800 pt-6 mt-8 relative z-10">
                  <div className="grid grid-cols-3 gap-4 text-left">
                    <div>
                      <span className="font-bold text-lg sm:text-2xl text-emerald-400 block">12,000+</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Products Listed</span>
                    </div>
                    <div>
                      <span className="font-bold text-lg sm:text-2xl text-emerald-400 block">99.4%</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Authenticity Rate</span>
                    </div>
                    <div>
                      <span className="font-bold text-lg sm:text-2xl text-emerald-400 block">100%</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Secure Delivery</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Promo Cards Row ──────────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayDeals.map((deal, index) => (
            <div 
              key={index} 
              className="bg-white border border-gray-200 rounded-card p-6 flex flex-col justify-between text-left group hover:border-emerald-500 hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs ${deal.tag === 'FLASH SALE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                    {deal.tag}
                  </span>
                  
                  {deal.showTimer && (
                    <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-100">
                      {formatCountdown(flashTimeLeft)}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2 leading-tight">
                  {deal.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {deal.desc}
                </p>
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <Link 
                  to={deal.link} 
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
                >
                  <span>Explore Offer</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-xs bg-gray-100 text-gray-700`}>
                  {deal.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white text-slate-800 py-8 border-y border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            
            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Fast Shipping</h4>
              <p className="text-[10px] text-gray-400">Secure bubble-wrapped packaging</p>
            </div>

            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Authenticity Guarantee</h4>
              <p className="text-[10px] text-gray-400">100% genuine products with warranty</p>
            </div>

            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Easy Returns</h4>
              <p className="text-[10px] text-gray-400">Hassle-free 7-day return policy</p>
            </div>

            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Secure Checkout</h4>
              <p className="text-[10px] text-gray-400">100% secure online transactions</p>
            </div>

            <div className="flex flex-col items-center gap-2 p-2 col-span-2 md:col-span-1">
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <Headphones className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">24/7 Support</h4>
              <p className="text-[10px] text-gray-400">Always-on priority live agent care</p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Product Showcase ──────────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-gray-200 pb-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
              CURATED FOR YOU
            </span>
            <h2 className="font-bold text-2xl text-slate-800 tracking-tight">
              Shop the Collection
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
            {bestsellerTabs.map((tab) => {
              const active = activeBestsellerTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`text-xs font-bold px-4 py-2 rounded-pill transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                    active 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'bg-white border border-gray-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-600'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid — justify-start so last row doesn't stretch */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="animate-pulse bg-white border border-gray-200 rounded-card p-4 flex flex-col gap-4 min-h-[350px]">
                <div className="bg-gray-100 aspect-[4/5] rounded w-full" />
                <div className="h-4 bg-gray-150 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded w-full mt-auto" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-start">
            {products.map((p) => (
              <ProductCard 
                key={p.productId || p.id} 
                product={p} 
                variant="verdant" 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 text-xs font-bold">
            No products available in this section yet.
          </div>
        )}
      </section>

      {/* Two Promotional Banner Cards Side-by-Side */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Banner 1: Dark Variant */}
          <div className="relative bg-slate-900 text-white rounded-card p-8 md:p-12 overflow-hidden shadow-lg flex flex-col justify-between min-h-[360px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-3">
                PREMIUM TECH & GADGETS
              </span>
              <h3 className="font-bold text-2xl leading-tight mb-4">
                Smart Devices & Wearables
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                Upgrade to high-performance smartwatches, noise-canceling headphones, and full-spectrum LED lighting for your home or studio.
              </p>
            </div>
            <div className="relative z-10">
              <Link 
                to="/product-list?category=Electronics" 
                className="inline-block bg-emerald-500 hover:bg-white text-white hover:text-slate-900 text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 shadow-md focus:ring-2 focus:ring-emerald-500/30 outline-none"
              >
                Shop Electronics
              </Link>
            </div>
          </div>

          {/* Banner 2: Branded Accent Variant */}
          <div className="relative bg-emerald-600 text-white rounded-card p-8 md:p-12 overflow-hidden shadow-lg flex flex-col justify-between min-h-[360px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-slate-950/20 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100 block mb-3">
                FASHION & LIFESTYLE
              </span>
              <h3 className="font-bold text-2xl leading-tight mb-4">
                Outerwear & Footwear
              </h3>
              <p className="text-xs text-emerald-50 leading-relaxed mb-6">
                Explore hand-crafted leather boots, heavyweight utility jackets, and premium winter parkas — built to last, styled to impress.
              </p>
            </div>
            <div className="relative z-10">
              <Link 
                to="/product-list?category=Fashion" 
                className="inline-block bg-slate-900 hover:bg-white text-white hover:text-slate-900 text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 shadow-md focus:ring-2 focus:ring-slate-900/30 outline-none"
              >
                Explore Fashion
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Dual Portal Entry: Customer & Seller Dashboards ───────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-left">
        <div className="border-t border-gray-200 pt-12 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
              JHAPCHAM ECOSYSTEM
            </span>
            <h2 className="font-bold text-2xl text-slate-800 tracking-tight">
              One Platform. Two Tailored Experiences.
            </h2>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed max-w-md">
            Whether you're sourcing premium items or scaling your business as a verified merchant, Jhapcham provides professional telemetry and secure pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Portal Card */}
          <div className="group relative bg-white border border-gray-200 rounded-card p-8 md:p-10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                  Customer Dashboard
                  <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-xs font-black uppercase tracking-widest">
                    Buyer Hub
                  </span>
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Access your order history, track live shipments, manage your wishlist library, write product reviews, and initiate secure 7-day refund claims directly.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-150 flex items-center justify-between">
              <Link 
                to="/customer/dashboard" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-slate-900 transition-colors"
              >
                <span>Access Customer Hub</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-[10px] font-bold text-gray-400">Manage Orders & Claims</span>
            </div>
          </div>

          {/* Seller Portal Card */}
          <div className="group relative bg-white border border-gray-200 rounded-card p-8 md:p-10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-slate-800 shadow-sm group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                  Merchant Console
                  <span className="text-[8px] bg-gray-100 text-gray-500 border border-gray-250 px-2 py-0.5 rounded-xs font-black uppercase tracking-widest">
                    Seller Panel
                  </span>
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Launch your storefront, list products, track orders, audit payouts, upload payment events, and resolve claims with our dedicated seller dashboard telemetry.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-150 flex items-center justify-between">
              <Link 
                to="/seller/dashboard" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-emerald-600 transition-colors"
              >
                <span>Launch Seller Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-[10px] font-bold text-gray-400">Manage Products & Sales</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Newsletter CTA ──────────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-slate-900 text-white rounded-card p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-xl border border-gray-800">
          
          <div className="absolute inset-0 opacity-5 pointer-events-none select-none">
            <svg className="w-full h-full" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8,8" className="text-white" />
              <circle cx="1000" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8,8" className="text-white" />
            </svg>
          </div>

          <div className="max-w-2xl mx-auto relative z-10">
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest block mb-3">
              JHAPCHAM INSIDER — WEEKLY DIGEST
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight tracking-tight">
              Get exclusive deals & new arrivals first.
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
              Subscribe for weekly curated picks, flash sale alerts, and member-only discount codes — straight to your inbox, zero spam.
            </p>

            {/* Form */}
            {subscribed ? (
              <div className="max-w-md mx-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3.5 px-6 rounded-card text-xs font-bold flex items-center justify-center gap-2">
                <span>✓ You're on the list. Welcome to Jhapcham Insider.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row items-stretch border border-gray-700 rounded-card sm:rounded-pill overflow-hidden bg-slate-950 gap-1.5 sm:gap-0 p-1.5 sm:p-0">
                <div className="flex items-center px-4 text-gray-500 pl-5">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  placeholder="your.email@gmail.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="flex-1 bg-transparent py-3 px-3 text-xs outline-none text-white placeholder-gray-500 focus:outline-none"
                />
                <button 
                  type="submit" 
                  className="bg-emerald-500 hover:bg-white text-white hover:text-slate-900 text-xs font-bold px-6 py-3 rounded-card sm:rounded-pill transition-colors duration-250 outline-none flex items-center justify-center gap-1.5"
                >
                  <span>Subscribe</span>
                </button>
              </form>
            )}

            {/* Newsletter Stats */}
            <div className="grid grid-cols-3 gap-4 border-t border-gray-800 pt-8 mt-10 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <div>
                <span className="block text-emerald-400 text-xs font-bold mb-0.5">Every Week</span>
                <span>Curated deal alerts</span>
              </div>
              <div>
                <span className="block text-emerald-400 text-xs font-bold mb-0.5">15,000+</span>
                <span>Active members</span>
              </div>
              <div>
                <span className="block text-emerald-400 text-xs font-bold mb-0.5">Zero Spam</span>
                <span>Unsubscribe anytime</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Global shared Footer */}
      <Footer />
    </div>
  );
}
