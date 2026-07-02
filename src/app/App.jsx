
import React from 'react';
import './App.css';
import AppRoutes from './routes/AppRoutes';
import AppProviders from './providers/AppProviders';

function App() {
	return (
		<div className="App">
			<AppProviders>
				<AppRoutes />
			</AppProviders>
		</div>
	);
}

export default App;
