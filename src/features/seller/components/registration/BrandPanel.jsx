import React from 'react';
import SellingIllustration from '../../../../shared/components/illustrations/SellingIllustration';
import BenefitCard from './BenefitCard';

const BENEFITS = [
  {
    title: 'Reach Millions of Customers',
    description: 'Showcase your items to our massive user base across Nepal and beyond.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.115c0 1.122-.089 2.224-.262 3.3M11.177 19.128A9.357 9.357 0 0115 18.016m-3.823 1.112c-.173-1.076-.262-2.178-.262-3.3v-.115M11.177 19.128A9.357 9.357 0 007.35 18.016m3.827 1.112a9.38 9.38 0 00-2.625.372 9.337 9.337 0 01-4.121-.952 4.125 4.125 0 017.533-2.493M7.35 18.016a9.38 9.38 0 013.827-1.112m-3.827 1.112c-.173-1.076-.262-2.178-.262-3.3v-.114m0 0A9.357 9.357 0 0111.177 15.6m-3.823 0c.05-.417.118-.83.204-1.236m3.619 1.236a9.357 9.357 0 003.823-1.236m-3.823 1.236V15.6m1.854-12.724a9.03 9.03 0 00-3.708 0t3.708 0z" />
      </svg>
    ),
  },
  {
    title: 'Easy Order Management',
    description: 'Elegantly manage products, fulfillment, and returns in a premium unified workspace.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
  },
  {
    title: 'Secure Payments',
    description: 'Guaranteed funds validation and robust transaction security standard.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Fast Payouts',
    description: 'Settle net earnings directly into your bank or e-wallets within 24 hours.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a6.002 6.002 0 018.25-5.636 6.002 6.002 0 018.25 5.636m-16.5 0h16.5M12 2.25v10.5m0 0l-3-3m3 3l3-3" />
      </svg>
    ),
  },
];

const BrandPanel = ({ hasNavbar }) => {
  return (
    <div 
      className={`hidden lg:flex lg:w-[40%] flex-shrink-0 flex-col justify-between relative font-sans overflow-y-auto select-none ${
        hasNavbar 
          ? 'p-8 lg:min-h-[calc(100vh-160px)]' 
          : 'p-12 lg:min-h-screen'
      }`}
      style={{
        background: 'linear-gradient(145deg, #FFFFFF 0%, #F1FDF6 50%, #DCFCE7 100%)',
      }}
    >
      {/* Absolute background accent blobs */}
      <div className="absolute top-1/4 right-0 w-72 h-72 bg-reg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />


      {/* Core illustration and headlines */}
      <div className={`relative z-10 flex flex-col items-center text-center ${hasNavbar ? 'my-4' : 'my-8'}`}>
        <SellingIllustration className={`w-full max-w-[320px] animate-in slide-in-from-bottom-6 duration-700 ${hasNavbar ? 'mb-4' : 'mb-8'}`} />
        
        <h2 className="font-poppins text-2xl xl:text-3xl font-bold text-reg-accent tracking-tight leading-tight max-w-[320px]">
          Start Selling Online Today
        </h2>
        <p className="text-sm font-semibold text-reg-text-sec mt-3 max-w-[350px] leading-relaxed">
          Join thousands of successful sellers and grow your business with ease.
        </p>
      </div>

      {/* Benefits grid */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
        {BENEFITS.map((benefit, idx) => (
          <BenefitCard 
            key={idx}
            title={benefit.title}
            description={benefit.description}
            icon={benefit.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default BrandPanel;
