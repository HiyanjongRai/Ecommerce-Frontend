import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Homepage from '../pages/customer/Home/Home';
import CustomerLayout from '../components/layout/CustomerLayout/CustomerLayout';
import ProductDetails from '../pages/customer/ProductDetails/ProductDetails';
import SellerLayout from '../components/layout/SellerLayout/SellerLayout';
import SellerPublicProfile from '../pages/customer/Sellers/SellerPublicProfile';
import TopSellers from '../pages/customer/Sellers/TopSellers';
import PaymentSuccess from '../pages/customer/Payment/PaymentSuccess';
import PaymentFailure from '../pages/customer/Payment/PaymentFailure';
import GoogleAuthCallback from '../pages/customer/Auth/GoogleAuthCallback';
import SellerRegistration from '../pages/seller/Register/SellerRegistration';
import CourierLogin from '../pages/courier/Login/CourierLogin';
import CourierDashboard from '../pages/courier/Dashboard/CourierDashboard';
import PromoCenter from '../pages/customer/Promos/PromoCenter';
import CampaignCenter from '../pages/customer/Promos/CampaignCenter';
import PromoLayout from '../pages/customer/Promos/PromoLayout';
import ProductListing from '../pages/customer/Products/ProductListing';
import PublicLayout from '../components/layout/PublicLayout/PublicLayout';
import AdminDashboard from '../pages/admin/Dashboard/Dashboard';
import AdminUsers from '../pages/admin/Users/Users';
import AdminSellers from '../pages/admin/Sellers/Sellers';
import AdminProducts from '../pages/admin/Products/Products';
import AdminOrders from '../pages/admin/Orders/Orders';
import AdminPayments from '../pages/admin/Payments/Payments';
import AdminReviews from '../pages/admin/Reviews/Reviews';
import AdminBanners from '../pages/admin/Banners/Banners';
import AdminCampaigns from '../pages/admin/Campaigns/Campaigns';
import AdminCampaignDetail from '../pages/admin/CampaignDetail/CampaignDetail';
import AdminCommissions from '../pages/admin/Commissions/Commissions';
import AdminPromos from '../pages/admin/Promos/Promos';
import AdminReports from '../pages/admin/Reports/Reports';
import AdminDisputes from '../pages/admin/Disputes/Disputes';
import AdminAuditLogs from '../pages/admin/AuditLogs/AuditLogs';
import AdminInbox from '../pages/admin/Inbox/Inbox';
import AdminSettings from '../pages/admin/Settings/Settings';
import { CustomerProvider } from '../context/CustomerContext';
import StatusPage from '../components/common/StatusPage/StatusPage';
import { RequireCustomerAuth, RequireCourierAuth } from './PrivateRoute';

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
        {/* Google OAuth 2.0 callback GÇö must be outside PublicLayout (no navbar/footer) */}
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
