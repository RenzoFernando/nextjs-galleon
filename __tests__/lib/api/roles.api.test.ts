import { describe, it, expect, vi, beforeEach } from "vitest";
import { listRoles, getRole, createRole, updateRole, deleteRole } from "@/lib/api/roles.api";

vi.mock("@/lib/api/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { http } from "@/lib/api/http";

const mockedHttp = vi.mocked(http);

const mockRole = {
  id: 1,
  name: "admin",
  description: "Administrator role",
  rolePermissions: [],
};

describe("Roles API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listRoles", () => {
    it("should call GET /roles and return an array of roles", async () => {
      const roles = [mockRole, { ...mockRole, id: 2, name: "user" }];
      mockedHttp.get.mockResolvedValue({ data: roles });

      const result = await listRoles();

      expect(mockedHttp.get).toHaveBeenCalledWith("/roles");
      expect(mockedHttp.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(roles);
    });

    it("should return an empty array when there are no roles", async () => {
      mockedHttp.get.mockResolvedValue({ data: [] });

      const result = await listRoles();

      expect(result).toEqual([]);
    });

    it("should propagate network errors", async () => {
      mockedHttp.get.mockRejectedValue(new Error("Network Error"));

      await expect(listRoles()).rejects.toThrow("Network Error");
    });
  });

  describe("getRole", () => {
    it("should call GET /roles/:id and return the role", async () => {
      const roleWithPerms = {
        ...mockRole,
        rolePermissions: [
          { id: 1, roleId: 1, permissionId: 1, permission: { id: 1, name: "user_read", description: null } },
        ],
      };
      mockedHttp.get.mockResolvedValue({ data: roleWithPerms });

      const result = await getRole(1);

      expect(mockedHttp.get).toHaveBeenCalledWith("/roles/1");
      expect(result).toEqual(roleWithPerms);
      expect(result.rolePermissions).toHaveLength(1);
    });

    it("should propagate errors for non-existent role", async () => {
      mockedHttp.get.mockRejectedValue(new Error("Not Found"));

      await expect(getRole(999)).rejects.toThrow("Not Found");
    });
  });

  describe("createRole", () => {
    it("should call POST /roles with the payload and return the created role", async () => {
      const payload = { name: "editor", description: "Can edit content" };
      const createdRole = { id: 3, ...payload, rolePermissions: [] };
      mockedHttp.post.mockResolvedValue({ data: createdRole });

      const result = await createRole(payload);

      expect(mockedHttp.post).toHaveBeenCalledWith("/roles", payload);
      expect(mockedHttp.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdRole);
    });

    it("should handle role creation with null description", async () => {
      const payload = { name: "viewer", description: null };
      const createdRole = { id: 4, ...payload, rolePermissions: [] };
      mockedHttp.post.mockResolvedValue({ data: createdRole });

      const result = await createRole(payload);

      expect(result.description).toBeNull();
    });

    it("should propagate validation errors", async () => {
      mockedHttp.post.mockRejectedValue(new Error("Bad Request"));

      await expect(createRole({ name: "" })).rejects.toThrow("Bad Request");
    });
  });

  describe("updateRole", () => {
    it("should call PATCH /roles/:id with the payload and return the updated role", async () => {
      const payload = { name: "admin-updated", description: "Updated admin role" };
      const updatedRole = { ...mockRole, ...payload };
      mockedHttp.patch.mockResolvedValue({ data: updatedRole });

      const result = await updateRole(1, payload);

      expect(mockedHttp.patch).toHaveBeenCalledWith("/roles/1", payload);
      expect(mockedHttp.patch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedRole);
    });

    it("should propagate errors on update failure", async () => {
      mockedHttp.patch.mockRejectedValue(new Error("Forbidden"));

      await expect(updateRole(1, { name: "x" })).rejects.toThrow("Forbidden");
    });
  });

  describe("deleteRole", () => {
    it("should call DELETE /roles/:id and return deletion confirmation", async () => {
      mockedHttp.delete.mockResolvedValue({ data: { deleted: true } });

      const result = await deleteRole(1);

      expect(mockedHttp.delete).toHaveBeenCalledWith("/roles/1");
      expect(mockedHttp.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ deleted: true });
    });

    it("should propagate errors on delete failure", async () => {
      mockedHttp.delete.mockRejectedValue(new Error("Conflict"));

      await expect(deleteRole(1)).rejects.toThrow("Conflict");
    });
  });
});
