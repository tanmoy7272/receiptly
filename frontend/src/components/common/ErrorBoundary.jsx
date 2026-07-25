import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
          <Card className="max-w-md text-center p-8 border-red-200 bg-red-50/30">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Something went wrong on our side</h1>
            <p className="mt-2 text-sm text-slate-600">
              We couldn't load this view right now. Please try reloading the page or return to your dashboard.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="primary" onClick={this.handleReload} className="w-full sm:w-auto gap-2">
                <RefreshCw className="h-4 w-4" /> Reload Page
              </Button>
              <Button variant="outline" onClick={this.handleGoDashboard} className="w-full sm:w-auto gap-2">
                <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
