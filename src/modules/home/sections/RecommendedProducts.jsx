import React from 'react';
import ProductCard from '../../product/components/ProductCard';
import ProductSkeletonGrid from '../ProductSkeletonGrid';

function RecommendedProducts({ products = [], loading = false }) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recommended for You</h2>
          <p className="text-sm text-slate-500">Based on your browsing</p>
        </div>
        <a href="/product-list" className="text-sm font-semibold text-[#28a745] hover:text-[#218838]">
          See all recommendations
        </a>
      </div>

      {loading ? (
        <ProductSkeletonGrid count={6} />
      ) : products.length > 0 ? (
        <div className="flex flex-col items-center gap-5">
          {products.map((product) => (
            <ProductCard key={product.productId || product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No recommendations available right now.
        </div>
      )}
    </section>
  );
}

export default RecommendedProducts;
