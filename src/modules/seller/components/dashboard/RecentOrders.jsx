import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, MoreHorizontal, ArrowRight } from 'lucide-react';
import { resolveImageUrl } from '../SellerSectionUtils';

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getPaymentConfig = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'PAID') {
    return { cls: 'bg-emerald-50 dark:bg-emerald-950/20 text-[#16A34A] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30', label: 'Paid' };
  }
  if (s === 'REFUNDED') {
    return { cls: 'bg-purple-50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30', label: 'Refunded' };
  }
  return { cls: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30', label: 'Pending' };
};

const getStatusConfig = (status) => {
  const s = String(status || '').toUpperCase();
  if (['DELIVERED', 'COMPLETED'].includes(s)) {
    return 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-[#16A34A] dark:text-emerald-400';
  }
  if (['CANCELLED', 'FAILED', 'RETURNED'].includes(s)) {
    return 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-650 dark:text-red-405';
  }
  return 'bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-650 dark:text-blue-405';
};

const RecentOrders = ({
  recentOrdersList,
  loading,
  colors,
  isDark
}) => {
  const navigate = useNavigate();
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const finalOrdersList = recentOrdersList.slice(0, 5);

  return (
    <div 
      className="sc-card" 
      style={{ 
        overflow: 'visible', 
        padding: '0px',
        boxShadow: '0 1px 2px rgba(0,0,0,.04)',
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: colors.cardBg
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '18px 24px', 
          borderBottom: `1px solid ${colors.border}` 
        }}
      >
        <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textSec, margin: 0 }}>
          Recent Orders
        </h2>
        <Link 
          to="/seller/orders" 
          style={{ 
            fontSize: '13px', 
            fontWeight: '700', 
            color: '#16A34A', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          className="hover:underline"
        >
          View All Orders <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0' }}>
          <div style={{ width: '18px', height: '18px', border: `2px solid ${colors.border}`, borderTopColor: colors.primaryGreen, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: colors.textSec, textTransform: 'uppercase' }}>Synchronizing...</span>
        </div>
      ) : finalOrdersList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <ShoppingBag size={24} style={{ color: colors.textSec, marginBottom: '8px' }} />
          <p style={{ fontSize: '13px', fontWeight: '700', color: colors.textMain, margin: 0 }}>No recent orders yet.</p>
          <p style={{ fontSize: '11.5px', color: colors.textSec, marginTop: '2px', margin: 0 }}>New purchase orders will list here in real time.</p>
        </div>
      ) : (
        <div className="p-5 space-y-4" style={{ backgroundColor: colors.cardBg }}>
          {finalOrdersList.map(order => {
            const s = String(order.status).toUpperCase();
            const paymentStatus = order.paymentStatus || ( !['UNPAID', 'PENDING', 'CANCELLED'].includes(s) ? 'Paid' : 'Unpaid' );
            const pConf = getPaymentConfig(paymentStatus);
            const sBadgeCls = getStatusConfig(order.status);
            
            const displayId = order.displayId || order.id || '';
            const truncatedId = displayId.length > 8 ? displayId.slice(-8) : displayId;
            const productName = order.product || order.productNames || 'Ordered Items';
            const customerName = order.customer || order.customerName || 'Anonymous';
            const qty = order.quantity || order.totalItems || 1;
            const amount = Number(order.amount || order.sellerNetAmount || order.totalAmount || 0);

            return (
              <div 
                key={order.id} 
                  className={`border rounded-xl p-4 md:py-3.5 md:px-5 flex flex-col lg:flex-row gap-4 lg:items-center shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                    isDark ? 'bg-zinc-950/40 border-zinc-900 text-white' : 'bg-white border-[#E5E7EB] text-gray-800'
                  }`}
                  onClick={() => navigate(`/seller/orders?orderId=${order.id}`)}
                >
                  {/* 1. Left Section: Product details & ID */}
                  <div className="flex flex-1 items-center gap-3.5 min-w-0">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center p-1 flex-shrink-0 overflow-hidden border ${
                      isDark ? 'bg-zinc-905 border-zinc-800' : 'bg-white border-gray-150'
                    }`}>
                      {order.image || order.productImage || order.imagePath ? (
                        <img src={resolveImageUrl(order.image || order.productImage || order.imagePath)} className="max-w-full max-h-full object-contain rounded-lg" alt="" />
                      ) : (
                        <svg className={`w-5 h-5 ${isDark ? 'text-zinc-700' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-bold leading-snug truncate hover:text-[#16A34A] transition-colors" style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>
                         {productName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-medium mt-0.5" style={{ color: isDark ? '#A1A1AA' : '#6B7280' }}>
                         <span>Customer: <span className="font-semibold" style={{ color: isDark ? '#E4E4E7' : '#334155' }}>{customerName}</span></span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium mt-0.5" style={{ color: isDark ? '#A1A1AA' : '#6B7280' }}>
                        <span>Qty: <strong className="font-semibold" style={{ color: isDark ? '#E4E4E7' : '#334155' }}>{qty}</strong></span>
                        <span style={{ color: isDark ? '#3F3F46' : '#D1D5DB' }}>•</span>
                        <span>Order ID: <strong className="font-semibold" style={{ color: isDark ? '#E4E4E7' : '#334155' }}>#{truncatedId}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Center Section: Compact Payment & Dates */}
                  <div className={`w-full lg:w-48 flex-shrink-0 flex flex-col gap-1 border-t lg:border-t-0 lg:border-l lg:border-r pt-3 lg:pt-0 lg:px-4.5 text-xs font-medium ${
                    isDark ? 'border-zinc-900 text-zinc-400' : 'border-gray-100 text-gray-500'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span>Payment:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pConf.cls}`}>
                        {paymentStatus}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span>Placed:</span>
                      <strong style={{ color: isDark ? '#E4E4E7' : '#334155' }} className="font-semibold">{fmtDate(order.date || order.createdAt)}</strong>
                    </div>
                    
                    <div className="text-[10px] font-medium" style={{ color: isDark ? '#71717A' : '#9CA3AF' }}>
                      {order.status.toUpperCase() === 'DELIVERED' && order.deliveredAt && `Delivered ${fmtDate(order.deliveredAt)}`}
                      {order.status.toUpperCase() === 'SHIPPED' && order.shippedAt && `Shipped ${fmtDate(order.shippedAt)}`}
                      {order.status.toUpperCase() === 'CANCELLED' && order.cancelledAt && `Cancelled ${fmtDate(order.cancelledAt)}`}
                      {!['DELIVERED', 'SHIPPED', 'CANCELLED'].includes(order.status.toUpperCase()) && `Expected: ${fmtDate(order.date ? new Date(new Date(order.date).getTime() + 7*24*60*60*1000) : new Date(new Date(order.createdAt).getTime() + 7*24*60*60*1000))}`}
                    </div>
                  </div>

                  {/* 3. Right Section: Price, Status & Actions */}
                  <div className="w-full lg:w-auto flex-shrink-0 flex flex-row lg:flex-col xl:flex-row items-center gap-3.5 justify-between lg:justify-start">
                    <div className="flex flex-col gap-0.5 min-w-[90px] lg:text-right xl:text-left">
                      <span className="text-lg font-bold font-mono leading-none text-[#16A34A]">{colors.primaryGreen === '#16A34A' ? 'Rs. ' : ''}{amount.toLocaleString()}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider leading-none" style={{ color: isDark ? '#71717A' : '#9CA3AF' }}>Net Earnings</span>
                    </div>

                    <span className={`h-8 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 select-none ${sBadgeCls}`}>
                      {order.status}
                    </span>

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => navigate(`/seller/orders?orderId=${order.id}`)}
                        className="h-8 px-3 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 border-none"
                        style={{ backgroundColor: colors.primaryGreen }}
                      >
                        View
                      </button>
                      
                      {/* Dropdown Menu Trigger */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveDropdownId(activeDropdownId === order.id ? null : order.id)}
                          className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all border cursor-pointer ${
                            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850' : 'bg-transparent border-gray-200 text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        
                        {activeDropdownId === order.id && (
                          <div 
                            className={`absolute right-0 top-9 rounded-lg shadow-lg border p-1 z-50 min-w-[125px] ${
                              isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-gray-150'
                            }`}
                          >
                            <button 
                              onClick={() => {
                                setActiveDropdownId(null);
                                alert(`Printing Invoice for order #${displayId}`);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors border-none bg-transparent cursor-pointer ${
                                isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-slate-700 hover:bg-gray-100/50'
                              }`}
                            >
                              Print Invoice
                            </button>
                            <button 
                              onClick={() => {
                                setActiveDropdownId(null);
                                navigate(`/seller/inbox`);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors border-none bg-transparent cursor-pointer ${
                                isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-slate-700 hover:bg-gray-100/50'
                              }`}
                            >
                              Message Buyer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentOrders;
