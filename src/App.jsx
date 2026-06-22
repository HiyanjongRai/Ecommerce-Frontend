
import React from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { ToastProvider } from './shared/contexts/ToastContext';

function App() {
	return (
		<div className="App">
			<ErrorBoundary>
				<ToastProvider>
					<BrowserRouter>
						<AppRoutes />
					</BrowserRouter>
				</ToastProvider>
			</ErrorBoundary>
		</div>
	);
}

export default App;
