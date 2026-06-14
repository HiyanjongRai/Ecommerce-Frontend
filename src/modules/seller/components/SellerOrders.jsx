import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getSellerOrders, 
  getSellerProfile
} from '../services/sellerService';
import { 
  EmptyState, 
  LoadingState, 
  SectionHeader, 
  formatMoney, 
  normalizeList, 
  statusClass, 
  resolveImageUrl 
} from './SellerSectionUtils';
import SellerOrderDetails from './SellerOrderDetails';
import { useSellerTheme } from '../hooks/useSellerTheme';

// Strip backend role prefixes from customer names (server-side concat bug)
// e.g. "admincustomer_userJohn Doe" → "John Doe"
const sanitizeName = (raw) => {
  if (!raw) return 'Anonymous';
  // IMPORTANT: longer patterns must come BEFORE shorter ones (admincustomer_user before admin)
  const cleaned = String(raw).replace(/^(admincustomer_user|customer_user|admin|seller_user|user_)/i, '').trim();
  return cleaned || 'Anonymous';
};

const VALID_TRANSITIONS = {
  DRAFT: ['CONFIRMED', 'CANCELLED', 'FAILED'],
  PENDING: [
    'COD_PENDING', 'CONFIRMED', 'CONFIRMED_BY_CALL',
    'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY',
    'CANCELLED', 'FAILED'
  ],
  COD_PENDING: [
    'CONFIRMED_BY_CALL', 'CONFIRMED', 'PROCESSING',
    'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY',
    'CANCELLED', 'FAILED'
  ],
  CONFIRMED: [
    'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY',
    'CANCELLED', 'FAILED'
  ],
  CONFIRMED_BY_CALL: [
    'PROCESSING', 'PACKED', 'SHIPPED', 'CANCELLED'
  ],
  PROCESSING: [
    'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY',
    'CANCELLED', 'FAILED'
  ],
  PACKED: [
    'SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'
  ],
  SHIPPED: [
    'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_REQUESTED',
    'RETURNED', 'CANCELLED', 'FAILED'
  ],
  OUT_FOR_DELIVERY: [
    'DELIVERED', 'RETURN_REQUESTED', 'RETURNED',
    'CANCELLED', 'FAILED'
  ],
  RETURN_REQUESTED: [
    'RETURNED', 'REFUNDED'
  ],
  RETURNED: [
    'REFUNDED'
  ],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: []
};

const SellerOrders = () => {
  const [searchParams] = useSearchParams();
  const { darkMode, themeClasses } = useSellerTheme();
  const [sellerUserId, setSellerUserId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Filtering & Search
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('orderId') || '');

  useEffect(() => {
    const q = searchParams.get('orderId');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);
  
  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const profileRes = await getSellerProfile();
      const userId = profileRes.data?.userId;
      setSellerUserId(userId);
      if (userId) {
        const orderRes = await getSellerOrders(userId);
        setOrders(normalizeList(orderRes.data));
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Recalculate stats dynamically based on ALL orders
  const stats = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let earnings = 0;

    orders.forEach(order => {
      const status = String(order.status).toUpperCase();
      if (['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(status)) {
        pending++;
      } else if (['PROCESSING', 'PACKED'].includes(status)) {
        processing++;
      }
      
      // Calculate net earnings for non-cancelled orders
      if (!['CANCELLED', 'FAILED', 'RETURNED'].includes(status)) {
        earnings += Number(order.sellerNetAmount || order.totalAmount || 0);
      }
    });

    return {
      all: orders.length,
      pending,
      processing,
      earnings
    };
  }, [orders]);

  // Tab Filtering logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filter by tab
      const status = String(order.status).toUpperCase();
      let matchesTab = true;
      if (activeTab === 'PENDING') {
        matchesTab = ['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(status);
      } else if (activeTab === 'PROCESSING') {
        matchesTab = ['PROCESSING', 'PACKED'].includes(status);
      } else if (activeTab === 'SHIPPED') {
        matchesTab = status === 'SHIPPED';
      } else if (activeTab === 'COMPLETED') {
        matchesTab = status === 'DELIVERED';
      } else if (activeTab === 'CANCELLED') {
        matchesTab = ['CANCELLED', 'FAILED', 'RETURNED'].includes(status);
      }

      // 2. Filter by search query
      let matchesSearch = true;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const customOrderIdStr = String(order.customOrderId || '').toLowerCase();
        const orderIdStr = String(order.orderId || order.id || '').toLowerCase();
        const customerNameStr = String(order.customerName || order.userName || '').toLowerCase();
        const productsStr = String(order.productNames || '').toLowerCase();
        matchesSearch = customOrderIdStr.includes(q) || orderIdStr.includes(q) || customerNameStr.includes(q) || productsStr.includes(q);
      }

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  // Fetch complete order details including individual items for the Modal
  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  if (loading) return <LoadingState label="Loading seller orders..." />;

  const stepperSteps = [
    { 
      key: 'PENDING', 
      label: 'PENDING', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      key: 'PROCESSING', 
      label: 'PREPARING', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      key: 'PACKED', 
      label: 'PACKED', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      key: 'SHIPPED', 
      label: 'SHIPPED', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      )
    },
    { 
      key: 'DELIVERED', 
      label: 'DELIVERED', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const getStepState = (orderStatus, stepKey) => {
    const status = String(orderStatus).toUpperCase();
    const steps = ['PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
    
    let currentIdx = 0;
    if (['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(status)) currentIdx = 0;
    else if (status === 'PROCESSING') currentIdx = 1;
    else if (status === 'PACKED') currentIdx = 2;
    else if (status === 'SHIPPED') currentIdx = 3;
    else if (status === 'DELIVERED') currentIdx = 4;
    else if (['CANCELLED', 'FAILED', 'RETURNED'].includes(status)) return 'inactive';

    const stepIdx = steps.indexOf(stepKey);
    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return 'inactive';
  };

  const getStepperProgressWidth = (orderStatus) => {
    const status = String(orderStatus).toUpperCase();
    if (['PENDING', 'COD_PENDING', 'DRAFT', 'INITIATED'].includes(status)) return 0;
    if (status === 'PROCESSING') return 25;
    if (status === 'PACKED') return 50;
    if (status === 'SHIPPED') return 75;
    if (status === 'DELIVERED') return 100;
    return 0;
  };

  return (
    <div className="space-y-4 max-w-[1400px] font-sans">
      {/* Page Header */}
      <SectionHeader 
        title="Order & Analytics Desk" 
        subtitle="Review store transactions, payouts, and fulfillment operations." 
      />

      {message && (
        <div className="p-3 rounded-sm bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2">
          ⚠️ {message}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: stats.all,                        color: 'border-green-600' },
          { label: 'Pending',      value: stats.pending,                    color: 'border-amber-500' },
          { label: 'Processing',   value: stats.processing,                 color: 'border-blue-500'  },
          { label: 'Net Earnings', value: formatMoney(stats.earnings),      color: 'border-emerald-600' },
        ].map((card, idx) => (
          <div key={idx} className={`bg-white border border-gray-200 border-l-4 ${card.color} rounded-sm p-3.5 shadow-sm`}>
            <h3 className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">{card.label}</h3>
            <div className="text-base font-black text-gray-900 leading-none">{card.value}</div>
          </div>
        ))}
      </div>


      {/* Tabs & Search */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 pt-3.5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'PROCESSING', label: 'Processing' },
              { id: 'SHIPPED', label: 'Shipped' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'CANCELLED', label: 'Cancelled' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search order ID or customer…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-200 rounded-sm px-3 py-1.5 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 w-52"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[10px] text-gray-400 hover:text-gray-700">✕</button>
            )}
          </div>
        </div>

      {/* Orders Table - Clean & Minimalistic */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-14">
            <svg className="w-8 h-8 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
            <p className="text-xs font-semibold text-gray-500">No orders match your filter or search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Order ID</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Customer</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Items</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400">Status</th>
                  <th className="py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-gray-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const itemsCount = order.totalItems || 1;
                  return (
                    <tr key={order.orderId || order.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        {(() => {
                          const orderStatus = String(order.status).toUpperCase();
                          const isUrgent = ['PENDING', 'COD_PENDING', 'PROCESSING', 'CONFIRMED', 'PACKED'].includes(orderStatus) &&
                            (order.createdAt && (Date.now() - new Date(order.createdAt).getTime() > 24 * 60 * 60 * 1000));
                          return (
                            <div>
                              <p className="font-black text-[11px] text-green-700">{order.customOrderId || `#${order.orderId || order.id}`}</p>
                              {isUrgent && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm mt-0.5 animate-pulse">
                                  LATE DISPATCH
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-[11px] text-gray-800">{sanitizeName(order.customerName)}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{order.customerPhone || 'N/A'}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {order.productImage && (
                            <img src={resolveImageUrl(order.productImage)} alt="Product" className="w-7 h-7 rounded-sm object-cover border border-gray-200" />
                          )}
                          <div>
                            <p className="font-bold text-[11px] text-gray-800 max-w-[130px] truncate">{order.productNames || 'Items'}</p>
                            <p className="text-[10px] text-gray-400">{itemsCount} item{itemsCount > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-black text-[11px] text-gray-800">{formatMoney(order.sellerNetAmount || order.totalAmount || 0)}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{order.paymentMethod || 'COD'}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide inline-block border ${
                          order.status === 'PENDING' || order.status === 'COD_PENDING' ? 'bg-red-50 text-red-600 border-red-200' :
                          order.status === 'PROCESSING' || order.status === 'PACKED' ? 'bg-gray-900 text-white border-gray-900' :
                          order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>{order.status || 'Pending'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button onClick={() => handleOpenDetails(order)}
                          className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white rounded-sm text-[9px] font-black uppercase tracking-wider transition-colors">
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Order Modal - Using New Component */}
      {showDetailModal && selectedOrder && (
        <SellerOrderDetails 
          orderId={selectedOrder.orderId || selectedOrder.id}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
            load(); // Refresh orders list
          }}
        />
      )}
    </div>
  );
};

export default SellerOrders;
