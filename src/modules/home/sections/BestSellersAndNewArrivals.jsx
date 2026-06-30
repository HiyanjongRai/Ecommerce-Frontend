import React from 'react';
import ProductCard from '../../product/components/ProductCard';
import ProductSkeletonGrid from '../ProductSkeletonGrid';

function BestSellersAndNewArrivals({ bestSellers = [], newArrivals = [], loading = {} }) {
  const bestLoading = loading.bestSellers;
  const newLoading = loading.newArrivals;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Best Sellers</h2>
              <p className="text-sm text-slate-500">Popular picks from customers</p>
            </div>
            <span className="text-sm font-semibold text-[#28a745]">Top products</span>
          </div>
          {bestLoading ? (
            <ProductSkeletonGrid count={3} />
          ) : bestSellers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.productId || product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No best sellers available at the moment.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">New Arrivals</h2>
              <p className="text-sm text-slate-500">Fresh finds just landed</p>
            </div>
            <span className="text-sm font-semibold text-[#28a745]">New in</span>
          </div>
          {newLoading ? (
            <ProductSkeletonGrid count={4} />
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.productId || product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No new arrivals found right now.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default BestSellersAndNewArrivals;
