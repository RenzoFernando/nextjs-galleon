import { describe, it, expect } from "vitest";
import {
  getUserRoleName,
  hasRole,
  hasAnyRole,
  isSuperadmin,
  isRegularUser,
  GLOBAL_ROLES,
} from "@/lib/auth/role-guards";
import type { User } from "@/types/user";

function createUser(roleName: string): User {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    roleId: 1,
    role: {
      id: 1,
      name: roleName,
      description: null,
    },
    referredByUserId: null,
  };
}

describe("Role Guards", () => {
  describe("getUserRoleName", () => {
    it("should return the role name when user has a role", () => {
      const user = createUser("admin");
      expect(getUserRoleName(user)).toBe("admin");
    });

    it("should return null when user is null", () => {
      expect(getUserRoleName(null)).toBeNull();
    });

    it("should return null when user has no role", () => {
      const user = {
        id: 1,
        name: "Test",
        email: "t@t.com",
        roleId: 1,
        referredByUserId: null,
      } as User;
      (user as unknown as Record<string, unknown>).role = undefined;
      expect(getUserRoleName(user)).toBeNull();
    });
  });

  describe("hasRole", () => {
    it("should return true when user has the specified role", () => {
      const user = createUser("admin");
      expect(hasRole(user, "admin")).toBe(true);
    });

    it("should return false when user has a different role", () => {
      const user = createUser("user");
      expect(hasRole(user, "admin")).toBe(false);
    });

    it("should return false when user is null", () => {
      expect(hasRole(null, "admin")).toBe(false);
    });

    it("should be case-sensitive", () => {
      const user = createUser("Admin");
      expect(hasRole(user, "admin")).toBe(false);
    });
  });

  describe("hasAnyRole", () => {
    it("should return true when user has one of the specified roles", () => {
      const user = createUser("editor");
      expect(hasAnyRole(user, ["admin", "editor"])).toBe(true);
    });

    it("should return false when user has none of the specified roles", () => {
      const user = createUser("viewer");
      expect(hasAnyRole(user, ["admin", "editor"])).toBe(false);
    });

    it("should return true when role list is empty", () => {
      const user = createUser("user");
      expect(hasAnyRole(user, [])).toBe(true);
    });

    it("should return true when null user and role list is empty", () => {
      expect(hasAnyRole(null, [])).toBe(true);
    });

    it("should return false when user is null and role list is not empty", () => {
      expect(hasAnyRole(null, ["admin"])).toBe(false);
    });
  });

  describe("isSuperadmin", () => {
    it("should return true for superadmin role", () => {
      const user = createUser(GLOBAL_ROLES.SUPERADMIN);
      expect(isSuperadmin(user)).toBe(true);
    });

    it("should return false for non-superadmin role", () => {
      const user = createUser("user");
      expect(isSuperadmin(user)).toBe(false);
    });

    it("should return false for null user", () => {
      expect(isSuperadmin(null)).toBe(false);
    });
  });

  describe("isRegularUser", () => {
    it("should return true for user role", () => {
      const user = createUser(GLOBAL_ROLES.USER);
      expect(isRegularUser(user)).toBe(true);
    });

    it("should return false for superadmin role", () => {
      const user = createUser("superadmin");
      expect(isRegularUser(user)).toBe(false);
    });

    it("should return false for null user", () => {
      expect(isRegularUser(null)).toBe(false);
    });
  });
});
