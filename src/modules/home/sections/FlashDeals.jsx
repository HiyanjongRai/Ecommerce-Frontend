import React from 'react';

function FlashDeals({ timeLeft }) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Flash Deals</h2>
          <p className="text-sm text-slate-500">Limited-time offers ending soon</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
          <span>Ends in</span>
          <span className="font-mono">{timeLeft}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-36 rounded-3xl bg-slate-100 mb-4" />
            <div className="h-3 w-3/4 rounded-full bg-slate-200 mb-2" />
            <div className="h-3 w-1/2 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default FlashDeals;
