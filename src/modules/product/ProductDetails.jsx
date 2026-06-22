import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, addToCart, getReviewsForProduct, addToWishlist, getProducts, sendMessage } from '../../shared/api/customerApi';
import { BASE_URL } from '../../shared/api/apiClient';
import { useCustomer } from '../customer/contexts/CustomerContext';
import { updateSellerProductStatus } from '../seller/services/sellerService';
import ProductCard from './components/ProductCard';
import { useToast } from '../../shared/contexts/ToastContext';
import { 
  Heart, 
  ShoppingBag, 
  Mail, 
  Store, 
  ShieldCheck, 
  ChevronRight, 
  MessageSquare, 
  Star,
  Info,
  Clock,
  ThumbsUp,
  Award,
  Sliders,
  Cpu,
  Tv,
  Camera,
  Database,
  Zap,
  Maximize2
} from 'lucide-react';

const parseSpecification = (specStr) => {
  if (!specStr) return [];
  let cleanStr = specStr.replace(/^SpecificationDetails/, '').trim();
  const keys = [
    'Processor',
    'RAM & Storage',
    'Display',
    'Cameras',
    'Build',
    'Battery & Charging',
    'Storage & RAM',
    'Material',
    'Dimensions',
    'Weight',
    'Operating System',
    'Warranty',
    'Model',
    'Color',
    'Battery'
  ];
  const matches = [];
  keys.forEach(key => {
    const idx = cleanStr.indexOf(key);
    if (idx !== -1) {
      matches.push({ key, index: idx });
    }
  });
  // Sort matches by index ascending, then by key length descending
  matches.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return b.key.length - a.key.length;
  });
  
  // Filter out overlapping matches
  const filteredMatches = [];
  let lastEndIndex = -1;
  for (const match of matches) {
    if (match.index >= lastEndIndex) {
      filteredMatches.push(match);
      lastEndIndex = match.index + match.key.length;
    }
  }

  if (filteredMatches.length === 0) {
    if (cleanStr.includes('\n')) {
      return cleanStr.split('\n').map(line => {
        const parts = line.split(':');
        if (parts.length > 1) {
          return { key: parts[0].trim(), value: parts.slice(1).join(':').trim() };
        }
        return { key: 'General', value: line.trim() };
      });
    }
    return [{ key: 'Specification', value: cleanStr }];
  }
  const result = [];
  for (let i = 0; i < filteredMatches.length; i++) {
    const current = filteredMatches[i];
    const next = filteredMatches[i + 1];
    const valStart = current.index + current.key.length;
    const valEnd = next ? next.index : cleanStr.length;
    const value = cleanStr.substring(valStart, valEnd).trim();
    result.push({
      key: current.key,
      value: value.replace(/^[:\-\s]+/, '').trim()
    });
  }
  return result;
};

const getSpecIcon = (key) => {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey.includes('processor') || normalizedKey.includes('cpu')) {
    return <Cpu className="w-3.5 h-3.5 text-emerald-600" />;
  }
  if (normalizedKey.includes('display') || normalizedKey.includes('screen')) {
    return <Tv className="w-3.5 h-3.5 text-emerald-600" />;
  }
  if (normalizedKey.includes('camera')) {
    return <Camera className="w-3.5 h-3.5 text-emerald-600" />;
  }
  if (normalizedKey.includes('ram') || normalizedKey.includes('storage')) {
    return <Database className="w-3.5 h-3.5 text-emerald-600" />;
  }
  if (normalizedKey.includes('battery') || normalizedKey.includes('charging') || normalizedKey.includes('power')) {
    return <Zap className="w-3.5 h-3.5 text-emerald-600" />;
  }
  if (normalizedKey.includes('build') || normalizedKey.includes('material') || normalizedKey.includes('shield') || normalizedKey.includes('warranty')) {
    return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
  }
  return <Sliders className="w-3.5 h-3.5 text-emerald-600" />;
};

const ProductDetails = () => {
  const { slug } = useParams();
  const { user, refreshCart } = useCustomer();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery
  const [mainImage, setMainImage] = useState('');

  // Variants
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // UI State
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { showToast } = useToast();

  // Messaging state
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgContent, setMsgContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [msgError, setMsgError] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      setMsgError('Please log in first to send messages.');
      return;
    }
    if (!msgContent.trim()) {
      setMsgError('Message content cannot be empty.');
      return;
    }
    setSendingMsg(true);
    setMsgError('');
    setMsgSuccess(false);
    try {
      await sendMessage({
        receiverId: product.sellerUserId,
        productId: product.productId,
        content: msgContent.trim(),
      });
      setMsgSuccess(true);
      setMsgContent('');
      setTimeout(() => {
        setIsMsgModalOpen(false);
        setMsgSuccess(false);
      }, 2500);
    } catch (err) {
      setMsgError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMsg(false);
    }
  };

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProductBySlug(slug);
        const data = res.data;
        setProduct(data);
        if (data.imagePaths && data.imagePaths.length > 0) {
          setMainImage(data.imagePaths[0]);
        }
        
        // Fetch reviews
        if (data.productId) {
          const revRes = await getReviewsForProduct(data.productId);
          setReviews(Array.isArray(revRes.data) ? revRes.data : []);
        }

        // Initialize attributes
        if (data.hasVariants && data.variants?.length > 0) {
          const defaultVariant = data.variants[0];
          setSelectedVariant(defaultVariant);
          setSelectedAttributes({ ...defaultVariant.attributes });
        } else {
          setSelectedVariant(null);
          setSelectedAttributes({});
        }

        // Fetch related products (same category)
        try {
          const productsRes = await getProducts({ page: 0, size: 10 });
          const allProducts = productsRes.data.content || productsRes.data || [];
          const filtered = allProducts
            .filter(p => p.id !== data.productId && p.category === data.category)
            .slice(0, 4);
          setRelatedProducts(filtered);
        } catch (relErr) {
          console.error("Failed to load related products", relErr);
        }

      } catch (err) {
        setError('Product not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndRelated();
  }, [slug]);

  // Handle variant selection
  const handleAttributeChange = (attrName, value) => {
    const newAttrs = { ...selectedAttributes, [attrName]: value };
    setSelectedAttributes(newAttrs);

    // Find matching variant
    if (product?.variants) {
      const match = product.variants.find(v => {
        return Object.entries(v.attributes).every(([key, val]) => newAttrs[key] === val);
      });
      setSelectedVariant(match || null);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please log in to add items to cart.', 'error');
      return;
    }
    if (product.hasVariants && !selectedVariant) {
      showToast('Please select a valid combination of options.', 'error');
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(user.id, product.productId, {
        productId: product.productId,
        variantId: selectedVariant?.id || null,
        quantity,
      });
      refreshCart();
      showToast('Added to cart!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add to cart.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      showToast('Please log in to add items to wishlist.', 'error');
      return;
    }
    setAddingToWishlist(true);
    try {
      await addToWishlist(user.id, product.productId);
      showToast('Added to wishlist!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add to wishlist.', 'error');
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <div className="flex justify-center items-center h-[60vh]">
          <svg className="animate-spin w-8 h-8 text-[#16A34A]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <div className="flex flex-col justify-center items-center h-[60vh] text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">{error || 'Product not found'}</h2>
          <Link to="/" className="mt-4 text-xs font-bold text-[#16A34A] hover:underline uppercase tracking-wider">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const originalPrice = selectedVariant?.price || product.price;
  const productDiscountAmount = Number(selectedVariant?.discountPrice || product.discountPrice || 0);
  const inferredProductSalePrice = productDiscountAmount > 0 && Number(originalPrice || 0) > productDiscountAmount
    ? Number(originalPrice) - productDiscountAmount
    : null;
  const currentPrice = selectedVariant?.salePrice || selectedVariant?.finalPrice || selectedVariant?.price || product.salePrice || product.finalPrice || inferredProductSalePrice || product.price;
  const selectedSalePercentage = selectedVariant?.salePercentage || product.salePercentage || 0;
  const isOnSale = selectedVariant?.onSale || product.onSale || (currentPrice < originalPrice);
  const stock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-800">
      {/* Seller Admin Control Bar */}
      {user && (user.id === product.sellerUserId || user.role === 'ADMIN') && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-700 shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                Seller Controls
              </span>
              <span className="font-semibold text-slate-300 font-sans">
                You own this product listing.
              </span>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-slate-400 font-black uppercase tracking-wider text-[10px]">Status:</span>
                <select
                  value={product.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    if (window.confirm(`Are you sure you want to change the status to ${newStatus}?`)) {
                      try {
                        await updateSellerProductStatus(product.productId, newStatus);
                        setProduct(prev => ({ ...prev, status: newStatus }));
                        showToast('Product status updated successfully!', 'success');
                      } catch (err) {
                        showToast(err.response?.data?.message || 'Failed to update product status.', 'error');
                      }
                    }
                  }}
                  className="bg-slate-800 border border-slate-700 text-white font-extrabold rounded-sm px-2.5 py-1 text-[10px] uppercase tracking-wider focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <Link
                to={`/seller/products?edit=${product.productId}`}
                className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors shadow-sm font-sans"
              >
                ✏️ Edit Listing
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb Path */}
      <div className="bg-white border-b border-gray-100 shadow-xs mt-3 mb-4">
        <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
          <Link to="/products" className="hover:text-emerald-600 transition-colors">{product.category || 'Shop'}</Link>
          <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-4 md:py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 md:gap-8">

            {/* Left: Gallery */}
            <div>
              <div 
                className="aspect-square max-h-[320px] bg-white rounded-2xl overflow-hidden border border-gray-100 mb-3 relative flex items-center justify-center p-4 mx-auto shadow-sm group/gallery cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              >
                {selectedSalePercentage > 0 && (
                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                    <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm shadow-sm">
                      -{selectedSalePercentage}%
                    </span>
                  </div>
                )}
                {mainImage ? (
                  <img 
                    src={mainImage.startsWith('http') ? mainImage : `${BASE_URL}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`} 
                    alt={product.name} 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <span className="text-gray-300 font-bold tracking-widest uppercase text-[10px]">No Image Available</span>
                )}
                <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-xs shadow-sm opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </div>
              {product.imagePaths?.length > 1 && (
                <div className="flex gap-1.5 justify-center overflow-x-auto pb-1">
                  {product.imagePaths.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setMainImage(img)}
                      className={`w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-white ${mainImage === img ? 'border-emerald-600 shadow-sm' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      <img 
                        src={img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`} 
                        alt="" 
                        className="w-full h-full object-contain" 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details Info */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="border-b border-gray-100 pb-3 mb-3">
                  {product.brand && (
                    <span className="text-[9px] font-extrabold tracking-widest text-emerald-600 uppercase mb-1 block">{product.brand}</span>
                  )}
                  <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight mb-1.5">
                    {product.name}
                  </h1>
                  
                  {/* Rating & reviews */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const isActive = i < Math.round(product.averageRating || 0);
                        return (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                          />
                        );
                      })}
                    </div>
                    <span className="font-semibold text-slate-400">({product.totalReviews || reviews.length} reviews)</span>
                  </div>
                </div>

                {/* Price Block */}
                <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl md:text-2xl font-extrabold text-slate-900">
                        Rs. {currentPrice?.toLocaleString()}
                      </span>
                      {isOnSale && (
                        <span className="text-xs text-slate-400 font-medium line-through">
                          Rs. {originalPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        {stock > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {stock > 0 ? (stock < 5 ? `Only ${stock} left!` : 'In Stock') : <span className="text-red-500 font-extrabold">Out of Stock</span>}
                      </span>
                    </div>
                  </div>

                  {product.status !== 'ACTIVE' && (
                    <span className="inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-250 font-sans shadow-sm animate-pulse">
                      ⚠️ Status: {product.status}
                    </span>
                  )}
                </div>

                {/* Short Description */}
                <div className="text-[11px] text-slate-500 leading-relaxed mb-4 font-medium">
                  {product.shortDescription || 'Experience the perfect blend of performance and styling in a clean, modern design built to last.'}
                </div>

                {/* Dynamic Variant Selectors */}
                {product.hasVariants && product.attributeOptions && Object.keys(product.attributeOptions).length > 0 && (
                  <div className="space-y-3 mb-4 border-t border-gray-100 pt-4">
                    {Object.entries(product.attributeOptions).map(([attrName, options]) => (
                      <div key={attrName} className="flex items-center">
                        <h4 className="w-20 text-[9px] font-bold uppercase tracking-widest text-slate-400">{attrName}:</h4>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {options.map(opt => {
                            const isSelected = selectedAttributes[attrName] === opt.value;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleAttributeChange(attrName, opt.value)}
                                className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border transition-all duration-200 ${
                                  isSelected 
                                    ? 'border-emerald-600 bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-100 scale-[1.02]' 
                                    : 'border-gray-200 text-slate-655 hover:border-gray-300 hover:scale-[1.01] bg-white'
                                    }`}
                              >
                                {opt.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {!selectedVariant && (
                      <p className="text-[9px] font-bold text-red-500 mt-2 flex items-center gap-1 font-sans">
                        <span>⚠️</span> Selected option combination is currently unavailable.
                      </p>
                    )}
                  </div>
                )}
                   {/* Actions Section */}
              <div className="space-y-3.5 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2.5 items-stretch w-full">
                  
                  {/* Quantity box */}
                  <div className="flex border border-gray-200 rounded-xl items-center w-28 bg-white h-11 md:h-12 overflow-hidden shadow-2xs">
                    <button className="flex-1 font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50 h-full flex items-center justify-center transition-colors focus:outline-none" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                    <span className="w-8 text-center font-extrabold text-slate-800 text-xs">{quantity}</span>
                    <button className="flex-1 font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50 h-full flex items-center justify-center transition-colors focus:outline-none" onClick={() => setQuantity(q => Math.min(stock, q + 1))}>+</button>
                  </div>

                  {/* Add to Cart button */}
                  <button 
                    onClick={handleAddToCart}
                    disabled={addingToCart || stock < 1 || (product.hasVariants && !selectedVariant)}
                    className="flex-1 min-w-[150px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed text-white font-extrabold text-xs md:text-sm uppercase tracking-wider h-11 md:h-12 rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{addingToCart ? 'Adding…' : 'Add to Cart'}</span>
                  </button>

                  {/* Message Seller / Inquiry button */}
                  <button 
                    onClick={() => setIsMsgModalOpen(true)}
                    className="px-3 bg-white border border-gray-200 hover:border-slate-850 text-slate-700 hover:text-slate-900 font-extrabold text-[10px] uppercase tracking-wider h-11 md:h-12 rounded-xl shadow-2xs hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-gray-100"
                    title="Inquire about product"
                  >
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="hidden sm:inline">Message Seller</span>
                  </button>

                  {/* Wishlist Button */}
                  <button 
                    onClick={handleAddToWishlist}
                    disabled={addingToWishlist}
                    className="w-11 h-11 md:w-12 md:h-12 border border-gray-200 hover:border-red-400 hover:text-red-500 text-gray-400 hover:scale-[1.02] active:scale-[0.98] rounded-xl flex items-center justify-center transition-all bg-white shadow-2xs"
                    title="Add to Wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>               </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-bold mb-0.5">SKU</span>
                    <span className="font-bold text-slate-700">{selectedVariant?.sku || `PROD-${product.productId}`}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-bold mb-0.5">Category</span>
                    <span className="font-bold text-slate-700">{product.category || 'Shop'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Vertical Sections */}
        <div className="space-y-6 mb-6">
          {/* Description Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#222529] pb-3 mb-4 border-b border-gray-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Product Description</span>
            </h3>
            <div className="prose prose-sm max-w-none text-slate-650 text-xs md:text-sm leading-relaxed font-semibold break-words overflow-hidden">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p>{product.shortDescription || 'No detailed description available.'}</p>
              )}
            </div>
          </div>

          {/* Specifications Section */}
          {(product.specification || product.features || product.warrantyMonths) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#222529] pb-3 mb-4 border-b border-gray-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Specifications</span>
              </h3>
              <div className="space-y-4">
                {product.specification && (
                  <div className="divide-y divide-gray-100 border rounded-xl overflow-hidden bg-white shadow-2xs">
                    {parseSpecification(product.specification).map((spec, i) => (
                      <div key={i} className="px-4 py-3 grid grid-cols-3 gap-4 text-xs hover:bg-slate-50/50 transition-colors">
                        <span className="col-span-1 font-black text-slate-400 uppercase tracking-wider">{spec.key}</span>
                        <span className="col-span-2 text-slate-800 font-bold leading-normal">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {product.features && product.features !== product.specification && !product.features.startsWith('SpecificationDetails') && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Key Features</span>
                    </h4>
                    <p className="text-xs font-semibold text-slate-650 whitespace-pre-wrap leading-relaxed break-words">{product.features}</p>
                  </div>
                )}
                {product.warrantyMonths > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Warranty</h4>
                    <p className="text-xs font-black text-emerald-600">{product.warrantyMonths} Months Manufacturer Warranty</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seller Info Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#222529] pb-3 mb-4 border-b border-gray-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Seller Information</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-full border border-gray-150 flex items-center justify-center overflow-hidden shadow-2xs">
                  {product.logoImagePath || product.profileImagePath ? (
                    <img src={(product.logoImagePath || product.profileImagePath).startsWith('http') ? (product.logoImagePath || product.profileImagePath) : `${BASE_URL}${(product.logoImagePath || product.profileImagePath).startsWith('/') ? '' : '/'}${product.logoImagePath || product.profileImagePath}`} alt="Seller Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🏪</span>
                  )}
                </div>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{product.storeName || 'Jhapcham Seller'}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.sellerFullName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/seller-profile/${product.sellerUserId}`}
                      className="bg-white border border-gray-250 hover:border-slate-850 text-slate-700 hover:text-slate-900 font-extrabold text-[8px] uppercase tracking-widest px-3.5 py-2 rounded-lg transition-all shadow-3xs flex items-center gap-1 hover:bg-slate-50"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Visit Store</span>
                    </Link>
                    <button
                      onClick={() => setIsMsgModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[8px] uppercase tracking-widest px-3.5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Message Seller</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                {product.sellerEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Email</span>
                      <span className="text-slate-700">{product.sellerEmail}</span>
                    </div>
                  </div>
                )}
                {product.sellerContactNumber && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Phone</span>
                      <span className="text-slate-700">{product.sellerContactNumber}</span>
                    </div>
                  </div>
                )}
                {product.storeAddress && (
                  <div className="col-span-1 md:col-span-2 flex items-start gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Store Address</span>
                      <span className="text-slate-700">{product.storeAddress}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Shipping Rates</h4>
                <div className="bg-slate-50/50 rounded-xl p-3 grid grid-cols-2 gap-3 border border-slate-100 text-xs font-bold">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Inside Valley</p>
                    <p className="text-slate-800">{product.freeShipping ? 'FREE' : `Rs. ${product.insideValleyShipping || 0}`}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Outside Valley</p>
                    <p className="text-slate-800">{product.freeShipping ? 'FREE' : `Rs. ${product.outsideValleyShipping || 0}`}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#222529] pb-3 mb-4 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Customer Reviews ({product.totalReviews || reviews.length})</span>
            </h3>
            {reviews.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No reviews yet for this product.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{review.customerName}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex text-amber-500 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-xs text-slate-650 mt-1 leading-relaxed font-semibold">{review.comment}</p>}
                    {review.sellerReply && (
                      <div className="mt-1.5 bg-slate-50 rounded-lg p-2.5 border-l-2 border-emerald-500 text-xs">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 mb-0.5">Seller Response</p>
                        <p className="text-slate-600 font-semibold">{review.sellerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 pb-1.5 border-b-2 border-b-emerald-600 inline-block">
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && mainImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
            onClick={() => setIsLightboxOpen(false)}
          >
            ✕
          </button>
          <img 
            src={mainImage.startsWith('http') ? mainImage : `${BASE_URL}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`} 
            alt={product.name} 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Message / Inquiry Modal */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn border border-gray-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  Product Inquiry
                </span>
                <h3 className="text-xs font-bold text-gray-900 mt-1 uppercase tracking-wider">
                  Inquire about "{product.name}"
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsMsgModalOpen(false);
                  setMsgError('');
                  setMsgSuccess(false);
                }}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendMessage} className="p-5 space-y-3">
              {msgError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[11px] font-semibold">
                  ⚠️ {msgError}
                </div>
              )}
              {msgSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-[11px] font-semibold">
                  🎉 Inquiry sent successfully! Close modal...
                </div>
              )}

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Your Inquiry
                </label>
                <textarea
                  rows="4"
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder={`Hi ${product.sellerFullName || 'Seller'}, I am interested in "${product.name}". Can you provide more details regarding availability/pricing?`}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500/80 resize-none transition-all"
                  disabled={sendingMsg || msgSuccess}
                />
              </div>

              {/* Submit buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMsgModalOpen(false);
                    setMsgError('');
                    setMsgSuccess(false);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex-1 transition-all"
                  disabled={sendingMsg || msgSuccess}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg || msgSuccess}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex-1 transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                >
                  {sendingMsg ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetails;
