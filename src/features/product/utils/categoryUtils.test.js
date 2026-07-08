import { normalizeCategoryValue, categoryMatches } from './categoryUtils';

describe('category matching', () => {
  it('matches categories regardless of case and punctuation', () => {
    expect(normalizeCategoryValue('Electronics')).toBe('electronics');
    expect(categoryMatches('Electronics', 'electronics')).toBe(true);
    expect(categoryMatches('Home & Kitchen', 'home-kitchen')).toBe(true);
    expect(categoryMatches('Beauty', 'Fashion')).toBe(false);
  });
});
