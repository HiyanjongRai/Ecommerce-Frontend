
import React from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { ToastProvider } from './shared/contexts/ToastContext';

const queryClient = new QueryClient();

function App() {
	return (
		<div className="App">
			<ErrorBoundary>
				<ToastProvider>
					<QueryClientProvider client={queryClient}>
						<BrowserRouter>
							<AppRoutes />
						</BrowserRouter>
					</QueryClientProvider>
				</ToastProvider>
			</ErrorBoundary>
		</div>
	);
}

export default App;
