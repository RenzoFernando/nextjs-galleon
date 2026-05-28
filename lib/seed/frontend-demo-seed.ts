import { getApiErrorStatus } from "@/lib/api/http";
import { createPermission, listPermissions } from "@/lib/api/permissions.api";
import { assignPermissionToRole } from "@/lib/api/role-permissions.api";
import { createRole, listRoles, updateRole } from "@/lib/api/roles.api";
import { createUser, listUsers, updateUser } from "@/lib/api/users.api";
import type { Permission } from "@/types/permission";
import type { Role } from "@/types/role";
import type { User } from "@/types/user";

export const FRONTEND_DEMO_SEED = {
  roleName: "auditor",
  roleDescription: "Auditor de movimientos y reportes financieros",
  permissionName: "transaction_read",
  permissionDescription: "Consultar transacciones de bóvedas autorizadas",
  userName: "Percy Weasley",
  userEmail: "percy.weasley@nestea.hp",
  userPassword: "Gringotts2026*",
} as const;

export type SeedStepStatus = "created" | "exists" | "updated" | "assigned" | "skipped";

export interface SeedStep {
  label: string;
  status: SeedStepStatus;
  detail: string;
}

export interface FrontendSeedResult {
  role: Role;
  permission: Permission;
  user: User;
  steps: SeedStep[];
}

function getRolePermissions(role: Role): Permission[] {
  const directPermissions = role.permissions ?? [];
  const relationPermissions =
    role.rolePermissions
      ?.map((rolePermission) => rolePermission.permission)
      .filter((permission): permission is Permission => Boolean(permission)) ?? [];
  const permissionsById = new Map<number, Permission>();

  for (const permission of [...directPermissions, ...relationPermissions]) {
    permissionsById.set(permission.id, permission);
  }

  return Array.from(permissionsById.values());
}

async function ensurePermission(steps: SeedStep[]): Promise<Permission> {
  const permissions = await listPermissions();
  const existingPermission = permissions.find(
    (permission) => permission.name === FRONTEND_DEMO_SEED.permissionName,
  );

  if (existingPermission) {
    steps.push({
      label: "Permiso",
      status: "exists",
      detail: `${existingPermission.name} ya existe con ID ${existingPermission.id}.`,
    });
    return existingPermission;
  }

  try {
    const permission = await createPermission({
      name: FRONTEND_DEMO_SEED.permissionName,
      description: FRONTEND_DEMO_SEED.permissionDescription,
    });

    steps.push({
      label: "Permiso",
      status: "created",
      detail: `${permission.name} fue creado con ID ${permission.id}.`,
    });
    return permission;
  } catch (error) {
    if (getApiErrorStatus(error) === 409) {
      const refreshedPermissions = await listPermissions();
      const permission = refreshedPermissions.find(
        (item) => item.name === FRONTEND_DEMO_SEED.permissionName,
      );

      if (permission) {
        steps.push({
          label: "Permiso",
          status: "exists",
          detail: `${permission.name} ya existía con ID ${permission.id}.`,
        });
        return permission;
      }
    }

    throw error;
  }
}

async function ensureRole(steps: SeedStep[]): Promise<Role> {
  const roles = await listRoles();
  const existingRole = roles.find((role) => role.name === FRONTEND_DEMO_SEED.roleName);

  if (existingRole) {
    if (existingRole.description !== FRONTEND_DEMO_SEED.roleDescription) {
      const updatedRole = await updateRole(existingRole.id, {
        description: FRONTEND_DEMO_SEED.roleDescription,
      });

      steps.push({
        label: "Rol",
        status: "updated",
        detail: `${updatedRole.name} ya existía y se actualizó su descripción.`,
      });
      return updatedRole;
    }

    steps.push({
      label: "Rol",
      status: "exists",
      detail: `${existingRole.name} ya existe con ID ${existingRole.id}.`,
    });
    return existingRole;
  }

  try {
    const role = await createRole({
      name: FRONTEND_DEMO_SEED.roleName,
      description: FRONTEND_DEMO_SEED.roleDescription,
    });

    steps.push({
      label: "Rol",
      status: "created",
      detail: `${role.name} fue creado con ID ${role.id}.`,
    });
    return role;
  } catch (error) {
    if (getApiErrorStatus(error) === 409) {
      const refreshedRoles = await listRoles();
      const role = refreshedRoles.find((item) => item.name === FRONTEND_DEMO_SEED.roleName);

      if (role) {
        steps.push({
          label: "Rol",
          status: "exists",
          detail: `${role.name} ya existía con ID ${role.id}.`,
        });
        return role;
      }
    }

    throw error;
  }
}

async function ensureRolePermission(
  role: Role,
  permission: Permission,
  steps: SeedStep[],
): Promise<void> {
  const assignedPermissions = getRolePermissions(role);
  const alreadyAssigned = assignedPermissions.some((item) => item.id === permission.id);

  if (alreadyAssigned) {
    steps.push({
      label: "Asignación de permiso",
      status: "exists",
      detail: `${permission.name} ya estaba asignado al rol ${role.name}.`,
    });
    return;
  }

  try {
    await assignPermissionToRole(role.id, permission.id);
    steps.push({
      label: "Asignación de permiso",
      status: "assigned",
      detail: `${permission.name} quedó asignado al rol ${role.name}.`,
    });
  } catch (error) {
    if (getApiErrorStatus(error) === 409) {
      steps.push({
        label: "Asignación de permiso",
        status: "exists",
        detail: `${permission.name} ya estaba asignado al rol ${role.name}.`,
      });
      return;
    }

    throw error;
  }
}

async function ensureUser(role: Role, steps: SeedStep[]): Promise<User> {
  const users = await listUsers();
  const existingUser = users.find((user) => user.email === FRONTEND_DEMO_SEED.userEmail);

  if (existingUser) {
    const updatedUser = await updateUser(existingUser.id, {
      name: FRONTEND_DEMO_SEED.userName,
      password: FRONTEND_DEMO_SEED.userPassword,
      roleId: role.id,
    } as Partial<User>);

    steps.push({
      label: "Usuario",
      status: "updated",
      detail: `${updatedUser.email} ya existía y quedó con el rol ${role.name}.`,
    });
    return updatedUser;
  }

  try {
    const user = await createUser({
      name: FRONTEND_DEMO_SEED.userName,
      email: FRONTEND_DEMO_SEED.userEmail,
      password: FRONTEND_DEMO_SEED.userPassword,
      roleId: role.id,
    } as Partial<User>);

    steps.push({
      label: "Usuario",
      status: "created",
      detail: `${user.email} fue creado con el rol ${role.name}.`,
    });
    return user;
  } catch (error) {
    if (getApiErrorStatus(error) === 409) {
      const refreshedUsers = await listUsers();
      const user = refreshedUsers.find((item) => item.email === FRONTEND_DEMO_SEED.userEmail);

      if (user) {
        const updatedUser = await updateUser(user.id, {
          name: FRONTEND_DEMO_SEED.userName,
          password: FRONTEND_DEMO_SEED.userPassword,
          roleId: role.id,
        } as Partial<User>);

        steps.push({
          label: "Usuario",
          status: "updated",
          detail: `${updatedUser.email} ya existía y quedó con el rol ${role.name}.`,
        });
        return updatedUser;
      }
    }

    throw error;
  }
}

export async function runFrontendDemoSeed(): Promise<FrontendSeedResult> {
  const steps: SeedStep[] = [];
  const permission = await ensurePermission(steps);
  const role = await ensureRole(steps);

  await ensureRolePermission(role, permission, steps);

  const user = await ensureUser(role, steps);

  return {
    role,
    permission,
    user,
    steps,
  };
}
