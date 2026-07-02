import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Homepage from '../../features/homepage/pages/Home';
import CustomerLayout from '../layouts/CustomerLayout';
import ProductDetails from '../../features/product/pages/ProductDetails';
import SellerLayout from '../layouts/SellerLayout';
import SellerPublicProfile from '../../features/seller/pages/PublicProfile';
import TopSellers from '../../features/seller/pages/TopSellers';
import PaymentSuccess from '../../features/payment/pages/PaymentSuccess';
import PaymentFailure from '../../features/payment/pages/PaymentFailure';
import GoogleAuthCallback from '../../features/auth/pages/GoogleAuthCallback';
import SellerRegistration from '../../features/seller/components/registration/SellerRegistration';
import CourierLogin from '../../features/courier/pages/CourierLogin';
import CourierDashboard from '../../features/courier/pages/CourierDashboard';
import PromoCenter from '../../features/promotions/pages/PromoCenter';
import CampaignCenter from '../../features/promotions/pages/CampaignCenter';
import PromoLayout from '../../features/promotions/pages/PromoLayout';
import ProductListing from '../../features/product/pages/ProductListing';
import PublicLayout from '../layouts/PublicLayout';
import AdminDashboard from '../../features/admin/pages/Dashboard';
import AdminUsers from '../../features/admin/pages/Users';
import AdminSellers from '../../features/admin/pages/Sellers';
import AdminProducts from '../../features/admin/pages/Products';
import AdminOrders from '../../features/admin/pages/Orders';
import AdminPayments from '../../features/admin/pages/Payments';
import AdminReviews from '../../features/admin/pages/Reviews';
import AdminBanners from '../../features/admin/pages/Banners';
import AdminCampaigns from '../../features/admin/pages/Campaigns';
import AdminCampaignDetail from '../../features/admin/pages/CampaignDetail';
import AdminCommissions from '../../features/admin/pages/Commissions';
import AdminPromos from '../../features/admin/pages/Promos';
import AdminReports from '../../features/admin/pages/Reports';
import AdminDisputes from '../../features/admin/pages/Disputes';
import AdminAuditLogs from '../../features/admin/pages/AuditLogs';
import AdminInbox from '../../features/admin/pages/Inbox';
import AdminSettings from '../../features/admin/pages/Settings';
import { CustomerProvider } from '../../features/customer/contexts/CustomerContext';
import StatusPage from '../../shared/components/ErrorState/StatusPage';
import { RequireCustomerAuth, RequireCourierAuth } from '../guards/RouteGuards';

export default function AppRoutes() {
  return (
    <CustomerProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/home-classic" element={<Homepage />} />
          <Route path="/showcase" element={<Homepage />} />
          <Route path="/category" element={<Homepage />} />
          <Route path="/register" element={<SellerRegistration />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/product-list" element={<ProductListing />} />
          <Route path="/top-sellers" element={<TopSellers />} />
          <Route path="/promo" element={<PromoLayout />}>
            <Route index element={<PromoCenter />} />
            <Route path="center" element={<PromoCenter />} />
            <Route path="landing" element={<CampaignCenter />} />
            <Route path="campaign" element={<CampaignCenter />} />
          </Route>
        </Route>
        <Route
          path="/customer/*"
          element={(
            <RequireCustomerAuth allowedRoles={['CUSTOMER']} redirectTo="/" forbiddenTo="/403">
              <CustomerLayout />
            </RequireCustomerAuth>
          )}
        />
        <Route path="/seller/register" element={<SellerRegistration />} />
        <Route
          path="/seller/*"
          element={(
            <RequireCustomerAuth redirectTo="/seller/register">
              <SellerLayout />
            </RequireCustomerAuth>
          )}
        />
        <Route path="/seller-profile/:id" element={<SellerPublicProfile />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/courier/login" element={<CourierLogin />} />
        <Route
          path="/courier/dashboard"
          element={(
            <RequireCourierAuth>
              <CourierDashboard />
            </RequireCourierAuth>
          )}
        />
        {/* Google OAuth 2.0 callback ΓÇö must be outside PublicLayout (no navbar/footer) */}
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminDashboard />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/users"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminUsers />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/sellers"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminSellers />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/products"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminProducts />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/orders"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminOrders />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/payments"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminPayments />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/reviews"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminReviews />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/banners"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminBanners />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/campaigns"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminCampaigns />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/campaigns/:campaignId"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminCampaignDetail />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/commissions"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminCommissions />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/promos"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminPromos />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/reports"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminReports />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/disputes"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminDisputes />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/audit-logs"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminAuditLogs />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/inbox"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminInbox />
            </RequireCustomerAuth>
          )}
        />
        <Route
          path="/admin/settings"
          element={(
            <RequireCustomerAuth allowedRoles={['ADMIN']} redirectTo="/" forbiddenTo="/403">
              <AdminSettings />
            </RequireCustomerAuth>
          )}
        />
        <Route path="/401" element={<StatusPage code="401" />} />
        <Route path="/403" element={<StatusPage code="403" />} />
        <Route path="/404" element={<StatusPage code="404" />} />
        <Route path="/500" element={<StatusPage code="500" />} />
        <Route path="/offline" element={<StatusPage code="offline" />} />
        <Route path="*" element={<StatusPage code="404" />} />
      </Routes>
    </CustomerProvider>
  );
}
