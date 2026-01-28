"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Flower2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { register, loginWithGoogle, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Redirect if already authenticated (use useEffect to avoid setState during render)
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Show nothing while redirecting
  if (isAuthenticated) {
    return null;
  }

  const passwordRequirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[a-z]/.test(password), text: "One lowercase letter" },
    { met: /[0-9]/.test(password), text: "One number" },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.met);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!allRequirementsMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    if (!acceptTerms) {
      toast.error("Please accept the terms of service");
      return;
    }

    try {
      await register(email, password, name || undefined);
      toast.success("Account created! Welcome to Forever Fields.");
      router.push("/dashboard");
    } catch {
      // Error is handled by useAuth
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 py-12">
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
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-body">
              Start preserving precious memories today
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">
                Your Name <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hidden sm:block" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-3 sm:pl-10 pr-4 py-2 md:py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hidden sm:block" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-3 sm:pl-10 pr-4 py-2 md:py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hidden sm:block" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full pl-3 sm:pl-10 pr-12 py-2 md:py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
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

              {/* Password Requirements */}
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hidden sm:block" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full pl-3 sm:pl-10 pr-4 py-2 md:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent ${
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

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-sage-pale text-sage focus:ring-sage"
              />
              <label htmlFor="terms" className="text-sm text-gray-body">
                I agree to the{" "}
                <Link href="/terms" className="text-sage hover:text-sage-dark">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-sage hover:text-sage-dark">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !allRequirementsMet || !passwordsMatch || !acceptTerms}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">
                    <Flower2 className="w-4 h-4" />
                  </span>
                  Setting things up...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Social Login */}
          <div className="mt-6 pt-6 border-t border-sage-pale/50">
            <p className="text-sm text-gray-body text-center mb-4">
              Or sign up with
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={loginWithGoogle}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 pt-6 border-t border-sage-pale/50 text-center">
            <p className="text-gray-body">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-sage hover:text-sage-dark font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-body hover:text-sage">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
