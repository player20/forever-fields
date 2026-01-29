"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  Check,
  Flower2,
  Eye,
  EyeOff,
} from "lucide-react";

type AuthMode = "magic" | "password";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const { login, requestMagicLink, loginWithGoogle, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Redirect if already authenticated (use useEffect to avoid setState during render)
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  // Show nothing while redirecting
  if (isAuthenticated) {
    return null;
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      await requestMagicLink(email);
      setMagicLinkSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch {
      // Error is handled by useAuth
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push(redirectTo);
    } catch {
      // Error is handled by useAuth
    }
  };

  // Magic Link Sent Success Screen
  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gold-pale flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-gold-dark" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-body mb-6">
              We sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-body mb-6">
              Click the link in the email to sign in. The link will expire in 15 minutes.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMagicLinkSent(false)}
              >
                Use a different email
              </Button>
              <button
                onClick={() => setMode("password")}
                className="text-sm text-sage hover:text-sage-dark"
              >
                Or sign in with password
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

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
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-body">
              Sign in to manage your memorials
            </p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex gap-2 p-1 bg-sage-pale/30 rounded-lg mb-6">
            <button
              onClick={() => { setMode("password"); clearError(); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === "password"
                  ? "bg-white shadow text-sage-dark"
                  : "text-gray-body hover:text-gray-dark"
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </button>
            <button
              onClick={() => { setMode("magic"); clearError(); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === "magic"
                  ? "bg-white shadow text-sage-dark"
                  : "text-gray-body hover:text-gray-dark"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Passwordless
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Magic Link Form */}
          {mode === "magic" && (
            <form onSubmit={handleMagicLink} className="space-y-4">
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
                    <span className="animate-spin">
                      <Flower2 className="w-4 h-4" />
                    </span>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Magic Link
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-xs text-gray-body text-center">
                We&apos;ll email you a secure link to sign in instantly.
                No password needed!
              </p>
            </form>
          )}

          {/* Password Form */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-dark">
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-sm text-sage hover:text-sage-dark"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">
                      <Flower2 className="w-4 h-4" />
                    </span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Social Login */}
          <div className="mt-6 pt-6 border-t border-sage-pale/50">
            <p className="text-sm text-gray-body text-center mb-4">
              Or continue with
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

          {/* Sign Up Link */}
          <div className="mt-6 pt-6 border-t border-sage-pale/50 text-center">
            <p className="text-gray-body">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-sage hover:text-sage-dark font-medium"
              >
                Create one
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
