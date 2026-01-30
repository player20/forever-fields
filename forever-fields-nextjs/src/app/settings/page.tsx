"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";

type SettingsTab = "profile" | "password" | "notifications" | "privacy" | "app-icon" | "danger";

export default function SettingsPage() {
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

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User, color: "sage" },
    { id: "password" as const, label: "Password", icon: Lock, color: "gold" },
    { id: "notifications" as const, label: "Notifications", icon: Bell, color: "coral" },
    { id: "privacy" as const, label: "Privacy", icon: Shield, color: "twilight" },
    { id: "app-icon" as const, label: "App Icon", icon: Smartphone, color: "lavender" },
    { id: "danger" as const, label: "Danger Zone", icon: AlertTriangle, color: "red" },
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
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Profile updated successfully");
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
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Privacy settings saved");
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
                Account Settings
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
                    {tab.label}
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
                Sign Out
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
                        Full Name
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
                        Email Address
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
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
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
                    Change Password
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
                        "Change Password"
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
                    <h3 className="font-medium text-red-700 mb-2">Delete Account</h3>
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
                Cancel
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
