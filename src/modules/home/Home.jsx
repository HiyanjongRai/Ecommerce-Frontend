import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from '../../shared/components/Footer/Footer';
import ProductCard from '../product/components/ProductCard';
import Navbar from '../../shared/components/Navbar/Navbar';
import { getProducts } from '../../shared/api/customerApi';
import {
  getHomepageAggregated,
  getHighestDiscountProducts,
  getRecommendations,
  getCategories,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivalProducts,
} from './services/homepageService';
import {
  Truck,
  RotateCcw,
  Headphones,
  ArrowRight,
  Mail,
  Star,
  ChevronRight,
  BadgeCheck,
  CheckCircle2,
  Cpu,
  Shirt,
  Sparkles,
  Home as HomeIcon,
  Trophy,
  BookOpen,
  ShoppingBasket,
  Armchair,
  Baby,
  Ticket,
  Leaf,
  Car,
  HeartPulse,
  PawPrint,
  LayoutGrid,
  CreditCard,
  PackageCheck,
  Shield,
} from 'lucide-react';
import { getProductLink } from '../../shared/utils/slugHelper';
import { toast } from 'react-toastify';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const isTestProduct = (p) => {
  const name = String(p.name || '').trim();
  if (!name || name.length < 3) return true;
  if (/^(.)\1{2,}$/i.test(name)) return true;
  const price = Number(p.price || p.minPrice || p.salePrice || 0);
  if (price > 0 && price < 50) return true;
  return false;
};

const normalizeProducts = (res, limit = 6) => {
  const list = Array.isArray(res) ? res : res?.content || res?.data?.content || res?.data || [];
  return (Array.isArray(list) ? list : []).filter((p) => !isTestProduct(p)).slice(0, limit);
};

const getProductImage = (product) => {
  const raw =
    product?.imagePaths?.[0] ??
    product?.imagePath ??
    product?.thumbnail ??
    product?.images?.[0]?.imagePath ??
    null;
  if (!raw) return '/Assets/Banners/homepage_hero_headphones.png';
  return raw.startsWith('http') ? raw : `${BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

const getProductPrice = (product) => {
  const original = Number(product.price || product.originalPrice || product.minPrice || 0);
  const sale = Number(product.salePrice || product.finalPrice || 0);
  const price = sale || original;
  return { price, original: original || price };
};

const HERO_SIDEBAR_CATS = [
  { name: 'Electronics', icon: Cpu, slug: 'Electronics' },
  { name: 'Fashion', icon: Shirt, slug: 'Fashion' },
  { name: 'Beauty', icon: Sparkles, slug: 'Beauty' },
  { name: 'Home & Kitchen', icon: HomeIcon, slug: 'Home' },
  { name: 'Sports & Outdoors', icon: Trophy, slug: 'Sports' },
  { name: 'Books & Stationery', icon: BookOpen, slug: 'Books' },
  { name: 'Grocery & Essentials', icon: ShoppingBasket, slug: 'Grocery' },
  { name: 'Furniture', icon: Armchair, slug: 'Furniture' },
  { name: 'Toys & Baby', icon: Baby, slug: 'Toys' },
  { name: 'Automotive', icon: Car, slug: 'Automotive' },
  { name: 'Health & Personal Care', icon: HeartPulse, slug: 'Health' },
  { name: 'Pet Supplies', icon: PawPrint, slug: 'Pet' },
];

const HERO_PROMO_CARDS = [
  {
    tag: "Today's Offer",
    title: 'Up to 60% OFF',
    desc: 'On selected products',
    link: '/product-list?onSale=true',
    linkLabel: 'Shop Now',
    image: '/Assets/Banners/campaign_hero_decoration.png',
  },
  {
    tag: 'Exclusive Coupon',
    title: 'Extra 20% OFF',
    desc: 'On your first order',
    link: '/promo',
    linkLabel: 'Get Coupon',
    isButton: true,
    image: null,
    icon: Ticket,
  },
  {
    tag: 'Free Shipping',
    title: 'Free Shipping',
    desc: 'On orders over Rs. 2,000',
    link: '/product-list',
    linkLabel: 'Shop Now',
    image: null,
    icon: Truck,
  },
];

const CATEGORY_RAIL = [
  { name: 'Electronics', image: '/Assets/Banners/hero_tech_collage.png', slug: 'Electronics' },
  { name: 'Fashion', image: '/Assets/Banners/promo_fashion_man.png', slug: 'Fashion' },
  { name: 'Beauty', image: '/Assets/Banners/promo_audio_blue.png', slug: 'Beauty' },
  { name: 'Home & Kitchen', image: '/Assets/Banners/promo_smart_home.png', slug: 'Home' },
  { name: 'Sports', image: '/Assets/Banners/playstation_banner.png', slug: 'Sports' },
  { name: 'Books', image: '/Assets/Banners/keyboard_banner.png', slug: 'Books' },
  { name: 'Grocery', image: '/Assets/Banners/promo_appliances_teal.png', slug: 'Grocery' },
  { name: 'Accessories', image: '/Assets/Banners/smartwatch_banner.png', slug: 'Accessories' },
];

const CUSTOMER_AVATARS = ['PS', 'RT', 'AG', 'MK'];

const FALLBACK_BRANDS = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Puma', 'Canon', 'boAt', 'Dell', 'LG'];

const FEATURED_BADGES = ['Best Seller', 'New', 'Trending', 'Top Rated', 'Hot Deal', 'Premium'];

const POPULAR_COLLECTIONS = [
  {
    title: 'Gaming Setup',
    desc: 'Level up your play',
    image: '/Assets/Banners/playstation_banner.png',
    link: '/product-list?category=Electronics',
  },
  {
    title: 'Smart Home',
    desc: 'Connected living made easy',
    image: '/Assets/Banners/promo_smart_home.png',
    link: '/product-list?category=Home',
  },
  {
    title: 'Summer Fashion',
    desc: 'Fresh styles for the season',
    image: '/Assets/Banners/promo_fashion_man.png',
    link: '/product-list?category=Fashion',
  },
  {
    title: 'Fitness Gear',
    desc: 'Train smarter every day',
    image: '/Assets/Banners/smartwatch_banner.png',
    link: '/product-list?category=Sports',
  },
  {
    title: 'Work From Home',
    desc: 'Productivity essentials',
    image: '/Assets/Banners/promo_laptop_purple.png',
    link: '/product-list?category=Electronics',
  },
  {
    title: 'Travel Essentials',
    desc: 'Pack light, travel right',
    image: '/Assets/Banners/headphones_banner.png',
    link: '/product-list?category=Accessories',
  },
];

const PROMO_BANNERS = [
  {
    title: 'Up to 70% OFF',
    subtitle: 'On Electronics',
    cta: 'Shop Now',
    link: '/product-list?category=Electronics&onSale=true',
    bg: 'bg-gradient-to-r from-green-50 to-white',
    image: '/Assets/Banners/hero_tech_collage.png',
    isPrimary: true,
  },
  {
    title: 'Bank Offer',
    subtitle: '10% Instant Discount On Credit Cards',
    cta: 'Learn More',
    link: '/promo',
    bg: 'bg-[#e8f4fc]',
    image: '/Assets/Banners/promo_audio_blue.png',
  },
  {
    title: 'Pay Later with',
    subtitle: '0% Interest — Buy Now, Pay Later',
    cta: 'Learn More',
    link: '/promo',
    bg: 'bg-[#fff8e7]',
    image: '/Assets/Banners/promo_laptop_purple.png',
  },
];

const TRUST_FEATURES = [
  { icon: Truck, label: 'Free Delivery', desc: 'On orders over Rs. 2,000' },
  { icon: RotateCcw, label: 'Easy Returns', desc: '30-day return policy' },
  { icon: CreditCard, label: 'Secure Payments', desc: '100% secure checkout' },
  { icon: Headphones, label: '24/7 Support', desc: 'Always here to help' },
  { icon: PackageCheck, label: 'Genuine Products', desc: 'Original & quality items' },
  { icon: Shield, label: 'Buyer Protection', desc: 'Shop with confidence' },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    text: 'Excellent quality and fast delivery. The headphones I ordered exceeded my expectations. Will definitely shop again!',
    avatar: 'PS',
  },
  {
    name: 'Rajesh Thapa',
    text: 'Great prices compared to other stores. Customer support was very helpful when I had a question about my order.',
    avatar: 'RT',
  },
  {
    name: 'Anita Gurung',
    text: 'Love the variety of products available. Everything arrived well-packaged and exactly as described. Highly recommend!',
    avatar: 'AG',
  },
];

function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-sm font-semibold text-[#28a745] hover:text-[#218838] flex items-center gap-1 transition-colors"
        >
          {linkLabel || 'View All'}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function ProductSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-2xl p-4">
          <div className="bg-gray-100 aspect-square rounded-xl mb-3" />
          <div className="h-3 bg-gray-100 rounded w-4/5 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const location = useLocation();

  useLayoutEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#ffffff';
    window.scrollTo(0, 0);
    return () => { document.body.style.backgroundColor = originalBg; };
  }, [location.pathname]);

  const [flashDeals, setFlashDeals] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [categories, setCategories] = useState([]);
  const [flashLoading, setFlashLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [bestSellersLoading, setBestSellersLoading] = useState(true);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [flashTimeLeft, setFlashTimeLeft] = useState(24 * 60 + 35);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlashTimeLeft((prev) => (prev > 0 ? prev - 1 : 24 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      setFlashLoading(true);
      setFeaturedLoading(true);
      setBestSellersLoading(true);
      setNewArrivalsLoading(true);
      setRecLoading(true);
      try {
        const [aggregated, discountRes, featuredRes, bestRes, newRes, recRes, catRes, allRes] = await Promise.all([
          getHomepageAggregated(8).catch(() => ({})),
          getHighestDiscountProducts(6).catch(() => []),
          getFeaturedProducts(6).catch(() => []),
          getBestSellers(0, 6).catch(() => []),
          getNewArrivalProducts(4).catch(() => []),
          getRecommendations(6).catch(() => []),
          getCategories().catch(() => []),
          getProducts({ page: 0, size: 12 }).catch(() => ({ data: { content: [] } })),
        ]);

        const fallback = normalizeProducts(allRes.data?.content || allRes.data || [], 12);

        const fillProducts = (items, count) => {
          let list = normalizeProducts(items, count);
          if (list.length < count) {
            const seen = new Set(list.map((p) => p.productId || p.id));
            for (const p of fallback) {
              const id = p.productId || p.id;
              if (id && !seen.has(id)) {
                list.push(p);
                seen.add(id);
              }
              if (list.length >= count) break;
            }
          }
          return list.slice(0, count);
        };

        setFlashDeals(fillProducts(discountRes, 6));
        setFeaturedProducts(fillProducts(featuredRes, 6));
        setBestSellers(fillProducts(bestRes, 3));
        setNewArrivals(fillProducts(newRes, 4));
        setRecommended(fillProducts(recRes, 6));

        const catList = Array.isArray(catRes) ? catRes : catRes?.data || [];
        setCategories(Array.isArray(catList) ? catList : []);

        if (aggregated?.banners?.length) {
          /* banners available for future hero carousel */
        }
      } catch (err) {
        console.error('Failed to load homepage:', err);
      } finally {
        setFlashLoading(false);
        setFeaturedLoading(false);
        setBestSellersLoading(false);
        setNewArrivalsLoading(false);
        setRecLoading(false);
      }
    };
    load();
  }, []);

  const categoryCounts = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      const name = c.name || c.categoryName;
      if (name) map[name.toLowerCase()] = c.productCount ?? c.itemCount ?? null;
    });
    return map;
  }, [categories]);

  const formatFlashCountdown = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
    toast.success('Subscribed! Check your inbox for exclusive offers.');
  };

  const getCategoryCount = (name) => {
    const count = categoryCounts[name.toLowerCase()];
    if (count != null) return `${Number(count).toLocaleString()} Items`;
    return 'Shop Now';
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-inter">
      <Navbar />

      {/* Hero: sidebar + banner + promo cards */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">

            {/* Left — Category sidebar */}
            <aside className="hidden lg:flex lg:col-span-2 flex-col bg-white border-r border-gray-200 min-h-[520px]">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-bold text-slate-800">Shop by Category</h3>
              </div>
              <nav className="py-1 flex-1">
                {HERO_SIDEBAR_CATS.map(({ name, icon: Icon, slug }) => (
                  <Link
                    key={name}
                    to={`/product-list?category=${encodeURIComponent(slug)}`}
                    className="flex items-center gap-3 px-5 py-2 text-[13px] text-slate-600 hover:bg-green-50 hover:text-[#28a745] transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#28a745] flex-shrink-0" strokeWidth={1.5} />
                    <span className="flex-1 font-medium">{name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#28a745]" />
                  </Link>
                ))}
              </nav>
              <Link
                to="/product-list"
                className="flex items-center gap-2 px-5 py-3.5 border-t border-gray-100 text-[13px] font-semibold text-[#28a745] hover:bg-green-50 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
                View All Categories
              </Link>
            </aside>

            {/* Center — Main hero banner */}
            <div className="lg:col-span-7 p-3 lg:p-4">
              <div className="relative bg-[#f4f6f8] rounded-2xl overflow-hidden min-h-[420px] lg:min-h-[488px] h-full">
                <Leaf className="absolute top-8 right-[32%] w-10 h-10 text-[#28a745]/30 rotate-12 pointer-events-none hidden md:block z-0" />

                <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center px-6 sm:px-10 py-8 lg:py-10 gap-4 relative z-10">
                  {/* Copy */}
                  <div className="text-left order-2 md:order-1">
                    <span className="inline-block bg-white text-[#28a745] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-green-100">
                      Summer Sale
                    </span>
                    <h1 className="text-3xl sm:text-4xl xl:text-[2.65rem] font-extrabold text-slate-900 leading-[1.12] tracking-tight mb-3">
                      Big Savings.{' '}
                      <span className="text-[#28a745]">Bigger Smiles.</span>
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-[15px] leading-relaxed mb-6 max-w-sm">
                      Shop the best products at unbeatable prices. Fast delivery, easy returns and 24/7 support.
                    </p>
                    <div className="flex flex-wrap gap-3 mb-6">
                      <Link
                        to="/product-list"
                        className="inline-flex items-center gap-2 bg-[#28a745] hover:bg-[#218838] text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
                      >
                        Shop Now
                      </Link>
                      <Link
                        to="/product-list?onSale=true"
                        className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-slate-700 font-bold text-sm px-6 py-2.5 rounded-lg border border-gray-300 transition-colors"
                      >
                        Explore Deals
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#28a745] flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-600">Trusted by over 1 Million+ Customers</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      {CUSTOMER_AVATARS.map((initials, i) => (
                        <div
                          key={initials}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ${
                            ['bg-[#28a745] text-white', 'bg-slate-700 text-white', 'bg-amber-500 text-white', 'bg-blue-500 text-white'][i]
                          }`}
                        >
                          {initials}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[#28a745] text-sm font-bold shadow-sm">
                        +
                      </div>
                    </div>
                  </div>

                  {/* Product showcase on pedestals */}
                  <div className="relative flex items-end justify-center min-h-[220px] md:min-h-[320px] order-1 md:order-2">
                    <div className="absolute bottom-6 left-[6%] w-[88px] h-[56px] bg-green-100/80 rounded-t-full shadow-sm" />
                    <div className="absolute bottom-6 left-[36%] w-[72px] h-[48px] bg-white rounded-t-full shadow-md" />
                    <div className="absolute bottom-6 right-[6%] w-[88px] h-[56px] bg-green-100/80 rounded-t-full shadow-sm" />

                    <img
                      src="/Assets/Banners/homepage_hero_headphones.png"
                      alt="Premium headphones"
                      className="absolute bottom-14 left-[4%] w-28 sm:w-32 object-contain drop-shadow-xl z-10"
                    />
                    <img
                      src="/Assets/Banners/smartwatch_banner.png"
                      alt="Smartwatch"
                      className="absolute bottom-16 left-[32%] w-24 sm:w-28 object-contain drop-shadow-xl z-20"
                    />
                    <img
                      src="/Assets/Banners/hero_tech_collage.png"
                      alt="Tech products"
                      className="absolute bottom-12 right-[2%] w-32 sm:w-36 object-contain drop-shadow-xl z-10 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Promo cards stack */}
            <div className="lg:col-span-3 p-3 lg:p-4 lg:pl-0 flex flex-col gap-3">
              {HERO_PROMO_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.tag}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[#f4f6f8] p-4 flex-1 min-h-[148px]"
                  >
                    <div className="text-left flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">{card.tag}</span>
                      <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-0.5">{card.title}</h3>
                      <p className="text-xs text-gray-500 mb-2.5">{card.desc}</p>
                      {card.isButton ? (
                        <Link
                          to={card.link}
                          className="inline-block text-xs font-bold bg-[#28a745] hover:bg-[#218838] text-white px-3.5 py-1.5 rounded-md transition-colors"
                        >
                          {card.linkLabel}
                        </Link>
                      ) : (
                        <Link
                          to={card.link}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#28a745] hover:text-[#218838] transition-colors"
                        >
                          {card.linkLabel} <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                    <div className="w-[72px] h-[72px] flex items-center justify-center flex-shrink-0">
                      {card.image ? (
                        <img src={card.image} alt="" className="w-full h-full object-contain drop-shadow-md" />
                      ) : Icon ? (
                        <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          <Icon className="w-8 h-8 text-[#28a745]" strokeWidth={1.5} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Mobile category strip */}
        <div className="lg:hidden border-t border-gray-200 bg-white overflow-x-auto no-scrollbar">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {HERO_SIDEBAR_CATS.slice(0, 8).map(({ name, icon: Icon, slug }) => (
              <Link
                key={name}
                to={`/product-list?category=${encodeURIComponent(slug)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-green-50 hover:border-green-200 hover:text-[#28a745] whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {name.split(' ')[0]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SectionHeader title="Shop by Category" linkTo="/product-list" linkLabel="View All Categories" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {CATEGORY_RAIL.map((cat) => (
            <Link
              key={cat.name}
              to={`/product-list?category=${encodeURIComponent(cat.slug)}`}
              className="group bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-md hover:border-green-200 transition-all"
            >
              <div className="h-24 sm:h-28 flex items-center justify-center mb-3 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#28a745] transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">{getCategoryCount(cat.name)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Collections */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <SectionHeader title="Popular Collections" linkTo="/product-list" linkLabel="View All Collections" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {POPULAR_COLLECTIONS.map((col) => (
            <Link
              key={col.title}
              to={col.link}
              className="group relative rounded-xl overflow-hidden aspect-[4/5] sm:aspect-[3/4]"
            >
              <img
                src={col.image}
                alt={col.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-bold text-sm sm:text-base leading-tight">{col.title}</h3>
                <p className="text-[11px] text-white/80 mt-1">{col.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Deals */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Flash Deals</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 font-medium">Ends in:</span>
              <span className="font-mono font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-md tabular-nums">
                {formatFlashCountdown(flashTimeLeft)}
              </span>
            </div>
          </div>
          <Link
            to="/product-list?onSale=true"
            className="text-sm font-semibold text-[#28a745] hover:text-[#218838] flex items-center gap-1"
          >
            View All Deals
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {flashLoading ? (
          <ProductSkeletonGrid count={6} />
        ) : flashDeals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {flashDeals.map((p) => (
              <ProductCard key={p.productId || p.id} product={p} variant="flash" />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">No flash deals available right now.</p>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <SectionHeader title="Featured Products" linkTo="/product-list" linkLabel="View All Products" />
        {featuredLoading ? (
          <ProductSkeletonGrid count={6} />
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featuredProducts.map((p, i) => (
              <ProductCard
                key={p.productId || p.id}
                product={p}
                variant="featured"
                badge={FEATURED_BADGES[i % FEATURED_BADGES.length]}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">No featured products available right now.</p>
        )}
      </section>

      {/* Promotional Banners */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {PROMO_BANNERS.map((banner, index) => (
            <Link
              key={banner.title}
              to={banner.link}
              className={`relative rounded-2xl overflow-hidden border border-gray-100 p-6 flex items-center min-h-[180px] ${banner.bg} ${
                index === 0 ? 'md:col-span-6' : 'md:col-span-3'
              } group hover:shadow-md transition-shadow`}
            >
              <div className="relative z-10 max-w-[55%]">
                <h3 className={`font-extrabold text-slate-900 leading-tight ${banner.isPrimary ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>
                  {banner.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1 mb-4">{banner.subtitle}</p>
                {banner.isPrimary ? (
                  <span className="inline-flex items-center gap-1 bg-[#28a745] hover:bg-[#218838] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                    {banner.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#28a745] text-xs font-bold group-hover:gap-2 transition-all">
                    {banner.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <img
                src={banner.image}
                alt=""
                className="absolute right-2 bottom-0 h-[85%] max-w-[45%] object-contain object-bottom drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers & New Arrivals */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <SectionHeader title="Best Sellers" linkTo="/product-list" linkLabel="View All" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                {bestSellersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : bestSellers.length > 0 ? (
                  bestSellers.map((p, i) => {
                    const { price } = getProductPrice(p);
                    return (
                      <Link
                        key={p.productId || p.id}
                        to={getProductLink(p)}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-sm transition-all group"
                      >
                        <span className="w-8 h-8 rounded-full bg-[#28a745] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <img
                          src={getProductImage(p)}
                          alt={p.name}
                          className="w-14 h-14 object-contain rounded-lg bg-gray-50 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#28a745] transition-colors">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star key={si} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">Rs.&nbsp;{price.toLocaleString()}</p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400 py-4">No best sellers yet.</p>
                )}
              </div>
              <Link
                to="/product-list?category=Electronics"
                className="hidden sm:block relative rounded-2xl overflow-hidden bg-[#f4f6f8] border border-gray-100 group"
              >
                <img
                  src="/Assets/Banners/playstation_banner.png"
                  alt="Featured bestseller"
                  className="w-full h-full min-h-[220px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <SectionHeader title="New Arrivals" linkTo="/product-list" linkLabel="View All" />
            {newArrivalsLoading ? (
              <ProductSkeletonGrid count={4} />
            ) : newArrivals.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {newArrivals.map((p) => (
                  <ProductCard key={p.productId || p.id} product={p} isSmall variant="featured" badge="New" />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">No new arrivals yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Shop by Brand */}
      <section className="bg-[#f8f9fa] py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Shop by Brand" linkTo="/product-list" linkLabel="View All Brands" />
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {FALLBACK_BRANDS.map((brand) => (
              <Link
                key={brand}
                to={`/product-list?q=${encodeURIComponent(brand)}`}
                className="text-lg sm:text-xl font-black text-gray-400 hover:text-gray-600 transition-colors grayscale hover:grayscale-0 tracking-tight"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SectionHeader title="Recommended for You" linkTo="/product-list" />
        {recLoading ? (
          <ProductSkeletonGrid count={6} />
        ) : recommended.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommended.map((p) => (
              <ProductCard key={p.productId || p.id} product={p} variant="recommended" />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">No recommendations yet. Browse our catalog!</p>
        )}
      </section>

      {/* Testimonials */}
      <section className="bg-[#f8f9fa] py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="What Our Customers Say" linkTo="/product-list" linkLabel="View All Reviews" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-[#28a745] font-bold text-sm flex items-center justify-center">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{t.name}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#28a745] bg-green-50 px-2 py-0.5 rounded-full mt-0.5">
                      <BadgeCheck className="w-3 h-3" />
                      Verified Buyer
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#28a745] py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 text-white text-left">
              <div className="w-12 h-12 rounded-full bg-[#218838] flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Stay Updated with Exclusive Offers</h3>
                <p className="text-green-100 text-sm max-w-md">
                  Subscribe to our newsletter and get Rs. 250 off on your first order.
                </p>
              </div>
            </div>

            {subscribed ? (
              <div className="bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg text-sm font-semibold">
                ✓ You&apos;re subscribed! Welcome aboard.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full max-w-md gap-0">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-l-lg text-sm text-slate-800 outline-none border-0 min-w-0"
                />
                <button
                  type="submit"
                  className="bg-[#218838] hover:bg-[#1e7e34] text-white font-bold text-sm px-6 py-3 rounded-r-lg transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Trust / Features Bar */}
      <section className="border-t border-gray-200 bg-[#f8f9fa]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-3">
            {TRUST_FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 justify-start">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#28a745]" strokeWidth={1.5} />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-sm text-slate-800 leading-tight">{label}</p>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
