import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../../shared/components/Navbar/Navbar';
import Footer from '../../../shared/components/Footer/Footer';

// Section Components
import HeroSection from '../components/HeroSection';
import ShopByCategory from '../sections/ShopByCategory';
import PopularCollections from '../sections/PopularCollections';
import FlashDeals from '../components/FlashDeals';
import FeaturedProducts from '../sections/FeaturedProducts';
import PromoBanners from '../sections/PromoBanners';
import BestSellersAndNewArrivals from '../sections/BestSellersAndNewArrivals';
import ShopByBrand from '../sections/ShopByBrand';
import RecommendedProducts from '../sections/RecommendedProducts';
import Testimonials from '../sections/Testimonials';
import NewsletterSection from '../sections/NewsletterSection';
import TrustFeatures from '../sections/TrustFeatures';

// Hooks
import useHomepageData from '../hooks/useHomepageData';
import useFlashCountdown from '../hooks/useFlashCountdown';
import useNewsletterSubscribe from '../hooks/useNewsletterSubscribe';

// Utils
import ErrorBoundary from '../../../shared/components/ErrorState/ErrorBoundary';

/**
 * Home Component - Main e-commerce homepage
 * Composition of multiple sections with independent loading states
 * Each section is responsible for its own data fetching and error handling
 */
export default function Home() {
  const location = useLocation();
  const flashTimeLeft = useFlashCountdown();
  const { email, setEmail, subscribed, isLoading, handleSubscribe } = useNewsletterSubscribe();
  const {
    categories,
    flashDeals,
    featuredProducts,
    bestSellers,
    newArrivals,
    recommended,
    loading,
  } = useHomepageData();

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
          <ShopByCategory categories={categories} loading={loading.categories} />
        </ErrorBoundary>

        {/* Popular Collections */}
        <ErrorBoundary>
          <PopularCollections products={featuredProducts} loading={loading.featured} />
        </ErrorBoundary>

        {/* Flash Deals with Countdown Timer */}
        <ErrorBoundary>
          <FlashDeals timeLeft={flashTimeLeft} flashDeals={flashDeals} loading={loading.flash} />
        </ErrorBoundary>

        {/* Featured Products */}
        <ErrorBoundary>
          <FeaturedProducts products={featuredProducts} loading={loading.featured} />
        </ErrorBoundary>

        {/* Promotional Banners */}
        <ErrorBoundary>
          <PromoBanners />
        </ErrorBoundary>

        {/* Best Sellers & New Arrivals (Side by Side) */}
        <ErrorBoundary>
          <BestSellersAndNewArrivals
            bestSellers={bestSellers}
            newArrivals={newArrivals}
            loading={{ bestSellers: loading.bestSellers, newArrivals: loading.newArrivals }}
          />
        </ErrorBoundary>

        {/* Shop by Brand */}
        <ErrorBoundary>
          <ShopByBrand brands={featuredProducts} loading={loading.featured} />
        </ErrorBoundary>

        {/* Recommended for You */}
        <ErrorBoundary>
          <RecommendedProducts products={recommended} loading={loading.recommended} />
        </ErrorBoundary>

        {/* Testimonials / Reviews */}
        <ErrorBoundary>
          <Testimonials />
        </ErrorBoundary>

        {/* Newsletter Subscription */}
        <ErrorBoundary>
          <NewsletterSection
            email={email}
            setEmail={setEmail}
            subscribed={subscribed}
            isLoading={isLoading}
            onSubscribe={handleSubscribe}
          />
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