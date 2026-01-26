"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  ArrowLeft,
  Flower2,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

type ResetStep = "request" | "sent" | "reset" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { requestPasswordReset, resetPassword, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState<ResetStep>(token ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordRequirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[a-z]/.test(password), text: "One lowercase letter" },
    { met: /[0-9]/.test(password), text: "One number" },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.met);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      await requestPasswordReset(email);
      setStep("sent");
      toast.success("Reset link sent! Check your email.");
    } catch {
      // Error handled by useAuth
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!allRequirementsMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    try {
      await resetPassword(token, password);
      setStep("success");
      toast.success("Password reset successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      // Error handled by useAuth
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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

        <Card className="p-8">
          {/* Step: Request Reset */}
          {step === "request" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-body">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Flower2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Step: Email Sent */}
          {step === "sent" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-sage" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                Check Your Email
              </h1>
              <p className="text-gray-body mb-6">
                We sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-body mb-6">
                The link will expire in 1 hour for security.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep("request")}
              >
                Try a different email
              </Button>
            </div>
          )}

          {/* Step: Reset Password Form */}
          {step === "reset" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                  Create New Password
                </h1>
                <p className="text-gray-body">
                  Enter your new password below
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {passwordRequirements.map((req, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 text-xs ${
                            req.met ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          <Check className={`w-3 h-3 ${req.met ? "opacity-100" : "opacity-30"}`} />
                          {req.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? "border-green-300"
                            : "border-red-300"
                          : "border-sage-pale"
                      }`}
                      required
                    />
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Flower2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>
              <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                Password Reset!
              </h1>
              <p className="text-gray-body mb-6">
                Your password has been updated successfully.
              </p>
              <p className="text-sm text-gray-body">
                Redirecting to login...
              </p>
            </div>
          )}

          {/* Back to Login */}
          {(step === "request" || step === "reset") && (
            <div className="mt-6 pt-6 border-t border-sage-pale/50 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sage hover:text-sage-dark"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
