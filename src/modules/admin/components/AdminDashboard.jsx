import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileWarning,
  Megaphone,
  Package,
  RefreshCw,
  ShieldAlert,
  ShoppingCart,
  Star,
  Store,
  Tag,
  TrendingUp,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import {
  getAdminAnalytics,
  getAdminCommissions,
  getAdminDisputes,
  getAdminOrders,
  getAdminPayments,
  getAdminProducts,
  getAdminRefunds,
  getAdminReports,
  getAdminSellers,
  getAdminUsers,
  getPendingSellerApplications,
} from '../services/adminService';

const EMPTY_DATA = {
  analytics: {},
  orders: [],
  users: [],
  sellers: [],
  products: [],
  payments: [],
  commissions: [],
  refunds: [],
  disputes: [],
  productReports: [],
  sellerReports: [],
  customerReports: [],
  applications: [],
};

const listFrom = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const countFrom = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value?.totalElements === 'number') return value.totalElements;
  return listFrom(value).length;
};

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;
const nice = (value) => String(value || 'N/A').replaceAll('_', ' ');
const dateLabel = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const sumBy = (items, getter) =>
  items.reduce((total, item) => total + Number(getter(item) || 0), 0);

const statusCount = (items, statuses) => {
  const wanted = new Set(statuses);
  return items.filter((item) => wanted.has(String(item.status || item.state || '').toUpperCase())).length;
};

const safePercent = (value, total) => {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(value || 0) / total) * 100)));
};

function StatCard({ icon: Icon, label, value, subtext, tone = 'emerald', themeClasses }) {
  const tones = {
    indigo: themeClasses.status.info,
    emerald: themeClasses.status.success,
    amber: themeClasses.status.warning,
    red: themeClasses.status.danger,
    violet: themeClasses.status.info,
    sky: themeClasses.status.info,
  };

  return (
    <div className={`rounded-lg border p-3 shadow-sm ${themeClasses.card}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-[9px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>{label}</p>
          <p className={`mt-1 text-lg font-black ${themeClasses.text.primary}`}>{value}</p>
          {subtext && <p className={`mt-0.5 text-[10px] font-bold ${themeClasses.text.secondary}`}>{subtext}</p>}
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${tones[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
    </div>
  );
}

function Panel({ title, action, children, themeClasses }) {
  return (
    <section className={`rounded-lg border shadow-sm ${themeClasses.card}`}>
      <div className={`flex items-center justify-between gap-2 border-b px-3 py-2.5 ${themeClasses.border.primary}`}>
        <h2 className={`text-xs font-black uppercase tracking-wider ${themeClasses.text.primary}`}>{title}</h2>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Empty({ text, themeClasses }) {
  return (
    <div className={`rounded-lg border border-dashed px-3 py-4 text-center text-xs font-bold ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.secondary}`}>
      {text}
    </div>
  );
}

function Row({ title, meta, status, amount, to, themeClasses }) {
  const body = (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} hover:${themeClasses.border.accent}`}>
      <div className="min-w-0">
        <p className={`truncate text-xs font-bold ${themeClasses.text.primary}`}>{title}</p>
        {meta && <p className={`mt-0.5 truncate text-[10px] font-bold ${themeClasses.text.secondary}`}>{meta}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {amount && <span className={`text-[10px] font-black ${themeClasses.text.primary}`}>{amount}</span>}
        {status && <StatusBadge value={status} themeClasses={themeClasses} />}
      </div>
    </div>
  );

  return to ? <Link to={to}>{body}</Link> : body;
}

function StatusBadge({ value, themeClasses }) {
  const normalized = String(value || 'N/A').toUpperCase();
  
  const statusMap = {
    'DELIVERED': themeClasses.status.success,
    'COMPLETED': themeClasses.status.success,
    'PAID': themeClasses.status.success,
    'SUCCESS': themeClasses.status.success,
    'REFUNDED': themeClasses.status.success,
    'PARTIALLY_REFUNDED': themeClasses.status.success,
    'PENDING': themeClasses.status.warning,
    'PROCESSING': themeClasses.status.info,
    'PROCESSING_REFUND': themeClasses.status.info,
    'UNDER_REVIEW': themeClasses.status.info,
    'REQUESTED': themeClasses.status.warning,
    'WAITING_FOR_CUSTOMER': themeClasses.status.warning,
    'WAITING_FOR_RETURN': themeClasses.status.warning,
    'ESCALATED': themeClasses.status.warning,
    'ESCALATED_TO_DISPUTE': themeClasses.status.warning,
    'FAILED': themeClasses.status.danger,
    'REJECTED': themeClasses.status.danger,
    'CANCELLED': themeClasses.status.danger,
  };

  const tone = statusMap[normalized] || themeClasses.status.pending;

  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${tone}`}>
      {nice(normalized)}
    </span>
  );
}

function BarChart({ data, valueKey = 'value', labelKey = 'label', moneyValues = false, themeClasses }) {
  const max = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => {
        const value = Number(item[valueKey] || 0);
        return (
          <div key={item[labelKey]} className="grid grid-cols-[74px_1fr_92px] items-center gap-3">
            <span className={`truncate text-xs font-black uppercase ${themeClasses.text.tertiary}`}>{item[labelKey]}</span>
            <div className={`h-2 rounded-full ${themeClasses.bg.tertiary}`}>
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${Math.max(4, Math.round((value / max) * 100))}%` }}
              />
            </div>
            <span className={`text-right text-xs font-black ${themeClasses.text.primary}`}>
              {moneyValues ? money(value) : value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function QueueTile({ icon: Icon, label, value, to, tone = 'emerald', themeClasses }) {
  const tones = {
    amber: themeClasses.status.warning,
    violet: themeClasses.status.warning,
    red: themeClasses.status.danger,
    emerald: themeClasses.status.success,
  };

  return (
    <Link to={to} className={`rounded-lg border p-2.5 transition-colors ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <Icon size={15} />
        <ArrowRight size={12} />
      </div>
      <p className={`mt-2 text-lg font-black ${themeClasses.text.primary}`}>{value}</p>
      <p className={`mt-0.5 text-[9px] font-black uppercase tracking-widest opacity-80 ${themeClasses.text.secondary}`}>{label}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    const requests = {
      analytics: getAdminAnalytics,
      orders: getAdminOrders,
      users: getAdminUsers,
      sellers: getAdminSellers,
      products: () => getAdminProducts(0, 50),
      payments: getAdminPayments,
      commissions: getAdminCommissions,
      refunds: () => getAdminRefunds(),
      disputes: () => getAdminDisputes(),
      productReports: () => getAdminReports('PRODUCT'),
      sellerReports: () => getAdminReports('SELLER'),
      customerReports: () => getAdminReports('CUSTOMER'),
      applications: getPendingSellerApplications,
    };

    const results = await Promise.all(
      Object.entries(requests).map(async ([key, request]) => {
        try {
          const response = await request();
          return [key, response.data];
        } catch (requestError) {
          console.error(`Failed to load admin dashboard ${key}`, requestError);
          return [key, EMPTY_DATA[key]];
        }
      })
    );

    setData((current) => ({ ...current, ...Object.fromEntries(results) }));
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard().catch((loadError) => {
      console.error('Failed to load admin dashboard', loadError);
      setError('Unable to load dashboard data right now.');
      setLoading(false);
    });
  }, [fetchDashboard]);

  const dashboard = useMemo(() => {
    const analytics = data.analytics || {};
    const orders = listFrom(data.orders);
    const users = listFrom(data.users);
    const sellers = listFrom(data.sellers);
    const products = listFrom(data.products);
    const payments = listFrom(data.payments);
    const commissions = listFrom(data.commissions);
    const refunds = listFrom(data.refunds);
    const disputes = listFrom(data.disputes);
    const applications = listFrom(data.applications);
    const reports = [
      ...listFrom(data.productReports).map((item) => ({ ...item, reportType: 'Product' })),
      ...listFrom(data.sellerReports).map((item) => ({ ...item, reportType: 'Seller' })),
      ...listFrom(data.customerReports).map((item) => ({ ...item, reportType: 'Customer' })),
    ];

    const dailyOrders = Object.entries(analytics.dailyOrders || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([label, value]) => ({ label: label.slice(5), value: Number(value || 0) }));

    const monthlyRevenue = Object.entries(analytics.monthlyRevenue || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([label, value]) => ({ label, value: Number(value || 0) }));

    const successfulPayments = payments.filter((payment) =>
      ['SUCCESS', 'COMPLETED', 'PAID'].includes(String(payment.state || payment.status || '').toUpperCase())
    );
    const paymentVolume = sumBy(successfulPayments, (payment) => payment.amount || payment.totalAmount);
    const refundExposure = sumBy(refunds, (refund) => refund.refundAmount || refund.totalAmount);
    const commissionDue = sumBy(commissions, (commission) =>
      commission.commissionAmount || commission.amount || commission.marketplaceCommission
    );

    return {
      analytics,
      orders,
      users,
      sellers,
      products,
      payments,
      commissions,
      refunds,
      disputes,
      applications,
      reports,
      dailyOrders,
      monthlyRevenue,
      paymentVolume,
      refundExposure,
      commissionDue,
      pendingOrders: statusCount(orders, ['PENDING', 'PROCESSING', 'CONFIRMED']),
      deliveredOrders: statusCount(orders, ['DELIVERED', 'COMPLETED']),
      failedOrders: statusCount(orders, ['CANCELLED', 'FAILED', 'RETURNED']),
      openRefunds: statusCount(refunds, ['REQUESTED', 'VIEWED', 'UNDER_REVIEW', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_RETURN', 'RETURN_IN_TRANSIT', 'RETURN_RECEIVED', 'APPROVED', 'PROCESSING_REFUND', 'ESCALATED_TO_DISPUTE', 'ESCALATED']),
      escalatedRefunds: statusCount(refunds, ['ESCALATED_TO_DISPUTE', 'ESCALATED']),
      openDisputes: statusCount(disputes, ['OPEN', 'PENDING', 'UNDER_REVIEW', 'ESCALATED']),
      openReports: reports.filter((report) => !['RESOLVED', 'REJECTED', 'CLOSED'].includes(String(report.status || '').toUpperCase())).length,
    };
  }, [data]);

  const quickLinks = [
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Commissions', path: '/admin/commissions', icon: DollarSign },
    { label: 'Campaigns', path: '/admin/campaigns', icon: Megaphone },
    { label: 'Reports', path: '/admin/reports', icon: FileWarning },
    { label: 'Refunds', path: '/admin/refunds', icon: RefreshCw },
    { label: 'Disputes', path: '/admin/disputes', icon: ShieldAlert },
    { label: 'Banners', path: '/admin/banners', icon: Boxes },
    { label: 'Promos', path: '/admin/promos', icon: Tag },
    { label: 'Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Sellers', path: '/admin/sellers', icon: Store },
  ];

  const fulfillmentTotal = Math.max(dashboard.orders.length, 1);
  const recentOrders = dashboard.orders.slice(0, 6);
  const recentPayments = dashboard.payments.slice(0, 5);
  const activeRefunds = dashboard.refunds
    .filter((refund) => !['REFUNDED', 'PARTIALLY_REFUNDED', 'REJECTED', 'CANCELLED'].includes(String(refund.status || '').toUpperCase()))
    .slice(0, 5);
  const activeReports = dashboard.reports.slice(0, 5);

  return (
    <AdminLayout
      pageTitle="Admin Dashboard"
      pageSubtitle="Live platform operations, finance queues, marketplace health, and moderation workload."
      notifications={dashboard.openReports + dashboard.escalatedRefunds + dashboard.openDisputes}
      headerActions={
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black uppercase transition-colors ${themeClasses.button.secondary}`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div key={darkMode} className={`mx-auto max-w-7xl space-y-3 p-2 lg:p-3 ${themeClasses.bg.secondary}`}>
        {error && (
          <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${themeClasses.status.danger}`}>
            {error}
          </div>
        )}

        <section className={`rounded-lg border p-3 shadow-sm ${themeClasses.card}`}>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.accent}`}>Control Center</p>
              <h1 className={`mt-1 text-2xl font-black ${themeClasses.text.primary}`}>Marketplace Operations</h1>
              <p className={`mt-1 text-sm font-bold ${themeClasses.text.secondary}`}>
                {lastUpdated ? `Last synced ${lastUpdated.toLocaleTimeString()}` : 'Syncing live backend metrics...'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
              <QueueTile icon={AlertTriangle} label="Reports" value={dashboard.openReports} to="/admin/reports" tone="amber" themeClasses={themeClasses} />
              <QueueTile icon={ShieldAlert} label="Disputes" value={dashboard.openDisputes} to="/admin/disputes" tone="violet" themeClasses={themeClasses} />
              <QueueTile icon={RefreshCw} label="Refunds" value={dashboard.openRefunds} to="/admin/refunds" tone="amber" themeClasses={themeClasses} />
              <QueueTile icon={Store} label="Seller Apps" value={dashboard.applications.length} to="/admin/sellers" tone="emerald" themeClasses={themeClasses} />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={WalletCards} label="Gross Revenue" value={money(dashboard.analytics.totalRevenue)} subtext="Delivered order revenue" tone="emerald" themeClasses={themeClasses} />
          <StatCard icon={DollarSign} label="Platform Income" value={money(dashboard.analytics.platformIncome)} subtext={`Commission due ${money(dashboard.commissionDue)}`} tone="emerald" themeClasses={themeClasses} />
          <StatCard icon={ShoppingCart} label="Orders" value={dashboard.analytics.totalOrders ?? countFrom(data.orders)} subtext={`${dashboard.pendingOrders} need action`} tone="emerald" themeClasses={themeClasses} />
          <StatCard icon={CreditCard} label="Payment Volume" value={money(dashboard.paymentVolume)} subtext={`${dashboard.payments.length} payment records`} tone="emerald" themeClasses={themeClasses} />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Customers" value={dashboard.analytics.totalUsers ?? dashboard.users.length} subtext={`${dashboard.users.length} loaded`} tone="amber" themeClasses={themeClasses} />
          <StatCard icon={Store} label="Sellers" value={dashboard.analytics.totalSellers ?? dashboard.sellers.length} subtext={`${dashboard.applications.length} pending applications`} tone="red" themeClasses={themeClasses} />
          <StatCard icon={Package} label="Products" value={dashboard.analytics.totalProducts ?? countFrom(data.products)} subtext={`${dashboard.products.length} loaded`} tone="indigo" themeClasses={themeClasses} />
          <StatCard icon={RefreshCw} label="Refund Exposure" value={money(dashboard.refundExposure)} subtext={`${dashboard.escalatedRefunds} escalated`} tone="sky" themeClasses={themeClasses} />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel title="Revenue Trend" action={<Link className={`text-xs font-black ${themeClasses.text.accent}`} to="/admin/payments">Payments</Link>} themeClasses={themeClasses}>
            {dashboard.monthlyRevenue.length ? (
              <BarChart data={dashboard.monthlyRevenue} moneyValues themeClasses={themeClasses} />
            ) : (
              <Empty text={loading ? 'Loading revenue trend...' : 'No monthly revenue data available.'} themeClasses={themeClasses} />
            )}
          </Panel>

          <Panel title="Fulfillment Health" action={<Link className={`text-xs font-black ${themeClasses.text.accent}`} to="/admin/orders">Orders</Link>} themeClasses={themeClasses}>
            <div className="space-y-2">
              {[
                { label: 'Delivered', value: dashboard.deliveredOrders, icon: CheckCircle, tone: 'bg-emerald-500' },
                { label: 'Pending', value: dashboard.pendingOrders, icon: Clock, tone: 'bg-amber-500' },
                { label: 'Failed', value: dashboard.failedOrders, icon: XCircle, tone: 'bg-red-500' },
              ].map(({ label, value, icon: Icon, tone }) => (
                <div key={label}>
                  <div className={`mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>
                    <span className="flex items-center gap-2"><Icon size={14} /> {label}</span>
                    <span>{value}</span>
                  </div>
                  <div className={`h-2 rounded-full ${themeClasses.bg.tertiary}`}>
                    <div className={`h-2 rounded-full ${tone}`} style={{ width: `${safePercent(value, fulfillmentTotal)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Panel title="Daily Orders" action={<Link className={`text-xs font-black ${themeClasses.text.accent}`} to="/admin/orders">View all</Link>} themeClasses={themeClasses}>
            {dashboard.dailyOrders.length ? <BarChart data={dashboard.dailyOrders} themeClasses={themeClasses} /> : <Empty text={loading ? 'Loading daily orders...' : 'No order trend data available.'} themeClasses={themeClasses} />}
          </Panel>

          <Panel title="Recent Payments" action={<Link className={`text-xs font-black ${themeClasses.text.accent}`} to="/admin/payments">View all</Link>} themeClasses={themeClasses}>
            {recentPayments.length ? (
              <div className="space-y-2">
                {recentPayments.map((payment) => (
                  <Row
                    key={payment.paymentId || payment.id || payment.transactionUuid}
                    title={payment.transactionUuid || payment.providerReferenceId || `Payment #${payment.paymentId || payment.id}`}
                    meta={`${payment.customerName || payment.customerEmail || 'Customer'} - ${dateLabel(payment.completedAt || payment.createdAt)}`}
                    status={payment.state || payment.status}
                    amount={money(payment.amount)}
                    themeClasses={themeClasses}
                  />
                ))}
              </div>
            ) : (
              <Empty text={loading ? 'Loading payments...' : 'No payment records found.'} themeClasses={themeClasses} />
            )}
          </Panel>

          <Panel title="Quick Actions" themeClasses={themeClasses}>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map(({ label, path, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.secondary}`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Panel title="Recent Orders" action={<Link className={`text-xs font-black ${themeClasses.text.accent}`} to="/admin/orders">View all</Link>} themeClasses={themeClasses}>
            {recentOrders.length ? (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Row
                    key={order.orderId || order.id || order.customOrderId}
                    title={order.customOrderId || `Order #${order.orderId || order.id}`}
                    meta={`${order.customerName || order.userName || order.customerEmail || 'Customer'} - ${dateLabel(order.createdAt)}`}
                    status={order.status}
                    amount={money(order.grandTotal || order.totalAmount)}
                    themeClasses={themeClasses}
                  />
                ))}
              </div>
            ) : (
              <Empty text={loading ? 'Loading orders...' : 'No recent orders found.'} themeClasses={themeClasses} />
            )}
          </Panel>

          <Panel title="Refund Queue" action={<Link className={`text-xs font-black ${themeClasses.text.accent}`} to="/admin/refunds">View all</Link>} themeClasses={themeClasses}>
            {activeRefunds.length ? (
              <div className="space-y-3">
                {activeRefunds.map((refund) => (
                  <Row
                    key={refund.id}
                    title={refund.publicReferenceId || `Refund #${refund.id}`}
                    meta={`Order #${refund.customOrderId || refund.orderId || 'N/A'} - ${dateLabel(refund.createdAt)}`}
                    status={refund.status}
                    amount={money(refund.refundAmount || refund.totalAmount)}
                    themeClasses={themeClasses}
                  />
                ))}
              </div>
            ) : (
              <Empty text={loading ? 'Loading refunds...' : 'No active refunds found.'} themeClasses={themeClasses} />
            )}
          </Panel>

          <Panel title="Moderation Queue" action={<Link className={`text-xs font-black ${themeClasses.text.accent}`} to="/admin/reports">View all</Link>} themeClasses={themeClasses}>
            {activeReports.length ? (
              <div className="space-y-3">
                {activeReports.map((report) => (
                  <Row
                    key={`${report.reportType}-${report.id || report.reportId}`}
                    title={report.publicReferenceId || `${report.reportType} report #${report.id || report.reportId}`}
                    meta={report.reason || report.details || 'Report needs review'}
                    status={report.status}
                    themeClasses={themeClasses}
                  />
                ))}
              </div>
            ) : (
              <Empty text={loading ? 'Loading reports...' : 'No moderation reports found.'} themeClasses={themeClasses} />
            )}
          </Panel>
        </div>

        <Panel title="Marketplace Snapshot" action={<TrendingUp size={16} className={themeClasses.text.accent} />} themeClasses={themeClasses}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className={`rounded-lg border p-4 ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Seller Coverage</p>
              <p className={`mt-2 text-xl font-black ${themeClasses.text.primary}`}>{dashboard.sellers.length} active records</p>
              <p className={`mt-1 text-xs font-bold ${themeClasses.text.secondary}`}>{dashboard.applications.length} applications pending review</p>
            </div>
            <div className={`rounded-lg border p-4 ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Finance Control</p>
              <p className={`mt-2 text-xl font-black ${themeClasses.text.primary}`}>{dashboard.commissions.length} commission rows</p>
              <p className={`mt-1 text-xs font-bold ${themeClasses.text.secondary}`}>{money(dashboard.commissionDue)} estimated commission amount</p>
            </div>
            <div className={`rounded-lg border p-4 ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Customer Risk Workload</p>
              <p className={`mt-2 text-xl font-black ${themeClasses.text.primary}`}>{dashboard.openDisputes + dashboard.openRefunds} open cases</p>
              <p className={`mt-1 text-xs font-bold ${themeClasses.text.secondary}`}>Refunds, disputes, and escalations needing action</p>
            </div>
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
