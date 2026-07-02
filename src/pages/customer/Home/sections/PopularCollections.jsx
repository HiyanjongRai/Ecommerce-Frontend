import React from 'react';
import { Link } from 'react-router-dom';
import { getProductLink } from '../../../../utils/slugHelper';

function PopularCollections({ products = [], loading = false }) {
  const collections = Array.isArray(products) && products.length > 0
    ? products.slice(0, 4).map((product) => ({
        title: product.name || product.title || 'Collection',
        subtitle: product.brand || product.brandName || 'Trending now',
        image: product.image || product.images?.[0] || product.thumbnail,
        to: getProductLink(product),
      }))
    : [
        { title: 'New Arrivals', subtitle: 'Fresh products added daily', image: null, to: '/product-list?sort=newest' },
        { title: 'Best Sellers', subtitle: 'Top-rated picks', image: null, to: '/product-list?sort=bestSeller' },
        { title: 'Exclusive Offers', subtitle: 'Today’s hottest deals', image: null, to: '/product-list?onSale=true' },
        { title: 'Premium Picks', subtitle: 'Curated premium finds', image: null, to: '/product-list?category=Premium' },
      ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Popular Collections</h2>
          <p className="text-sm text-slate-500">Curated picks for you</p>
        </div>
        <Link to="/product-list" className="text-sm font-semibold text-[#28a745] hover:text-[#218838]">
          Browse all collections
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
            <div className="h-40 rounded-3xl bg-slate-100 mb-4" />
            <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        )) : collections.map(({ title, subtitle, image, to }) => (
          <Link
            key={title}
            to={to}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#28a745]"
          >
            <div className="h-44 w-full overflow-hidden rounded-3xl bg-slate-100 mb-4">
              {image ? (
                <img src={image} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">{title}</div>
              )}
            </div>
            <div className="text-sm uppercase tracking-[0.18em] text-[#16a34a] mb-2">{title}</div>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PopularCollections;
