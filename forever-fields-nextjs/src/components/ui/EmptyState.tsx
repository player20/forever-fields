"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";
import {
  FileText,
  Users,
  Heart,
  Calendar,
  MessageSquare,
  Search,
  FolderOpen,
  Inbox,
  Camera,
} from "lucide-react";

type EmptyStateType =
  | "default"
  | "photos"
  | "documents"
  | "family"
  | "memories"
  | "events"
  | "messages"
  | "search"
  | "folder"
  | "inbox";

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const typeIcons: Record<EmptyStateType, React.ReactNode> = {
  default: <Inbox className="w-full h-full" />,
  photos: <Camera className="w-full h-full" />,
  documents: <FileText className="w-full h-full" />,
  family: <Users className="w-full h-full" />,
  memories: <Heart className="w-full h-full" />,
  events: <Calendar className="w-full h-full" />,
  messages: <MessageSquare className="w-full h-full" />,
  search: <Search className="w-full h-full" />,
  folder: <FolderOpen className="w-full h-full" />,
  inbox: <Inbox className="w-full h-full" />,
};

export function EmptyState({
  type = "default",
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: "py-8 px-4",
      iconWrapper: "w-12 h-12 mb-3",
      title: "text-base",
      description: "text-sm",
    },
    md: {
      container: "py-12 px-6",
      iconWrapper: "w-16 h-16 mb-4",
      title: "text-lg",
      description: "text-base",
    },
    lg: {
      container: "py-16 px-8",
      iconWrapper: "w-20 h-20 mb-5",
      title: "text-xl",
      description: "text-base",
    },
  };

  const sizeConfig = sizes[size];
  const displayIcon = icon || typeIcons[type];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeConfig.container,
        className
      )}
    >
      {/* Icon with decorative background */}
      <div
        className={cn(
          "rounded-full bg-sage-pale/50 p-4 text-sage",
          sizeConfig.iconWrapper
        )}
      >
        {displayIcon}
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-serif font-semibold text-gray-dark mb-2",
          sizeConfig.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            "text-gray-body max-w-md mb-6",
            sizeConfig.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant || "primary"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios
export function EmptyPhotos({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      type="photos"
      title="No photos yet"
      description="Upload photos to preserve precious memories and share them with family."
      action={
        onUpload
          ? { label: "Upload Photos", onClick: onUpload }
          : undefined
      }
    />
  );
}

export function EmptyMemories({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      type="memories"
      title="No memories shared"
      description="Be the first to share a memory and help keep their legacy alive."
      action={onAdd ? { label: "Share a Memory", onClick: onAdd } : undefined}
    />
  );
}

export function EmptySearch({ query }: { query?: string }) {
  return (
    <EmptyState
      type="search"
      title="No results found"
      description={
        query
          ? `We couldn't find anything matching "${query}". Try adjusting your search.`
          : "Try searching for something else."
      }
    />
  );
}

export function EmptyFamily({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      type="family"
      title="No family members added"
      description="Build your family tree by adding relatives and their connections."
      action={onAdd ? { label: "Add Family Member", onClick: onAdd } : undefined}
    />
  );
}

export function EmptyMessages() {
  return (
    <EmptyState
      type="messages"
      title="No messages"
      description="Messages from family and friends will appear here."
    />
  );
}

export function EmptyDocuments({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      type="documents"
      title="No documents uploaded"
      description="Store important documents like wills, certificates, and letters securely."
      action={
        onUpload ? { label: "Upload Document", onClick: onUpload } : undefined
      }
    />
  );
}
