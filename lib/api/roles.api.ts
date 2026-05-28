import { http } from "@/lib/api/http";
import type { Role } from "@/types/role";

export async function listRoles(): Promise<Role[]> {
  const response = await http.get<Role[]>("/roles");
  return response.data;
}

export async function getRole(roleId: number): Promise<Role> {
  const response = await http.get<Role>(`/roles/${roleId}`);
  return response.data;
}

export async function createRole(payload: Partial<Role>): Promise<Role> {
  const response = await http.post<Role>("/roles", payload);
  return response.data;
}

export async function updateRole(roleId: number, payload: Partial<Role>): Promise<Role> {
  const response = await http.patch<Role>(`/roles/${roleId}`, payload);
  return response.data;
}

export async function deleteRole(roleId: number): Promise<{ deleted: boolean }> {
  const response = await http.delete<{ deleted: boolean }>(`/roles/${roleId}`);
  return response.data;
}
