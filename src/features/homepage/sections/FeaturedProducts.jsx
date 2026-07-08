import React from 'react';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../../product/components/ProductCard';
import ProductSkeletonGrid from '../components/ProductSkeletonGrid';

function FeaturedProducts({ products = [], loading = false }) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
        <a
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700"
        >
          View All Products
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {loading ? (
        <ProductSkeletonGrid count={6} />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard key={product.productId || product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">
          No featured products are available right now.
        </div>
      )}
    </section>
  );
}

export default FeaturedProducts;