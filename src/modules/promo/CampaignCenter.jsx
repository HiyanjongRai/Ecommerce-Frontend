import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Clock, ArrowLeft, Percent, Calendar, Sparkles,
  ChevronRight, Info, ShoppingBag, Tag, Users, Folder, Bell,
  ArrowRight, ShieldCheck, CheckCircle, RefreshCw, Filter, SlidersHorizontal,
  Flame, ChevronDown
} from 'lucide-react';
import ProductCard from '../product/components/ProductCard';
import apiClient, { BASE_URL } from '../../shared/api/apiClient';

// ─── Helpers ────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

// Dynamic countdown hook
function useCountdown(dateString) {
  const calc = useCallback(() => {
    if (!dateString) return { days: 0, hrs: 0, min: 0, sec: 0, ms: 0 };
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hrs: 0, min: 0, sec: 0, ms: 0 };
    return {
      days: Math.floor(diff / 864e5),
      hrs: Math.floor((diff % 864e5) / 36e5),
      min: Math.floor((diff % 36e5) / 6e4),
      sec: Math.floor((diff % 6e4) / 1e3),
      ms: diff,
    };
  }, [dateString]);

  const [t, setT] = useState(calc);
  useEffect(() => {
    if (!dateString) return;
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [dateString, calc]);
  return t;
}

// Convert backend API campaigns to consistent client-side layout
function normaliseCampaign(raw, idx) {
  const now = Date.now();
  const start = raw.startTime || raw.startDate ? new Date(raw.startTime || raw.startDate).getTime() : null;
  const end   = raw.endTime   || raw.endDate   ? new Date(raw.endTime   || raw.endDate).getTime()   : null;

  let status = String(raw.status || 'active').toLowerCase();
  if (start && end) {
    if (now < start) status = 'upcoming';
    else if (now > end) status = 'ended';
    else status = 'active';
  }

  let heroImage = raw.imagePath || raw.heroImage || raw.bannerImage || raw.banner || null;
  if (heroImage && !heroImage.startsWith('http') && !heroImage.startsWith('/')) {
    const fileName = heroImage.startsWith('campaigns/') ? heroImage.substring(10) : heroImage;
    heroImage = `${BASE_URL}/api/campaigns/image/${fileName}`;
  }

  return {
    id: raw.id,
    title: raw.name || raw.campaignName || raw.title || 'Campaign Deal',
    description: raw.description || '',
    type: (raw.type || 'SEASONAL').replace(/_/g, ' '),
    heroImage,
    status,
    startDate: raw.startTime || raw.startDate || null,
    endDate: raw.endTime || raw.endDate || null,
    discountType: raw.discountType || 'PERCENTAGE',
    discountValue: Number(raw.discountValue ?? 0),
    maxProducts: raw.maxProducts ?? null,
    priority: raw.priority ?? 0,
    totalProducts: raw.totalProducts ?? 0,
    isMock: false
  };
}

function normaliseCampaignProduct(raw) {
  return {
    id: raw.productId || raw.id,
    name: raw.productName || 'Product',
    price: Number(raw.originalPrice ?? 0),
    salePrice: Number(raw.salePrice ?? 0),
    finalPrice: Number(raw.salePrice ?? raw.originalPrice ?? 0),
    originalPrice: Number(raw.originalPrice ?? 0),
    onSale: true,
    salePercentage: raw.originalPrice > 0 && raw.salePrice > 0
      ? Math.round(((Number(raw.originalPrice) - Number(raw.salePrice)) / Number(raw.originalPrice)) * 100)
      : 0,
    imagePath: raw.productImage,
    thumbnail: raw.productImage,
    brand: raw.storeName || raw.sellerName || 'Marketplace',
    category: 'Campaign Deal',
    stockQuantity: raw.stockLimit ?? 10,
    rating: 0,
    totalReviews: 0,
  };
}

// ─── Countdown Display ───────────────────────────────────────────────────────
function Countdown({ dateString, status }) {
  const t = useCountdown(dateString);
  if (!dateString) return null;
  if (t.ms <= 0) return (
    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ended</span>
  );

  return (
    <div className="flex items-center gap-1.5">
      {[{ v: t.days, u: 'DAYS' }, { v: t.hrs, u: 'HRS' }, { v: t.min, u: 'MINS' }, { v: t.sec, u: 'SECS' }].map(({ v, u }) => (
        <div key={u} className="flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EEFCF2] text-[#16A34A] text-base font-bold shadow-xs">
            {pad(v)}
          </div>
          <span className="mt-1 text-[8px] font-bold text-slate-500 uppercase tracking-wide">{u}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeletons ───────────────────────────────────────────────────────────────
const RowSkeleton = () => (
  <div className="flex flex-col md:flex-row items-stretch rounded-2xl border border-slate-100 bg-white p-4 gap-6 animate-pulse">
    <div className="h-40 w-full md:w-[260px] bg-slate-100 rounded-xl" />
    <div className="flex-1 flex flex-col justify-between py-1 gap-3">
      <div>
        <div className="h-6 w-32 bg-slate-100 rounded-lg mb-2" />
        <div className="h-5 w-3/4 bg-slate-100 rounded-lg mb-1" />
        <div className="h-3 w-full bg-slate-100 rounded-lg" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 w-20 bg-slate-100 rounded-md" />
        <div className="h-4 w-20 bg-slate-100 rounded-md" />
      </div>
    </div>
    <div className="md:border-l border-slate-100 md:pl-6 w-full md:w-[200px] flex flex-col justify-between py-1 gap-3">
      <div className="h-12 bg-slate-100 rounded-lg" />
      <div className="h-10 bg-slate-100 rounded-lg" />
    </div>
  </div>
);

// ─── Campaign Card Row (Screenshot Style) ──────────────────────────────────
function CampaignCardRow({ campaign, onOpen }) {
  const isLive = campaign.status === 'active';
  const isUpcoming = campaign.status === 'upcoming';
  const isExpired = campaign.status === 'ended';
  const countDate = isUpcoming ? campaign.startDate : campaign.endDate;

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (!isExpired) {
      onOpen(campaign);
    }
  };

  return (
    <div
      onClick={() => !isExpired && onOpen(campaign)}
      className={`group flex flex-col md:flex-row items-stretch rounded-2xl border border-gray-200/90 bg-white p-4 gap-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 ${
        isExpired ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] cursor-pointer'
      }`}
    >
      {/* Left Column: Banner Image */}
      <div className="relative h-44 w-full md:w-[260px] rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-gray-100">
        {campaign.heroImage ? (
          <img
            src={campaign.heroImage}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/Assets/Banners/smartwatch_banner.png'; // default fallback banner
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-800 to-emerald-950">
            <Sparkles className="h-10 w-10 text-emerald-400/30" />
            <span className="absolute text-xs text-white/50 font-bold uppercase tracking-wider">{campaign.title}</span>
          </div>
        )}

        {/* Expired overlay */}
        {isExpired && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Expired
            </span>
          </div>
        )}
      </div>

      {/* Middle Column: Details */}
      <div className="flex-1 flex flex-col justify-between py-1 gap-2 min-w-0">
        <div>
          {/* Badge */}
          {isLive && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-[#EEFCF2] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#16A34A] mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Live Now
            </div>
          )}
          {isUpcoming && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-[#FFFBEB] border border-[#FCD34D] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#D97706] mb-2.5">
              Upcoming
            </div>
          )}
          {isExpired && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2.5">
              Ended
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-[#16A34A] transition-colors">
            {campaign.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1.5 max-w-2xl">
            {campaign.description || 'Start the year with amazing deals across all categories. Shop more, save more!'}
          </p>
        </div>

        {/* Benefits bar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-[11px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-slate-400" />
            <span>Up to {campaign.discountValue}% Off</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Folder className="h-4 w-4 text-slate-400" />
            <span>All Categories</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400" />
            <span>All Users</span>
          </div>
        </div>
      </div>

      {/* Right Column: Countdown + Button */}
      <div className="md:border-l border-gray-100 md:pl-6 w-full md:w-[200px] flex flex-col justify-between py-1 gap-4 shrink-0">
        {countDate && !isExpired ? (
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-2">
              <Clock className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>{isUpcoming ? 'Starts in' : 'Ends in'}</span>
            </div>
            <Countdown dateString={countDate} status={campaign.status} />
          </div>
        ) : (
          <div className="text-[11px] font-bold text-slate-400">
            {isExpired ? 'Campaign has ended' : 'Special promo period'}
          </div>
        )}

        <div className="mt-auto">
          {isLive && (
            <button
              onClick={handleActionClick}
              className="w-full bg-[#043B23] hover:bg-[#032e1b] text-white text-xs font-black py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 tracking-wider transition-all"
            >
              Shop Now <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {isUpcoming && (
            <button
              onClick={handleActionClick}
              className="w-full border border-[#16A34A] hover:bg-[#EEFCF2] text-[#16A34A] text-xs font-black py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 tracking-wider transition-all"
            >
              Notify Me <Bell className="h-3.5 w-3.5" />
            </button>
          )}
          {isExpired && (
            <button
              disabled
              className="w-full bg-slate-100 text-slate-400 text-xs font-black py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Expired
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail View Component ──────────────────────────────────────────────────
function DetailView({ campaign, products, loadingProducts, onBack }) {
  const [orderAmount, setOrderAmount] = useState(1500);
  const isPercent = campaign.discountType === 'PERCENTAGE';
  const discLabel = isPercent ? `${campaign.discountValue}% OFF` : `Rs. ${campaign.discountValue.toLocaleString()} OFF`;
  const savings = isPercent ? Math.round(orderAmount * campaign.discountValue / 100) : Math.min(campaign.discountValue, orderAmount);
  const finalAmt = Math.max(0, orderAmount - savings);

  const shopSteps = [
    { num: '01', title: 'Browse Campaign Products', desc: 'Explore items curated exclusively for this event.' },
    { num: '02', title: 'Campaign Price Applied', desc: 'Sale prices are already pre-applied on eligible items.' },
    { num: '03', title: 'Add & Save Instantly', desc: 'Add to cart and enjoy the discount automatically at checkout.' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#043B23] to-[#0A2616] py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(22,163,74,0.15),transparent_50%)] pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Campaigns
          </button>

          <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white ${
                  campaign.status === 'active' ? 'bg-[#16A34A]' : campaign.status === 'upcoming' ? 'bg-amber-500' : 'bg-slate-500'}`}>
                  {campaign.status === 'active' ? '🟢 Live' : '⏳ Upcoming'}
                </span>
                <span className="rounded-full border border-white/20 bg-white/5 backdrop-blur px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/95">
                  {campaign.type}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
                {campaign.title}
              </h1>
              {campaign.description && (
                <p className="text-sm text-emerald-100/80 font-medium leading-relaxed max-w-xl mb-6">
                  {campaign.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-[#043B23] shadow-xl">
                  <span className="text-2xl font-black">{discLabel}</span>
                </div>
              </div>
            </div>

            {campaign.heroImage && (
              <div className="hidden lg:block relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] border border-white/10">
                <img src={campaign.heroImage} alt={campaign.title} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* How to Shop */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">How to Shop This Campaign</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {shopSteps.map((step) => (
                  <div key={step.num} className="relative">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-[#EEFCF2] text-xs font-black text-[#16A34A]">
                      {step.num}
                    </div>
                    <h4 className="text-xs font-black text-slate-800 mb-1">{step.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Products */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <ShoppingBag className="h-4 w-4 text-[#16A34A]" />
                <h3 className="text-sm font-black text-slate-900">Campaign Products</h3>
                {products.length > 0 && (
                  <span className="ml-auto rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-black text-slate-600">
                    {products.length} items
                  </span>
                )}
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 h-64 animate-pulse">
                      <div className="aspect-square bg-slate-100 rounded-xl mb-3" />
                      <div className="h-3 bg-slate-100 rounded-full w-3/4 mb-2" />
                      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                    <ShoppingBag className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="font-black text-slate-700">No Products Yet</p>
                  <p className="text-xs text-slate-400 font-medium max-w-xs">
                    Sellers haven't added products to this campaign yet. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} isSmall variant="default" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-slate-400" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Campaign Details</h4>
              </div>
              <div className="space-y-3">
                {[
                  ['Type', campaign.type],
                  ['Discount', discLabel],
                  ['Starts', campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                  ['Ends', campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                  campaign.maxProducts && ['Max Products', `${campaign.maxProducts} items`],
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-[11px] font-bold text-slate-400">{label}</span>
                    <span className="text-[11px] font-black text-slate-800">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Calculator */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="h-4 w-4 text-slate-400" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Savings Calculator</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mb-4 leading-relaxed">
                Estimate your savings with this campaign.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[10px] text-slate-500 font-bold">Order Subtotal</span>
                    <span className="text-sm font-black text-slate-800">Rs. {orderAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={15000}
                    step={100}
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(Number(e.target.value))}
                    className="w-full cursor-pointer h-1.5 rounded-full outline-none"
                    style={{ accentColor: '#16A34A' }}
                  />
                </div>
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">Savings</span>
                    <span className="font-black text-[#16A34A]">– Rs. {savings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-3">
                    <span className="text-xs font-black text-slate-700">You Pay</span>
                    <span className="text-lg font-black text-[#16A34A]">Rs. {finalAmt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Campaign Page ──────────────────────────────────────────────────────
export default function CampaignCenter() {
  const [view, setView] = useState('listing');
  const [selected, setSelected] = useState(null);
  const [products, setProducts] = useState([]);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Campaigns');
  const [sortBy, setSortBy] = useState('Newest');

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/campaigns');
      const raw = Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data
        : res.data?.content ?? [];
      setCampaigns(raw.map((c, i) => normaliseCampaign(c, i)));
    } catch (e) {
      console.error(e);
      setError('Could not load campaigns. Please check your connection.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async (campaign) => {
    setLoadingProducts(true);
    try {
      const res = await apiClient.get(`/campaigns/${campaign.id}/products`);
      const raw = Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data
        : res.data?.content ?? [];
      setProducts(raw.map(normaliseCampaignProduct));
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleOpen = (campaign) => {
    setSelected(campaign);
    setView('detail');
    setProducts([]);
    loadProducts(campaign);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelected(null);
    setProducts([]);
    setView('listing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = useMemo(() => {
    let list = [...campaigns];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    if (statusFilter === 'Upcoming') {
      list = list.filter((c) => c.status === 'upcoming');
    } else if (statusFilter === 'Live Now') {
      list = list.filter((c) => c.status === 'active');
    } else if (statusFilter === 'Expired') {
      list = list.filter((c) => c.status === 'ended');
    }

    // Sort order
    if (sortBy === 'Ending Soon') {
      list.sort((a, b) => new Date(a.endDate || 0) - new Date(b.endDate || 0));
    } else if (sortBy === 'Highest Discount') {
      list.sort((a, b) => b.discountValue - a.discountValue);
    } else {
      // Default / Newest / Most Relevant
      list.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
    }
    return list;
  }, [campaigns, search, statusFilter, sortBy]);

  if (view === 'detail' && selected) {
    return <DetailView campaign={selected} products={products} loadingProducts={loadingProducts} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-10">
      {/* ── Hero Header (Forest Green) ── */}
      <div className="relative overflow-hidden bg-[#043B23]">
        {/* Background Sparkles & Fireworks effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,rgba(22,163,74,0.2),transparent_40%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_65%,rgba(22,163,74,0.1),transparent_50%)] pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Campaigns</h1>
            <p className="mt-2 text-sm text-emerald-100/90 font-medium">
              Explore exciting sale campaigns and grab the best deals on your favorite products.
            </p>

            {/* Sub-header Badges/Features */}
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-6 text-white/90">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                  <Percent className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-none">Best Deals</h4>
                  <p className="text-[10px] text-emerald-200/70 mt-1">Unbeatable offers</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-none">Limited Time</h4>
                  <p className="text-[10px] text-emerald-200/70 mt-1">Hurry up & save more</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-none">Trusted & Safe</h4>
                  <p className="text-[10px] text-emerald-200/70 mt-1">100% secure shopping</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side decoration image from public assets */}
          <div className="relative shrink-0 w-44 md:w-56 aspect-square hidden sm:block pointer-events-none">
            <img
              src="/Assets/Banners/campaign_hero_decoration.png"
              alt="Campaign gift box illustration"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Filter Navigation Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-200 bg-white p-4 rounded-xl shadow-xs mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { name: 'All Campaigns', icon: CheckCircle },
              { name: 'Upcoming', icon: Calendar },
              { name: 'Live Now', icon: Sparkles },
              { name: 'Expired', icon: Clock },
            ].map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setStatusFilter(name)}
                className={`flex items-center gap-2 border rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  statusFilter === name
                    ? 'border-[#16A34A] text-[#16A34A] bg-[#EEFCF2]'
                    : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {name}
              </button>
            ))}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 bg-white relative shrink-0">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold text-gray-700 bg-transparent outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="Newest">Most Relevant</option>
              <option value="Highest Discount">Highest Discount</option>
              <option value="Ending Soon">Ending Soon</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 pointer-events-none" />
          </div>
        </div>

        {/* ── Campaigns Feed ── */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
            <p className="text-sm font-bold text-red-600">{error}</p>
            <button
              type="button"
              onClick={loadCampaigns}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-red-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#16A34A]">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="font-black text-slate-800">No campaigns found</p>
            <p className="text-xs text-slate-500 font-medium">
              Try selection of other categories or checking back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((c) => (
              <CampaignCardRow key={c.id} campaign={c} onOpen={handleOpen} />
            ))}
          </div>
        )}

        {/* ── Bottom Badges strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 border-t border-gray-200/60 pt-8">
          {[
            { title: 'Best Offers', desc: 'Handpicked deals just for you', icon: Tag },
            { title: 'Exciting Rewards', desc: 'Shop more, earn more rewards', icon: ShoppingBag },
            { title: 'Limited Time', desc: 'Hurry up! Offers won\'t last forever', icon: Clock },
            { title: 'Secure Shopping', desc: '100% safe & trusted experience', icon: ShieldCheck },
          ].map(({ title, desc, icon: Icon }) => (
            <div key={title} className="flex gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">{title}</h4>
                <p className="text-[10px] text-gray-500 leading-snug mt-1 font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
