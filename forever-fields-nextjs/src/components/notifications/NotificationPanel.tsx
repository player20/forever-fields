"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Settings } from "lucide-react";
import Link from "next/link";
import { NotificationItem, Notification } from "./NotificationItem";

interface NotificationPanelProps {
  onClose: () => void;
}

// Sample notifications - would come from API
const sampleNotifications: Notification[] = [
  {
    id: "1",
    type: "candle",
    title: "Candle Lit",
    message: "Sarah lit a candle for Margaret",
    memorialId: "mem_123",
    memorialName: "Margaret Rose Sullivan",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    isRead: false,
  },
  {
    id: "2",
    type: "photo",
    title: "New Photos",
    message: "John added 3 photos to the gallery",
    memorialId: "mem_123",
    memorialName: "Margaret Rose Sullivan",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: false,
  },
  {
    id: "3",
    type: "invite",
    title: "New Collaborator",
    message: "Jane invited you to collaborate on Robert's memorial",
    memorialId: "mem_456",
    memorialName: "Robert James Sullivan",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: true,
  },
  {
    id: "4",
    type: "guestbook",
    title: "Guestbook Entry",
    message: "Emily left a message in the guestbook",
    memorialId: "mem_123",
    memorialName: "Margaret Rose Sullivan",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    isRead: true,
  },
  {
    id: "5",
    type: "memory",
    title: "New Memory Shared",
    message: "Michael shared a memory about Sunday dinners",
    memorialId: "mem_123",
    memorialName: "Margaret Rose Sullivan",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    isRead: true,
  },
];

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(sampleNotifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-sage-pale/50 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sage-pale/50">
        <h3 className="font-medium text-gray-dark">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 text-xs text-sage hover:text-sage-dark"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <Link
            href="/settings/notifications"
            onClick={onClose}
            className="p-1 hover:bg-sage-pale/30 rounded"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-body text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-sage-pale/30">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-sage-pale/50 bg-sage-pale/10">
          <Link
            href="/notifications"
            onClick={onClose}
            className="text-sm text-sage hover:text-sage-dark font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </motion.div>
  );
}
