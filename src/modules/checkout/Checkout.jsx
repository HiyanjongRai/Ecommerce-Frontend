import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../customer/contexts/CustomerContext';
import { getCart, getProductById, getLoyaltyWallet, placeOrderFromCart, getEsewaSignature, initiateKhaltiPayment, quoteLoyaltyRedemption, validatePromoCode, getAddresses } from '../../shared/api/customerApi';
import { BASE_URL } from '../../shared/api/apiClient';
const DEFAULT_INSIDE_VALLEY_SHIPPING = 100;
const DEFAULT_OUTSIDE_VALLEY_SHIPPING = 150;
const VAT_RATE = 0.13;
const VAT_INCLUSIVE_DIVISOR = 1 + VAT_RATE;

const formatMoney = (value) => Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 2,
  maximumFractionDigits: 2,
});

const getItemSellerId = (item) => {
  const id = item.sellerId || item.sellerProfileId || item.product?.sellerProfile?.user?.id || item.product?.sellerProfile?.id;
  return id ? String(id) : 'marketplace';
};
const getItemSellerName = (item) => item.sellerStoreName || item.product?.sellerProfile?.storeName || 'Jhapcham Seller';
const getItemShippingFee = (item, shippingLocation) => {
  if (item.freeShipping || item.product?.freeShipping) return 0;
  const insideFee = item.insideValleyShipping ?? item.product?.insideValleyShipping ?? DEFAULT_INSIDE_VALLEY_SHIPPING;
  const outsideFee = item.outsideValleyShipping ?? item.product?.outsideValleyShipping ?? DEFAULT_OUTSIDE_VALLEY_SHIPPING;
  return Number(shippingLocation === 'OUTSIDE' ? outsideFee : insideFee) || 0;
};

const groupCartBySeller = (cartItems) => cartItems.reduce((acc, item) => {
  const sellerId = getItemSellerId(item);
  if (!acc[sellerId]) {
    acc[sellerId] = {
      sellerId,
      sellerName: getItemSellerName(item),
      items: [],
    };
  }
  acc[sellerId].items.push(item);
  return acc;
}, {});

const calculateGroupedShipping = (groupedCart, shippingLocation) => Object.values(groupedCart).reduce((total, group) => {
  const groupSubtotal = group.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const groupShipping = group.items.reduce((max, item) => {
    const freeMinimum = Number(item.sellerFreeShippingMinOrder ?? item.product?.sellerFreeShippingMinOrder ?? 0);
    if (freeMinimum > 0 && groupSubtotal >= freeMinimum) return max;
    return Math.max(max, getItemShippingFee(item, shippingLocation));
  }, 0);
  return total + groupShipping;
}, 0);

const calculateGroupShipping = (group, shippingLocation) => calculateGroupedShipping({ [group.sellerId]: group }, shippingLocation);

const needsProductShippingData = (item) => (
  !item.sellerId ||
  !item.sellerStoreName ||
  item.insideValleyShipping == null ||
  item.outsideValleyShipping == null
);

const enrichCartItems = async (cartItems) => {
  const missingProductIds = [...new Set(
    cartItems
      .filter(needsProductShippingData)
      .map((item) => item.productId)
      .filter(Boolean)
  )];

  if (missingProductIds.length === 0) return cartItems;

  const productEntries = await Promise.all(
    missingProductIds.map(async (productId) => {
      try {
        const res = await getProductById(productId);
        return [productId, res.data];
      } catch (err) {
        return [productId, null];
      }
    })
  );
  const productById = Object.fromEntries(productEntries);

  return cartItems.map((item) => {
    const product = productById[item.productId];
    if (!product) return item;
    return {
      ...item,
      sellerId: item.sellerId ?? product.sellerUserId,
      sellerProfileId: item.sellerProfileId ?? product.sellerProfileId,
      sellerStoreName: item.sellerStoreName ?? product.storeName,
      freeShipping: item.freeShipping ?? product.freeShipping,
      insideValleyShipping: item.insideValleyShipping ?? product.insideValleyShipping,
      outsideValleyShipping: item.outsideValleyShipping ?? product.outsideValleyShipping,
      sellerFreeShippingMinOrder: item.sellerFreeShippingMinOrder ?? product.sellerFreeShippingMinOrder,
    };
  });
};

const getGroupItemSummary = (group) => {
  const summaries = group.items.map((item) => {
    const qty = Number(item.quantity || 1);
    return `${item.name || 'Product'} x${qty}`;
  });
  if (summaries.length <= 2) {
    return summaries.join(', ');
  }
  return `${summaries.slice(0, 2).join(', ')} +${summaries.length - 2} more`;
};

const Checkout = () => {
  const { user, refreshCart } = useCustomer();
  const navigate = useNavigate();
  const userId = user?.id;

  // Form reference for eSewa
  const esewaFormRef = useRef(null);
  const [esewaData, setEsewaData] = useState(null);

  // Cart Summary State
  const [items, setItems] = useState([]);
  const [backendSubtotal, setBackendSubtotal] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loyaltyWallet, setLoyaltyWallet] = useState(null);
  const [loyaltyQuote, setLoyaltyQuote] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Wizard Step State
  const [step, setStep] = useState(1);

  // LocationIQ Integration
  const LOCATIONIQ_API_KEY = 'pk.fd5c30a78c687b73c6f36ad5a5123e33'; // Real LocationIQ key
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.username || ''),
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    alternativePhone: '',
    province: '',
    district: '',
    municipality: '',
    ward: '',
    streetAddress: '',
    shippingLocation: 'INSIDE', // INSIDE or OUTSIDE
    deliveryTimePreference: 'ANYTIME',
    orderNote: '',
    paymentMethod: 'COD', // COD, ESEWA or KHALTI
    couponCode: localStorage.getItem('jhapcham_coupon') || '',
    loyaltyPointsToRedeem: '',
  });

  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [backendDiscountAmount, setBackendDiscountAmount] = useState(0);

  const loadCart = useCallback(async () => {
    if (!userId) return;
    setLoadingCart(true);
    try {
      const res = await getCart(userId);
      if (res.data) {
        const cartItems = Array.isArray(res.data.items) ? res.data.items : [];
        setItems(await enrichCartItems(cartItems));
        setBackendSubtotal(res.data.subtotal || 0);
      }
    } catch (err) {
      console.error("Failed to load cart for checkout", err);
    } finally {
      setLoadingCart(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const code = formData.couponCode?.trim();
    if (!code || items.length === 0) {
      setBackendDiscountAmount(0);
      return;
    }
    
    const payloadItems = items.map(item => ({
      productId: item.product?.id || item.productId,
      variantId: item.variant?.id || item.variantId || null,
      quantity: item.quantity || 1
    }));

    validatePromoCode(code, payloadItems)
      .then(res => {
        if (res.data && res.data.valid) {
          setBackendDiscountAmount(Number(res.data.discountAmount || 0));
        } else {
          setBackendDiscountAmount(0);
        }
      })
      .catch(() => {
        setBackendDiscountAmount(0);
      });
  }, [formData.couponCode, items]);

  useEffect(() => {
    if (!userId) return;
    getLoyaltyWallet()
      .then((res) => setLoyaltyWallet(res.data))
      .catch(() => setLoyaltyWallet(null));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    getAddresses(userId)
      .then((res) => setSavedAddresses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSavedAddresses([]));
  }, [userId]);

  useEffect(() => {
    if (esewaData && esewaFormRef.current) {
      esewaFormRef.current.submit();
    }
  }, [esewaData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoyaltyPointsChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData((prev) => ({ ...prev, loyaltyPointsToRedeem: value }));
  };

  const handleAddressChange = async (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, streetAddress: val }));
    
    if (val.length > 3) {
      try {
        const res = await fetch(`https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(val)}&limit=5&countrycodes=np&addressdetails=1`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAddressSuggestions(data);
            setShowSuggestions(true);
          }
        }
      } catch (err) {
        // silently fail on network error for autocomplete
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const parseLocationIQAddress = (addressObj, displayName) => {
    if (!addressObj) return;

    let parsedProvince = '';
    if (addressObj.state) {
      if (addressObj.state.includes('Koshi') || addressObj.state.includes('Province No. 1')) parsedProvince = 'Koshi Province';
      else if (addressObj.state.includes('Madhesh') || addressObj.state.includes('Province No. 2')) parsedProvince = 'Madhesh Province';
      else if (addressObj.state.includes('Bagmati') || addressObj.state.includes('Province No. 3')) parsedProvince = 'Bagmati Province';
      else if (addressObj.state.includes('Gandaki') || addressObj.state.includes('Province No. 4')) parsedProvince = 'Gandaki Province';
      else if (addressObj.state.includes('Lumbini') || addressObj.state.includes('Province No. 5')) parsedProvince = 'Lumbini Province';
      else if (addressObj.state.includes('Karnali') || addressObj.state.includes('Province No. 6')) parsedProvince = 'Karnali Province';
      else if (addressObj.state.includes('Sudurpashchim') || addressObj.state.includes('Far-Western')) parsedProvince = 'Sudurpashchim Province';
    }

    const parsedDistrict = addressObj.county || addressObj.state_district || '';
    const parsedMunicipality = addressObj.city || addressObj.town || addressObj.village || addressObj.municipality || addressObj.city_district || '';
    
    // Attempt to extract ward
    let parsedWard = '';
    const suburb = addressObj.suburb || addressObj.neighbourhood || '';
    const wardMatch = suburb.match(/(?:-|ward\s*no\.?\s*)(\d+)/i);
    if (wardMatch && wardMatch[1]) {
      parsedWard = parseInt(wardMatch[1], 10).toString();
    }

    const parsedStreet = addressObj.road || addressObj.pedestrian || addressObj.neighbourhood || (displayName ? displayName.split(',')[0] : '');

    setFormData(prev => ({
      ...prev,
      ...(parsedProvince && { province: parsedProvince }),
      ...(parsedDistrict && { district: parsedDistrict.replace(' District', '') }),
      ...(parsedMunicipality && { municipality: parsedMunicipality.replace(' Municipality', '').replace(' Metropolitan City', '') }),
      ...(parsedWard && { ward: parsedWard }),
      streetAddress: parsedStreet
    }));
  };

  const handleSelectAddress = (suggestion) => {
    if (suggestion.address) {
      parseLocationIQAddress(suggestion.address, suggestion.display_name);
    } else {
      setFormData((prev) => ({ ...prev, streetAddress: suggestion.display_name }));
    }
    setShowSuggestions(false);
  };

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              parseLocationIQAddress(data.address, data.display_name);
            } else if (data && data.display_name) {
              setFormData((prev) => ({ ...prev, streetAddress: data.display_name }));
            }
          } else {
            alert("LocationIQ API error. Did you set your API Key?");
          }
        } catch (err) {
          alert("Failed to fetch address from coordinates.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        alert("Unable to retrieve your location. Please ensure location services are enabled.");
        setDetectingLocation(false);
      }
    );
  };

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    if (!formData.fullName || !formData.phone || !formData.province || !formData.district || !formData.municipality || !formData.streetAddress) {
      setErrorMsg('Full Name, Phone, and all complete Address details are required.');
      setStep(1);
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    setProcessing(true);
    try {
      const fullAddress = `${formData.streetAddress}${formData.ward ? `, Ward ${formData.ward}` : ''}, ${formData.municipality}, ${formData.district}, ${formData.province}`;
      
      const payload = {
        ...formData,
        address: fullAddress,
        userId,
        loyaltyPointsToRedeem: Number(formData.loyaltyPointsToRedeem || 0),
      };

      const res = await placeOrderFromCart(payload);
      
      // Clear local cart context counter
      refreshCart();
      localStorage.removeItem('jhapcham_coupon');

      // If ESEWA, generate signature and submit form
      if (formData.paymentMethod === 'ESEWA') {
        const orderSummaries = res.data;
        if (!orderSummaries || orderSummaries.length === 0) {
           throw new Error("Failed to create order");
        }
        
        // Sum up total from all created orders (in case of split orders)
        const orderIds = orderSummaries.map(o => o.orderId);
        const rawTotalAmount = orderSummaries.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const formattedAmount = Number(rawTotalAmount).toFixed(2);
        const transactionUuid = `ORDS-${orderIds.join('_')}-${Date.now()}`;

        const sigRes = await getEsewaSignature({
          amount: formattedAmount,
          transactionUuid,
          orderIds
        });

        const sigData = sigRes.data;

        setEsewaData({
          amount: formattedAmount,
          tax_amount: '0.00',
          total_amount: formattedAmount,
          transaction_uuid: transactionUuid,
          product_code: sigData.productCode,
          product_service_charge: '0.00',
          product_delivery_charge: '0.00',
          success_url: `http://localhost:3000/payment/success`,
          failure_url: `http://localhost:3000/payment/failure`,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature: sigData.signature,
          paymentUrl: sigData.paymentUrl
        });
        
        // Do not toggle processing=false yet, because the browser is about to redirect
        return;
      }

      if (formData.paymentMethod === 'KHALTI') {
        const orderSummaries = res.data;
        if (!orderSummaries || orderSummaries.length === 0) {
          throw new Error("Failed to create order");
        }

        const orderIds = orderSummaries.map(o => o.orderId);
        const rawTotalAmount = orderSummaries.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const formattedAmount = Number(rawTotalAmount).toFixed(2);
        const purchaseOrderId = `ORDS-${orderIds.join('_')}-${Date.now()}`;

        const khaltiRes = await initiateKhaltiPayment({
          amount: formattedAmount,
          purchaseOrderId,
          orderIds,
        });

        const paymentUrl = khaltiRes.data?.paymentUrl;
        if (!paymentUrl) {
          throw new Error("Khalti payment URL was not returned");
        }
        window.location.href = paymentUrl;
        return;
      }

      // COD Success routing
      alert('Order placed successfully!');
      navigate('/customer/orders');

    } catch (err) {
      console.error("Order placement error", err);
      setErrorMsg(err.response?.data?.message || 'Failed to place order. Please try again.');
      setProcessing(false);
    }
  };

  // Calculations
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const activeSubtotal = backendSubtotal > 0 ? backendSubtotal : calculatedSubtotal;
  
  let discountPercent = 0;
  if (formData.couponCode.toUpperCase() === 'JHAPCHAM10') discountPercent = 10;
  if (formData.couponCode.toUpperCase() === 'NEPAL20') discountPercent = 20;

  const discountAmount = backendDiscountAmount > 0 
    ? backendDiscountAmount 
    : activeSubtotal * (discountPercent / 100);
  const groupedItems = groupCartBySeller(items);
  const activeShipping = calculateGroupedShipping(groupedItems, formData.shippingLocation);
  const vatAmount = activeSubtotal - (activeSubtotal / VAT_INCLUSIVE_DIVISOR);
  const preLoyaltyTotal = activeSubtotal + activeShipping - discountAmount;
  const loyaltyDiscountAmount = Number(loyaltyQuote?.discountAmount || 0);
  const grandTotal = Math.max(0, preLoyaltyTotal - loyaltyDiscountAmount);

  useEffect(() => {
    const points = Number(formData.loyaltyPointsToRedeem || 0);
    if (!points || !userId) {
      setLoyaltyQuote(null);
      return;
    }
    const timer = setTimeout(() => {
      quoteLoyaltyRedemption({ orderTotal: preLoyaltyTotal, points })
        .then((res) => setLoyaltyQuote(res.data))
        .catch(() => setLoyaltyQuote(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.loyaltyPointsToRedeem, preLoyaltyTotal, userId]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone || !formData.province || !formData.district || !formData.municipality || !formData.streetAddress) {
        setErrorMsg('Please fill in all required delivery details (Province, District, Municipality, Street).');
        return;
      }
      setErrorMsg('');
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  if (loadingCart) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xs font-sans">
        <svg className="animate-spin w-6 h-6 text-[#222529] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span>Loading secure checkout…</span>
      </div>
    );
  }

  if (items.length === 0 && !processing) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 font-sans">
        <div className="text-5xl mb-4 select-none">🛒</div>
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">Cart is Empty</h3>
        <p className="text-xs text-gray-400 mb-6">You need items in your cart to checkout.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#222529] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-sm transition-all"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 font-sans text-[#222529]">
      
      {/* Checkout Progress */}
      <div className="flex justify-center items-center gap-2 md:gap-4 mb-10 text-[10px] md:text-[11px] font-black uppercase tracking-wider select-none">
        <span className={`transition-colors ${step >= 1 ? 'text-[#222529] border-b-2 border-[#222529] pb-0.5' : 'text-gray-400 cursor-pointer hover:text-gray-600'}`} onClick={() => setStep(1)}>
          01. Address
        </span>
        <span className="text-gray-300">➔</span>
        <span className={`transition-colors ${step >= 2 ? 'text-[#222529] border-b-2 border-[#222529] pb-0.5' : 'text-gray-400'}`}>
          02. Details
        </span>
        <span className="text-gray-300">➔</span>
        <span className={`transition-colors ${step >= 3 ? 'text-[#222529] border-b-2 border-[#222529] pb-0.5' : 'text-gray-400'}`}>
          03. Payment
        </span>
      </div>

      <div className="max-w-3xl mx-auto">
        
        {/* Step 1: Address Details */}
        {step === 1 && (
          <div className="bg-white border border-gray-200 rounded-sm p-6 md:p-8 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-gray-150 pb-4">
              Billing & Delivery Details
            </h2>

            {errorMsg && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form className="space-y-6">
              
              {/* Ship to Saved Address Dropdown Picker */}
              {savedAddresses.length > 0 && (
                <div className="bg-emerald-50/30 border border-emerald-100 rounded-sm p-4 animate-in fade-in-50 duration-200">
                  <label className="block text-[10px] font-black uppercase text-emerald-800 tracking-wider mb-2">
                    📍 Ship to Saved Address
                  </label>
                  <select
                    onChange={(e) => {
                      const addrId = e.target.value;
                      if (!addrId) return;
                      const selected = savedAddresses.find(a => String(a.id) === addrId);
                      if (selected) {
                        setFormData(prev => ({
                          ...prev,
                          province: selected.province || '',
                          district: selected.district || '',
                          streetAddress: selected.street || '',
                          municipality: selected.city || '',
                          phone: selected.phone || prev.phone,
                        }));
                      }
                    }}
                    className="w-full border border-emerald-200 rounded-sm px-4 py-2.5 text-xs outline-none bg-white text-gray-700 font-semibold focus:border-emerald-500 transition-colors"
                  >
                    <option value="">-- Choose a saved address --</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label ? `[${addr.label.toUpperCase()}] ` : ''}
                        {addr.street}, {addr.city}, {addr.district}, {addr.province} {addr.phone ? `(${addr.phone})` : ''}
                        {addr.isDefault ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50"
                    placeholder="9800000000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Alternative Phone</label>
                  <input
                    type="tel"
                    name="alternativePhone"
                    value={formData.alternativePhone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Province *</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-white"
                    required
                  >
                    <option value="">Select Province</option>
                    <option value="Koshi Province">Koshi Province</option>
                    <option value="Madhesh Province">Madhesh Province</option>
                    <option value="Bagmati Province">Bagmati Province</option>
                    <option value="Gandaki Province">Gandaki Province</option>
                    <option value="Lumbini Province">Lumbini Province</option>
                    <option value="Karnali Province">Karnali Province</option>
                    <option value="Sudurpashchim Province">Sudurpashchim Province</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">District *</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50"
                    placeholder="e.g. Kathmandu"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Municipality / City *</label>
                  <input
                    type="text"
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50"
                    placeholder="e.g. Kageshwori Manohara"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Ward No.</label>
                  <input
                    type="number"
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50"
                    placeholder="e.g. 8"
                  />
                </div>
              </div>

              <div className="relative border-b border-gray-100 pb-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">Street / Tole / Landmark *</label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1"
                  >
                    {detectingLocation ? 'Detecting...' : '📍 Auto-Detect'}
                  </button>
                </div>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleAddressChange}
                  onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50"
                  placeholder="Street address or Landmark (Type to search map...)"
                  required
                />
                
                {/* LocationIQ Autocomplete Dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-sm shadow-lg max-h-48 overflow-y-auto">
                    {addressSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectAddress(suggestion)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-xs font-bold text-[#222529] truncate">{suggestion.display_name.split(',')[0]}</p>
                        <p className="text-[10px] text-gray-500 truncate">{suggestion.display_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Region</label>
                  <select
                    name="shippingLocation"
                    value={formData.shippingLocation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-white font-semibold text-gray-700"
                  >
                    <option value="INSIDE">Kathmandu Valley</option>
                    <option value="OUTSIDE">Outside Valley</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Delivery Preference</label>
                  <select
                    name="deliveryTimePreference"
                    value={formData.deliveryTimePreference}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-white font-semibold text-gray-700"
                  >
                    <option value="ANYTIME">Anytime (Default)</option>
                    <option value="MORNING">Morning (9 AM - 12 PM)</option>
                    <option value="AFTERNOON">Afternoon (12 PM - 5 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Order Notes (Optional)</label>
                <textarea
                  name="orderNote"
                  value={formData.orderNote}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-sm px-4 py-3 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/50 resize-none"
                  placeholder="Notes about your order, e.g. special notes for delivery."
                ></textarea>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#222529] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-sm transition-all shadow-md"
                >
                  Continue to Details
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Order Details Review */}
        {step === 2 && (
          <div className="bg-white border border-gray-200 rounded-sm p-6 md:p-8 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-gray-150 pb-4">
              Your Order Details
            </h2>
            
            <div className="bg-gray-50 border border-gray-150 rounded-sm p-4 mb-6 text-xs text-gray-700">
              <h3 className="font-black uppercase tracking-widest text-[9px] text-gray-500 mb-2">Delivery Information</h3>
              <p className="font-bold text-[#222529] mb-1">{formData.fullName} <span className="font-normal text-gray-500 ml-2">📞 {formData.phone} {formData.alternativePhone ? `/ ${formData.alternativePhone}` : ''}</span></p>
              <p>{formData.streetAddress}{formData.ward ? `, Ward ${formData.ward}` : ''}</p>
              <p>{formData.municipality}, {formData.district}, {formData.province}</p>
              {formData.orderNote && <p className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500 italic">" {formData.orderNote} "</p>}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 mb-6">
              {Object.values(groupedItems).map(group => (
                <div key={group.sellerId} className="border border-gray-150 rounded-sm overflow-hidden bg-white">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-150 flex justify-between items-center gap-3 text-[10px]">
                    <span className="font-black text-[#222529] uppercase tracking-wider truncate">Sold by: {group.sellerName}</span>
                    <span className="font-extrabold text-gray-600 whitespace-nowrap">Shipping: Rs. {formatMoney(calculateGroupShipping(group, formData.shippingLocation))}</span>
                  </div>
                  <div className="divide-y divide-gray-100 px-4">
                    {group.items.map(item => (
                      <div key={item.cartItemId} className="py-3 flex gap-3 items-center">
                        <div className="w-12 h-12 border border-gray-150 rounded-sm flex items-center justify-center p-1 flex-shrink-0 bg-gray-50">
                          {item.image ? (
                            <img
                              src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image.startsWith('/') ? '' : '/'}${item.image}`}
                              alt=""
                              className="object-contain w-full h-full"
                            />
                          ) : <span className="text-[10px]">Box</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[10px] font-bold text-[#222529] line-clamp-1">{item.name}</h4>
                          <span className="text-[9px] text-gray-500 font-semibold block mt-0.5">
                            Qty: <span className="text-[#222529]">{item.quantity}</span>
                            {item.variantLabel && ` - ${item.variantLabel}`}
                          </span>
                        </div>
                        <div className="text-[11px] font-black text-[#222529] whitespace-nowrap">
                          Rs. {formatMoney((item.price || 0) * (item.quantity || 1))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotals */}
            <div className="space-y-3 pt-4 border-t border-gray-150 text-xs font-semibold text-gray-600 mb-8 bg-gray-50 p-4 rounded-sm">
              <div className="flex justify-between items-center">
                <span className="uppercase text-[9px] font-black tracking-wider text-gray-500">Subtotal</span>
                <span className="font-extrabold text-[#222529]">Rs. {formatMoney(activeSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="uppercase text-[9px] font-black tracking-wider text-gray-500">Shipping to {formData.district ? formData.district : 'Address'}</span>
                <span className="font-extrabold text-[#222529]">Rs. {formatMoney(activeShipping)}</span>
              </div>
              {Object.values(groupedItems).map(group => {
                const totalQty = group.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
                return (
                  <div key={group.sellerId} className="rounded-sm border border-gray-200 bg-white p-3 space-y-1 my-1">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#222529]">
                        {group.sellerName}
                      </span>
                      <span className="font-extrabold text-[11px] text-[#222529]">
                        Rs. {formatMoney(calculateGroupShipping(group, formData.shippingLocation))}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-500">
                      {totalQty} {totalQty === 1 ? 'item' : 'items'}: {getGroupItemSummary(group)}
                    </p>
                  </div>
                );
              })}
              <div className="flex justify-between items-center">
                <span className="uppercase text-[9px] font-black tracking-wider text-gray-500">Included VAT (13%)</span>
                <span className="font-extrabold text-[#222529]">Rs. {formatMoney(vatAmount)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="uppercase text-[9px] font-black tracking-wider">Discount ({discountPercent}%)</span>
                  <span className="font-extrabold">- Rs. {formatMoney(discountAmount)}</span>
                </div>
              )}
              <div className="rounded-md border border-gray-200 bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5">
                      Use reward points
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="loyaltyPointsToRedeem"
                      value={formData.loyaltyPointsToRedeem}
                      onChange={handleLoyaltyPointsChange}
                      placeholder="0"
                      className="w-40 border border-gray-300 rounded-sm px-3 py-2 text-xs font-bold outline-none focus:border-[#222529]"
                    />
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold text-gray-500">
                      Available: {Number(loyaltyWallet?.availablePoints || 0).toLocaleString()} pts
                    </p>
                    <p className="text-[10px] font-bold text-gray-400">
                      Max 30% of eligible order value
                    </p>
                  </div>
                </div>
                {loyaltyQuote && (
                  <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-emerald-700">
                    <span className="text-[9px] font-black uppercase tracking-wider">
                      Reward discount ({Number(loyaltyQuote.approvedPoints || 0).toLocaleString()} pts)
                    </span>
                    <span className="font-extrabold">- Rs. {formatMoney(loyaltyQuote.discountAmount)}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-baseline">
                <span className="uppercase text-[11px] font-black tracking-widest text-[#222529]">Grand Total</span>
                <span className="text-lg font-black text-blue-600">Rs. {formatMoney(grandTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-150 pt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#222529] transition-colors"
              >
                ← Back to Address
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-[#222529] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-sm transition-all shadow-md"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Method & Submit */}
        {step === 3 && (
          <div className="bg-white border border-gray-200 rounded-sm p-6 md:p-8 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4 border-b border-gray-150 pb-4">
              Select Payment Option
            </h2>
            
            <div className="space-y-4 mb-8">
              <label className={`block border rounded-sm p-4 cursor-pointer transition-all ${formData.paymentMethod === 'COD' ? 'border-[#222529] bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleInputChange}
                    className="accent-[#222529] w-4 h-4"
                  />
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-[#222529]">Cash on Delivery</span>
                    <span className="block text-[10px] text-gray-500 font-semibold mt-1">Pay with cash upon delivery of your order.</span>
                  </div>
                </div>
              </label>

              <label className={`block border rounded-sm p-4 cursor-pointer transition-all ${formData.paymentMethod === 'ESEWA' ? 'border-green-600 bg-green-50/30' : 'border-gray-200 hover:border-green-300'}`}>
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ESEWA"
                    checked={formData.paymentMethod === 'ESEWA'}
                    onChange={handleInputChange}
                    className="accent-green-600 w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="block text-xs font-black uppercase tracking-wider text-green-700">eSewa Mobile Wallet</span>
                    <span className="block text-[10px] text-gray-500 font-semibold mt-1">Pay securely online via eSewa.</span>
                  </div>
                  <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-6 object-contain opacity-90" />
                </div>
              </label>

              <label className={`block border rounded-sm p-4 cursor-pointer transition-all ${formData.paymentMethod === 'KHALTI' ? 'border-purple-600 bg-purple-50/30' : 'border-gray-200 hover:border-purple-300'}`}>
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="KHALTI"
                    checked={formData.paymentMethod === 'KHALTI'}
                    onChange={handleInputChange}
                    className="accent-purple-600 w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="block text-xs font-black uppercase tracking-wider text-purple-700">Khalti Digital Wallet</span>
                    <span className="block text-[10px] text-gray-500 font-semibold mt-1">Pay securely online via Khalti sandbox.</span>
                  </div>
                  <span className="text-purple-700 text-xs font-black uppercase tracking-widest">Khalti</span>
                </div>
              </label>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 border-t border-gray-150 pt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#222529] transition-colors w-full md:w-auto text-left"
              >
                ← Back to Details
              </button>
              
              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className={`w-full md:w-auto min-w-[200px] text-white text-[11px] font-black uppercase tracking-widest py-4 px-8 rounded-sm transition-all shadow-md flex justify-center items-center gap-2 ${
                  processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#222529] hover:bg-black shadow-[#222529]/20'
                }`}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Processing...
                  </>
                ) : 'Place Order Now'}
              </button>
            </div>
            <p className="text-[9px] font-semibold text-center text-gray-400 mt-6">
              Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
            </p>
          </div>
        )}

      </div>

      {/* Hidden eSewa Form */}
      {esewaData && (
        <form ref={esewaFormRef} action={esewaData.paymentUrl} method="POST" style={{ display: 'none' }}>
          <input type="hidden" name="amount" value={esewaData.amount} />
          <input type="hidden" name="tax_amount" value={esewaData.tax_amount} />
          <input type="hidden" name="total_amount" value={esewaData.total_amount} />
          <input type="hidden" name="transaction_uuid" value={esewaData.transaction_uuid} />
          <input type="hidden" name="product_code" value={esewaData.product_code} />
          <input type="hidden" name="product_service_charge" value={esewaData.product_service_charge} />
          <input type="hidden" name="product_delivery_charge" value={esewaData.product_delivery_charge} />
          <input type="hidden" name="success_url" value={esewaData.success_url} />
          <input type="hidden" name="failure_url" value={esewaData.failure_url} />
          <input type="hidden" name="signed_field_names" value={esewaData.signed_field_names} />
          <input type="hidden" name="signature" value={esewaData.signature} />
        </form>
      )}
    </div>
  );
};

export default Checkout;

