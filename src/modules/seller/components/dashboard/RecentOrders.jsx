import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, MoreHorizontal, ArrowRight } from 'lucide-react';

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

  // Seed with mock order data if it doesn't already exist
  const mockOrder = {
    id: 'JHC-28260628-0001',
    displayId: 'JHC-28260628-0001',
    product: 'iPhone 15 Pro Max',
    status: 'Delivered',
    paymentStatus: 'Paid',
    customer: 'Ram Pasal',
    amount: 139999,
    date: 'Jun 28, 2026'
  };

  const displayOrders = [...recentOrdersList];
  if (!displayOrders.find(o => String(o.id) === 'JHC-28260628-0001' || String(o.displayId) === 'JHC-28260628-0001')) {
    displayOrders.unshift(mockOrder);
  }
  const finalOrdersList = displayOrders.slice(0, 5);

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
        <>
          {/* Desktop Table View */}
          <table className="desktop-table w-full text-left" style={{ borderCollapse: 'collapse', border: 'none', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: isDark ? '#161616' : '#F8FAFC' }}>
                {['Order ID', 'Product', 'Amount', 'Status', 'Actions'].map(col => (
                  <th key={col} style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: colors.textSec }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {finalOrdersList.map(order => {
                const s = String(order.status).toUpperCase();
                const paymentStatus = order.paymentStatus || ( !['UNPAID', 'PENDING', 'CANCELLED'].includes(s) ? 'Paid' : 'Unpaid' );
                const isPaid = paymentStatus.toUpperCase() === 'PAID';
                const isCompleted = ['DELIVERED', 'COMPLETED'].includes(s);

                const displayId = order.displayId || order.id || '';
                const truncatedId = displayId.length > 8 ? displayId.slice(-8) : displayId;

                return (
                  <tr 
                    key={order.id} 
                    onClick={() => navigate(`/seller/orders?orderId=${order.id}`)}
                    style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', transition: 'background-color 0.15s' }}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/5"
                  >
                    {/* Order ID */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', fontFamily: 'monospace', color: colors.primaryGreen }}>
                      <span title={displayId} style={{ borderBottom: '1px dotted rgba(22, 163, 74, 0.4)', paddingBottom: '1px' }}>
                        #{truncatedId}
                      </span>
                    </td>
                    
                    {/* Product */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: colors.textMain, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600' }}>{order.product}</span>
                        <span style={{ fontSize: '11px', color: colors.textSec }}>to {order.customer}</span>
                      </div>
                    </td>
                    
                    {/* Amount */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: colors.textMain }}>
                      Rs. {Number(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    
                    {/* Status (with Payment sub-label) */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                        <span 
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: isCompleted ? '#ECFDF5' : '#EFF6FF',
                            color: isCompleted ? '#16A34A' : '#3B82F6'
                          }}
                        >
                          {order.status}
                        </span>
                        <span style={{ fontSize: '11px', color: isPaid ? '#16A34A' : '#F59E0B', fontWeight: '600', marginLeft: '4px' }}>
                          · {paymentStatus}
                        </span>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td style={{ padding: '16px 24px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => navigate(`/seller/orders?orderId=${order.id}`)}
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            fontWeight: '700', 
                            border: 'none', 
                            borderRadius: '8px', 
                            backgroundColor: colors.primaryGreen, 
                            color: '#FFFFFF', 
                            cursor: 'pointer',
                            minHeight: '32px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)'
                          }}
                          className="hover:bg-green-700"
                        >
                          View
                        </button>
                        
                        {/* Dropdown Menu Trigger */}
                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={() => setActiveDropdownId(activeDropdownId === order.id ? null : order.id)}
                            style={{
                              background: 'none',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              cursor: 'pointer',
                              color: colors.textSec,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                            className="hover:bg-gray-100 dark:hover:bg-white/5"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          
                          {activeDropdownId === order.id && (
                            <div 
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '36px',
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '10px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                zIndex: 50,
                                minWidth: '130px',
                                padding: '4px'
                              }}
                            >
                              <button 
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  alert(`Printing Invoice for order #${displayId}`);
                                }}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  border: 'none',
                                  background: 'none',
                                  color: colors.textMain,
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  fontWeight: '600'
                                }}
                                className="hover:bg-gray-100/50 dark:hover:bg-white/5"
                              >
                                Print Invoice
                              </button>
                              <button 
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  navigate(`/seller/inbox`);
                                }}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  border: 'none',
                                  background: 'none',
                                  color: colors.textMain,
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  fontWeight: '600'
                                }}
                                className="hover:bg-gray-100/50 dark:hover:bg-white/5"
                              >
                                Message Buyer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="mobile-cards" style={{ padding: '16px', display: 'none' }}>
            {finalOrdersList.map(order => {
              const s = String(order.status).toUpperCase();
              const paymentStatus = order.paymentStatus || ( !['UNPAID', 'PENDING', 'CANCELLED'].includes(s) ? 'Paid' : 'Unpaid' );
              const isPaid = paymentStatus.toUpperCase() === 'PAID';
              const isCompleted = ['DELIVERED', 'COMPLETED'].includes(s);

              const displayId = order.displayId || order.id || '';
              const truncatedId = displayId.length > 8 ? displayId.slice(-8) : displayId;

              return (
                <div 
                  key={order.id} 
                  onClick={() => navigate(`/seller/orders?orderId=${order.id}`)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '10px',
                    backgroundColor: colors.cardBg,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                  className="hover:border-green-500"
                >
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'monospace', color: colors.primaryGreen }}>
                      #{truncatedId}
                    </span>
                    <span style={{ fontSize: '11px', color: colors.textSec }}>{order.date}</span>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: colors.textMain, margin: 0 }}>{order.customer}</p>
                    <p style={{ fontSize: '12px', color: colors.textSec, margin: '2px 0 0 0' }}>{order.product}</p>
                  </div>

                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: colors.textMain }}>
                      Rs. {Number(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: isCompleted ? '#ECFDF5' : '#EFF6FF', color: isCompleted ? '#16A34A' : '#3B82F6' }}>
                        {order.status}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: isPaid ? '#16A34A' : '#F59E0B' }}>
                        · {paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${colors.border}`, paddingTop: '10px' }} onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => navigate(`/seller/orders?orderId=${order.id}`)} 
                      style={{ 
                        flex: 1, 
                        padding: '8px 0', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        border: 'none', 
                        borderRadius: '8px', 
                        backgroundColor: colors.primaryGreen, 
                        color: '#FFFFFF', 
                        cursor: 'pointer',
                        minHeight: '36px'
                      }}
                      className="hover:bg-green-700"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => alert(`Printing Invoice #${displayId}`)} 
                      style={{ 
                        padding: '8px 12px', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        border: `1px solid ${colors.border}`, 
                        borderRadius: '8px', 
                        backgroundColor: colors.cardBg, 
                        color: colors.textMain, 
                        cursor: 'pointer',
                        minHeight: '36px'
                      }}
                      className="hover:bg-gray-55"
                    >
                      Print
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RecentOrders;
