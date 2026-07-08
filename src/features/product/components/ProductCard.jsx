import React, { useMemo } from 'react';
import SimpleProductCard from './SimpleProductCard';
import VariantProductCard from './VariantProductCard';

/**
 * Determines if a product has variants
 * @param {Object} product - Product data
 * @param {Array} variants - Product variants array
 * @returns {boolean} - True if product has variants
 */
const isVariantProduct = (product, variants) => {
  if (product?.hasVariants === true) return true;
  if (Array.isArray(variants) && variants.length > 1) return true;
  if (Array.isArray(variants) && variants.length === 1 && variants[0]?.attributes && Object.keys(variants[0].attributes).length > 0) return true;
  if (product?.attributeOptions && Object.keys(product.attributeOptions).length > 0) return true;
  return false;
};

/**
 * ProductCard - Smart wrapper that automatically selects between:
 * - SimpleProductCard: For regular products (direct add to cart)
 * - VariantProductCard: For products with options (color, storage, size, etc)
 * 
 * All props are passed through to the appropriate card component
 */
const ProductCard = ({ product, onAddToCartSuccess, isSmall = false, variant = 'default', badge = null }) => {
  const variants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product?.variants]
  );

  const hasVariants = isVariantProduct(product, variants);

  // Automatically select the appropriate card component
  const CardComponent = hasVariants ? VariantProductCard : SimpleProductCard;

  return (
    <CardComponent
      product={product}
      onAddToCartSuccess={onAddToCartSuccess}
      isSmall={isSmall}
      variant={variant}
      badge={badge}
    />
  );
};

export default ProductCard;
export { SimpleProductCard, VariantProductCard };
