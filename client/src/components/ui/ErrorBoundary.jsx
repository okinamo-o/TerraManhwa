import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-terra-bg text-terra-text p-8">
          <h1 className="font-display text-5xl text-terra-red mb-4">SOMETHING BROKE</h1>
          <p className="text-terra-muted text-lg mb-6 max-w-md text-center">
            An unexpected error occurred. Please refresh the page or go back home.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-terra-red text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
