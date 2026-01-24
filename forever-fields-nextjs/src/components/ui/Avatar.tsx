"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  status?: "online" | "offline" | "away" | "busy";
  className?: string;
  fallbackClassName?: string;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name?: string): string {
  if (!name) return "bg-gray-light";

  const colors = [
    "bg-sage",
    "bg-gold",
    "bg-twilight",
    "bg-lavender-subtle",
    "bg-sage-dark",
    "bg-gold-warm",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = "md",
      status,
      className,
      fallbackClassName,
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const sizes = {
      xs: "w-6 h-6 text-xs",
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-base",
      lg: "w-14 h-14 text-lg",
      xl: "w-20 h-20 text-xl",
      "2xl": "w-28 h-28 text-2xl",
    };

    const pixelSizes = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 56,
      xl: 80,
      "2xl": 112,
    };

    const statusSizes = {
      xs: "w-1.5 h-1.5",
      sm: "w-2 h-2",
      md: "w-2.5 h-2.5",
      lg: "w-3 h-3",
      xl: "w-4 h-4",
      "2xl": "w-5 h-5",
    };

    const statusColors = {
      online: "bg-success",
      offline: "bg-gray-light",
      away: "bg-gold",
      busy: "bg-error",
    };

    const showImage = src && !imageError;
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);

    return (
      <div ref={ref} className={cn("relative inline-block", className)}>
        {showImage ? (
          <Image
            src={src}
            alt={alt || name || "Avatar"}
            width={pixelSizes[size]}
            height={pixelSizes[size]}
            className={cn(
              "rounded-full object-cover ring-2 ring-white",
              sizes[size]
            )}
            onError={() => setImageError(true)}
            unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
          />
        ) : (
          <div
            className={cn(
              "rounded-full flex items-center justify-center font-medium text-white ring-2 ring-white",
              sizes[size],
              bgColor,
              fallbackClassName
            )}
            aria-label={name || "Avatar"}
          >
            {initials}
          </div>
        )}

        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
              statusSizes[size],
              statusColors[status]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

// Avatar Group for showing multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: AvatarProps["size"];
  className?: string;
}

function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  className,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const spacing = {
    xs: "-space-x-2",
    sm: "-space-x-2.5",
    md: "-space-x-3",
    lg: "-space-x-4",
    xl: "-space-x-5",
    "2xl": "-space-x-6",
  };

  const countSizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-lg",
    "2xl": "w-28 h-28 text-xl",
  };

  return (
    <div className={cn("flex items-center", spacing[size], className)}>
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          className="border-2 border-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full bg-sage-pale text-sage-dark flex items-center justify-center font-medium ring-2 ring-white",
            countSizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
