import React from 'react';
import { Link } from 'react-router-dom';

function ShopByCategory({ categories = [], loading = false }) {
  const displayedCategories = Array.isArray(categories) && categories.length > 0
    ? categories.slice(0, 6).map((category) => {
        const title = typeof category === 'string'
          ? category
          : category.name || category.title || category.label || category.slug || 'Category';
        const slug = typeof category === 'string'
          ? category
          : category.slug || category.id || title;
        return {
          title,
          to: `/product-list?category=${encodeURIComponent(slug)}`,
        };
      })
    : [
        { title: 'Electronics', to: '/product-list?category=Electronics' },
        { title: 'Fashion', to: '/product-list?category=Fashion' },
        { title: 'Home & Kitchen', to: '/product-list?category=Home%20%26%20Kitchen' },
        { title: 'Beauty', to: '/product-list?category=Beauty' },
        { title: 'Sports', to: '/product-list?category=Sports' },
        { title: 'Books', to: '/product-list?category=Books' },
      ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
          <p className="text-sm text-slate-500">Browse trending categories</p>
        </div>
        <Link to="/product-list" className="text-sm font-semibold text-[#28a745] hover:text-[#218838]">
          View all categories
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {(loading ? Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm animate-pulse">
            <div className="mx-auto h-4 w-3/4 rounded-full bg-slate-200" />
          </div>
        )) : displayedCategories).map((category) => (
          <Link
            key={category.title}
            to={category.to}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-[#28a745] hover:bg-[#f0fdf4]"
          >
            <p className="text-sm font-semibold text-slate-700">{category.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ShopByCategory;
