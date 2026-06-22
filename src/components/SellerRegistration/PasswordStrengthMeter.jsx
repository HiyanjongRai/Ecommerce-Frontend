import React from 'react';

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', colorClass: 'bg-reg-border' };

  let score = 0;
  
  // 1. Length check
  if (password.length >= 8) score++;
  
  // 2. Mix of upper and lower case
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  
  // 3. Contains number
  if (/\d/.test(password)) score++;
  
  // 4. Contains special character
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { score, label: 'Weak', colorClass: 'bg-red-500', textClass: 'text-red-500' };
  }
  if (score === 2) {
    return { score, label: 'Fair', colorClass: 'bg-amber-500', textClass: 'text-amber-500' };
  }
  if (score === 3) {
    return { score, label: 'Good', colorClass: 'bg-emerald-500', textClass: 'text-emerald-500' };
  }
  return { score, label: 'Strong', colorClass: 'bg-reg-primary-dark', textClass: 'text-reg-primary-dark' };
};

const PasswordStrengthMeter = ({ password }) => {
  const { score, label, colorClass, textClass } = getPasswordStrength(password);

  return (
    <div className="w-full mt-2 font-inter">
      {/* Visual bars */}
      <div className="flex items-center gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <div
              key={step}
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                isActive ? colorClass : 'bg-reg-border'
              }`}
            />
          );
        })}
      </div>

      {/* Label indicator */}
      {label && (
        <div className="flex justify-between items-center mt-1.5 text-[11px] font-bold">
          <span className="text-reg-text-sec">Password Strength:</span>
          <span className={`${textClass} uppercase tracking-wider`}>{label}</span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
