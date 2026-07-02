import React from 'react';
import StorePreviewCard from './StorePreviewCard';

const BUSINESS_TYPES = ['Individual', 'Company', 'Brand', 'Distributor'];
const BUSINESS_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Beauty',
  'Home & Living',
  'Grocery',
  'Sports',
  'Others',
];

const StepBusinessInfo = ({ data, errors, updateField, onBlurField }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-inter">
      {/* Live Store Preview */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-reg-accent uppercase tracking-wider block">
          Live Storefront Preview
        </label>
        <StorePreviewCard
          storeName={data.storeName}
          businessCategory={data.businessCategory}
          city={data.city}
          country={data.country}
        />
      </div>

      <hr className="border-reg-border/50" />

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Store Name & Business Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Store Name */}
          <div className="flex flex-col">
            <label
              htmlFor="storeName"
              className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
            >
              Store Name <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              id="storeName"
              value={data.storeName}
              onChange={(e) => updateField('business', 'storeName', e.target.value)}
              onBlur={() => onBlurField('storeName')}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
                errors.storeName
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-reg-border focus:border-reg-primary'
              }`}
              placeholder="e.g. Himalayan Crafts"
              aria-describedby={errors.storeName ? "storeName-error" : undefined}
              required
            />
            {errors.storeName && (
              <p id="storeName-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
                {errors.storeName}
              </p>
            )}
          </div>

          {/* Business Type */}
          <div className="flex flex-col">
            <label
              htmlFor="businessType"
              className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
            >
              Business Type <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="businessType"
              value={data.businessType}
              onChange={(e) => updateField('business', 'businessType', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-reg-border focus:border-reg-primary text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 bg-white cursor-pointer"
              required
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Business Category */}
        <div className="flex flex-col">
          <label
            htmlFor="businessCategory"
            className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
          >
            Business Category <span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="businessCategory"
            value={data.businessCategory}
            onChange={(e) => updateField('business', 'businessCategory', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-reg-border focus:border-reg-primary text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 bg-white cursor-pointer"
            required
          >
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Business Address */}
        <div className="flex flex-col">
          <label
            htmlFor="address"
            className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
          >
            Store Physical Address <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            id="address"
            value={data.address}
            onChange={(e) => updateField('business', 'address', e.target.value)}
            onBlur={() => onBlurField('address')}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
              errors.address
                ? 'border-red-500 focus:border-red-500'
                : 'border-reg-border focus:border-reg-primary'
            }`}
            placeholder="Street address, building, suite"
            aria-describedby={errors.address ? "address-error" : undefined}
            required
          />
          {errors.address && (
            <p id="address-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
              {errors.address}
            </p>
          )}
        </div>

        {/* City & Country side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div className="flex flex-col">
            <label
              htmlFor="city"
              className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
            >
              City <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              id="city"
              value={data.city}
              onChange={(e) => updateField('business', 'city', e.target.value)}
              onBlur={() => onBlurField('city')}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
                errors.city
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-reg-border focus:border-reg-primary'
              }`}
              placeholder="Kathmandu"
              aria-describedby={errors.city ? "city-error" : undefined}
              required
            />
            {errors.city && (
              <p id="city-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
                {errors.city}
              </p>
            )}
          </div>

          {/* Country */}
          <div className="flex flex-col">
            <label
              htmlFor="country"
              className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
            >
              Country <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              id="country"
              value={data.country}
              onChange={(e) => updateField('business', 'country', e.target.value)}
              onBlur={() => onBlurField('country')}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
                errors.country
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-reg-border focus:border-reg-primary'
              }`}
              placeholder="Nepal"
              aria-describedby={errors.country ? "country-error" : undefined}
              required
            />
            {errors.country && (
              <p id="country-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
                {errors.country}
              </p>
            )}
          </div>
        </div>

        {/* Postal Code & Tax ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Postal Code */}
          <div className="flex flex-col">
            <label
              htmlFor="postalCode"
              className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider flex items-center"
            >
              Postal Code <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              id="postalCode"
              value={data.postalCode}
              onChange={(e) => updateField('business', 'postalCode', e.target.value)}
              onBlur={() => onBlurField('postalCode')}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15 ${
                errors.postalCode
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-reg-border focus:border-reg-primary'
              }`}
              placeholder="44600"
              aria-describedby={errors.postalCode ? "postalCode-error" : undefined}
              required
            />
            {errors.postalCode && (
              <p id="postalCode-error" className="text-xs text-red-500 font-bold mt-1.5 leading-none">
                {errors.postalCode}
              </p>
            )}
          </div>

          {/* Tax/VAT ID (Optional) */}
          <div className="flex flex-col">
            <label
              htmlFor="taxId"
              className="text-xs font-bold text-reg-accent mb-1.5 uppercase tracking-wider"
            >
              Tax/VAT Number <span className="text-reg-text-sec text-[10px] lowercase font-semibold ml-1">(optional)</span>
            </label>
            <input
              type="text"
              id="taxId"
              value={data.taxId}
              onChange={(e) => updateField('business', 'taxId', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-reg-border focus:border-reg-primary text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 focus:ring-reg-primary/15"
              placeholder="e.g. 609823412"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepBusinessInfo;
