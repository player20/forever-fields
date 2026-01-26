"use client";

import { ReactNode } from "react";
import { Role } from "./RoleBadge";

interface PermissionGuardProps {
  /** User's current role */
  userRole: Role;
  /** Roles that are allowed to see the children */
  allowedRoles: Role[];
  /** Content to show if user has permission */
  children: ReactNode;
  /** Optional content to show if user doesn't have permission */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user's role.
 *
 * @example
 * <PermissionGuard userRole="viewer" allowedRoles={["owner", "editor"]}>
 *   <EditButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  userRole,
  allowedRoles,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const hasPermission = allowedRoles.includes(userRole);

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Helper function to check if a role has a specific permission.
 * Useful for conditionally disabling buttons or hiding elements.
 */
export function hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Permission hierarchy - higher roles include lower role permissions
 */
const roleHierarchy: Record<Role, number> = {
  owner: 4,
  editor: 3,
  viewer: 2,
  public: 1,
};

/**
 * Check if a role meets a minimum required level.
 *
 * @example
 * meetsMinimumRole("editor", "viewer") // true - editor can do viewer things
 * meetsMinimumRole("viewer", "editor") // false - viewer can't do editor things
 */
export function meetsMinimumRole(userRole: Role, minimumRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Pre-defined permission checks for common actions
 */
export const permissions = {
  canEdit: (role: Role) => meetsMinimumRole(role, "editor"),
  canDelete: (role: Role) => role === "owner",
  canInvite: (role: Role) => role === "owner",
  canChangePrivacy: (role: Role) => role === "owner",
  canAddContent: (role: Role) => meetsMinimumRole(role, "editor"),
  canComment: (role: Role) => meetsMinimumRole(role, "viewer"),
  canLightCandle: (role: Role) => meetsMinimumRole(role, "public"),
};
