"use client";

import Link from "next/link";
import {
  Flame,
  Image,
  MessageSquare,
  UserPlus,
  Heart,
  Clock,
  BookOpen,
} from "lucide-react";

export type NotificationType =
  | "candle"
  | "photo"
  | "memory"
  | "invite"
  | "guestbook"
  | "milestone"
  | "story";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  memorialId?: string;
  memorialName?: string;
  createdAt: string;
  isRead: boolean;
  actorName?: string;
  actorAvatar?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

const typeConfig: Record<
  NotificationType,
  { icon: typeof Flame; bgColor: string; iconColor: string }
> = {
  candle: {
    icon: Flame,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  photo: {
    icon: Image,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  memory: {
    icon: Heart,
    bgColor: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  invite: {
    icon: UserPlus,
    bgColor: "bg-sage-pale",
    iconColor: "text-sage",
  },
  guestbook: {
    icon: MessageSquare,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  milestone: {
    icon: Clock,
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  story: {
    icon: BookOpen,
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const content = (
    <div
      className={`flex gap-3 p-3 rounded-lg transition-colors hover:bg-sage-pale/20 ${
        !notification.isRead ? "bg-sage-pale/10" : ""
      }`}
      onClick={() => {
        if (!notification.isRead && onMarkAsRead) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-dark">
          <span className="font-medium">{notification.title}</span>
        </p>
        <p className="text-sm text-gray-body truncate">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sage mt-2" />
      )}
    </div>
  );

  if (notification.memorialId) {
    return (
      <Link href={`/memorial/${notification.memorialId}`}>{content}</Link>
    );
  }

  return content;
}
