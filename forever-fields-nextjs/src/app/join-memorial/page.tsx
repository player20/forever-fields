"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { toast } from "sonner";
import {
  Flower2,
  Users,
  Link as LinkIcon,
  Search,
  ChevronRight,
} from "lucide-react";

export default function JoinMemorialPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch("/api/memorials/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid invite code");
      }

      const data = await response.json();
      toast.success("You've joined the memorial!");
      router.push(`/memorial/${data.memorial.slug}`);
    } catch (error) {
      console.error("Error joining memorial:", error);
      toast.error(error instanceof Error ? error.message : "Failed to join memorial");
      setIsJoining(false);
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
            <div className="w-16 h-16 bg-sage-pale rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-sage" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
              Join a Memorial
            </h1>
            <p className="text-gray-body">
              Enter the invite code shared by your family member.
            </p>
          </div>

          <form onSubmit={handleJoinWithCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">
                Invite Code
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent uppercase tracking-wider"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isJoining || !inviteCode.trim()}
            >
              {isJoining ? (
                <>
                  <span className="animate-spin mr-2">
                    <Flower2 className="w-4 h-4" />
                  </span>
                  Joining...
                </>
              ) : (
                <>
                  Join Memorial
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sage-pale/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-body">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/search")}
            >
              <Search className="w-4 h-4 mr-2" />
              Search for a Memorial
            </Button>

            <p className="text-center text-sm text-gray-body">
              Want to create your own memorial?{" "}
              <Link href="/onboarding" className="text-sage hover:text-sage-dark font-medium">
                Start here
              </Link>
            </p>
          </div>
        </Card>

        {/* Back to home */}
        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-body hover:text-sage">
            Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
