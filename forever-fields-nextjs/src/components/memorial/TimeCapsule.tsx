"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui";
import {
  Lock,
  Unlock,
  Clock,
  Calendar,
  Gift,
  Plus,
  X,
  Mail,
  User,
  ChevronRight,
} from "lucide-react";

interface TimeCapsuleData {
  id: string;
  title: string;
  message: string;
  recipientName: string;
  recipientEmail?: string;
  unlockDate: string;
  status: "scheduled" | "delivered" | "opened";
  createdAt: string;
}

interface TimeCapsuleProps {
  memorialId: string;
  memorialName: string;
  userId?: string;
  initialCapsules?: TimeCapsuleData[];
  demoMode?: boolean;
}

// Demo capsules for offline mode
const DEMO_CAPSULES: TimeCapsuleData[] = [
  {
    id: "demo-1",
    title: "For Your 18th Birthday",
    message:
      "My dearest grandchild, by the time you read this, you'll be turning 18. I want you to know how proud I am of the person you're becoming. Always remember: be kind, be brave, and follow your heart. I love you more than words can say. - Grandma",
    recipientName: "Emma",
    unlockDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year from now
    status: "scheduled",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "demo-2",
    title: "Wedding Day Wishes",
    message:
      "Congratulations on your wedding day! I always knew this day would come. Remember what I told you about love - it's patient, it's kind, and it grows stronger every day. Cherish each other always.",
    recipientName: "Michael",
    unlockDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago (unlocked)
    status: "delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
  },
  {
    id: "demo-3",
    title: "First Day of College",
    message:
      "Today you start a new chapter. Study hard, make friends, and don't forget to call home. I believe in you!",
    recipientName: "Sarah",
    unlockDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago (opened)
    status: "opened",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
  },
];

function getTimeRemaining(unlockDate: string) {
  const now = new Date().getTime();
  const unlock = new Date(unlockDate).getTime();
  const diff = unlock - now;

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 365) {
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? "s" : ""}`;
  }
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  }
  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

export function TimeCapsule({
  memorialId: _memorialId,
  memorialName,
  userId: _userId,
  initialCapsules = [],
  demoMode = true,
}: TimeCapsuleProps) {
  const [capsules, setCapsules] = useState<TimeCapsuleData[]>(
    initialCapsules.length > 0 ? initialCapsules : demoMode ? DEMO_CAPSULES : []
  );
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsuleData | null>(null);
  const [showOpened, setShowOpened] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Countdown timer
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);

    // Create new capsule (demo mode - just add locally)
    const newCapsule: TimeCapsuleData = {
      id: `capsule-${Date.now()}`,
      title,
      message,
      recipientName,
      recipientEmail: recipientEmail || undefined,
      unlockDate: new Date(unlockDate).toISOString(),
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setCapsules((prev) => [newCapsule, ...prev]);
      setShowCreate(false);
      setTitle("");
      setMessage("");
      setRecipientName("");
      setRecipientEmail("");
      setUnlockDate("");
      setIsCreating(false);
    }, 1000);
  };

  const handleOpen = (capsule: TimeCapsuleData) => {
    setSelectedCapsule(capsule);
    setShowOpened(true);
    // Mark as opened
    setCapsules((prev) =>
      prev.map((c) =>
        c.id === capsule.id ? { ...c, status: "opened" as const } : c
      )
    );
  };

  const isUnlockable = (capsule: TimeCapsuleData) => {
    return new Date(capsule.unlockDate).getTime() <= Date.now();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Gift className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-gray-dark">
              Time Capsules
            </h3>
            <p className="text-sm text-gray-body">
              Messages that unlock on special dates
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Create
        </Button>
      </div>

      {/* Capsule List */}
      <div className="space-y-3">
        {capsules.length === 0 ? (
          <div className="text-center py-8 text-gray-body">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No time capsules yet</p>
            <p className="text-sm">
              Create a message to be opened on a special date
            </p>
          </div>
        ) : (
          capsules.map((capsule) => (
            <motion.div
              key={capsule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                capsule.status === "opened"
                  ? "border-green-200 bg-green-50/30"
                  : isUnlockable(capsule)
                  ? "border-purple-200 bg-purple-50/30"
                  : "border-gray-200 bg-gray-50/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      capsule.status === "opened"
                        ? "bg-green-100"
                        : isUnlockable(capsule)
                        ? "bg-purple-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {capsule.status === "opened" ? (
                      <Unlock className="w-5 h-5 text-green-600" />
                    ) : isUnlockable(capsule) ? (
                      <Gift className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-dark">
                      {capsule.title}
                    </h4>
                    <p className="text-sm text-gray-body">
                      For {capsule.recipientName}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(capsule.unlockDate).toLocaleDateString()}
                      </span>
                      {!isUnlockable(capsule) && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(capsule.unlockDate)} left
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {capsule.status === "opened" ? (
                  <Badge variant="secondary" size="sm" className="bg-green-100 text-green-700">
                    Opened
                  </Badge>
                ) : isUnlockable(capsule) ? (
                  <Button
                    size="sm"
                    onClick={() => handleOpen(capsule)}
                  >
                    Open
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Badge variant="outline" size="sm">
                    Locked
                  </Badge>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-semibold text-gray-dark">
                  Create Time Capsule
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., For Your 18th Birthday"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Who is this for?"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Recipient Email (optional)
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="They'll be notified when it unlocks"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Unlock Date
                  </label>
                  <input
                    type="date"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleCreate}
                    disabled={
                      isCreating || !title || !message || !recipientName || !unlockDate
                    }
                    className="w-full"
                  >
                    {isCreating ? (
                      "Creating..."
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Seal Time Capsule
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Open Capsule Modal */}
      <AnimatePresence>
        {showOpened && selectedCapsule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowOpened(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Opening animation */}
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center"
              >
                <Gift className="w-8 h-8 text-purple-600" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-xl font-serif font-semibold text-gray-dark text-center mb-2">
                  {selectedCapsule.title}
                </h3>
                <p className="text-center text-sm text-gray-body mb-6">
                  For {selectedCapsule.recipientName}
                </p>

                <div className="bg-sage-pale/30 rounded-lg p-4 mb-6">
                  <p className="text-gray-dark whitespace-pre-wrap leading-relaxed">
                    {selectedCapsule.message}
                  </p>
                </div>

                <p className="text-center text-xs text-gray-500 mb-6">
                  Created on{" "}
                  {new Date(selectedCapsule.createdAt).toLocaleDateString()}
                  <br />
                  from {memorialName}&apos;s memorial
                </p>

                <Button
                  variant="outline"
                  onClick={() => setShowOpened(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
