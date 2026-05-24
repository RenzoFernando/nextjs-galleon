import type { User } from "@/types/user";

export const GLOBAL_ROLES = {
  SUPERADMIN: "superadmin",
  USER: "user",
} as const;

export type GlobalRoleName =
  (typeof GLOBAL_ROLES)[keyof typeof GLOBAL_ROLES];

export function getUserRoleName(user: User | null): string | null {
  return user?.role?.name ?? null;
}

export function hasRole(user: User | null, roleName: string): boolean {
  return getUserRoleName(user) === roleName;
}

export function hasAnyRole(user: User | null, roleNames: string[]): boolean {
  if (roleNames.length === 0) {
    return true;
  }

  return roleNames.some((roleName) => hasRole(user, roleName));
}

export function isSuperadmin(user: User | null): boolean {
  return hasRole(user, GLOBAL_ROLES.SUPERADMIN);
}

export function isRegularUser(user: User | null): boolean {
  return hasRole(user, GLOBAL_ROLES.USER);
}