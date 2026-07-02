import React from 'react';
import StatusPage from '../StatusPage/StatusPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep technical details out of the UI; log for diagnostics only.
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <StatusPage code="500" onRetry={this.handleReload} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
