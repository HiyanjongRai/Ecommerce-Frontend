import React, { useRef } from 'react';
import { Star, ArrowRight, ShieldCheck, RefreshCw, Truck, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../../product/components/ProductCard';
import ProductSkeletonGrid from '../ProductSkeletonGrid';

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'Secure Checkout', subtitle: '100% Protected' },
  { icon: RefreshCw,   title: 'Easy Returns',    subtitle: '30-Day Returns' },
  { icon: Truck,       title: 'Fast Delivery',   subtitle: '2-5 Business Days' },
  { icon: Headphones,  title: '24/7 Support',    subtitle: 'Always Here to Help' },
];

function FeaturedProducts({ products = [], loading = false }) {
  const scrollerRef = useRef(null);

  const scrollByAmount = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' });
  };

  const heroImages = products.slice(0, 2);

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* ── Hero ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-12">
        {/* Left: copy + CTAs */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-green-700">
            <Star className="h-3.5 w-3.5 fill-green-600 text-green-600" />
            FEATURED PRODUCTS
          </span>

          <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900">
            Featured Products.
            <br />
            <span className="text-green-600">Best Picks for You.</span>
          </h2>

          <p className="mt-4 max-w-md text-slate-500 text-[15px] leading-relaxed">
            Handpicked products that combine quality, style, and value. Shop the best picks at unbeatable prices.
          </p>

          <div className="mt-7 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700">
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400">
              Explore All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: trust bar + image collage */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
            {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
              <div key={title} className="flex flex-col items-center text-center w-[110px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white">
                  <Icon className="h-6 w-6 text-green-600" strokeWidth={1.8} />
                </div>
                <div className="mt-2.5 text-xs font-semibold text-slate-900">{title}</div>
                <div className="text-[11px] text-slate-400">{subtitle}</div>
              </div>
            ))}
          </div>

          {heroImages.length > 0 && (
            <div className="relative flex items-end justify-center gap-6 h-[220px]">
              {heroImages.map((product, idx) => (
                <div
                  key={product.productId || product.id}
                  className="relative flex flex-col items-center"
                  style={{ marginBottom: idx === 0 ? 0 : 40 }}
                >
                  <img
                    src={product.imageUrl || product.thumbnail}
                    alt={product.name || product.title || 'Featured product'}
                    className="relative z-10 h-40 w-40 object-contain drop-shadow-xl"
                  />
                  <div
                    className={`h-8 w-40 rounded-full ${idx === 0 ? 'bg-slate-100' : 'bg-green-100'}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Product carousel ── */}
      {loading ? (
        <ProductSkeletonGrid count={6} />
      ) : products.length > 0 ? (
        <div className="relative">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByAmount(-1)}
            className="absolute left-[-14px] top-1/2 z-10 hidden -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 sm:flex"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          >
            {products.map((product) => (
              <div
                key={product.productId || product.id}
                className="w-[220px] shrink-0 snap-start sm:w-[230px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByAmount(1)}
            className="absolute right-[-14px] top-1/2 z-10 hidden -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 sm:flex"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No featured products are available right now.
        </div>
      )}

      {products.length > 0 && !loading && (
        <div className="mt-8 flex justify-center">
          <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-green-700 transition hover:border-slate-300">
            View All Products
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

export default FeaturedProducts;