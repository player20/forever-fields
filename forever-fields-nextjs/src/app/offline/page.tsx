"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { WifiOff, Home, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8 text-amber-600" />
        </div>

        <h1 className="text-2xl font-serif font-bold text-gray-dark mb-4">
          You&apos;re Offline
        </h1>

        <p className="text-gray-body mb-6">
          It looks like you&apos;ve lost your internet connection. Some features
          may be unavailable, but you can still view cached content.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Link href="/">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Tip: Previously viewed memorials are available offline.
        </p>
      </Card>
    </div>
  );
}
