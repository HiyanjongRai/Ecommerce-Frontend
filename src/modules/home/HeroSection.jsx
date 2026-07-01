import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Truck, RefreshCw, Lock, Headphones } from 'lucide-react';

const HERO_IMAGE_URLS = [
  '/Assets/Banners/banner.png',
  '/Assets/Banners/banner_3.png',
  '/Assets/Banners/banner_1.png',
];
const HERO_FALLBACK_URL = '/Assets/Banners/banner.png';

const TRUST_ITEMS = [
  { icon: Truck, title: 'Free Delivery', subtitle: 'On orders over $50' },
  { icon: RefreshCw, title: 'Easy Returns', subtitle: '30-day return policy' },
  { icon: Lock, title: 'Secure Payments', subtitle: '100% secure checkout' },
  { icon: Headphones, title: '24/7 Support', subtitle: 'Always here to help' },
];

function HeroSection({ slideCount = 4, activeSlide = 0, onPrev, onNext, onSelectSlide }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGE_URLS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);
  return (
    <section
      className="relative overflow-hidden min-h-[500px] md:min-h-[540px]"
      style={{
        backgroundImage: `url(${HERO_IMAGE_URLS[currentSlide]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10 flex min-h-[500px] items-center">
        <div className="w-full lg:w-1/2">
          <div className="space-y-6 lg:max-w-xl text-[#111827]">
            <span className="inline-flex rounded-full bg-[#DCFCE7] px-4 py-1.5 text-xs font-bold tracking-wide text-[#166534]">
              SUMMER SALE
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-[#111827]">
              Upgrade Your Lifestyle
              <br />
              With <span className="text-[#10B981]">Best Deals</span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-[#4B5563]" style={{ lineHeight: 1.6 }}>
              Discover top quality products at unbeatable prices. Fast delivery, easy returns and 24/7 support.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/product-list"
                className="rounded-lg bg-[#10B981] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#059669]"
              >
                Shop Now
              </Link>
              <Link
                to="/product-list?onSale=true"
                className="rounded-lg border border-[#D1D5DB] bg-white px-8 py-3.5 text-sm font-bold text-[#374151] transition hover:bg-[#F9FAFB] hover:border-[#9CA3AF]"
              >
                Explore Deals
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-6 sm:grid-cols-4">
              {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
                <div key={title} className="flex items-center gap-3">
                  <Icon className="h-6 w-6 shrink-0 text-[#10B981]" strokeWidth={1.8} />
                  <div>
                    <div className="text-sm font-semibold text-[#1F2937] leading-tight">{title}</div>
                    <div className="text-xs text-[#6B7280] leading-tight">{subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

export default HeroSection;
