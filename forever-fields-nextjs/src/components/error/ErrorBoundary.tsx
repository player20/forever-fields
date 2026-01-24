"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, RefreshCw, Home, Bug, Phone } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught error:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error tracking service (Sentry, etc.)
    // reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when resetKey changes
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>

            <h2 className="text-xl font-serif font-semibold text-gray-dark mb-2">
              Something went wrong
            </h2>

            <p className="text-gray-body mb-6">
              We&apos;re sorry, but something unexpected happened. Please try
              refreshing the page or going back to the home page.
            </p>

            {/* Error details (development only or if showDetails is true) */}
            {(process.env.NODE_ENV === "development" || this.props.showDetails) &&
              this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-body hover:text-gray-dark flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Technical details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-light/10 rounded-lg text-xs font-mono overflow-auto max-h-32">
                    <p className="text-error font-semibold">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="mt-2 text-gray-body whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="primary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Support link */}
            <p className="mt-6 text-sm text-gray-body">
              If this keeps happening,{" "}
              <a
                href="/help"
                className="text-sage hover:text-sage-dark underline inline-flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                contact support
              </a>
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
interface UseErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

export function ErrorBoundaryWithReset({ children, onReset }: UseErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error("Error caught:", error);
        onReset?.();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
