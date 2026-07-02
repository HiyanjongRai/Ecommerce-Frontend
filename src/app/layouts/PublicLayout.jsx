import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../../shared/components/Navbar/Navbar';

export default function PublicLayout() {
  const location = useLocation();
  const isHomePage = ['/', '/home-classic', '/showcase', '/category'].includes(location.pathname);

  return (
    <>
      {!isHomePage && <Navbar />}
      <Outlet />
    </>
  );
}
