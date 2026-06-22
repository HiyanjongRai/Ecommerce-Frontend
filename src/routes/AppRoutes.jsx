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
import PromoLandingPage from '../modules/promo/PromoLandingPage';
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
        <Route path="/customer/*" element={<CustomerLayout />} />
        <Route path="/seller/register" element={<SellerRegistration />} />
        <Route path="/seller/*" element={<SellerLayout />} />
        <Route path="/seller-profile/:id" element={<SellerPublicProfile />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/courier/login" element={<CourierLogin />} />
        <Route path="/courier/dashboard" element={<CourierDashboard />} />
        {/* Google OAuth 2.0 callback — must be outside PublicLayout (no navbar/footer) */}
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/sellers" element={<AdminSellers />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/banners" element={<AdminBanners />} />
        <Route path="/admin/campaigns" element={<AdminCampaigns />} />
        <Route path="/admin/campaigns/:campaignId" element={<AdminCampaignDetail />} />
        <Route path="/admin/commissions" element={<AdminCommissions />} />
        <Route path="/admin/promos" element={<AdminPromos />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        <Route path="/admin/inbox" element={<AdminInbox />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
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
