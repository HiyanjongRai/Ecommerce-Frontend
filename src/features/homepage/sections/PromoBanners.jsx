import React from 'react';

function PromoBanners() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Free Delivery', subtitle: 'On orders above ₹1,500', color: 'bg-emerald-50' },
          { title: '24/7 Support', subtitle: 'Help when you need it', color: 'bg-slate-50' },
          { title: 'Easy Returns', subtitle: 'Hassle-free policy', color: 'bg-green-50' },
        ].map((promo) => (
          <div key={promo.title} className={`${promo.color} rounded-3xl border border-slate-200 p-7 shadow-sm`}>
            <p className="text-sm font-semibold text-slate-500 mb-2">{promo.title}</p>
            <p className="text-base font-bold text-slate-900">{promo.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PromoBanners;
