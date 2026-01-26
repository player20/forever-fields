"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { Check, Flower2, ArrowRight, Sparkles } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd verify the session and update the user's subscription
    // For now, we just show the success message
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Flower2 className="w-12 h-12 text-sage animate-spin mx-auto mb-4" />
          <p className="text-gray-body">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        <Card className="p-8 text-center">
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-serif font-bold text-gray-dark mb-4">
            Welcome to Forever Fields!
          </h1>

          <p className="text-gray-body mb-8">
            Your subscription is now active. You have access to all the features
            of your plan. Let&apos;s get started honoring your loved ones.
          </p>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Link href="/create">
              <div className="p-4 bg-sage-pale/50 rounded-lg hover:bg-sage-pale transition-colors cursor-pointer">
                <Sparkles className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-dark">
                  Create Memorial
                </p>
              </div>
            </Link>
            <Link href="/dashboard">
              <div className="p-4 bg-sage-pale/50 rounded-lg hover:bg-sage-pale transition-colors cursor-pointer">
                <Flower2 className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-dark">
                  Go to Dashboard
                </p>
              </div>
            </Link>
          </div>

          {/* What's next */}
          <div className="bg-cream rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-dark mb-3">What&apos;s Next?</h3>
            <ul className="space-y-2 text-sm text-gray-body">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                Create your first memorial
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                Upload photos and stories
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                Invite family members to collaborate
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                Try AI features like Legacy Companion
              </li>
            </ul>
          </div>

          <Link href="/create">
            <Button className="w-full">
              Create Your First Memorial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <p className="text-xs text-gray-400 mt-6">
            A confirmation email has been sent to your inbox.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
