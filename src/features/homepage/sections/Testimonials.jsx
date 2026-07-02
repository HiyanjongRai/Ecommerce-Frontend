import React from 'react';

function Testimonials() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Customer Testimonials</h2>
        <p className="text-sm text-slate-500">What shoppers love about us</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { quote: 'Amazing service and fast delivery!', author: 'Priya' },
          { quote: 'The product quality is excellent.', author: 'Arjun' },
          { quote: 'Great prices and easy returns.', author: 'Shreya' },
        ].map((item) => (
          <div key={item.author} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-slate-700">“{item.quote}”</p>
            <div className="text-sm font-semibold text-slate-900">{item.author}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
