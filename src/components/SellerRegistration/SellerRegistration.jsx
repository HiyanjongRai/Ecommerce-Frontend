import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import BrandPanel from './BrandPanel';
import Stepper from './Stepper';
import StepPersonalInfo from './StepPersonalInfo';
import StepBusinessInfo from './StepBusinessInfo';
import StepVerification from './StepVerification';
import SuccessScreen from './SuccessScreen';
import { useSellerForm } from '../../hooks/useSellerForm';
import { useCustomer } from '../../modules/customer/contexts/CustomerContext';
import { getSellerApplicationStatus, submitSellerApplication } from '../../modules/seller/services/sellerService';
import apiClient from '../../shared/api/apiClient';
import { setAccessToken } from '../../shared/api/authStorage';
 
const SellerRegistration = () => {
  const { user, logoutUser, refreshUser } = useCustomer();
  const location = useLocation();
  const hasNavbar = location.pathname === '/register';
  const {
    formData,
    step,
    status: formStatus,
    errors,
    updateField,
    handleNext,
    handleBack,
    setStepDirectly,
    submitForm: submitFormOriginal,
    setErrors,
  } = useSellerForm();

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [apiAppStatus, setApiAppStatus] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [isSubmittingApi, setIsSubmittingApi] = useState(false);

  // Fetch real seller application status if logged in
  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingStatus(true);
      const res = await getSellerApplicationStatus(user.id);
      if (res.data) {
        setApiAppStatus(res.data);
        // If rejected or pending, we handles UI routing states
        if (res.data.status === 'REJECTED') {
          setStepDirectly(2);
        }
      }
    } catch (err) {
      console.error('Failed to fetch seller status', err);
    } finally {
      setLoadingStatus(false);
    }
  }, [user?.id, setStepDirectly]);

  useEffect(() => {
    if (user?.id) {
      fetchStatus();
      setStepDirectly(2); // Logged in users bypass step 1
    }
  }, [user?.id, fetchStatus, setStepDirectly]);

  // Inline blur validation for required fields
  const onBlurField = (fieldName) => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (step === 1) {
      const { firstName, lastName, email, phone, password, confirmPassword } = formData.personal;
      if (fieldName === 'firstName' && !firstName.trim()) newErrors.firstName = 'First name is required';
      if (fieldName === 'lastName' && !lastName.trim()) newErrors.lastName = 'Last name is required';
      if (fieldName === 'email') {
        if (!email.trim()) newErrors.email = 'Email address is required';
        else if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email address';
      }
      if (fieldName === 'phone' && !phone.trim()) newErrors.phone = 'Phone number is required';
      if (fieldName === 'password') {
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters long';
      }
      if (fieldName === 'confirmPassword') {
        if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2) {
      const { storeName, address, city, country, postalCode } = formData.business;
      if (fieldName === 'storeName' && !storeName.trim()) newErrors.storeName = 'Store name is required';
      if (fieldName === 'address' && !address.trim()) newErrors.address = 'Store physical address is required';
      if (fieldName === 'city' && !city.trim()) newErrors.city = 'City is required';
      if (fieldName === 'country' && !country.trim()) newErrors.country = 'Country is required';
      if (fieldName === 'postalCode' && !postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    }

    setErrors((prev) => {
      const next = { ...prev, ...newErrors };
      if (!newErrors[fieldName]) {
        delete next[fieldName];
      }
      return next;
    });
  };

  const isStep3SubmitDisabled =
    step === 3 &&
    (!formData.verification.agreeTerms || !formData.verification.agreePrivacy);

  const getStepSubtitle = () => {
    if (step === 1) return 'Provide your personal details to secure your merchant profile.';
    if (step === 2) return 'Tell us about your store name, business categories, and physical location.';
    return 'Upload verification documents to comply with local merchant regulations.';
  };

  const submitForm = async (e) => {
    if (e) e.preventDefault();
 
    // Perform validation for active step before advancing/submitting
    const newErrors = {};
    if (step === 3) {
      const { idFile, agreeTerms, agreePrivacy } = formData.verification;
      if (!idFile) newErrors.idFile = 'Identification document is required';
      if (!agreeTerms) newErrors.agreeTerms = 'You must agree to the Terms & Conditions';
      if (!agreePrivacy) newErrors.agreePrivacy = 'You must agree to the Privacy Policy';
    }
 
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
 
    setIsSubmittingApi(true);
    setApiError(null);
    setApiSuccess(null);
 
    try {
      let targetUserId = user?.id;
 
      // If visitor is a guest, register their seller account first
      if (!targetUserId) {
        const personalData = formData.personal;
        const emailPrefix = personalData.email.split('@')[0];
        const uniqueUsername = `${emailPrefix}_${Math.floor(100 + Math.random() * 900)}`;
 
        const registerPayload = {
          username: uniqueUsername,
          fullName: `${personalData.firstName} ${personalData.lastName}`,
          email: personalData.email,
          password: personalData.password,
          contactNumber: personalData.phone,
        };
 
        const resReg = await apiClient.post('/auth/register/seller', registerPayload);
        const authData = resReg.data;
        if (!authData?.accessToken || !authData?.userId) {
          throw new Error('Registration succeeded, but auth credentials were not returned.');
        }
 
        setAccessToken(authData.accessToken);
        await refreshUser();
        targetUserId = authData.userId;
      }
 
      // Submit Document Onboarding Application
      const fd = new FormData();
      fd.append('userId', targetUserId);
      fd.append('storeName', formData.business.storeName);
      fd.append('address', formData.business.address);
      if (formData.verification.idFile) {
        fd.append('idDocument', formData.verification.idFile);
      }
      if (formData.verification.licenseFile) {
        fd.append('businessLicense', formData.verification.licenseFile);
      }
      if (formData.verification.taxFile) {
        fd.append('taxCertificate', formData.verification.taxFile);
      }
 
      const resApp = await submitSellerApplication(fd);
      setApiSuccess(resApp.data?.message || 'Application submitted successfully!');
      
      // Delay fetching status slightly to let DB transaction commit
      setTimeout(async () => {
        try {
          const statusRes = await getSellerApplicationStatus(targetUserId);
          if (statusRes.data) {
            setApiAppStatus(statusRes.data);
          }
        } catch (err) {
          console.error("Failed to query application status after submission", err);
        }
      }, 1500);
 
    } catch (err) {
      console.error("Seller registration/submission failed", err);
      setApiError(err.response?.data?.message || err.message || 'Submission failed. Please check field inputs and document uploads.');
    } finally {
      setIsSubmittingApi(false);
    }
  };

  const isSubmitting = isSubmittingApi || formStatus === 'submitting';

  return (
    <div className={`w-full bg-reg-bg flex select-none font-sans overflow-x-hidden ${
      hasNavbar 
        ? 'min-h-[calc(100vh-160px)]' 
        : 'min-h-screen'
    }`}>
      {/* Respect prefers-reduced-motion */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-delay: 0s !important;
            animation-duration: 0s !important;
            animation-iteration-count: 1 !important;
            transition-delay: 0s !important;
            transition-duration: 0s !important;
          }
        }
      `}</style>
 
      {/* Left split screen (40% width on large screens) */}
      <BrandPanel hasNavbar={hasNavbar} />
 
      {/* Right split screen (60% width) */}
      <div className={`lg:w-[60%] flex-shrink-0 flex-1 flex flex-col justify-center items-center px-4 overflow-y-auto w-full ${
        hasNavbar 
          ? 'py-6 lg:py-8 lg:px-12 lg:min-h-[calc(100vh-160px)]' 
          : 'py-12 lg:px-12 lg:min-h-screen'
      }`}>
        {loadingStatus ? (
          /* Verification Spinner */
          <div className="w-full max-w-[620px] bg-white rounded-[20px] p-10 border border-reg-border/80 shadow-[0_12px_40px_rgba(17,24,39,0.03)] flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 rounded-full border-4 border-reg-primary/20 border-t-reg-primary animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest font-bold text-reg-text-sec">Verifying merchant credentials...</p>
          </div>
        ) : apiAppStatus?.status === 'PENDING' ? (
          /* Under Review Screen */
          <div className="w-full max-w-[620px] bg-white rounded-[20px] p-8 md:p-12 border border-reg-border/80 shadow-[0_12px_40px_rgba(17,24,39,0.03)] flex flex-col items-center text-center font-inter">
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-6 shadow-sm relative">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/10 animate-pulse" />
              <svg className="w-10 h-10 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            
            <h2 className="font-poppins text-2xl md:text-3xl font-extrabold text-reg-accent tracking-tight leading-tight">
              Application Under Review
            </h2>
            <p className="text-sm font-semibold text-reg-text-sec mt-3 max-w-[420px] leading-relaxed">
              Hi <strong className="text-reg-accent">{user?.username}</strong>, your application is being audited by our trust & safety team. Reviews are completed within 12–24 hours.
            </p>

            <div className="w-full max-w-[380px] bg-reg-bg rounded-2xl border border-reg-border/40 p-5 mt-8 space-y-4 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-reg-border/50 text-xs">
                <span className="font-bold text-reg-text-sec">Application ID</span>
                <span className="font-extrabold text-reg-accent font-mono">#APP-{apiAppStatus.applicationId || 'PENDING'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-reg-text-sec">Submitted On</span>
                <span className="font-extrabold text-reg-accent font-mono">
                  {apiAppStatus.submittedAt ? new Date(apiAppStatus.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'}
                </span>
              </div>
            </div>

            <div className="flex gap-4 w-full max-w-[380px] mt-8">
              <button
                type="button"
                onClick={fetchStatus}
                className="flex-1 px-5 py-2.5 bg-white border border-reg-border hover:border-reg-primary hover:bg-reg-primary-light/35 text-reg-accent hover:text-reg-primary text-xs font-bold rounded-xl shadow-3xs hover:shadow-2xs transition-all duration-200 cursor-pointer active:scale-97 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-4 focus:ring-reg-primary/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                Refresh Status
              </button>
              
              <button
                type="button"
                onClick={logoutUser}
                className="px-5 py-2.5 bg-red-50 border border-red-100 hover:border-red-200 text-red-600 hover:bg-red-100/60 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-97 focus:outline-none focus:ring-4 focus:ring-red-100"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : formStatus === 'success' || apiSuccess ? (
          /* Card wrapping Success screen */
          <div className="w-full max-w-[620px] bg-white rounded-[20px] p-8 md:p-12 border border-reg-border/80 shadow-[0_12px_40px_rgba(17,24,39,0.03)]">
            <SuccessScreen />
          </div>
        ) : (
          /* Main Registration Container */
          <div className={`w-full max-w-[620px] ${hasNavbar ? 'space-y-4' : 'space-y-6'}`}>
            
            {/* Minimal Mobile Header */}
            <div className="lg:hidden flex justify-center w-full mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-reg-text-sec">
                Seller Registration
              </span>
            </div>

            {/* Main Form Card */}
            <div className={`w-full bg-white rounded-[20px] border border-reg-border/80 shadow-[0_12px_40px_rgba(17,24,39,0.03)] transition-all duration-300 relative ${
              hasNavbar 
                ? 'p-5 md:p-8' 
                : 'p-6 md:p-10'
            }`}>
              
              {/* Logged-in Switch Account / Logout trigger */}
              {user?.id && (
                <button
                  type="button"
                  onClick={logoutUser}
                  className="absolute right-6 top-6 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200 text-red-500 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-100 flex items-center gap-1 bg-transparent"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  Log Out
                </button>
              )}

              {/* Card Header */}
              <div className="space-y-1 pr-24">
                <h1 className="font-poppins text-2xl md:text-3xl font-extrabold text-reg-accent tracking-tight leading-tight">
                  Create Seller Account
                </h1>
                <p className="text-xs md:text-sm font-semibold text-reg-text-sec leading-relaxed">
                  {getStepSubtitle()}
                </p>
              </div>

              {/* Warnings / Rejection banners */}
              {apiAppStatus?.status === 'REJECTED' && (
                <div className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col gap-1.5 font-inter">
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Application Rejected
                  </span>
                  <p className="text-xs text-reg-text-sec leading-relaxed font-semibold">
                    {apiAppStatus.message || 'Please correct your uploaded details and documents to re-submit.'}
                  </p>
                  {apiAppStatus.reviewNote && (
                    <div className="mt-1 px-3 py-2 bg-white rounded-lg border border-red-100 text-[11px] text-reg-text-sec">
                      <strong className="text-red-600">Admin Feedback:</strong> {apiAppStatus.reviewNote}
                    </div>
                  )}
                </div>
              )}

              {/* API Errors */}
              {apiError && (
                <div className="mt-6 p-3 rounded-xl border border-red-200 bg-red-50/30 flex items-center gap-2 text-xs font-bold text-red-600 leading-snug">
                  <svg className="w-4.5 h-4.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  {apiError}
                </div>
              )}

              {/* Progress Stepper */}
              <div className="mt-6 md:mt-8 border-y border-reg-border/40 py-2">
                <Stepper currentStep={step} onStepClick={setStepDirectly} />
              </div>

              {/* Step Forms */}
              <form onSubmit={submitForm} className="mt-6 md:mt-8">
                {step === 1 && (
                  <StepPersonalInfo
                    data={formData.personal}
                    errors={errors}
                    updateField={updateField}
                    onBlurField={onBlurField}
                  />
                )}

                {step === 2 && (
                  <StepBusinessInfo
                    data={formData.business}
                    errors={errors}
                    updateField={updateField}
                    onBlurField={onBlurField}
                  />
                )}

                {step === 3 && (
                  <StepVerification
                    data={formData.verification}
                    errors={errors}
                    updateField={updateField}
                  />
                )}

                {/* Navigation Actions Row */}
                <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-reg-border/40">
                  {/* Back button */}
                  {step > (user?.id ? 2 : 1) ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl border border-reg-border hover:border-gray-300 text-reg-accent text-sm font-bold bg-white hover:bg-gray-50/50 shadow-2xs transition-all duration-200 cursor-pointer active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 focus:outline-none focus:ring-4 focus:ring-reg-primary/10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                      Back
                    </button>
                  ) : (
                    <div /> // Spacer if first step
                  )}

                  {/* Continue / Submit button */}
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-reg-primary hover:bg-reg-primary-dark text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-[0_4px_15px_rgba(22,163,74,0.15)] transition-all duration-200 cursor-pointer active:scale-97 focus:outline-none focus:ring-4 focus:ring-reg-primary/20 flex items-center gap-1.5"
                    >
                      Continue
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isStep3SubmitDisabled || isSubmitting}
                      className={`h-11 px-6 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer ${
                        isStep3SubmitDisabled
                          ? 'bg-reg-primary/40 text-white/80 cursor-not-allowed'
                          : 'bg-reg-primary hover:bg-reg-primary-dark text-white shadow-xs hover:shadow-[0_4px_15px_rgba(22,163,74,0.15)] active:scale-97 focus:outline-none focus:ring-4 focus:ring-reg-primary/20'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            {/* Card Footer Help Links */}
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-reg-text-sec select-none">
              <a href="#help" onClick={(e) => e.preventDefault()} className="hover:text-reg-primary hover:underline transition-all">
                Need Help?
              </a>
              <span className="text-reg-border font-light select-none">|</span>
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-reg-primary hover:underline transition-all">
                Privacy Policy
              </a>
              <span className="text-reg-border font-light select-none">|</span>
              <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-reg-primary hover:underline transition-all">
                Terms of Service
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default SellerRegistration;
