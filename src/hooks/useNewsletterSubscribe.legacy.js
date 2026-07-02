import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing newsletter subscription
 * Handles email input, validation, submission, and feedback
 * 
 * @returns {Object} Subscription state and handlers
 */
export function useNewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate email format
   */
  const isValidEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  /**
   * Handle newsletter subscription
   */
  const handleSubscribe = useCallback((e) => {
    e.preventDefault();

    // Validation
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    // Simulate API call - replace with actual API call
    setTimeout(() => {
      try {
        // TODO: Replace with actual newsletter API call
        // const response = await subscribeToNewsletter(email);

        setSubscribed(true);
        setEmail('');
        toast.success('Subscribed! Check your inbox for exclusive offers.');

        // Reset success state after 4 seconds
        setTimeout(() => {
          setSubscribed(false);
        }, 4000);
      } catch (error) {
        console.error('Subscription error:', error);
        toast.error('Failed to subscribe. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, [email, isValidEmail]);

  return {
    email,
    setEmail,
    subscribed,
    isLoading,
    handleSubscribe,
  };
}

export default useNewsletterSubscribe;
