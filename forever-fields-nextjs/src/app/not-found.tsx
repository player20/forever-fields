"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/layout/Header";
import { FadeIn, SlideUp } from "@/components/motion";
import { Flower2, Home, Search, ArrowLeft, Heart } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <FadeIn>
          <Card className="p-8 sm:p-12 text-center">
            {/* Illustration */}
            <SlideUp delay={0.1}>
              <div className="relative w-32 h-32 mx-auto mb-8">
                {/* Wilting flower */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-sage-pale/50 flex items-center justify-center">
                    <Flower2 className="w-12 h-12 text-sage/50" />
                  </div>
                </div>
                {/* 404 badge */}
                <div className="absolute -top-2 -right-2 bg-gold text-white text-xs font-bold px-2 py-1 rounded-full">
                  404
                </div>
              </div>
            </SlideUp>

            {/* Title */}
            <SlideUp delay={0.2}>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-4">
                Page Not Found
              </h1>
            </SlideUp>

            {/* Description */}
            <SlideUp delay={0.3}>
              <p className="text-lg text-gray-body max-w-md mx-auto mb-8">
                We couldn&apos;t find the page you&apos;re looking for. It may
                have been moved, deleted, or perhaps never existed.
              </p>
            </SlideUp>

            {/* Suggestions */}
            <SlideUp delay={0.4}>
              <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <Link
                  href="/"
                  className="p-4 rounded-xl bg-sage-pale/30 hover:bg-sage-pale/50 transition-colors group"
                >
                  <Home className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-gray-dark">Home</p>
                  <p className="text-xs text-gray-body">Return to start</p>
                </Link>

                <Link
                  href="/memorials"
                  className="p-4 rounded-xl bg-sage-pale/30 hover:bg-sage-pale/50 transition-colors group"
                >
                  <Heart className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-gray-dark">Memorials</p>
                  <p className="text-xs text-gray-body">Browse memorials</p>
                </Link>

                <Link
                  href="/help"
                  className="p-4 rounded-xl bg-sage-pale/30 hover:bg-sage-pale/50 transition-colors group"
                >
                  <Search className="w-6 h-6 text-sage mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-gray-dark">Help</p>
                  <p className="text-xs text-gray-body">Get support</p>
                </Link>
              </div>
            </SlideUp>

            {/* Actions */}
            <SlideUp delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Link href="/">
                  <Button size="lg">
                    <Home className="w-4 h-4 mr-2" />
                    Return Home
                  </Button>
                </Link>
              </div>
            </SlideUp>

            {/* Help text */}
            <SlideUp delay={0.6}>
              <p className="mt-8 text-sm text-gray-body">
                Looking for a specific memorial?{" "}
                <Link
                  href="/search"
                  className="text-sage hover:text-sage-dark underline"
                >
                  Try searching
                </Link>
              </p>
            </SlideUp>
          </Card>
        </FadeIn>
      </main>
    </div>
  );
}
