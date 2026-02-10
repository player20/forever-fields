"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry if available (package is optional)
    import(/* webpackIgnore: true */ "@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(error))
      .catch(() => {});
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-coral/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-coral" />
          </div>
        </div>

        <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
          Something went wrong
        </h1>

        <p className="text-gray-body mb-6">
          We encountered an unexpected error. Our team has been notified and is
          working to fix this issue.
        </p>

        {error.digest && (
          <p className="text-sm text-gray-muted mb-6">
            Reference: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => reset()} variant="primary">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-muted">
            If this problem persists, please{" "}
            <a
              href="mailto:support@foreverfields.com"
              className="text-sage hover:underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
