"use client";

import { Crown, Edit3, Eye, Users } from "lucide-react";

export type Role = "owner" | "editor" | "viewer" | "public";

interface RoleBadgeProps {
  role: Role;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const roleConfig: Record<
  Role,
  { label: string; icon: typeof Crown; bgColor: string; textColor: string }
> = {
  owner: {
    label: "Owner",
    icon: Crown,
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
  },
  editor: {
    label: "Editor",
    icon: Edit3,
    bgColor: "bg-sage-pale",
    textColor: "text-sage-dark",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
  },
  public: {
    label: "Public",
    icon: Users,
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
};

const sizeConfig = {
  sm: {
    padding: "px-2 py-0.5",
    iconSize: "w-3 h-3",
    textSize: "text-xs",
    gap: "gap-1",
  },
  md: {
    padding: "px-2.5 py-1",
    iconSize: "w-4 h-4",
    textSize: "text-sm",
    gap: "gap-1.5",
  },
  lg: {
    padding: "px-3 py-1.5",
    iconSize: "w-5 h-5",
    textSize: "text-base",
    gap: "gap-2",
  },
};

export function RoleBadge({ role, size = "md", showLabel = true }: RoleBadgeProps) {
  const config = roleConfig[role];
  const sizing = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center ${sizing.gap} ${sizing.padding} rounded-full ${config.bgColor} ${config.textColor} font-medium ${sizing.textSize}`}
    >
      <Icon className={sizing.iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
