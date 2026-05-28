export interface PermissionRoleSummary {
  id: number;
  name: string;
  description: string | null;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  roles?: PermissionRoleSummary[];
  createdAt?: string;
  updatedAt?: string;
}
