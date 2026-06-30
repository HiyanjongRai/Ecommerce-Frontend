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
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Section Header with Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Flash Deals
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-medium">Ends in:</span>
            <div className="font-mono font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-md tabular-nums">
              {timeLeft}
            </div>
          </div>
        </div>
        <Link
          to="/product-list?onSale=true"
          className="text-sm font-semibold text-[#28a745] hover:text-[#218838] flex items-center gap-1"
        >
          View All Deals
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Products Grid */}
      {loading.flash ? (
        <ProductSkeletonGrid count={6} />
      ) : flashDeals && flashDeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
