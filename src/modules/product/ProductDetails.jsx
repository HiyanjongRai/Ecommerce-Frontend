import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, addToCart, getReviewsForProduct, addToWishlist, getProducts, sendMessage } from '../../shared/api/customerApi';
import { BASE_URL } from '../../shared/api/apiClient';
import { useCustomer } from '../customer/contexts/CustomerContext';
import { updateSellerProductStatus } from '../seller/services/sellerService';
import ProductCard from './components/ProductCard';
import { useToast } from '../../shared/contexts/ToastContext';

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
          <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
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
          <Link to="/" className="mt-4 text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">← Back to Home</Link>
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
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#222529]">
      {/* Seller Admin Control Bar */}
      {user && (user.id === product.sellerUserId || user.role === 'ADMIN') && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-700 shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
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
                  className="bg-slate-800 border border-slate-700 text-white font-extrabold rounded-sm px-2.5 py-1 text-[10px] uppercase tracking-wider focus:outline-none focus:border-blue-500 cursor-pointer"
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#777]">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-blue-600 transition-colors">{product.category || 'Shop'}</Link>
          <span>/</span>
          <span className="text-[#222] font-black">{product.name}</span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="bg-white border border-gray-200 rounded-sm p-4 md:p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[4.5fr_7.5fr] gap-6 md:gap-8">

            {/* Left: Gallery */}
            <div>
              <div className="aspect-square max-h-[340px] bg-white rounded-sm overflow-hidden border border-gray-200 mb-3 relative flex items-center justify-center p-3 mx-auto">
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
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <span className="text-gray-300 font-bold tracking-widest uppercase text-[10px]">No Image Available</span>
                )}
              </div>
              {product.imagePaths?.length > 1 && (
                <div className="flex gap-2 justify-center overflow-x-auto pb-1">
                  {product.imagePaths.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setMainImage(img)}
                      className={`w-12 h-12 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-all p-0.5 bg-white ${mainImage === img ? 'border-blue-600' : 'border-gray-200 hover:border-gray-400'}`}
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
                    <span className="text-[9px] font-black tracking-widest text-[#777] uppercase mb-0.5 block">{product.brand}</span>
                  )}
                  <h1 className="text-lg md:text-xl font-bold text-[#222529] tracking-tight leading-tight mb-1">
                    {product.name}
                  </h1>
                  
                  {/* Rating & reviews */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex text-[#e0a800] text-xs">
                      {'★'.repeat(Math.round(product.averageRating || 0))}{'☆'.repeat(5 - Math.round(product.averageRating || 0))}
                    </div>
                    <span className="text-[10px] font-bold text-[#777]">({product.totalReviews || reviews.length} reviews)</span>
                  </div>
                </div>

                {/* Price Block */}
                <div className="mb-4">
                  <div className="flex items-end gap-2.5 mb-0.5">
                    <span className="text-xl md:text-2xl font-extrabold text-[#222529]">
                      Rs. {currentPrice?.toLocaleString()}
                    </span>
                    {isOnSale && (
                      <span className="text-sm text-[#777] font-bold line-through mb-0.5">
                        Rs. {originalPrice?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-green-600">
                    {stock > 0 ? (stock < 5 ? `Only ${stock} left in stock` : 'In Stock') : <span className="text-red-500">Out of Stock</span>}
                  </p>
                  {product.status !== 'ACTIVE' && (
                    <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-orange-100 text-orange-700 border border-orange-200 mt-1.5 font-sans">
                      ⚠️ Listing Status: {product.status}
                    </span>
                  )}
                </div>

                {/* Short Description */}
                <div className="text-xs text-[#777] leading-relaxed mb-4 font-medium">
                  {product.shortDescription || 'Experience the perfect blend of performance and styling in a clean, modern design built to last.'}
                </div>

                {/* Dynamic Variant Selectors */}
                {product.hasVariants && product.attributeOptions && Object.keys(product.attributeOptions).length > 0 && (
                  <div className="space-y-3 mb-4 border-t border-gray-150 pt-4">
                    {Object.entries(product.attributeOptions).map(([attrName, options]) => (
                      <div key={attrName} className="flex items-center">
                        <h4 className="w-20 text-[10px] font-bold uppercase tracking-widest text-[#777]">{attrName}:</h4>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {options.map(opt => {
                            const isSelected = selectedAttributes[attrName] === opt.value;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleAttributeChange(attrName, opt.value)}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border transition-all ${
                                  isSelected 
                                    ? 'border-[#222529] bg-[#222529] text-white font-extrabold' 
                                    : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
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
                      <p className="text-[10px] font-bold text-red-500 mt-1">Selected option combination is currently unavailable.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Section */}
              <div className="space-y-3 pt-4 border-t border-gray-150">
                <div className="flex flex-wrap gap-2.5 items-center">
                  
                  {/* Quantity box */}
                  <div className="flex border border-gray-200 rounded-sm items-center w-24 bg-white h-9 overflow-hidden">
                    <button className="flex-1 font-bold text-[#777] hover:text-[#222529] text-sm transition-colors" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                    <span className="flex-1 text-center font-extrabold text-[#222529] text-[11px]">{quantity}</span>
                    <button className="flex-1 font-bold text-[#777] hover:text-[#222529] text-sm transition-colors" onClick={() => setQuantity(q => Math.min(stock, q + 1))}>+</button>
                  </div>

                  {/* Add to Cart button */}
                  <button 
                    onClick={handleAddToCart}
                    disabled={addingToCart || stock < 1 || (product.hasVariants && !selectedVariant)}
                    className="flex-1 min-w-[120px] bg-[#222529] hover:bg-[#000] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold text-[10px] uppercase tracking-widest h-9 rounded-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    {addingToCart ? 'Adding…' : 'Add to Cart'}
                  </button>

                  {/* Message Seller / Inquiry button */}
                  <button 
                    onClick={() => setIsMsgModalOpen(true)}
                    className="px-3.5 bg-white border border-gray-200 hover:border-gray-800 hover:text-gray-900 text-gray-700 font-extrabold text-[10px] uppercase tracking-widest h-9 rounded-sm shadow-sm transition-all flex items-center justify-center gap-1"
                    title="Inquire about product"
                  >
                    ✉ Inquire
                  </button>

                  {/* Wishlist Button */}
                  <button 
                    onClick={handleAddToWishlist}
                    disabled={addingToWishlist}
                    className="w-9 h-9 border border-gray-200 hover:border-red-400 hover:text-red-500 text-gray-400 rounded-sm flex items-center justify-center transition-colors bg-white text-xs"
                    title="Add to Wishlist"
                  >
                    ♥
                  </button>
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-[#777] block uppercase tracking-wider text-[9px] font-bold mb-1">SKU</span>
                    <span className="font-bold text-[#222529]">{selectedVariant?.sku || `PROD-${product.productId}`}</span>
                  </div>
                  <div>
                    <span className="text-[#777] block uppercase tracking-wider text-[9px] font-bold mb-1">Category</span>
                    <span className="font-bold text-[#222529]">{product.category || 'Shop'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs */}
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden mb-8 shadow-sm">
          <div className="flex border-b border-gray-200 bg-white">
            {['description', 'specs', 'seller', 'reviews'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-xs font-black uppercase tracking-wider transition-all border-r border-gray-100 relative ${
                  activeTab === tab 
                    ? 'text-[#222529] border-t-2 border-t-[#222529] bg-white font-black' 
                    : 'text-[#777] hover:text-[#222529] hover:bg-gray-50'
                }`}
              >
                {tab === 'specs' ? 'Specifications' : tab === 'seller' ? 'Seller Info' : tab}
                {tab === 'reviews' && ` (${product.totalReviews || reviews.length})`}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8 overflow-hidden">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-[#777] leading-relaxed font-medium break-words overflow-hidden">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p>{product.shortDescription || 'No detailed description available.'}</p>
                )}
              </div>
            )}
            
            {activeTab === 'specs' && (
              <div className="space-y-6">
                {product.specification && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-2">General Specs</h4>
                    <p className="text-xs text-[#777] whitespace-pre-wrap leading-relaxed break-words">{product.specification}</p>
                  </div>
                )}
                {product.features && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-2">Key Features</h4>
                    <p className="text-xs text-[#777] whitespace-pre-wrap leading-relaxed break-words">{product.features}</p>
                  </div>
                )}
                {product.colorOptions && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-2">Color Options</h4>
                    <p className="text-xs text-[#777]">{product.colorOptions}</p>
                  </div>
                )}
                {product.storageSpec && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-2">Storage Options</h4>
                    <p className="text-xs text-[#777]">{product.storageSpec}</p>
                  </div>
                )}
                {(product.manufactureDate || product.expiryDate) && (
                  <div className="grid grid-cols-2 gap-4">
                    {product.manufactureDate && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-2">Manufacture Date</h4>
                        <p className="text-xs text-[#777]">{new Date(product.manufactureDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {product.expiryDate && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-2">Expiry Date</h4>
                        <p className="text-xs text-red-600 font-bold">{new Date(product.expiryDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                )}
                {product.warrantyMonths > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#222529] mb-2">Warranty</h4>
                    <p className="text-xs text-[#777] font-bold">{product.warrantyMonths} Months</p>
                  </div>
                )}
                {!product.specification && !product.features && !product.warrantyMonths && !product.colorOptions && !product.storageSpec && !product.manufactureDate && !product.expiryDate && (
                  <p className="text-xs text-gray-400 font-medium">No detailed specifications provided.</p>
                )}
              </div>
            )}

            {activeTab === 'seller' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                  <div className="w-14 h-14 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden">
                    {product.logoImagePath || product.profileImagePath ? (
                      <img src={(product.logoImagePath || product.profileImagePath).startsWith('http') ? (product.logoImagePath || product.profileImagePath) : `${BASE_URL}${(product.logoImagePath || product.profileImagePath).startsWith('/') ? '' : '/'}${product.logoImagePath || product.profileImagePath}`} alt="Seller Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🏪</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-[#222529]">{product.storeName || 'Jhapcham Seller'}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{product.sellerFullName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/seller-profile/${product.sellerUserId}`}
                        className="bg-white border border-gray-200 hover:border-gray-800 text-gray-700 font-extrabold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors"
                      >
                        🏪 Visit Store
                      </Link>
                      <button
                        onClick={() => setIsMsgModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors"
                      >
                        ✉ Message Seller
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {product.sellerEmail && (
                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-[#777] mb-1">Email Contact</h4>
                      <p className="text-[#222529] font-medium">{product.sellerEmail}</p>
                    </div>
                  )}
                  {product.sellerContactNumber && (
                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-[#777] mb-1">Phone Number</h4>
                      <p className="text-[#222529] font-medium">{product.sellerContactNumber}</p>
                    </div>
                  )}
                  {product.storeAddress && (
                    <div className="col-span-1 md:col-span-2">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-[#777] mb-1">Store Address</h4>
                      <p className="text-[#222529] font-medium">{product.storeAddress}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-[#777] mb-2">Shipping Rates</h4>
                  <div className="bg-[#fafafa] rounded-sm p-4 grid grid-cols-2 gap-4 border border-gray-100">
                    <div>
                      <p className="text-[10px] text-[#777] font-bold uppercase tracking-wider mb-1">Inside Valley</p>
                      <p className="text-xs font-black text-[#222529]">{product.freeShipping ? 'FREE' : `Rs. ${product.insideValleyShipping || 0}`}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#777] font-bold uppercase tracking-wider mb-1">Outside Valley</p>
                      <p className="text-xs font-black text-[#222529]">{product.freeShipping ? 'FREE' : `Rs. ${product.outsideValleyShipping || 0}`}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No reviews yet for this product.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="font-extrabold text-xs text-[#222529]">{review.customerName}</p>
                            <p className="text-[9px] text-[#777] font-bold uppercase tracking-wider">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex text-[#e0a800] text-xs">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                        </div>
                        {review.comment && <p className="text-xs text-[#777] mt-1 leading-relaxed">{review.comment}</p>}
                        {review.sellerReply && (
                          <div className="mt-2 bg-gray-50 rounded-sm p-3 border-l-2 border-[#222529]">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#222529] mb-1">Seller Response</p>
                            <p className="text-xs text-[#777]">{review.sellerReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-black uppercase tracking-widest text-[#222529] mb-6 pb-2 border-b-2 border-b-[#222529] inline-block">
              Related Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Message / Inquiry Modal */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-md w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[8px] font-black bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  Product Inquiry
                </span>
                <h3 className="text-xs font-black text-gray-900 mt-1 uppercase tracking-wider">
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
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
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
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Your Inquiry
                </label>
                <textarea
                  rows="4"
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder={`Hi ${product.sellerFullName || 'Seller'}, I am interested in "${product.name}". Can you provide more details regarding availability/pricing?`}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500/80 resize-none transition-all"
                  disabled={sendingMsg || msgSuccess}
                />
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMsgModalOpen(false);
                    setMsgError('');
                    setMsgSuccess(false);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex-1 transition-all"
                  disabled={sendingMsg || msgSuccess}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg || msgSuccess}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex-1 transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50"
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
