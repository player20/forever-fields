"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Flame,
  Flower2,
  BookOpen,
  Share2,
  Camera,
  Bell,
  Map,
} from "lucide-react";

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  onClick: () => void;
}

interface MobileQuickActionsProps {
  /** Memorial ID for context-aware actions */
  memorialId?: string;
  /** Memorial name for share text */
  memorialName?: string;
  /** Memorial slug for share URL */
  memorialSlug?: string;
  /** Custom actions to show */
  actions?: QuickAction[];
  /** Position of the FAB */
  position?: "bottom-right" | "bottom-center" | "bottom-left";
  /** Callback when light candle is clicked */
  onLightCandle?: () => void;
  /** Callback when leave flowers is clicked */
  onLeaveFlowers?: () => void;
  /** Callback when sign guestbook is clicked */
  onSignGuestbook?: () => void;
  /** Callback when add photo is clicked */
  onAddPhoto?: () => void;
  /** Callback when share is clicked */
  onShare?: () => void;
  /** Callback when find cemetery is clicked */
  onFindCemetery?: () => void;
  /** Callback when notification settings is clicked */
  onNotificationSettings?: () => void;
}

export function MobileQuickActions({
  memorialId: _memorialId,
  memorialName,
  memorialSlug,
  actions: customActions,
  position = "bottom-right",
  onLightCandle,
  onLeaveFlowers,
  onSignGuestbook,
  onAddPhoto,
  onShare,
  onFindCemetery,
  onNotificationSettings,
}: MobileQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = useCallback(async () => {
    // Use native share if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: memorialName
            ? `${memorialName}'s Memorial`
            : "Forever Fields Memorial",
          text: memorialName
            ? `Visit ${memorialName}'s memorial on Forever Fields`
            : "Visit this memorial on Forever Fields",
          url: memorialSlug
            ? `${window.location.origin}/memorial/${memorialSlug}`
            : window.location.href,
        });
        setIsOpen(false);
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to callback
        if ((err as Error).name === "AbortError") {
          return;
        }
      }
    }
    // Fall back to custom share handler
    onShare?.();
    setIsOpen(false);
  }, [memorialName, memorialSlug, onShare]);

  // Default actions if none provided
  const defaultActions: QuickAction[] = [
    {
      id: "candle",
      icon: Flame,
      label: "Light Candle",
      color: "bg-amber-500",
      onClick: () => {
        onLightCandle?.();
        setIsOpen(false);
      },
    },
    {
      id: "flowers",
      icon: Flower2,
      label: "Leave Flowers",
      color: "bg-pink-500",
      onClick: () => {
        onLeaveFlowers?.();
        setIsOpen(false);
      },
    },
    {
      id: "guestbook",
      icon: BookOpen,
      label: "Sign Guestbook",
      color: "bg-sage",
      onClick: () => {
        onSignGuestbook?.();
        setIsOpen(false);
      },
    },
    {
      id: "photo",
      icon: Camera,
      label: "Add Photo",
      color: "bg-blue-500",
      onClick: () => {
        onAddPhoto?.();
        setIsOpen(false);
      },
    },
    {
      id: "share",
      icon: Share2,
      label: "Share",
      color: "bg-purple-500",
      onClick: handleShare,
    },
  ];

  // Add optional actions
  if (onFindCemetery) {
    defaultActions.push({
      id: "cemetery",
      icon: Map,
      label: "Find Cemetery",
      color: "bg-emerald-500",
      onClick: () => {
        onFindCemetery();
        setIsOpen(false);
      },
    });
  }

  if (onNotificationSettings) {
    defaultActions.push({
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      color: "bg-indigo-500",
      onClick: () => {
        onNotificationSettings();
        setIsOpen(false);
      },
    });
  }

  const actions = customActions || defaultActions;

  // Position classes
  const positionClasses = {
    "bottom-right": "right-4",
    "bottom-center": "left-1/2 -translate-x-1/2",
    "bottom-left": "left-4",
  };

  return (
    <div
      className={`fixed bottom-20 ${positionClasses[position]} z-40`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Action buttons */}
            <div className="absolute bottom-16 right-0 flex flex-col-reverse items-end gap-3 mb-2">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  onClick={action.onClick}
                  className="flex items-center gap-3 group"
                >
                  {/* Label */}
                  <span className="px-3 py-1.5 bg-white rounded-full shadow-lg text-sm font-medium text-gray-700 whitespace-nowrap">
                    {action.label}
                  </span>
                  {/* Icon button */}
                  <div
                    className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 group-active:scale-95`}
                  >
                    <action.icon className="w-5 h-5" />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors ${
          isOpen
            ? "bg-gray-600 text-white"
            : "bg-sage text-white hover:bg-sage-dark"
        }`}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}

/**
 * Compact bottom action bar for memorial pages
 */
export function MobileActionBar({
  onLightCandle,
  onLeaveFlowers,
  onSignGuestbook,
  onShare,
}: {
  onLightCandle?: () => void;
  onLeaveFlowers?: () => void;
  onSignGuestbook?: () => void;
  onShare?: () => void;
}) {
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
        return;
      } catch {
        // Fall through to callback
      }
    }
    onShare?.();
  }, [onShare]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        <ActionBarButton
          icon={Flame}
          label="Candle"
          color="text-amber-500"
          onClick={onLightCandle}
        />
        <ActionBarButton
          icon={Flower2}
          label="Flowers"
          color="text-pink-500"
          onClick={onLeaveFlowers}
        />
        <ActionBarButton
          icon={BookOpen}
          label="Guestbook"
          color="text-sage"
          onClick={onSignGuestbook}
        />
        <ActionBarButton
          icon={Share2}
          label="Share"
          color="text-purple-500"
          onClick={handleShare}
        />
      </div>
    </div>
  );
}

function ActionBarButton({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2 px-4 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <Icon className={`w-6 h-6 ${color}`} />
      <span className="text-xs text-gray-600">{label}</span>
    </button>
  );
}

/**
 * Swipeable quick action cards
 */
export function SwipeableQuickActions({
  memorialName,
  onLightCandle,
  onLeaveFlowers,
  onSignGuestbook,
}: {
  memorialName?: string;
  onLightCandle?: () => void;
  onLeaveFlowers?: () => void;
  onSignGuestbook?: () => void;
}) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-3 pb-2">
        <QuickActionCard
          icon={Flame}
          title="Light a Candle"
          description={memorialName ? `For ${memorialName}` : "Show you care"}
          color="from-amber-400 to-orange-500"
          onClick={onLightCandle}
        />
        <QuickActionCard
          icon={Flower2}
          title="Leave Flowers"
          description="Send virtual flowers"
          color="from-pink-400 to-rose-500"
          onClick={onLeaveFlowers}
        />
        <QuickActionCard
          icon={BookOpen}
          title="Sign Guestbook"
          description="Share a memory"
          color="from-sage to-sage-dark"
          onClick={onSignGuestbook}
        />
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex-shrink-0 w-36 p-4 rounded-2xl bg-gradient-to-br ${color} text-white text-left shadow-lg`}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="w-8 h-8 mb-2" />
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs opacity-90 mt-0.5">{description}</p>
    </motion.button>
  );
}
