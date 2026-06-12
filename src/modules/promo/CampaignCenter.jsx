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
  AlertTriangle 
} from 'lucide-react';

// ─── CONSTANTS & CONFIG ──────────────────────────────────────────────────────
const ACCENT_PALETTE = [
  '#16A34A', // Moss/Emerald
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#2563EB', // Blue
  '#D97706', // Amber
  '#0891B2', // Cyan
  '#EA580C', // Orange
  '#DC2626', // Red
];

// Helper to pad countdown digits
const pad = (num) => String(num).padStart(2, '0');

// ─── DATA NORMALISATION ──────────────────────────────────────────────────────
function normaliseCampaign(raw, idx) {
  const now = new Date();
  const start = raw.startTime ? new Date(raw.startTime) : null;
  const end = raw.endTime ? new Date(raw.endTime) : null;

  let status = String(raw.status || 'active').toLowerCase();
  if (start && end) {
    if (now < start) status = 'upcoming';
    else if (now >= start && now <= end) status = 'active';
    else status = 'ended';
  }

  // Resolve Cover/Hero Image from backend
  let heroImage = null;
  const imgPath = raw.imagePath || raw.heroImage || raw.bannerImage || null;
  if (imgPath) {
    if (imgPath.startsWith('http')) {
      heroImage = imgPath;
    } else {
      const fileName = imgPath.startsWith('campaigns/') ? imgPath.substring(10) : imgPath;
      heroImage = `${BASE_URL}/api/campaigns/image/${fileName}`;
    }
  }

  return {
    id: raw.id,
    title: raw.name || raw.title || 'Campaign Deal',
    description: raw.description || '',
    type: raw.type || 'SEASONAL',
    heroImage,
    status,
    startDate: raw.startTime || raw.startDate || null,
    endDate: raw.endTime || raw.endDate || null,
    discountType: raw.discountType || 'PERCENTAGE',
    discountValue: Number(raw.discountValue ?? 0),
    maxProducts: raw.maxProducts ?? null,
    priority: raw.priority ?? 0,
    totalProducts: raw.totalProducts ?? 0,
    accentColor: ACCENT_PALETTE[idx % ACCENT_PALETTE.length],
  };
}

function normaliseCampaignProduct(raw) {
  // Maps CampaignProductResponseDTO to a shape ProductCard expects
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

// ─── CUSTOM COUNTDOWN TIMER HOOK ──────────────────────────────────────────────
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
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Offer Ended
      </div>
    );
  }

  const blockClass = "flex flex-col items-center justify-center bg-black/45 border border-white/10 rounded-lg";
  const sizeClass = large ? "p-3 min-w-[64px]" : "p-1.5 min-w-[44px]";
  const numClass = large ? "text-xl font-bold text-white font-mono" : "text-sm font-bold text-white font-mono";
  const labelClass = large ? "text-[8px] text-gray-500 uppercase tracking-widest mt-1" : "text-[7px] text-gray-400 uppercase tracking-wider mt-0.5";

  return (
    <div className="flex gap-1.5 items-center">
      <div className={`${blockClass} ${sizeClass}`}>
        <span className={numClass}>{pad(time.days)}</span>
        <span className={labelClass}>D</span>
      </div>
      <span className="text-gray-600 font-bold text-sm">:</span>
      <div className={`${blockClass} ${sizeClass}`}>
        <span className={numClass}>{pad(time.hrs)}</span>
        <span className={labelClass}>H</span>
      </div>
      <span className="text-gray-600 font-bold text-sm">:</span>
      <div className={`${blockClass} ${sizeClass}`}>
        <span className={numClass}>{pad(time.min)}</span>
        <span className={labelClass}>M</span>
      </div>
      <span className="text-gray-600 font-bold text-sm">:</span>
      <div className={`${blockClass} ${sizeClass}`}>
        <span className={numClass}>{pad(time.sec)}</span>
        <span className={labelClass}>S</span>
      </div>
    </div>
  );
}

// ─── LOADER SKELETONS ────────────────────────────────────────────────────────
function CampaignCardSkeleton() {
  return (
    <div className="bg-[#111211] border border-white/5 rounded-2xl overflow-hidden h-72 animate-pulse flex flex-col justify-between">
      <div className="h-40 bg-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-5/6" />
        </div>
        <div className="h-8 bg-white/10 rounded-lg w-full" />
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-[#111211] border border-white/5 rounded-xl p-3 h-64 animate-pulse flex flex-col justify-between">
      <div className="aspect-square bg-white/5 rounded-lg w-full mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2.5 bg-white/5 rounded w-1/2" />
      </div>
      <div className="h-7 bg-white/10 rounded-lg w-full mt-2" />
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyState({ title, message, icon }) {
  return (
    <div className="text-center py-16 px-4 bg-[#111211]/50 border border-white/5 rounded-2xl max-w-md mx-auto">
      <div className="text-4xl mb-4">{icon || '📦'}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title || 'No results found'}</h3>
      <p className="text-gray-400 text-xs leading-relaxed">{message || 'We could not find anything matching your filters.'}</p>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function CampaignCenter() {
  const location = useLocation();

  // Route/Theme Sync
  useLayoutEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#060706';
    window.scrollTo(0, 0);
    return () => { document.body.style.backgroundColor = originalBg; };
  }, [location.pathname]);

  // States
  const [view, setView] = useState('listing'); // 'listing' | 'detail'
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignProducts, setCampaignProducts] = useState([]);
  
  // Filtering & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Upcoming'
  const [sortBy, setSortBy] = useState('Newest'); // 'Newest', 'Highest Discount', 'Ending Soon'

  // Loadings & Errors
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState(null);

  // Estimator State
  const [orderAmount, setOrderAmount] = useState(1500);

  // Fetch all public campaigns
  const fetchCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    setError(null);
    try {
      const res = await apiClient.get('/campaigns', { suppressGlobalErrorToast: true });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
      setCampaigns(raw.map((c, i) => normaliseCampaign(c, i)));
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Could not load active campaigns. Please check your connection and try again.');
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  // Fetch products for a specific campaign
  const fetchCampaignProducts = useCallback(async (campaignId) => {
    setLoadingProducts(true);
    try {
      const res = await apiClient.get(`/campaigns/${campaignId}/products`, { suppressGlobalErrorToast: true });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
      setCampaignProducts(raw.map(normaliseCampaignProduct));
    } catch (err) {
      console.error(`Failed to fetch products for campaign ${campaignId}:`, err);
      setCampaignProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Trigger product fetch when a campaign is selected
  const handleOpenCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setView('detail');
    fetchCampaignProducts(campaign.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedCampaign(null);
    setCampaignProducts([]);
    setView('listing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter & Sort Logic
  const filteredCampaigns = campaigns.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      c.title.toLowerCase().includes(query) || 
      c.description.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'Newest') {
      return new Date(b.startDate || 0) - new Date(a.startDate || 0);
    }
    if (sortBy === 'Highest Discount') {
      return b.discountValue - a.discountValue;
    }
    if (sortBy === 'Ending Soon') {
      return new Date(a.endDate || 0) - new Date(b.endDate || 0);
    }
    return 0;
  });

  // ─── RENDER DETAIL VIEW ────────────────────────────────────────────────────
  if (view === 'detail' && selectedCampaign) {
    const isUpcoming = selectedCampaign.status === 'upcoming';
    const isPercentage = selectedCampaign.discountType === 'PERCENTAGE';
    const discountLabel = isPercentage 
      ? `${selectedCampaign.discountValue}% OFF`
      : `Rs. ${selectedCampaign.discountValue.toLocaleString()} OFF`;

    // Savings Calculator math
    const savings = isPercentage
      ? Math.round(orderAmount * selectedCampaign.discountValue / 100)
      : Math.min(selectedCampaign.discountValue, orderAmount);
    const finalPrice = Math.max(0, orderAmount - savings);

    const infoRows = [
      ['Campaign Type', selectedCampaign.type.replace('_', ' ')],
      ['Discount Level', discountLabel],
      ['Start Date', selectedCampaign.startDate ? new Date(selectedCampaign.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'],
      ['End Date', selectedCampaign.endDate ? new Date(selectedCampaign.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'],
      selectedCampaign.maxProducts && ['Product Limit', `${selectedCampaign.maxProducts} products max`],
    ].filter(Boolean);

    const shopSteps = [
      { num: '1', title: 'Browse Campaign Products', desc: 'Explore items curated exclusively for this event by our top sellers.' },
      { num: '2', title: 'Automatic Campaign Price', desc: 'Eligible items have their campaign-exclusive sale price pre-applied!' },
      { num: '3', title: 'Add & Save Instantly', desc: 'Add campaign items directly to your bag and enjoy checkout savings.' },
    ];

    return (
      <div className="bg-[#060706] min-h-screen text-gray-200 font-sans pb-16">
        
        {/* Banner / Header */}
        <div 
          className="relative overflow-hidden py-16 px-6 border-b border-white/5"
          style={{
            background: `linear-gradient(135deg, ${selectedCampaign.accentColor}44 0%, ${selectedCampaign.accentColor}11 50%, #060706 100%)`
          }}
        >
          {selectedCampaign.heroImage && (
            <img 
              src={selectedCampaign.heroImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none" 
            />
          )}

          <div className="max-w-[1200px] mx-auto">
            <button 
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white mb-8 bg-white/5 border border-white/10 hover:border-white/20 rounded-full px-4 py-2 transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
            </button>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-4"
                  style={{
                    background: isUpcoming ? '#EA580C' : '#16A34A'
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {isUpcoming ? '⏳ Upcoming' : '🟢 Live Campaign'}
                </span>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                  {selectedCampaign.title}
                </h1>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xl">
                  {selectedCampaign.description}
                </p>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="text-4xl font-black text-white tracking-tight">
                    {discountLabel}
                  </div>
                  {selectedCampaign.endDate && (
                    <div className="border-l border-white/10 pl-4 space-y-1">
                      <div className="text-[10px] uppercase text-gray-500 tracking-wider">
                        {isUpcoming ? 'Starting In:' : 'Offer Ends In:'}
                      </div>
                      <CountdownBlocks dateString={isUpcoming ? selectedCampaign.startDate : selectedCampaign.endDate} accentColor={selectedCampaign.accentColor} />
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Card Preview */}
              <div className="hidden md:flex justify-end">
                <div 
                  className="w-full max-w-sm aspect-[1.8/1] rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl group"
                  style={{
                    boxShadow: `0 20px 40px ${selectedCampaign.accentColor}22`
                  }}
                >
                  {selectedCampaign.heroImage ? (
                    <img 
                      src={selectedCampaign.heroImage} 
                      alt={selectedCampaign.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#111] to-[#070707] flex items-center justify-center text-white/25">
                      <Sparkles className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">{selectedCampaign.type}</span>
                      <h4 className="text-sm font-bold text-white truncate">{selectedCampaign.title}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-w-[1200px] mx-auto px-6 mt-10">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Details & Guide */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* How to Shop */}
              <div className="bg-[#111211] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <ShoppingBag className="w-24 h-24 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> How to Shop this Campaign
                </h3>
                <div className="grid sm:grid-cols-3 gap-6">
                  {shopSteps.map((step) => (
                    <div key={step.num} className="space-y-2 relative">
                      <div className="w-8 h-8 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">
                        {step.num}
                      </div>
                      <h4 className="text-xs font-bold text-white">{step.title}</h4>
                      <p className="text-gray-400 text-[11px] leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products Section */}
              <div>
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" /> Eligible Campaign Products
                </h3>

                {loadingProducts ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                ) : campaignProducts.length === 0 ? (
                  <EmptyState 
                    title="No Products Found" 
                    message="Sellers have not registered any approved products for this campaign yet. Check back soon!" 
                    icon="🏷️"
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {campaignProducts.map((p) => (
                      <ProductCard key={p.id} product={p} isSmall variant="default" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Columns */}
            <div className="space-y-6">
              
              {/* Campaign details Card */}
              <div className="bg-[#111211] border border-white/5 rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Campaign Parameters
                </h4>
                <table className="w-full text-xs">
                  <tbody>
                    {infoRows.map(([lbl, val]) => (
                      <tr key={lbl} className="border-b border-white/5 last:border-0">
                        <td className="py-3 text-gray-500 font-medium">{lbl}</td>
                        <td className="py-3 text-right text-white font-semibold">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Discount Estimator Slider */}
              <div className="bg-[#111211] border border-white/5 rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" /> Campaign Estimator
                </h4>
                <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
                  Drag the slider to estimate your total savings with this campaign's discount level.
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[10px] text-gray-400">Order Subtotal</span>
                      <span className="text-sm font-bold text-white">Rs. {orderAmount.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range"
                      min={100}
                      max={15000}
                      step={100}
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1 bg-white/10 rounded-lg outline-none"
                    />
                    <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                      <span>Rs. 100</span>
                      <span>Rs. 15,000</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Savings ({discountLabel})</span>
                      <span className="text-emerald-500 font-bold">- Rs. {savings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-dashed border-white/10 pt-2.5">
                      <span className="text-white font-bold">Estimated Total</span>
                      <span className="text-white font-extrabold text-base" style={{ color: selectedCampaign.accentColor }}>
                        Rs. {finalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms Warning */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-[11px] text-gray-500 space-y-2">
                <div className="font-bold text-gray-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80" /> Campaign Rules
                </div>
                <p className="leading-relaxed">
                  Campaign prices are applied directly to product listing cards. If multiple campaigns affect a single product, the system automatically applies the highest discount value. Campaign pricing is only valid while the campaign is in the "ACTIVE" status.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    );
  }

  // ─── RENDER LISTING VIEW ───────────────────────────────────────────────────
  return (
    <div className="bg-[#060706] min-h-screen text-gray-200 font-sans pb-16">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden py-14 px-6 border-b border-white/5 bg-gradient-to-b from-[#16A34A]/5 to-transparent">
        <div className="max-w-[1200px] mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Jhapcham Campaigns
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Marketplace <span className="text-emerald-500">Campaign Center</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Discover special seasonal sales, holiday events, and exclusive discount campaigns. Browse campaign-registered products directly from verified store profiles.
          </p>
        </div>
      </section>

      {/* Main Grid container */}
      <div className="max-w-[1200px] mx-auto px-6 mt-10 space-y-8">
        
        {/* Controls Layout */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111211] border border-white/5 p-4 rounded-2xl">
          
          {/* Search bar */}
          <div className="w-full md:max-w-xs relative">
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none transition-colors"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Status filtering */}
            <div className="flex items-center gap-1 bg-black/30 border border-white/5 p-1 rounded-xl">
              {['All', 'Active', 'Upcoming'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                    statusFilter === status 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/30 border border-white/10 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300 outline-none cursor-pointer"
            >
              <option value="Newest">Newest</option>
              <option value="Highest Discount">Highest Discount</option>
              <option value="Ending Soon">Ending Soon</option>
            </select>

          </div>
        </div>

        {/* Campaign cards grid */}
        <div>
          {loadingCampaigns ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CampaignCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState 
              title="No Campaigns Found" 
              message="No active or upcoming campaigns were found matching your search and filter options. Check back later!" 
              icon="🔍"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((c) => {
                const isActive = c.status === 'active';
                const isUpcoming = c.status === 'upcoming';
                const isPercentage = c.discountType === 'PERCENTAGE';
                
                return (
                  <div 
                    key={c.id}
                    onClick={() => handleOpenCampaign(c)}
                    className="group bg-[#111211] border border-white/5 hover:border-emerald-500/40 rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
                    style={{
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                    }}
                  >
                    {/* Banner Image or Fallback */}
                    <div className="h-44 w-full relative overflow-hidden bg-gradient-to-br from-[#111] to-[#070707]">
                      {c.heroImage ? (
                        <img 
                          src={c.heroImage} 
                          alt={c.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 group-hover:text-white/20 transition-colors">
                          <Sparkles className="w-12 h-12" />
                        </div>
                      )}

                      {/* Header overlay badges */}
                      <div className="absolute top-3 inset-x-3 flex justify-between items-center z-10">
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-sm"
                          style={{
                            background: isUpcoming ? '#EA580C' : isActive ? '#16A34A' : '#4B5563'
                          }}
                        >
                          {c.status}
                        </span>

                        <span className="px-2 py-0.5 bg-black/60 border border-white/10 backdrop-blur-md rounded text-[8px] uppercase tracking-wider font-bold text-gray-300">
                          {c.type}
                        </span>
                      </div>

                      {/* Discount display */}
                      <div className="absolute bottom-3 right-3 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                        {isPercentage ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`}
                      </div>
                    </div>

                    {/* Details content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors leading-tight mb-2">
                          {c.title}
                        </h3>
                        <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2">
                          {c.description}
                        </p>
                      </div>

                      {/* Timer & CTA footer */}
                      <div className="border-t border-white/5 pt-4 flex items-center justify-between gap-2">
                        {c.endDate && (
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-semibold block">
                              {isUpcoming ? 'Starts In' : 'Ends In'}
                            </span>
                            <CountdownBlocks dateString={isUpcoming ? c.startDate : c.endDate} accentColor={c.accentColor} />
                          </div>
                        )}
                        <button 
                          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10 transition-colors"
                        >
                          Explore <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
