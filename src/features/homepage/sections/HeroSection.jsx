import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Truck, RefreshCw, Lock, Headphones } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: Truck, title: 'Free Delivery', subtitle: 'On orders over $50' },
  { icon: RefreshCw, title: 'Easy Returns', subtitle: '30-day return policy' },
  { icon: Lock, title: 'Secure Payments', subtitle: '100% secure checkout' },
  { icon: Headphones, title: '24/7 Support', subtitle: 'Always here to help' },
];

// Use one of the available banner assets from the public assets folder.
const HERO_IMAGE_URL = '/Assets/Banners/banner.png';

function HeroSection({ slideCount = 4, activeSlide = 0, onPrev, onNext, onSelectSlide }) {
  return (
    <section className="bg-[#f4f4f0]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition"
        >
          <ChevronRight className="h-5 w-5 text-slate-700" />
        </button>

        <div className="grid gap-10 lg:grid-cols-2 items-center">
          {/* ── Copy ── */}
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-green-100 px-4 py-1.5 text-xs font-bold tracking-wide text-green-700">
              SUMMER SALE
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900">
              Upgrade Your Lifestyle
              <br />
              With <span className="text-green-600">Best Deals</span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-slate-500">
              Discover top quality products at unbeatable prices. Fast delivery, easy returns and 24/7 support.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/product-list"
                className="rounded-lg bg-green-600 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-green-700"
              >
                Shop Now
              </Link>
              <Link
                to="/product-list?onSale=true"
                className="rounded-lg border border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-slate-900 transition hover:border-green-300"
              >
                Explore Deals
              </Link>
            </div>

            {/* ── Trust row ── */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-6 sm:grid-cols-4">
              {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
                <div key={title} className="flex items-center gap-3">
                  <Icon className="h-6 w-6 shrink-0 text-green-600" strokeWidth={1.8} />
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-tight">{title}</div>
                    <div className="text-xs text-slate-400 leading-tight">{subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Hero image ── */}
          <div className="hidden lg:block">
            <img
              src={HERO_IMAGE_URL}
              alt="Featured products"
              className="mx-auto max-h-[420px] w-auto object-contain"
            />
          </div>
        </div>

        {/* ── Carousel dots ── */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: slideCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => onSelectSlide?.(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeSlide ? 'w-6 bg-green-600' : 'w-2.5 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;