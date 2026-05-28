import { describe, it, expect } from "vitest";
import {
  getUserPermissionNames,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canReadUsers,
  canManageUsers,
  canReadRoles,
  canManageRoles,
  canReadPermissions,
  canManagePermissions,
  canSeeAdminMenu,
  GLOBAL_PERMISSIONS,
} from "@/lib/auth/permission-guards";
import type { User } from "@/types/user";

function createUserWithPermissions(roleName: string, permissions: string[]): User {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    roleId: 1,
    role: {
      id: 1,
      name: roleName,
      description: null,
      rolePermissions: permissions.map((name, index) => ({
        id: index + 1,
        roleId: 1,
        permissionId: index + 1,
        permission: { id: index + 1, name, description: null },
      })),
    },
    referredByUserId: null,
  };
}

function createSuperadmin(): User {
  return createUserWithPermissions("superadmin", []);
}

function createRegularUser(permissions: string[] = []): User {
  return createUserWithPermissions("user", permissions);
}

describe("Permission Guards", () => {
  describe("getUserPermissionNames", () => {
    it("should extract permission names from user role", () => {
      const user = createRegularUser(["user_read", "user_create"]);
      expect(getUserPermissionNames(user)).toEqual(["user_read", "user_create"]);
    });

    it("should return an empty array for null user", () => {
      expect(getUserPermissionNames(null)).toEqual([]);
    });

    it("should return an empty array when user has no permissions", () => {
      const user = createRegularUser([]);
      expect(getUserPermissionNames(user)).toEqual([]);
    });

    it("should return an empty array when rolePermissions is undefined", () => {
      const user = createRegularUser([]);
      user.role.rolePermissions = undefined;
      expect(getUserPermissionNames(user)).toEqual([]);
    });
  });

  describe("hasPermission", () => {
    it("should return true for superadmin regardless of permissions", () => {
      const user = createSuperadmin();
      expect(hasPermission(user, "any_permission")).toBe(true);
    });

    it("should return true when user has the specified permission", () => {
      const user = createRegularUser(["user_read"]);
      expect(hasPermission(user, "user_read")).toBe(true);
    });

    it("should return false when user does not have the specified permission", () => {
      const user = createRegularUser(["user_read"]);
      expect(hasPermission(user, "user_delete")).toBe(false);
    });

    it("should return false for null user", () => {
      expect(hasPermission(null, "user_read")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true when user has at least one of the permissions", () => {
      const user = createRegularUser(["user_read"]);
      expect(hasAnyPermission(user, ["user_read", "user_create"])).toBe(true);
    });

    it("should return false when user has none of the permissions", () => {
      const user = createRegularUser(["role_read"]);
      expect(hasAnyPermission(user, ["user_read", "user_create"])).toBe(false);
    });

    it("should return true for empty permission list", () => {
      const user = createRegularUser([]);
      expect(hasAnyPermission(user, [])).toBe(true);
    });

    it("should return true for superadmin regardless", () => {
      const user = createSuperadmin();
      expect(hasAnyPermission(user, ["user_read", "user_delete"])).toBe(true);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true when user has all specified permissions", () => {
      const user = createRegularUser(["user_read", "user_create"]);
      expect(hasAllPermissions(user, ["user_read", "user_create"])).toBe(true);
    });

    it("should return false when user is missing one permission", () => {
      const user = createRegularUser(["user_read"]);
      expect(hasAllPermissions(user, ["user_read", "user_create"])).toBe(false);
    });

    it("should return true for empty permission list", () => {
      const user = createRegularUser([]);
      expect(hasAllPermissions(user, [])).toBe(true);
    });

    it("should return true for superadmin regardless", () => {
      const user = createSuperadmin();
      expect(hasAllPermissions(user, ["user_read", "user_delete"])).toBe(true);
    });
  });

  describe("canReadUsers", () => {
    it("should return true for user with user_read permission", () => {
      const user = createRegularUser([GLOBAL_PERMISSIONS.USER_READ]);
      expect(canReadUsers(user)).toBe(true);
    });

    it("should return true for user with user_manage permission", () => {
      const user = createRegularUser([GLOBAL_PERMISSIONS.USER_MANAGE]);
      expect(canReadUsers(user)).toBe(true);
    });

    it("should return false for user without user permissions", () => {
      const user = createRegularUser(["role_read"]);
      expect(canReadUsers(user)).toBe(false);
    });

    it("should return true for superadmin", () => {
      expect(canReadUsers(createSuperadmin())).toBe(true);
    });
  });

  describe("canManageUsers", () => {
    it("should return true for user with user_manage", () => {
      expect(canManageUsers(createRegularUser([GLOBAL_PERMISSIONS.USER_MANAGE]))).toBe(true);
    });

    it("should return true for user with user_create", () => {
      expect(canManageUsers(createRegularUser([GLOBAL_PERMISSIONS.USER_CREATE]))).toBe(true);
    });

    it("should return true for user with user_update", () => {
      expect(canManageUsers(createRegularUser([GLOBAL_PERMISSIONS.USER_UPDATE]))).toBe(true);
    });

    it("should return true for user with user_delete", () => {
      expect(canManageUsers(createRegularUser([GLOBAL_PERMISSIONS.USER_DELETE]))).toBe(true);
    });

    it("should return false for user without management permissions", () => {
      expect(canManageUsers(createRegularUser([GLOBAL_PERMISSIONS.USER_READ]))).toBe(false);
    });
  });

  describe("canReadRoles", () => {
    it("should return true for user with role_read permission", () => {
      expect(canReadRoles(createRegularUser([GLOBAL_PERMISSIONS.ROLE_READ]))).toBe(true);
    });

    it("should return false for user without role_read", () => {
      expect(canReadRoles(createRegularUser(["user_read"]))).toBe(false);
    });

    it("should return true for superadmin", () => {
      expect(canReadRoles(createSuperadmin())).toBe(true);
    });
  });

  describe("canManageRoles", () => {
    it("should return true for user with role_create", () => {
      expect(canManageRoles(createRegularUser([GLOBAL_PERMISSIONS.ROLE_CREATE]))).toBe(true);
    });

    it("should return true for user with role_update", () => {
      expect(canManageRoles(createRegularUser([GLOBAL_PERMISSIONS.ROLE_UPDATE]))).toBe(true);
    });

    it("should return true for user with role_delete", () => {
      expect(canManageRoles(createRegularUser([GLOBAL_PERMISSIONS.ROLE_DELETE]))).toBe(true);
    });

    it("should return false for user with only role_read", () => {
      expect(canManageRoles(createRegularUser([GLOBAL_PERMISSIONS.ROLE_READ]))).toBe(false);
    });
  });

  describe("canReadPermissions", () => {
    it("should return true for user with permission_read", () => {
      expect(canReadPermissions(createRegularUser([GLOBAL_PERMISSIONS.PERMISSION_READ]))).toBe(true);
    });

    it("should return false without permission_read", () => {
      expect(canReadPermissions(createRegularUser([]))).toBe(false);
    });
  });

  describe("canManagePermissions", () => {
    it("should return true for user with permission_create", () => {
      expect(canManagePermissions(createRegularUser([GLOBAL_PERMISSIONS.PERMISSION_CREATE]))).toBe(true);
    });

    it("should return true for user with permission_assign", () => {
      expect(canManagePermissions(createRegularUser([GLOBAL_PERMISSIONS.PERMISSION_ASSIGN]))).toBe(true);
    });

    it("should return true for user with permission_remove", () => {
      expect(canManagePermissions(createRegularUser([GLOBAL_PERMISSIONS.PERMISSION_REMOVE]))).toBe(true);
    });

    it("should return false for user with only permission_read", () => {
      expect(canManagePermissions(createRegularUser([GLOBAL_PERMISSIONS.PERMISSION_READ]))).toBe(false);
    });
  });

  describe("canSeeAdminMenu", () => {
    it("should return true for superadmin", () => {
      expect(canSeeAdminMenu(createSuperadmin())).toBe(true);
    });

    it("should return true for user who can read users", () => {
      expect(canSeeAdminMenu(createRegularUser([GLOBAL_PERMISSIONS.USER_READ]))).toBe(true);
    });

    it("should return true for user who can manage roles", () => {
      expect(canSeeAdminMenu(createRegularUser([GLOBAL_PERMISSIONS.ROLE_CREATE]))).toBe(true);
    });

    it("should return true for user who can read permissions", () => {
      expect(canSeeAdminMenu(createRegularUser([GLOBAL_PERMISSIONS.PERMISSION_READ]))).toBe(true);
    });

    it("should return false for user without any admin permissions", () => {
      expect(canSeeAdminMenu(createRegularUser([]))).toBe(false);
    });

    it("should return false for null user", () => {
      expect(canSeeAdminMenu(null)).toBe(false);
    });
  });
});
