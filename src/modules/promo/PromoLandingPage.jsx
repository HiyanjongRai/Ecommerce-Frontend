import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { getProducts } from '../../shared/api/customerApi';
import { getHomepageCampaigns, getHomepageCampaign } from '../home/services/homepageService';
import ProductCard from '../product/components/ProductCard';
import apiClient from '../../shared/api/apiClient';

const PromoLandingPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterInfo, setFilterInfo] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [copyStatus, setCopyStatus] = useState('Copy');
  const [claimed, setClaimed] = useState(184);
  const location = useLocation();
  const isCampaignRoute = location.pathname === '/promo/campaign';

  const totalSlots = 500;
  const remainingSlots = Math.max(0, totalSlots - claimed);
  const claimedPercent = Math.round((claimed / totalSlots) * 100);

  const promoCodeParam = searchParams.get('code') || searchParams.get('promo');
  const campaignId = searchParams.get('campaign');

  const updateCountdownValues = useCallback(() => {
    const endDate = filterInfo?.endDate ? new Date(filterInfo.endDate).getTime() : null;
    if (!endDate) {
      setTimeRemaining(null);
      return;
    }

    const now = Date.now();
    const diff = Math.max(0, endDate - now);
    if (diff <= 0) {
      setTimeRemaining('EXPIRED');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    setTimeRemaining({ days, hours, minutes, seconds });
  }, [filterInfo?.endDate]);

  useEffect(() => {
    updateCountdownValues();
    const interval = setInterval(updateCountdownValues, 1000);
    return () => clearInterval(interval);
  }, [updateCountdownValues]);

  useEffect(() => {
    const timer = setInterval(() => {
      setClaimed((prev) => {
        const increment = Math.max(1, Math.floor(Math.random() * 3));
        return Math.min(totalSlots, prev + increment);
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const loadPromoData = useCallback(async () => {
    setLoading(true);
    try {
      let info = null;
      let res;

      if (promoCodeParam) {
        try {
          const activeRes = await apiClient.get('/promos/active');
          const activePromos = Array.isArray(activeRes.data) ? activeRes.data : [];
          const promo = activePromos.find((item) => String(item.code || item.promoCode || item.couponCode).toUpperCase() === String(promoCodeParam).toUpperCase());

          info = {
            type: 'PROMO',
            code: promoCodeParam.toUpperCase(),
            title: promo?.title || `Flash promo ${promoCodeParam.toUpperCase()}`,
            discount: promo?.discountValue ?? promo?.discount ?? 25,
            discountType: promo?.discountType ?? promo?.type ?? 'PERCENTAGE',
            minOrder: promo?.minOrderValue ?? promo?.minOrder ?? 1499,
            endDate: promo?.endDate || promo?.expiryDate || new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
            eligibleCategories: promo?.categories || promo?.eligibleCategories || ['Home', 'Fashion', 'Electronics'],
            description: promo?.description || 'Use this code for exclusive savings on selected items.',
            usageLimit: promo?.usageLimit || '500 uses total',
          };
        } catch (error) {
          info = {
            type: 'PROMO',
            code: promoCodeParam.toUpperCase(),
            title: `Flash promo ${promoCodeParam.toUpperCase()}`,
            discount: 25,
            discountType: 'PERCENTAGE',
            minOrder: 1499,
            endDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
            eligibleCategories: ['Home', 'Fashion', 'Electronics'],
            description: 'Apply this code at checkout to get instant savings.',
            usageLimit: '500 uses total',
          };
        }
        res = await getProducts({ page: 0, size: 12 });
      } else if (campaignId || isCampaignRoute) {
        let campaign = null;
        if (campaignId) {
          campaign = await getHomepageCampaign(campaignId);
        }

        if (!campaign) {
          try {
            const homepageCampaignList = await getHomepageCampaigns();
            setCampaigns(Array.isArray(homepageCampaignList) ? homepageCampaignList : []);
            campaign = Array.isArray(homepageCampaignList) ? homepageCampaignList[0] : null;
          } catch (error) {
            console.error('Failed to load homepage campaigns:', error);
            campaign = null;
          }
        }

        info = {
          type: 'CAMPAIGN',
          code: campaign?.campaignCode || campaign?.code || campaign?.campaignName || 'CAMPAIGN',
          title: campaign?.campaignName || campaign?.name || 'Featured Campaign',
          discount: campaign?.discountValue ?? campaign?.discount ?? 40,
          discountType: campaign?.discountType ?? campaign?.type ?? 'PERCENTAGE',
          endDate: campaign?.endDate || campaign?.endTime || new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
          eligibleCategories: campaign?.categories || campaign?.eligibleCategories || ['Home', 'Fashion', 'Electronics'],
          description: campaign?.description || 'Limited time campaign deals.',
          usageLimit: campaign?.usageLimit || '500 uses total',
        };

        if (campaign?.id || campaign?.campaignId) {
          try {
            const campaignProducts = await apiClient.get(`/campaigns/${campaign?.id || campaign?.campaignId}/products`);
            res = { data: { content: Array.isArray(campaignProducts.data) ? campaignProducts.data : [] } };
          } catch (error) {
            res = await getProducts({ page: 0, size: 12 });
          }
        } else {
          res = await getProducts({ page: 0, size: 12 });
        }
      } else {
        try {
          const activeRes = await apiClient.get('/promos/active');
          const activePromos = Array.isArray(activeRes.data) ? activeRes.data : [];
          if (activePromos.length > 0) {
            const promo = activePromos[0];
            info = {
              type: 'PROMO',
              code: promo.code || promo.promoCode || promo.couponCode || 'HIYAN',
              title: promo?.title || `Flash promo ${(promo.code || promo.promoCode || promo.couponCode || 'HIYAN').toUpperCase()}`,
              discount: promo?.discountValue ?? promo?.discount ?? 25,
              discountType: promo?.discountType ?? promo?.type ?? 'PERCENTAGE',
              minOrder: promo?.minOrderValue ?? promo?.minOrder ?? 1499,
              endDate: promo?.endDate || promo?.expiryDate || new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
              eligibleCategories: promo?.categories || promo?.eligibleCategories || ['Home', 'Fashion', 'Electronics'],
              description: promo?.description || 'Use this code for exclusive savings on selected items.',
              usageLimit: promo?.usageLimit || '500 uses total',
            };
          }
        } catch (error) {
          console.error('Failed to load active promos:', error);
        }
        res = await getProducts({ page: 0, size: 12 });
      }

      if (!info) {
        info = {
          type: 'PROMO',
          code: 'HIYAN',
          title: 'Special Summer Promo',
          discount: 25,
          discountType: 'PERCENTAGE',
          minOrder: 1499,
          endDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
          eligibleCategories: ['Home', 'Fashion', 'Electronics'],
          description: 'Apply this code at checkout to get instant savings.',
          usageLimit: '500 uses total',
        };
      }

      setFilterInfo(info);
      const raw = res.data?.content || res.data || [];
      setProducts(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Failed to load promo products:', error);
      setProducts([]);
      setFilterInfo({
        type: 'PROMO',
        code: promoCodeParam ? promoCodeParam.toUpperCase() : 'HIYAN',
        title: 'Flash promo',
        discount: 25,
        discountType: 'PERCENTAGE',
        endDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        eligibleCategories: ['Home', 'Fashion', 'Electronics'],
        description: 'Apply the code at checkout to get exclusive savings.',
        usageLimit: '500 uses total',
      });
    } finally {
      setLoading(false);
    }
  }, [promoCodeParam, campaignId, isCampaignRoute]);

  useEffect(() => {
    loadPromoData();
  }, [loadPromoData]);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#111] font-sans">

      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-screen-xl mx-auto">
          <div id="promo-banner" className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111] text-[#fff] px-5 py-4 rounded-[18px]">
            <div className="flex items-center gap-3 text-sm text-[#9c9c9c]">
              <span className="w-2 h-2 rounded-full bg-[#2d7a2d] block" />
              <span>Promo is live now - <strong className="text-[#fff] font-medium">Limited to first 500 orders</strong></span>
            </div>
            <button type="button" className="text-[#fff] p-2 rounded-full border border-[#222]" onClick={() => document.getElementById('promo-banner')?.remove()}>
              <i className="ti ti-x"></i>
            </button>
          </div>
        </div>
      </div>

      <section className="bg-[#111] text-[#fff] py-14 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="max-w-[640px] mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#222] rounded-full text-[#2d7a2d] text-sm">
              <i className="ti ti-bolt"></i>
              <span>Flash promo - summer 2025</span>
            </div>

          <h1 className="mt-8 text-[2.6rem] sm:text-[3.75rem] font-medium leading-[0.96] tracking-[-0.04em]">
            Save up to <span className="text-[#2d7a2d]">60% today only</span>
          </h1>

          <p className="mt-5 text-[#9c9c9c] text-base leading-7 max-w-[520px]">
            Shop top deals with the promo code below. Limited slots available for selected categories - act fast before this offer disappears.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {['days', 'hours', 'minutes', 'seconds'].map((unit, index) => (
              <React.Fragment key={unit}>
                {index > 0 && <span className="text-[#9c9c9c] text-xl font-medium">:</span>}
                <div className="min-w-[86px] rounded-[16px] bg-[#111] border border-[#222] px-4 py-4 text-center">
                  <div className="text-[1.55rem] font-medium text-[#fff]">
                    {unit === 'days' && String(timeRemaining?.days ?? 0).padStart(2, '0')}
                    {unit === 'hours' && String(timeRemaining?.hours ?? 0).padStart(2, '0')}
                    {unit === 'minutes' && String(timeRemaining?.minutes ?? 0).padStart(2, '0')}
                    {unit === 'seconds' && String(timeRemaining?.seconds ?? 0).padStart(2, '0')}
                  </div>
                  <div className="text-[#9c9c9c] text-[0.72rem] uppercase tracking-[0.16em] mt-2">{unit}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="mt-10 border border-[#2d7a2d] rounded-[18px] bg-[#111] p-5 grid gap-4 sm:grid-cols-[1.6fr_auto] items-center">
            <div>
              <p className="text-[#9c9c9c] text-sm uppercase tracking-[0.18em]">{filterInfo?.type === 'CAMPAIGN' ? 'Campaign code' : 'Your promo code'}</p>
              <p className="mt-3 font-mono text-[2.2rem] tracking-[0.42em] text-[#fff]">{filterInfo?.code || (filterInfo?.type === 'CAMPAIGN' ? 'CAMPAIGN' : 'HIYAN')}</p>
              <p className="mt-3 text-[#2d7a2d] text-sm">
                Save {filterInfo?.discountType === 'PERCENTAGE' ? `${filterInfo?.discount}%` : `Rs. ${filterInfo?.discount}`} - expires {filterInfo?.endDate ? new Date(filterInfo.endDate).toLocaleDateString() : '30 Jun 2025'}
              </p>
            </div>
            <button
              type="button"
              className="bg-[#2d7a2d] rounded-[14px] px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-white"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(filterInfo?.code || 'HIYAN');
                  setCopyStatus('Copied!');
                  setTimeout(() => setCopyStatus('Copy'), 2000);
                } catch (err) {
                  setCopyStatus('Copy');
                }
              }}
            >
              {copyStatus}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[#9c9c9c] text-sm">
            <div className="flex items-center gap-3">
              <i className="ti ti-calendar text-[#2d7a2d] text-lg"></i>
              <span>Expiry {filterInfo?.endDate ? new Date(filterInfo.endDate).toLocaleDateString() : '30 Jun 2025'}</span>
            </div>
            <div className="flex items-center gap-3">
              <i className="ti ti-users text-[#2d7a2d] text-lg"></i>
              <span>{filterInfo?.usageLimit || '500 uses total'}</span>
            </div>
            <div className="flex items-center gap-3">
              <i className="ti ti-box text-[#2d7a2d] text-lg"></i>
              <span>{filterInfo?.eligibleCategories?.join(', ') || 'Home, fashion, electronics'}</span>
            </div>
          </div>
          </div>
        </div>
      </section>

      <main className="px-4 sm:px-6 pb-16">
        <div className="max-w-screen-xl mx-auto space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 bg-[#111] border border-[#222] rounded-[18px] overflow-hidden text-center text-white">
            <div className="px-6 py-6">
              <p className="text-[1.9rem] font-medium">500</p>
              <p className="text-[#9c9c9c] text-sm mt-2">Total uses</p>
            </div>
            <div className="px-6 py-6 border-t border-[#222] sm:border-t-0 sm:border-l sm:border-r border-[#222]">
              <p className="text-[1.9rem] font-medium">{claimed}</p>
              <p className="text-[#9c9c9c] text-sm mt-2">Claimed count</p>
            </div>
            <div className="px-6 py-6">
              <p className="text-[1.9rem] font-medium">{remainingSlots}</p>
              <p className="text-[#9c9c9c] text-sm mt-2">Remaining slots</p>
            </div>
          </div>

          <section className="space-y-6">
            <div className="bg-white border border-[#d8d8d8] rounded-[18px] p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-sm font-medium text-[#111]">Promo slots claimed</p>
                <p className="flex items-center gap-2 text-[#d32f2f] font-medium text-sm">
                  <i className="ti ti-flame"></i>
                  Only {remainingSlots} left!
                </p>
              </div>
              <div className="mt-5 bg-[#ebebeb] h-3 rounded-full overflow-hidden">
                <div className="h-full bg-[#2d7a2d]" style={{ width: `${claimedPercent}%` }} />
              </div>
              <p className="text-[#7d7d7d] text-[0.95rem] mt-4">{claimed} of {totalSlots} promo slots claimed so far.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white border border-[#d8d8d8] rounded-[18px] p-5 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-[14px] bg-[#2d7a2d] flex items-center justify-center text-white text-lg">
                  <i className="ti ti-percent"></i>
                </div>
                <div>
                  <p className="text-[#111] font-medium text-sm">Discount details</p>
                  <p className="text-[#7d7d7d] text-sm mt-1">Redeem the code for instant savings across selected items.</p>
                </div>
              </div>
              <div className="bg-white border border-[#d8d8d8] rounded-[18px] p-5 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-[14px] bg-[#d32f2f] flex items-center justify-center text-white text-lg">
                  <i className="ti ti-clock"></i>
                </div>
                <div>
                  <p className="text-[#111] font-medium text-sm">Expiry urgency</p>
                  <p className="text-[#7d7d7d] text-sm mt-1">The promo is limited and will end once the countdown reaches zero.</p>
                </div>
              </div>
              <div className="bg-white border border-[#d8d8d8] rounded-[18px] p-5 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-[14px] bg-[#2d7a2d] flex items-center justify-center text-white text-lg">
                  <i className="ti ti-truck"></i>
                </div>
                <div>
                  <p className="text-[#111] font-medium text-sm">Free shipping</p>
                  <p className="text-[#7d7d7d] text-sm mt-1">Orders above Rs. 1,499 qualify for free delivery.</p>
                </div>
              </div>
              <div className="bg-white border border-[#d8d8d8] rounded-[18px] p-5 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-[14px] bg-[#111] flex items-center justify-center text-white text-lg">
                  <i className="ti ti-arrow-back-up"></i>
                </div>
                <div>
                  <p className="text-[#111] font-medium text-sm">Easy returns</p>
                  <p className="text-[#7d7d7d] text-sm mt-1">Return eligible items within 14 days with no hassle.</p>
                </div>
              </div>
            </div>
          </section>

          {isCampaignRoute && campaigns.length > 0 && (
            <section className="space-y-4 bg-white border border-[#d8d8d8] rounded-[18px] p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#7d7d7d]">Available campaigns</p>
                  <h2 className="text-2xl font-semibold text-[#111] mt-2">Pick an active campaign</h2>
                </div>
                <Link className="text-[#2d7a2d] font-medium uppercase text-sm tracking-[0.12em]" to="/promo/landing">
                  View promo landing
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.slice(0, 3).map((campaign) => {
                  const campaignLabel = campaign.campaignName || campaign.name || `Campaign ${campaign.id || campaign.campaignId}`;
                  return (
                    <Link
                      key={campaign.id || campaign.campaignId || campaignLabel}
                      to={`/promo/campaign?campaign=${campaign.id || campaign.campaignId}`}
                      className="block rounded-[18px] border border-[#e5e5e5] p-5 transition hover:shadow-lg hover:border-[#2d7a2d]"
                    >
                      <p className="text-sm uppercase tracking-[0.18em] text-[#2d7a2d]">{campaign.type || 'Campaign'}</p>
                      <p className="mt-3 text-lg font-semibold text-[#111]">{campaignLabel}</p>
                      <p className="mt-2 text-sm text-[#6e6e6e] line-clamp-3">{campaign.description || 'Shop featured campaign deals and unlock special pricing.'}</p>
                      <p className="mt-4 text-sm text-[#111] font-medium">Save {campaign.discountValue ?? campaign.discount ?? 40}%</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#7d7d7d]">{filterInfo?.type === 'CAMPAIGN' ? 'Campaign' : 'Products'}</p>
                <h2 className="text-3xl font-medium text-[#111] mt-2">{filterInfo?.type === 'CAMPAIGN' ? 'Campaign products to shop now' : 'Promo products to shop now'}</h2>
              </div>
              <Link className="text-[#2d7a2d] font-medium uppercase text-sm tracking-[0.12em]" to="/">
                View all
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {products.slice(0, 3).map((product) => {
                const id = product.id || product.productId || product.sku || product.name;

                return (
                  <ProductCard
                    key={id}
                    product={product}
                  />
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-[#d8d8d8] rounded-[18px] p-6">
            <div className="flex items-center gap-3 text-[#111] font-medium text-sm">
              <i className="ti ti-info-circle"></i>
              <span>Terms & conditions</span>
            </div>
            <ul className="mt-4 space-y-3 text-[#7d7d7d] text-[11px]">
              <li className="flex items-start gap-3"><i className="ti ti-check text-[#2d7a2d] mt-1"></i>Promo valid only on selected categories and eligible products.</li>
              <li className="flex items-start gap-3"><i className="ti ti-check text-[#2d7a2d] mt-1"></i>Use the code at checkout to get the discount.</li>
              <li className="flex items-start gap-3"><i className="ti ti-check text-[#2d7a2d] mt-1"></i>One use per customer; slots may fill quickly.</li>
              <li className="flex items-start gap-3"><i className="ti ti-check text-[#2d7a2d] mt-1"></i>Free shipping on orders over Rs. 1,499 for eligible items.</li>
              <li className="flex items-start gap-3"><i className="ti ti-check text-[#2d7a2d] mt-1"></i>Returns accepted within 14 days on most promo purchases.</li>
            </ul>
          </section>

          <section className="bg-[#111] rounded-[18px] p-6 grid gap-6 md:grid-cols-[1fr_auto] items-center">
            <div>
              <p className="text-white text-xl font-medium">Use code {filterInfo?.code || 'HIYAN'} at checkout</p>
              <p className="text-[#9c9c9c] text-sm mt-2">Shop selected deals and lock in the discount before the promo ends.</p>
            </div>
            <button className="inline-flex items-center gap-2 bg-[#2d7a2d] text-white text-sm font-medium uppercase tracking-[0.12em] rounded-xl px-5 py-3">
              <i className="ti ti-shopping-bag"></i>
              Shop now
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PromoLandingPage;
