import React from 'react';
import ProductCard from '../../product/components/ProductCard';
import ProductSkeletonGrid from '../ProductSkeletonGrid';

function FeaturedProducts({ products = [], loading = false }) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
        <p className="text-sm text-slate-500">Top picks this week</p>
      </div>

      {loading ? (
        <ProductSkeletonGrid count={6} />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {products.map((product) => (
            <ProductCard key={product.productId || product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No featured products are available right now.
        </div>
      )}
    </section>
  );
}

export default FeaturedProducts;
