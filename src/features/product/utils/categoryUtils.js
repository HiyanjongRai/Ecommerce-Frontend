export function normalizeCategoryValue(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function categoryMatches(productCategory, selectedCategory) {
  if (!productCategory || !selectedCategory) return false;
  return normalizeCategoryValue(productCategory) === normalizeCategoryValue(selectedCategory);
}
