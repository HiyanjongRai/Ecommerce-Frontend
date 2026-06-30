import React from 'react';
import { Link } from 'react-router-dom';

function ShopByBrand({ brands = [], loading = false }) {
  const brandNames = Array.isArray(brands) && brands.length > 0
    ? [...new Set(brands.map((product) => product.brand || product.brandName).filter(Boolean))].slice(0, 6)
    : ['Nike', 'Apple', 'Samsung', 'Sony', 'Puma', 'Adidas'];

  const cards = loading
    ? Array.from({ length: 6 }).map((_, index) => ({ label: '', skeleton: true, key: index }))
    : brandNames.map((brand) => ({ label: brand, to: `/product-list?brand=${encodeURIComponent(brand)}`, skeleton: false, key: brand }));

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shop by Brand</h2>
          <p className="text-sm text-slate-500">Premium brands picked for you</p>
        </div>
        <Link to="/product-list" className="text-sm font-semibold text-[#28a745] hover:text-[#218838]">
          Explore brands
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          card.skeleton ? (
            <div key={card.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse" />
          ) : (
            <Link
              key={card.key}
              to={card.to}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm text-center transition hover:border-[#28a745] hover:bg-[#f0fdf4]"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                {card.label.charAt(0)}
              </div>
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
            </Link>
          )
        ))}
      </div>
    </section>
  );
}

export default ShopByBrand;
