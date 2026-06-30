import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Shirt, Sparkles, HomeIcon, Trophy, BookOpen, ShoppingBasket,
  Armchair, Baby, Car, HeartPulse, PawPrint, LayoutGrid, ChevronRight,
  Truck, Ticket, CheckCircle2, Leaf, ArrowRight,
} from 'lucide-react';

/**
 * Category definitions for hero sidebar
 * Each category includes icon and URL slug
 */
const HERO_SIDEBAR_CATS = [
  { name: 'Electronics', icon: Cpu, slug: 'Electronics' },
  { name: 'Fashion', icon: Shirt, slug: 'Fashion' },
  { name: 'Beauty', icon: Sparkles, slug: 'Beauty' },
  { name: 'Home & Kitchen', icon: HomeIcon, slug: 'Home' },
  { name: 'Sports & Outdoors', icon: Trophy, slug: 'Sports' },
  { name: 'Books & Stationery', icon: BookOpen, slug: 'Books' },
  { name: 'Grocery & Essentials', icon: ShoppingBasket, slug: 'Grocery' },
  { name: 'Furniture', icon: Armchair, slug: 'Furniture' },
  { name: 'Toys & Baby', icon: Baby, slug: 'Toys' },
  { name: 'Automotive', icon: Car, slug: 'Automotive' },
  { name: 'Health & Personal Care', icon: HeartPulse, slug: 'Health' },
  { name: 'Pet Supplies', icon: PawPrint, slug: 'Pet' },
];

/**
 * Promotional cards shown in hero right sidebar
 */
const HERO_PROMO_CARDS = [
  {
    tag: "Today's Offer",
    title: 'Up to 60% OFF',
    desc: 'On selected products',
    link: '/product-list?onSale=true',
    linkLabel: 'Shop Now',
    image: '/Assets/Banners/campaign_hero_decoration.png',
  },
  {
    tag: 'Exclusive Coupon',
    title: 'Extra 20% OFF',
    desc: 'On your first order',
    link: '/promo',
    linkLabel: 'Get Coupon',
    isButton: true,
    image: null,
    icon: Ticket,
  },
  {
    tag: 'Free Shipping',
    title: 'Free Shipping',
    desc: 'On orders over Rs. 2,000',
    link: '/product-list',
    linkLabel: 'Shop Now',
    image: null,
    icon: Truck,
  },
];

/**
 * Customer avatars shown in hero (social proof)
 */
const CUSTOMER_AVATARS = ['PS', 'RT', 'AG', 'MK'];

/**
 * HeroSection Component
 * Main hero banner with category sidebar, promotional cards, and product showcase
 */
function HeroSection() {
  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-[1440px] mx-auto px-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          {/* Left: Category Sidebar (Desktop only) */}
          <CategoriSidebar />

          {/* Center: Main Hero Banner */}
          <HeroBanner />

          {/* Right: Promo Cards Stack */}
          <PromoCardsStack />
        </div>
      </div>

      {/* Mobile Category Strip */}
      <MobileCategoryStrip />
    </section>
  );
}

/**
 * Category sidebar for desktop view
 * Displays category navigation with icons
 */
function CategoriSidebar() {
  return (
    <aside className="hidden lg:flex lg:col-span-2 flex-col bg-white border-r border-gray-200 min-h-[520px]">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-bold text-slate-800">Shop by Category</h3>
      </div>
      <nav className="py-1 flex-1">
        {HERO_SIDEBAR_CATS.map(({ name, icon: Icon, slug }) => (
          <Link
            key={name}
            to={`/product-list?category=${encodeURIComponent(slug)}`}
            className="flex items-center gap-3 px-5 py-2 text-[13px] text-slate-600 hover:bg-green-50 hover:text-[#28a745] transition-colors group"
          >
            <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#28a745] flex-shrink-0" strokeWidth={1.5} />
            <span className="flex-1 font-medium">{name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#28a745]" />
          </Link>
        ))}
      </nav>
      <Link
        to="/product-list"
        className="flex items-center gap-2 px-5 py-3.5 border-t border-gray-100 text-[13px] font-semibold text-[#28a745] hover:bg-green-50 transition-colors"
      >
        <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
        View All Categories
      </Link>
    </aside>
  );
}

/**
 * Main hero banner with marketing copy and product showcase
 */
function HeroBanner() {
  return (
    <div className="lg:col-span-7 p-3 lg:p-4">
      <div className="relative bg-[#f4f6f8] rounded-2xl overflow-hidden min-h-[420px] lg:min-h-[488px] h-full">
        <Leaf className="absolute top-8 right-[32%] w-10 h-10 text-[#28a745]/30 rotate-12 pointer-events-none hidden md:block z-0" />

        <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center px-6 sm:px-10 py-8 lg:py-10 gap-4 relative z-10">
          {/* Copy Section */}
          <div className="text-left order-2 md:order-1">
            <span className="inline-block bg-white text-[#28a745] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-green-100">
              Summer Sale
            </span>
            <h1 className="text-3xl sm:text-4xl xl:text-[2.65rem] font-extrabold text-slate-900 leading-[1.12] tracking-tight mb-3">
              Big Savings.{' '}
              <span className="text-[#28a745]">Bigger Smiles.</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-[15px] leading-relaxed mb-6 max-w-sm">
              Shop the best products at unbeatable prices. Fast delivery, easy returns and 24/7 support.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                to="/product-list"
                className="inline-flex items-center gap-2 bg-[#28a745] hover:bg-[#218838] text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Shop Now
              </Link>
              <Link
                to="/product-list?onSale=true"
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-slate-700 font-bold text-sm px-6 py-2.5 rounded-lg border border-gray-300 transition-colors"
              >
                Explore Deals
              </Link>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-[#28a745] flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Trusted by over 1 Million+ Customers</span>
            </div>

            {/* Customer Avatars (Social Proof) */}
            <div className="flex items-center gap-1.5">
              {CUSTOMER_AVATARS.map((initials, i) => (
                <div
                  key={initials}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ${
                    ['bg-[#28a745] text-white', 'bg-slate-700 text-white', 'bg-amber-500 text-white', 'bg-blue-500 text-white'][i]
                  }`}
                >
                  {initials}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[#28a745] text-sm font-bold shadow-sm">
                +
              </div>
            </div>
          </div>

          {/* Product Showcase on Pedestals */}
          <ProductShowcase />
        </div>
      </div>
    </div>
  );
}

/**
 * Product showcase with decorative pedestals
 */
function ProductShowcase() {
  return (
    <div className="relative flex items-end justify-center min-h-[220px] md:min-h-[320px] order-1 md:order-2">
      {/* Decorative pedestals */}
      <div className="absolute bottom-6 left-[6%] w-[88px] h-[56px] bg-green-100/80 rounded-t-full shadow-sm" />
      <div className="absolute bottom-6 left-[36%] w-[72px] h-[48px] bg-white rounded-t-full shadow-md" />
      <div className="absolute bottom-6 right-[6%] w-[88px] h-[56px] bg-green-100/80 rounded-t-full shadow-sm" />

      {/* Product images */}
      <img
        src="/Assets/Banners/homepage_hero_headphones.png"
        alt="Premium headphones"
        className="absolute bottom-14 left-[4%] w-28 sm:w-32 object-contain drop-shadow-xl z-10"
        loading="lazy"
      />
      <img
        src="/Assets/Banners/smartwatch_banner.png"
        alt="Smartwatch"
        className="absolute bottom-16 left-[32%] w-24 sm:w-28 object-contain drop-shadow-xl z-20"
        loading="lazy"
      />
      <img
        src="/Assets/Banners/hero_tech_collage.png"
        alt="Tech products"
        className="absolute bottom-12 right-[2%] w-32 sm:w-36 object-contain drop-shadow-xl z-10 rounded-lg"
        loading="lazy"
      />
    </div>
  );
}

/**
 * Promotional cards stack (right side of hero)
 */
function PromoCardsStack() {
  return (
    <div className="lg:col-span-3 p-3 lg:p-4 lg:pl-0 flex flex-col gap-3">
      {HERO_PROMO_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <PromoCard key={card.tag} card={card} Icon={Icon} />
        );
      })}
    </div>
  );
}

/**
 * Individual promo card
 */
function PromoCard({ card, Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[#f4f6f8] p-4 flex-1 min-h-[148px]">
      <div className="text-left flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
          {card.tag}
        </span>
        <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-0.5">
          {card.title}
        </h3>
        <p className="text-xs text-gray-500 mb-2.5">{card.desc}</p>
        {card.isButton ? (
          <Link
            to={card.link}
            className="inline-block text-xs font-bold bg-[#28a745] hover:bg-[#218838] text-white px-3.5 py-1.5 rounded-md transition-colors"
          >
            {card.linkLabel}
          </Link>
        ) : (
          <Link
            to={card.link}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#28a745] hover:text-[#218838] transition-colors"
          >
            {card.linkLabel} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="w-[72px] h-[72px] flex items-center justify-center flex-shrink-0">
        {card.image ? (
          <img src={card.image} alt="" className="w-full h-full object-contain drop-shadow-md" loading="lazy" />
        ) : Icon ? (
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Icon className="w-8 h-8 text-[#28a745]" strokeWidth={1.5} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Mobile-only category strip
 * Horizontal scrollable on mobile devices
 */
function MobileCategoryStrip() {
  return (
    <div className="lg:hidden border-t border-gray-200 bg-white overflow-x-auto no-scrollbar">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {HERO_SIDEBAR_CATS.slice(0, 8).map(({ name, icon: Icon, slug }) => (
          <Link
            key={name}
            to={`/product-list?category=${encodeURIComponent(slug)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-green-50 hover:border-green-200 hover:text-[#28a745] whitespace-nowrap"
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            {name.split(' ')[0]}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HeroSection;
