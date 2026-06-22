import { useState, useCallback } from 'react';
 
const initialFormState = {
  personal: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' },
  business: { storeName: '', businessType: 'Individual', businessCategory: 'Electronics', address: '', city: '', country: '', postalCode: '', taxId: '' },
  verification: { idFile: null, licenseFile: null, taxFile: null, agreeTerms: false, agreePrivacy: false },
};
 
export const useSellerForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success'
  const [errors, setErrors] = useState({});
 
  const updateField = useCallback((stepKey, fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [fieldName]: value,
      },
    }));
 
    // Clear error for this field as soon as user starts typing/editing
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);
 
  const validateStep = useCallback((currentStep, currentFormData) => {
    const newErrors = {};
 
    if (currentStep === 1) {
      const { firstName, lastName, email, phone, password, confirmPassword } = currentFormData.personal;
      if (!firstName.trim()) newErrors.firstName = 'First name is required';
      if (!lastName.trim()) newErrors.lastName = 'Last name is required';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) newErrors.email = 'Email address is required';
      else if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email address';
 
      if (!phone.trim()) newErrors.phone = 'Phone number is required';
      
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters long';
 
      if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';
    }
 
    if (currentStep === 2) {
      const { storeName, address, city, country, postalCode } = currentFormData.business;
      if (!storeName.trim()) newErrors.storeName = 'Store name is required';
      if (!address.trim()) newErrors.address = 'Store physical address is required';
      if (!city.trim()) newErrors.city = 'City is required';
      if (!country.trim()) newErrors.country = 'Country is required';
      if (!postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    }
 
    if (currentStep === 3) {
      const { idFile, agreeTerms, agreePrivacy } = currentFormData.verification;
      if (!idFile) newErrors.idFile = 'Identification document is required';
      if (!agreeTerms) newErrors.agreeTerms = 'You must agree to the Terms & Conditions';
      if (!agreePrivacy) newErrors.agreePrivacy = 'You must agree to the Privacy Policy';
    }
 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);
 
  const handleNext = useCallback(() => {
    setFormData((currData) => {
      setStep((currStep) => {
        if (validateStep(currStep, currData)) {
          return Math.min(currStep + 1, 3);
        }
        return currStep;
      });
      return currData;
    });
  }, [validateStep]);
 
  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);
 
  const setStepDirectly = useCallback((targetStep) => {
    setStep(targetStep);
    setErrors({});
  }, []);
 
  const submitForm = useCallback((e) => {
    if (e) e.preventDefault();
    setFormData((currData) => {
      if (!validateStep(3, currData)) return currData;
      setStatus('submitting');
      setTimeout(() => {
        setStatus('success');
      }, 1500);
      return currData;
    });
  }, [validateStep]);
 
  return {
    formData,
    step,
    status,
    errors,
    updateField,
    handleNext,
    handleBack,
    setStepDirectly,
    submitForm,
    setErrors
  };
};
