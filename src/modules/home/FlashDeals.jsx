import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../product/components/ProductCard';
import ProductSkeletonGrid from './ProductSkeletonGrid';

/**
 * Flash Deals Section
 * Displays time-limited discount products with countdown timer
 *
 * @param {string} timeLeft - Formatted countdown string (HH:MM:SS)
 */
function FlashDeals({ timeLeft, flashDeals = [], loading = false }) {
  const isLoading = typeof loading === 'object' ? !!loading.flash : !!loading;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Flash Deals</h2>
          <div className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
            <span className="font-medium">Ends in</span>
            <span className="font-mono tabular-nums tracking-wide">{timeLeft || '00:00:00'}</span>
          </div>
        </div>
        <Link
          to="/product-list?onSale=true"
          className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
        >
          View All Deals
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ── Product grid ── */}
      {isLoading ? (
        <ProductSkeletonGrid count={6} />
      ) : flashDeals && flashDeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {flashDeals.map((product) => (
            <ProductCard
              key={product.productId || product.id}
              product={product}
              variant="flash"
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No flash deals available right now." />
      )}
    </section>
  );
}

/**
 * Empty state message for sections with no data
 */
function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-center text-gray-400 text-sm">{message}</p>
    </div>
  );
}

export default FlashDeals;