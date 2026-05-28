import { http } from "@/lib/api/http";
import type { RolePermission } from "@/types/role";

export async function assignPermissionToRole(
  roleId: number,
  permissionId: number,
): Promise<RolePermission> {
  const response = await http.post<RolePermission>(
    "/permissions/assign-to-role",
    { roleId, permissionId },
  );
  return response.data;
}

export async function removePermissionFromRole(
  roleId: number,
  permissionId: number,
): Promise<{ deleted: boolean }> {
  const response = await http.delete<{ deleted: boolean }>(
    "/permissions/remove-from-role",
    {
      data: { roleId, permissionId },
    },
  );
  return response.data;
}
