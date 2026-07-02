import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from '../../shared/components/ErrorState/ErrorBoundary';
import { ToastProvider } from '../../shared/contexts/ToastContext';
import { queryClient } from '../store/queryClient';

export default function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
