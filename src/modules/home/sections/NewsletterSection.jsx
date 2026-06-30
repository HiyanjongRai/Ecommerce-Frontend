import React, { useState } from 'react';

function NewsletterSection({ email, setEmail, subscribed, isLoading, onSubscribe }) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Subscribe to Our Newsletter</h2>
        <p className="text-sm text-slate-500 mb-6">Get exclusive offers and the latest product launches.</p>
        <form onSubmit={(e) => onSubscribe(e)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <label className="sr-only" htmlFor="newsletter-email">Email address</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full max-w-md rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-slate-900 focus:border-[#28a745] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-full bg-[#28a745] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#218838] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {subscribed && <p className="mt-4 text-sm text-emerald-600">Thank you for subscribing!</p>}
      </div>
    </section>
  );
}

export default NewsletterSection;
