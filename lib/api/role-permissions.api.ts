import { api } from "@/lib/api/http";
import type { RolePermission } from "@/types/role";

export async function assignPermissionToRole(
  roleId: number,
  permissionId: number,
): Promise<RolePermission> {
  const response = await api.post<RolePermission>(
    `/roles/${roleId}/permissions`,
    { permissionId },
  );
  return response.data;
}

export async function removePermissionFromRole(
  roleId: number,
  permissionId: number,
): Promise<{ deleted: boolean }> {
  const response = await api.delete<{ deleted: boolean }>(
    `/roles/${roleId}/permissions/${permissionId}`,
  );
  return response.data;
}
