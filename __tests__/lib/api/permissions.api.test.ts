import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
} from "@/lib/api/permissions.api";

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

const mockPermission = {
  id: 1,
  name: "user_read",
  description: "Can read users",
};

describe("Permissions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listPermissions", () => {
    it("should call GET /permissions and return an array of permissions", async () => {
      const permissions = [
        mockPermission,
        { id: 2, name: "user_create", description: "Can create users" },
      ];
      mockedHttp.get.mockResolvedValue({ data: permissions });

      const result = await listPermissions();

      expect(mockedHttp.get).toHaveBeenCalledWith("/permissions");
      expect(mockedHttp.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });

    it("should return an empty array when there are no permissions", async () => {
      mockedHttp.get.mockResolvedValue({ data: [] });

      const result = await listPermissions();

      expect(result).toEqual([]);
    });

    it("should propagate network errors", async () => {
      mockedHttp.get.mockRejectedValue(new Error("Network Error"));

      await expect(listPermissions()).rejects.toThrow("Network Error");
    });
  });

  describe("getPermission", () => {
    it("should call GET /permissions/:id and return the permission", async () => {
      mockedHttp.get.mockResolvedValue({ data: mockPermission });

      const result = await getPermission(1);

      expect(mockedHttp.get).toHaveBeenCalledWith("/permissions/1");
      expect(result).toEqual(mockPermission);
    });

    it("should propagate errors for non-existent permission", async () => {
      mockedHttp.get.mockRejectedValue(new Error("Not Found"));

      await expect(getPermission(999)).rejects.toThrow("Not Found");
    });
  });

  describe("createPermission", () => {
    it("should call POST /permissions with the payload and return the created permission", async () => {
      const payload = { name: "role_read", description: "Can read roles" };
      const created = { id: 3, ...payload };
      mockedHttp.post.mockResolvedValue({ data: created });

      const result = await createPermission(payload);

      expect(mockedHttp.post).toHaveBeenCalledWith("/permissions", payload);
      expect(mockedHttp.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(created);
    });

    it("should handle permission creation with null description", async () => {
      const payload = { name: "role_delete", description: null };
      const created = { id: 4, ...payload };
      mockedHttp.post.mockResolvedValue({ data: created });

      const result = await createPermission(payload);

      expect(result.description).toBeNull();
    });

    it("should propagate validation errors", async () => {
      mockedHttp.post.mockRejectedValue(new Error("Bad Request"));

      await expect(createPermission({})).rejects.toThrow("Bad Request");
    });
  });

  describe("updatePermission", () => {
    it("should call PATCH /permissions/:id with the payload and return the updated permission", async () => {
      const payload = { description: "Updated description" };
      const updated = { ...mockPermission, ...payload };
      mockedHttp.patch.mockResolvedValue({ data: updated });

      const result = await updatePermission(1, payload);

      expect(mockedHttp.patch).toHaveBeenCalledWith("/permissions/1", payload);
      expect(mockedHttp.patch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updated);
    });

    it("should propagate errors on update failure", async () => {
      mockedHttp.patch.mockRejectedValue(new Error("Forbidden"));

      await expect(updatePermission(1, { name: "x" })).rejects.toThrow("Forbidden");
    });
  });

  describe("deletePermission", () => {
    it("should call DELETE /permissions/:id and return deletion confirmation", async () => {
      mockedHttp.delete.mockResolvedValue({ data: { deleted: true } });

      const result = await deletePermission(1);

      expect(mockedHttp.delete).toHaveBeenCalledWith("/permissions/1");
      expect(mockedHttp.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ deleted: true });
    });

    it("should propagate errors on delete failure", async () => {
      mockedHttp.delete.mockRejectedValue(new Error("Conflict"));

      await expect(deletePermission(1)).rejects.toThrow("Conflict");
    });
  });
});
