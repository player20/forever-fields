"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Flower2,
  Check,
  X,
  Users,
  Edit3,
  Eye,
  Loader2,
  Mail,
  Lock,
} from "lucide-react";

type InviteState = "loading" | "valid" | "expired" | "accepted" | "error";
type InviteRole = "editor" | "viewer";

interface Invitation {
  id: string;
  memorialId: string;
  memorialName: string;
  memorialPhoto?: string;
  invitedBy: string;
  role: InviteRole;
  email: string;
  expiresAt: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { user, isAuthenticated, isLoading: authLoading, login, register } = useAuth();

  const [state, setState] = useState<InviteState>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Auth form state (for non-authenticated users)
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        // API call would go here
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate valid invitation
        const mockInvitation: Invitation = {
          id: "inv_123",
          memorialId: "mem_456",
          memorialName: "Margaret Rose Sullivan",
          memorialPhoto: "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?w=200",
          invitedBy: "Jane Smith",
          role: "editor",
          email: "invited@example.com",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        setInvitation(mockInvitation);
        setEmail(mockInvitation.email);
        setState("valid");
      } catch {
        setState("error");
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    setIsAccepting(true);
    try {
      // API call to accept invitation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setState("accepted");
      toast.success("Invitation accepted! Welcome to the memorial.");

      // Redirect to memorial after short delay
      setTimeout(() => {
        router.push(`/memorial/${invitation.memorialId}`);
      }, 2000);
    } catch {
      toast.error("Failed to accept invitation");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      if (authMode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      // Auth successful, now accept invitation
      handleAcceptInvitation();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  const roleInfo = {
    editor: {
      icon: Edit3,
      label: "Editor",
      description: "You can add photos, memories, and edit content",
    },
    viewer: {
      icon: Eye,
      label: "Viewer",
      description: "You can view the memorial and light candles",
    },
  };

  // Loading state
  if (state === "loading" || authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 text-sage animate-spin mx-auto mb-4" />
          <p className="text-gray-body">Loading invitation...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (state === "error" || state === "expired") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
              {state === "expired" ? "Invitation Expired" : "Invalid Invitation"}
            </h1>
            <p className="text-gray-body mb-6">
              {state === "expired"
                ? "This invitation has expired. Please ask for a new invitation."
                : "This invitation link is invalid or has already been used."}
            </p>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Accepted state
  if (state === "accepted") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-8 h-8 text-green-600" />
            </motion.div>
            <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
              Welcome!
            </h1>
            <p className="text-gray-body mb-4">
              You now have access to {invitation?.memorialName}&apos;s memorial.
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-5 h-5 text-sage animate-spin" />
            </div>
            <p className="text-sm text-gray-body mt-2">
              Redirecting to memorial...
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Valid invitation - show details
  if (!invitation) return null;

  const RoleIcon = roleInfo[invitation.role].icon;

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
          {/* Invitation Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-4 overflow-hidden relative">
              {invitation.memorialPhoto ? (
                <Image
                  src={invitation.memorialPhoto}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <Users className="w-10 h-10 text-sage" />
              )}
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
              You&apos;re Invited
            </h1>
            <p className="text-gray-body">
              <strong>{invitation.invitedBy}</strong> has invited you to{" "}
              collaborate on the memorial for
            </p>
            <p className="text-lg font-serif font-semibold text-sage-dark mt-1">
              {invitation.memorialName}
            </p>
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-sage-pale/30 mb-6">
            <RoleIcon className="w-5 h-5 text-sage" />
            <div className="text-center">
              <span className="font-medium text-gray-dark">
                {roleInfo[invitation.role].label}
              </span>
              <p className="text-xs text-gray-body">
                {roleInfo[invitation.role].description}
              </p>
            </div>
          </div>

          {/* Already authenticated - just accept */}
          {isAuthenticated && user ? (
            <div className="space-y-4">
              <p className="text-center text-gray-body">
                Signed in as <strong>{user.email}</strong>
              </p>
              <Button
                onClick={handleAcceptInvitation}
                className="w-full"
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <span className="flex items-center gap-2">
                    <Flower2 className="w-4 h-4 animate-spin" />
                    Accepting...
                  </span>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
              <p className="text-center text-sm text-gray-body">
                Not you?{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="text-sage hover:text-sage-dark"
                >
                  Sign in with different account
                </button>
              </p>
            </div>
          ) : (
            /* Not authenticated - show auth form */
            <>
              {/* Auth Mode Toggle */}
              <div className="flex gap-2 p-1 bg-sage-pale/30 rounded-lg mb-4">
                <button
                  onClick={() => setAuthMode("signup")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    authMode === "signup"
                      ? "bg-white shadow text-sage-dark"
                      : "text-gray-body hover:text-gray-dark"
                  }`}
                >
                  Create Account
                </button>
                <button
                  onClick={() => setAuthMode("login")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    authMode === "login"
                      ? "bg-white shadow text-sage-dark"
                      : "text-gray-body hover:text-gray-dark"
                  }`}
                >
                  Sign In
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                )}

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
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={authMode === "signup" ? "Create a password" : "Your password"}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {authMode === "signup"
                    ? "Create Account & Accept"
                    : "Sign In & Accept"}
                </Button>
              </form>
            </>
          )}
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
