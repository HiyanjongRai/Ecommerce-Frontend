import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Tag,
  ShoppingCart,
  ArrowRight,
  Users,
  Percent,
  Clock,
  Shield,
  Sparkles,
  RefreshCw,
  Gift,
  SlidersHorizontal,
  Info,
  Truck,
  Star,
  Zap,
} from 'lucide-react';
import Footer from '../../shared/components/Footer/Footer';
import apiClient from '../../shared/api/apiClient';

// ─── Helpers ───────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

function useCountdown(endDate) {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0, expired: false });

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
      if (diff === 0) {
        setTime({ days: 0, hours: 0, mins: 0, secs: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / 864e5);
      const hours = Math.floor((diff % 864e5) / 36e5);
      const mins = Math.floor((diff % 36e5) / 6e4);
      const secs = Math.floor((diff % 6e4) / 1e3);
      setTime({ days, hours, mins, secs, expired: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return time;
}

function normalise(raw, idx) {
  const now = Date.now();
  const start = raw.startDate ? new Date(raw.startDate).getTime() : null;
  const end = raw.endDate ? new Date(raw.endDate).getTime() : null;

  let status = 'active';
  if (end && now > end) status = 'expired';
  else if (start && now < start) status = 'upcoming';

  const isPercentage = raw.discountType === 'PERCENTAGE';
  const discountLabel = isPercentage
    ? `${Number(raw.discountValue)}% OFF`
    : `Rs. ${Number(raw.discountValue)} OFF`;

  const title = raw.title || (isPercentage
    ? `Get ${Number(raw.discountValue)}% Off on Your Order`
    : `Flat Rs. ${Number(raw.discountValue)} Off on Your Order`);

  const description = raw.description ||
    `Use this code to get ${discountLabel.toLowerCase()} on your entire purchase.`;

  const typeTag = raw.scope === 'GLOBAL' ? 'All Users'
    : raw.scope === 'NEW_USER' ? 'New Users Only'
    : raw.scope === 'SELLER_ONLY' ? 'Seller Store'
    : 'All Users';

  const category = raw.category || (isPercentage ? `${Number(raw.discountValue)}% OFF` : 'FLAT OFF');

  return {
    id: raw.id ?? idx,
    code: String(raw.code || '').toUpperCase(),
    title,
    description,
    discountLabel,
    discountValue: Number(raw.discountValue ?? 0),
    discountType: raw.discountType,
    isPercentage,
    minOrder: Number(raw.minOrderValue ?? raw.minPurchaseAmount ?? 0),
    usageLimit: Number(raw.usageLimit ?? raw.perUserUsageLimit ?? 0),
    usedCount: Number(raw.usedCount ?? 0),
    endDate: raw.endDate || raw.expiryDate || null,
    scope: raw.scope || 'GLOBAL',
    typeTag,
    category,
    status,
    homepageFeatured: !!raw.homepageFeatured,
    isActive: raw.isActive !== false && raw.activeStatus !== false,
    colorIdx: idx % 8,
  };
}

const BADGE_COLORS = [
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'bg-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500', label: 'bg-violet-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', label: 'bg-rose-500' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'bg-blue-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'bg-amber-500' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500', label: 'bg-teal-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500', label: 'bg-orange-500' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', dot: 'bg-pink-500', label: 'bg-pink-500' },
];

// ─── Countdown Block ──────────────────────────────────────────────────────
const CountdownBlock = ({ endDate }) => {
  const { days, hours, mins, secs, expired } = useCountdown(endDate);
  if (!endDate) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-wide">
        <Clock className="h-3 w-3" />
        <span>{expired ? 'Expired' : 'Expires in'}</span>
      </div>
      <div className="flex items-center gap-1">
        {[
          { val: days, unit: 'DAYS' },
          { val: hours, unit: 'HRS' },
          { val: mins, unit: 'MINS' },
          { val: secs, unit: 'SECS' },
        ].map(({ val, unit }) => (
          <div key={unit} className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D3D2A] text-white text-sm font-black leading-none">
              {pad(val)}
            </div>
            <span className="mt-0.5 text-[7px] font-black uppercase tracking-wide text-slate-400">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Promo Code Card ──────────────────────────────────────────────────────
const PromoCard = ({ promo }) => {
  const [copied, setCopied] = useState(false);
  const color = BADGE_COLORS[promo.colorIdx];

  const copy = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(promo.code);
      toast.success(`Code "${promo.code}" copied!`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(promo.code);
    }
  }, [promo.code]);

  const isExpired = promo.status === 'expired';
  const isUpcoming = promo.status === 'upcoming';

  return (
    <div className={`group relative flex flex-col sm:flex-row items-stretch gap-0 rounded-2xl border bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 overflow-hidden ${isExpired ? 'opacity-60' : ''}`}>

      {/* Left: Code Block */}
      <div className={`flex flex-col items-center justify-center min-w-[130px] sm:w-[130px] px-4 py-5 ${color.bg} border-r ${color.border} border-dashed relative`}>
        {/* Discount badge */}
        <div className={`mb-2 rounded-full ${color.label} px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white`}>
          {promo.discountLabel}
        </div>

        {/* The code */}
        <span className={`font-black text-lg tracking-wider uppercase ${color.text}`}>
          {promo.code}
        </span>

        {/* Copy btn */}
        <button
          type="button"
          onClick={copy}
          className={`mt-2 inline-flex items-center gap-1 rounded-md border ${color.border} bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${color.text} transition-all hover:bg-white active:scale-95`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>

        {/* Notch circles */}
        <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#F9FAFB] border border-slate-200 z-10" />
      </div>

      {/* Middle: Info */}
      <div className="flex flex-1 flex-col justify-center px-5 py-4 gap-2 min-w-0">
        {/* Title + scope badge */}
        <div className="flex flex-wrap items-center gap-2">
          {promo.homepageFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
              <Sparkles className="h-2.5 w-2.5" /> Featured
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-600">
              Expired
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-700">
              <Clock className="h-2.5 w-2.5" /> Upcoming
            </span>
          )}
        </div>
        <h3 className="text-sm font-black text-slate-900 leading-tight">{promo.title}</h3>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">{promo.description}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500 mt-0.5">
          {promo.minOrder > 0 && (
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3 text-slate-400" />
              Min. order Rs. {promo.minOrder.toLocaleString()}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-slate-400" />
            {promo.typeTag}
          </span>
        </div>
      </div>

      {/* Right: Countdown + actions */}
      <div className="flex flex-col items-end justify-between gap-3 border-l border-slate-100 px-5 py-4 sm:min-w-[220px]">
        <CountdownBlock endDate={promo.endDate} />

        {/* Verified */}
        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-2.5 w-2.5" />
          </div>
          Verified
        </div>

        {/* View Details */}
        <Link
          to={`/promo?code=${promo.code}`}
          className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider hover:gap-2 transition-all"
        >
          View Details <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

// ─── Skeleton Card ────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex gap-0 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden animate-pulse">
    <div className="w-[130px] bg-slate-100" />
    <div className="flex-1 px-5 py-4 space-y-2">
      <div className="h-3 w-1/4 bg-slate-100 rounded-full" />
      <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
      <div className="h-3 w-full bg-slate-100 rounded-full" />
      <div className="h-3 w-3/4 bg-slate-100 rounded-full" />
    </div>
    <div className="w-[200px] border-l border-slate-100 px-5 py-4 space-y-3">
      <div className="h-8 bg-slate-100 rounded-xl" />
      <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
    </div>
  </div>
);

// ─── How To Use Section ──────────────────────────────────────────────────
const HowToUse = () => {
  const steps = [
    { icon: ShoppingCart, label: 'Add items to your cart' },
    { icon: Tag, label: 'Go to checkout' },
    { icon: Copy, label: 'Enter the promo code' },
    { icon: Check, label: 'Click Apply' },
    { icon: Sparkles, label: 'Enjoy your discount!' },
  ];
  return (
    <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-black text-slate-900">How to Use a Promo Code</h3>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map(({ icon: Icon, label }, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2 rounded-xl bg-white border border-blue-100 px-3 py-2 shadow-xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <Icon className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 hidden sm:block" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── Trust Badges ────────────────────────────────────────────────────────
const TrustBadges = () => {
  const badges = [
    { icon: Shield, label: '100% Verified Codes', desc: 'All codes are tested & verified' },
    { icon: Star, label: 'Best Offers Daily', desc: 'We add new offers every day' },
    { icon: Zap, label: 'Save More Money', desc: 'Exclusive deals for you' },
    { icon: Truck, label: 'Easy to Use', desc: 'Just copy, apply & save' },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map(({ icon: Icon, label, desc }) => (
        <div key={label} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <Icon className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-800">{label}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────
export default function PromoCodesPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [showCategoryDrop, setShowCategoryDrop] = useState(false);
  const [showSortDrop, setShowSortDrop] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/promos/active');
      const raw = Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data
        : [];
      setPromos(raw.map(normalise));
    } catch (err) {
      console.error(err);
      setError('Failed to load promo codes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derive filter categories
  const categories = useMemo(() => {
    const cats = new Set(promos.map((p) => p.category));
    return ['All Categories', ...Array.from(cats)];
  }, [promos]);

  const sortOptions = ['Most Relevant', 'Highest Discount', 'Expiring Soon', 'Newest First'];

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...promos];

    // search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.code.toLowerCase().includes(q)
          || p.title.toLowerCase().includes(q)
          || p.description.toLowerCase().includes(q)
      );
    }

    // category
    if (categoryFilter !== 'All Categories') {
      list = list.filter((p) => p.category === categoryFilter);
    }

    // sort
    if (sortBy === 'Highest Discount') {
      list.sort((a, b) => b.discountValue - a.discountValue);
    } else if (sortBy === 'Expiring Soon') {
      list.sort((a, b) => {
        const ta = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        const tb = b.endDate ? new Date(b.endDate).getTime() : Infinity;
        return ta - tb;
      });
    } else if (sortBy === 'Newest First') {
      list.sort((a, b) => b.id - a.id);
    } else {
      // Most Relevant: featured first, then active, then by discount
      list.sort((a, b) => {
        if (b.homepageFeatured !== a.homepageFeatured) return b.homepageFeatured ? 1 : -1;
        if (a.status !== b.status) {
          const order = { active: 0, upcoming: 1, expired: 2 };
          return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        }
        return b.discountValue - a.discountValue;
      });
    }

    return list;
  }, [promos, search, categoryFilter, sortBy]);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = () => { setShowCategoryDrop(false); setShowSortDrop(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A2616] via-[#0D3D2A] to-[#155235]">
        {/* Decorative */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(16,185,129,0.06),transparent_40%)] pointer-events-none" />

        {/* Floating ticket icon */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-white/10 backdrop-blur border border-white/15 shadow-2xl rotate-12">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent" />
            <Percent className="h-14 w-14 text-emerald-300 drop-shadow-lg" />
            <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-white text-xs font-black shadow-lg">
              %
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-2">Jhapcham Exclusive</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Promo Codes
          </h1>
          <p className="mt-3 text-sm text-emerald-100/80 font-medium max-w-sm">
            Unlock exclusive discounts and save more on your favorite products.
          </p>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-5">
            {[
              { icon: Gift, value: `${promos.filter(p => p.status === 'active').length}`, label: 'Active Codes' },
              { icon: Shield, value: '100%', label: 'Verified' },
              { icon: Zap, value: 'Daily', label: 'New Deals' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 px-4 py-2.5">
                <Icon className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-black text-white leading-none">{value}</p>
                  <p className="text-[10px] text-emerald-300/80 font-bold mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search promo codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 shadow-xs outline-none placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
            />
          </div>

          {/* Category dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => { setShowCategoryDrop((v) => !v); setShowSortDrop(false); }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs hover:border-emerald-300 transition min-w-[160px] justify-between"
            >
              <span>{categoryFilter}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showCategoryDrop ? 'rotate-180' : ''}`} />
            </button>
            {showCategoryDrop && (
              <div className="absolute top-full left-0 mt-1 z-50 w-48 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategoryFilter(cat); setShowCategoryDrop(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-bold transition ${categoryFilter === cat ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => { setShowSortDrop((v) => !v); setShowCategoryDrop(false); }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs hover:border-emerald-300 transition min-w-[170px] justify-between"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                {sortBy}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showSortDrop ? 'rotate-180' : ''}`} />
            </button>
            {showSortDrop && (
              <div className="absolute top-full right-0 mt-1 z-50 w-48 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { setSortBy(opt); setShowSortDrop(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-bold transition ${sortBy === opt ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-xs text-slate-500 font-bold mb-4">
            {filtered.length} promo code{filtered.length !== 1 ? 's' : ''} found
            {search && <span className="text-emerald-600"> for "{search}"</span>}
          </p>
        )}

        {/* ── Cards ── */}
        <div className="space-y-4">
          {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
              <p className="text-sm font-bold text-red-600">{error}</p>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-red-700 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <Percent className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="font-black text-slate-800">No promo codes found</p>
              <p className="text-xs text-slate-500 font-medium">
                {search ? 'Try a different search term.' : 'Check back soon for new offers!'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs font-black text-emerald-600 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {!loading && !error && filtered.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>

        {/* How to Use */}
        <HowToUse />

        {/* Trust Badges */}
        <TrustBadges />
      </div>

      <Footer />
    </div>
  );
}
