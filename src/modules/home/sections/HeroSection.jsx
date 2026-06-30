import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

function HeroSection() {
  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-[2fr_3fr] xl:grid-cols-[1.5fr_2.5fr_1fr] items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Summer Sale</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Discover the best deals for every budget.</h1>
            <p className="max-w-2xl text-base text-slate-600">Shop trending fashion, electronics, beauty, and more with fast shipping and easy returns.</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/product-list" className="rounded-full bg-[#28a745] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#218838]">Shop Now</Link>
              <Link to="/product-list?onSale=true" className="rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-900 transition hover:border-[#28a745] hover:text-[#28a745]">View Deals</Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-slate-100 p-6 shadow-lg">
            <div className="h-80 rounded-[1.75rem] bg-gradient-to-br from-emerald-100 to-slate-100" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
