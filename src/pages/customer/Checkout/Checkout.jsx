import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../../../context/CustomerContext';
import { getCart, getProductById, getLoyaltyWallet, placeOrderFromCart, getEsewaSignature, initiateKhaltiPayment, quoteLoyaltyRedemption, validatePromoCode, getAddresses } from '../../../services/customerApi';
import { BASE_URL } from '../../../services/apiClient';
import { LOCATIONIQ_API_KEY } from '../../../config/env';
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
  const APP_ORIGIN = window.location.origin;
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.username || ''),
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    alternativePhone: '',
    province: 'Bagmati Province',
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
        if (!LOCATIONIQ_API_KEY) {
          setAddressSuggestions([]);
          setShowSuggestions(false);
          return;
        }
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
          if (!LOCATIONIQ_API_KEY) {
            alert("Address lookup is unavailable until the LocationIQ API key is configured.");
            return;
          }
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
          success_url: `${APP_ORIGIN}/payment/success`,
          failure_url: `${APP_ORIGIN}/payment/failure`,
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
  // Validation helper
  const hasError = (fieldName) => errorMsg && !formData[fieldName];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 font-sans text-[#222529]">
      
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#222529]">Secure Checkout</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">Complete your delivery and payment details below to place your order.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Delivery & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Delivery Address Form */}
          <div className="bg-white border border-gray-200 rounded-sm p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest border-b border-gray-150 pb-3">
              1. Delivery Information
            </h2>

            {/* Saved Address Dropdown */}
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
                  className="w-full border border-emerald-200 rounded-sm px-4 py-2.5 text-xs outline-none bg-white text-gray-750 font-semibold focus:border-emerald-500 transition-colors"
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

            <div className="space-y-4">
              {/* Contact info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full border rounded-sm px-3.5 py-2.5 text-xs outline-none transition-colors bg-gray-50/30 ${
                      hasError('fullName') ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:border-[#222529]'
                    }`}
                    placeholder="John Doe"
                    required
                  />
                  {hasError('fullName') && <span className="text-red-500 text-[10px] block mt-1 font-bold">Full Name is required.</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-3.5 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/30"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full border rounded-sm px-3.5 py-2.5 text-xs outline-none transition-colors bg-gray-50/30 ${
                      hasError('phone') ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:border-[#222529]'
                    }`}
                    placeholder="e.g. 9811234567"
                    required
                  />
                  {hasError('phone') && <span className="text-red-500 text-[10px] block mt-1 font-bold">Phone Number is required.</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Alternative Phone</label>
                  <input
                    type="tel"
                    name="alternativePhone"
                    value={formData.alternativePhone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-3.5 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/30"
                    placeholder="Optional alternative number"
                  />
                </div>
              </div>

              {/* Grouped Location Fields */}
              <div className="border border-gray-200 rounded-sm p-4 bg-gray-50/30 space-y-4">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block border-b border-gray-150 pb-1.5">Address & Region</span>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <label className="block text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">Province *</label>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      className={`w-full border rounded-sm px-3 py-2 text-xs outline-none transition-colors bg-white font-medium ${
                        hasError('province') ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#222529]'
                      }`}
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
                    {hasError('province') && <span className="text-red-500 text-[9px] block mt-1 font-bold">Province is required.</span>}
                  </div>
                  
                  <div className="md:col-span-6">
                    <label className="block text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">District *</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className={`w-full border rounded-sm px-3 py-2 text-xs outline-none transition-colors bg-white font-medium ${
                        hasError('district') ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#222529]'
                      }`}
                      placeholder="e.g. Kathmandu"
                      required
                    />
                    {hasError('district') && <span className="text-red-500 text-[9px] block mt-1 font-bold">District is required.</span>}
                  </div>

                  <div className="md:col-span-8">
                    <label className="block text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">Municipality / City *</label>
                    <input
                      type="text"
                      name="municipality"
                      value={formData.municipality}
                      onChange={handleInputChange}
                      className={`w-full border rounded-sm px-3 py-2 text-xs outline-none transition-colors bg-white font-medium ${
                        hasError('municipality') ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#222529]'
                      }`}
                      placeholder="e.g. Kathmandu Metropolitan"
                      required
                    />
                    {hasError('municipality') && <span className="text-red-500 text-[9px] block mt-1 font-bold">City is required.</span>}
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">Ward No. <span className="font-medium normal-case">(Optional)</span></label>
                    <input
                      type="number"
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:border-[#222529] outline-none transition-colors bg-white font-medium"
                      placeholder="e.g. 8"
                      title="Your local municipality ward number (1–35). Leave blank if unsure."
                      min="1"
                      max="35"
                    />
                    <p className="text-[9px] text-gray-400 mt-0.5 font-medium">Local ward no. — optional</p>
                  </div>
                </div>
              </div>

              {/* Street Address and Landmark */}
              <div className="relative">
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">Street Address / Landmark *</label>
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
                  className={`w-full border rounded-sm px-3.5 py-2.5 text-xs outline-none transition-colors bg-gray-50/30 ${
                    hasError('streetAddress') ? 'border-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-300 focus:border-[#222529]'
                  }`}
                  placeholder="Street address, building, or nearby landmark (Type to search map...)"
                  required
                />
                {hasError('streetAddress') && <span className="text-red-500 text-[10px] block mt-1 font-bold">Street Address is required.</span>}
                
                {/* LocationIQ Suggestions Dropdown */}
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

              {/* Delivery and shipping options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Shipping Region</label>
                  <select
                    name="shippingLocation"
                    value={formData.shippingLocation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-3.5 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-white font-semibold text-gray-700 cursor-pointer"
                  >
                    <option value="INSIDE">Kathmandu Valley (Inside Valley)</option>
                    <option value="OUTSIDE">Outside Valley</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Delivery Time Preference</label>
                  <select
                    name="deliveryTimePreference"
                    value={formData.deliveryTimePreference}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-sm px-3.5 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-white font-semibold text-gray-700 cursor-pointer"
                  >
                    <option value="ANYTIME">Anytime (Default)</option>
                    <option value="MORNING">Morning (9 AM - 12 PM)</option>
                    <option value="AFTERNOON">Afternoon (12 PM - 5 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Order Notes (Optional)</label>
                <textarea
                  name="orderNote"
                  value={formData.orderNote}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full border border-gray-300 rounded-sm px-3.5 py-2.5 text-xs focus:border-[#222529] outline-none transition-colors bg-gray-50/30 resize-none"
                  placeholder="Notes about your order, e.g. instructions for delivery rider..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Card 2: Payment Gateway Selection */}
          <div className="bg-white border border-gray-200 rounded-sm p-6 md:p-8 shadow-sm space-y-5">
            <h2 className="text-xs font-black uppercase tracking-widest border-b border-gray-150 pb-3">
              2. Payment Method
            </h2>
            
            <div className="grid grid-cols-1 gap-3.5">
              <label className={`block border rounded-sm p-4 cursor-pointer transition-all ${formData.paymentMethod === 'COD' ? 'border-[#222529] bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleInputChange}
                    className="accent-[#222529] w-4.5 h-4.5"
                  />
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-[#222529]">Cash on Delivery (COD)</span>
                    <span className="block text-[10px] text-gray-500 font-semibold mt-1">Pay with physical cash or QR code scan on delivery.</span>
                  </div>
                </div>
              </label>

              <label className={`block border rounded-sm p-4 cursor-pointer transition-all ${formData.paymentMethod === 'ESEWA' ? 'border-green-600 bg-green-50/10' : 'border-gray-200 hover:border-green-300'}`}>
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ESEWA"
                    checked={formData.paymentMethod === 'ESEWA'}
                    onChange={handleInputChange}
                    className="accent-green-600 w-4.5 h-4.5"
                  />
                  <div className="flex-1">
                    <span className="block text-xs font-black uppercase tracking-wider text-green-700">eSewa Mobile Wallet</span>
                    <span className="block text-[10px] text-gray-500 font-semibold mt-1">Instant online payment using Nepal's leading eSewa gateway.</span>
                  </div>
                  <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-5.5 object-contain opacity-90" />
                </div>
              </label>

              <label className={`block border rounded-sm p-4 cursor-pointer transition-all ${formData.paymentMethod === 'KHALTI' ? 'border-purple-600 bg-purple-50/10' : 'border-gray-200 hover:border-purple-300'}`}>
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="KHALTI"
                    checked={formData.paymentMethod === 'KHALTI'}
                    onChange={handleInputChange}
                    className="accent-purple-600 w-4.5 h-4.5"
                  />
                  <div className="flex-1">
                    <span className="block text-xs font-black uppercase tracking-wider text-purple-700">Khalti Wallet</span>
                    <span className="block text-[10px] text-gray-500 font-semibold mt-1">Pay securely online via Khalti digital payment gateway.</span>
                  </div>
                  <span className="text-purple-750 text-xs font-black uppercase tracking-widest">Khalti</span>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Sticky Totals */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          
          {/* Card 3: Order Summary list */}
          <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest border-b border-gray-150 pb-3">
              Order Summary
            </h2>
            
            <div className="max-h-[300px] overflow-y-auto pr-1 divide-y divide-gray-100">
              {Object.values(groupedItems).map(group => (
                <div key={group.sellerId} className="py-3.5 first:pt-0">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">
                    Store: {group.sellerName}
                  </span>
                  <div className="space-y-3">
                    {group.items.map(item => (
                      <div key={item.cartItemId} className="flex gap-3 items-center">
                        <div className="w-11 h-11 border border-gray-150 rounded-sm flex items-center justify-center p-1 flex-shrink-0 bg-gray-50">
                          {item.image ? (
                            <img
                              src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image.startsWith('/') ? '' : '/'}${item.image}`}
                              alt=""
                              className="object-contain w-full h-full"
                            />
                          ) : <span className="text-[10px]">📦</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-bold text-[#222529] line-clamp-1">{item.name}</h4>
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
          </div>

          {/* Card 4: Price details breakdown */}
          <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-black uppercase tracking-widest border-b border-gray-150 pb-3">
              Payment Totals
            </h2>

            <div className="space-y-3 text-xs font-semibold text-gray-655">
              <div className="flex justify-between items-center text-gray-500">
                <span className="uppercase text-[9px] font-black tracking-wider text-gray-500">Subtotal</span>
                <span className="font-extrabold text-[#222529]">Rs. {formatMoney(activeSubtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center text-gray-500 border-t border-gray-100 pt-2.5">
                <span className="uppercase text-[9px] font-black tracking-wider text-gray-500">Shipping Charge</span>
                <span className="font-extrabold text-[#222529]">Rs. {formatMoney(activeShipping)}</span>
              </div>

              {/* Show individual seller shipping if there are multiple */}
              {Object.keys(groupedItems).length > 1 && (
                <div className="pl-3 border-l-2 border-gray-150 space-y-1.5 py-1 text-[10px] text-gray-400">
                  {Object.values(groupedItems).map(group => (
                    <div key={group.sellerId} className="flex justify-between">
                      <span className="truncate pr-4">{group.sellerName}</span>
                      <span className="font-bold">Rs. {formatMoney(calculateGroupShipping(group, formData.shippingLocation))}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-gray-500 border-t border-gray-100 pt-2.5">
                <span className="uppercase text-[9px] font-black tracking-wider text-gray-500">Included VAT (13%)</span>
                <span className="font-extrabold text-[#222529]">Rs. {formatMoney(vatAmount)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-green-600 border-t border-gray-100 pt-2.5">
                  <span className="uppercase text-[9px] font-black tracking-wider">Coupon Discount ({discountPercent}%)</span>
                  <span className="font-extrabold">- Rs. {formatMoney(discountAmount)}</span>
                </div>
              )}

              {/* Loyalty reward points */}
              <div className="border-t border-gray-100 pt-3">
                <div className="bg-gray-50 border border-gray-200 rounded-sm p-3.5 space-y-2.5">
                  <div className="flex flex-col gap-2">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500">
                      Redeem Reward Points
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        name="loyaltyPointsToRedeem"
                        value={formData.loyaltyPointsToRedeem}
                        onChange={handleLoyaltyPointsChange}
                        placeholder="Points count (e.g. 100)"
                        className="flex-1 border border-gray-300 rounded-sm px-3 py-1.5 text-xs font-bold outline-none focus:border-[#222529]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-gray-550 font-bold border-t border-gray-150 pt-2">
                    <span>Available Balance:</span>
                    <span>{Number(loyaltyWallet?.availablePoints || 0).toLocaleString()} pts</span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-semibold leading-normal">
                    * Max redemption limit: 30% of the eligible order value.
                  </p>

                  {loyaltyQuote && (
                    <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 text-emerald-700 text-[10px]">
                      <span className="font-black uppercase tracking-wider">
                        Points Discount ({Number(loyaltyQuote.approvedPoints || 0).toLocaleString()} pts)
                      </span>
                      <span className="font-black">- Rs. {formatMoney(loyaltyQuote.discountAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-250 flex justify-between items-baseline">
                <span className="uppercase text-[11px] font-black tracking-widest text-[#222529]">Grand Total</span>
                <span className="text-xl font-black text-[#222529]">Rs. {formatMoney(grandTotal)}</span>
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3.5 text-xs font-black uppercase tracking-wide leading-relaxed">
                ⚠️ Error: {errorMsg}
              </div>
            )}

            {/* Complete checkout CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={processing}
              className={`w-full text-white text-xs font-black uppercase tracking-widest py-4 rounded-sm transition-all shadow-md flex justify-center items-center gap-2 ${
                processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-750 shadow-emerald-600/10'
              }`}
            >
              {processing ? (
                <>
                  <svg className="animate-spin w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Processing Order...
                </>
              ) : (
                <>Place Order Now Rs. {formatMoney(grandTotal)}</>
              )}
            </button>
            
            <p className="text-[9px] font-semibold text-center text-gray-400 leading-normal">
              By placing this order, you agree to our{' '}
              <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-[#222529] transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-[#222529] transition-colors">Privacy Policy</a>.
            </p>
          </div>

        </div>

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
