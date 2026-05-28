import type { Vault, VaultMembership, VaultPermission } from "@/types/vault";

export function getVaultPermissionLabel(permission: VaultPermission | null | undefined): string {
  const labels: Record<VaultPermission, string> = {
    viewer: "Lectura",
    editor: "Edición",
    admin: "Administración",
    owner: "Propietario",
  };

  return permission ? labels[permission] : "Sin acceso";
}

export function getCurrentUserVaultPermission(
  vault: Vault | null,
  memberships: VaultMembership[],
  userId?: number | null,
): VaultPermission | null {
  if (!vault || !userId) {
    return null;
  }

  if (vault.ownerUserId === userId) {
    return "owner";
  }

  return memberships.find((membership) => membership.userId === userId)?.permission ?? null;
}

export function canViewVaultResource(permission: VaultPermission | null | undefined): boolean {
  return (
    permission === "viewer" ||
    permission === "editor" ||
    permission === "admin" ||
    permission === "owner"
  );
}

export function canEditVaultResource(permission: VaultPermission | null | undefined): boolean {
  return permission === "editor" || permission === "admin" || permission === "owner";
}

export function canManageVaultMembers(permission: VaultPermission | null | undefined): boolean {
  return permission === "admin" || permission === "owner";
}

export function canDeleteVaultResource(permission: VaultPermission | null | undefined): boolean {
  return permission === "admin" || permission === "owner";
}
