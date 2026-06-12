import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, getProductById, updateCartQty, removeCartItem, clearCart, validatePromoCode } from '../../shared/api/customerApi';
import { BASE_URL } from '../../shared/api/apiClient';
import { useCustomer } from '../customer/contexts/CustomerContext';
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

const Cart = () => {
  const [items, setItems] = useState([]);
  const [backendSubtotal, setBackendSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  
  // Shipping State
  const [shippingMethod, setShippingMethod] = useState('valley'); // 'valley' or 'outside'

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const { user, refreshCart } = useCustomer();
  const navigate = useNavigate();
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getCart(userId);
      // Backend DTO returns CartResponseDTO with { subtotal: Double, items: List<CartItemResponseDTO> }
      const cartData = res.data;
      if (cartData) {
        const cartItems = Array.isArray(cartData.items) ? cartData.items : [];
        setItems(await enrichCartItems(cartItems));
        setBackendSubtotal(cartData.subtotal || 0);
      } else {
        setItems([]);
        setBackendSubtotal(0);
      }
    } catch (err) {
      console.error("Failed to load cart", err);
      setItems([]);
      setBackendSubtotal(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleQty = async (cartItemId, qty, stockQuantity) => {
    if (qty < 1) return;
    if (stockQuantity && qty > stockQuantity) {
      alert(`Only ${stockQuantity} units left in stock.`);
      return;
    }
    setBusyId(cartItemId);
    try {
      await updateCartQty(userId, cartItemId, qty);
      await load();
      refreshCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update quantity.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (cartItemId) => {
    setBusyId(cartItemId);
    try {
      await removeCartItem(userId, cartItemId);
      await load();
      refreshCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove item.');
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
    setLoading(true);
    try {
      await clearCart(userId);
      await load();
      refreshCart();
    } catch (err) {
      alert('Failed to clear cart.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setCouponMessage('');
      localStorage.removeItem('jhapcham_coupon');
      return;
    }
    const code = couponCode.trim().toUpperCase();
    
    const payloadItems = items.map(item => ({
      productId: item.product?.id || item.productId,
      variantId: item.variant?.id || item.variantId || null,
      quantity: item.quantity || 1
    }));

    try {
      const res = await validatePromoCode(code, payloadItems);
      const validation = res.data;
      if (validation.valid) {
        const amt = Number(validation.discountAmount || 0);
        const activeSubtotalVal = activeSubtotal;
        if (activeSubtotalVal > 0) {
          setDiscountPercent((amt / activeSubtotalVal) * 100);
        } else {
          setDiscountPercent(0);
        }
        setCouponMessage(`🎟️ Coupon applied: Rs. ${formatMoney(amt)} discount!`);
        localStorage.setItem('jhapcham_coupon', code);
      } else {
        setDiscountPercent(0);
        setCouponMessage(validation.message || '❌ Invalid coupon code.');
        localStorage.removeItem('jhapcham_coupon');
      }
    } catch (err) {
      setDiscountPercent(0);
      setCouponMessage('❌ Invalid coupon code.');
      localStorage.removeItem('jhapcham_coupon');
    }
  };

  // Math calculations
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const activeSubtotal = backendSubtotal > 0 ? backendSubtotal : calculatedSubtotal;
  
  const discountAmount = activeSubtotal * (discountPercent / 100);
  const shippingLocation = shippingMethod === 'outside' ? 'OUTSIDE' : 'INSIDE';
  const groupedItems = groupCartBySeller(items);
  const activeShipping = calculateGroupedShipping(groupedItems, shippingLocation);
  const vatAmount = activeSubtotal - (activeSubtotal / VAT_INCLUSIVE_DIVISOR);
  const grandTotal = activeSubtotal + activeShipping - discountAmount;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xs">
        <svg className="animate-spin w-6 h-6 text-[#222529] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span>Synchronizing cart with backend…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 bg-white border border-gray-200 rounded-sm shadow-sm p-8">
        <div className="text-5xl mb-4 select-none">🛒</div>
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">Your Shopping Cart is Empty</h3>
        <p className="text-xs text-gray-400 mb-6 font-medium">Add premium items to your cart while exploring the storefront.</p>
        <button
          className="bg-[#222529] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-sm transition-all shadow-sm"
          onClick={() => navigate('/')}
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-1 md:px-3 text-[#222529]">
      
      {/* Dynamic Multi-Step Checkout Indicator */}
      <div className="flex justify-center items-center gap-2 md:gap-4 mb-8 text-[10px] md:text-[11px] font-black uppercase tracking-wider select-none">
        <span className="text-[#222529] border-b-2 border-[#222529] pb-0.5">01. Shopping Cart</span>
        <span className="text-gray-300">➔</span>
        <span className="text-gray-400">02. Checkout Details</span>
        <span className="text-gray-300">➔</span>
        <span className="text-gray-400">03. Order Complete</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Product Table & Coupon Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-250 rounded-sm overflow-hidden shadow-sm">
            
            {/* Header row */}
            <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50 border-b border-gray-200 p-4 text-[9px] font-black uppercase tracking-widest text-[#777]">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-gray-250">
              {Object.values(groupedItems).map((group) => (
                <div key={group.sellerId} className="bg-white">
                  {/* Seller Header */}
                  <div className="bg-gray-50/70 px-4 py-2.5 border-b border-gray-150 flex justify-between items-center gap-3 text-[10px] font-black uppercase tracking-wider text-[#777]">
                    <span className="text-[#222529]">Sold by: {group.sellerName}</span>
                    <span className="text-gray-500 font-extrabold normal-case">
                      Shipping Charge: <span className="text-blue-600 font-black">Rs. {formatMoney(calculateGroupShipping(group, shippingLocation))}</span>
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item) => {
                      const itemPrice = item.price || 0;
                      const itemQty = item.quantity || 1;
                      const rowSubtotal = itemPrice * itemQty;
                      const itemImage = item.image;
                      
                      return (
                        <div key={item.cartItemId} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative group">
                          
                          {/* Remove icon on top corner */}
                          <button
                            className="absolute top-3 right-3 md:top-auto md:right-auto md:relative md:col-span-1 md:order-first w-5 h-5 rounded-full border border-gray-200 hover:border-red-400 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors text-[9px] font-bold bg-white"
                            onClick={() => handleRemove(item.cartItemId)}
                            title="Remove Item"
                            disabled={busyId === item.cartItemId}
                          >
                            ✕
                          </button>

                          {/* Product cell */}
                          <div className="col-span-11 md:col-span-5 flex gap-3.5 items-center">
                            <div className="w-14 h-14 bg-[#fafafa] border border-gray-150 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
                              {itemImage ? (
                                <img
                                  src={itemImage.startsWith('http') ? itemImage : `${BASE_URL}${itemImage.startsWith('/') ? '' : '/'}${itemImage}`}
                                  alt=""
                                  className="object-contain w-full h-full"
                                />
                              ) : (
                                <span className="text-xl">📦</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
                                {item.brand || 'Premium'}
                              </span>
                              <h4 className="text-[11px] font-bold text-[#222529] hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                                {item.name}
                              </h4>
                              {item.variantLabel && (
                                <span className="inline-block bg-gray-50 border border-gray-150 rounded-sm px-1.5 py-0.5 text-[9px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                                  {item.variantLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price cell */}
                          <div className="col-span-4 md:col-span-2 text-left md:text-center flex md:block items-center justify-between text-xs border-t border-gray-50 pt-2 md:border-0 md:pt-0">
                            <span className="md:hidden text-[9px] font-black uppercase text-gray-400 tracking-wider">Price</span>
                            <span className="font-extrabold text-[#222529]">Rs. {formatMoney(itemPrice)}</span>
                          </div>

                          {/* Quantity cell */}
                          <div className="col-span-4 md:col-span-2 text-center flex md:block items-center justify-between border-t border-gray-50 pt-2 md:border-0 md:pt-0">
                            <span className="md:hidden text-[9px] font-black uppercase text-gray-400 tracking-wider">Quantity</span>
                            <div className="inline-flex border border-gray-200 rounded-sm overflow-hidden bg-white h-7 items-center">
                              <button
                                className="w-7 h-full text-[#777] hover:text-[#222529] hover:bg-gray-50 transition-colors font-bold text-xs flex items-center justify-center disabled:opacity-40"
                                disabled={busyId === item.cartItemId || itemQty <= 1}
                                onClick={() => handleQty(item.cartItemId, itemQty - 1, item.stockQuantity)}
                              >
                                −
                              </button>
                              <span className="w-7 text-[10px] font-extrabold text-[#222529] text-center select-none">
                                {itemQty}
                              </span>
                              <button
                                className="w-7 h-full text-[#777] hover:text-[#222529] hover:bg-gray-50 transition-colors font-bold text-xs flex items-center justify-center disabled:opacity-40"
                                disabled={busyId === item.cartItemId || (item.stockQuantity && itemQty >= item.stockQuantity)}
                                onClick={() => handleQty(item.cartItemId, itemQty + 1, item.stockQuantity)}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Subtotal cell */}
                          <div className="col-span-4 md:col-span-2 text-right flex md:block items-center justify-between border-t border-gray-50 pt-2 md:border-0 md:pt-0">
                            <span className="md:hidden text-[9px] font-black uppercase text-gray-400 tracking-wider">Subtotal</span>
                            <span className="font-black text-[#222529] text-xs">Rs. {formatMoney(rowSubtotal)}</span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions Row: Clear Cart */}
            <div className="bg-gray-50/50 p-4 border-t border-gray-150 flex justify-end">
              <button
                className="text-red-500 hover:text-red-700 text-[9px] font-black uppercase tracking-widest border border-red-200 hover:border-red-400 px-4 py-2 bg-white rounded-sm transition-all"
                onClick={handleClear}
              >
                Clear Entire Cart
              </button>
            </div>
          </div>

          {/* Coupon Input Area */}
          <div className="bg-white border border-gray-255 rounded-sm p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleApplyCoupon} className="flex gap-2 w-full md:max-w-sm">
              <input
                className="flex-1 px-3 py-2 border border-gray-200 rounded-sm text-xs font-semibold outline-none focus:border-[#222529] uppercase tracking-wider placeholder:normal-case placeholder:text-gray-400 transition-colors"
                placeholder="Coupon code (e.g. JHAPCHAM10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-[#222529] hover:bg-black text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-sm transition-all"
              >
                Apply Coupon
              </button>
            </form>
            {couponMessage && (
              <span className={`text-[10px] font-black uppercase tracking-wider ${couponMessage.startsWith('❌') ? 'text-red-500' : 'text-green-600'}`}>
                {couponMessage}
              </span>
            )}
          </div>
        </div>

        {/* Right Panel: Premium Cart Totals Card */}
        <div className="bg-white border border-gray-255 rounded-sm p-5 shadow-sm space-y-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#222529] pb-3.5 border-b-2 border-b-[#222529] inline-block">
            Cart Totals
          </h3>

          <div className="space-y-4 text-xs font-semibold">
            {/* Subtotal */}
            <div className="flex justify-between items-baseline text-gray-500">
              <span className="uppercase text-[9px] font-black tracking-wider">Subtotal</span>
              <span className="text-[#222529] font-extrabold text-sm">Rs. {formatMoney(activeSubtotal)}</span>
            </div>

            {/* Shipping options */}
            <div className="border-t border-b border-gray-100 py-4 space-y-2.5">
              <span className="text-[#777] uppercase text-[9px] font-black tracking-wider block">Shipping Method</span>
              
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="shipping"
                  value="valley"
                  checked={shippingMethod === 'valley'}
                  onChange={() => setShippingMethod('valley')}
                  className="accent-[#222529] w-3.5 h-3.5"
                />
                <span className="text-[#222529] font-bold text-xs">Kathmandu Valley delivery</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="shipping"
                  value="outside"
                  checked={shippingMethod === 'outside'}
                  onChange={() => setShippingMethod('outside')}
                  className="accent-[#222529] w-3.5 h-3.5"
                />
                <span className="text-[#222529] font-bold text-xs">Outside Valley delivery</span>
              </label>
            </div>

            <div className="border-b border-gray-100 pb-4 space-y-3">
              <div className="flex justify-between items-baseline text-gray-500">
                <span className="uppercase text-[9px] font-black tracking-wider">Shipping</span>
                <span className="text-[#222529] font-extrabold">Rs. {formatMoney(activeShipping)}</span>
              </div>
              {Object.values(groupedItems).map(group => {
                const totalQty = group.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
                return (
                  <div key={group.sellerId} className="rounded-sm border border-gray-200 bg-white p-3 space-y-1 my-1 shadow-sm">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#222529]">
                        {group.sellerName}
                      </span>
                      <span className="font-black text-[11px] text-gray-800 whitespace-nowrap">
                      Rs. {formatMoney(calculateGroupShipping(group, shippingLocation))}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-500">
                      {totalQty} {totalQty === 1 ? 'item' : 'items'}: {getGroupItemSummary(group)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-baseline text-gray-500">
              <span className="uppercase text-[9px] font-black tracking-wider">Included VAT (13%)</span>
              <span className="text-[#222529] font-extrabold">Rs. {formatMoney(vatAmount)}</span>
            </div>

            {/* Discount line if active */}
            {discountPercent > 0 && (
              <div className="flex justify-between items-baseline text-green-600">
                <span className="uppercase text-[9px] font-black tracking-wider">Coupon Discount ({discountPercent}%)</span>
                <span className="font-extrabold">- Rs. {formatMoney(discountAmount)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-2 flex justify-between items-baseline">
              <span className="uppercase text-[10px] font-black tracking-widest text-[#222529]">Total Amount</span>
              <span className="text-base font-black text-blue-600">Rs. {formatMoney(grandTotal)}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            className="w-full bg-[#222529] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-sm transition-all shadow-md shadow-[#222529]/10 flex items-center justify-center gap-2"
            onClick={() => navigate('/customer/checkout')}
          >
            Proceed to Checkout ➔
          </button>
        </div>

      </div>
    </div>
  );
};

export default Cart;
