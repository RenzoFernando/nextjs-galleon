import type { Permission } from "@/types/permission";

export interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  permission: Permission;
  createdAt?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions?: Permission[];
  rolePermissions?: RolePermission[];
  createdAt?: string;
  updatedAt?: string;
}
