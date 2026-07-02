import React, { useState } from 'react';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import SocialAuthRow from './SocialAuthRow';

const StepPersonalInfo = ({ data, errors, updateField, onBlurField }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 font-inter">
      {/* Name fields row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="flex flex-col">
          <label 
            htmlFor="firstName" 
            className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
          >
            First Name <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            value={data.firstName}
            onChange={(e) => updateField('personal', 'firstName', e.target.value)}
            onBlur={() => onBlurField('firstName')}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
              errors.firstName 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-reg-border focus:border-reg-primary'
            }`}
            placeholder="John"
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            required
          />
          {errors.firstName && (
            <p id="firstName-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
              {errors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div className="flex flex-col">
          <label 
            htmlFor="lastName" 
            className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
          >
            Last Name <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            value={data.lastName}
            onChange={(e) => updateField('personal', 'lastName', e.target.value)}
            onBlur={() => onBlurField('lastName')}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
              errors.lastName 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-reg-border focus:border-reg-primary'
            }`}
            placeholder="Doe"
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            required
          />
          {errors.lastName && (
            <p id="lastName-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email Address */}
      <div className="flex flex-col">
        <label 
          htmlFor="email" 
          className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
        >
          Email Address <span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={data.email}
          onChange={(e) => updateField('personal', 'email', e.target.value)}
          onBlur={() => onBlurField('email')}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
            errors.email 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-reg-border focus:border-reg-primary'
          }`}
          placeholder="john.doe@example.com"
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div className="flex flex-col">
        <label 
          htmlFor="phone" 
          className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
        >
          Phone Number <span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={data.phone}
          onChange={(e) => updateField('personal', 'phone', e.target.value)}
          onBlur={() => onBlurField('phone')}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
            errors.phone 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-reg-border focus:border-reg-primary'
          }`}
          placeholder="+977 98XXXXXXXX"
          aria-describedby={errors.phone ? "phone-error" : undefined}
          required
        />
        {errors.phone && (
          <p id="phone-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="flex flex-col relative">
        <label 
          htmlFor="password" 
          className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
        >
          Password <span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={data.password}
            onChange={(e) => updateField('personal', 'password', e.target.value)}
            onBlur={() => onBlurField('password')}
            className={`w-full pl-4 pr-11 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
              errors.password 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-reg-border focus:border-reg-primary'
            }`}
            placeholder="Create password"
            aria-describedby={errors.password ? "password-error" : undefined}
            required
          />
          {/* Eye Icon for toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-reg-placeholder hover:text-reg-text-sec focus:outline-none focus:text-reg-primary p-0.5 rounded cursor-pointer bg-transparent border-0 flex items-center justify-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.815 7.815L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>
        {/* Strength meter */}
        <PasswordStrengthMeter password={data.password} />
        {errors.password && (
          <p id="password-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password field */}
      <div className="flex flex-col relative">
        <label 
          htmlFor="confirmPassword" 
          className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
        >
          Confirm Password <span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative w-full">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={data.confirmPassword}
            onChange={(e) => updateField('personal', 'confirmPassword', e.target.value)}
            onBlur={() => onBlurField('confirmPassword')}
            className={`w-full pl-4 pr-11 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
              errors.confirmPassword 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-reg-border focus:border-reg-primary'
            }`}
            placeholder="Confirm your password"
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            required
          />
          {/* Eye Icon for toggle */}
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-reg-placeholder hover:text-reg-text-sec focus:outline-none focus:text-reg-primary p-0.5 rounded cursor-pointer bg-transparent border-0 flex items-center justify-center"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.815 7.815L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Social login integration */}
      <SocialAuthRow />
    </div>
  );
};

export default StepPersonalInfo;
