"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallBannerProps {
  /** Delay before showing banner (ms) */
  delay?: number;
  /** Minimum page views before showing */
  minPageViews?: number;
  /** Don't show again for this many days after dismissal */
  dismissDays?: number;
}

export function PWAInstallBanner({
  delay = 5000,
  minPageViews = 2,
  dismissDays = 7,
}: PWAInstallBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Check if already installed or dismissed
  useEffect(() => {
    // Check if running as PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check dismissal
    const dismissedAt = localStorage.getItem("pwa_banner_dismissed");
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissal = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < dismissDays) return;
    }

    // Track page views
    const views = parseInt(localStorage.getItem("pwa_page_views") || "0") + 1;
    localStorage.setItem("pwa_page_views", String(views));

    if (views < minPageViews) return;

    // Listen for install prompt (Chrome/Edge/Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Show banner after delay
    const timer = setTimeout(() => {
      // On iOS, show manual instructions
      // On Android/Chrome, wait for beforeinstallprompt
      if (iOS || deferredPrompt) {
        setShowBanner(true);
      }
    }, delay);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(timer);
    };
  }, [delay, minPageViews, dismissDays, deferredPrompt]);

  // Show banner when prompt becomes available
  useEffect(() => {
    if (deferredPrompt && !isStandalone) {
      const timer = setTimeout(() => setShowBanner(true), delay);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, delay, isStandalone]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      // Track installation
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "pwa_installed",
            memorialId: null,
          }),
        });
      } catch {
        // Ignore analytics errors
      }
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem("pwa_banner_dismissed", new Date().toISOString());
    setShowBanner(false);
  }, []);

  // Don't render if already installed
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
        >
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-sage-pale overflow-hidden">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-4">
              {/* Icon and title */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shrink-0">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-dark text-lg">
                    Add Forever Fields to Home
                  </h3>
                  <p className="text-sm text-gray-body mt-1">
                    Quick access to memorials, offline viewing, and anniversary notifications
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { icon: "🕯️", label: "Quick candle lighting" },
                  { icon: "🔔", label: "Anniversary alerts" },
                  { icon: "📴", label: "Works offline" },
                ].map((benefit) => (
                  <div
                    key={benefit.label}
                    className="bg-sage-pale/50 rounded-lg py-2 px-1"
                  >
                    <span className="text-lg block">{benefit.icon}</span>
                    <span className="text-gray-600">{benefit.label}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-3">
                {isIOS ? (
                  // iOS instructions
                  <div className="flex-1">
                    <p className="text-sm text-gray-body mb-2 flex items-center gap-2">
                      <Share className="w-4 h-4" />
                      Tap <span className="font-medium">Share</span> then{" "}
                      <Plus className="w-4 h-4 inline" />{" "}
                      <span className="font-medium">Add to Home Screen</span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleDismiss}
                    >
                      Got it
                    </Button>
                  </div>
                ) : (
                  // Android/Chrome install button
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleDismiss}
                    >
                      Not now
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={handleInstall}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact PWA install button for header/nav
 */
export function PWAInstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setCanInstall(false);
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 px-3 py-1.5 bg-sage-pale text-sage-dark rounded-full text-sm font-medium hover:bg-sage-light transition-colors"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
}
