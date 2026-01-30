"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSocket, type GuestbookEntry } from "@/lib/socket";
import { Button, Card, Badge } from "@/components/ui";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GuestbookProps {
  memorialId: string;
  memorialName: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  initialEntries?: GuestbookEntry[];
  demoMode?: boolean;
}

// Demo entries for offline mode
const DEMO_ENTRIES: GuestbookEntry[] = [
  {
    id: "demo-1",
    memorialId: "demo",
    userId: "user-1",
    userName: "Margaret Thompson",
    message: "I remember all the wonderful times we shared. Your kindness touched so many lives. Rest peacefully.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "demo-2",
    memorialId: "demo",
    userId: "user-2",
    userName: "Robert Davis",
    message: "A true friend and mentor. The world was brighter with you in it.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "demo-3",
    memorialId: "demo",
    userId: "user-3",
    userName: "Linda Martinez",
    message: "Thinking of your family during this time. What a beautiful soul.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export function Guestbook({
  memorialId,
  memorialName,
  userId = "anonymous",
  userName = "A visitor",
  userAvatar,
  initialEntries = [],
  demoMode = true,
}: GuestbookProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>(
    initialEntries.length > 0 ? initialEntries : demoMode ? DEMO_ENTRIES : []
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, postGuestbookEntry, onGuestbookEntry } = useSocket({
    memorialId,
  });

  // Listen for new entries
  useEffect(() => {
    const unsubscribe = onGuestbookEntry((entry) => {
      if (entry.memorialId === memorialId) {
        setEntries((prev) => [...prev, entry]);
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    });
    return unsubscribe;
  }, [onGuestbookEntry, memorialId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Emit socket event
    postGuestbookEntry({
      memorialId,
      userId,
      userName,
      userAvatar,
      message: message.trim(),
    });

    // Optimistic update for demo
    const newEntry: GuestbookEntry = {
      id: `temp-${Date.now()}`,
      memorialId,
      userId,
      userName,
      userAvatar,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, newEntry]);

    setMessage("");
    setIsSubmitting(false);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "just now";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-sage" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-serif font-semibold text-gray-dark">
            Guestbook
          </h3>
          <p className="text-sm text-gray-body">
            Share memories of {memorialName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          )}
          <Badge variant="outline">{entries.length} messages</Badge>
        </div>
      </div>

      {/* Messages list */}
      <div className="h-80 overflow-y-auto mb-4 space-y-4 pr-2">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-sage-pale/50 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-sage/50" />
            </div>
            <p className="text-gray-body">No messages yet</p>
            <p className="text-sm text-gray-light">
              Be the first to share a memory
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${
                  entry.userId === userId ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {entry.userAvatar ? (
                    <Image
                      src={entry.userAvatar}
                      alt={entry.userName}
                      width={40}
                      height={40}
                      unoptimized
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-sage-pale flex items-center justify-center">
                      <User className="w-5 h-5 text-sage" />
                    </div>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`flex-1 max-w-[75%] ${
                    entry.userId === userId ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block rounded-2xl px-4 py-2 ${
                      entry.userId === userId
                        ? "bg-sage text-white rounded-tr-none"
                        : "bg-gray-100 text-gray-dark rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm">{entry.message}</p>
                  </div>
                  <div
                    className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${
                      entry.userId === userId ? "justify-end" : ""
                    }`}
                  >
                    <span className="font-medium">{entry.userName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          maxLength={500}
        />
        <Button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className="rounded-full w-12 h-12 p-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>

      {/* Character count */}
      {message.length > 400 && (
        <p className="text-xs text-gray-400 mt-1 text-right">
          {message.length}/500 characters
        </p>
      )}
    </Card>
  );
}
