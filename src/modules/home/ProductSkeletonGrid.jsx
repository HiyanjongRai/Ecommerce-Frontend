import React from 'react';

/**
 * Product Skeleton Grid Component
 * Displays skeleton loaders while products are being fetched
 * Provides better perceived performance and loading experience
 * 
 * @param {number} count - Number of skeleton items to display (default: 6)
 */
function ProductSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white border border-gray-100 rounded-2xl p-4"
          aria-busy="true"
          aria-label={`Loading product ${i + 1}`}
        >
          {/* Image placeholder */}
          <div className="bg-gray-100 aspect-square rounded-xl mb-3" />

          {/* Title placeholder */}
          <div className="h-3 bg-gray-100 rounded w-4/5 mb-2" />

          {/* Subtitle placeholder */}
          <div className="h-3 bg-gray-100 rounded w-1/2" />

          {/* Price placeholder */}
          <div className="h-3 bg-gray-100 rounded w-2/3 mt-3" />
        </div>
      ))}
    </div>
  );
}

export default ProductSkeletonGrid;
