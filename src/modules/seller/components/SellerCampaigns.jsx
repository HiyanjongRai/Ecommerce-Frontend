import React, { useEffect, useState, useCallback } from 'react';
import { getSellerCampaigns, getSellerProducts, getSellerProfile, joinSellerCampaign, getProductDetail } from '../services/sellerService';
import { normalizeList, resolveImageUrl } from './SellerSectionUtils';
import { toast } from '../../../shared/contexts/ToastContext';

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

const StatusBadge = ({ status }) => {
  const cfg = {
    active:   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500 animate-pulse', label: 'Active Now' },
    upcoming: { cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400',               label: 'Coming Soon' },
    ended:    { cls: 'bg-gray-100 text-gray-500 border-gray-200',         dot: 'bg-gray-400',                label: 'Ended' },
  };
  const c = cfg[status] || cfg.upcoming;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const ModalStep = ({ current }) => (
  <div className="flex items-center gap-1">
    {[1, 2].map((s, i) => {
      const isDone = current > s;
      const isActive = current === s;
      return (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-black transition-all ${
            isActive ? 'bg-gray-900 text-white' :
            isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'text-gray-400'
          }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
              isActive ? 'bg-white/20 text-white' :
              isDone   ? 'bg-emerald-200 text-emerald-700' :
              'bg-gray-100 text-gray-400'
            }`}>
              {isDone ? (
                <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              ) : s}
            </span>
            {s === 1 ? 'Select Product' : 'Set Price'}
          </div>
          {i === 0 && (
            <svg className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SellerCampaigns = () => {
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
      const userId = profileRes.data?.userId;
      if (userId) {
        const productRes = await getSellerProducts(userId);
        const active = normalizeList(productRes.data).filter(p => String(p.status).toUpperCase() === 'ACTIVE');
        setSellerProducts(active);
      }
    } catch {
      showToast('Failed to load products', 'error');
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
    if (!selectedProduct) { showToast('Select a product first', 'warning'); return; }
    if (productVariants.length > 0 && campaignConfig.selectedVariants.length === 0) {
      showToast('Select at least one variant', 'warning'); return;
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

  const inputCls = "w-full bg-white border border-gray-200 rounded-sm px-3 py-1.5 text-[11px] font-semibold text-gray-700 placeholder-gray-300 outline-none focus:border-gray-400 transition-all";

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="flex items-center gap-3 text-gray-400">
        <svg className="animate-spin w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-sm font-semibold">Loading campaigns…</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-[1400px]">

      {/* ── Page Header ── */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
        <h1 className="text-sm font-black text-gray-900 tracking-tight">Campaign Opportunities</h1>
        <p className="text-[11px] text-gray-400 font-medium mt-0.5">Join exclusive promotional campaigns to boost your sales visibility.</p>
      </div>

      {/* ── Stats Row ── */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Available',    value: campaigns.length,  positive: true },
            { label: 'Active Now',   value: activeCampaigns,   positive: true },
            { label: 'Coming Soon',  value: upcomingCampaigns, positive: true },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-sm shadow-sm p-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">{s.label}</h3>
                <div className="text-base font-black text-gray-900 leading-none">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Campaign Grid ── */}
      {campaigns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-10 text-center">
          <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
          </svg>
          <p className="text-xs font-semibold text-gray-500">No campaigns available</p>
          <p className="text-[10px] text-gray-400 mt-1">Admin campaigns will appear here when they go live.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {campaigns.map(campaign => {
            const image = resolveImageUrl(campaign.imagePath);
            const status = getCampaignStatus(campaign);
            const timer = getDaysRemaining(campaign);
            const progress = getProgressPct(campaign);
            const isEnded = status === 'ended';

            return (
              <div key={campaign.id} className={`bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${isEnded ? 'opacity-70' : ''}`}>

                {/* Banner */}
                <div className="relative h-28 overflow-hidden">
                  {image ? (
                    <img src={image} alt={campaign.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`h-full flex items-center justify-center ${
                      status === 'active' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
                      status === 'upcoming' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                      'bg-gradient-to-br from-gray-300 to-gray-400'
                    }`}>
                      <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  {campaign.discountType && campaign.discountValue && (
                    <div className="absolute top-2 left-2 bg-white/95 text-gray-900 px-2 py-0.5 rounded-sm text-[9px] font-black shadow-sm">
                      {campaign.discountType === 'PERCENTAGE' ? `${campaign.discountValue}% OFF` : `Rs. ${campaign.discountValue} OFF`}
                    </div>
                  )}
                  <div className="absolute top-2 right-2"><StatusBadge status={status} /></div>
                  {timer && !isEnded && (
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm ${
                        timer.type === 'ends' && timer.days <= 3 ? 'bg-red-600 text-white' :
                        timer.type === 'ends' ? 'bg-black/60 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {timer.type === 'ends' ? `${timer.days}d left` : `Starts in ${timer.days}d`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-3.5 flex flex-col flex-1 gap-2.5">
                  <div>
                    <h3 className="text-xs font-black text-gray-900">{campaign.name}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {campaign.description || 'Exclusive campaign to boost product visibility and drive more sales.'}
                    </p>
                  </div>

                  {status === 'active' && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
                        <span>Progress</span><span>{progress}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                    <div className="bg-gray-50 border border-gray-100 rounded-sm px-2.5 py-1.5">
                      <p className="font-black uppercase text-gray-400 mb-0.5">Start</p>
                      <p className="font-bold text-gray-700">{formatDate(campaign.startTime)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-sm px-2.5 py-1.5">
                      <p className="font-black uppercase text-gray-400 mb-0.5">End</p>
                      <p className="font-bold text-gray-700">{formatDate(campaign.endTime)}</p>
                    </div>
                  </div>

                  {campaign.discountType && (
                    <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-sm px-2.5 py-1.5">
                      <p className="text-[10px] font-semibold text-green-700">
                        {campaign.discountType === 'PERCENTAGE'
                          ? `Up to ${campaign.discountValue}% off for customers`
                          : `Rs. ${campaign.discountValue} off for customers`}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => startJoinCampaign(campaign)}
                    disabled={isEnded}
                    className={`mt-auto w-full py-1.5 px-3 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all ${
                      isEnded ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white'
                    }`}
                  >
                    {isEnded ? 'Campaign Ended' : 'Join This Campaign →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ── */}
      {joinFlow !== null && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" onClick={closeCampaignFlow} />
          <div className="relative bg-white rounded-sm shadow-2xl border border-gray-200 w-full max-w-md flex flex-col max-h-[88vh]">

            {/* Modal Header */}
            <div className="flex-shrink-0 px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-gray-900">Join Campaign</h2>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{selectedCampaign.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <ModalStep current={joinFlow} />
                <button onClick={closeCampaignFlow} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Step 1 */}
            {joinFlow === 1 && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Choose a product to enter in this campaign</p>

                  {loadingProducts ? (
                    <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-sm animate-pulse" />)}</div>
                  ) : sellerProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs font-semibold text-gray-500">No active products</p>
                      <p className="text-[10px] text-gray-400 mt-1">Add and activate a product first.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {sellerProducts.map(product => {
                        const isSelected = selectedProduct?.id === product.id;
                        return (
                          <button key={product.id} type="button" onClick={() => handleProductSelect(product)}
                            className={`w-full text-left flex items-center gap-3 p-2.5 rounded-sm border transition-all ${
                              isSelected ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 border ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                              {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-gray-800 truncate">{product.name}</p>
                              <p className="text-[9px] text-gray-400 font-medium">{product.stockQuantity ?? 0} in stock</p>
                            </div>
                            <p className="text-[11px] font-black text-gray-700 flex-shrink-0">Rs. {(product.price || 0).toLocaleString()}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedProduct && productVariants.length > 0 && (
                    <div className="pt-3 border-t border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Select Variants</p>
                        <p className="text-[9px] text-gray-400">{campaignConfig.selectedVariants.length > 0 ? `${campaignConfig.selectedVariants.length} selected` : 'Empty = all variants'}</p>
                      </div>
                      {loadingVariants ? (
                        <div className="space-y-1.5">{[1,2].map(i => <div key={i} className="h-8 bg-gray-100 rounded-sm animate-pulse" />)}</div>
                      ) : productVariants.map(variant => {
                        const checked = campaignConfig.selectedVariants.includes(variant.id);
                        return (
                          <label key={variant.id} className={`flex items-center gap-2.5 p-2.5 rounded-sm border cursor-pointer transition-colors ${checked ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:bg-gray-50/50'}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleVariant(variant.id, variant.price)} className="w-3.5 h-3.5 rounded-sm accent-gray-900" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-gray-800 truncate">{variant.sku || `Variant ${variant.id}`}</p>
                              <p className="text-[9px] text-gray-400">{variant.stockQuantity ?? 0} in stock</p>
                            </div>
                            <p className="text-[11px] font-black text-gray-700">Rs. {(variant.price || 0).toLocaleString()}</p>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50 flex gap-2.5">
                  <button onClick={closeCampaignFlow} className="flex-1 py-1.5 border border-gray-200 rounded-sm text-[10px] font-black text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                  <button onClick={proceedToConfig} disabled={!selectedProduct} className="flex-1 py-1.5 bg-gray-900 hover:bg-black text-white rounded-sm text-[10px] font-black uppercase tracking-wider disabled:opacity-40 transition-colors">
                    Continue →
                  </button>
                </div>
              </>
            )}

            {/* Step 2 */}
            {joinFlow === 2 && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">

                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Product', value: selectedProduct.name, sub: campaignConfig.selectedVariants.length > 0 ? `${campaignConfig.selectedVariants.length} variant(s)` : productVariants.length > 0 ? 'All variants' : 'Single product' },
                      { label: 'Campaign', value: selectedCampaign.name, sub: selectedCampaign.discountType ? (selectedCampaign.discountType === 'PERCENTAGE' ? `${selectedCampaign.discountValue}% off` : `Rs. ${selectedCampaign.discountValue} off`) : null },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-sm p-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{s.label}</p>
                        <p className="text-[11px] font-black text-gray-900 mt-0.5 truncate">{s.value}</p>
                        {s.sub && <p className="text-[9px] text-gray-500 font-medium">{s.sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Price reference */}
                  <div className="bg-blue-50 border border-blue-100 rounded-sm px-3 py-2 text-[10px] text-blue-700 font-semibold">
                    {campaignConfig.selectedVariants.length > 0 ? `Highest variant price: Rs. ${maxPrice.toLocaleString()}` : `Original price: Rs. ${maxPrice.toLocaleString()}`} — your campaign price must be lower.
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Campaign Sale Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rs.</span>
                      <input
                        type="number"
                        value={campaignConfig.salePrice}
                        onChange={e => setCampaignConfig(prev => ({ ...prev, salePrice: e.target.value }))}
                        placeholder="Enter discounted price"
                        min="0" step="0.01"
                        className={`${inputCls} pl-8 ${campaignConfig.salePrice && !priceValid ? 'border-red-400 focus:border-red-500' : priceValid ? 'border-emerald-400' : ''}`}
                      />
                    </div>
                    {campaignConfig.salePrice && (
                      <p className={`text-[10px] font-semibold ${priceValid ? 'text-green-600' : 'text-red-500'}`}>
                        {priceValid
                          ? `✓ Customer saves Rs. ${saving.toLocaleString()} (${savingPct}% off)`
                          : salePrice <= 0 ? 'Price must be greater than zero' : `Must be less than Rs. ${maxPrice.toLocaleString()}`}
                      </p>
                    )}
                  </div>

                  {/* Visual price comparison */}
                  {priceValid && (
                    <div className="bg-green-50 border border-green-200 rounded-sm p-2.5 grid grid-cols-3 gap-1 text-center">
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-400">Original</p>
                        <p className="text-xs font-black text-gray-500 line-through">Rs. {maxPrice.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-center text-green-500 font-black">→</div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-green-600">Campaign</p>
                        <p className="text-xs font-black text-green-700">Rs. {salePrice.toLocaleString()}</p>
                      </div>
                      <div className="col-span-3 border-t border-green-200 pt-1.5 mt-0.5">
                        <p className="text-[9px] font-black text-green-800">Customer saves Rs. {saving.toLocaleString()} · {savingPct}% discount</p>
                      </div>
                    </div>
                  )}

                  {/* Stock Limit */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">Stock Limit <span className="normal-case text-gray-400 font-medium tracking-normal">— Optional</span></label>
                    <input
                      type="number"
                      value={campaignConfig.stockLimit}
                      onChange={e => setCampaignConfig(prev => ({ ...prev, stockLimit: e.target.value }))}
                      placeholder="Leave blank for no limit"
                      min="1"
                      className={inputCls}
                    />
                    <p className="text-[9px] text-gray-400 font-medium">Cap how many units are available at the campaign price.</p>
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-50 border border-amber-100 rounded-sm px-3 py-2 flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                    <p className="text-[10px] text-amber-700 font-semibold">Make sure your product has at least 10 units in stock before joining.</p>
                  </div>
                </div>

                <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50 flex gap-2.5">
                  <button onClick={() => setJoinFlow(1)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-sm text-[10px] font-black text-gray-600 hover:bg-gray-100 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={handleJoinCampaign}
                    disabled={joining || !priceValid}
                    className="flex-1 py-1.5 bg-gray-900 hover:bg-black disabled:opacity-40 text-white rounded-sm text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    {joining ? (
                      <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Submitting…</>
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
