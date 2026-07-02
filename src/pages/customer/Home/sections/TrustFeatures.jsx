import React from 'react';

function TrustFeatures() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Secure Checkout', description: 'Your payment information is safe with us.' },
          { title: 'Fast Shipping', description: 'Reliable delivery across India.' },
          { title: 'Easy Returns', description: 'Hassle-free returns within 30 days.' },
        ].map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-500">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TrustFeatures;
