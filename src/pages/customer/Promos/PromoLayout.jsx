import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../../../components/layout/Footer/Footer';

export default function PromoLayout() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 overflow-x-hidden">
      <Outlet />
      <Footer />
    </div>
  );
}
