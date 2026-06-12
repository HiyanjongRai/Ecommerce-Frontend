import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../../shared/components/Footer/Footer';

export default function PromoLayout() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#111] overflow-x-hidden">
      <Outlet />
      <Footer />
    </div>
  );
}
