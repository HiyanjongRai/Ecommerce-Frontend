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
import UserDropdown from '../ui/user-dropdown';
import { getCart, getWishlist, removeCartItem, removeFromWishlist, addToCart, getActivePromos, searchProducts, getCategories } from '../../api/customerApi';
import { getProductLink } from '../../utils/slugHelper';
import { toast } from 'react-toastify';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, cartCount, wishlistIds, logoutUser, refreshCart, refreshWishlist, unreadNotifs } = useCustomer();
  const isLoggedIn = Boolean(user?.id || user?.email || user?.username);

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

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
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const cartRef = useRef(null);
  const searchRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setIsCartOpen(false);
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

  // Fetch dynamic categories
  useEffect(() => {
    getCategories()
      .then((res) => {
        const list = res.data || res || [];
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Failed to load categories in navbar", err);
        setCategories([]);
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

    let redirectUrl = '';
    if (role === 'SELLER') {
      redirectUrl = `/seller/orders?orderId=${encodeURIComponent(query)}`;
    } else if (role === 'ADMIN') {
      redirectUrl = `/admin/orders?orderId=${encodeURIComponent(query)}`;
    } else if (role === 'CUSTOMER') {
      if (isOrder) {
        redirectUrl = `/customer/orders?orderId=${encodeURIComponent(query)}`;
      } else {
        redirectUrl = `/product-list?q=${encodeURIComponent(query)}`;
        if (selectedCategory && selectedCategory !== 'All') {
          redirectUrl += `&category=${encodeURIComponent(selectedCategory)}`;
        }
      }
    } else {
      redirectUrl = `/product-list?q=${encodeURIComponent(query)}`;
      if (selectedCategory && selectedCategory !== 'All') {
        redirectUrl += `&category=${encodeURIComponent(selectedCategory)}`;
      }
    }

    setIsSearchSuggestionsOpen(false);
    navigate(redirectUrl);
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
        <div className="h-9 bg-[#0F172A] text-white text-[13px] font-medium px-4 flex justify-between items-center transition-all duration-300">
          <div className="flex-1 text-center font-inter leading-none">
            🎁 Free shipping on orders over <strong>Rs. 2,000</strong>. Special packaging for all premium products.
          </div>
          <button 
            onClick={() => setIsAnnouncementVisible(false)}
            className="text-white/70 hover:text-white p-1 transition-colors outline-none focus:ring-1 focus:ring-green-500/20 rounded-xs flex items-center justify-center"
            aria-label="Dismiss Announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main Navbar */}
      <div className="bg-white py-3 px-6 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 group outline-none focus:ring-2 focus:ring-green-500/20 rounded-xs">
            <img 
              src="/Assets/Logo/logo.png" 
              alt="Jhapcham Logo" 
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </Link>

          {/* Search Pill */}
          <form ref={searchRef} onSubmit={handleSearch} className="flex-1 max-w-[700px] relative hidden md:block">
            <div className="flex items-center border border-[#E5E7EB] rounded-full bg-white h-[52px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-green-500/20 overflow-hidden transition-all">
              <div className="flex items-center bg-gray-50 border-r border-gray-200 px-4 h-full">
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer focus:outline-none pr-1 max-w-[120px] truncate"
                >
                  <option value="All">All Categories</option>
                  {(categories.length > 0 ? categories : ['Fashion', 'Electronics', 'Home', 'Beauty', 'Health']).map((cat) => {
                    const name = cat.name || (typeof cat === 'string' ? cat : '');
                    if (!name) return null;
                    return (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <input 
                type="text" 
                placeholder="Search for products, brands, or categories..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.trim().length >= 2) setIsSearchSuggestionsOpen(true); }}
                className="w-full px-5 text-sm bg-transparent outline-none text-slate-800 placeholder-gray-400 focus:outline-none"
              />
              <button type="submit" className="h-full px-5 text-gray-400 hover:text-[#16A34A] transition-colors outline-none flex items-center justify-center border-l border-gray-100">
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Autocomplete Dropdown suggestions */}
            {isSearchSuggestionsOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] overflow-hidden font-inter text-slate-800 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                {loadingSuggestions ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400 font-semibold">
                    <svg className="animate-spin h-3.5 w-3.5 text-[#16A34A]" fill="none" viewBox="0 0 24 24">
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
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50/45 transition-colors group text-left"
                        >
                          <div className="w-9 h-9 rounded bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {resolvedImg ? (
                              <img src={resolvedImg} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-sm">📦</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-800 truncate group-hover:text-green-700 transition-colors">
                              {product.name}
                            </p>
                            {product.brand && (
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{product.brand}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-extrabold text-green-600 font-mono">Rs. {Number(finalPrice).toLocaleString()}</p>
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
            
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 px-4 py-1.5 rounded-full">
              {/* Wishlist */}
              <button 
                onClick={() => {
                  if (!isLoggedIn) setIsLoginModalOpen(true);
                  else setIsWishlistOpen(true);
                }}
                className="flex items-center justify-center text-slate-850 hover:text-[#16A34A] transition-colors relative focus:outline-none p-0.5"
                title="View Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistIds?.size > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-[#16A34A] text-white text-[11px] font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center shadow-sm leading-none">
                    {wishlistIds.size}
                  </span>
                )}
              </button>

              {/* Cart */}
              <div className="relative flex items-center" ref={cartRef}>
                <button 
                  onClick={() => {
                    if (!isLoggedIn) setIsLoginModalOpen(true);
                    else setIsCartOpen(!isCartOpen);
                  }}
                  className="flex items-center justify-center text-slate-850 hover:text-[#16A34A] transition-colors relative focus:outline-none p-0.5"
                  title="Cart Bag"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-[#16A34A] text-white text-[11px] font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center animate-pulse shadow-sm leading-none">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Cart Dropdown */}
                {isCartOpen && (
                  <div className="absolute right-[-48px] mt-44 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4 font-inter text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
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
                                  <p className="font-semibold text-green-600">Rs. {(itemPrice * item.quantity).toLocaleString()}</p>
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
                            <span className="text-base text-green-600 font-extrabold">
                              Rs. {cartItems.reduce((acc, item) => acc + ((item.price || item.product?.price || item.product?.minPrice || 0) * item.quantity), 0).toLocaleString()}
                            </span>
                          </div>
                          <Link 
                            to="/customer/cart" 
                            onClick={() => setIsCartOpen(false)}
                            className="block w-full py-2.5 bg-[#16A34A] text-white text-center text-xs font-bold rounded-full hover:bg-green-700 transition-colors focus:ring-2 focus:ring-green-500/20"
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
              <UserDropdown
                user={user}
                unreadNotifs={unreadNotifs}
                wishlistCount={wishlistIds?.size || 0}
                cartCount={cartCount}
                onLogout={logoutUser}
                onRequireLogin={(tab) => {
                  setAuthModalTab(tab);
                  setIsLoginModalOpen(true);
                }}
              />

            </div>

            {/* Shop Sale Button (Redesigned CTA) */}
            <Link 
              to="/product-list?onSale=true" 
              className="bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold h-11 px-6 rounded-full tracking-wide transition-all duration-200 flex items-center justify-center shadow-xs hover:shadow-md hidden sm:inline-flex outline-none"
            >
              Today's Deals
            </Link>

            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden text-slate-800 hover:text-[#16A34A] p-1.5 outline-none rounded-full focus:ring-2 focus:ring-green-500/20 flex items-center justify-center"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* 3. Reorganized Category Navigation & Flash Sale Countdown Timer */}
      <div className="bg-white border-b border-gray-200 py-1.5 px-6">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6 overflow-hidden">
          {/* Category links and timer pill row */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth pr-6 py-1 flex-1">
            {/* Primary Category Links */}
            {[
              { name: 'Shop All', path: '/product-list' },
              { name: 'Flash Sale', path: '/product-list?onSale=true', isFlashSale: true },
              { name: 'Top Seller', path: '/top-sellers' },
            ].map((tab) => {
              const active = activeMegaTab === tab.name;
              return (
                <div key={tab.name} className="relative flex items-center">
                  {tab.isFlashSale ? (
                    <Link
                      to={tab.path}
                      onClick={() => setActiveMegaTab(tab.name)}
                      className="h-9 px-4 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 font-bold text-xs select-none shadow-sm hover:scale-[1.02] active:scale-95"
                    >
                      <span className="text-amber-400">🔥 {tab.name}</span>
                      <span className="text-gray-400 font-normal">|</span>
                      <span className="text-amber-300 font-mono font-semibold tabular-nums tracking-wide">Ends In {formatCountdown(timeLeft)}</span>
                    </Link>
                  ) : (
                    <button 
                      onClick={() => {
                        setActiveMegaTab(tab.name);
                        navigate(tab.path);
                      }}
                      className="flex items-center pb-1 relative group focus:outline-none whitespace-nowrap text-xs font-semibold text-slate-700 tracking-tight"
                    >
                      <span className={`transition-all duration-200 ${active ? 'text-[#16A34A] font-bold' : 'hover:text-[#16A34A]'}`}>
                        {tab.name}
                      </span>
                      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#16A34A] transform transition-transform duration-200 origin-left ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Separator Line */}
            <div className="h-4 w-[1px] bg-gray-200 self-center hidden sm:block" />

            {/* Secondary Category Links */}
            {[
              { name: 'Campaign Deals', path: '/promo/landing' },
              { name: 'Promo Codes', path: '/promo', hasDropdown: true },
            ].map((tab) => {
              const active = activeMegaTab === tab.name;
              return (
                <div key={tab.name} className="relative group/promo">
                  <button 
                    onClick={() => {
                      setActiveMegaTab(tab.name);
                      navigate(tab.path);
                    }}
                    className="flex items-center pb-1 relative group focus:outline-none whitespace-nowrap text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <span className={`transition-all duration-205 ${active ? 'text-[#16A34A] font-bold' : 'hover:text-[#16A34A]'}`}>
                      {tab.name}
                    </span>
                    {tab.name === 'Promo Codes' && (
                      <span className="text-[9px] bg-amber-500 text-white font-bold px-1 rounded-sm ml-1.5">HOT</span>
                    )}
                    <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#16A34A] transform transition-transform duration-200 origin-left ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                  </button>
                  
                  {/* Hover Dropdown for Promo Codes */}
                  {tab.hasDropdown && activePromos.length > 0 && (
                    <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4 hidden group-hover/promo:block font-inter text-slate-800 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b border-gray-250 pb-2 mb-3">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Active Promo Codes ({activePromos.length})</h4>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                        {activePromos.map((promo) => (
                          <div key={promo.id} className="p-2.5 bg-green-50/50 border border-green-100 rounded-xl text-[11px] flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-[#16A34A] uppercase tracking-wider">{promo.code}</span>
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
                      <div className="border-t border-gray-200 pt-2.5 mt-2.5">
                        <Link 
                          to="/promo" 
                          onClick={() => setActiveMegaTab('Promo Codes')}
                          className="block w-full py-2 bg-[#16A34A] text-white text-center text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
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
        </div>
      </div>

      {/* Wishlist slide-out Drawer Panel */}
      {isWishlistOpen && (
        <>
          <div 
            onClick={() => setIsWishlistOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-300"
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-gray-200 z-50 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 font-inter text-slate-800">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#16A34A] fill-current animate-pulse" />
                <h3 className="font-inter font-bold text-lg">My Wishlist</h3>
              </div>
              <button 
                onClick={() => setIsWishlistOpen(false)}
                className="p-1.5 text-gray-400 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 rounded-xs"
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
                      <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {resolvedUrl ? (
                          <img src={resolvedUrl} alt={prod.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-inter font-bold text-slate-800 leading-tight mb-1">{prod.name}</h4>
                        <p className="text-[#16A34A] font-bold">Rs. {(prod.price || prod.minPrice || 0).toLocaleString()}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => handleAddWishlistToCart(e, prodId)}
                            className="bg-[#16A34A] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-green-700 transition-colors focus:outline-none"
                          >
                            Add to Bag
                          </button>
                          <button
                            onClick={(e) => handleRemoveWishlistItem(e, prodId)}
                            className="border border-gray-300 hover:border-red-650 hover:text-red-650 px-2 py-1.5 rounded-lg text-[10px] text-gray-400 transition-colors focus:outline-none"
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
              <div className="text-center py-16 text-gray-400 text-xs">
                <div className="text-4xl mb-3 select-none">❤️</div>
                <p className="font-semibold mb-4">Your wishlist is empty.<br />Save items you love while browsing.</p>
                <Link
                  to="/product-list"
                  onClick={() => setIsWishlistOpen(false)}
                  className="inline-block bg-[#16A34A] hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors"
                >
                  Browse Products →
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile menu drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-250 bg-white px-6 py-4 space-y-3 font-semibold uppercase text-xs">
          <Link to="/" className="block py-2 text-slate-800 hover:text-[#16A34A]" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/product-list" className="block py-2 text-slate-800 hover:text-[#16A34A]" onClick={() => setIsMobileMenuOpen(false)}>Browse Product</Link>
          <Link to="/promo/landing" className="block py-2 text-slate-800 hover:text-[#16A34A]" onClick={() => setIsMobileMenuOpen(false)}>Deals</Link>
          <Link to="/promo" className="block py-2 text-amber-500" onClick={() => setIsMobileMenuOpen(false)}>🎟 Promo Center</Link>
          
          {/* Search for mobile */}
          <form onSubmit={handleSearch} className="pt-2">
            <div className="flex items-center border border-gray-300 rounded-full overflow-hidden bg-white">
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
        initialTab={authModalTab}
        initialRole="CUSTOMER"
      />
    </header>
  );
}
