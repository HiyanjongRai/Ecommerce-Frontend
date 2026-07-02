import React from 'react';
import FileUploadDropzone from './FileUploadDropzone';

const StepVerification = ({ data, errors, updateField }) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-300 font-inter">
      <div className="space-y-4">
        {/* Identity Document Dropzone */}
        <FileUploadDropzone
          label="Citizenship or ID Card"
          id="idFile"
          file={data.idFile}
          onChange={(file) => updateField('verification', 'idFile', file)}
          required={true}
          error={errors.idFile}
        />

        {/* Business License Dropzone */}
        <FileUploadDropzone
          label="Business License"
          id="licenseFile"
          file={data.licenseFile}
          onChange={(file) => updateField('verification', 'licenseFile', file)}
          required={false}
          error={errors.licenseFile}
        />

        {/* PAN / VAT Certificate Dropzone */}
        <FileUploadDropzone
          label="PAN / VAT Certificate"
          id="taxFile"
          file={data.taxFile}
          onChange={(file) => updateField('verification', 'taxFile', file)}
          required={false}
          error={errors.taxFile}
        />
      </div>

      <hr className="border-reg-border/50 my-5" />

      {/* Compliance Checkboxes */}
      <div className="space-y-3.5 pt-1">
        {/* Terms and Conditions */}
        <div className="flex flex-col">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={data.agreeTerms}
              onChange={(e) => updateField('verification', 'agreeTerms', e.target.checked)}
              className="mt-1 w-4.5 h-4.5 rounded text-reg-primary border-reg-border focus:ring-reg-primary/20 focus:ring-2 cursor-pointer transition-all accent-reg-primary"
              aria-describedby={errors.agreeTerms ? "agreeTerms-error" : undefined}
              required
            />
            <span className="text-xs font-semibold text-reg-accent select-none leading-relaxed">
              I agree to the{' '}
              <a 
                href="#terms" 
                onClick={(e) => e.preventDefault()} 
                className="text-reg-primary hover:text-reg-primary-dark hover:underline font-bold transition-all"
              >
                Terms & Conditions
              </a>
            </span>
          </label>
          {errors.agreeTerms && (
            <p id="agreeTerms-error" className="text-[11px] text-red-500 font-bold mt-1 ml-7.5 leading-none">
              {errors.agreeTerms}
            </p>
          )}
        </div>

        {/* Privacy Policy */}
        <div className="flex flex-col">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              id="agreePrivacy"
              checked={data.agreePrivacy}
              onChange={(e) => updateField('verification', 'agreePrivacy', e.target.checked)}
              className="mt-1 w-4.5 h-4.5 rounded text-reg-primary border-reg-border focus:ring-reg-primary/20 focus:ring-2 cursor-pointer transition-all accent-reg-primary"
              aria-describedby={errors.agreePrivacy ? "agreePrivacy-error" : undefined}
              required
            />
            <span className="text-xs font-semibold text-reg-accent select-none leading-relaxed">
              I agree to the{' '}
              <a 
                href="#privacy" 
                onClick={(e) => e.preventDefault()} 
                className="text-reg-primary hover:text-reg-primary-dark hover:underline font-bold transition-all"
              >
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.agreePrivacy && (
            <p id="agreePrivacy-error" className="text-[11px] text-red-500 font-bold mt-1 ml-7.5 leading-none">
              {errors.agreePrivacy}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepVerification;
