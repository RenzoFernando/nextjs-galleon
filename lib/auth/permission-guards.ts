import type { User } from "@/types/user";
import { isSuperadmin } from "@/lib/auth/role-guards";

export const GLOBAL_PERMISSIONS = {
  USER_MANAGE: "user_manage",
  USER_CREATE: "user_create",
  USER_READ: "user_read",
  USER_UPDATE: "user_update",
  USER_DELETE: "user_delete",

  ROLE_CREATE: "role_create",
  ROLE_READ: "role_read",
  ROLE_UPDATE: "role_update",
  ROLE_DELETE: "role_delete",

  PERMISSION_CREATE: "permission_create",
  PERMISSION_READ: "permission_read",
  PERMISSION_UPDATE: "permission_update",
  PERMISSION_DELETE: "permission_delete",
  PERMISSION_ASSIGN: "permission_assign",
  PERMISSION_REMOVE: "permission_remove",

  VAULT_MANAGE: "vault_manage",
  TRANSACTION_MANAGE: "transaction_manage",
  TRANSACTION_READ: "transaction_read",
} as const;

export type GlobalPermissionName = (typeof GLOBAL_PERMISSIONS)[keyof typeof GLOBAL_PERMISSIONS];

export function getUserPermissionNames(user: User | null): string[] {
  const directPermissions =
    user?.role?.permissions
      ?.map((permission) => permission.name)
      .filter((permissionName): permissionName is string => Boolean(permissionName)) ?? [];

  const relationPermissions =
    user?.role?.rolePermissions
      ?.map((rolePermission) => rolePermission.permission?.name)
      .filter((permissionName): permissionName is string => Boolean(permissionName)) ?? [];

  return Array.from(new Set([...directPermissions, ...relationPermissions]));
}

export function hasPermission(user: User | null, permissionName: string): boolean {
  if (isSuperadmin(user)) {
    return true;
  }

  return getUserPermissionNames(user).includes(permissionName);
}

export function hasAnyPermission(user: User | null, permissionNames: string[]): boolean {
  if (permissionNames.length === 0) {
    return true;
  }

  if (isSuperadmin(user)) {
    return true;
  }

  return permissionNames.some((permissionName) => hasPermission(user, permissionName));
}

export function hasAllPermissions(user: User | null, permissionNames: string[]): boolean {
  if (permissionNames.length === 0) {
    return true;
  }

  if (isSuperadmin(user)) {
    return true;
  }

  return permissionNames.every((permissionName) => hasPermission(user, permissionName));
}

export function canReadUsers(user: User | null): boolean {
  return hasAnyPermission(user, [GLOBAL_PERMISSIONS.USER_READ, GLOBAL_PERMISSIONS.USER_MANAGE]);
}

export function canManageUsers(user: User | null): boolean {
  return hasAnyPermission(user, [
    GLOBAL_PERMISSIONS.USER_MANAGE,
    GLOBAL_PERMISSIONS.USER_CREATE,
    GLOBAL_PERMISSIONS.USER_UPDATE,
    GLOBAL_PERMISSIONS.USER_DELETE,
  ]);
}

export function canReadRoles(user: User | null): boolean {
  return hasPermission(user, GLOBAL_PERMISSIONS.ROLE_READ);
}

export function canManageRoles(user: User | null): boolean {
  return hasAnyPermission(user, [
    GLOBAL_PERMISSIONS.ROLE_CREATE,
    GLOBAL_PERMISSIONS.ROLE_UPDATE,
    GLOBAL_PERMISSIONS.ROLE_DELETE,
  ]);
}

export function canReadPermissions(user: User | null): boolean {
  return hasPermission(user, GLOBAL_PERMISSIONS.PERMISSION_READ);
}

export function canManagePermissions(user: User | null): boolean {
  return hasAnyPermission(user, [
    GLOBAL_PERMISSIONS.PERMISSION_CREATE,
    GLOBAL_PERMISSIONS.PERMISSION_UPDATE,
    GLOBAL_PERMISSIONS.PERMISSION_DELETE,
    GLOBAL_PERMISSIONS.PERMISSION_ASSIGN,
    GLOBAL_PERMISSIONS.PERMISSION_REMOVE,
  ]);
}

export function canSeeAdminMenu(user: User | null): boolean {
  return (
    isSuperadmin(user) ||
    canReadUsers(user) ||
    canManageUsers(user) ||
    canReadRoles(user) ||
    canManageRoles(user) ||
    canReadPermissions(user) ||
    canManagePermissions(user)
  );
}
