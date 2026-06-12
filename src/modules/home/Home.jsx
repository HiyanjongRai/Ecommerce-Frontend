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
  Mail
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
        setBanners(data.banners || []);
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
      badgeColor: 'bg-moss text-linen',
      tagColor: 'bg-moss',
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
      badgeColor: 'bg-moss text-linen',
      tagColor: 'bg-moss',
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
      badgeColor: 'bg-forest-black text-linen',
      tagColor: 'bg-stone',
    });
  }

  const displayDeals = promoDeals.slice(0, 3);

  return (
    <div className="min-h-screen bg-linen text-forest-black overflow-x-hidden selection:bg-sage selection:text-moss">
      {/* Dynamic Botanical Navbar */}
      <Navbar />

      {/* Hero Grid Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            {/* Sidebar heading aligned with product section headings */}
            <h2 className="font-fraunces font-black text-lg text-forest-black tracking-tight mb-4 hidden lg:block border-b border-stone/25 pb-2">
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
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xs transition-all duration-200 text-left w-full border focus:outline-none focus:ring-2 focus:ring-moss/30 ${
                      active 
                        ? 'border-l-4 border-l-moss border-transparent bg-sage/60 text-moss' 
                        : 'border-transparent hover:bg-sage/25 text-forest-black'
                    }`}
                  >
                    {/* Brand-consistent icon treatment: moss tint when active, stone when idle */}
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-moss' : 'text-stone'}`} />
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
                className="relative bg-forest-black text-linen rounded-card p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl min-h-[500px] flex flex-col justify-between transition-all duration-500 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(6,7,6,0.65), rgba(6,7,6,0.85)), url(${
                    banners[currentBannerIndex].image.startsWith('http') 
                      ? banners[currentBannerIndex].image 
                      : `${BASE_URL}/banners/${banners[currentBannerIndex].image}`
                  })`
                }}
              >
                <div className="relative z-10 max-w-2xl text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sage block mb-3">
                    EST. 2024 / JHAPCHAM SPOTLIGHT
                  </span>
                  
                  <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-5xl font-black text-linen leading-[1.1] mb-5 tracking-tight animate-in fade-in duration-300">
                    {banners[currentBannerIndex].title || 'Premium Products, Delivered Fast'}
                  </h1>
                  
                  <p className="font-inter text-stone text-xs sm:text-sm leading-relaxed max-w-lg mb-8 animate-in fade-in duration-500">
                    {banners[currentBannerIndex].subtitle || 'Discover verified electronics, fashion, home essentials and more — curated from trusted sellers across Nepal.'}
                  </p>

                  <div className="flex flex-wrap gap-4 mb-8">
                    <Link 
                      to={banners[currentBannerIndex].redirectUrl || "/product-list"} 
                      className="bg-moss hover:bg-linen text-linen hover:text-forest-black text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 shadow-md focus:ring-2 focus:ring-sage/40 outline-none flex items-center gap-2"
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
                        currentBannerIndex === idx ? 'bg-moss w-6' : 'bg-stone/50 hover:bg-linen'
                      }`}
                    />
                  ))}
                </div>

                {/* Bottom Row: Stats Row */}
                <div className="border-t border-stone/25 pt-6 relative z-10">
                  <div className="grid grid-cols-3 gap-4 text-left">
                    <div>
                      <span className="font-fraunces font-bold text-lg sm:text-xl text-sage block">12,000+</span>
                      <span className="text-[9px] text-stone font-bold uppercase tracking-wider">Products Listed</span>
                    </div>
                    <div>
                      <span className="font-fraunces font-bold text-lg sm:text-xl text-sage block">99.4%</span>
                      <span className="text-[9px] text-stone font-bold uppercase tracking-wider">Authenticity Rate</span>
                    </div>
                    <div>
                      <span className="font-fraunces font-bold text-lg sm:text-xl text-sage block">100%</span>
                      <span className="text-[9px] text-stone font-bold uppercase tracking-wider">Secure Delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback curated block — premium editorial hero
              <div className="relative bg-forest-black text-linen rounded-card p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl min-h-[500px] flex flex-col justify-between">
                
                {/* Geometric background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                  <svg className="w-full h-full" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 100 Q 150 50, 250 150 T 450 100 T 650 200" fill="none" stroke="currentColor" strokeWidth="2" className="text-linen" />
                    <path d="M100 500 Q 300 400, 400 550 T 700 450" fill="none" stroke="currentColor" strokeWidth="2" className="text-linen" />
                    <circle cx="200" cy="300" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-linen" />
                    <circle cx="600" cy="250" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-linen" />
                  </svg>
                </div>

                {/* Top Row: Tagline and Headline */}
                <div className="relative z-10 max-w-2xl text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sage block mb-3">
                    EST. 2024 / NEPAL'S PREMIUM MARKETPLACE
                  </span>
                  
                  <h1 className="font-fraunces text-4xl sm:text-5xl lg:text-6xl font-black text-linen leading-[1.1] mb-6 tracking-tight">
                    Quality products, <span className="font-normal italic text-sage">verified</span> sellers, delivered fast.
                  </h1>
                  
                  <p className="font-inter text-stone text-sm sm:text-base leading-relaxed max-w-lg mb-8">
                    Jhapcham connects you to trusted sellers across Nepal — from premium electronics and fashion to home essentials and lifestyle goods. Every listing is quality-checked and shipped securely.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-4 mb-8">
                    <Link 
                      to="/product-list" 
                      className="bg-moss hover:bg-linen text-linen hover:text-forest-black text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 shadow-md focus:ring-2 focus:ring-sage/40 outline-none flex items-center gap-2"
                    >
                      <span>Browse Catalog</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link 
                      to="/product-list?onSale=true" 
                      className="border border-stone/50 hover:border-linen text-linen text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 focus:ring-2 focus:ring-stone/40 outline-none"
                    >
                      View Flash Sale
                    </Link>
                  </div>
                </div>

                {/* Bottom Row: Stats Row */}
                <div className="border-t border-stone/25 pt-6 mt-8 relative z-10">
                  <div className="grid grid-cols-3 gap-4 text-left">
                    <div>
                      <span className="font-fraunces font-bold text-lg sm:text-2xl text-sage block">12,000+</span>
                      <span className="text-[10px] text-stone font-bold uppercase tracking-wider">Products Listed</span>
                    </div>
                    <div>
                      <span className="font-fraunces font-bold text-lg sm:text-2xl text-sage block">99.4%</span>
                      <span className="text-[10px] text-stone font-bold uppercase tracking-wider">Authenticity Rate</span>
                    </div>
                    <div>
                      <span className="font-fraunces font-bold text-lg sm:text-2xl text-sage block">100%</span>
                      <span className="text-[10px] text-stone font-bold uppercase tracking-wider">Secure Delivery</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Promo Cards Row ──────────────────────────────────────────────── */}
      {/* All 3 cards share the same editorial dark background style;
          color is used only on the category badge to differentiate types */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayDeals.map((deal, index) => (
            <div 
              key={index} 
              className="bg-forest-black border border-stone/20 rounded-card p-6 flex flex-col justify-between text-left group hover:border-moss/40 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs ${deal.tagColor} text-linen`}>
                    {deal.tag}
                  </span>
                  
                  {deal.showTimer && (
                    <span className="font-mono text-xs font-bold text-ochre bg-stone/20 px-2 py-0.5 rounded-xs border border-stone/30">
                      {formatCountdown(flashTimeLeft)}
                    </span>
                  )}
                </div>
                <h3 className="font-fraunces font-bold text-xl text-linen mb-2 leading-tight">
                  {deal.title}
                </h3>
                <p className="text-xs text-stone leading-relaxed line-clamp-3">
                  {deal.desc}
                </p>
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-stone/20">
                <Link 
                  to={deal.link} 
                  className="text-xs font-bold text-sage hover:text-linen flex items-center gap-1.5 transition-colors"
                >
                  <span>Explore Offer</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-xs ${deal.badgeColor}`}>
                  {deal.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-forest-black text-linen py-8 border-y border-stone/20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            
            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 rounded-full bg-moss/25 text-sage">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-fraunces font-bold text-sm">Fast Shipping</h4>
              <p className="text-[10px] text-stone">Secure bubble-wrapped packaging</p>
            </div>

            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 rounded-full bg-moss/25 text-sage">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-fraunces font-bold text-sm">Authenticity Guarantee</h4>
              <p className="text-[10px] text-stone">100% genuine products with warranty</p>
            </div>

            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 rounded-full bg-moss/25 text-sage">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h4 className="font-fraunces font-bold text-sm">Easy Returns</h4>
              <p className="text-[10px] text-stone">Hassle-free 7-day return policy</p>
            </div>

            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 rounded-full bg-moss/25 text-sage">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-fraunces font-bold text-sm">Secure Checkout</h4>
              <p className="text-[10px] text-stone">100% secure online transactions</p>
            </div>

            <div className="flex flex-col items-center gap-2 p-2 col-span-2 md:col-span-1">
              <div className="p-3 rounded-full bg-moss/25 text-sage">
                <Headphones className="w-5 h-5" />
              </div>
              <h4 className="font-fraunces font-bold text-sm">24/7 Customer Care</h4>
              <p className="text-[10px] text-stone">Always-on priority live agent support</p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Product Showcase ──────────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-stone/25 pb-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-moss block mb-1">
              CURATED FOR YOU
            </span>
            <h2 className="font-fraunces font-black text-3xl text-forest-black tracking-tight">
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
                  className={`text-xs font-bold px-4 py-2 rounded-pill transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-moss/30 ${
                    active 
                      ? 'bg-moss text-linen' 
                      : 'bg-linen border border-stone/40 hover:border-moss text-forest-black'
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
              <div key={idx} className="animate-pulse bg-linen border border-stone/20 rounded-card p-4 flex flex-col gap-4 min-h-[350px]">
                <div className="bg-stone/10 aspect-[4/5] rounded w-full" />
                <div className="h-4 bg-stone/15 rounded w-3/4" />
                <div className="h-3 bg-stone/10 rounded w-1/2" />
                <div className="h-8 bg-stone/20 rounded w-full mt-auto" />
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
          <div className="text-center py-16 text-stone text-xs">
            No products available in this section yet.
          </div>
        )}
      </section>

      {/* Two Promotional Banner Cards Side-by-Side */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Banner 1: Dark Variant */}
          <div className="relative bg-forest-black text-linen rounded-card p-8 md:p-12 overflow-hidden shadow-lg flex flex-col justify-between min-h-[360px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-moss/10 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-sage block mb-3">
                PREMIUM TECH & GADGETS
              </span>
              <h3 className="font-fraunces font-black text-2xl sm:text-3xl leading-tight mb-4 text-linen">
                Smart Devices & Wearables
              </h3>
              <p className="text-xs text-stone leading-relaxed mb-6">
                Upgrade to high-performance smartwatches, noise-canceling headphones, and full-spectrum LED lighting for your home or studio.
              </p>
            </div>
            <div className="relative z-10">
              <Link 
                to="/product-list?category=Electronics" 
                className="inline-block bg-moss hover:bg-linen text-linen hover:text-forest-black text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 shadow-md focus:ring-2 focus:ring-sage/30 outline-none"
              >
                Shop Electronics
              </Link>
            </div>
          </div>

          {/* Banner 2: Moss Variant */}
          <div className="relative bg-moss text-linen rounded-card p-8 md:p-12 overflow-hidden shadow-lg flex flex-col justify-between min-h-[360px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-forest-black/10 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-forest-black block mb-3">
                FASHION & LIFESTYLE
              </span>
              <h3 className="font-fraunces font-black text-2xl sm:text-3xl leading-tight mb-4 text-linen">
                Outerwear & Footwear
              </h3>
              <p className="text-xs text-sage leading-relaxed mb-6">
                Explore hand-crafted leather boots, heavyweight utility jackets, and premium winter parkas — built to last, styled to impress.
              </p>
            </div>
            <div className="relative z-10">
              <Link 
                to="/product-list?category=Fashion" 
                className="inline-block bg-forest-black hover:bg-linen text-linen hover:text-forest-black text-xs font-bold px-6 py-3 rounded-pill tracking-wide transition-all duration-300 shadow-md focus:ring-2 focus:ring-forest-black/30 outline-none"
              >
                Explore Fashion
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Newsletter CTA ──────────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-forest-black text-linen rounded-card p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-xl border border-stone/10">
          
          <div className="absolute inset-0 opacity-5 pointer-events-none select-none">
            <svg className="w-full h-full" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8,8" className="text-linen" />
              <circle cx="1000" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8,8" className="text-linen" />
            </svg>
          </div>

          <div className="max-w-2xl mx-auto relative z-10">
            <span className="text-sage text-[10px] font-black uppercase tracking-widest block mb-3">
              JHAPCHAM INSIDER — WEEKLY DIGEST
            </span>
            <h2 className="font-fraunces font-black text-3xl sm:text-4xl lg:text-5xl text-linen mb-4 leading-tight tracking-tight">
              Get exclusive deals & new arrivals first.
            </h2>
            <p className="text-xs sm:text-sm text-stone max-w-md mx-auto mb-8 leading-relaxed">
              Subscribe for weekly curated picks, flash sale alerts, and member-only discount codes — straight to your inbox, zero spam.
            </p>

            {/* Form */}
            {subscribed ? (
              <div className="max-w-md mx-auto bg-moss/15 border border-moss/30 text-sage py-3.5 px-6 rounded-card text-xs font-bold flex items-center justify-center gap-2">
                <span>✓ You're on the list. Welcome to Jhapcham Insider.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row items-stretch border border-stone/30 rounded-card sm:rounded-pill overflow-hidden bg-forest-black gap-1.5 sm:gap-0 p-1.5 sm:p-0">
                <div className="flex items-center px-4 text-stone pl-5">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  placeholder="your.email@gmail.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="flex-1 bg-transparent py-3 px-3 text-xs outline-none text-linen placeholder-stone/50 focus:outline-none"
                />
                <button 
                  type="submit" 
                  className="bg-moss hover:bg-linen text-linen hover:text-forest-black text-xs font-bold px-6 py-3 rounded-card sm:rounded-pill transition-colors duration-250 outline-none flex items-center justify-center gap-1.5"
                >
                  <span>Subscribe</span>
                </button>
              </form>
            )}

            {/* Newsletter Stats — electronics/lifestyle positioning */}
            <div className="grid grid-cols-3 gap-4 border-t border-stone/25 pt-8 mt-10 text-[10px] font-bold text-stone uppercase tracking-wider">
              <div>
                <span className="block text-sage text-xs font-fraunces font-bold mb-0.5">Every Week</span>
                <span>Curated deal alerts</span>
              </div>
              <div>
                <span className="block text-sage text-xs font-fraunces font-bold mb-0.5">15,000+</span>
                <span>Active members</span>
              </div>
              <div>
                <span className="block text-sage text-xs font-fraunces font-bold mb-0.5">Zero Spam</span>
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
