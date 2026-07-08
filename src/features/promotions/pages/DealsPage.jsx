import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Tag, 
  Zap, 
  Gift, 
  ChevronRight,
  Clock,
  Flame,
  AlertCircle,
  Loader,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Footer from '../../../shared/components/Footer/Footer';
import { getActiveCampaigns, getActivePromos, getSaleProducts } from '../../customer/api/customerApi';
import { getProductLink } from '../../../shared/utils/slugHelper';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg h-48"></div>
);

// Campaign Card Component
const CampaignCard = ({ campaign }) => {
  const backgroundGradients = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-pink-600',
    'from-orange-400 to-red-600',
    'from-green-400 to-emerald-600',
    'from-indigo-400 to-purple-600',
  ];
  const bgGradient = backgroundGradients[campaign.id % 5];

  return (
    <Link to="/promo/campaign" className="group">
      <div className={`relative h-48 bg-gradient-to-br ${bgGradient} rounded-lg overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-lg`}>
        {campaign.imagePath && (
          <img
            src={campaign.imagePath.startsWith('http') ? campaign.imagePath : `${BASE_URL}${campaign.imagePath}`}
            alt={campaign.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
          />
        )}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
        <div className="relative h-full flex flex-col justify-between p-4">
          <div>
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold">
              <Zap className="w-3 h-3" />
              Campaign
            </span>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">{campaign.title || campaign.name}</h3>
            <p className="text-white/80 text-sm line-clamp-2">{campaign.description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Promo Code Card Component
const PromoCodeCard = ({ promo }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promo.code);
    setCopied(true);
    toast.success(`Code ${promo.code} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const discountLabel = promo.discountPercentage
    ? `${promo.discountPercentage}% OFF`
    : `Rs. ${promo.discountAmount} OFF`;

  const BADGE_COLORS = [
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'bg-emerald-500' },
    { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', label: 'bg-violet-500' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: 'bg-rose-500' },
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'bg-blue-500' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'bg-amber-500' },
  ];

  const colorIdx = promo.id % BADGE_COLORS.length;
  const colors = BADGE_COLORS[colorIdx];

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`font-black text-xl ${colors.text}`}>{discountLabel}</h3>
          <p className="text-xs text-gray-600 mt-1">{promo.description || 'Get a special discount'}</p>
        </div>
        <span className={`${colors.label} text-white px-2 py-1 rounded text-xs font-bold`}>
          <Tag className="w-3 h-3 inline mr-1" />
          Active
        </span>
      </div>

      <div className="border-t-2 border-dashed border-opacity-30 pt-3 mb-3">
        <div className="flex items-center justify-between">
          <code className="font-mono font-bold text-sm">{promo.code}</code>
          <button
            onClick={handleCopy}
            className={`p-2 rounded transition-colors ${
              copied
                ? 'bg-green-500 text-white'
                : `${colors.label} text-white hover:opacity-80`
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {promo.minOrderValue && (
        <p className="text-xs text-gray-700">
          <strong>Min Order:</strong> Rs. {promo.minOrderValue.toLocaleString()}
        </p>
      )}
    </div>
  );
};

// Sale Product Card Component
const SaleProductCard = ({ product }) => {
  const rawImg = product.imagePaths?.[0] || product.imagePath || product.thumbnail || null;
  const resolvedUrl = rawImg
    ? rawImg.startsWith('http')
      ? rawImg
      : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`
    : null;

  const productLink = getProductLink(product);
  const discount = product.discountPercentage || product.discount || 0;
  const originalPrice = product.originalPrice || product.price;
  const currentPrice = product.price || product.minPrice || 0;

  return (
    <Link to={productLink} className="group">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:scale-105">
        <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {resolvedUrl ? (
            <img src={resolvedUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
          ) : (
            <span className="text-4xl">📦</span>
          )}

          {discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg flex items-center gap-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold">{discount}% OFF</span>
            </div>
          )}

          {product.freeShipping && (
            <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              🚚 Free Delivery
            </div>
          )}
        </div>

        <div className="p-3">
          <h4 className="font-bold text-sm text-gray-900 line-clamp-2 mb-2 group-hover:text-[#16A34A]">{product.name}</h4>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-black text-[#16A34A]">Rs. {currentPrice.toLocaleString()}</span>
            {originalPrice && originalPrice !== currentPrice && (
              <span className="text-xs font-semibold text-gray-400 line-through">Rs. {originalPrice.toLocaleString()}</span>
            )}
          </div>

          {product.rating && (
            <div className="flex items-center gap-1 text-xs text-yellow-500">
              <span>⭐</span>
              <span className="font-bold">{product.rating}</span>
              <span className="text-gray-500">({product.reviewCount || 0} reviews)</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function DealsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [promos, setPromos] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchDealsData();
  }, []);

  const fetchDealsData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, promosRes, productsRes] = await Promise.all([
        getActiveCampaigns(),
        getActivePromos(),
        fetch(`${BASE_URL}/api/products?onSale=true&limit=12`).then((res) => res.json()),
      ]);

      setCampaigns(campaignsRes?.data || []);
      setPromos(promosRes?.data || []);
      setSaleProducts(productsRes?.data || []);
    } catch (err) {
      console.error('Error fetching deals:', err);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 font-inter">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-8 h-8" />
            <h1 className="text-4xl font-black">All Deals & Offers</h1>
          </div>
          <p className="text-red-100 text-lg">Discover amazing campaigns, promo codes, and sale products</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Deals', icon: '🎯' },
            { id: 'campaigns', label: 'Campaigns', icon: '⚡' },
            { id: 'promos', label: 'Promo Codes', icon: '🏷️' },
            { id: 'products', label: 'Sale Products', icon: '🛍️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#16A34A] text-[#16A34A]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 text-[#16A34A] animate-spin" />
          </div>
        ) : (
          <>
            {/* All Deals Tab */}
            {(activeTab === 'all' || activeTab === 'campaigns') && campaigns.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-purple-600" />
                  Featured Campaigns
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.slice(0, activeTab === 'all' ? 3 : undefined).map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
                {activeTab === 'campaigns' && campaigns.length > 3 && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">Showing {Math.min(3, campaigns.length)} of {campaigns.length} campaigns</p>
                  </div>
                )}
              </section>
            )}

            {/* Promo Codes Tab */}
            {(activeTab === 'all' || activeTab === 'promos') && promos.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Tag className="w-6 h-6 text-red-600" />
                  Active Promo Codes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promos.slice(0, activeTab === 'all' ? 3 : undefined).map((promo) => (
                    <PromoCodeCard key={promo.id} promo={promo} />
                  ))}
                </div>
              </section>
            )}

            {/* Sale Products Tab */}
            {(activeTab === 'all' || activeTab === 'products') && saleProducts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Gift className="w-6 h-6 text-green-600" />
                  On Sale Now
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {saleProducts.slice(0, activeTab === 'all' ? 5 : undefined).map((product) => (
                    <SaleProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {campaigns.length === 0 && promos.length === 0 && saleProducts.length === 0 && (
              <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No Deals Available</h3>
                <p className="text-gray-500 mb-6">Check back later for amazing offers!</p>
                <Link to="/" className="inline-block bg-[#16A34A] hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  Continue Shopping
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
