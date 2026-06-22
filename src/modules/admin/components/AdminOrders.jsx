import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Eye, 
  Edit, 
  Truck, 
  X, 
  ChevronDown, 
  RefreshCw, 
  Calendar, 
  CreditCard, 
  ShoppingBag, 
  DollarSign, 
  User, 
  MapPin, 
  Download, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminOrders, updateAdminOrderStatus, deliverAdminOrder } from '../services/adminService';
import { useAdminTheme } from '../hooks/useAdminTheme';

const money = v => `Rs. ${Number(v || 0).toLocaleString()}`;
const nice  = v => String(v || 'N/A').replaceAll('_', ' ');
const dateLabel = v => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const Badge = ({ value, themeClasses }) => {
  const statusMap = {
    PENDING:          themeClasses.status.warning,
    CONFIRMED:        themeClasses.status.info,
    PACKED:           themeClasses.status.info,
    SHIPPED:          themeClasses.status.info,
    OUT_FOR_DELIVERY: themeClasses.status.warning,
    DELIVERED:        themeClasses.status.success,
    CANCELLED:        themeClasses.status.danger,
    FAILED:           themeClasses.status.danger,
    RETURNED:         themeClasses.status.danger,
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusMap[value] || themeClasses.status.pending}`}>
      {nice(value)}
    </span>
  );
};

/* ─── Premium Slide-Over Drawer Component ─── */
const OrderDrawer = ({ open, onClose, title, children, themeClasses }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" 
        onClick={onClose} 
      />
      {/* Panel */}
      <div className={`relative w-full max-w-lg h-full shadow-2xl flex flex-col z-50 border-l transition-all duration-300 transform translate-x-0 ${themeClasses.card} ${themeClasses.border.primary}`}>
        {/* Drawer Header */}
        <div className={`flex items-center justify-between px-6 py-4.5 border-b transition-colors ${themeClasses.border.primary}`}>
          <h2 className={`font-black text-xs uppercase tracking-wider transition-colors ${themeClasses.text.primary}`}>{title}</h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl border transition-colors ${themeClasses.text.tertiary} ${themeClasses.border.primary} hover:${themeClasses.bg.secondary} cursor-pointer`}
          >
            <X size={15} />
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function AdminOrders() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [searchParams] = useSearchParams();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState(searchParams.get('orderId') || searchParams.get('search') || '');
  const [filter, setFilter]       = useState('ALL');
  const [working, setWorking]     = useState('');
  const [toast, setToast]         = useState('');
  const [detailOrder, setDetailOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  /* Pagination states */
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;

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

  useEffect(() => { 
    load(); 
  }, [load]);

  useEffect(() => {
    const q = searchParams.get('orderId') || searchParams.get('search');
    if (q && orders.length > 0) {
      setSearch(q);
      const matched = orders.find(o => String(o.orderId) === q || String(o.customOrderId || '').toLowerCase() === q.toLowerCase());
      if (matched) {
        setDetailOrder(matched);
      }
    }
  }, [searchParams, orders]);

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

  /* Dynamic metrics card stats */
  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(o => ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    
    // total order volume (gross value) of delivered or active orders
    const grossVolume = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'FAILED').reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    return { total, active, delivered, grossVolume };
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
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
  }, [orders, filter, search]);

  const displayedOrders = useMemo(() => {
    return filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleExportOrders = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jhapcham_orders_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset page index on search/filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [search, filter]);

  const ORDER_STATUS_FLOW = [
    'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURNED'
  ];

  return (
    <AdminLayout 
      pageTitle="Order Management" 
      pageSubtitle="Fulfill platform orders, monitor shipping details, and estimate commission splits."
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-xl border shadow-xl animate-slide-in ${darkMode ? 'bg-[#0d1117] border-emerald-500/30 text-emerald-400' : 'bg-white border-emerald-500/20 text-emerald-800'}`}>
          {toast}
        </div>
      )}

      <div className={`p-4 lg:p-6 space-y-6 min-h-[calc(100vh-80px)] ${themeClasses.bg.secondary}`}>
        
        {/* Dynamic Statistics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          
          {/* Gross Order Value */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Gross Order Value</span>
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-2xs border ${darkMode ? 'bg-blue-950/40 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                <TrendingUp size={15} />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-xl font-black leading-none tracking-tight ${themeClasses.text.primary}`}>{money(stats.grossVolume)}</p>
              <p className={`text-[10px] font-semibold mt-2.5 ${themeClasses.text.tertiary}`}>Settled & active checkouts</p>
            </div>
          </div>

          {/* Active Orders */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Active Fulfillments</span>
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-2xs border ${darkMode ? 'bg-amber-950/40 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                <ShoppingBag size={15} />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-black leading-none tracking-tight ${themeClasses.text.primary}`}>{stats.active}</p>
              <p className={`text-[10px] font-semibold mt-2 ${themeClasses.text.tertiary}`}>Orders in dispatch flow</p>
            </div>
          </div>

          {/* Delivered Orders */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Orders Completed</span>
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-2xs border ${darkMode ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                <CheckCircle size={15} />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-black leading-none tracking-tight ${themeClasses.text.primary}`}>{stats.delivered}</p>
              <p className={`text-[10px] font-semibold mt-2 ${themeClasses.text.tertiary}`}>Successfully delivered</p>
            </div>
          </div>

          {/* Total Transactions */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Total Orders</span>
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-2xs border ${darkMode ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                <Calendar size={15} />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-black leading-none tracking-tight ${themeClasses.text.primary}`}>{stats.total}</p>
              <p className={`text-[10px] font-semibold mt-2 ${themeClasses.text.tertiary}`}>Platform order count</p>
            </div>
          </div>

        </div>

        {/* Filters and Search utilities Row */}
        <div className={`rounded-[20px] border p-4.5 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Search Box */}
            <div className="relative w-full max-w-sm">
              <Search size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by Order ID, customer, store..."
                className={`w-full pl-9.5 pr-4 py-2 text-xs font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
              />
            </div>

            {/* Status Select */}
            <div className="relative">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className={`appearance-none pl-3.5 pr-9 py-2 text-xs font-black uppercase tracking-wider rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors cursor-pointer ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
              >
                <option value="ALL">All Statuses</option>
                {ORDER_STATUS_FLOW.map(st => (
                  <option key={st} value={st}>{nice(st)}</option>
                ))}
              </select>
              <ChevronDown size={13} className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${themeClasses.text.tertiary}`} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportOrders}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors shadow-2xs cursor-pointer ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
            >
              <Download size={13} />
              Export Orders
            </button>

            <button
              onClick={load}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors shadow-2xs cursor-pointer ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
            >
              Sync
            </button>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className={`rounded-[20px] border shadow-sm overflow-hidden transition-all duration-300 ${themeClasses.card} ${themeClasses.border.primary}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                  {['Order ID', 'Customer details', 'Seller Store', 'Amount Total', 'Payment Type', 'Fulfillment', 'Logged Date', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-4 text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.text.tertiary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${themeClasses.border.primary}`}>
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} className={`transition-colors ${themeClasses.border.primary}`}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-5 py-4.5">
                          <div className={`h-4.5 rounded-lg animate-pulse transition-colors ${themeClasses.bg.tertiary}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16">
                      <div className="text-center flex flex-col items-center justify-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border shadow-2xs transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
                          <ShoppingBag className={`w-5 h-5 ${themeClasses.text.tertiary}`} />
                        </div>
                        <h4 className={`text-xs font-black uppercase tracking-wider ${themeClasses.text.primary}`}>No orders found</h4>
                        <p className={`mt-1 text-xs font-semibold max-w-xs ${themeClasses.text.tertiary}`}>
                          No transactional order records match the filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedOrders.map(o => (
                    <tr key={o.orderId} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-5 py-4 font-mono font-bold text-emerald-600">
                        #{o.customOrderId || o.orderId}
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className={`font-bold transition-colors ${themeClasses.text.primary}`}>{o.customerName || 'N/A'}</p>
                          <p className={`text-[10px] font-semibold transition-colors ${themeClasses.text.tertiary}`}>{o.customerPhone || 'No contact phone'}</p>
                        </div>
                      </td>
                      <td className={`px-5 py-4 font-bold transition-colors ${themeClasses.text.secondary}`}>
                        {o.sellerStoreName || '—'}
                      </td>
                      <td className={`px-5 py-4 font-black transition-colors ${themeClasses.text.primary}`}>
                        {money(o.grandTotal)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-colors ${themeClasses.bg.tertiary} ${themeClasses.text.secondary} ${themeClasses.border.primary}`}>
                          {nice(o.paymentMethod || 'COD')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge value={o.status} themeClasses={themeClasses} />
                      </td>
                      <td className={`px-5 py-4 font-semibold transition-colors ${themeClasses.text.tertiary}`}>
                        {dateLabel(o.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailOrder(o)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
                          >
                            <Eye size={12} /> View File
                          </button>
                          <button
                            onClick={() => {
                              setStatusOrder(o);
                              setNewStatus(o.status);
                              setShowStatusModal(true);
                            }}
                            disabled={working === o.orderId}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50`}
                          >
                            <Edit size={12} /> Route State
                          </button>
                          {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'RETURNED' && (
                            <button
                              onClick={() => handleDeliverManually(o.orderId)}
                              disabled={working === o.orderId}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50`}
                            >
                              <Truck size={12} /> Manual Deliver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className={`px-5 py-3 border-t flex items-center justify-between text-xs font-semibold bg-gray-50/10 transition-colors ${themeClasses.border.primary} ${themeClasses.text.tertiary}`}>
              <span>Showing {currentPage * itemsPerPage + 1} - {Math.min((currentPage + 1) * itemsPerPage, filtered.length)} of {filtered.length} orders</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} hover:${themeClasses.bg.secondary}`}
                >
                  Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} hover:${themeClasses.bg.secondary}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Order Detail Drawer */}
      <OrderDrawer 
        open={!!detailOrder} 
        onClose={() => setDetailOrder(null)} 
        title="Fulfillment Order File" 
        themeClasses={themeClasses}
      >
        {detailOrder && (
          <div className="flex flex-col h-full animate-fade-in">
            {/* Header top banner */}
            <div className="relative">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-28 w-full" />
              <div className="absolute left-6 -bottom-8">
                <div className="w-18 h-18 rounded-full border-4 border-white bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                  <ShoppingBag size={24} />
                </div>
              </div>
            </div>

            {/* Profile cover info */}
            <div className="px-6 pt-11 pb-5 border-b border-gray-100">
              <h3 className={`text-base font-black ${themeClasses.text.primary}`}>Order #{detailOrder.customOrderId || detailOrder.orderId}</h3>
              <p className={`text-xs font-semibold mt-0.5 ${themeClasses.text.tertiary}`}>Seller: <span className={`font-bold ${themeClasses.text.secondary}`}>{detailOrder.sellerStoreName || '—'}</span></p>
              <div className="mt-2.5 flex items-center gap-2">
                <Badge value={detailOrder.status} themeClasses={themeClasses} />
                <span className={`text-[10px] font-semibold ${themeClasses.text.tertiary}`}>Placed {dateLabel(detailOrder.createdAt)}</span>
              </div>
            </div>

            {/* Drawer Body scrollable */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              {/* Customer and Shipping cards grid */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* Customer Info Card */}
                <div className={`rounded-xl border p-4 space-y-3 ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
                  <h4 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${themeClasses.text.tertiary}`}>
                    <User size={12} /> Customer Details
                  </h4>
                  <div className="text-xs font-semibold leading-relaxed">
                    <p className={`font-bold ${themeClasses.text.primary}`}>{detailOrder.customerName || 'N/A'}</p>
                    <p className={`mt-1 ${themeClasses.text.secondary}`}>{detailOrder.customerEmail || 'No Email'}</p>
                    <p className={themeClasses.text.secondary}>{detailOrder.customerPhone || 'No Phone Number'}</p>
                  </div>
                </div>

                {/* Shipping Address Card */}
                <div className={`rounded-xl border p-4 space-y-3 ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
                  <h4 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${themeClasses.text.tertiary}`}>
                    <MapPin size={12} /> Shipment Destination
                  </h4>
                  <p className={`text-xs font-semibold leading-relaxed ${themeClasses.text.secondary}`}>
                    {detailOrder.shippingAddress || 'No shipping location specified.'}
                  </p>
                </div>

              </div>

              {/* Order Items Catalog */}
              <div className={`border rounded-xl overflow-hidden ${themeClasses.border.primary}`}>
                <div className={`px-4.5 py-3 border-b ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Order Items (Summary)</h4>
                </div>
                <div className={`divide-y ${themeClasses.border.primary}`}>
                  {detailOrder.items?.map((item, idx) => (
                    <div key={idx} className={`p-4 flex items-center justify-between gap-4 text-xs ${themeClasses.bg.primary}`}>
                      <div>
                        <p className={`font-bold ${themeClasses.text.primary}`}>{item.productName}</p>
                        <p className={`text-[10px] font-semibold mt-1 ${themeClasses.text.tertiary}`}>Quantity: {item.quantity} x {money(item.unitPrice)}</p>
                      </div>
                      <p className={`font-black ${themeClasses.text.primary}`}>{money(item.quantity * item.unitPrice)}</p>
                    </div>
                  )) || (
                    <div className={`p-4 text-center text-xs font-bold ${themeClasses.text.tertiary} ${themeClasses.bg.primary}`}>
                      No item entries returned by ledger database.
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdowns card */}
              <div className={`border rounded-xl p-4 space-y-3 ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Financial Ledger Details</h4>
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className={themeClasses.text.tertiary}>Items Subtotal:</span>
                    <span className={themeClasses.text.primary}>{money(detailOrder.itemsSubtotal || detailOrder.grandTotal - 150)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={themeClasses.text.tertiary}>Shipping Delivery Fee:</span>
                    <span className={themeClasses.text.primary}>{money(detailOrder.shippingFee || 150)}</span>
                  </div>
                  {detailOrder.discount > 0 && (
                    <div className="flex justify-between text-red-500 dark:text-red-400">
                      <span>Discount Coupon Applied:</span>
                      <span>-{money(detailOrder.discount)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between border-t pt-2.5 text-sm font-black ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
                    <span>Grand Total Invoice:</span>
                    <span>{money(detailOrder.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Platform Accounting Splits Card */}
              <div className={`border rounded-xl p-4 space-y-3 ${themeClasses.border.accent} ${themeClasses.bg.success}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${themeClasses.text.success}`}>
                  <CreditCard size={12} /> Platform Margin Split (10% Commission Base)
                </h4>
                <div className={`space-y-2 text-xs font-bold ${themeClasses.text.primary}`}>
                  <div className="flex justify-between">
                    <span className={themeClasses.text.success}>Gross to Store Merchant:</span>
                    <span>{money(detailOrder.sellerGrossAmount || (detailOrder.grandTotal * 0.9))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={themeClasses.text.success}>Marketplace Commission Collected:</span>
                    <span>{money(detailOrder.commissionAmount || (detailOrder.grandTotal * 0.1))}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer buttons drawer bottom */}
            <div className={`p-4 border-t flex gap-3 ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
              <button
                onClick={() => {
                  setStatusOrder(detailOrder);
                  setNewStatus(detailOrder.status);
                  setShowStatusModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
              >
                Route State
              </button>
              {detailOrder.status !== 'DELIVERED' && detailOrder.status !== 'CANCELLED' && detailOrder.status !== 'RETURNED' && (
                <button
                  onClick={() => {
                    handleDeliverManually(detailOrder.orderId);
                    setDetailOrder(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                >
                  Deliver Manually
                </button>
              )}
              <button 
                onClick={() => setDetailOrder(null)} 
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-colors cursor-pointer ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} hover:${themeClasses.bg.secondary}`}
              >
                Close File
              </button>
            </div>
          </div>
        )}
      </OrderDrawer>

      {/* Update Status Modal */}
      {showStatusModal && statusOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setShowStatusModal(false)} />
          <div className={`relative rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden border ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className={`flex items-center justify-between px-6 py-4.5 border-b ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
              <h2 className={`font-black text-xs uppercase tracking-wider ${themeClasses.text.primary}`}>Modify Logistics State</h2>
              <button onClick={() => setShowStatusModal(false)} className={`p-2 rounded-xl border transition-colors cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.tertiary} hover:${themeClasses.bg.secondary}`}>
                <X size={15} />
              </button>
            </div>
            
            <div className={`p-6 space-y-4 text-xs font-semibold ${themeClasses.text.secondary}`}>
              <p>
                Update the courier tracking status of order <span className={`font-bold font-mono ${themeClasses.text.primary}`}>#{statusOrder.customOrderId || statusOrder.orderId}</span>:
              </p>

              <div>
                <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${themeClasses.text.tertiary}`}>Select State</label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className={`w-full pl-3.5 pr-8 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                  >
                    {ORDER_STATUS_FLOW.map(st => (
                      <option key={st} value={st}>{nice(st)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className={`absolute right-3.5 top-3 pointer-events-none ${themeClasses.text.tertiary}`} />
                </div>
              </div>

              {newStatus === 'DELIVERED' && (
                <div className={`p-3 rounded-xl leading-relaxed border text-[10px] font-bold ${themeClasses.bg.success} ${themeClasses.border.accent} ${themeClasses.text.success}`}>
                  ⚠️ Marking as DELIVERED triggers commissions calculation for the merchant and logs settlement logs.
                </div>
              )}

              {newStatus === 'CANCELLED' && (
                <div className={`p-3 rounded-xl leading-relaxed border text-[10px] font-bold ${themeClasses.bg.danger} ${themeClasses.border.danger} ${themeClasses.text.danger}`}>
                  ⚠️ Transitioning to CANCELLED voids the checkout amount and releases catalog product reserves.
                </div>
              )}
            </div>

            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
              <button
                onClick={() => setShowStatusModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-colors cursor-pointer ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} hover:${themeClasses.bg.secondary}`}
              >
                Dismiss
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={working === statusOrder.orderId}
                className="px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {working === statusOrder.orderId ? 'Saving...' : 'Apply Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
