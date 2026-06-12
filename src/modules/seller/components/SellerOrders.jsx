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
    <div className="space-y-5 font-sans">
      {/* Page Header */}
      <SectionHeader 
        title="Order & Analytics Desk" 
        subtitle="Review store transactions, payouts, and fulfillment operations." 
      />

      {message && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-bold flex items-center gap-2">
          <span className="text-lg">⚠️</span> {message}
        </div>
      )}

      {/* Stats Grid - Clean & Minimalistic */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.all, icon: '📦', color: 'bg-white border-l-4 border-green-600', textColor: 'text-green-600' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: 'bg-white border-l-4 border-red-600', textColor: 'text-red-600' },
          { label: 'Processing', value: stats.processing, icon: '⚙️', color: 'bg-white border-l-4 border-black', textColor: 'text-black' },
          { label: 'Net Earnings', value: formatMoney(stats.earnings), icon: '💰', color: 'bg-white border-l-4 border-green-600', textColor: 'text-green-600' }
        ].map((card, idx) => (
          <div 
            key={idx} 
            className={`${card.color} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">{card.label}</p>
                <p className={`text-2xl font-black ${card.textColor} mt-2`}>{card.value}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Search - Clean Design */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'PROCESSING', label: 'Processing' },
              { id: 'SHIPPED', label: 'Shipped' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'CANCELLED', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Search Order ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-800 placeholder-gray-500 font-semibold"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-700 text-lg">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table - Clean & Minimalistic */}
      {filteredOrders.length === 0 ? (
        <EmptyState 
          title="No Matching Orders" 
          text="There are no orders that match your active tab filter or search query criteria." 
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-gray-600">Order ID</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-gray-600">Customer</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-gray-600">Items</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-gray-600">Amount</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-gray-600">Status</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const itemsCount = order.totalItems || 1;
                  return (
                    <tr 
                      key={order.orderId || order.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="px-5 py-4">
                        <p className="font-black text-green-600 text-sm">
                          {order.customOrderId || `#${order.orderId || order.id}`}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900 text-sm">{order.customerName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{order.customerPhone || 'N/A'}</p>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {order.productImage && (
                            <img 
                              src={resolveImageUrl(order.productImage)} 
                              alt="Product" 
                              className="w-8 h-8 rounded object-cover border border-gray-200" 
                            />
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-sm truncate">{order.productNames || 'Items'}</p>
                            <p className="text-xs text-gray-500">{itemsCount} item{itemsCount > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <p className="font-black text-gray-900 text-sm">
                          Rs. {formatMoney(order.sellerNetAmount || order.totalAmount || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{order.paymentMethod || 'COD'}</p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block ${
                          order.status === 'PENDING' || order.status === 'COD_PENDING' ? 'bg-red-100 text-red-700' :
                          order.status === 'PROCESSING' || order.status === 'PACKED' ? 'bg-black text-white' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => handleOpenDetails(order)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
