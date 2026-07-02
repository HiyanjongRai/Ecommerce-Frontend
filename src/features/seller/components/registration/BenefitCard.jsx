import React from 'react';

const BenefitCard = ({ title, description, icon }) => {
  return (
    <div className="flex gap-4 p-4 bg-white/70 hover:bg-white border border-reg-border/40 hover:border-reg-primary/20 rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(22,163,74,0.04)] font-inter group">
      {/* Icon Wrapper */}
      <div className="w-10 h-10 rounded-xl bg-reg-primary-light flex items-center justify-center text-reg-primary flex-shrink-0 transition-transform group-hover:scale-105">
        {icon}
      </div>
      
      {/* Text Wrapper */}
      <div className="flex-1">
        <h4 className="text-sm font-bold text-reg-accent mb-0.5 leading-snug group-hover:text-reg-primary transition-colors">
          {title}
        </h4>
        <p className="text-xs text-reg-text-sec font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default BenefitCard;
