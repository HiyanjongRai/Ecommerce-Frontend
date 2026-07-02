import React, { useEffect, useState, useCallback } from 'react';
import { getSellerCampaigns, getSellerProducts, getSellerProfile, joinSellerCampaign, getProductDetail } from '../../../services/sellerApi';
import { normalizeList, resolveImageUrl, SectionHeader } from '../SectionUtils/SectionUtils';
import { toast } from '../../../context/ToastContext';
import { useSellerTheme } from '../../../hooks/useSellerTheme';
import { Megaphone, Calendar, Clock, Layers, Sparkles, Check, ChevronRight, Package, RefreshCw, Info } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getCampaignStatus = (campaign) => {
  const now = new Date();
  const start = campaign.startTime ? new Date(campaign.startTime) : null;
  const end = campaign.endTime ? new Date(campaign.endTime) : null;
  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'ended';
  return 'active';
};

const getDaysRemaining = (campaign) => {
  const now = new Date();
  const end = campaign.endTime ? new Date(campaign.endTime) : null;
  const start = campaign.startTime ? new Date(campaign.startTime) : null;
  if (!end) return null;
  if (now < (start || now)) {
    const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    return { type: 'starts', days: diff };
  }
  if (now > end) return { type: 'ended', days: 0 };
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return { type: 'ends', days: diff };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getProgressPct = (campaign) => {
  const now = new Date();
  const start = campaign.startTime ? new Date(campaign.startTime) : null;
  const end = campaign.endTime ? new Date(campaign.endTime) : null;
  if (!start || !end) return 0;
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status, isDark }) => {
  const cfg = {
    active:   { cls: isDark ? 'bg-[#16A34A]/100/10 text-[#2E5E2C] border-[#16A34A]/20' : 'bg-[#16A34A]/10 text-emerald-750 border-[#16A34A]/30', dot: 'bg-emerald-400 animate-pulse', label: 'Active Now' },
    upcoming: { cls: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-750 border-amber-250',       dot: 'bg-amber-400',               label: 'Coming Soon' },
    ended:    { cls: isDark ? 'bg-white/5 text-gray-500 border-white/10' : 'bg-gray-100 text-gray-500 border-gray-250',         dot: 'bg-gray-400',                label: 'Ended' },
  };
  const c = cfg[status] || cfg.upcoming;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const ModalStep = ({ current, isDark }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2].map((s, i) => {
      const isDone = current > s;
      const isActive = current === s;
      return (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
            isActive ? (isDark ? 'bg-white text-black border-transparent' : 'bg-gray-900 text-white border-transparent shadow-xs') :
            isDone ? (isDark ? 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/25' : 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20') :
            (isDark ? 'text-gray-550 border-white/5 bg-white/5' : 'text-gray-400 border-gray-150 bg-gray-50/50')
          }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
              isActive ? (isDark ? 'bg-black/10 text-black' : 'bg-white/20 text-white') :
              isDone   ? (isDark ? 'bg-[#16A34A]/20 text-[#16A34A]' : 'bg-emerald-200 text-[#152F17]') :
              (isDark ? 'bg-white/10 text-gray-500' : 'bg-gray-100 text-gray-400')
            }`}>
              {isDone ? <Check size={8} strokeWidth={3} /> : s}
            </span>
            {s === 1 ? 'Select Product' : 'Configure Price'}
          </div>
          {i === 0 && (
            <ChevronRight size={12} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SellerCampaigns = () => {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinFlow, setJoinFlow] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [campaignConfig, setCampaignConfig] = useState({ salePrice: '', stockLimit: '', selectedVariants: [] });
  const [selectedVariantPrices, setSelectedVariantPrices] = useState({});
  const [joining, setJoining] = useState(false);

  const showToast = useCallback((msg, type = 'info') => toast(msg, type), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerCampaigns();
      setCampaigns(normalizeList(res.data));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load campaigns.', 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const startJoinCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    setJoinFlow(1);
    setLoadingProducts(true);
    setCampaignConfig({ salePrice: '', stockLimit: '', selectedVariants: [] });
    setSelectedProduct(null);
    setProductVariants([]);
    try {
      const profileRes = await getSellerProfile();
      const sellerId = profileRes.data?.userId;
      if (sellerId) {
        const productRes = await getSellerProducts(sellerId);
        const active = normalizeList(productRes.data).filter(p => String(p.status).toUpperCase() === 'ACTIVE');
        setSellerProducts(active);
      }
    } catch {
      showToast('Failed to load active products', 'error');
      setJoinFlow(null);
    } finally { setLoadingProducts(false); }
  };

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setProductVariants([]);
    setCampaignConfig(prev => ({ ...prev, selectedVariants: [] }));
    setSelectedVariantPrices({});
    setLoadingVariants(true);
    try {
      const detail = await getProductDetail(product.id);
      setProductVariants(detail.data?.variants || []);
    } catch { setProductVariants([]); }
    finally { setLoadingVariants(false); }
  };

  const proceedToConfig = () => {
    if (!selectedProduct) { showToast('Please select a product first.', 'warning'); return; }
    if (productVariants.length > 0 && campaignConfig.selectedVariants.length === 0) {
      showToast('Please select at least one variant configuration.', 'warning'); return;
    }
    setJoinFlow(2);
  };

  const getMaxPrice = () => {
    if (campaignConfig.selectedVariants.length > 0) {
      const prices = Object.values(selectedVariantPrices);
      return prices.length > 0 ? Math.max(...prices) : selectedProduct?.price || 0;
    }
    return selectedProduct?.price || 0;
  };

  const salePrice = parseFloat(campaignConfig.salePrice) || 0;
  const maxPrice = getMaxPrice();
  const saving = maxPrice - salePrice;
  const savingPct = maxPrice > 0 ? Math.round((saving / maxPrice) * 100) : 0;
  const priceValid = salePrice > 0 && salePrice < maxPrice;

  const handleJoinCampaign = async () => {
    if (!selectedProduct || !selectedCampaign) return;
    if (!campaignConfig.salePrice || salePrice <= 0) { showToast('Enter a valid sale price', 'warning'); return; }
    if (salePrice >= maxPrice) { showToast(`Sale price must be below Rs. ${maxPrice.toLocaleString()}`, 'warning'); return; }
    setJoining(true);
    try {
      let products = [];
      if (productVariants.length > 0 && campaignConfig.selectedVariants.length > 0) {
        products = campaignConfig.selectedVariants.map(variantId => ({ productId: selectedProduct.id, variantId, salePrice, stockLimit: campaignConfig.stockLimit ? parseInt(campaignConfig.stockLimit) : null }));
      } else {
        products = [{ productId: selectedProduct.id, salePrice, stockLimit: campaignConfig.stockLimit ? parseInt(campaignConfig.stockLimit) : null }];
      }
      await joinSellerCampaign({ campaignId: selectedCampaign.id, products });
      showToast('Successfully joined campaign!', 'success');
      closeCampaignFlow(); load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join campaign', 'error');
    } finally { setJoining(false); }
  };

  const closeCampaignFlow = () => {
    setJoinFlow(null); setSelectedCampaign(null); setSelectedProduct(null);
    setProductVariants([]); setCampaignConfig({ salePrice: '', stockLimit: '', selectedVariants: [] }); setSelectedVariantPrices({});
  };

  const toggleVariant = (variantId, variantPrice) => {
    setCampaignConfig(prev => ({
      ...prev,
      selectedVariants: prev.selectedVariants.includes(variantId)
        ? prev.selectedVariants.filter(id => id !== variantId)
        : [...prev.selectedVariants, variantId],
    }));
    setSelectedVariantPrices(prev => {
      const next = { ...prev };
      if (next[variantId]) delete next[variantId]; else next[variantId] = variantPrice;
      return next;
    });
  };

  const activeCampaigns = campaigns.filter(c => getCampaignStatus(c) === 'active').length;
  const upcomingCampaigns = campaigns.filter(c => getCampaignStatus(c) === 'upcoming').length;

  const inputCls = `w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
    isDark 
      ? 'bg-[#111827] border-white/10 text-white placeholder-gray-650 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15' 
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-405 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
  }`;

  if (loading) return (
    <div className={`flex flex-col items-center justify-center h-64 gap-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <svg className="animate-spin w-6 h-6 text-[#16A34A]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-xs font-bold uppercase tracking-wider">Loading campaigns...</span>
    </div>
  );

  return (
    <div className={`space-y-4 max-w-[1400px] animate-in fade-in-50 duration-200 font-sans ${themeClasses.bg.primary}`}>

      {/* ── Page Header Banner ── */}
      <SectionHeader
        title="Campaign Opportunities"
        subtitle="Participate in admin campaigns, storefront highlights, and holiday sales events."
        tag="Exclusive Promotions"
        action={
          <button 
            type="button" 
            onClick={load} 
            className="bg-white hover:bg-gray-150 text-gray-900 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-gray-200 shadow-sm h-10"
          >
            <RefreshCw size={12} className={`shrink-0 ${loading ? 'animate-spin' : ''}`} />
            Sync Campaigns
          </button>
        }
      />

      {/* ── Stats Summary Grid ── */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Events', value: campaigns.length, icon: Megaphone, color: isDark ? 'text-blue-450 bg-blue-500/10' : 'text-blue-700 bg-blue-50' },
            { label: 'Running Active', value: activeCampaigns, icon: Clock, color: isDark ? 'text-emerald-450 bg-[#16A34A]/100/10' : 'text-[#152F17] bg-[#16A34A]/10' },
            { label: 'Upcoming Sales', value: upcomingCampaigns, icon: Calendar, color: isDark ? 'text-amber-450 bg-amber-500/10' : 'text-amber-700 bg-amber-50' }
          ].map(s => {
            const IconComp = s.icon;
            return (
              <div key={s.label} className={`border rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all hover:-translate-y-0.5 duration-300 ${
                isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
              }`}>
                <div>
                  <h3 className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</h3>
                  <div className={`text-xl font-black leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
                </div>
                <div className={`p-2.5 rounded-xl ${s.color}`}>
                  <IconComp size={16} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Campaigns Master Layout Grid ── */}
      {campaigns.length === 0 ? (
        <div className={`border rounded-2xl p-16 text-center transition-colors ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
        }`}>
          <Megaphone size={36} className={`mx-auto mb-3.5 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>No campaigns available</p>
          <p className={`text-[10px] font-semibold mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Admin-hosted campaigns will show up here as soon as they are launched.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map(campaign => {
            const image = resolveImageUrl(campaign.imagePath);
            const status = getCampaignStatus(campaign);
            const timer = getDaysRemaining(campaign);
            const progress = getProgressPct(campaign);
            const isEnded = status === 'ended';

            return (
              <div 
                key={campaign.id} 
                className={`border rounded-2xl overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all hover:shadow-md group ${
                  isEnded ? 'opacity-55 grayscale-[30%]' : ''
                } ${
                  isDark ? 'bg-[#0b0c10] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Image / Header Banner */}
                <div className="relative h-32 overflow-hidden bg-gray-900">
                  {image ? (
                    <img src={image} alt={campaign.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center ${
                      status === 'active' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
                      status === 'upcoming' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      'bg-gradient-to-br from-gray-650 to-gray-800'
                    }`}>
                      <Megaphone size={28} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Absolute Badge Tags */}
                  {campaign.discountType && campaign.discountValue && (
                    <div className="absolute top-3.5 left-3.5 bg-white text-gray-950 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md">
                      {campaign.discountType === 'PERCENTAGE' ? `${campaign.discountValue}% OFF` : `Rs. ${campaign.discountValue} OFF`}
                    </div>
                  )}
                  
                  <div className="absolute top-3.5 right-3.5">
                    <StatusBadge status={status} isDark={isDark} />
                  </div>
                  
                  {timer && !isEnded && (
                    <div className="absolute bottom-3.5 left-3.5">
                      <span className={`text-[9.5px] font-black px-2.5 py-1 rounded-lg tracking-wider ${
                        timer.type === 'ends' && timer.days <= 3 ? 'bg-red-650 text-white shadow-sm' :
                        timer.type === 'ends' ? 'bg-black/60 text-white backdrop-blur-sm border border-white/[0.08]' : 'bg-amber-500 text-white'
                      }`}>
                        {timer.type === 'ends' ? `${timer.days} days remaining` : `Starts in ${timer.days} days`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Info Content */}
                <div className="p-5 flex flex-col flex-1 gap-4">
                  <div className="space-y-1">
                    <h3 className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{campaign.name}</h3>
                    <p className={`text-[11px] line-clamp-2 font-semibold leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {campaign.description || 'Join this exclusive marketing event to feature your products on storefront lists and gain visibility.'}
                    </p>
                  </div>

                  {status === 'active' && (
                    <div className="space-y-1.5 pt-1">
                      <div className={`flex items-center justify-between text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-405'}`}>
                        <span>Timeline Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-150'}`}>
                        <div className="h-full bg-[#16A34A]/100 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 text-[10px]">
                    <div className={`border rounded-xl px-3 py-2 ${isDark ? 'bg-[#111827] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`font-black uppercase tracking-widest text-[8px] mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Starts Date</p>
                      <p className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(campaign.startTime)}</p>
                    </div>
                    <div className={`border rounded-xl px-3 py-2 ${isDark ? 'bg-[#111827] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`font-black uppercase tracking-widest text-[8px] mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Ends Date</p>
                      <p className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(campaign.endTime)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => startJoinCampaign(campaign)}
                    disabled={isEnded}
                    className={`mt-auto w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      isEnded 
                        ? (isDark ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5' : 'bg-gray-100 text-gray-400 cursor-not-allowed') 
                        : (isDark ? 'bg-white text-black hover:bg-gray-150' : 'bg-gray-900 text-white hover:bg-black')
                    }`}
                  >
                    {isEnded ? 'Campaign Closed' : 'Participate in Campaign'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Joing Form Step Modal Overlay ── */}
      {joinFlow !== null && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={closeCampaignFlow} />
          <div className={`relative rounded-2xl border w-full max-w-md flex flex-col max-h-[88vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
          }`}>

            {/* Modal Header */}
            <div className={`flex-shrink-0 px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50/50'
            }`}>
              <div>
                <h2 className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-905'}`}>Join Campaign</h2>
                <p className={`text-[10px] font-bold mt-0.5 ${isDark ? 'text-[#16A34A]' : 'text-[#152F17]'}`}>{selectedCampaign.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <ModalStep current={joinFlow} isDark={isDark} />
                <button onClick={closeCampaignFlow} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                  ✕
                </button>
              </div>
            </div>

            {/* Step 1: Select product */}
            {joinFlow === 1 && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Select a product listing to enter</p>

                  {loadingProducts ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className={`h-12 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />)}
                    </div>
                  ) : sellerProducts.length === 0 ? (
                    <div className="text-center py-10">
                      <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>No active products found</p>
                      <p className={`text-[10px] font-semibold mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>You need active catalog listings before joining campaigns.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sellerProducts.map(product => {
                        const isSelected = selectedProduct?.id === product.id;
                        return (
                          <button 
                            key={product.id} 
                            type="button" 
                            onClick={() => handleProductSelect(product)}
                            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? (isDark ? 'border-[#16A34A] bg-[#16A34A]/10 shadow-[0_2px_12px_rgba(16,185,129,0.05)]' : 'border-gray-900 bg-gray-50') 
                                : (isDark ? 'border-white/5 hover:bg-white/5 hover:border-white/10' : 'border-gray-200 hover:bg-gray-50')
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                              isSelected 
                                ? (isDark ? 'bg-[#16A34A] border-[#16A34A]' : 'bg-gray-900 border-gray-900') 
                                : (isDark ? 'border-gray-650 bg-transparent' : 'border-gray-300 bg-white')
                            }`}>
                              {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                              <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{product.stockQuantity ?? 0} units left</p>
                            </div>
                            <p className={`text-xs font-black flex-shrink-0 ${isDark ? 'text-white' : 'text-gray-900'}`}>Rs. {(product.price || 0).toLocaleString()}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Variants list selection */}
                  {selectedProduct && productVariants.length > 0 && (
                    <div className={`pt-4 border-t border-dashed space-y-3 ${isDark ? 'border-white/10' : 'border-gray-150'}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Select Variants to promote</p>
                        <p className={`text-[9px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{campaignConfig.selectedVariants.length > 0 ? `${campaignConfig.selectedVariants.length} selected` : 'None selected'}</p>
                      </div>
                      {loadingVariants ? (
                        <div className="space-y-2">
                          {[1, 2].map(i => <div key={i} className={`h-10 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />)}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {productVariants.map(variant => {
                            const checked = campaignConfig.selectedVariants.includes(variant.id);
                            return (
                              <label 
                                key={variant.id} 
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  checked 
                                    ? (isDark ? 'border-[#16A34A] bg-[#16A34A]/5 shadow-[0_2px_12px_rgba(16,185,129,0.04)]' : 'border-gray-400 bg-gray-50') 
                                    : (isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-55')
                                }`}
                              >
                                <div className="relative flex items-center">
                                  <input type="checkbox" checked={checked} onChange={() => toggleVariant(variant.id, variant.price)} className="peer sr-only" />
                                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                    checked ? 'bg-[#16A34A] border-[#16A34A]' : (isDark ? 'border-gray-650 bg-transparent' : 'border-gray-300 bg-white')
                                  }`}>
                                    {checked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{variant.sku || `Variant ID: ${variant.id}`}</p>
                                  <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{variant.stockQuantity ?? 0} in stock</p>
                                </div>
                                <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Rs. {(variant.price || 0).toLocaleString()}</p>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={`flex-shrink-0 px-5 py-4 border-t flex gap-3 ${
                  isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50'
                }`}>
                  <button onClick={closeCampaignFlow} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${isDark ? 'border-white/15 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
                  <button onClick={proceedToConfig} disabled={!selectedProduct} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 cursor-pointer ${isDark ? 'bg-[#16A34A] text-white hover:bg-[#059669]' : 'bg-gray-900 text-white hover:bg-black'}`}>
                    Continue →
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Configure Price */}
            {joinFlow === 2 && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Selected Product', value: selectedProduct.name, sub: campaignConfig.selectedVariants.length > 0 ? `${campaignConfig.selectedVariants.length} variants` : productVariants.length > 0 ? 'All variants' : 'Base listing' },
                      { label: 'Campaign Rule', value: selectedCampaign.name, sub: selectedCampaign.discountType ? (selectedCampaign.discountType === 'PERCENTAGE' ? `${selectedCampaign.discountValue}% OFF` : `Rs. ${selectedCampaign.discountValue} OFF`) : null },
                    ].map(s => (
                      <div key={s.label} className={`border rounded-xl p-3 ${isDark ? 'bg-[#111827] border-white/5' : 'bg-gray-50 border-gray-150'}`}>
                        <p className={`text-[8.5px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                        <p className={`text-[11px] font-black mt-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
                        {s.sub && <p className={`text-[9px] font-bold mt-0.5 ${isDark ? 'text-[#16A34A]' : 'text-[#152F17]'}`}>{s.sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Price reference message */}
                  <div className={`border rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest ${
                    isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-150 text-blue-700'
                  }`}>
                    {campaignConfig.selectedVariants.length > 0 ? `Max Variant base Price: Rs. ${maxPrice.toLocaleString()}` : `Base Price: Rs. ${maxPrice.toLocaleString()}`} — campaign price must be lower.
                  </div>

                  {/* Sale Price input */}
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Campaign Sale Price *</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Rs.</span>
                      <input
                        type="number"
                        value={campaignConfig.salePrice}
                        onChange={e => setCampaignConfig(prev => ({ ...prev, salePrice: e.target.value }))}
                        placeholder="Enter discount campaign price"
                        min="0" step="0.01"
                        className={`${inputCls} pl-10 ${campaignConfig.salePrice && !priceValid ? 'border-red-500 focus:border-red-600' : priceValid ? (isDark ? 'border-[#16A34A]' : 'border-emerald-400') : ''}`}
                      />
                    </div>
                    {campaignConfig.salePrice && (
                      <p className={`text-[10px] font-black tracking-wide ${priceValid ? (isDark ? 'text-[#16A34A]' : 'text-[#16A34A]') : (isDark ? 'text-red-400' : 'text-red-500')}`}>
                        {priceValid
                          ? `✓ Customer markdown savings: Rs. ${saving.toLocaleString()} (${savingPct}% off)`
                          : salePrice <= 0 ? 'Price must be greater than zero' : `Must be less than base price Rs. ${maxPrice.toLocaleString()}`}
                      </p>
                    )}
                  </div>

                  {/* Visual pricing comparison */}
                  {priceValid && (
                    <div className={`border rounded-xl p-3 grid grid-cols-3 gap-2 text-center transition-all ${
                      isDark ? 'bg-emerald-950/10 border-[#16A34A]/20' : 'bg-[#16A34A]/10 border-[#16A34A]/20'
                    }`}>
                      <div>
                        <p className={`text-[8.5px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>Base Price</p>
                        <p className={`text-xs font-black line-through ${isDark ? 'text-gray-650' : 'text-gray-500'}`}>Rs. {maxPrice.toLocaleString()}</p>
                      </div>
                      <div className={`flex items-center justify-center font-black ${isDark ? 'text-[#16A34A]' : 'text-[#e8f3e9]0'}`}>→</div>
                      <div>
                        <p className={`text-[8.5px] font-black uppercase tracking-widest ${isDark ? 'text-[#16A34A]' : 'text-[#16A34A]'}`}>Promo Price</p>
                        <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#152F17]'}`}>Rs. {salePrice.toLocaleString()}</p>
                      </div>
                      <div className={`col-span-3 border-t pt-2 mt-1 border-dashed ${isDark ? 'border-[#16A34A]/20' : 'border-[#16A34A]/20'}`}>
                        <p className={`text-[9.5px] font-black uppercase tracking-wider ${isDark ? 'text-[#16A34A]' : 'text-emerald-805'}`}>
                          Customer Discount: Rs. {saving.toLocaleString()} · {savingPct}% savings
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stock Limit config */}
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock Limit <span className="normal-case font-semibold tracking-normal opacity-70">— Optional</span></label>
                    <input
                      type="number"
                      value={campaignConfig.stockLimit}
                      onChange={e => setCampaignConfig(prev => ({ ...prev, stockLimit: e.target.value }))}
                      placeholder="e.g. 20 (Leave blank for infinite)"
                      min="1"
                      className={inputCls}
                    />
                    <p className={`text-[10px] font-semibold ${isDark ? 'text-gray-555' : 'text-gray-400'}`}>Limit count of items available at promotional rates.</p>
                  </div>

                  {/* Stock recommendation warning info */}
                  <div className={`border p-4 rounded-xl flex items-start gap-2.5 ${
                    isDark ? 'bg-amber-955/20 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-800'
                  }`}>
                    <Info size={16} className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-450' : 'text-amber-600'}`} />
                    <p className="text-[10px] font-semibold leading-normal">
                      We recommend maintaining a minimum inventory stock level of at least 10 units for promoted items to ensure optimal delivery fulfillment rates.
                    </p>
                  </div>
                </div>

                <div className={`flex-shrink-0 px-5 py-4 border-t flex gap-3 ${
                  isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-50'
                }`}>
                  <button onClick={() => setJoinFlow(1)} className={`flex items-center justify-center gap-1.5 px-4 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${isDark ? 'border-white/15 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-750 hover:bg-gray-105'}`}>
                    ← Back
                  </button>
                  <button
                    onClick={handleJoinCampaign}
                    disabled={joining || !priceValid}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer ${isDark ? 'bg-[#16A34A] text-white hover:bg-[#059669]' : 'bg-gray-900 text-white hover:bg-black'}`}
                  >
                    {joining ? (
                      <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Submitting…</>
                    ) : 'Confirm & Join Campaign'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCampaigns;
