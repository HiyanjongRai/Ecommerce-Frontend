import React, { useEffect, useState, useCallback } from 'react';
import { getSellerCampaigns, getSellerProducts, getSellerProfile, joinSellerCampaign, getProductDetail } from '../services/sellerService';
import { EmptyState, LoadingState, SectionHeader, normalizeList, resolveImageUrl } from './SellerSectionUtils';
import { toast } from '../../../shared/contexts/ToastContext';
import {
  Tag, Zap, AlertCircle, CheckCircle, X, ChevronRight,
  ChevronLeft, Package, Info, AlertTriangle
} from 'lucide-react';

const SellerCampaigns = () => {
  // Campaign list state
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Join campaign flow state
  const [joinFlow, setJoinFlow] = useState(null); // null | 'select-product' | 'configure'
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Product selection state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Campaign configuration state
  const [campaignConfig, setCampaignConfig] = useState({
    salePrice: '',
    stockLimit: '',
    selectedVariants: [], // For products with variants
  });
  const [selectedVariantPrices, setSelectedVariantPrices] = useState({});
  const [joining, setJoining] = useState(false);

  const showToast = useCallback((msg, type = 'info') => {
    toast(msg, type);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const campaignRes = await getSellerCampaigns();
      setCampaigns(normalizeList(campaignRes.data));
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load campaigns.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Step 1: Start join process - load seller products
  const startJoinCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    setJoinFlow('select-product');
    setLoadingProducts(true);
    setCampaignConfig({ salePrice: '', stockLimit: '', selectedVariants: [] });

    try {
      const profileRes = await getSellerProfile();
      const userId = profileRes.data?.userId;
      if (userId) {
        const productRes = await getSellerProducts(userId);
        const activeProducts = normalizeList(productRes.data).filter(
          (p) => String(p.status).toUpperCase() === 'ACTIVE'
        );
        setSellerProducts(activeProducts);
      }
    } catch (error) {
      showToast('Failed to load products', 'error');
      setJoinFlow(null);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Step 2: Select product - load variants
  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setProductVariants([]);
    setCampaignConfig({ salePrice: '', stockLimit: '', selectedVariants: [] });
    setLoadingVariants(true);

    try {
      // Try to get product details with variants
      const detailRes = await getProductDetail(product.id);
      const variants = detailRes.data?.variants || [];
      setProductVariants(variants);
    } catch (error) {
      setProductVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Step 3: Move to configuration step
  const proceedToConfig = () => {
    if (!selectedProduct) {
      showToast('Select a product first', 'warning');
      return;
    }

    // If product has variants but none selected
    if (productVariants.length > 0 && campaignConfig.selectedVariants.length === 0) {
      showToast('Select at least one variant', 'warning');
      return;
    }

    setJoinFlow('configure');
  };

  // Get the maximum price from selected variants (or product price if no variants)
  const getMaxPriceForValidation = () => {
    // If variants are selected, use the highest variant price
    if (campaignConfig.selectedVariants.length > 0) {
      const prices = Object.values(selectedVariantPrices);
      return prices.length > 0 ? Math.max(...prices) : selectedProduct?.price || 0;
    }
    // If no specific variants selected, use product price
    return selectedProduct?.price || 0;
  };

  // Validate campaign price
  const validateCampaignPrice = () => {
    if (!campaignConfig.salePrice) {
      showToast('Campaign sale price is required', 'warning');
      return false;
    }

    const salePrice = parseFloat(campaignConfig.salePrice);
    const maxPrice = getMaxPriceForValidation();

    if (salePrice <= 0) {
      showToast('Sale price must be greater than zero', 'warning');
      return false;
    }

    // Check if sale price is less than max product/variant price
    if (salePrice >= maxPrice) {
      showToast(`Campaign sale price must be lower than product price (Rs. ${maxPrice.toLocaleString()})`, 'warning');
      return false;
    }

    return true;
  };

  // Step 4: Submit join request
  const handleJoinCampaign = async () => {
    if (!selectedProduct || !selectedCampaign) return;

    // Validate before submitting
    if (!validateCampaignPrice()) {
      return;
    }

    setJoining(true);
    try {
      // Build products array
      let products = [];

      if (productVariants.length > 0 && campaignConfig.selectedVariants.length > 0) {
        // Join with specific variants
        products = campaignConfig.selectedVariants.map((variantId) => ({
          productId: selectedProduct.id,
          variantId: variantId,
          salePrice: parseFloat(campaignConfig.salePrice),
          stockLimit: campaignConfig.stockLimit ? parseInt(campaignConfig.stockLimit) : null,
        }));
      } else {
        // Join with entire product (no specific variants)
        products = [
          {
            productId: selectedProduct.id,
            salePrice: parseFloat(campaignConfig.salePrice),
            stockLimit: campaignConfig.stockLimit ? parseInt(campaignConfig.stockLimit) : null,
          },
        ];
      }

      await joinSellerCampaign({
        campaignId: selectedCampaign.id,
        products: products,
      });

      showToast('✅ Successfully joined campaign!', 'success');
      closeCampaignFlow();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to join campaign', 'error');
    } finally {
      setJoining(false);
    }
  };

  // Close the flow
  const closeCampaignFlow = () => {
    setJoinFlow(null);
    setSelectedCampaign(null);
    setSelectedProduct(null);
    setProductVariants([]);
    setCampaignConfig({ salePrice: '', stockLimit: '', selectedVariants: [] });
    setSelectedVariantPrices({});
  };

  // Toggle variant selection
  const toggleVariantSelection = (variantId, variantPrice) => {
    setCampaignConfig((prev) => ({
      ...prev,
      selectedVariants: prev.selectedVariants.includes(variantId)
        ? prev.selectedVariants.filter((id) => id !== variantId)
        : [...prev.selectedVariants, variantId],
    }));

    // Track variant price
    setSelectedVariantPrices((prev) => {
      const updated = { ...prev };
      if (updated[variantId]) {
        delete updated[variantId];
      } else {
        updated[variantId] = variantPrice;
      }
      return updated;
    });
  };

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const startTime = campaign.startTime ? new Date(campaign.startTime) : null;
    const endTime = campaign.endTime ? new Date(campaign.endTime) : null;

    if (startTime && now < startTime) return 'upcoming';
    if (endTime && now > endTime) return 'ended';
    return 'active';
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active Now' },
      upcoming: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Coming Soon' },
      ended: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Ended' },
    };
    const config = configs[status] || configs.upcoming;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) return <LoadingState label="Loading campaigns..." />;

  return (
    <div className="space-y-6 max-w-[980px] mx-auto">
      <SectionHeader
        title="Campaign Opportunities"
        subtitle="Join exclusive promotional campaigns to boost your sales."
      />


      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns available"
          text="Admin campaigns will appear here when available."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => {
            const image = resolveImageUrl(campaign.imagePath);
            const status = getCampaignStatus(campaign);
            const startTime = campaign.startTime ? new Date(campaign.startTime) : null;
            const endTime = campaign.endTime ? new Date(campaign.endTime) : null;

            return (
              <div
                key={campaign.id}
                className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col"
              >
                {/* Campaign Image */}
                <div className="relative">
                  {image ? (
                    <img src={image} alt={campaign.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Tag size={40} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">{getStatusBadge(status)}</div>
                  {campaign.discountType && campaign.discountValue && (
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-black">
                      {campaign.discountType === 'PERCENTAGE'
                        ? `${campaign.discountValue}%`
                        : `Rs. ${campaign.discountValue}`}{' '}
                      OFF
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-black text-gray-900">{campaign.name}</h3>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 flex-1">
                    {campaign.description || 'Campaign details will be provided by admin.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase">Starts</p>
                      <p className="font-bold text-gray-900 text-sm mt-1">
                        {startTime ? startTime.toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase">Ends</p>
                      <p className="font-bold text-gray-900 text-sm mt-1">
                        {endTime ? endTime.toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>

                  {campaign.discountType && (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs font-bold text-purple-700">
                        {campaign.discountType === 'PERCENTAGE'
                          ? `${campaign.discountValue}% discount available`
                          : `Rs. ${campaign.discountValue} off`}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => startJoinCampaign(campaign)}
                    disabled={status === 'ended'}
                    className={`mt-4 w-full py-3 px-4 rounded-lg font-bold uppercase text-sm transition-all flex items-center justify-center gap-2 ${
                      status === 'ended'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Zap size={16} /> Join Campaign <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Step 1: Select Product Modal ────────────────────── */}
      {joinFlow === 'select-product' && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCampaignFlow} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-50 to-emerald-100 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg text-gray-900">Join Campaign</h2>
                <p className="text-xs text-gray-600 mt-1">{selectedCampaign.name}</p>
              </div>
              <button
                onClick={closeCampaignFlow}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 font-semibold">
                Step 1 of 2: Select Product
              </p>

              {loadingProducts ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : sellerProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-600 font-semibold">No active products</p>
                  <p className="text-xs text-gray-500 mt-1">Create products first to join campaigns</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sellerProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProduct?.id === product.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Stock: {product.stockQuantity || 0}
                          </p>
                          <p className="text-sm font-bold text-emerald-600 mt-1">
                            Rs. {product.price?.toLocaleString() || 0}
                          </p>
                        </div>
                        {selectedProduct?.id === product.id && (
                          <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle size={20} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Variant Selection */}
              {selectedProduct && productVariants.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">
                    Select Variants (Optional)
                  </p>
                  {loadingVariants ? (
                    <div className="space-y-2">
                      {Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {productVariants.map((variant) => (
                        <label
                          key={variant.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={campaignConfig.selectedVariants.includes(variant.id)}
                            onChange={() => toggleVariantSelection(variant.id, variant.price)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {variant.sku || `Variant ${variant.id}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {variant.stockQuantity || 0}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            Rs. {variant.price?.toLocaleString() || 0}
                          </p>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {campaignConfig.selectedVariants.length > 0
                      ? `${campaignConfig.selectedVariants.length} variant(s) selected`
                      : 'Leave empty to include all variants'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeCampaignFlow}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={proceedToConfig}
                disabled={!selectedProduct}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Configure Campaign Modal ────────────────── */}
      {joinFlow === 'configure' && selectedCampaign && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCampaignFlow} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-5 py-4 border-b border-gray-200">
              <h2 className="font-black text-lg text-gray-900">Configure Campaign</h2>
              <p className="text-xs text-gray-600 mt-1">Step 2 of 2: Set pricing and stock limit</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Product Summary */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs font-black text-gray-600 uppercase">Selected Product</p>
                <p className="font-bold text-gray-900 mt-1">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {campaignConfig.selectedVariants.length > 0
                    ? `${campaignConfig.selectedVariants.length} specific variant(s)`
                    : 'All variants'}
                </p>
              </div>

              {/* Campaign Details */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs font-black text-gray-600 uppercase">Campaign</p>
                <p className="font-bold text-gray-900 mt-1">{selectedCampaign.name}</p>
                {selectedCampaign.discountType && (
                  <p className="text-sm text-purple-700 font-semibold mt-1">
                    {selectedCampaign.discountType === 'PERCENTAGE'
                      ? `${selectedCampaign.discountValue}% discount`
                      : `Rs. ${selectedCampaign.discountValue} off`}
                  </p>
                )}
              </div>

              {/* Sale Price (Required) */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                  Campaign Sale Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-bold text-lg">Rs.</span>
                  <input
                    type="number"
                    value={campaignConfig.salePrice}
                    onChange={(e) =>
                      setCampaignConfig((prev) => ({
                        ...prev,
                        salePrice: e.target.value,
                      }))
                    }
                    placeholder="Enter sale price"
                    min="0"
                    step="0.01"
                    className={`w-full bg-white border-2 rounded-lg pl-12 pr-4 py-3 text-lg font-bold outline-none transition-colors ${
                      campaignConfig.salePrice && parseFloat(campaignConfig.salePrice) >= getMaxPriceForValidation()
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-200 focus:border-emerald-500'
                    }`}
                  />
                </div>
                
                {/* Real-time Validation Messages */}
                <div className="mt-2 space-y-1">
                  {!campaignConfig.salePrice && (
                    <p className="text-xs text-gray-500">Must be greater than zero</p>
                  )}
                  
                  {campaignConfig.salePrice && parseFloat(campaignConfig.salePrice) <= 0 && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> Sale price must be greater than zero
                    </p>
                  )}
                  
                  {campaignConfig.salePrice && parseFloat(campaignConfig.salePrice) >= getMaxPriceForValidation() && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> Must be lower than Rs. {getMaxPriceForValidation().toLocaleString()}
                    </p>
                  )}
                  
                  {campaignConfig.salePrice && 
                   parseFloat(campaignConfig.salePrice) > 0 && 
                   parseFloat(campaignConfig.salePrice) < getMaxPriceForValidation() && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Valid price ✓
                    </p>
                  )}
                </div>

                {/* Price Comparison Info */}
                <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-700 font-semibold">
                    {campaignConfig.selectedVariants.length > 0 
                      ? `Highest Variant Price: Rs. ${getMaxPriceForValidation().toLocaleString()}`
                      : `Original Product Price: Rs. ${getMaxPriceForValidation().toLocaleString()}`
                    }
                  </p>
                  {campaignConfig.salePrice && (
                    <p className={`text-xs mt-1 font-semibold ${
                      parseFloat(campaignConfig.salePrice) < getMaxPriceForValidation()
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}>
                      Savings: <span className="font-black">
                        Rs. {(getMaxPriceForValidation() - parseFloat(campaignConfig.salePrice || 0)).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Stock Limit (Optional) */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                  Stock Limit (Optional)
                </label>
                <input
                  type="number"
                  value={campaignConfig.stockLimit}
                  onChange={(e) =>
                    setCampaignConfig((prev) => ({
                      ...prev,
                      stockLimit: e.target.value,
                    }))
                  }
                  placeholder="Leave blank for unlimited"
                  min="1"
                  className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-lg font-bold outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">Limit units available in this campaign</p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Before you submit:</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Ensure your product has at least 10 stock and your sale price is competitive.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setJoinFlow('select-product')}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={handleJoinCampaign}
                disabled={joining || !campaignConfig.salePrice || (parseFloat(campaignConfig.salePrice) >= getMaxPriceForValidation())}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {joining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-emerald-600 rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Confirm & Join
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCampaigns;
