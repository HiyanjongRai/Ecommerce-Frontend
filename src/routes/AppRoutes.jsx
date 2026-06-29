import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Homepage from '../modules/home/Home';
import CustomerLayout from '../modules/customer/CustomerLayout';
import ProductDetails from '../modules/product/ProductDetails';
import SellerLayout from '../modules/seller/SellerLayout';
import SellerPublicProfile from '../modules/seller/SellerPublicProfile';
import TopSellers from '../modules/seller/TopSellers';
import PaymentSuccess from '../features/payment/PaymentSuccess';
import PaymentFailure from '../features/payment/PaymentFailure';
import GoogleAuthCallback from '../modules/auth/GoogleAuthCallback';
import SellerRegistration from '../components/SellerRegistration/SellerRegistration';
import CourierLogin from '../features/courier/CourierLogin';
import CourierDashboard from '../features/courier/CourierDashboard';
import PromoCenter from '../modules/promo/PromoCenter';
import CampaignCenter from '../modules/promo/CampaignCenter';
import PromoLayout from '../modules/promo/PromoLayout';
import ProductListing from '../modules/product/pages/ProductListing';
import PublicLayout from '../shared/layouts/PublicLayout';
import AdminDashboard from '../modules/admin/components/AdminDashboard';
import AdminUsers from '../modules/admin/components/AdminUsers';
import AdminSellers from '../modules/admin/components/AdminSellers';
import AdminProducts from '../modules/admin/components/AdminProducts';
import AdminOrders from '../modules/admin/components/AdminOrders';
import AdminPayments from '../modules/admin/components/AdminPayments';
import AdminReviews from '../modules/admin/components/AdminReviews';
import AdminBanners from '../modules/admin/components/AdminBanners';
import AdminCampaigns from '../modules/admin/components/AdminCampaigns';
import AdminCampaignDetail from '../modules/admin/components/AdminCampaignDetail';
import AdminCommissions from '../modules/admin/components/AdminCommissions';
import AdminPromos from '../modules/admin/components/AdminPromos';
import AdminReports from '../modules/admin/components/AdminReports';
import AdminDisputes from '../modules/admin/components/AdminDisputes';
import AdminAuditLogs from '../modules/admin/components/AdminAuditLogs';
import AdminInbox from '../modules/admin/components/AdminInbox';
import AdminSettings from '../modules/admin/components/AdminSettings';
import { CustomerProvider } from '../modules/customer/contexts/CustomerContext';
import StatusPage from '../shared/components/StatusPage';
import { RequireCustomerAuth, RequireCourierAuth } from '../shared/components/RouteGuards';

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
