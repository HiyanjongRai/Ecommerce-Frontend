import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, addToCart, getReviewsForProduct, addToWishlist, getProducts, sendMessage } from '../../customer/api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import { updateSellerProductStatus } from '../../seller/api/sellerApi';
import ProductCard from '../components/ProductCard';
import { useToast } from '../../../shared/contexts/ToastContext';
import sanitizeHtml from '../../../shared/utils/sanitizeHtml';
import {
  Heart,
  ShoppingBag,
  Mail,
  Store,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Star,
  Truck,
  RefreshCcw,
  Lock,
  Headphones,
  BadgeCheck,
  Maximize2,
  Plus,
  Minus,
  Cpu,
  Tv,
  Camera,
  Database,
  Zap,
  Sliders,
  Award,
  Clock
} from 'lucide-react';

const parseSpecification = (specStr) => {
  if (!specStr) return [];
  let cleanStr = specStr.replace(/^SpecificationDetails/, '').trim();
  const keys = [
    'Processor', 'RAM & Storage', 'Display', 'Cameras', 'Build', 'Battery & Charging',
    'Storage & RAM', 'Material', 'Dimensions', 'Weight', 'Operating System', 'Warranty',
    'Model', 'Color', 'Battery'
  ];
  const matches = [];
  keys.forEach(key => {
    const idx = cleanStr.indexOf(key);
    if (idx !== -1) matches.push({ key, index: idx });
  });
  matches.sort((a, b) => (a.index !== b.index ? a.index - b.index : b.key.length - a.key.length));
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
        if (parts.length > 1) return { key: parts[0].trim(), value: parts.slice(1).join(':').trim() };
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
    result.push({ key: current.key, value: value.replace(/^[:\-\s]+/, '').trim() });
  }
  return result;
};

const getSpecIcon = (key) => {
  const k = key.toLowerCase();
  if (k.includes('processor') || k.includes('cpu')) return <Cpu className="w-3.5 h-3.5 text-emerald-600" />;
  if (k.includes('display') || k.includes('screen')) return <Tv className="w-3.5 h-3.5 text-emerald-600" />;
  if (k.includes('camera')) return <Camera className="w-3.5 h-3.5 text-emerald-600" />;
  if (k.includes('ram') || k.includes('storage')) return <Database className="w-3.5 h-3.5 text-emerald-600" />;
  if (k.includes('battery') || k.includes('charging') || k.includes('power')) return <Zap className="w-3.5 h-3.5 text-emerald-600" />;
  if (k.includes('build') || k.includes('material') || k.includes('warranty')) return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
  return <Sliders className="w-3.5 h-3.5 text-emerald-600" />;
};

const getColorHex = (colorName) => {
  const map = {
    blue: '#0088cc', tan: '#e3cfa8', 'dark blue': '#2e5b82', black: '#1a1a1a',
    white: '#f9f9f9', red: '#ef4444', green: '#22c55e', gray: '#6b7280',
    grey: '#6b7280', yellow: '#eab308', midnight: '#1c1f2b', starlight: '#e7ddc9',
    silver: '#c9ccd1'
  };
  return map[colorName.toLowerCase()] || '#cccccc';
};

const SizeGuideTable = () => (
  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
    <table className="w-full text-xs text-left text-slate-600 border-collapse">
      <thead>
        <tr className="border-b border-gray-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          <th className="px-4 py-2.5">Size</th>
          <th className="px-4 py-2.5">US</th>
          <th className="px-4 py-2.5">UK</th>
          <th className="px-4 py-2.5">EU</th>
          <th className="px-4 py-2.5">Chest (in)</th>
          <th className="px-4 py-2.5">Waist (in)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {[
          ['S', '34-36', '34-36', '44-46', '36-38', '30-32'],
          ['M', '38-40', '38-40', '48-50', '38-40', '32-34'],
          ['L', '42-44', '42-44', '52-54', '40-42', '34-36'],
        ].map(row => (
          <tr key={row[0]} className="hover:bg-slate-50/60 transition-colors">
            {row.map((cell, i) => (
              <td key={i} className={`px-4 py-2.5 ${i === 0 ? 'font-bold text-slate-900' : ''}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ProductDetails = () => {
  const { slug } = useParams();
  const { user, refreshCart } = useCustomer();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mainImage, setMainImage] = useState('');
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { showToast } = useToast();

  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgContent, setMsgContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [msgError, setMsgError] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) { setMsgError('Please log in first to send messages.'); return; }
    if (!msgContent.trim()) { setMsgError('Message content cannot be empty.'); return; }
    setSendingMsg(true);
    setMsgError('');
    setMsgSuccess(false);
    try {
      await sendMessage({ receiverId: product.sellerUserId, productId: product.productId, content: msgContent.trim() });
      setMsgSuccess(true);
      setMsgContent('');
      setTimeout(() => { setIsMsgModalOpen(false); setMsgSuccess(false); }, 2500);
    } catch (err) {
      setMsgError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMsg(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProductAndRelated = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProductBySlug(slug);
        const data = res.data;
        setProduct(data);
        if (data.imagePaths && data.imagePaths.length > 0) setMainImage(data.imagePaths[0]);

        if (data.productId) {
          const revRes = await getReviewsForProduct(data.productId);
          setReviews(Array.isArray(revRes.data) ? revRes.data : []);
        }

        if (data.hasVariants && data.variants?.length > 0) {
          const defaultVariant = data.variants[0];
          setSelectedVariant(defaultVariant);
          setSelectedAttributes({ ...defaultVariant.attributes });
        } else {
          setSelectedVariant(null);
          setSelectedAttributes({});
        }

        try {
          const productsRes = await getProducts({ page: 0, size: 10 });
          const allProducts = productsRes.data.content || productsRes.data || [];
          const filtered = allProducts
            .filter(p => p.id !== data.productId && p.category === data.category)
            .slice(0, 5);
          setRelatedProducts(filtered);
        } catch (relErr) {
          console.error('Failed to load related products', relErr);
        }
      } catch (err) {
        setError('Product not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndRelated();
  }, [slug]);

  const handlePrevImage = () => {
    if (!product?.imagePaths?.length) return;
    const currentIdx = product.imagePaths.indexOf(mainImage);
    const prevIdx = (currentIdx - 1 + product.imagePaths.length) % product.imagePaths.length;
    setMainImage(product.imagePaths[prevIdx]);
  };

  const handleNextImage = () => {
    if (!product?.imagePaths?.length) return;
    const currentIdx = product.imagePaths.indexOf(mainImage);
    const nextIdx = (currentIdx + 1) % product.imagePaths.length;
    setMainImage(product.imagePaths[nextIdx]);
  };

  const handleAttributeChange = (attrName, value) => {
    const newAttrs = { ...selectedAttributes, [attrName]: value };
    setSelectedAttributes(newAttrs);
    if (product?.variants) {
      const match = product.variants.find(v =>
        Object.entries(v.attributes).every(([key, val]) => newAttrs[key] === val)
      );
      setSelectedVariant(match || null);
    }
  };

  const handleAddToCart = async () => {
    if (!user) { showToast('Please log in to add items to cart.', 'error'); return; }
    if (product.hasVariants && !selectedVariant) { showToast('Please select a valid combination of options.', 'error'); return; }
    setAddingToCart(true);
    try {
      await addToCart(user.id, product.productId, { productId: product.productId, variantId: selectedVariant?.id || null, quantity });
      refreshCart();
      showToast('Added to cart!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add to cart.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) { showToast('Please log in to add items to wishlist.', 'error'); return; }
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
          <svg className="animate-spin w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
          <Link to="/" className="mt-4 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider">← Back to Home</Link>
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
  const selectedSalePercentage = selectedVariant?.salePercentage || product.salePercentage || Math.round(((originalPrice - currentPrice) / originalPrice) * 100) || 0;
  const isOnSale = selectedVariant?.onSale || product.onSale || (currentPrice < originalPrice);
  const stock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const savings = isOnSale ? Math.max(0, originalPrice - currentPrice) : 0;

  const tabs = [
    { id: 'details', label: 'Description' },
    { id: 'additionalInfo', label: 'Specifications' },
    { id: 'reviews', label: `Reviews (${product.totalReviews || reviews.length})` },
    { id: 'sizeGuide', label: 'Size Guide' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      {/* Seller Admin Control Bar */}
      {user && (user.id === product.sellerUserId || user.role === 'ADMIN') && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-700">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm">Seller Controls</span>
              <span className="font-semibold text-slate-300">You own this product listing.</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
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
              <Link to={`/seller/products?edit=${product.productId}`} className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors">
                ✏️ Edit Listing
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-1.5 text-[12px] text-slate-500">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link to="/products" className="hover:text-emerald-600 transition-colors">{product.category || 'Shop'}</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 font-medium truncate max-w-[260px]">{product.name}</span>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[64px_1fr_1fr_340px] gap-6">

          {/* Thumbnails column */}
          <div className="hidden lg:flex flex-col gap-2 order-1">
            {(product.imagePaths || []).slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setMainImage(img)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 bg-white flex items-center justify-center p-1 transition-all ${mainImage === img ? 'border-emerald-600' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <img src={img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
            {product.imagePaths?.length > 4 && (
              <div className="w-16 h-16 rounded-lg border-2 border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-[10px] font-bold text-slate-500">
                +{product.imagePaths.length - 4}
                <span className="text-[8px] font-semibold text-slate-400">View more</span>
              </div>
            )}
          </div>

          {/* Main image */}
          <div className="order-2 lg:order-2">
            {isOnSale && selectedSalePercentage > 0 && (
              <span className="inline-block bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md mb-2">-{selectedSalePercentage}%</span>
            )}
            <div className="aspect-square bg-white rounded-xl border border-gray-200 relative flex items-center justify-center p-6 group/gallery">
              {product.imagePaths?.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow border border-gray-200 opacity-0 group-hover/gallery:opacity-100 transition-opacity text-slate-700 text-sm font-bold z-10">⟨</button>
                  <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow border border-gray-200 opacity-0 group-hover/gallery:opacity-100 transition-opacity text-slate-700 text-sm font-bold z-10">⟩</button>
                </>
              )}
              {mainImage ? (
                <img
                  src={mainImage.startsWith('http') ? mainImage : `${BASE_URL}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`}
                  alt={product.name}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                />
              ) : (
                <span className="text-gray-300 font-bold tracking-widest uppercase text-[10px]">No Image Available</span>
              )}
              <button onClick={() => setIsLightboxOpen(true)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow border border-gray-200 text-slate-700 transition-transform" title="Zoom Image">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product info */}
          <div className="order-3">
            {product.brand && (
              <span className="text-[11px] font-bold tracking-wide text-slate-400 uppercase mb-1 block">{product.brand}</span>
            )}
            <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 leading-tight mb-2">{product.name}</h1>

            <div className="flex items-center gap-2 text-sm mb-4">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => {
                  const isActive = i < Math.round(product.averageRating || 0);
                  return <Star key={i} className={`w-4 h-4 ${isActive ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />;
                })}
              </div>
              <span className="font-semibold text-slate-700">{(product.averageRating || 0).toFixed(1)}</span>
              <span className="text-slate-400">·</span>
              <button onClick={() => setActiveTab('reviews')} className="text-slate-500 hover:text-emerald-600 hover:underline cursor-pointer">
                ({product.totalReviews || reviews.length} Reviews)
              </button>
              {product.unitsSold && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{product.unitsSold} sold</span>
                </>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-[26px] font-bold text-slate-900">Rs. {currentPrice?.toLocaleString()}</span>
                {isOnSale && (
                  <span className="text-base text-gray-400 line-through">Rs. {originalPrice?.toLocaleString()}</span>
                )}
              </div>
              {isOnSale && savings > 0 && (
                <span className="text-sm font-semibold text-emerald-600">You save Rs. {savings.toLocaleString()} ({selectedSalePercentage}%)</span>
              )}
            </div>

            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              {product.shortDescription || 'No short description provided for this product yet.'}
            </p>

            {/* Key feature bullets, driven from spec/features if present */}
            {product.features && (
              <ul className="space-y-1.5 mb-5">
                {product.features.split('\n').filter(Boolean).slice(0, 6).map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <Plus className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0 rotate-45" />
                    <span>{line.replace(/^[-•]\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-gray-200 my-4" />

            <div className="space-y-1 mb-5 text-xs text-slate-500">
              <p>SKU: <span className="text-slate-700 font-semibold">{selectedVariant?.sku || `PROD-${product.productId}`}</span></p>
              <p>Category: <span className="text-slate-700 font-semibold">{product.category || 'General'}</span></p>
            </div>

            {/* Variant selectors */}
            {product.hasVariants && product.attributeOptions && Object.keys(product.attributeOptions).length > 0 && (
              <div className="space-y-4 mb-5">
                {Object.entries(product.attributeOptions).map(([attrName, options]) => {
                  const isColor = attrName.toLowerCase() === 'color';
                  return (
                    <div key={attrName}>
                      <h4 className="text-sm font-semibold text-slate-800 mb-2">
                        {attrName}: <span className="font-normal text-slate-500">{selectedAttributes[attrName] || '—'}</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {options.map(opt => {
                          const isSelected = selectedAttributes[attrName] === opt.value;
                          if (isColor) {
                            const hexColor = getColorHex(opt.value);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleAttributeChange(attrName, opt.value)}
                                style={{ backgroundColor: hexColor }}
                                className={`w-9 h-9 rounded-full transition-all border-2 ${isSelected ? 'ring-2 ring-offset-2 ring-emerald-600 border-white' : 'border-gray-200 hover:scale-105'}`}
                                title={opt.value}
                              />
                            );
                          }
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleAttributeChange(attrName, opt.value)}
                              className={`px-3.5 h-9 flex items-center justify-center text-xs font-semibold rounded-lg border transition-all ${isSelected ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-gray-300 text-slate-700 bg-white hover:border-gray-400'}`}
                            >
                              {opt.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {!selectedVariant && (
                  <p className="text-xs font-semibold text-red-500 flex items-center gap-1">⚠️ Selected option combination is currently unavailable.</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-700">Quantity:</span>
              <div className="flex border border-gray-300 rounded-lg items-center bg-white h-10 overflow-hidden">
                <button className="w-9 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="w-3.5 h-3.5" /></button>
                <span className="w-10 text-center font-bold text-slate-800 text-sm">{quantity}</span>
                <button className="w-9 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors" onClick={() => setQuantity(q => Math.min(stock || 99, q + 1))}><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>

          {/* Right sidebar: purchase box */}
          <div className="order-4 lg:order-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="relative flex h-2 w-2">
                  {stock > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  {stock > 0 ? (stock < 5 ? `Only ${stock} left!` : 'In Stock') : <span className="text-red-500">Out of Stock</span>}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-0.5">Ships from {product.storeName || 'Shopwise Marketplace'}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                Sold by <span className="font-semibold text-slate-700">{product.storeName || 'Shopwise Seller'}</span>
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
              </div>

              <div className="border-t border-gray-150 pt-3 mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Delivery</p>
                    <p className="text-[11px] text-slate-500">{product.freeShipping ? 'Free delivery on orders over Rs. 5,000' : 'Standard shipping rates apply'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-150 pt-3 mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <RefreshCcw className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Returns</p>
                    <p className="text-[11px] text-slate-500">30-day easy returns</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || stock < 1 || (product.hasVariants && !selectedVariant)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm h-12 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {addingToCart ? 'Adding…' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => setIsMsgModalOpen(true)}
                  className="w-full bg-white border border-gray-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 font-semibold text-sm h-12 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Seller
                </button>
                <button
                  onClick={handleAddToWishlist}
                  disabled={addingToWishlist}
                  className="w-full bg-white border border-gray-300 hover:border-red-400 hover:text-red-500 text-slate-700 font-semibold text-sm h-12 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Add to Wishlist
                </button>
              </div>

              <div className="border-t border-gray-150 pt-4 grid grid-cols-2 gap-3 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500"><Lock className="w-3.5 h-3.5 text-slate-400" /> Secure Payments</div>
                <div className="flex items-center gap-1.5 text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Buyer Protection</div>
                <div className="flex items-center gap-1.5 text-slate-500"><Award className="w-3.5 h-3.5 text-slate-400" /> {product.warrantyMonths ? `${product.warrantyMonths}mo Warranty` : 'Manufacturer Warranty'}</div>
                <div className="flex items-center gap-1.5 text-slate-500"><Headphones className="w-3.5 h-3.5 text-slate-400" /> 24/7 Support</div>
              </div>

              <div className="border-t border-gray-150 pt-4 mt-4 flex items-center gap-2">
                {['f', 't', 'in', '✉'].map((label, i) => (
                  <span key={i} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-slate-500">{label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed section */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 mt-6">
          <div className="flex border-b border-gray-200 gap-6 mb-6 overflow-x-auto text-sm font-semibold text-slate-400">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-slate-900 border-b-2 border-emerald-600' : 'hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-sm leading-relaxed text-slate-600">
            {activeTab === 'details' && (
              <div className="space-y-4">
                {product.description ? (
                  <div className="prose prose-sm max-w-none break-words text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
                ) : (
                  <p className="text-slate-500">{product.shortDescription || 'No detailed description available.'}</p>
                )}
              </div>
            )}

            {activeTab === 'sizeGuide' && <SizeGuideTable />}

            {activeTab === 'additionalInfo' && (
              <div className="space-y-6">
                {product.specification && (
                  <div className="divide-y divide-gray-150 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {parseSpecification(product.specification).map((spec, i) => (
                      <div key={i} className="px-4 py-3 grid grid-cols-3 gap-4 text-xs hover:bg-slate-50/50 transition-colors">
                        <span className="col-span-1 font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">{getSpecIcon(spec.key)} {spec.key}</span>
                        <span className="col-span-2 text-slate-800 font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {product.warrantyMonths > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Warranty</h5>
                    <p className="text-sm font-bold text-emerald-600">{product.warrantyMonths} Months Manufacturer Warranty</p>
                  </div>
                )}

                {/* Seller Info */}
                <div className="bg-slate-50/60 border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                    <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center overflow-hidden">
                      {product.logoImagePath || product.profileImagePath ? (
                        <img src={(product.logoImagePath || product.profileImagePath).startsWith('http') ? (product.logoImagePath || product.profileImagePath) : `${BASE_URL}${(product.logoImagePath || product.profileImagePath).startsWith('/') ? '' : '/'}${product.logoImagePath || product.profileImagePath}`} alt="Seller Logo" className="w-full h-full object-cover" />
                      ) : <span className="text-xl">🏪</span>}
                    </div>
                    <div className="flex-1 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{product.storeName || 'Shopwise Seller'}</h3>
                        <p className="text-xs text-slate-400">{product.sellerFullName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/seller-profile/${product.sellerUserId}`} className="bg-white border border-gray-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 font-semibold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1">
                          <Store className="w-3.5 h-3.5" /> Visit Store
                        </Link>
                        <button onClick={() => setIsMsgModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> Message Seller
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {product.sellerEmail && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <div><span className="text-[10px] text-slate-400 block uppercase tracking-wide">Email</span><span className="text-slate-700">{product.sellerEmail}</span></div>
                      </div>
                    )}
                    {product.sellerContactNumber && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <div><span className="text-[10px] text-slate-400 block uppercase tracking-wide">Phone</span><span className="text-slate-700">{product.sellerContactNumber}</span></div>
                      </div>
                    )}
                    {product.storeAddress && (
                      <div className="col-span-1 md:col-span-2 flex items-start gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                        <div><span className="text-[10px] text-slate-400 block uppercase tracking-wide">Store Address</span><span className="text-slate-700">{product.storeAddress}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">No reviews yet for this product.</p>
                  </div>
                ) : (
                  reviews.map(review => {
                    const hasImages = (review.images && review.images.length > 0) || review.imagePath;
                    return (
                      <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1 text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{review.customerName}</p>
                            <p className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-slate-600 mt-1">{review.comment}</p>}
                        {hasImages && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(review.images && review.images.length > 0 ? review.images : [{ imagePath: review.imagePath }]).map((imgObj, idx) => {
                              const path = imgObj.imagePath;
                              const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
                              return (
                                <div key={idx} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-0.5">
                                  <img src={fullUrl} alt="Review attachment" className="object-contain w-full h-full cursor-pointer" onClick={() => window.open(fullUrl, '_blank')} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {review.sellerReply && (
                          <div className="mt-2.5 bg-slate-50 rounded-lg p-2.5 border-l-2 border-emerald-500 text-xs">
                            <p className="font-bold uppercase tracking-wide text-slate-800 mb-0.5">Seller Response</p>
                            <p className="text-slate-600">{review.sellerReply}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-bold text-slate-800 mb-4">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {isLightboxOpen && mainImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-zoom-out" onClick={() => setIsLightboxOpen(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors" onClick={() => setIsLightboxOpen(false)}>✕</button>
          <img
            src={mainImage.startsWith('http') ? mainImage : `${BASE_URL}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`}
            alt={product.name}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Message modal */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200">
            <div className="px-5 py-3.5 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wide">Product Inquiry</span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">Inquire about "{product.name}"</h3>
              </div>
              <button onClick={() => { setIsMsgModalOpen(false); setMsgError(''); setMsgSuccess(false); }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors font-bold">✕</button>
            </div>
            <form onSubmit={handleSendMessage} className="p-5 space-y-3">
              {msgError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">⚠️ {msgError}</div>}
              {msgSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs font-semibold">🎉 Inquiry sent successfully! Closing…</div>}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Your Inquiry</label>
                <textarea
                  rows="4"
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder={`Hi ${product.sellerFullName || 'Seller'}, I am interested in "${product.name}". Can you provide more details regarding availability/pricing?`}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 resize-none transition-all"
                  disabled={sendingMsg || msgSuccess}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setIsMsgModalOpen(false); setMsgError(''); setMsgSuccess(false); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex-1 transition-all" disabled={sendingMsg || msgSuccess}>Cancel</button>
                <button type="submit" disabled={sendingMsg || msgSuccess} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex-1 transition-all disabled:opacity-50">{sendingMsg ? 'Sending...' : 'Send Inquiry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;