import React from 'react';
import { AlertCircle } from 'lucide-react';
import { IS_DEVELOPMENT } from '../../../config/env';

/**
 * Error Boundary Component
 * Catches rendering errors in child components and displays fallback UI
 * Prevents entire page from crashing due to component errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging and monitoring
    console.error('Error caught by boundary:', error, errorInfo);
    // In production, you would send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full bg-red-50 border border-red-100 rounded-lg p-4 my-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 text-sm">
                Something went wrong
              </h3>
              <p className="text-red-700 text-sm mt-1">
                {IS_DEVELOPMENT
                  ? this.state.error?.message || 'An unexpected error occurred'
                  : 'We encountered an error. Please try refreshing the page.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
