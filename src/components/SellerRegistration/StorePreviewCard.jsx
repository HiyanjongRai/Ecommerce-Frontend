import React from 'react';

const StorePreviewCard = ({ storeName, businessCategory, city, country }) => {
  const displayStoreName = storeName?.trim() || 'Your Store Name';
  const displayCategory = businessCategory || 'Select Category';
  const displayLocation = (city?.trim() || country?.trim())
    ? `${city?.trim() || ''}${city?.trim() && country?.trim() ? ', ' : ''}${country?.trim() || ''}`
    : 'Store Location';
  
  const initial = displayStoreName.charAt(0).toUpperCase();

  return (
    <div className="w-full bg-white rounded-[20px] border border-reg-border/80 shadow-[0_10px_30px_rgba(17,24,39,0.04)] overflow-hidden font-inter select-none transition-all duration-300 hover:shadow-[0_15px_35px_rgba(17,24,39,0.06)] hover:border-reg-primary/20">
      {/* Visual Header / Cover Gradient */}
      <div className="h-28 bg-gradient-to-r from-emerald-500 to-teal-600 relative flex items-center justify-between px-5">
        {/* Abstract pattern lines overlay */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Floating badge */}
        <span className="relative z-10 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
          Live Store Preview
        </span>
      </div>

      {/* Profile details */}
      <div className="px-5 pb-6 pt-10 relative">
        {/* Store Logo overlapping the cover */}
        <div className="absolute -top-10 left-5 w-20 h-20 rounded-2xl bg-white p-1 border border-reg-border/50 shadow-md">
          <div className="w-full h-full rounded-[14px] bg-reg-primary-light flex items-center justify-center text-reg-primary font-poppins font-extrabold text-2xl">
            {initial}
          </div>
        </div>

        {/* Store description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-poppins text-lg font-bold text-reg-accent truncate leading-tight">
              {displayStoreName}
            </h3>
            {/* Verified badge */}
            <span className="flex-shrink-0 text-reg-primary" title="Verified Store">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a.75.75 0 00-.708-.523.75.75 0 00-.507.291L1.716 7.7a.75.75 0 00-.01 1.047l3.335 3.562a.75.75 0 00.84.148c.38-.179.626-.563.626-.98V9.5h5a3.5 3.5 0 013.5 3.5v.25a.75.75 0 001.5 0v-.25A5 5 0 0011.5 8h-5V6.024a.75.75 0 00-.233-.569z" clipRule="evenodd" />
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4.13-5.69z" />
              </svg>
            </span>
          </div>

          {/* Category Tag */}
          <div className="inline-block">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-reg-primary-light text-reg-primary border border-reg-primary/10">
              {displayCategory}
            </span>
          </div>

          {/* Location details */}
          <div className="flex items-center gap-1.5 text-xs text-reg-text-sec font-semibold pt-1">
            <svg className="w-4 h-4 text-reg-placeholder flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25gA7.5 7.5 0 1119.5 10.5z" />
            </svg>
            <span className="truncate">{displayLocation}</span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-reg-border/50 my-4" />

        {/* Mock Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-0.5">
            <span className="block text-[11px] font-bold text-reg-text-sec uppercase tracking-wider">Products</span>
            <span className="text-sm font-extrabold text-reg-accent">0</span>
          </div>
          <div className="space-y-0.5 border-x border-reg-border/50">
            <span className="block text-[11px] font-bold text-reg-text-sec uppercase tracking-wider">Rating</span>
            <span className="text-sm font-extrabold text-reg-accent flex items-center justify-center gap-0.5">
              5.0
              <svg className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="block text-[11px] font-bold text-reg-text-sec uppercase tracking-wider">Status</span>
            <span className="text-sm font-extrabold text-reg-primary uppercase tracking-wide">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorePreviewCard;
