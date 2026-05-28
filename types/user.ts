import type { Role } from "@/types/role";

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  role: Role;
  referredByUserId: number | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRoleName = "superadmin" | "user" | string;
