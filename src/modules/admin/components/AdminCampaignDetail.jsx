import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Package, Tag,
  Megaphone, Calendar, Clock
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { BASE_URL } from '../../../shared/api/apiConfig';
import {
  getAdminCampaignProducts,
  getAdminCampaignPendingProducts,
  approveAdminCampaignProduct,
  rejectAdminCampaignProduct,
  getAdminCampaigns,
} from '../services/adminService';

const date = v => v ? new Date(v).toLocaleDateString() : 'N/A';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.includes('/') || url.includes('\\')) {
    const fileName = url.split(/[/\\]/).pop();
    return `${BASE_URL}/api/campaigns/image/${fileName}`;
  }
  return url.startsWith('/') ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
};

export default function AdminCampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { darkMode, themeClasses } = useAdminTheme();

  const [campaign, setCampaign] = useState(null);
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [working, setWorking] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Load campaign and products ────────────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const campaignsRes = await getAdminCampaigns();
      const campaigns = Array.isArray(campaignsRes.data) ? campaignsRes.data : [];
      const foundCampaign = campaigns.find(c => (c.id || c.campaignId) === parseInt(campaignId));
      
      if (foundCampaign) {
        setCampaign(foundCampaign);
        
        setProductsLoading(true);
        try {
          const [approvedRes, pendingRes] = await Promise.all([
            getAdminCampaignProducts(parseInt(campaignId)),
            getAdminCampaignPendingProducts(parseInt(campaignId)),
          ]);
          setApprovedProducts(Array.isArray(approvedRes.data) ? approvedRes.data : []);
          setPendingProducts(Array.isArray(pendingRes.data) ? pendingRes.data : []);
        } catch {
          showToast('❌ Failed to load products');
        } finally {
          setProductsLoading(false);
        }
      } else {
        showToast('❌ Campaign not found');
        navigate('/admin/campaigns');
      }
    } catch {
      showToast('❌ Failed to load campaign');
      navigate('/admin/campaigns');
    } finally {
      setLoading(false);
    }
  }, [campaignId, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Approve / Reject product ───────────────────────────────── */
  const handleProductAction = async (productCampaignId, action) => {
    setWorking(productCampaignId);
    try {
      if (action === 'approve') {
        await approveAdminCampaignProduct(productCampaignId);
        const moved = pendingProducts.find(p => (p.id || p.productCampaignId) === productCampaignId);
        if (moved) {
          setPendingProducts(prev => prev.filter(p => (p.id || p.productCampaignId) !== productCampaignId));
          setApprovedProducts(prev => [...prev, { ...moved, approved: true }]);
        }
        showToast('✅ Product approved into campaign');
      } else {
        await rejectAdminCampaignProduct(productCampaignId);
        setPendingProducts(prev => prev.filter(p => (p.id || p.productCampaignId) !== productCampaignId));
        showToast('✅ Product rejected from campaign');
      }
    } catch {
      showToast(`❌ Failed to ${action} product`);
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout
        pageTitle="Loading..."
        pageSubtitle="Campaign Details"
        headerActions={
          <button
            onClick={() => navigate('/admin/campaigns')}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors ${themeClasses.button.outline}`}
          >
            <ArrowLeft size={14} /> Back
          </button>
        }
      >
        <div className={`p-6 transition-colors ${themeClasses.bg.primary}`}>
          <div className="animate-pulse space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className={`h-32 rounded-[20px] transition-colors ${themeClasses.bg.secondary}`} />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!campaign) {
    return (
      <AdminLayout
        pageTitle="Campaign Not Found"
        pageSubtitle="The requested campaign could not be found"
        headerActions={
          <button
            onClick={() => navigate('/admin/campaigns')}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors ${themeClasses.button.outline}`}
          >
            <ArrowLeft size={14} /> Back
          </button>
        }
      >
        <div className={`p-6 text-center transition-colors ${themeClasses.bg.primary}`}>
          <Megaphone size={48} className={`mx-auto mb-4 transition-colors ${themeClasses.text.tertiary}`} />
          <p className={`transition-colors ${themeClasses.text.secondary}`}>Campaign not found</p>
        </div>
      </AdminLayout>
    );
  }

  const now = Date.now();
  const start = campaign.startTime ? new Date(campaign.startTime).getTime() : 0;
  const end = campaign.endTime ? new Date(campaign.endTime).getTime() : Infinity;
  let campaignStatus;
  if (now < start) campaignStatus = { label: 'UPCOMING', color: themeClasses.status.info };
  else if (now > end) campaignStatus = { label: 'ENDED', color: themeClasses.status.pending };
  else campaignStatus = { label: 'ACTIVE', color: themeClasses.status.success };

  return (
    <AdminLayout
      pageTitle={campaign.name}
      pageSubtitle="Campaign Details & Product Management"
      headerActions={
        <button
          onClick={() => navigate('/admin/campaigns')}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors ${themeClasses.button.outline}`}
        >
          <ArrowLeft size={14} /> Back to Campaigns
        </button>
      }
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-[20px] shadow-2xl border transition-all ${themeClasses.bg.secondary} ${themeClasses.border.accent} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      <div className="p-4 lg:p-6 space-y-6">
        {/* Back Button Link */}
        <div>
          <button
            onClick={() => navigate('/admin/campaigns')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors ${themeClasses.button.outline}`}
          >
            <ArrowLeft size={14} /> Back to Campaigns
          </button>
        </div>

        {/* ── Campaign Overview Card ────────────────────────────────── */}
        <div className={`rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border overflow-hidden transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className={`px-6 py-5 border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className={`text-xl font-black tracking-tight transition-colors ${themeClasses.text.primary}`}>
                  {campaign.name}
                </h2>
                {campaign.description && (
                  <p className={`text-xs mt-2 max-w-2xl font-semibold transition-colors ${themeClasses.text.secondary}`}>
                    {campaign.description}
                  </p>
                )}
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${campaignStatus.color}`}>
                {campaignStatus.label}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Start Date */}
            <div className="space-y-1">
              <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>
                Start Date
              </p>
              <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${themeClasses.text.primary}`}>
                <Calendar size={14} className="text-emerald-600" />
                <span>{date(campaign.startTime)}</span>
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>
                End Date
              </p>
              <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${themeClasses.text.primary}`}>
                <Clock size={14} className="text-amber-600" />
                <span>{date(campaign.endTime)}</span>
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-1">
              <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>
                Discount
              </p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border transition-colors ${themeClasses.status.info}`}>
                <Tag size={10} />
                {campaign.discountType === 'PERCENTAGE' ? `${campaign.discountValue}%` : `Rs. ${campaign.discountValue}`}
              </span>
            </div>

            {/* Total Products */}
            <div className="space-y-1">
              <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>
                Total Products
              </p>
              <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${themeClasses.text.primary}`}>
                <Package size={14} className="text-blue-600" />
                <span className="text-sm font-black">{campaign.totalProducts ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Products Section ──────────────────────────────────────── */}
        <div className={`rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border overflow-hidden transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          {/* Tab Bar */}
          <div className={`flex border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
            {[
              { id: 'pending', label: 'Pending Review', icon: Megaphone, count: pendingProducts.length },
              { id: 'approved', label: 'Approved', icon: CheckCircle, count: approvedProducts.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 border-b-2 -mb-px transition-all duration-200 flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-wider cursor-pointer ${
                    isActive
                      ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                      : `border-transparent ${themeClasses.text.secondary} hover:${themeClasses.text.primary} hover:${themeClasses.bg.secondary}`
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-600'
                      : `${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-4 lg:p-6">
            {productsLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`rounded-xl p-4 animate-pulse transition-colors ${themeClasses.bg.secondary}`}>
                    <div className="flex gap-4">
                      <div className={`w-16 h-16 rounded-xl flex-shrink-0 transition-colors ${themeClasses.bg.tertiary}`} />
                      <div className="flex-1 space-y-2">
                        <div className={`h-4 rounded w-2/3 transition-colors ${themeClasses.bg.tertiary}`} />
                        <div className={`h-3 rounded w-1/2 transition-colors ${themeClasses.bg.tertiary}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'pending' ? (
              pendingProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className={`p-4 rounded-xl mb-3 transition-colors ${themeClasses.bg.secondary}`}>
                    <Megaphone size={36} className={`transition-colors ${themeClasses.text.tertiary}`} />
                  </div>
                  <p className={`font-bold text-xs transition-colors ${themeClasses.text.secondary}`}>No Pending Products</p>
                  <p className={`text-[10px] font-semibold mt-1 transition-colors ${themeClasses.text.tertiary}`}>All product submissions have been reviewed</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingProducts.map(p => {
                    const pId = p.id || p.productId || p.productCampaignId;
                    return (
                      <ProductCard
                        key={pId}
                        product={p}
                        campaign={campaign}
                        status="pending"
                        onApprove={() => handleProductAction(pId, 'approve')}
                        onReject={() => handleProductAction(pId, 'reject')}
                        isWorking={working === pId}
                        themeClasses={themeClasses}
                        darkMode={darkMode}
                      />
                    );
                  })}
                </div>
              )
            ) : (
              approvedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className={`p-4 rounded-xl mb-3 transition-colors ${themeClasses.bg.secondary}`}>
                    <CheckCircle size={36} className={`transition-colors ${themeClasses.text.tertiary}`} />
                  </div>
                  <p className={`font-bold text-xs transition-colors ${themeClasses.text.secondary}`}>No Approved Products</p>
                  <p className={`text-[10px] font-semibold mt-1 transition-colors ${themeClasses.text.tertiary}`}>Products will appear here once approved</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedProducts.map(p => {
                    const pId = p.id || p.productId || p.productCampaignId;
                    return (
                      <ProductCard
                        key={pId}
                        product={p}
                        campaign={campaign}
                        status="approved"
                        themeClasses={themeClasses}
                        darkMode={darkMode}
                      />
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ─── Product Card Component ───────────────────────────────────── */
function ProductCard({ product, campaign, status, onApprove, onReject, isWorking, themeClasses, darkMode }) {
  const getProductImage = () => {
    if (product.productImage) {
      return resolveImageUrl(product.productImage);
    }
    if (product.imagePaths && product.imagePaths.length > 0) {
      return resolveImageUrl(product.imagePaths[0]);
    }
    if (product.imagePath) {
      return resolveImageUrl(product.imagePath);
    }
    if (product.mainImage) {
      return resolveImageUrl(product.mainImage);
    }
    if (product.image) {
      return resolveImageUrl(product.image);
    }
    return null;
  };

  const imageUrl = getProductImage();

  return (
    <div className={`rounded-[20px] overflow-hidden border-l-4 border transition-all duration-200 ${themeClasses.card} ${themeClasses.border.primary} ${
      status === 'pending'
        ? 'border-l-amber-500 hover:shadow-[0_8px_30px_rgba(245,158,11,0.04)]'
        : 'border-l-emerald-500 hover:shadow-[0_8px_30px_rgba(16,185,129,0.04)]'
    }`}>
      <div className="p-4 flex gap-4">
        {/* Product Image */}
        <div className={`w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border transition-colors ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.productName || product.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Package size={20} className={`transition-colors ${themeClasses.text.tertiary}`} />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className={`font-bold text-xs truncate transition-colors ${themeClasses.text.primary}`}>
                {product.productName || product.name}
              </p>
              <p className={`text-[10px] font-semibold mt-0.5 transition-colors ${themeClasses.text.secondary}`}>
                <span className={`transition-colors ${themeClasses.text.tertiary}`}>Seller: </span>
                <span className="font-bold">{product.storeName || product.sellerName || '—'}</span>
              </p>
            </div>
            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full whitespace-nowrap border transition-colors ${
              status === 'pending'
                ? themeClasses.status.warning
                : themeClasses.status.success
            }`}>
              {status === 'pending' ? '⏳ Pending' : '✓ Approved'}
            </span>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <span className={`text-[9px] font-black uppercase tracking-wide block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>
                Original
              </span>
              <p className={`font-bold text-[11px] transition-colors ${themeClasses.text.primary}`}>
                Rs. {product.originalPrice?.toLocaleString() || '—'}
              </p>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-wide block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>
                Campaign
              </span>
              <p className="font-black text-[11px] text-emerald-600">
                Rs. {product.salePrice?.toLocaleString() || '—'}
              </p>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-wide block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>
                Stock
              </span>
              <p className={`font-bold text-[11px] transition-colors ${themeClasses.text.primary}`}>
                {product.stockLimit || '—'}
              </p>
            </div>
          </div>

          {/* Actions */}
          {status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                disabled={isWorking}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 transition-colors cursor-pointer"
              >
                <CheckCircle size={12} />
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={isWorking}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 transition-colors cursor-pointer"
              >
                <XCircle size={12} />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


