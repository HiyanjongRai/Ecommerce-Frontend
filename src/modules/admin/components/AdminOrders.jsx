import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Eye, Edit, Truck, X, ChevronDown, RefreshCw, Calendar, CreditCard, ShoppingBag, DollarSign, User, MapPin } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminOrders, updateAdminOrderStatus, deliverAdminOrder } from '../services/adminService';
import { useAdminTheme } from '../hooks/useAdminTheme';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || 'N/A').replaceAll('_', ' ');
const date  = v => v ? new Date(v).toLocaleString() : 'N/A';

const Badge = ({ value, themeClasses }) => {
  const statusMap = {
    PENDING:          themeClasses.status.warning,
    CONFIRMED:        themeClasses.status.info,
    PACKED:           themeClasses.status.success,
    SHIPPED:          themeClasses.status.info,
    OUT_FOR_DELIVERY: themeClasses.status.warning,
    DELIVERED:        themeClasses.status.success,
    CANCELLED:        themeClasses.status.pending,
    FAILED:           themeClasses.status.danger,
    RETURNED:         themeClasses.status.danger,
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusMap[value] || themeClasses.status.pending}`}>
      {nice(value)}
    </span>
  );
};

export default function AdminOrders() {
  const { themeClasses } = useAdminTheme();
  const [searchParams] = useSearchParams();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState(searchParams.get('orderId') || searchParams.get('search') || '');
  const [filter, setFilter]       = useState('ALL');
  const [working, setWorking]     = useState('');

  useEffect(() => {
    const q = searchParams.get('orderId') || searchParams.get('search');
    if (q) {
      setSearch(q);
      const matched = orders.find(o => String(o.orderId) === q || String(o.customOrderId || '').toLowerCase() === q.toLowerCase());
      if (matched) {
        setDetailOrder(matched);
      }
    }
  }, [searchParams, orders]);
  const [toast, setToast]         = useState('');
  const [detailOrder, setDetailOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setOrders([]);
      showToast('❌ Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdateStatus = async () => {
    if (!statusOrder || !newStatus) return;
    setWorking(statusOrder.orderId);
    try {
      await updateAdminOrderStatus(statusOrder.orderId, newStatus);
      setOrders(prev => prev.map(o => o.orderId === statusOrder.orderId ? { ...o, status: newStatus } : o));
      if (detailOrder && detailOrder.orderId === statusOrder.orderId) {
        setDetailOrder(prev => ({ ...prev, status: newStatus }));
      }
      showToast('✅ Order status updated successfully');
      setShowStatusModal(false);
      setStatusOrder(null);
    } catch {
      showToast('❌ Failed to update order status');
    } finally {
      setWorking('');
    }
  };

  const handleDeliverManually = async (orderId) => {
    if (!window.confirm('Are you sure you want to mark this order as DELIVERED manually? This will finalize accounting and commissions.')) return;
    setWorking(orderId);
    try {
      await deliverAdminOrder(orderId);
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'DELIVERED' } : o));
      if (detailOrder && detailOrder.orderId === orderId) {
        setDetailOrder(prev => ({ ...prev, status: 'DELIVERED' }));
      }
      showToast('✅ Order manually marked as DELIVERED');
    } catch {
      showToast('❌ Failed to deliver order manually');
    } finally {
      setWorking('');
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'ALL' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || [
      String(o.customOrderId || o.orderId),
      o.customerName,
      o.customerPhone,
      o.customerEmail,
      o.sellerStoreName
    ].some(f => f?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const ORDER_STATUS_FLOW = [
    'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURNED'
  ];

  return (
    <AdminLayout pageTitle="Order Management" pageSubtitle={`${orders.length} orders tracked`}>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-sm font-bold px-4 py-3 rounded-xl shadow-xl transition-all duration-300 ${themeClasses.bg.secondary} ${themeClasses.text.primary}`}>
          {toast}
        </div>
      )}

      {/* Filters Bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative w-full max-w-sm">
            <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Order ID, customer, seller..."
              className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className={`appearance-none pl-3 pr-8 py-2.5 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
            >
              <option value="ALL">All Statuses</option>
              {ORDER_STATUS_FLOW.map(st => (
                <option key={st} value={st}>{nice(st)}</option>
              ))}
            </select>
            <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${themeClasses.text.tertiary}`} />
          </div>
        </div>
        <button
          onClick={load}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="p-6">
        <div className={`rounded-lg shadow-sm border overflow-hidden transition-colors ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Order ID', 'Customer', 'Seller Store', 'Grand Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} className={`border-b transition-colors ${themeClasses.border.primary}`}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse transition-colors ${themeClasses.bg.tertiary}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className={`text-center py-16 font-medium transition-colors ${themeClasses.text.tertiary}`}>No orders found</td></tr>
                ) : filtered.map(o => (
                  <tr key={o.orderId} className={`border-b transition-colors ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`}>
                    <td className={`px-4 py-3 font-mono font-bold transition-colors text-emerald-600`}>
                      #{o.customOrderId || o.orderId}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={`font-semibold transition-colors ${themeClasses.text.primary}`}>{o.customerName || 'N/A'}</p>
                        <p className={`text-[10px] transition-colors ${themeClasses.text.tertiary}`}>{o.customerPhone || 'No Phone'}</p>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.secondary}`}>
                      {o.sellerStoreName || '—'}
                    </td>
                    <td className={`px-4 py-3 font-bold transition-colors ${themeClasses.text.primary}`}>
                      {money(o.grandTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}>
                        {nice(o.paymentMethod || 'COD')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={o.status} themeClasses={themeClasses} />
                    </td>
                    <td className={`px-4 py-3 text-xs transition-colors ${themeClasses.text.tertiary}`}>
                      {date(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailOrder(o)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => {
                            setStatusOrder(o);
                            setNewStatus(o.status);
                            setShowStatusModal(true);
                          }}
                          disabled={working === o.orderId}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${themeClasses.status.success}`}
                        >
                          <Edit size={12} /> Status
                        </button>
                        {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'RETURNED' && (
                          <button
                            onClick={() => handleDeliverManually(o.orderId)}
                            disabled={working === o.orderId}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${themeClasses.status.success}`}
                          >
                            <Truck size={12} /> Manual Deliver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setDetailOrder(null)} />
          <div className={`relative w-full max-w-2xl h-full shadow-2xl flex flex-col animate-slide-in transition-colors ${themeClasses.bg.primary}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${themeClasses.border.primary}`}>
              <div>
                <h2 className={`text-lg font-black transition-colors ${themeClasses.text.primary}`}>Order Detail</h2>
                <p className={`text-xs font-mono transition-colors ${themeClasses.text.tertiary}`}>ID: #{detailOrder.customOrderId || detailOrder.orderId}</p>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className={`p-2 rounded-lg transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Header Banner */}
              <div className={`rounded-2xl p-4 border flex items-center justify-between transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>Status</p>
                  <div className="mt-1">
                    <Badge value={detailOrder.status} themeClasses={themeClasses} />
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider text-right transition-colors ${themeClasses.text.tertiary}`}>Order Date</p>
                  <p className={`text-sm font-bold mt-1 transition-colors ${themeClasses.text.primary}`}>{date(detailOrder.createdAt)}</p>
                </div>
              </div>

              {/* Customer and Shipping details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-2xl p-4 space-y-3 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                    <User size={13} /> Customer Details
                  </h3>
                  <div>
                    <p className={`text-sm font-bold transition-colors ${themeClasses.text.primary}`}>{detailOrder.customerName || 'N/A'}</p>
                    <p className={`text-xs mt-1 transition-colors ${themeClasses.text.secondary}`}>{detailOrder.customerEmail || 'No Email'}</p>
                    <p className={`text-xs transition-colors ${themeClasses.text.secondary}`}>{detailOrder.customerPhone || 'No Phone'}</p>
                  </div>
                </div>

                <div className={`rounded-2xl p-4 space-y-3 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                    <MapPin size={13} /> Shipping Address
                  </h3>
                  <p className={`text-xs font-medium leading-relaxed transition-colors ${themeClasses.text.secondary}`}>
                    {detailOrder.shippingAddress || 'No address specified'}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className={`border rounded-2xl overflow-hidden transition-colors ${themeClasses.border.primary}`}>
                <div className={`px-4 py-2.5 border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                    <ShoppingBag size={13} /> Order Items
                  </h3>
                </div>
                <div className={`divide-y transition-colors ${themeClasses.border.primary}`}>
                  {detailOrder.items?.map((item, idx) => (
                    <div key={idx} className={`p-4 flex items-center justify-between gap-4 text-xs transition-colors ${themeClasses.bg.primary}`}>
                      <div>
                        <p className={`font-bold transition-colors ${themeClasses.text.primary}`}>{item.productName}</p>
                        <p className={`text-[10px] mt-0.5 transition-colors ${themeClasses.text.tertiary}`}>Quantity: {item.quantity} x {money(item.unitPrice)}</p>
                      </div>
                      <p className={`font-bold transition-colors ${themeClasses.text.primary}`}>{money(item.quantity * item.unitPrice)}</p>
                    </div>
                  )) || (
                    <div className={`p-4 text-center transition-colors ${themeClasses.text.tertiary}`}>No items listed in summary</div>
                  )}
                </div>
              </div>

              {/* Financial Breakdowns */}
              <div className={`border rounded-2xl p-4 space-y-3 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                  <DollarSign size={13} /> Financial Summary
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={`transition-colors ${themeClasses.text.tertiary}`}>Items Total:</span>
                    <span className={`font-semibold transition-colors ${themeClasses.text.primary}`}>{money(detailOrder.itemsSubtotal || detailOrder.grandTotal - 150)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors ${themeClasses.text.tertiary}`}>Shipping Fee:</span>
                    <span className={`font-semibold transition-colors ${themeClasses.text.primary}`}>{money(detailOrder.shippingFee || 150)}</span>
                  </div>
                  {detailOrder.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount Coupon:</span>
                      <span>-{money(detailOrder.discount)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between border-t pt-2 text-sm font-black transition-colors ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
                    <span>Grand Total:</span>
                    <span>{money(detailOrder.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Accounting Split for Admin */}
              <div className={`border rounded-2xl p-4 space-y-3 transition-colors ${themeClasses.bg.success} ${themeClasses.border.accent}`}>
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${themeClasses.text.success}`}>
                  <CreditCard size={13} /> Platform Split Estimation
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={`transition-colors ${themeClasses.text.success}`}>Gross to Merchant:</span>
                    <span className={`font-bold transition-colors ${themeClasses.text.success}`}>
                      {money(detailOrder.sellerGrossAmount || (detailOrder.grandTotal * 0.9))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors ${themeClasses.text.success}`}>Platform Commission Fee (10%):</span>
                    <span className={`font-bold transition-colors ${themeClasses.text.success}`}>
                      {money(detailOrder.commissionAmount || (detailOrder.grandTotal * 0.1))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className={`border-t p-4 flex gap-3 transition-colors ${themeClasses.border.primary}`}>
              <button
                onClick={() => {
                  setStatusOrder(detailOrder);
                  setNewStatus(detailOrder.status);
                  setShowStatusModal(true);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors ${themeClasses.button.primary}`}
              >
                Update Status
              </button>
              {detailOrder.status !== 'DELIVERED' && detailOrder.status !== 'CANCELLED' && detailOrder.status !== 'RETURNED' && (
                <button
                  onClick={() => handleDeliverManually(detailOrder.orderId)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors ${themeClasses.button.primary}`}
                >
                  Deliver Manually
                </button>
              )}
              <button
                onClick={() => setDetailOrder(null)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && statusOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowStatusModal(false)} />
          <div className={`relative rounded-lg shadow-xl w-full max-w-md overflow-hidden transition-colors ${themeClasses.bg.primary}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${themeClasses.border.primary}`}>
              <h2 className={`font-black text-base transition-colors ${themeClasses.text.primary}`}>Update Order Status</h2>
              <button onClick={() => setShowStatusModal(false)} className={`p-2 rounded-lg transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary}`}>
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className={`text-xs font-medium transition-colors ${themeClasses.text.tertiary}`}>
                Update the status for Order <span className={`font-bold font-mono transition-colors ${themeClasses.text.primary}`}>#{statusOrder.customOrderId || statusOrder.orderId}</span>:
              </p>

              <div>
                <label className={`block text-[11px] font-black uppercase tracking-wider mb-2 transition-colors ${themeClasses.text.tertiary}`}>New Status</label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className={`w-full pl-3 pr-8 py-2.5 text-sm rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
                  >
                    {ORDER_STATUS_FLOW.map(st => (
                      <option key={st} value={st}>{nice(st)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${themeClasses.text.tertiary}`} />
                </div>
              </div>

              {newStatus === 'DELIVERED' && (
                <div className={`text-[11px] font-bold p-3 rounded-lg border transition-colors ${themeClasses.bg.success} ${themeClasses.border.accent}`}>
                  ⚠️ Changing status to DELIVERED will close shipping updates and mark commission due dates for the merchant.
                </div>
              )}

              {newStatus === 'CANCELLED' && (
                <div className={`text-[11px] font-bold p-3 rounded-lg border transition-colors ${themeClasses.bg.danger} ${themeClasses.border.danger}`}>
                  ⚠️ Changing status to CANCELLED will restore product stock levels. Any prepaid balances will trigger a pending refund.
                </div>
              )}
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <button
                onClick={() => setShowStatusModal(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={working === statusOrder.orderId}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${themeClasses.button.primary}`}
              >
                {working === statusOrder.orderId ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
