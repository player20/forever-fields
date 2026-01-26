"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  Check,
  X,
  Flower2,
  Loader2,
} from "lucide-react";

type VerifyState = "verifying" | "success" | "error";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { verifyMagicLink, isAuthenticated, error } = useAuth();
  const [state, setState] = useState<VerifyState>("verifying");

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }

    const verify = async () => {
      try {
        await verifyMagicLink(token);
        setState("success");
        // Redirect after success
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch {
        setState("error");
      }
    };

    verify();
  }, [token, verifyMagicLink, router]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && state === "success") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, state, router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Flower2 className="w-8 h-8 text-sage" />
            <span className="text-2xl font-serif font-bold text-sage-dark">
              Forever Fields
            </span>
          </Link>
        </div>

        <Card className="p-8 text-center">
          {/* Verifying State */}
          {state === "verifying" && (
            <>
              <div className="w-16 h-16 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-sage animate-spin" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                Verifying Your Link
              </h1>
              <p className="text-gray-body">
                Please wait while we sign you in...
              </p>
            </>
          )}

          {/* Success State */}
          {state === "success" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>
              <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                You&apos;re Signed In!
              </h1>
              <p className="text-gray-body mb-6">
                Redirecting you to your dashboard...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 text-sage animate-spin" />
              </div>
            </>
          )}

          {/* Error State */}
          {state === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                Link Invalid or Expired
              </h1>
              <p className="text-gray-body mb-6">
                {error || "This magic link is no longer valid. Please request a new one."}
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors text-center font-medium"
                >
                  Back to Login
                </Link>
                <p className="text-sm text-gray-body">
                  Magic links expire after 15 minutes for security.
                </p>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
