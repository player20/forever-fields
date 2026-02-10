"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { Bell, BellOff, BellRing, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface PushNotificationToggleProps {
  className?: string;
  variant?: "default" | "compact";
}

export function PushNotificationToggle({
  className,
  variant = "default",
}: PushNotificationToggleProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggle = async () => {
    setIsProcessing(true);

    try {
      if (isSubscribed) {
        const success = await unsubscribe();
        if (success) {
          toast.success("Push notifications disabled");
        } else {
          toast.error("Failed to disable notifications");
        }
      } else {
        const success = await subscribe();
        if (success) {
          toast.success("Push notifications enabled!");
        } else if (permission === "denied") {
          toast.error(
            "Notification permission denied. Please enable notifications in your browser settings."
          );
        } else {
          toast.error("Failed to enable notifications");
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Not supported
  if (!isSupported) {
    if (variant === "compact") {
      return null;
    }

    return (
      <div className={`flex items-center gap-2 text-gray-400 text-sm ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span>Push notifications not supported in this browser</span>
      </div>
    );
  }

  // Permission denied
  if (permission === "denied") {
    if (variant === "compact") {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className={className}
        >
          <BellOff className="w-4 h-4" />
        </Button>
      );
    }

    return (
      <div className={`flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">Push Notifications</p>
            <p className="text-sm text-gray-500">
              Blocked - enable in browser settings
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          Blocked
        </Button>
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <Button
        variant={isSubscribed ? "primary" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading || isProcessing}
        className={className}
      >
        {isLoading || isProcessing ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isSubscribed ? (
          <BellRing className="w-4 h-4" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
      </Button>
    );
  }

  // Full variant
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <BellRing className="w-5 h-5 text-sage" />
        ) : (
          <Bell className="w-5 h-5 text-gray-400" />
        )}
        <div>
          <p className="font-medium text-gray-900">Push Notifications</p>
          <p className="text-sm text-gray-500">
            {isSubscribed
              ? "Receive updates on this device"
              : "Get notified about candles, memories, and more"}
          </p>
        </div>
      </div>

      <Button
        variant={isSubscribed ? "outline" : "primary"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading || isProcessing}
      >
        {isLoading || isProcessing ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ...
          </span>
        ) : isSubscribed ? (
          "Disable"
        ) : (
          "Enable"
        )}
      </Button>
    </div>
  );
}
