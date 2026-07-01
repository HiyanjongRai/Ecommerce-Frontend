import React from 'react';
import ProductCard from '../../product/components/ProductCard';
import ProductSkeletonGrid from '../ProductSkeletonGrid';
import { Truck, RefreshCw, ShieldCheck, BadgeCheck } from 'lucide-react';

const TRUST_STRIP = [
  { icon: Truck, title: 'Free Shipping', subtitle: 'On orders over $50' },
  { icon: RefreshCw, title: 'Easy Returns', subtitle: '30-day return policy' },
  { icon: ShieldCheck, title: 'Secure Payments', subtitle: '100% secure checkout' },
  { icon: BadgeCheck, title: 'Buyer Protection', subtitle: 'Shop with confidence' },
];

function RecommendedProducts({ products = [], loading = false }) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Recommended for You</h2>
        <a href="/product-list" className="text-sm font-semibold text-[#28a745] hover:text-[#218838]">
          View All
        </a>
      </div>

      {loading ? (
        <ProductSkeletonGrid count={6} />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard key={product.productId || product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No recommendations available right now.
        </div>
      )}

      {/* ── Trust strip ── */}
      <div className="mt-10 grid grid-cols-2 gap-y-6 border-t border-slate-100 pt-8 sm:grid-cols-4">
        {TRUST_STRIP.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50">
              <Icon className="h-4 w-4 text-green-600" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-tight">{title}</div>
              <div className="text-xs text-slate-400 leading-tight">{subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecommendedProducts;