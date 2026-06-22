import React from 'react';

const SuccessScreen = () => {
  const handleHomeRedirect = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 font-inter animate-in fade-in zoom-in-95 duration-500">
      {/* Animated Checkmark */}
      <div className="w-20 h-20 rounded-full bg-reg-primary-light flex items-center justify-center text-reg-primary mb-6 shadow-sm relative">
        <div className="absolute inset-0 rounded-full border-4 border-reg-primary/20 animate-ping opacity-75" />
        <svg className="w-10 h-10 stroke-current relative z-10" fill="none" viewBox="0 0 24 24" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Headings */}
      <h2 className="font-poppins text-2xl md:text-3xl font-extrabold text-reg-accent tracking-tight leading-tight">
        Application Submitted!
      </h2>
      <p className="text-sm font-semibold text-reg-text-sec mt-3 max-w-[420px] leading-relaxed">
        Thank you for onboarding as a seller. Our admin review team is validating your documents. We typically approve applications within 12–24 hours.
      </p>

      {/* Checklist layout representing Timeline steps */}
      <div className="w-full max-w-[380px] bg-reg-bg rounded-2xl border border-reg-border/40 p-5 mt-8 space-y-4 text-left">
        <h4 className="text-[11px] font-bold text-reg-text-sec uppercase tracking-widest leading-none">
          What Happens Next
        </h4>
        
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-reg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h5 className="text-xs font-bold text-reg-accent leading-none">Merchant Account Setup</h5>
              <p className="text-[11px] text-reg-text-sec mt-1 leading-snug">Credentials stored and pending verification.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-reg-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h5 className="text-xs font-bold text-reg-accent leading-none">Document Review</h5>
              <p className="text-[11px] text-reg-text-sec mt-1 leading-snug font-semibold">Admin matches documents with compliance criteria.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-reg-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h5 className="text-xs font-bold text-reg-accent leading-none">Studio Activation</h5>
              <p className="text-[11px] text-reg-text-sec mt-1 leading-snug">You receive an email notification to log in and list items.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Redirect Button */}
      <button
        type="button"
        onClick={handleHomeRedirect}
        className="mt-8 px-6 py-3 bg-reg-primary hover:bg-reg-primary-dark text-white text-sm font-bold rounded-xl shadow-[0_6px_20px_rgba(22,163,74,0.15)] hover:shadow-[0_8px_25px_rgba(22,163,74,0.25)] transition-all duration-200 cursor-pointer active:scale-98 focus:outline-none focus:ring-4 focus:ring-reg-primary/20 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Storefront
      </button>
    </div>
  );
};

export default SuccessScreen;
