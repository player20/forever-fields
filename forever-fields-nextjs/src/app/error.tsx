"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RefreshCw, Home, Bug, HeartCrack } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console
    console.error("Route error:", error);

    // TODO: Send to error tracking service
    // reportError(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
          <HeartCrack className="w-10 h-10 text-error" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-serif font-bold text-gray-dark mb-3">
          We hit a bump in the road
        </h1>

        {/* Message */}
        <p className="text-gray-body mb-6 max-w-sm mx-auto">
          Something unexpected happened while loading this page. Your memories
          are safe &mdash; we just need a moment to recover.
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-body hover:text-gray-dark flex items-center gap-2 justify-center">
              <Bug className="w-4 h-4" />
              View error details
            </summary>
            <div className="mt-3 p-4 bg-gray-light/10 rounded-xl text-xs font-mono overflow-auto max-h-40">
              <p className="text-error font-semibold mb-2">
                {error.name}: {error.message}
              </p>
              {error.digest && (
                <p className="text-gray-body">Error ID: {error.digest}</p>
              )}
              {error.stack && (
                <pre className="mt-2 text-gray-body whitespace-pre-wrap text-[10px]">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Support text */}
        <p className="mt-8 text-sm text-gray-body">
          If this keeps happening, please{" "}
          <a href="/help" className="text-sage hover:text-sage-dark underline">
            contact our support team
          </a>
          .
        </p>

        {/* Error digest for support */}
        {error.digest && (
          <p className="mt-2 text-xs text-gray-light">
            Reference: {error.digest}
          </p>
        )}
      </Card>
    </div>
  );
}
