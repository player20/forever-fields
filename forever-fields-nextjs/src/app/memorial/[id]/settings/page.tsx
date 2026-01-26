"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Globe,
  Link as LinkIcon,
  Lock,
  Users,
  Mail,
  Trash2,
  Crown,
  Edit3,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Flower2,
} from "lucide-react";

type PrivacyLevel = "public" | "unlisted" | "private";
type CollaboratorRole = "owner" | "editor" | "viewer";

interface Collaborator {
  id: string;
  email: string;
  name?: string;
  role: CollaboratorRole;
  invitedAt: string;
  acceptedAt?: string;
}

// Sample data - would come from API
const sampleCollaborators: Collaborator[] = [
  {
    id: "1",
    email: "owner@example.com",
    name: "Jane Smith",
    role: "owner",
    invitedAt: "2024-01-01",
    acceptedAt: "2024-01-01",
  },
  {
    id: "2",
    email: "editor@example.com",
    name: "John Doe",
    role: "editor",
    invitedAt: "2024-01-15",
    acceptedAt: "2024-01-16",
  },
  {
    id: "3",
    email: "viewer@example.com",
    role: "viewer",
    invitedAt: "2024-02-01",
    // Pending - not accepted yet
  },
];

export default function MemorialSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: _user } = useAuth();
  const memorialId = params.id as string;

  const [privacy, setPrivacy] = useState<PrivacyLevel>("unlisted");
  const [collaborators, setCollaborators] = useState<Collaborator[]>(sampleCollaborators);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("viewer");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/memorial/${memorialId}`;

  const privacyOptions = [
    {
      value: "public",
      label: "Public",
      description: "Anyone can find and view this memorial",
      icon: Globe,
    },
    {
      value: "unlisted",
      label: "Unlisted",
      description: "Only people with the link can view",
      icon: LinkIcon,
    },
    {
      value: "private",
      label: "Private",
      description: "Only invited collaborators can view",
      icon: Lock,
    },
  ] as const;

  const roleLabels: Record<CollaboratorRole, { label: string; icon: typeof Crown }> = {
    owner: { label: "Owner", icon: Crown },
    editor: { label: "Editor", icon: Edit3 },
    viewer: { label: "Viewer", icon: Eye },
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newCollaborator: Collaborator = {
        id: Date.now().toString(),
        email: inviteEmail,
        role: inviteRole,
        invitedAt: new Date().toISOString(),
      };

      setCollaborators([...collaborators, newCollaborator]);
      setInviteEmail("");
      setShowInviteModal(false);
      toast.success(`Invitation sent to ${inviteEmail}`);
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    const collaborator = collaborators.find((c) => c.id === id);
    if (!collaborator) return;

    if (collaborator.role === "owner") {
      toast.error("Cannot remove the owner");
      return;
    }

    try {
      // API call would go here
      setCollaborators(collaborators.filter((c) => c.id !== id));
      toast.success("Collaborator removed");
    } catch {
      toast.error("Failed to remove collaborator");
    }
  };

  const handleUpdateRole = async (id: string, newRole: CollaboratorRole) => {
    const collaborator = collaborators.find((c) => c.id === id);
    if (!collaborator || collaborator.role === "owner") return;

    try {
      // API call would go here
      setCollaborators(
        collaborators.map((c) => (c.id === id ? { ...c, role: newRole } : c))
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteMemorial = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Memorial deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete memorial");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-pale/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/memorial/${memorialId}`}
              className="p-2 hover:bg-sage-pale/30 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-dark" />
            </Link>
            <div>
              <h1 className="text-xl font-serif font-bold text-gray-dark">
                Memorial Settings
              </h1>
              <p className="text-sm text-gray-body">
                Manage privacy and collaborators
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Privacy Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-serif font-bold text-gray-dark mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-sage" />
              Privacy
            </h2>

            <div className="space-y-3">
              {privacyOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      privacy === option.value
                        ? "border-sage bg-sage-pale/20"
                        : "border-transparent bg-sage-pale/10 hover:bg-sage-pale/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={option.value}
                      checked={privacy === option.value}
                      onChange={() => setPrivacy(option.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-sage" />
                        <span className="font-medium text-gray-dark">
                          {option.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-body mt-1">
                        {option.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Share Link */}
            {privacy !== "private" && (
              <div className="mt-6 pt-6 border-t border-sage-pale/50">
                <label className="block text-sm font-medium text-gray-dark mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-lg border border-sage-pale bg-sage-pale/10 text-gray-body text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.section>

        {/* Collaborators */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-gray-dark flex items-center gap-2">
                <Users className="w-5 h-5 text-sage" />
                Collaborators
              </h2>
              <Button onClick={() => setShowInviteModal(true)} size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </div>

            <div className="space-y-3">
              {collaborators.map((collaborator) => {
                const _RoleIcon = roleLabels[collaborator.role].icon;
                const isOwner = collaborator.role === "owner";
                const isPending = !collaborator.acceptedAt;

                return (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-sage-pale/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sage-pale flex items-center justify-center">
                        <span className="text-sage font-medium">
                          {(collaborator.name || collaborator.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-dark">
                            {collaborator.name || collaborator.email}
                          </span>
                          {isPending && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Pending
                            </span>
                          )}
                        </div>
                        {collaborator.name && (
                          <p className="text-sm text-gray-body">
                            {collaborator.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner ? (
                        <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                          <Crown className="w-4 h-4" />
                          Owner
                        </span>
                      ) : (
                        <>
                          <select
                            value={collaborator.role}
                            onChange={(e) =>
                              handleUpdateRole(
                                collaborator.id,
                                e.target.value as CollaboratorRole
                              )
                            }
                            className="text-sm px-3 py-1.5 rounded-lg border border-sage-pale bg-white"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                            className="p-2 text-gray-body hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-gray-body mt-4">
              <strong>Editors</strong> can add photos, memories, and edit content.{" "}
              <strong>Viewers</strong> can only view the memorial.
            </p>
          </Card>
        </motion.section>

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 border-red-200">
            <h2 className="text-lg font-serif font-bold text-red-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>

            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
              <div>
                <p className="font-medium text-red-700">Delete Memorial</p>
                <p className="text-sm text-red-600">
                  Permanently delete this memorial and all its content.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Delete
              </Button>
            </div>
          </Card>
        </motion.section>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-serif font-bold text-gray-dark mb-4">
              Invite Collaborator
            </h3>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-dark mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-dark mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
                  className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                >
                  <option value="editor">Editor - Can add and edit content</option>
                  <option value="viewer">Viewer - Can only view</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <Flower2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Invitation"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-dark mb-2">
                Delete Memorial?
              </h3>
              <p className="text-gray-body mb-6">
                This action cannot be undone. All photos, memories, and content
                will be permanently deleted.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteMemorial}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Flower2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete Forever"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
