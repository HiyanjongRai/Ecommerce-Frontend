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
  // If it's already an absolute URL (http, https, data), use as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // If it's a relative file path like "campaigns/filename.png", serve through API endpoint
  if (url.includes('/') || url.includes('\\')) {
    const fileName = url.split(/[/\\]/).pop(); // Extract filename from path
    return `${BASE_URL}/api/campaigns/image/${fileName}`;
  }
  // Fallback to BASE_URL + path
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
  const [activeTab, setActiveTab] = useState('pending'); // Start with pending

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── Load campaign and products ────────────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all campaigns and find the one with matching ID
      const campaignsRes = await getAdminCampaigns();
      const campaigns = Array.isArray(campaignsRes.data) ? campaignsRes.data : [];
      const foundCampaign = campaigns.find(c => (c.id || c.campaignId) === parseInt(campaignId));
      
      if (foundCampaign) {
        setCampaign(foundCampaign);
        
        // Load products
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
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
        }
      >
        <div className={`p-6 transition-colors ${themeClasses.bg.primary}`}>
          <div className="animate-pulse space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className={`h-32 rounded-xl transition-colors ${themeClasses.bg.secondary}`} />
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
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-colors"
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
          className="flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-colors hover:bg-opacity-50"
        >
          <ArrowLeft size={14} /> Back to Campaigns
        </button>
      }
    >
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900/90 backdrop-blur-md text-white text-sm font-bold px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className={`p-6 space-y-6 transition-colors ${themeClasses.bg.primary}`}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/campaigns')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border transition-colors ${
            darkMode
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ArrowLeft size={14} /> Back to Campaigns
        </button>

        {/* ── Campaign Overview Card ────────────────────────────────── */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          <div className={`px-6 py-5 border-b transition-colors ${themeClasses.bg.secondary}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className={`text-2xl font-black transition-colors ${themeClasses.text.primary}`}>
                  {campaign.name}
                </h2>
                {campaign.description && (
                  <p className={`text-sm mt-2 max-w-2xl transition-colors ${themeClasses.text.secondary}`}>
                    {campaign.description}
                  </p>
                )}
              </div>
              <span className={`inline-flex px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wide border transition-colors ${campaignStatus.color}`}>
                {campaignStatus.label}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Start Date */}
            <div>
              <p className={`text-[11px] font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>
                Start Date
              </p>
              <div className={`flex items-center gap-2 transition-colors ${themeClasses.text.primary}`}>
                <Calendar size={16} />
                <span className="font-bold">{date(campaign.startTime)}</span>
              </div>
            </div>

            {/* End Date */}
            <div>
              <p className={`text-[11px] font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>
                End Date
              </p>
              <div className={`flex items-center gap-2 transition-colors ${themeClasses.text.primary}`}>
                <Clock size={16} />
                <span className="font-bold">{date(campaign.endTime)}</span>
              </div>
            </div>

            {/* Discount */}
            <div>
              <p className={`text-[11px] font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>
                Discount
              </p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${themeClasses.status.info}`}>
                <Tag size={13} />
                {campaign.discountType === 'PERCENTAGE' ? `${campaign.discountValue}%` : `Rs. ${campaign.discountValue}`}
              </span>
            </div>

            {/* Total Products */}
            <div>
              <p className={`text-[11px] font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>
                Total Products
              </p>
              <div className={`flex items-center gap-2 transition-colors ${themeClasses.text.primary}`}>
                <Package size={16} />
                <span className="font-bold text-lg">{campaign.totalProducts ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Products Section ──────────────────────────────────────── */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          {/* Tab Bar */}
          <div className={`flex border-b transition-colors ${themeClasses.bg.secondary}`}>
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
                  className={`flex-1 py-4 px-6 border-b-2 -mb-px transition-all duration-200 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider ${
                    isActive
                      ? darkMode
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-900/10'
                        : 'border-emerald-600 text-emerald-700 bg-emerald-50'
                      : darkMode
                        ? 'border-transparent text-gray-500 hover:text-gray-300'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black transition-colors ${
                    isActive
                      ? darkMode ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-200 text-emerald-700'
                      : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className={`transition-colors ${themeClasses.bg.primary}`}>
            {productsLoading ? (
              <div className="p-6 space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`rounded-xl p-4 animate-pulse transition-colors ${themeClasses.bg.secondary}`}>
                    <div className="flex gap-4">
                      <div className={`w-24 h-24 rounded-lg flex-shrink-0 transition-colors ${themeClasses.bg.tertiary}`} />
                      <div className="flex-1 space-y-2">
                        <div className={`h-4 rounded w-2/3 transition-colors ${themeClasses.bg.tertiary}`} />
                        <div className={`h-3 rounded w-1/2 transition-colors ${themeClasses.bg.tertiary}`} />
                        <div className={`h-3 rounded w-1/3 transition-colors ${themeClasses.bg.tertiary}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'pending' ? (
              pendingProducts.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-20 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className={`p-4 rounded-2xl mb-3 transition-colors ${themeClasses.bg.secondary}`}>
                    <Megaphone size={40} className={`transition-colors ${darkMode ? 'text-gray-700' : 'text-gray-200'}`} />
                  </div>
                  <p className="font-bold text-sm">No Pending Products</p>
                  <p className="text-xs mt-1">All products have been reviewed</p>
                </div>
              ) : (
                <div className="p-6 space-y-2">
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
                <div className={`flex flex-col items-center justify-center py-20 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className={`p-4 rounded-2xl mb-3 transition-colors ${themeClasses.bg.secondary}`}>
                    <CheckCircle size={40} className={`transition-colors ${darkMode ? 'text-gray-700' : 'text-gray-200'}`} />
                  </div>
                  <p className="font-bold text-sm">No Approved Products</p>
                  <p className="text-xs mt-1">Products will appear here once approved</p>
                </div>
              ) : (
                <div className="p-6 space-y-2">
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
  // Try to get image from various possible paths
  const getProductImage = () => {
    // Backend returns 'productImage' field
    if (product.productImage) {
      return resolveImageUrl(product.productImage);
    }
    // Fallback to other possible paths
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
    <div className={`rounded-xl overflow-hidden border-l-4 transition-all duration-200 ${
      status === 'pending'
        ? darkMode ? 'bg-gray-800 border-l-amber-500 hover:shadow-lg hover:shadow-amber-500/20' : 'bg-white border-l-amber-500 hover:shadow-lg hover:shadow-amber-500/10'
        : darkMode ? 'bg-gray-800 border-l-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20' : 'bg-white border-l-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10'
    }`}>
      <div className="p-3 flex gap-3">
        {/* Product Image */}
        <div className={`w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
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
            <Package size={20} className={`transition-colors ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className={`font-bold text-sm truncate transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {product.productName || product.name}
              </p>
              <p className={`text-xs mt-0.5 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className={`transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Seller: </span>
                <span className="font-semibold">{product.storeName || product.sellerName || '—'}</span>
              </p>
            </div>
            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full whitespace-nowrap transition-colors ${
              status === 'pending'
                ? darkMode ? 'bg-amber-900/40 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-700 border border-amber-300'
                : darkMode ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
            }`}>
              {status === 'pending' ? '⏳ Pending' : '✓'}
            </span>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <span className={`text-[9px] font-black uppercase tracking-wide block mb-0.5 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Original
              </span>
              <p className={`font-bold text-xs transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Rs. {product.originalPrice?.toLocaleString() || '—'}
              </p>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-wide block mb-0.5 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Campaign
              </span>
              <p className={`font-bold text-xs transition-colors ${
                product.salePrice
                  ? darkMode ? 'text-emerald-300' : 'text-emerald-600'
                  : darkMode ? 'text-gray-400' : 'text-gray-400'
              }`}>
                Rs. {product.salePrice?.toLocaleString() || '—'}
              </p>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-wide block mb-0.5 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Stock
              </span>
              <p className={`font-bold text-xs transition-colors ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
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
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
              >
                <CheckCircle size={13} />
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={isWorking}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
              >
                <XCircle size={13} />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


