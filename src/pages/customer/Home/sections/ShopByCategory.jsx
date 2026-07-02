import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Headphones, Shirt, Sparkles, UtensilsCrossed, Volleyball, BookOpen,
  ShoppingBasket, Armchair, Smartphone, Laptop, Car, PawPrint, Package,
} from 'lucide-react';

const CATEGORY_ICONS = {
  electronics: Headphones,
  fashion: Shirt,
  beauty: Sparkles,
  'home & kitchen': UtensilsCrossed,
  home: UtensilsCrossed,
  kitchen: UtensilsCrossed,
  sports: Volleyball,
  books: BookOpen,
  grocery: ShoppingBasket,
  furniture: Armchair,
  mobiles: Smartphone,
  mobile: Smartphone,
  computers: Laptop,
  automotive: Car,
  'pet supplies': PawPrint,
  pets: PawPrint,
};

const getCategoryIcon = (title = '') => CATEGORY_ICONS[title.trim().toLowerCase()] || Package;

// Cycled pastel backgrounds for the circle behind each category image/icon.
const CIRCLE_COLORS = ['bg-blue-50', 'bg-pink-50', 'bg-purple-50', 'bg-slate-100', 'bg-orange-50', 'bg-emerald-50', 'bg-lime-50', 'bg-amber-50'];

function ShopByCategory({ categories = [], loading = false }) {
  const displayedCategories = Array.isArray(categories) && categories.length > 0
    ? categories.slice(0, 8).map((category) => {
        const title = typeof category === 'string'
          ? category
          : category.name || category.title || category.label || category.slug || 'Category';
        const slug = typeof category === 'string'
          ? category
          : category.slug || category.id || title;
        const itemCount = typeof category === 'object' ? category.itemCount ?? category.count ?? null : null;
        const imageUrl = typeof category === 'object' ? category.imageUrl || category.image || null : null;
        return {
          title,
          itemCount,
          imageUrl,
          to: `/product-list?category=${encodeURIComponent(slug)}`,
        };
      })
    // TEMPORARY placeholder images (real seeded photos from Lorem Picsum,
    // not actual product/category photography). Swap `imageUrl` for real
    // category photos from your backend/CDN as soon as it's available —
    // the card already prefers imageUrl over the icon fallback whenever
    // it's set to a truthy value.
    : [
        { title: 'Electronics', itemCount: 12345, imageUrl: 'https://picsum.photos/seed/electronics-jhapcham/200/200', to: '/product-list?category=Electronics' },
        { title: 'Fashion', itemCount: 8543, imageUrl: 'https://picsum.photos/seed/fashion-jhapcham/200/200', to: '/product-list?category=Fashion' },
        { title: 'Beauty', itemCount: 6432, imageUrl: 'https://picsum.photos/seed/beauty-jhapcham/200/200', to: '/product-list?category=Beauty' },
        { title: 'Home & Kitchen', itemCount: 10234, imageUrl: 'https://picsum.photos/seed/home-kitchen-jhapcham/200/200', to: '/product-list?category=Home%20%26%20Kitchen' },
        { title: 'Sports', itemCount: 5342, imageUrl: 'https://picsum.photos/seed/sports-jhapcham/200/200', to: '/product-list?category=Sports' },
        { title: 'Books', itemCount: 3245, imageUrl: 'https://picsum.photos/seed/books-jhapcham/200/200', to: '/product-list?category=Books' },
        { title: 'Grocery', itemCount: 7654, imageUrl: 'https://picsum.photos/seed/grocery-jhapcham/200/200', to: '/product-list?category=Grocery' },
        { title: 'Furniture', itemCount: 4321, imageUrl: 'https://picsum.photos/seed/furniture-jhapcham/200/200', to: '/product-list?category=Furniture' },
      ];

  const cards = loading
    ? Array.from({ length: 8 }).map((_, idx) => ({ skeleton: true, key: idx }))
    : displayedCategories.map((c, idx) => ({ ...c, key: c.title, skeleton: false, color: CIRCLE_COLORS[idx % CIRCLE_COLORS.length] }));

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Shop by Category</h2>
        <Link
          to="/product-list"
          className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
        >
          View All Categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ── Category row ── */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-6">
        {cards.map((card) => {
          if (card.skeleton) {
            return (
              <div key={card.key} className="flex flex-col items-center gap-2">
                <div className="h-20 w-20 rounded-full bg-slate-100 animate-pulse" />
                <div className="h-3 w-16 rounded-full bg-slate-100 animate-pulse" />
                <div className="h-3 w-12 rounded-full bg-slate-100 animate-pulse" />
              </div>
            );
          }
          const Icon = getCategoryIcon(card.title);
          return (
            <Link
              key={card.key}
              to={card.to}
              className="group flex flex-col items-center text-center gap-2.5"
            >
              <div className={`flex h-20 w-20 items-center justify-center rounded-full overflow-hidden transition group-hover:scale-105 ${card.color}`}>
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.title} className="h-full w-full object-cover" />
                ) : (
                  <Icon className="h-8 w-8 text-slate-600" strokeWidth={1.5} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                {card.itemCount !== null && (
                  <p className="text-xs text-slate-400">{Number(card.itemCount).toLocaleString()} Items</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ShopByCategory;