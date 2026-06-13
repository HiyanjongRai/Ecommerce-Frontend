import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Heart, 
  ShoppingCart, 
  User, 
  ChevronDown, 
  Facebook, 
  Twitter, 
  Instagram, 
  Menu,
  X,
  MapPin,
  Package,
  RotateCcw,
  HelpCircle,
  Globe,
  Trash2
} from 'lucide-react';
import { useCustomer } from '../../../modules/customer/contexts/CustomerContext';
import LoginModal from '../../../modules/auth/components/LoginModal';
import { getCart, getWishlist, removeCartItem, removeFromWishlist, addToCart, getActivePromos, searchProducts } from '../../api/customerApi';
import { getProductLink } from '../../utils/slugHelper';
import { toast } from 'react-toastify';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const resolveAvatarUrl = (user) => {
  const imagePath =
    user?.profileImagePath ||
    user?.profileImage ||
    user?.image ||
    user?.avatar ||
    null;
  if (!imagePath) return null;
  return imagePath.startsWith('http')
    ? imagePath
    : `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

export default function Navbar() {
  const navigate = useNavigate();
  const { user, cartCount, wishlistIds, logoutUser, refreshCart, refreshWishlist } = useCustomer();
  const isLoggedIn = Boolean(user?.id || user?.email || user?.username);
  const accountLabel = isLoggedIn ? (user?.username || user?.fullName || user?.email?.split('@')?.[0]) : 'User';
  const accountInitial = accountLabel?.[0]?.toUpperCase() || 'U';

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Verdant Specific States
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [activeMegaTab, setActiveMegaTab] = useState('Shop All');
  const [activePromos, setActivePromos] = useState([]);
  const [timeLeft, setTimeLeft] = useState(6 * 3600 + 44 * 60 + 12); // synced with homepage promo card

  const cartRef = useRef(null);
  const accountRef = useRef(null);
  const searchRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    setAvatarUrl(resolveAvatarUrl(user));
  }, [user]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setIsCartOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Cart Items for Verdant Dropdown
  useEffect(() => {
    if (isCartOpen && user?.id) {
      setLoadingCart(true);
      getCart(user.id)
        .then((res) => {
          setCartItems(res.data?.items || res.data || []);
          setLoadingCart(false);
        })
        .catch(() => {
          setCartItems([]);
          setLoadingCart(false);
        });
    }
  }, [isCartOpen, user?.id, cartCount]);

  // Fetch Wishlist Items for Verdant Slide-in Panel
  useEffect(() => {
    if (isWishlistOpen && user?.id) {
      setLoadingWishlist(true);
      getWishlist(user.id)
        .then((res) => {
          setWishlistItems(Array.isArray(res.data) ? res.data : []);
          setLoadingWishlist(false);
        })
        .catch(() => {
          setWishlistItems([]);
          setLoadingWishlist(false);
        });
    }
  }, [isWishlistOpen, user?.id, wishlistIds]);

  // Live Flash Sale Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 24 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active promo codes on mount
  useEffect(() => {
    getActivePromos()
      .then((res) => {
        setActivePromos(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Failed to load active promos in navbar", err);
      });
  }, []);

  // Search Autocomplete suggestions debounce
  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setIsSearchSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await searchProducts(term, { size: 5 });
        const data = res.data?.content || res.data || [];
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
        setIsSearchSuggestionsOpen(true);
      } catch (err) {
        console.error("Failed to load suggestions", err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatCountdown = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    const role = user?.role || user?.roles?.[0];

    const isRefund = /^ref-/i.test(query);
    const isOrder = /^jhc-/i.test(query) || /^#/i.test(query) || /^\d+$/.test(query);

    if (role === 'SELLER') {
      if (isRefund) {
        navigate(`/seller/refunds?refundId=${encodeURIComponent(query)}`);
      } else {
        navigate(`/seller/orders?orderId=${encodeURIComponent(query)}`);
      }
    } else if (role === 'ADMIN') {
      if (isRefund) {
        navigate(`/admin/refunds?refundId=${encodeURIComponent(query)}`);
      } else {
        navigate(`/admin/orders?orderId=${encodeURIComponent(query)}`);
      }
    } else if (role === 'CUSTOMER') {
      if (isRefund) {
        navigate(`/customer/refunds?refundId=${encodeURIComponent(query)}`);
      } else if (isOrder) {
        navigate(`/customer/orders?orderId=${encodeURIComponent(query)}`);
      } else {
        navigate(`/product-list?q=${encodeURIComponent(query)}`);
      }
    } else {
      navigate(`/product-list?q=${encodeURIComponent(query)}`);
    }
  };

  const getDashboardUrl = () => {
    if (!user) return null;
    const role = user.role || user.roles?.[0];
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'SELLER':
        return '/seller/dashboard';
      case 'CUSTOMER':
      default:
        return '/customer/dashboard';
    }
  };

  const handleUserIconClick = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      setIsAccountDropdownOpen(!isAccountDropdownOpen);
    }
  };

  const handleRemoveCartItem = async (e, cartItemId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id) return;
    try {
      await removeCartItem(user.id, cartItemId);
      toast.success('Item removed from bag');
      refreshCart();
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleRemoveWishlistItem = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id) return;
    try {
      await removeFromWishlist(user.id, productId);
      toast.success('Removed from library');
      refreshWishlist();
    } catch {
      toast.error('Failed to remove from library');
    }
  };

  const handleAddWishlistToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id) return;
    try {
      await addToCart(user.id, productId, {
        productId: productId,
        variantId: null,
        quantity: 1
      });
      toast.success('Added to bag!');
      refreshCart();
    } catch {
      toast.error('Could not add to bag');
    }
  };

  /* ===========================================================================
     RENDER VERDANT NAVBAR (Botanical specimen theme)
     =========================================================================== */
  return (
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 font-inter">
        {/* 1. Announcement Bar */}
        {isAnnouncementVisible && (
          <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 flex justify-between items-center transition-all duration-300">
            <div className="flex-1 text-center font-medium tracking-wide font-inter">
              ✨ Free shipping on orders over $50. Special packaging for all premium products.
            </div>
            <button 
              onClick={() => setIsAnnouncementVisible(false)}
              className="text-white/70 hover:text-white p-1 transition-colors outline-none focus:ring-1 focus:ring-emerald-500/20 rounded-xs"
              aria-label="Dismiss Announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Utility Nav Row */}
        <div className="bg-gray-50 text-gray-500 text-[10.5px] py-1 px-6 border-b border-gray-200 hidden lg:block">
          <div className="max-w-[1440px] mx-auto flex justify-between items-center">
            {/* Left Utility Links */}
            <div className="flex items-center gap-6">
              <Link to="/product-list" className="hover:text-emerald-600 flex items-center gap-1.5 transition-colors outline-none focus:ring-1 focus:ring-emerald-500/20 rounded-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span>Store Locator</span>
              </Link>
              <Link to="/customer/orders" className="hover:text-emerald-600 flex items-center gap-1.5 transition-colors outline-none focus:ring-1 focus:ring-emerald-500/20 rounded-xs">
                <Package className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </Link>
              <Link to="/customer/refunds" className="hover:text-emerald-600 flex items-center gap-1.5 transition-colors outline-none focus:ring-1 focus:ring-emerald-500/20 rounded-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Returns</span>
              </Link>
            </div>

            {/* Right Utility Links */}
            <div className="flex items-center gap-6">
              <Link to="/help" className="hover:text-emerald-600 flex items-center gap-1.5 transition-colors outline-none focus:ring-1 focus:ring-emerald-500/20 rounded-xs">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help & FAQs</span>
              </Link>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-600 transition-colors group">
                <Globe className="w-3.5 h-3.5" />
                <span className="font-semibold">EN / USD</span>
                <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors"><Facebook className="w-3.5 h-3.5" /></a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Navbar */}
        <div className="bg-white py-2 px-6 border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 flex-shrink-0 group outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-xs">
              <span className="font-inter font-black text-2xl text-slate-900 tracking-tight transition-colors group-hover:text-emerald-600">
                Jhapcham<span className="text-emerald-500 font-bold">.</span>
              </span>
            </Link>

            {/* Search Pill */}
            <form ref={searchRef} onSubmit={handleSearch} className="flex-1 max-w-2xl relative hidden md:block">
              <div className="relative flex items-center border border-gray-300 hover:border-emerald-500 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-pill bg-white overflow-hidden transition-all">
                <input 
                  type="text" 
                  placeholder="Search for products, brands, or categories..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.trim().length >= 2) setIsSearchSuggestionsOpen(true); }}
                  className="w-full px-4 py-1.5 text-xs bg-transparent outline-none text-slate-800 placeholder-gray-400 focus:outline-none"
                />
                <button type="submit" className="p-2 text-gray-400 hover:text-emerald-600 transition-colors outline-none">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Autocomplete Dropdown suggestions */}
              {isSearchSuggestionsOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden font-inter text-slate-800 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  {loadingSuggestions ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400 font-semibold">
                      <svg className="animate-spin h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      <span>Searching for matches…</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {suggestions.map((product) => {
                        const productUrl = getProductLink(product);
                        const img = product.imagePaths?.[0] || product.imagePath || product.thumbnail || null;
                        const resolvedImg = img ? (img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`) : null;
                        const originalPrice = product.price || product.originalPrice || product.minPrice || 0;
                        const finalPrice = product.salePrice || product.finalPrice || originalPrice;

                        return (
                          <Link 
                            key={product.id || product.productId}
                            to={productUrl}
                            onClick={() => setIsSearchSuggestionsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50/45 transition-colors group text-left"
                          >
                            <div className="w-9 h-9 rounded bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {resolvedImg ? (
                                <img src={resolvedImg} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-sm">📦</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                                {product.name}
                              </p>
                              {product.brand && (
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{product.brand}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-extrabold text-emerald-600 font-mono">Rs. {Number(finalPrice).toLocaleString()}</p>
                              {finalPrice < originalPrice && (
                                <p className="text-[9px] text-gray-400 line-through font-mono">Rs. {Number(originalPrice).toLocaleString()}</p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-400 font-semibold italic text-center">
                      No matching products found.
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Icons Actions Row */}
            <div className="flex items-center gap-4">
              
              {/* Wishlist */}
              <button 
                onClick={() => {
                  if (!isLoggedIn) setIsLoginModalOpen(true);
                  else setIsWishlistOpen(true);
                }}
                className="flex flex-col items-center gap-1 text-slate-800 hover:text-emerald-600 transition-colors relative group focus:outline-none focus:ring-2 focus:ring-emerald-500/20 p-1 rounded-xs"
                title="View Wishlist"
              >
                <div className="relative">
                  <Heart className="w-5 h-5" />
                  {wishlistIds?.size > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                      {wishlistIds.size}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider hidden lg:inline">Wishlist</span>
              </button>

              {/* Cart */}
              <div className="relative" ref={cartRef}>
                <button 
                  onClick={() => {
                    if (!isLoggedIn) setIsLoginModalOpen(true);
                    else setIsCartOpen(!isCartOpen);
                  }}
                  className="flex flex-col items-center gap-1 text-slate-800 hover:text-emerald-600 transition-colors relative group focus:outline-none focus:ring-2 focus:ring-emerald-500/20 p-1 rounded-xs"
                  title="Cart Bag"
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse shadow-sm">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider hidden lg:inline">Cart</span>
                </button>

                {/* Cart Dropdown */}
                {isCartOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-card shadow-lg z-50 p-4 font-inter text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                      <h4 className="font-inter font-bold text-sm">Shopping Bag ({cartCount})</h4>
                      <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-slate-800"><X className="w-4 h-4" /></button>
                    </div>

                    {loadingCart ? (
                      <div className="text-center py-6 text-gray-400 text-xs">Loading items...</div>
                    ) : cartItems.length > 0 ? (
                      <>
                        <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                          {cartItems.map((item) => {
                            const itemName = item.name || item.product?.name || 'Product';
                            const itemPrice = item.price || item.product?.price || item.product?.minPrice || 0;
                            const rawImg = item.image || item.product?.imagePaths?.[0] || item.product?.imagePath || item.product?.thumbnail || null;
                            const resolvedUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : null;
                            return (
                              <div key={item.cartItemId} className="flex gap-3 items-center text-xs">
                                <div className="w-12 h-12 bg-white rounded border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  {resolvedUrl ? (
                                    <img src={resolvedUrl} alt={itemName} className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="text-lg">📦</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold truncate text-slate-800">{itemName}</h5>
                                  <p className="text-gray-400 text-[10px]">Qty: {item.quantity}</p>
                                  <p className="font-semibold text-emerald-600">Rs. {(itemPrice * item.quantity).toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={(e) => handleRemoveCartItem(e, item.cartItemId)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex justify-between items-center text-xs font-bold mb-3">
                            <span>Subtotal:</span>
                            <span className="text-base text-emerald-600 font-extrabold">
                              Rs. {cartItems.reduce((acc, item) => acc + ((item.price || item.product?.price || item.product?.minPrice || 0) * item.quantity), 0).toLocaleString()}
                            </span>
                          </div>
                          <Link 
                            to="/customer/cart" 
                            onClick={() => setIsCartOpen(false)}
                            className="block w-full py-2.5 bg-emerald-600 text-white text-center text-xs font-bold rounded-pill hover:bg-emerald-700 transition-colors focus:ring-2 focus:ring-emerald-500/20"
                          >
                            Checkout Bag
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-xs">
                        Your bag is empty.<br />Let's add some products!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account Dropdown */}
              <div className="relative" ref={accountRef}>
                <button 
                  onClick={handleUserIconClick}
                  className="flex flex-col items-center gap-1 text-slate-800 hover:text-emerald-600 transition-colors relative group focus:outline-none focus:ring-2 focus:ring-emerald-500/20 p-1 rounded-xs"
                  title={isLoggedIn ? 'Account Options' : 'Sign In'}
                >
                  <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={accountLabel} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-800" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider hidden lg:inline">{isLoggedIn ? 'Account' : 'Login'}</span>
                </button>

                {isLoggedIn && isAccountDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-card shadow-lg z-50 overflow-hidden font-inter text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-gray-200 bg-emerald-50/50 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        {accountInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate leading-tight">{accountLabel}</p>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Verified User</span>
                      </div>
                    </div>
                    <div className="py-1 text-xs">
                      <Link to={getDashboardUrl() || '/customer/dashboard'} onClick={() => setIsAccountDropdownOpen(false)} className="block px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                        Dashboard
                      </Link>
                      <Link to="/customer/profile" onClick={() => setIsAccountDropdownOpen(false)} className="block px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                        Store Profile
                      </Link>
                      <Link to="/customer/orders" onClick={() => setIsAccountDropdownOpen(false)} className="block px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                        My Orders
                      </Link>
                      <button 
                        onClick={() => { logoutUser(); setIsAccountDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2.5 border-t border-gray-100 hover:bg-slate-900 hover:text-white text-red-600 transition-colors font-semibold"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Shop Sale Button */}
              <Link 
                to="/product-list?onSale=true" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-pill tracking-wide transition-colors focus:ring-2 focus:ring-emerald-500/20 hidden sm:inline-block outline-none"
              >
                Shop Sale
              </Link>

              {/* Mobile Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden text-slate-800 hover:text-emerald-600 p-1.5 outline-none rounded focus:ring-2 focus:ring-emerald-500/20"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
              </button>

            </div>
          </div>
        </div>

        {/* 4. Mega Category Navigation */}
        <div className="bg-white border-b border-gray-200 py-1.5 px-6">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6 overflow-hidden">
            {/* Scrollable Mega Links */}
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth pr-6 py-1 flex-1">
              {[
                { name: 'Shop All', path: '/product-list', tag: null },
                { name: 'Promo Codes', path: '/promo', tag: 'HOT', hasDropdown: true },
                { name: 'Campaign Deals', path: '/promo/landing', tag: 'NEW' },
                { name: 'Flash Sale', path: '/product-list?onSale=true', tag: 'SALE' },
                { name: 'Top Seller', path: '/top-sellers', tag: 'HOT' },
              ].map((tab) => {
                const active = activeMegaTab === tab.name;
                return (
                  <div key={tab.name} className="relative group/promo">
                    <button 
                      onClick={() => {
                        setActiveMegaTab(tab.name);
                        navigate(tab.path);
                      }}
                      className="flex items-center gap-1.5 pb-1 relative group focus:outline-none whitespace-nowrap text-xs font-bold text-slate-800"
                    >
                      <span className={`transition-colors duration-150 ${active ? 'text-emerald-600' : 'hover:text-emerald-600'}`}>
                        {tab.name}
                      </span>
                      {tab.tag && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-xs font-black uppercase tracking-wider ${
                          tab.tag === 'NEW' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-500 text-white'
                        }`}>
                          {tab.tag}
                        </span>
                      )}
                      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 transform transition-transform duration-200 origin-left ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                    </button>
                    
                    {/* Hover Dropdown for Promo Codes */}
                    {tab.hasDropdown && activePromos.length > 0 && (
                      <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-card shadow-lg z-50 p-4 hidden group-hover/promo:block font-inter text-slate-800 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                          <h4 className="font-bold text-xs uppercase tracking-wider">Active Promo Codes ({activePromos.length})</h4>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                          {activePromos.map((promo) => (
                            <div key={promo.id} className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-card text-[11px] flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className="font-mono font-bold text-emerald-600 uppercase tracking-wider">{promo.code}</span>
                                <span className="font-black text-slate-800">
                                  {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% OFF` : `Rs. ${promo.discountValue} OFF`}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 truncate" title={promo.description || promo.title}>
                                {promo.description || promo.title}
                              </p>
                              {promo.minOrderValue > 0 && (
                                <span className="text-[9px] text-gray-400">Min. order: Rs. {promo.minOrderValue.toLocaleString()}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <Link 
                            to="/promo" 
                            onClick={() => setActiveMegaTab('Promo Codes')}
                            className="block w-full py-1.5 bg-emerald-600 text-white text-center text-[10px] font-bold rounded-pill hover:bg-emerald-700 transition-colors"
                          >
                            Go to Promo Center
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex-shrink-0 flex items-center gap-2 text-slate-800 border-l border-gray-200 pl-6 py-1 text-xs font-bold select-none hidden sm:flex">
              <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Site-Wide Sale:</span>
              <span className="font-mono bg-slate-900 text-amber-400 px-2.5 py-1 rounded-xs tabular-nums text-xs">
                {formatCountdown(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Wishlist slide-out Drawer Panel */}
        {isWishlistOpen && (
          <>
            <div 
              onClick={() => setIsWishlistOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity"
            />
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-gray-200 z-50 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 font-inter text-slate-800">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600 fill-current animate-pulse" />
                  <h3 className="font-inter font-bold text-lg">My Wishlist</h3>
                </div>
                <button 
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-xs"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingWishlist ? (
                <div className="text-center py-12 text-gray-400 text-xs">Loading saved wishlist items...</div>
              ) : wishlistItems.length > 0 ? (
                <div className="space-y-4">
                  {wishlistItems.map((item) => {
                    const prod = item.product || item;
                    const rawImg = prod.imagePaths?.[0] || prod.imagePath || prod.thumbnail || null;
                    const resolvedUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : null;
                    const prodId = prod.id || prod.productId;
                    return (
                      <div key={prodId} className="flex gap-4 items-center border-b border-gray-100 pb-4 text-xs">
                        <div className="w-16 h-16 bg-white rounded-card border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {resolvedUrl ? (
                            <img src={resolvedUrl} alt={prod.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-inter font-bold text-slate-800 leading-tight mb-1">{prod.name}</h4>
                          <p className="text-emerald-600 font-bold">Rs. {(prod.price || prod.minPrice || 0).toLocaleString()}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => handleAddWishlistToCart(e, prodId)}
                              className="bg-emerald-600 text-white px-3 py-1 rounded-xs font-bold text-[10px] hover:bg-emerald-700 transition-colors focus:outline-none"
                            >
                              Add to Bag
                            </button>
                            <button
                              onClick={(e) => handleRemoveWishlistItem(e, prodId)}
                              className="border border-gray-300 hover:border-red-600 hover:text-red-600 px-2 py-1 rounded-xs text-[10px] text-gray-400 transition-colors focus:outline-none"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400 text-xs">
                  Your wishlist is empty.<br />Explore products and save your favorites!
                </div>
              )}
            </div>
          </>
        )}

        {/* Mobile menu drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-6 py-4 space-y-3 font-semibold uppercase text-xs">
            <Link to="/" className="block py-2 text-slate-800 hover:text-emerald-600" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/product-list" className="block py-2 text-slate-800 hover:text-emerald-600" onClick={() => setIsMobileMenuOpen(false)}>Browse Product</Link>
            <Link to="/promo/landing" className="block py-2 text-slate-800 hover:text-emerald-600" onClick={() => setIsMobileMenuOpen(false)}>Deals</Link>
            <Link to="/promo" className="block py-2 text-amber-500" onClick={() => setIsMobileMenuOpen(false)}>🎟 Promo Center</Link>
            
            {/* Search for mobile */}
            <form onSubmit={handleSearch} className="pt-2">
              <div className="flex items-center border border-gray-300 rounded-pill overflow-hidden bg-white">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-transparent text-xs text-slate-800 outline-none"
                />
                <button type="submit" className="p-2 text-gray-400"><Search className="w-4 h-4" /></button>
              </div>
            </form>
          </div>
        )}

        {/* Auth Modal */}
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          initialTab="login"
          initialRole="CUSTOMER"
        />
      </header>
    );
}
