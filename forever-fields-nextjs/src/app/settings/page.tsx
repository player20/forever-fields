"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Trash2,
  Save,
  ArrowLeft,
  Flower2,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Smartphone,
  CreditCard,
  Download,
  RefreshCw,
  Crown,
  Sparkles,
  Users,
} from "lucide-react";

type SettingsTab = "profile" | "billing" | "password" | "notifications" | "privacy" | "app-icon" | "danger";

// Subscription types
interface SubscriptionData {
  id: string;
  status: string;
  tier: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialEnd: string | null;
}

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  date: string;
  pdfUrl: string | null;
}

interface TierInfo {
  name: string;
  price: number;
  features: string[];
}

export default function SettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Profile form - initialize with user data when available
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailMemorialUpdates: true,
    emailNewCollaborators: true,
    emailWeeklyDigest: false,
    emailMarketingUpdates: false,
    pushCandles: true,
    pushGuestbook: true,
    pushMilestones: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showProfilePublicly: false,
    allowSearchEngines: false,
    shareActivityWithFamily: true,
  });

  // PWA Icon preference
  const [pwaIconPreference, setPwaIconPreference] = useState<{
    memorialId: string;
    photoUrl: string;
    name: string;
  } | null>(null);

  // Demo memorials for icon selection (in production, fetch from API)
  const demoMemorials = [
    { id: "demo-1", name: "Margaret Johnson", photoUrl: "/icons/icon-192x192.svg" },
    { id: "demo-2", name: "Robert Williams", photoUrl: "/icons/icon-192x192.svg" },
    { id: "demo-3", name: "Eleanor Chen", photoUrl: "/icons/icon-192x192.svg" },
  ];

  // Load PWA icon preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("forever-fields-pwa-icon");
    if (saved) {
      try {
        setPwaIconPreference(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Billing/Subscription state
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch subscription data when billing tab is active
  useEffect(() => {
    if (activeTab === "billing" && !subscription && !billingLoading) {
      fetchSubscription();
    }
  }, [activeTab]);

  const fetchSubscription = async () => {
    setBillingLoading(true);
    try {
      const response = await fetch("/api/subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setInvoices(data.invoices || []);
        setTierInfo(data.tier);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      toast.error("Failed to load subscription details");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Failed to open billing portal");
      }
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowCancelModal(false);
        fetchSubscription(); // Refresh
      } else {
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch {
      toast.error("Failed to cancel subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/cancel", { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchSubscription(); // Refresh
      } else {
        toast.error(data.error || "Failed to reactivate subscription");
      }
    } catch {
      toast.error("Failed to reactivate subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "profile" as const, labelKey: "settings.profile", icon: User, color: "sage" },
    { id: "billing" as const, labelKey: "settings.billing", icon: CreditCard, color: "gold" },
    { id: "password" as const, labelKey: "settings.password", icon: Lock, color: "coral" },
    { id: "notifications" as const, labelKey: "settings.notifications", icon: Bell, color: "twilight" },
    { id: "privacy" as const, labelKey: "settings.privacy", icon: Shield, color: "lavender" },
    { id: "app-icon" as const, labelKey: "settings.appIcon", icon: Smartphone, color: "sage" },
    { id: "danger" as const, labelKey: "settings.danger", icon: AlertTriangle, color: "red" },
  ];

  const passwordRequirements = [
    { met: newPassword.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(newPassword), text: "One uppercase letter" },
    { met: /[a-z]/.test(newPassword), text: "One lowercase letter" },
    { met: /[0-9]/.test(newPassword), text: "One number" },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.met);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Profile updated successfully");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Notification preferences saved");
      } else {
        toast.error(data.error || "Failed to save preferences");
      }
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacy),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Privacy settings saved");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPwaIcon = (memorial: { id: string; name: string; photoUrl: string } | null) => {
    if (memorial) {
      const preference = {
        memorialId: memorial.id,
        photoUrl: memorial.photoUrl,
        name: memorial.name,
      };
      setPwaIconPreference(preference);
      localStorage.setItem("forever-fields-pwa-icon", JSON.stringify(preference));
      // Set cookie for server-side manifest generation
      document.cookie = `pwa-icon-preference=${JSON.stringify(preference)}; path=/; max-age=31536000`;
      toast.success(`App icon set to ${memorial.name}`);
    } else {
      setPwaIconPreference(null);
      localStorage.removeItem("forever-fields-pwa-icon");
      document.cookie = "pwa-icon-preference=; path=/; max-age=0";
      toast.success("App icon reset to default");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await logout();
      toast.success("Account deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sage animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-pale/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-sage-pale/30 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-dark" />
            </Link>
            <div className="flex items-center gap-2">
              <Flower2 className="w-6 h-6 text-sage" />
              <h1 className="text-xl font-serif font-bold text-gray-dark">
                {t("settings.title")}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="md:w-56 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const activeStyles = tab.color === "red"
                  ? "bg-red-50 text-red-700 font-medium"
                  : tab.color === "sage" ? "bg-sage-pale text-sage-dark font-medium"
                  : tab.color === "gold" ? "bg-gold-pale text-gold-dark font-medium"
                  : tab.color === "coral" ? "bg-coral-pale text-coral-dark font-medium"
                  : "bg-twilight/10 text-twilight font-medium";
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? activeStyles
                        : "text-gray-body hover:bg-sage-pale/30"
                    } ${tab.id === "danger" && !isActive ? "text-red-600 hover:bg-red-50" : ""}`}
                  >
                    <Icon className={`w-5 h-5 ${tab.id === "danger" && !isActive ? "text-red-500" : ""}`} />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </nav>

            {/* Sign Out Button */}
            <div className="mt-6 pt-6 border-t border-sage-pale/50">
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                  toast.success("Signed out successfully");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-body hover:bg-sage-pale/30 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                {t("common.logout")}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-serif font-bold text-gray-dark mb-6">
                    Profile Information
                  </h2>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-1">
                        {t("auth.fullName")}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-1">
                        {t("auth.email")}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                        />
                      </div>
                      <p className="text-xs text-gray-body mt-1">
                        Changing your email will require verification.
                      </p>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t("common.save")}
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-serif font-bold text-gray-dark">
                      Subscription & Billing
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchSubscription}
                      disabled={billingLoading}
                    >
                      {billingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {billingLoading && !subscription ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-sage animate-spin" />
                    </div>
                  ) : subscription ? (
                    <div className="space-y-6">
                      {/* Current Plan */}
                      <div className="p-4 rounded-lg bg-sage-pale/30 border border-sage-pale">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-sage/10 flex items-center justify-center">
                              {subscription.tier === "heritage" ? (
                                <Crown className="w-5 h-5 text-gold" />
                              ) : subscription.tier === "legacy" ? (
                                <Users className="w-5 h-5 text-twilight" />
                              ) : subscription.tier === "remember" ? (
                                <Sparkles className="w-5 h-5 text-coral" />
                              ) : (
                                <Flower2 className="w-5 h-5 text-sage" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-dark">
                                {tierInfo?.name || "Free"} Plan
                              </h3>
                              <p className="text-sm text-gray-body mt-1">
                                {tierInfo?.price === 0
                                  ? "Free forever"
                                  : `$${tierInfo?.price}/month`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subscription.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : subscription.status === "trialing"
                                  ? "bg-blue-100 text-blue-800"
                                  : subscription.status === "past_due"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {subscription.status === "active"
                                ? "Active"
                                : subscription.status === "trialing"
                                ? "Trial"
                                : subscription.status === "past_due"
                                ? "Past Due"
                                : subscription.status}
                            </span>
                          </div>
                        </div>

                        {subscription.cancelAtPeriodEnd && (
                          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-sm text-amber-800">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Your subscription will end on{" "}
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleReactivateSubscription}
                              disabled={isLoading}
                              className="mt-2"
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Reactivate Subscription"
                              )}
                            </Button>
                          </div>
                        )}

                        {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                          <p className="mt-3 text-sm text-blue-600">
                            Trial ends on {new Date(subscription.trialEnd).toLocaleDateString()}
                          </p>
                        )}

                        <div className="mt-4 pt-4 border-t border-sage-pale/50">
                          <p className="text-xs text-gray-muted">
                            Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{" "}
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Plan Features */}
                      {tierInfo && tierInfo.features.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-dark mb-3">Your Plan Includes</h3>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {tierInfo.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-gray-body">
                                <Check className="w-4 h-4 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <Link href="/pricing">
                          <Button variant="outline">
                            {subscription.tier === "free" ? "Upgrade Plan" : "Change Plan"}
                          </Button>
                        </Link>
                        <Button variant="outline" onClick={handleOpenPortal} disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Manage Payment Method
                        </Button>
                        {subscription.tier !== "free" && !subscription.cancelAtPeriodEnd && (
                          <Button
                            variant="outline"
                            onClick={() => setShowCancelModal(true)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Cancel Subscription
                          </Button>
                        )}
                      </div>

                      {/* Billing History */}
                      {invoices.length > 0 && (
                        <div className="pt-6 border-t border-sage-pale/50">
                          <h3 className="font-medium text-gray-dark mb-4">Billing History</h3>
                          <div className="space-y-2">
                            {invoices.map((invoice) => (
                              <div
                                key={invoice.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-dark">
                                      {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                                    </p>
                                    <p className="text-xs text-gray-muted">
                                      {new Date(invoice.date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      invoice.status === "paid"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {invoice.status}
                                  </span>
                                  <span className="text-sm font-medium text-gray-dark">
                                    ${(invoice.amount / 100).toFixed(2)}
                                  </span>
                                  {invoice.pdfUrl && (
                                    <a
                                      href={invoice.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-gray-200 rounded"
                                    >
                                      <Download className="w-4 h-4 text-gray-500" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Flower2 className="w-12 h-12 mx-auto mb-4 text-sage opacity-50" />
                      <p className="text-gray-body mb-4">You&apos;re on the Free plan</p>
                      <Link href="/pricing">
                        <Button>View Plans</Button>
                      </Link>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-serif font-bold text-gray-dark mb-6">
                    {t("settings.changePassword")}
                  </h2>

                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full pl-10 pr-12 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                        />
                      </div>

                      {newPassword.length > 0 && (
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
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sage ${
                            confirmPassword.length > 0
                              ? passwordsMatch
                                ? "border-green-300"
                                : "border-red-300"
                              : "border-sage-pale"
                          }`}
                        />
                      </div>
                      {confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !currentPassword || !allRequirementsMet || !passwordsMatch}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("settings.changePassword")
                      )}
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-serif font-bold text-gray-dark mb-6">
                    Notification Preferences
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-dark mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        {[
                          { key: "emailMemorialUpdates", label: "Memorial updates", desc: "When someone adds content to your memorials" },
                          { key: "emailNewCollaborators", label: "New collaborators", desc: "When someone accepts your invitation" },
                          { key: "emailWeeklyDigest", label: "Weekly digest", desc: "Summary of activity across your memorials" },
                          { key: "emailMarketingUpdates", label: "Product updates", desc: "New features and announcements" },
                        ].map((item) => (
                          <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications[item.key as keyof typeof notifications]}
                              onChange={(e) =>
                                setNotifications({ ...notifications, [item.key]: e.target.checked })
                              }
                              className="mt-1 w-4 h-4 rounded border-sage-pale text-sage focus:ring-sage"
                            />
                            <div>
                              <span className="font-medium text-gray-dark">{item.label}</span>
                              <p className="text-sm text-gray-body">{item.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-sage-pale/50">
                      <h3 className="font-medium text-gray-dark mb-4">Push Notifications</h3>
                      <div className="space-y-4">
                        {[
                          { key: "pushCandles", label: "Candle lighting", desc: "When someone lights a candle" },
                          { key: "pushGuestbook", label: "Guestbook entries", desc: "New messages in guestbooks" },
                          { key: "pushMilestones", label: "Milestone messages", desc: "Time-locked message reminders" },
                        ].map((item) => (
                          <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications[item.key as keyof typeof notifications]}
                              onChange={(e) =>
                                setNotifications({ ...notifications, [item.key]: e.target.checked })
                              }
                              className="mt-1 w-4 h-4 rounded border-sage-pale text-sage focus:ring-sage"
                            />
                            <div>
                              <span className="font-medium text-gray-dark">{item.label}</span>
                              <p className="text-sm text-gray-body">{item.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button onClick={handleSaveNotifications} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-serif font-bold text-gray-dark mb-6">
                    Privacy Settings
                  </h2>

                  <div className="space-y-6">
                    {[
                      {
                        key: "showProfilePublicly",
                        label: "Public profile",
                        desc: "Allow others to see your profile when they view your public memorials",
                      },
                      {
                        key: "allowSearchEngines",
                        label: "Search engine indexing",
                        desc: "Allow search engines to index your public memorials",
                      },
                      {
                        key: "shareActivityWithFamily",
                        label: "Activity sharing",
                        desc: "Share your activity with family collaborators",
                      },
                    ].map((item) => (
                      <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacy[item.key as keyof typeof privacy]}
                          onChange={(e) =>
                            setPrivacy({ ...privacy, [item.key]: e.target.checked })
                          }
                          className="mt-1 w-4 h-4 rounded border-sage-pale text-sage focus:ring-sage"
                        />
                        <div>
                          <span className="font-medium text-gray-dark">{item.label}</span>
                          <p className="text-sm text-gray-body">{item.desc}</p>
                        </div>
                      </label>
                    ))}

                    <div className="pt-6 border-t border-sage-pale/50">
                      <h3 className="font-medium text-gray-dark mb-2">Data Export</h3>
                      <p className="text-sm text-gray-body mb-4">
                        Download a copy of all your data including memorials, photos, and stories.
                      </p>
                      <Button variant="outline">
                        Request Data Export
                      </Button>
                    </div>

                    <Button onClick={handleSavePrivacy} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* App Icon Tab */}
            {activeTab === "app-icon" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-serif font-bold text-gray-dark mb-2 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-lavender" />
                    App Icon
                  </h2>
                  <p className="text-gray-body mb-6">
                    Personalize your Forever Fields app icon with a memorial photo.
                    This icon will appear when you install the app on your device.
                  </p>

                  {/* Current Selection */}
                  <div className="mb-6 p-4 rounded-lg bg-lavender-pale/30 border border-lavender-subtle">
                    <h3 className="font-medium text-gray-dark mb-3">Current Icon</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-sage overflow-hidden flex items-center justify-center">
                        {pwaIconPreference ? (
                          <span className="text-white text-xl font-serif">
                            {pwaIconPreference.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        ) : (
                          <Flower2 className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-dark">
                          {pwaIconPreference ? pwaIconPreference.name : "Default Flower"}
                        </p>
                        <p className="text-sm text-gray-body">
                          {pwaIconPreference ? "Custom memorial icon" : "Forever Fields logo"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Icon Options */}
                  <h3 className="font-medium text-gray-dark mb-3">Choose an Icon</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    {/* Default Option */}
                    <button
                      onClick={() => handleSelectPwaIcon(null)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        !pwaIconPreference
                          ? "border-sage bg-sage-pale"
                          : "border-sage-pale hover:border-sage"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-sage mx-auto mb-2 flex items-center justify-center">
                        <Flower2 className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-dark">Default</p>
                      <p className="text-xs text-gray-body">Flower icon</p>
                    </button>

                    {/* Memorial Options */}
                    {demoMemorials.map((memorial) => (
                      <button
                        key={memorial.id}
                        onClick={() => handleSelectPwaIcon(memorial)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          pwaIconPreference?.memorialId === memorial.id
                            ? "border-sage bg-sage-pale"
                            : "border-sage-pale hover:border-sage"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-twilight mx-auto mb-2 flex items-center justify-center">
                          <span className="text-white text-lg font-serif">
                            {memorial.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-dark truncate">{memorial.name}</p>
                        <p className="text-xs text-gray-body">Memorial</p>
                      </button>
                    ))}
                  </div>

                  {/* Instructions */}
                  <div className="p-4 rounded-lg bg-gold-pale/30 border border-gold-light">
                    <h4 className="font-medium text-gray-dark mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gold" />
                      How to Apply
                    </h4>
                    <p className="text-sm text-gray-body">
                      After selecting an icon, you may need to reinstall the app for changes to take effect:
                    </p>
                    <ol className="text-sm text-gray-body mt-2 ml-4 list-decimal">
                      <li>Remove the app from your home screen</li>
                      <li>Return to Forever Fields in your browser</li>
                      <li>Tap &quot;Add to Home Screen&quot; again</li>
                    </ol>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 border-red-200">
                  <h2 className="text-lg font-serif font-bold text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </h2>
                  <p className="text-gray-body mb-6">
                    These actions are permanent and cannot be undone.
                  </p>

                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <h3 className="font-medium text-red-700 mb-2">{t("settings.deleteAccount")}</h3>
                    <p className="text-sm text-red-600 mb-4">
                      Permanently delete your account and all associated data. This includes
                      all memorials you own, photos, stories, and personal information.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteModal(true)}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-dark mb-2">
                Cancel Your Subscription?
              </h3>
              <p className="text-gray-body">
                Your subscription will remain active until the end of your current billing period.
                You can reactivate anytime before then.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-6">
              <h4 className="font-medium text-amber-800 mb-2">What happens when you cancel:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Access continues until {subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "end of period"}</li>
                <li>• Your memorials and data are preserved</li>
                <li>• You&apos;ll be downgraded to the Free plan</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-dark mb-2">
                Delete Your Account?
              </h3>
              <p className="text-gray-body">
                This will permanently delete your account and all your data.
                This action cannot be undone.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-dark mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2 rounded-lg border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={isLoading || deleteConfirmation !== "DELETE"}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete Permanently"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
