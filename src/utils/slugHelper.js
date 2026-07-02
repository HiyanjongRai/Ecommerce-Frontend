/**
 * Slug Helper Utilities
 * Generate URL-friendly slugs from product names
 */

/**
 * Convert a product name to a URL-friendly slug
 * @param {string} name - Product name
 * @returns {string} URL-friendly slug
 */
export const generateSlug = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()                           // Convert to lowercase
    .trim()                                  // Remove leading/trailing spaces
    .replace(/[^\w\s-]/g, '')               // Remove special characters
    .replace(/\s+/g, '-')                   // Replace spaces with hyphens
    .replace(/-+/g, '-')                    // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');               // Remove leading/trailing hyphens
};

/**
 * Get product URL from product object
 * Uses slug if available, otherwise generates from name or falls back to ID
 * @param {object} product - Product object
 * @returns {string} Product URL slug
 */
export const getProductUrlSlug = (product) => {
  if (!product) return '';
  
  // Priority 1: Use existing slug if available
  if (product.slug) {
    return product.slug;
  }
  
  // Priority 2: Generate slug from product name
  if (product.name) {
    return generateSlug(product.name);
  }
  
  // Priority 3: Fall back to ID
  return product.id || product.productId || '';
};

/**
 * Create a product link from product object
 * @param {object} product - Product object
 * @returns {string} Full product link
 */
export const getProductLink = (product) => {
  const slug = getProductUrlSlug(product);
  return `/product/${slug}`;
};

/**
 * Test cases (for development)
 */
export const testSlugGeneration = () => {
  const testCases = [
    "Black Wireless Headphones",
    "iPhone 14 Pro Max",
    "Nike Running Shoes - Professional Edition",
    "Product!!!With@#$%Special^&*()Characters",
    "Multiple   Spaces   Between   Words",
  ];
  
  return testCases.map(name => ({
    original: name,
    slug: generateSlug(name)
  }));
};

// Example usage:
// generateSlug("Black Wireless Headphones") → "black-wireless-headphones"
// generateSlug("iPhone 14 Pro") → "iphone-14-pro"
