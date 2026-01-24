"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md" | "lg";
  pill?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      pill = false,
      removable = false,
      onRemove,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-sage-pale text-sage-dark",
      secondary: "bg-gray-light/30 text-gray-dark",
      success: "bg-success/10 text-success",
      warning: "bg-gold/10 text-gold-dark",
      error: "bg-error/10 text-error",
      outline: "bg-transparent border border-sage text-sage-dark",
    };

    const sizes = {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-2.5 py-1",
      lg: "text-base px-3 py-1.5",
    };

    const iconSizes = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 font-medium transition-colors",
          pill ? "rounded-full" : "rounded-md",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {icon && <span className={iconSizes[size]}>{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className={cn(
              "ml-1 rounded-full hover:bg-black/10 transition-colors p-0.5",
              iconSizes[size]
            )}
            aria-label="Remove"
          >
            <X className="w-full h-full" />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// Status Badge with dot indicator
interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "completed" | "error";
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

function StatusBadge({ status, label, size = "md", className }: StatusBadgeProps) {
  const statusConfig = {
    active: { color: "bg-success", text: "Active", bgColor: "bg-success/10 text-success" },
    inactive: { color: "bg-gray-light", text: "Inactive", bgColor: "bg-gray-light/30 text-gray-dark" },
    pending: { color: "bg-gold", text: "Pending", bgColor: "bg-gold/10 text-gold-dark" },
    completed: { color: "bg-sage", text: "Completed", bgColor: "bg-sage-pale text-sage-dark" },
    error: { color: "bg-error", text: "Error", bgColor: "bg-error/10 text-error" },
  };

  const config = statusConfig[status];
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
  };

  const textSizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        textSizes[size],
        className
      )}
    >
      <span className={cn("rounded-full", config.color, dotSizes[size])} />
      {label || config.text}
    </span>
  );
}

// Notification Badge (counter)
interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

function NotificationBadge({ count, max = 99, className }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-error rounded-full",
        className
      )}
    >
      {displayCount}
    </span>
  );
}

export { Badge, StatusBadge, NotificationBadge };
