import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Brand wordmarks styled with distinct type treatments to approximate each
// brand's logo lockup. Swap `logoUrl` in for a real image if/when you have one.
const BRANDS = [
  { name: 'Samsung', className: 'font-bold tracking-wide' },
  { name: 'Apple', className: 'font-semibold' },
  { name: 'Sony', className: 'font-bold italic tracking-wide' },
  { name: 'Nike', className: 'font-black italic' },
  { name: 'Adidas', className: 'font-extrabold lowercase' },
  { name: 'Puma', className: 'font-black italic uppercase' },
  { name: 'Canon', className: 'font-bold tracking-wide' },
  { name: 'boAt', className: 'font-extrabold' },
];

function ShopByBrand({ brands = [], loading = false }) {
  const isProductList = Array.isArray(brands) && brands.length > 0 && typeof brands[0] === 'object';

  const brandList = isProductList
    ? Object.values(
        brands.reduce((acc, product) => {
          const name = product.brand || product.brandName;
          if (!name) return acc;
          if (!acc[name]) acc[name] = { name, logoUrl: product.brandLogoUrl || null };
          return acc;
        }, {})
      ).slice(0, 8)
    : BRANDS;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-900">Top Brands You Love</h2>
        <Link
          to="/product-list"
          className="text-xs font-semibold text-green-600 hover:text-green-700"
        >
          View All Brands
        </Link>
      </div>

      {/* ── Brand strip ── */}
      <div className="flex items-center gap-x-8 gap-y-4 flex-wrap sm:flex-nowrap sm:overflow-x-auto">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-6 w-16 shrink-0 rounded bg-slate-100 animate-pulse" />
            ))
          : brandList.map((brand) => (
              <Link
                key={brand.name}
                to={`/product-list?brand=${encodeURIComponent(brand.name)}`}
                className="shrink-0 flex items-center justify-center opacity-90 hover:opacity-100 transition"
              >
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} className="h-6 max-w-[90px] object-contain" />
                ) : (
                  <span className={`text-lg text-slate-900 whitespace-nowrap ${brand.className || ''}`}>
                    {brand.name}
                  </span>
                )}
              </Link>
            ))}

        <Link
          to="/product-list"
          aria-label="View all brands"
          className="ml-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-600 transition"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default ShopByBrand;