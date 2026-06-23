import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, addToCart, getReviewsForProduct, addToWishlist, getProducts, sendMessage } from '../../shared/api/customerApi';
import { BASE_URL } from '../../shared/api/apiClient';
import { useCustomer } from '../customer/contexts/CustomerContext';
import { updateSellerProductStatus } from '../seller/services/sellerService';
import ProductCard from './components/ProductCard';
import { useToast } from '../../shared/contexts/ToastContext';
import sanitizeHtml from '../../shared/utils/sanitizeHtml';
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
    return <Cpu className="w-3.5 h-3.5 text-green-600" />;
  }
  if (normalizedKey.includes('display') || normalizedKey.includes('screen')) {
    return <Tv className="w-3.5 h-3.5 text-green-600" />;
  }
  if (normalizedKey.includes('camera')) {
    return <Camera className="w-3.5 h-3.5 text-green-600" />;
  }
  if (normalizedKey.includes('ram') || normalizedKey.includes('storage')) {
    return <Database className="w-3.5 h-3.5 text-green-600" />;
  }
  if (normalizedKey.includes('battery') || normalizedKey.includes('charging') || normalizedKey.includes('power')) {
    return <Zap className="w-3.5 h-3.5 text-green-600" />;
  }
  if (normalizedKey.includes('build') || normalizedKey.includes('material') || normalizedKey.includes('shield') || normalizedKey.includes('warranty')) {
    return <ShieldCheck className="w-3.5 h-3.5 text-green-600" />;
  }
  return <Sliders className="w-3.5 h-3.5 text-green-600" />;
};

const getColorHex = (colorName) => {
  const map = {
    blue: '#0088cc',
    tan: '#e3cfa8',
    'dark blue': '#2e5b82',
    black: '#1a1a1a',
    white: '#f9f9f9',
    red: '#ef4444',
    green: '#22c55e',
    gray: '#6b7280',
    grey: '#6b7280',
    yellow: '#eab308'
  };
  return map[colorName.toLowerCase()] || '#cccccc';
};

const SizeGuideTable = () => (
  <div className="overflow-x-auto border border-gray-150 rounded-2xl bg-white shadow-2xs p-4">
    <table className="w-full text-xs text-left text-slate-600 font-semibold border-collapse">
      <thead>
        <tr className="border-b border-gray-200 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
          <th className="px-4 py-2.5">Size</th>
          <th className="px-4 py-2.5">US</th>
          <th className="px-4 py-2.5">UK</th>
          <th className="px-4 py-2.5">EU</th>
          <th className="px-4 py-2.5">Chest (in)</th>
          <th className="px-4 py-2.5">Waist (in)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <tr className="hover:bg-slate-50/50 transition-colors">
          <td className="px-4 py-2.5 font-bold text-slate-900">S</td>
          <td className="px-4 py-2.5">34-36</td>
          <td className="px-4 py-2.5">34-36</td>
          <td className="px-4 py-2.5">44-46</td>
          <td className="px-4 py-2.5">36-38</td>
          <td className="px-4 py-2.5">30-32</td>
        </tr>
        <tr className="hover:bg-slate-50/50 transition-colors">
          <td className="px-4 py-2.5 font-bold text-slate-900">M</td>
          <td className="px-4 py-2.5">38-40</td>
          <td className="px-4 py-2.5">38-40</td>
          <td className="px-4 py-2.5">48-50</td>
          <td className="px-4 py-2.5">38-40</td>
          <td className="px-4 py-2.5">32-34</td>
        </tr>
        <tr className="hover:bg-slate-50/50 transition-colors">
          <td className="px-4 py-2.5 font-bold text-slate-900">L</td>
          <td className="px-4 py-2.5">42-44</td>
          <td className="px-4 py-2.5">42-44</td>
          <td className="px-4 py-2.5">52-54</td>
          <td className="px-4 py-2.5">40-42</td>
          <td className="px-4 py-2.5">34-36</td>
        </tr>
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

  // Gallery
  const [mainImage, setMainImage] = useState('');

  // Variants
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // UI State
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
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
    window.scrollTo(0, 0);
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

  const handlePrevImage = () => {
    if (!product || !product.imagePaths || product.imagePaths.length === 0) return;
    const currentIdx = product.imagePaths.indexOf(mainImage);
    const prevIdx = (currentIdx - 1 + product.imagePaths.length) % product.imagePaths.length;
    setMainImage(product.imagePaths[prevIdx]);
  };

  const handleNextImage = () => {
    if (!product || !product.imagePaths || product.imagePaths.length === 0) return;
    const currentIdx = product.imagePaths.indexOf(mainImage);
    const nextIdx = (currentIdx + 1) % product.imagePaths.length;
    setMainImage(product.imagePaths[nextIdx]);
  };

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
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
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
                  className="bg-slate-800 border border-slate-700 text-white font-extrabold rounded-sm px-2.5 py-1 text-[10px] uppercase tracking-wider focus:outline-none focus:border-green-500 cursor-pointer"
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
      <div className="bg-white border-b border-gray-150 shadow-2xs mt-3 mb-4">
        <div className="max-w-6xl mx-auto px-4 pb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          <Link to="/" className="hover:text-green-600 transition-colors">Home</Link>
          <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
          <Link to="/products" className="hover:text-green-600 transition-colors">{product.category || 'Shop'}</Link>
          <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        <div className="bg-white border border-gray-200 rounded-[20px] p-5 md:p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 md:gap-8">

            {/* Left: Gallery Column */}
            <div>
              <div 
                className="aspect-square max-h-[360px] bg-white rounded-2xl overflow-hidden border border-gray-150 mb-3 relative flex items-center justify-center p-4 mx-auto shadow-xs group/gallery"
              >
                {/* Badges top-left */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 select-none">
                  <span className="bg-[#16A34A] text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    HOT
                  </span>
                  {selectedSalePercentage > 0 && (
                    <span className="bg-red-550 text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                      -{selectedSalePercentage}%
                    </span>
                  )}
                </div>

                {/* Left/Right overlay navigation arrows */}
                {product.imagePaths?.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300 text-slate-700 hover:scale-105 border border-gray-150 cursor-pointer text-sm font-bold z-10"
                    >
                      ⟨
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300 text-slate-700 hover:scale-105 border border-gray-150 cursor-pointer text-sm font-bold z-10"
                    >
                      ⟩
                    </button>
                  </>
                )}

                {mainImage ? (
                  <img 
                    src={mainImage.startsWith('http') ? mainImage : `${BASE_URL}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`} 
                    alt={product.name} 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover/gallery:scale-102 cursor-zoom-in" 
                    onClick={() => setIsLightboxOpen(true)}
                  />
                ) : (
                  <span className="text-gray-300 font-bold tracking-widest uppercase text-[10px]">No Image Available</span>
                )}

                {/* Zoom button bottom-right */}
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md text-slate-700 hover:scale-105 border border-gray-150 cursor-pointer transition-transform z-10"
                  title="Zoom Image"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Thumbnails row below */}
              {product.imagePaths?.length > 1 && (
                <div className="flex gap-2 justify-start overflow-x-auto pb-1 max-w-[360px] mx-auto">
                  {product.imagePaths.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setMainImage(img)}
                      className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-white cursor-pointer ${mainImage === img ? 'border-slate-800 shadow-sm' : 'border-gray-200 hover:border-gray-400'}`}
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
                <div className="border-b border-gray-150 pb-4 mb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      {product.brand && (
                        <span className="text-[9px] font-black tracking-widest text-green-600 uppercase mb-1 block">{product.brand}</span>
                      )}
                      <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight mb-2">
                        {product.name}
                      </h1>
                    </div>
                    {/* Next/Prev product arrows in top right */}
                    <div className="flex gap-1 flex-shrink-0 select-none">
                      <button className="w-7 h-7 rounded-full border border-gray-250 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-400 transition-all cursor-pointer font-bold" title="Previous product">
                        ⟨
                      </button>
                      <button className="w-7 h-7 rounded-full border border-gray-250 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-400 transition-all cursor-pointer font-bold" title="Next product">
                        ⟩
                      </button>
                    </div>
                  </div>
                  
                  {/* Rating & reviews */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <div className="flex items-center">
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
                    <span className="font-bold text-slate-400 hover:underline cursor-pointer" onClick={() => setActiveTab('reviews')}>
                      ( {product.totalReviews || reviews.length} Reviews )
                    </span>
                  </div>
                </div>

                {/* Price block */}
                <div className="mb-4 flex flex-col gap-1">
                  <div className="flex items-baseline gap-3">
                    {isOnSale && (
                      <span className="text-sm text-gray-400 font-bold line-through">
                        Rs. {originalPrice?.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xl md:text-2xl font-black text-slate-900">
                      Rs. {currentPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="relative flex h-2 w-2">
                      {stock > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {stock > 0 ? (stock < 5 ? `Only ${stock} left!` : 'In Stock') : <span className="text-red-500 font-extrabold">Out of Stock</span>}
                    </span>
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed mb-4 font-semibold">
                  {product.shortDescription || 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper.'}
                </p>

                {/* Metadata: SKU & TAGS */}
                <div className="space-y-1 mb-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  <p>
                    SKU: <span className="text-slate-800 font-black">{selectedVariant?.sku || `PROD-${product.productId}`}</span>
                  </p>
                  <p>
                    TAGS: <span className="text-slate-800 font-black">{product.category || 'CLOTHES'}, SWEATER</span>
                  </p>
                </div>

                {/* Dynamic Variant Selectors */}
                {product.hasVariants && product.attributeOptions && Object.keys(product.attributeOptions).length > 0 && (
                  <div className="space-y-3 mb-6 border-t border-gray-150 pt-4">
                    {Object.entries(product.attributeOptions).map(([attrName, options]) => {
                      const isColor = attrName.toLowerCase() === 'color';
                      return (
                        <div key={attrName} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-b-0">
                          <h4 className="w-16 text-[10px] font-black uppercase tracking-widest text-slate-400">{attrName}:</h4>
                          <div className="flex flex-wrap gap-2 flex-1">
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
                                    className={`w-7 h-7 rounded-md transition-all relative cursor-pointer border ${
                                      isSelected 
                                        ? 'ring-2 ring-green-500 scale-110 border-white shadow-md' 
                                        : 'border-gray-200 hover:scale-105'
                                    }`}
                                    title={opt.value}
                                  >
                                    {isSelected && (
                                      <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${opt.value.toLowerCase() === 'white' ? 'text-black' : 'text-white'}`}>
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                );
                              }
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleAttributeChange(attrName, opt.value)}
                                  className={`w-9 h-9 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'border-slate-800 bg-slate-800 text-white font-extrabold shadow-sm' 
                                      : 'border-gray-200 text-slate-700 bg-white hover:border-gray-400'
                                  }`}
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
                      <p className="text-[9px] font-bold text-red-500 mt-2 flex items-center gap-1 font-sans">
                        <span>⚠️</span> Selected option combination is currently unavailable.
                      </p>
                    )}
                  </div>
                )}

                {/* Actions row: quantity selector + ADD TO CART */}
                <div className="space-y-4 pt-4 border-t border-gray-150">
                  <div className="flex flex-wrap gap-3 items-stretch w-full">
                    {/* Quantity box */}
                    <div className="flex border border-gray-250 rounded-xl items-center w-28 bg-white h-11 md:h-12 overflow-hidden shadow-2xs">
                      <button className="flex-1 font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50 h-full flex items-center justify-center transition-colors focus:outline-none cursor-pointer" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                      <span className="w-8 text-center font-black text-slate-800 text-xs">{quantity}</span>
                      <button className="flex-1 font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50 h-full flex items-center justify-center transition-colors focus:outline-none cursor-pointer" onClick={() => setQuantity(q => Math.min(stock, q + 1))}>+</button>
                    </div>

                    {/* ADD TO CART button (dark slate/gray) */}
                    <button 
                      onClick={handleAddToCart}
                      disabled={addingToCart || stock < 1 || (product.hasVariants && !selectedVariant)}
                      className="flex-1 min-w-[160px] bg-slate-700 hover:bg-slate-800 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed text-white font-black text-xs md:text-sm uppercase tracking-widest h-11 md:h-12 rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{addingToCart ? 'Adding…' : 'Add to Cart'}</span>
                    </button>

                    {/* Message Seller button */}
                    <button 
                      onClick={() => setIsMsgModalOpen(true)}
                      className="px-3.5 bg-white border border-gray-250 hover:border-slate-800 text-slate-700 hover:text-slate-900 font-extrabold text-[10px] uppercase tracking-wider h-11 md:h-12 rounded-xl shadow-2xs hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Inquire about product"
                    >
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="hidden sm:inline">Message Seller</span>
                    </button>
                  </div>

                  {/* Share row + Wishlist */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100">
                    {/* Social share icons */}
                    <div className="flex gap-2">
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#1877F2] hover:text-white flex items-center justify-center text-[10px] text-slate-500 transition-colors" title="Share on Facebook">
                        f
                      </a>
                      <a href={`https://twitter.com/intent/tweet?url=${window.location.href}&text=${product.name}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#1DA1F2] hover:text-white flex items-center justify-center text-[10px] text-slate-500 transition-colors" title="Share on Twitter">
                        t
                      </a>
                      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#0A66C2] hover:text-white flex items-center justify-center text-[10px] text-slate-500 transition-colors" title="Share on LinkedIn">
                        in
                      </a>
                      <a href="#" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#DB4437] hover:text-white flex items-center justify-center text-[10px] text-slate-500 transition-colors" title="Share on Google+">
                        G+
                      </a>
                      <a href={`mailto:?subject=${product.name}&body=${window.location.href}`} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-slate-700 hover:text-white flex items-center justify-center text-[10px] text-slate-500 transition-colors" title="Share via Email">
                        ✉
                      </a>
                    </div>

                    {/* ADD TO WISHLIST button */}
                    <button 
                      onClick={handleAddToWishlist}
                      disabled={addingToWishlist}
                      className="flex items-center gap-1.5 hover:text-red-500 text-slate-700 font-extrabold text-[10px] uppercase tracking-widest cursor-pointer transition-colors"
                      title="Add to Wishlist"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Add to Wishlist</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Tabbed Section */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-5 md:p-6 mb-6 shadow-sm">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-150 gap-6 mb-6 overflow-x-auto pb-1 text-xs font-black tracking-widest uppercase text-gray-400 select-none">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'details' ? 'text-slate-900 border-b-2 border-slate-900' : 'hover:text-slate-700'}`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('sizeGuide')}
              className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'sizeGuide' ? 'text-slate-900 border-b-2 border-slate-900' : 'hover:text-slate-700'}`}
            >
              Size Guide
            </button>
            <button
              onClick={() => setActiveTab('additionalInfo')}
              className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'additionalInfo' ? 'text-slate-900 border-b-2 border-slate-900' : 'hover:text-slate-700'}`}
            >
              Additional Information
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'reviews' ? 'text-slate-900 border-b-2 border-slate-900' : 'hover:text-slate-700'}`}
            >
              Reviews ({product.totalReviews || reviews.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="text-xs md:text-sm leading-relaxed text-slate-600 font-semibold font-sans">
            {activeTab === 'details' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {product.description ? (
                  <div className="prose prose-sm max-w-none break-words overflow-hidden text-slate-600 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
                ) : (
                  <p className="text-slate-500 font-medium">{product.shortDescription || 'No detailed description available.'}</p>
                )}
                
                {/* Checkmark Bullets for Key Features */}
                <div className="space-y-2 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">✓</span>
                    <span className="text-slate-700 font-bold">Any Product types that You want - Simple, Configurable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">✓</span>
                    <span className="text-slate-700 font-bold">Downloadable/Digital Products, Virtual Products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">✓</span>
                    <span className="text-slate-700 font-bold">Inventory Management with Backordered items</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sizeGuide' && (
              <div className="animate-in fade-in duration-200">
                <SizeGuideTable />
              </div>
            )}

            {activeTab === 'additionalInfo' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Specifications */}
                {(product.specification || product.features || product.warrantyMonths) && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-3">Specifications</h4>
                    <div className="space-y-4">
                      {product.specification && (
                        <div className="divide-y divide-gray-150 border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-2xs">
                          {parseSpecification(product.specification).map((spec, i) => (
                            <div key={i} className="px-4 py-3 grid grid-cols-3 gap-4 text-xs hover:bg-slate-50/50 transition-colors">
                              <span className="col-span-1 font-black text-slate-400 uppercase tracking-wider">{spec.key}</span>
                              <span className="col-span-2 text-slate-800 font-extrabold leading-normal">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {product.features && product.features !== product.specification && !product.features.startsWith('SpecificationDetails') && (
                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
                          <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-slate-800" />
                            <span>Key Features</span>
                          </h5>
                          <p className="text-xs font-semibold text-slate-650 whitespace-pre-wrap leading-relaxed break-words">{product.features}</p>
                        </div>
                      )}
                      {product.warrantyMonths > 0 && (
                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
                          <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Warranty</h5>
                          <p className="text-xs font-black text-green-600">{product.warrantyMonths} Months Manufacturer Warranty</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Seller Info */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-3">Seller Information</h4>
                  <div className="bg-slate-50/50 border border-gray-150 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                      <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center overflow-hidden shadow-3xs">
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
                            className="bg-white border border-gray-250 hover:border-slate-800 text-slate-700 hover:text-slate-900 font-extrabold text-[8px] uppercase tracking-widest px-3.5 py-2 rounded-lg transition-all shadow-3xs flex items-center gap-1 hover:bg-slate-50"
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>Visit Store</span>
                          </Link>
                          <button
                            onClick={() => setIsMsgModalOpen(true)}
                            className="bg-[#16A34A] hover:bg-green-700 text-white font-extrabold text-[8px] uppercase tracking-widest px-3.5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1"
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
                    <div className="mt-3 pt-3 border-t border-gray-150">
                      <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Shipping Rates</h4>
                      <div className="bg-white rounded-xl p-3 grid grid-cols-2 gap-3 border border-gray-200 text-xs font-bold">
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
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {reviews.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No reviews yet for this product.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => {
                      const hasImages = (review.images && review.images.length > 0) || review.imagePath;
                      return (
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
                          
                          {/* Review Attachment Images */}
                          {hasImages && (
                            <div className="flex flex-wrap gap-2 mt-2 select-none">
                              {review.images && review.images.length > 0 ? (
                                review.images.map((imgObj, idx) => {
                                  const path = imgObj.imagePath;
                                  const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
                                  return (
                                    <div key={idx} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-150 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shadow-2xs hover:border-slate-400 transition-colors">
                                      <img
                                        src={fullUrl}
                                        alt="Review attachment"
                                        className="object-contain w-full h-full cursor-pointer hover:scale-102 transition-transform"
                                        onClick={() => window.open(fullUrl, '_blank')}
                                      />
                                    </div>
                                  );
                                })
                              ) : (
                                (() => {
                                  const path = review.imagePath;
                                  const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
                                  return (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-150 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shadow-2xs hover:border-slate-400 transition-colors">
                                      <img
                                        src={fullUrl}
                                        alt="Review attachment"
                                        className="object-contain w-full h-full cursor-pointer hover:scale-102 transition-transform"
                                        onClick={() => window.open(fullUrl, '_blank')}
                                      />
                                    </div>
                                  );
                                })()
                              )}
                            </div>
                          )}

                          {review.sellerReply && (
                            <div className="mt-2.5 bg-slate-50 rounded-lg p-2.5 border-l-2 border-green-500 text-xs">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 mb-0.5">Seller Response</p>
                              <p className="text-slate-600 font-semibold">{review.sellerReply}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 pb-1.5 border-b-2 border-slate-800 inline-block select-none">
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
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors cursor-pointer"
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
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn border border-gray-205">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[8px] font-black bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
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
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer font-bold"
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
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-[11px] font-semibold">
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
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-green-500/80 resize-none transition-all"
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
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex-1 transition-all cursor-pointer"
                  disabled={sendingMsg || msgSuccess}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg || msgSuccess}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-green-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex-1 transition-all shadow-lg shadow-green-600/10 disabled:opacity-50 cursor-pointer font-bold"
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
