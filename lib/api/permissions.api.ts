import { api } from "@/lib/api/http";
import type { Permission } from "@/types/permission";

export async function listPermissions(): Promise<Permission[]> {
  const response = await api.get<Permission[]>("/permissions");
  return response.data;
}

export async function getPermission(permissionId: number): Promise<Permission> {
  const response = await api.get<Permission>(`/permissions/${permissionId}`);
  return response.data;
}

export async function createPermission(payload: Partial<Permission>): Promise<Permission> {
  const response = await api.post<Permission>("/permissions", payload);
  return response.data;
}

export async function updatePermission(permissionId: number, payload: Partial<Permission>): Promise<Permission> {
  const response = await api.patch<Permission>(`/permissions/${permissionId}`, payload);
  return response.data;
}

export async function deletePermission(permissionId: number): Promise<{ deleted: boolean }> {
  const response = await api.delete<{ deleted: boolean }>(`/permissions/${permissionId}`);
  return response.data;
}
