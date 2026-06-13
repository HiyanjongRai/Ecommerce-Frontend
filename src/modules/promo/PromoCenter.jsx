import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient, { BASE_URL } from '../../shared/api/apiClient';
import ProductCard from '../product/components/ProductCard';
import { 
  Search, 
  Clock, 
  ArrowLeft, 
  Percent, 
  Calendar, 
  Sparkles, 
  Calculator, 
  ChevronRight, 
  Info, 
  ShoppingBag, 
  Tag, 
  AlertTriangle,
  Copy,
  Check,
  Share2
} from 'lucide-react';

// ─── CONSTANTS & CONFIG ──────────────────────────────────────────────────────
const ACCENT_PALETTE = [
  '#10B981', // Jhapcham Emerald
  '#6366F1', // Royal Indigo
  '#EC4899', // Rose Quartz
  '#3B82F6', // Cobalt Blue
  '#F59E0B', // Sunrise Amber
  '#14B8A6', // Coral Teal
  '#F97316', // Sunset Orange
  '#F43F5E', // Vivid Rose
];

// Helper to pad countdown digits
const pad = (num) => String(num).padStart(2, '0');

// ─── DATA NORMALISATION ──────────────────────────────────────────────────────
function normalisePromo(raw, idx) {
  const now = new Date();
  const start = raw.startDate ? new Date(raw.startDate) : null;
  const end = raw.endDate ? new Date(raw.endDate) : null;

  let status = 'expired';
  if (start && end) {
    if (now < start) status = 'upcoming';
    else if (now >= start && now <= end) status = 'active';
  }

  const discountPct =
    raw.discountType === 'PERCENTAGE'
      ? Number(raw.discountValue ?? 0)
      : null;

  return {
    id: raw.id,
    title: raw.title || `Promo ${raw.code}`,
    code: raw.code,
    description: raw.description || 'Apply this code at checkout for instant savings.',
    category: raw.category || raw.eligibleCategories?.[0] || 'General',
    discount: discountPct ?? Number(raw.discountValue ?? 0),
    discountType: raw.discountType,
    minOrder: Number(raw.minOrderValue ?? 0),
    products: raw.usageLimit ?? 0,
    usedCount: raw.usedCount ?? 0,
    usageLimit: raw.usageLimit ?? 0,
    status,
    accentColor: ACCENT_PALETTE[idx % ACCENT_PALETTE.length],
    bannerImage: raw.bannerImage || null,
    startDate: raw.startDate,
    endDate: raw.endDate,
    sellerId: raw.sellerId ?? null,
    terms: [
      raw.description || 'Use this code at checkout.',
      `Minimum order: Rs. ${Number(raw.minOrderValue ?? 0).toLocaleString()}.`,
      raw.usageLimit ? `Limited to ${raw.usageLimit} total uses.` : 'Limited availability.',
      raw.perUserUsageLimit ? `Max ${raw.perUserUsageLimit} use(s) per customer.` : 'One use per customer.',
      'Discount applied automatically at checkout.',
    ],
  };
}

function normaliseProduct(raw) {
  const price = Number(raw.price ?? raw.minPrice ?? 0);
  const salePrice = Number(raw.salePrice ?? raw.discountPrice ?? 0);
  const salePct = Number(raw.salePercentage ?? 0);
  const finalPrice = salePrice > 0 ? salePrice : price;
  const originalPrice = price > 0 ? price : finalPrice;

  let imageUrl = null;
  const rawImg =
    raw.imageUrl ||
    raw.thumbnail ||
    raw.imagePath ||
    (Array.isArray(raw.imagePaths) && raw.imagePaths.length > 0 ? raw.imagePaths[0] : null) ||
    (Array.isArray(raw.images) && raw.images.length > 0 && raw.images[0]?.imagePath ? raw.images[0].imagePath : null) ||
    raw.bannerImage ||
    null;
  
  if (rawImg) {
    imageUrl = rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
  }

  const imagePaths = [];
  if (raw.imagePaths && Array.isArray(raw.imagePaths)) {
    imagePaths.push(...raw.imagePaths);
  } else if (raw.imagePath) {
    imagePaths.push(raw.imagePath);
  } else if (raw.images && Array.isArray(raw.images)) {
    imagePaths.push(...raw.images.map(img => img.imagePath || img).filter(Boolean));
  } else if (raw.thumbnail) {
    imagePaths.push(raw.thumbnail);
  }

  return {
    id: raw.id,
    name: raw.name || 'Product',
    imageUrl,
    imagePaths: imagePaths.length > 0 ? imagePaths : (imageUrl ? [imageUrl] : []),
    imagePath: rawImg,
    thumbnail: raw.thumbnail,
    originalPrice,
    finalPrice,
    salePct: salePct > 0 ? salePct : (originalPrice > finalPrice ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0),
    saving: originalPrice - finalPrice,
    rating: raw.averageRating ?? raw.rating ?? 0,
    sold: Number(raw.totalViews ?? raw.soldCount ?? 0),
    category: raw.category || '',
    onSale: raw.onSale ?? (finalPrice < originalPrice),
    slug: raw.slug || null,
  };
}

// ─── COUNTDOWN TIMER HOOK ────────────────────────────────────────────────────
function useCountdown(dateString) {
  const calculateTimeLeft = useCallback(() => {
    if (!dateString) return { days: 0, hrs: 0, min: 0, sec: 0, msLeft: 0 };
    const difference = new Date(dateString).getTime() - Date.now();
    if (difference <= 0) return { days: 0, hrs: 0, min: 0, sec: 0, msLeft: 0 };

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hrs: Math.floor((difference / (1000 * 60 * 60)) % 24),
      min: Math.floor((difference / 1000 / 60) % 60),
      sec: Math.floor((difference / 1000) % 60),
      msLeft: difference,
    };
  }, [dateString]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (!dateString) return;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [dateString, calculateTimeLeft]);

  return timeLeft;
}

// ─── COUNTDOWN COMPONENT ──────────────────────────────────────────────────────
function CountdownBlocks({ dateString, accentColor = '#16A34A', large = false }) {
  const time = useCountdown(dateString);
  
  if (time.msLeft <= 0) {
    return (
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        Ended
      </div>
    );
  }

  const blockClass = "flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm";
  const sizeClass = large ? "p-3 min-w-[56px]" : "p-1.5 min-w-[38px]";
  const numClass = large ? "text-lg font-bold text-slate-800 font-mono" : "text-xs font-bold text-slate-800 font-mono";
  const labelClass = large ? "text-[8px] text-slate-400 uppercase tracking-widest mt-0.5" : "text-[6px] text-slate-500 uppercase tracking-wider mt-0.5";

  return (
    <div className="flex gap-1 items-center">
      <div className={`${blockClass} ${sizeClass}`}>
        <span className={numClass}>{pad(time.days)}</span>
        <span className={labelClass}>D</span>
      </div>
      <span className="text-gray-400 font-bold text-xs">:</span>
      <div className={`${blockClass} ${sizeClass}`}>
        <span className={numClass}>{pad(time.hrs)}</span>
        <span className={labelClass}>H</span>
      </div>
      <span className="text-gray-400 font-bold text-xs">:</span>
      <div className={`${blockClass} ${sizeClass}`}>
        <span className={numClass}>{pad(time.min)}</span>
        <span className={labelClass}>M</span>
      </div>
      <span className="text-gray-400 font-bold text-xs">:</span>
      <div className={`${blockClass} ${sizeClass}`}>
        <span className={numClass}>{pad(time.sec)}</span>
        <span className={labelClass}>S</span>
      </div>
    </div>
  );
}

// ─── COPY CODE ACTION BUTTON ──────────────────────────────────────────────────
function CopyButton({ code, style = {} }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <button
      onClick={handleCopy}
      style={{ ...style }}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
        copied ? 'bg-[#10B981] text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-gray-200'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? 'Copied' : 'Copy Code'}</span>
    </button>
  );
}

// ─── LOADER SKELETON CARD ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-64 animate-pulse flex flex-col justify-between shadow-sm">
      <div className="h-16 bg-gray-100 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-5/6" />
        </div>
        <div className="h-8 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  );
}

// ─── EMPTY STATE & ERROR BANNER ──────────────────────────────────────────────
function EmptyState({ icon, title, message }) {
  return (
    <div className="text-center py-16 px-4 bg-gray-50 border border-gray-200 rounded-2xl max-w-md mx-auto shadow-sm">
      <div className="text-4xl mb-4">{icon || '🎟️'}</div>
      <h3 className="text-sm font-bold text-slate-800 mb-2">{title || 'Nothing here'}</h3>
      <p className="text-slate-500 text-xs leading-relaxed">{message || ''}</p>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 text-center max-w-md mx-auto space-y-4">
      <div className="text-3xl">⚠️</div>
      <div className="text-xs font-semibold">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── PROMO CARD COMPONENT ─────────────────────────────────────────────────────
function PromoCard({ promo, onExplore }) {
  const [copied, setCopied] = useState(false);
  const isUpcoming = promo.status === 'upcoming';
  const statusColor = isUpcoming ? '#EA580C' : '#16A34A';

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const discountLabel =
    promo.discountType === 'PERCENTAGE'
      ? `-${promo.discount}%`
      : `Rs. ${Number(promo.discount).toLocaleString()} OFF`;

  const countdownDate = isUpcoming ? promo.startDate : promo.endDate;

  return (
    <div
      onClick={() => onExplore(promo)}
      className="group bg-white border border-gray-200 hover:border-[var(--accent-color)]/50 rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
      style={{
        '--accent-color': promo.accentColor
      }}
    >
      {/* Top Banner overlay block */}
      <div 
        className="h-20 relative overflow-hidden flex items-center justify-between px-4"
        style={{
          background: promo.bannerImage ? 'transparent' : promo.accentColor
        }}
      >
        {promo.bannerImage && (
          <img
            src={promo.bannerImage.startsWith('http') ? promo.bannerImage : `${BASE_URL}${promo.bannerImage}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
          />
        )}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />
        
        <span className="relative bg-black/60 border border-white/10 text-white text-base font-extrabold px-3 py-1 rounded-xl">
          {discountLabel}
        </span>
        <span 
          className="relative text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white shadow"
          style={{ background: statusColor }}
        >
          {promo.status}
        </span>
      </div>

      {/* Body details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <div 
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: promo.accentColor }}
          >
            {promo.category}
          </div>
          <h4 className="text-xs font-bold text-slate-800 group-hover:text-[var(--accent-color)] transition-colors leading-tight line-clamp-1">{promo.title}</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            {promo.description}
          </p>
        </div>

        {/* Copy dashed stub */}
        <div className="border border-dashed border-gray-250 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between gap-3">
          <span 
            className="font-mono text-xs font-bold tracking-widest truncate"
            style={{ color: promo.accentColor }}
          >
            {promo.code}
          </span>
          <button
            onClick={handleCopy}
            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1 ${
              copied ? 'text-white' : 'bg-gray-100 hover:bg-[var(--accent-color)] hover:text-white text-slate-600'
            }`}
            style={{ backgroundColor: copied ? '#10B981' : undefined, '--accent-color': promo.accentColor }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Countdown / Meta */}
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {countdownDate && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                {isUpcoming ? 'Starts in' : 'Ends in'}
              </span>
              <CountdownBlocks dateString={countdownDate} accentColor={promo.accentColor} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            {promo.minOrder > 0 && <span>Min: Rs. {promo.minOrder.toLocaleString()}</span>}
            {promo.usageLimit > 0 && (
              <>
                <span>·</span>
                <span>{promo.usageLimit - (promo.usedCount || 0)} uses left</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL VIEW PAGE ────────────────────────────────────────────────────────
function PromoDetailPage({ promo, products, onBack }) {
  const [orderAmount, setOrderAmount] = useState(1500);

  const savings =
    promo.discountType === 'PERCENTAGE'
      ? Math.round(orderAmount * promo.discount / 100)
      : Math.min(promo.discount, orderAmount);
  const finalPrice = Math.max(0, orderAmount - savings);

  const isUpcoming = promo.status === 'upcoming';
  const discountLabel =
    promo.discountType === 'PERCENTAGE'
      ? `${promo.discount}% OFF`
      : `Rs. ${Number(promo.discount).toLocaleString()} OFF`;

  const steps = [
    { emoji: '🔍', title: 'Browse Products', desc: 'Explore eligible items across all listed categories.' },
    { emoji: '🛒', title: 'Add to Cart', desc: 'Select your items and proceed to checkout.' },
    { emoji: '🎟️', title: 'Apply Code', desc: `Enter code ${promo.code} in the promo/coupon field.` },
    { emoji: '🎉', title: 'Enjoy Savings', desc: `Discount applied instantly — save ${discountLabel}!` },
  ];

  const infoRows = [
    ['Category', promo.category],
    ['Min Purchase', promo.minOrder > 0 ? `Rs. ${promo.minOrder.toLocaleString()}` : '—'],
    ['Discount Rate', discountLabel],
    ['Usage Limit', promo.usageLimit > 0 ? `${promo.usageLimit} total uses` : 'Unlimited'],
    ['Used Count', `${promo.usedCount ?? 0} uses`],
    promo.startDate && ['Start Date', new Date(promo.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
    promo.endDate && ['End Date', new Date(promo.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
  ].filter(Boolean);

  return (
    <div 
      className="bg-[#F9FAFB] min-h-screen text-slate-700 font-sans pb-16"
      style={{
        background: `radial-gradient(circle at top, ${promo.accentColor}08 0%, #F9FAFB 100%)`
      }}
    >
      
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden py-16 px-6 border-b border-gray-200"
        style={{
          background: `linear-gradient(135deg, ${promo.accentColor}0e 0%, ${promo.accentColor}03 50%, #F9FAFB 100%)`
        }}
      >
        {promo.bannerImage && (
          <img
            src={promo.bannerImage.startsWith('http') ? promo.bannerImage : `${BASE_URL}${promo.bannerImage}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none"
          />
        )}

        <div className="max-w-[1200px] mx-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-slate-800 mb-8 bg-white border border-gray-200 hover:border-[var(--accent-color)] rounded-full px-4 py-2 transition-all duration-200 shadow-sm"
            style={{ '--accent-color': promo.accentColor }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Deals
          </button>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-4"
                style={{
                  background: isUpcoming ? '#F97316' : '#10B981'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {isUpcoming ? '⏳ Upcoming Deal' : '🟢 Active Deal'}
              </span>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
                {promo.title}
              </h1>

              <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-xl">
                {promo.description}
              </p>

              {/* Ticket stub */}
              <div 
                className="bg-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 border border-gray-200 shadow-sm max-w-md"
                style={{ borderLeftColor: promo.accentColor, borderLeftWidth: '4px' }}
              >
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Promo Coupon Code</div>
                  <span 
                    className="font-mono text-xl font-black tracking-widest"
                    style={{ color: promo.accentColor }}
                  >
                    {promo.code}
                  </span>
                </div>
                <div className="flex gap-2">
                  <CopyButton code={promo.code} />
                  <button
                    onClick={async () => {
                      try {
                        if (navigator.share) {
                          await navigator.share({ title: promo.title, text: `Use coupon code ${promo.code} to get ${discountLabel}!`, url: window.location.href });
                        } else {
                          await navigator.clipboard.writeText(`${promo.title} - use code ${promo.code} at Jhapcham.`);
                        }
                      } catch (_) {}
                    }}
                    className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                    title="Share Promo Code"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Countdown / Stats */}
            <div className="flex flex-col gap-4 items-start md:items-end">
              {(promo.startDate || promo.endDate) && (
                <div className="space-y-1.5 md:text-right">
                  <div className="text-[10px] uppercase text-slate-500 tracking-wider">
                    {isUpcoming ? 'Starts in:' : 'Offer ends in:'}
                  </div>
                  <CountdownBlocks dateString={isUpcoming ? promo.startDate : promo.endDate} accentColor={promo.accentColor} large={true} />
                </div>
              )}
              <div className="text-3xl font-black text-slate-900">
                {discountLabel}
              </div>
              {promo.minOrder > 0 && (
                <div className="text-xs text-slate-500">
                  Minimum Order Value: Rs. {promo.minOrder.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body grids */}
      <div className="max-w-[1200px] mx-auto px-6 mt-10">
        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* Steps guidelines */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: promo.accentColor }} /> How to Redeem this Code
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {steps.map((step, idx) => (
                  <div key={step.title} className="flex gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        borderColor: `${promo.accentColor}44`,
                        backgroundColor: `${promo.accentColor}15`,
                        color: promo.accentColor
                      }}
                    >
                      {step.emoji}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-0.5">{idx + 1}. {step.title}</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligible Products */}
            {products.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" style={{ color: promo.accentColor }} /> Products Eligible for Coupons
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {products.slice(0, 8).map((p) => (
                    <ProductCard key={p.id} product={p} isSmall />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar grids */}
          <div className="space-y-6">
            
            {/* Parameters Table */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Coupon Details
              </h4>
              <table className="w-full text-xs">
                <tbody>
                  {infoRows.map(([lbl, val]) => (
                    <tr key={lbl} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-slate-500 font-medium">{lbl}</td>
                      <td className="py-3 text-right text-slate-800 font-semibold">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Savings Calculator Slider */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" /> Coupon Estimator
              </h4>
              <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                Drag the slider to estimate your total checkout savings with this coupon.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] text-slate-500">Order Subtotal</span>
                    <span className="text-sm font-bold text-slate-800">Rs. {orderAmount.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range"
                    min={100}
                    max={15000}
                    step={100}
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(Number(e.target.value))}
                    className="w-full cursor-pointer h-1 bg-gray-200 rounded-lg outline-none"
                    style={{ accentColor: promo.accentColor }}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>Rs. 100</span>
                    <span>Rs. 15,000</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Savings ({discountLabel})</span>
                    <span className="font-bold" style={{ color: promo.accentColor }}>- Rs. {savings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-dashed border-gray-200 pt-2.5">
                    <span className="text-slate-800 font-bold">Estimated Price</span>
                    <span className="text-slate-800 font-extrabold text-base" style={{ color: promo.accentColor }}>
                      Rs. {finalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms List */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500/85" /> Terms & Conditions
              </h4>
              <ul className="space-y-2.5 text-[11px] text-slate-600">
                {promo.terms.map((term, idx) => (
                  <li key={idx} className="flex gap-2 items-start leading-relaxed">
                    <span className="flex-shrink-0 font-bold text-xs" style={{ color: promo.accentColor }}>✓</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

// ─── MAIN PROMO CENTER ────────────────────────────────────────────────────────
export default function PromoCenter() {
  const location = useLocation();

  useLayoutEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#F9FAFB';
    window.scrollTo(0, 0);
    return () => { document.body.style.backgroundColor = originalBg; };
  }, [location.pathname]);

  const [view, setView] = useState('listing');
  const [selectedPromo, setSelectedPromo] = useState(null);

  // Data States
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Loading & Errors
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Upcoming'
  const [sortBy, setSortBy] = useState('Newest');
  const [discountPill, setDiscountPill] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sidebarDiscount, setSidebarDiscount] = useState(0);

  // Fetch Promo data
  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/promos/active', { suppressGlobalErrorToast: true });
      const raw = Array.isArray(res.data) ? res.data : [];
      setPromos(raw.map((p, i) => normalisePromo(p, i)));
    } catch (err) {
      console.error('Failed to load active promos:', err);
      setError('Failed to load active promo codes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch general products for fallback shopping
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await apiClient.get('/products/page', {
        params: { page: 0, size: 12, sort: 'newest' },
        suppressGlobalErrorToast: true,
      });
      const raw = res.data?.content ?? res.data ?? [];
      setProducts(Array.isArray(raw) ? raw.map(normaliseProduct) : []);
    } catch (err) {
      console.error('Failed to load products for promo center:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
    fetchProducts();
  }, [fetchPromos, fetchProducts]);

  // Stats Derived
  const activeCount = promos.filter(p => p.status === 'active').length;
  const upcomingCount = promos.filter(p => p.status === 'upcoming').length;
  const maxDiscount = promos.length ? Math.max(...promos.map(p => p.discount)) : 0;

  // Categories list from real data
  const allCategories = [...new Set(promos.map(p => p.category).filter(Boolean))];
  const catCounts = allCategories.reduce((acc, cat) => {
    acc[cat] = promos.filter(p => p.category === cat).length;
    return acc;
  }, {});

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Filter & Sort math
  const effectiveDiscountMin = Math.max(discountPill, sidebarDiscount);
  let filtered = promos.filter(p => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || p.status === statusFilter.toLowerCase();
    const matchDiscount = p.discount >= effectiveDiscountMin;
    const matchCat = selectedCategories.length === 0 || selectedCategories.includes(p.category);
    return matchSearch && matchStatus && matchDiscount && matchCat;
  });

  if (sortBy === 'Newest') {
    filtered = [...filtered].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
  } else if (sortBy === 'Highest Discount') {
    filtered = [...filtered].sort((a, b) => b.discount - a.discount);
  } else if (sortBy === 'Ending Soon') {
    filtered = [...filtered].sort((a, b) => new Date(a.endDate || 0) - new Date(b.endDate || 0));
  }

  const discountPills = [
    { label: 'Any', min: 0 },
    { label: '10%+', min: 10 },
    { label: '20%+', min: 20 },
    { label: '30%+', min: 30 },
    { label: '50%+', min: 50 },
  ];

  const handleExplore = (promo) => {
    setSelectedPromo(promo);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedPromo(null);
    setView('listing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      className="bg-[#F9FAFB] min-h-screen text-slate-800 font-sans pb-16"
      style={{
        background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.04) 0%, #F9FAFB 100%)'
      }}
    >
      
      {/* Detail View */}
      {view === 'detail' && selectedPromo ? (
        <PromoDetailPage promo={selectedPromo} products={products} onBack={handleBack} />
      ) : (
        <>
          {/* Hero Header */}
          <section className="relative overflow-hidden py-14 px-6 border-b border-gray-200 bg-gradient-to-b from-[#10B981]/5 to-transparent">
            <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Jhapcham Deals Hub
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Exclusive <span className="text-[#10B981]">Promo Codes</span> & Coupons
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm max-w-md leading-relaxed">
                  Discover handpicked coupon codes and checkout deals from our sellers. Copy the coupon code, apply it during checkout, and receive instant savings!
                </p>
              </div>

              {/* Stats boards in header */}
              {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {[
                    { label: 'Active Deals', value: activeCount, color: '#10B981' },
                    { label: 'Upcoming', value: upcomingCount, color: '#F97316' },
                    { label: 'Max Discount', value: maxDiscount > 0 ? `${maxDiscount}%` : '—', color: '#F43F5E' },
                    { label: 'Total Promos', value: promos.length, color: '#94A3B8' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                      <div className="text-lg font-black" style={{ color }}>{value}</div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Sticky Controls bar */}
          <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 py-4 px-6 sticky top-0 z-30 shadow-sm">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search input */}
              <div className="w-full md:max-w-xs relative">
                <input 
                  type="text" 
                  placeholder="Search promo codes..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-gray-300 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-gray-400 outline-none transition-all"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>

              {/* Filter Row Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                
                {/* Status tabs */}
                <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 p-1 rounded-xl">
                  {['All', 'Active', 'Upcoming'].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                        statusFilter === s 
                          ? 'bg-[#10B981] text-white shadow' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-white border border-gray-300 focus:border-[#10B981] rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 outline-none cursor-pointer shadow-sm"
                >
                  <option value="Newest">Newest</option>
                  <option value="Highest Discount">Highest Discount</option>
                  <option value="Ending Soon">Ending Soon</option>
                </select>

                {/* Discount Percentage Pills */}
                <div className="flex items-center gap-1.5">
                  {discountPills.map(({ label, min }) => (
                    <button
                      key={label}
                      onClick={() => setDiscountPill(min)}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-150 ${
                        discountPill === min 
                          ? 'bg-[#10B981] text-white shadow' 
                          : 'bg-gray-100 hover:bg-gray-200 text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

              </div>
            </div>
          </div>

          {/* Main Layout Container */}
          <div className="max-w-[1200px] mx-auto px-6 mt-10">
            <div className="grid md:grid-cols-[200px_1fr] gap-8 items-start">
              
              {/* Sidebar Filters */}
              {allCategories.length > 0 && (
                <aside className="bg-white border border-gray-200 p-5 rounded-2xl space-y-6 hidden sm:block shadow-sm">
                  
                  {/* Category selections */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Categories
                    </h4>
                    <div className="space-y-1.5">
                      {allCategories.map(cat => {
                        const active = selectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`w-full flex justify-between items-center px-2.5 py-1.5 rounded-xl text-left text-xs transition-all ${
                              active ? 'bg-[#10B981]/10 text-[#10B981] font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-gray-50'
                            }`}
                          >
                            <span>{cat}</span>
                            <span 
                              className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${
                                active ? 'bg-[#10B981] text-white' : 'bg-gray-100 text-slate-500'
                              }`}
                            >
                              {catCounts[cat]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="text-[9px] font-bold uppercase text-red-600 hover:text-red-500"
                      >
                        ✕ Clear Categories
                      </button>
                    )}
                  </div>

                  {/* Min Discount range */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Min Discount
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[0, 10, 20, 30, 50].map(min => (
                        <label key={min} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-950">
                          <input
                            type="radio" 
                            name="sidebarDiscount" 
                            value={min}
                            checked={sidebarDiscount === min}
                            onChange={() => setSidebarDiscount(min)}
                            className="accent-[#10B981]"
                          />
                          <span>{min === 0 ? 'Any' : `${min}%+`}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                </aside>
              )}

              {/* Main Content Area */}
              <div className="space-y-8">
                
                {/* Loader State */}
                {loading && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                )}

                {/* Error State */}
                {!loading && error && (
                  <ErrorBanner message={error} onRetry={fetchPromos} />
                )}

                {/* Empty Promo States */}
                {!loading && !error && promos.length === 0 && (
                  <EmptyState
                    icon="🎟️"
                    title="No Coupons Available"
                    message="Check back soon — new promo codes and deals are updated regularly!"
                  />
                )}

                {!loading && !error && promos.length > 0 && filtered.length === 0 && (
                  <EmptyState
                    icon="🔍"
                    title="No Match Found"
                    message="We couldn't find any deals matching your filter criteria. Try expanding search or category tags."
                  />
                )}

                {/* Grid Lists */}
                {!loading && !error && filtered.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Showing {filtered.length} coupon{filtered.length !== 1 ? 's' : ''}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filtered.map(promo => (
                        <PromoCard key={promo.id} promo={promo} onExplore={handleExplore} />
                      ))}
                    </div>
                  </div>
                )}



              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
