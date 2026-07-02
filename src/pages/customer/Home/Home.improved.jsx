import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar/Navbar';
import Footer from '../../../components/layout/Footer/Footer';

// Section Components
import HeroSection from './sections/HeroSection';
import ShopByCategory from './sections/ShopByCategory';
import PopularCollections from './sections/PopularCollections';
import FlashDeals from './sections/FlashDeals';
import FeaturedProducts from './sections/FeaturedProducts';
import PromoBanners from './sections/PromoBanners';
import BestSellersAndNewArrivals from './sections/BestSellersAndNewArrivals';
import ShopByBrand from './sections/ShopByBrand';
import RecommendedProducts from './sections/RecommendedProducts';
import Testimonials from './sections/Testimonials';
import NewsletterSection from './sections/NewsletterSection';
import TrustFeatures from './sections/TrustFeatures';

// Hooks
import useHomepageData from '../../../hooks/useHomePageData';
import useFlashCountdown from '../../../hooks/useFlashCountdown';
import useNewsletterSubscribe from '../../../hooks/useNewsletterSubscribe';

// Utils
import { ErrorBoundary } from '../../../components/common/ErrorBoundary/ErrorBoundary';

/**
 * Home Component - Main e-commerce homepage
 * Composition of multiple sections with independent loading states
 * Each section is responsible for its own data fetching and error handling
 */
export default function Home() {
  const location = useLocation();
  const flashTimeLeft = useFlashCountdown();
  const { subscribed, handleSubscribe } = useNewsletterSubscribe();

  // Set body background on mount and cleanup on unmount
  useLayoutEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#ffffff';
    window.scrollTo(0, 0);
    
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-inter">
      <Navbar />

      <main>
        {/* Hero Section with Category Sidebar & Promo Cards */}
        <ErrorBoundary fallback={<HeroSectionFallback />}>
          <HeroSection />
        </ErrorBoundary>

        {/* Shop by Category */}
        <ErrorBoundary>
          <ShopByCategory />
        </ErrorBoundary>

        {/* Popular Collections */}
        <ErrorBoundary>
          <PopularCollections />
        </ErrorBoundary>

        {/* Flash Deals with Countdown Timer */}
        <ErrorBoundary>
          <FlashDeals timeLeft={flashTimeLeft} />
        </ErrorBoundary>

        {/* Featured Products */}
        <ErrorBoundary>
          <FeaturedProducts />
        </ErrorBoundary>

        {/* Promotional Banners */}
        <ErrorBoundary>
          <PromoBanners />
        </ErrorBoundary>

        {/* Best Sellers & New Arrivals (Side by Side) */}
        <ErrorBoundary>
          <BestSellersAndNewArrivals />
        </ErrorBoundary>

        {/* Shop by Brand */}
        <ErrorBoundary>
          <ShopByBrand />
        </ErrorBoundary>

        {/* Recommended for You */}
        <ErrorBoundary>
          <RecommendedProducts />
        </ErrorBoundary>

        {/* Testimonials / Reviews */}
        <ErrorBoundary>
          <Testimonials />
        </ErrorBoundary>

        {/* Newsletter Subscription */}
        <ErrorBoundary>
          <NewsletterSection subscribed={subscribed} onSubscribe={handleSubscribe} />
        </ErrorBoundary>

        {/* Trust & Features Bar */}
        <ErrorBoundary>
          <TrustFeatures />
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}

// Fallback for hero section error
function HeroSectionFallback() {
  return (
    <section className="h-96 bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Unable to load hero section</p>
      </div>
    </section>
  );
}
