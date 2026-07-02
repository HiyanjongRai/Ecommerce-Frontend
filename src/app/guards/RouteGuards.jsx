import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomer } from '../../features/customer/contexts/CustomerContext';
import { getCourierInfo, getCourierToken } from '../../features/courier/api/courierApi';

const GuardShell = ({ title, subtitle }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      <h1 className="text-lg font-black text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  </div>
);

export const RequireCustomerAuth = ({
  children,
  redirectTo = '/',
  forbiddenTo = '/403',
  allowedRoles,
  loadingTitle = 'Checking access...',
  loadingSubtitle = 'Please wait while we verify your account.',
}) => {
  const { user, loading } = useCustomer();
  const location = useLocation();

  if (loading) {
    return <GuardShell title={loadingTitle} subtitle={loadingSubtitle} />;
  }

  if (!user?.id) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = String(user.role || user.roles?.[0] || '').toUpperCase();
    if (!allowedRoles.includes(currentRole)) {
      return <Navigate to={forbiddenTo} replace />;
    }
  }

  return children;
};

export const RequireCourierAuth = ({
  children,
  redirectTo = '/courier/login',
}) => {
  const location = useLocation();
  const token = getCourierToken();
  const info = getCourierInfo();

  if (!token || !info?.id) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
};
