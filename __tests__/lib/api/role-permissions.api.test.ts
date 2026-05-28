import { describe, it, expect, vi, beforeEach } from "vitest";
import { assignPermissionToRole, removePermissionFromRole } from "@/lib/api/role-permissions.api";

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

describe("Role-Permissions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("assignPermissionToRole", () => {
    it("should call POST /permissions/assign-to-role with roleId and permissionId", async () => {
      const mockResponse = {
        id: 1,
        roleId: 2,
        permissionId: 3,
        permission: { id: 3, name: "user_read", description: null },
      };
      mockedHttp.post.mockResolvedValue({ data: mockResponse });

      const result = await assignPermissionToRole(2, 3);

      expect(mockedHttp.post).toHaveBeenCalledWith("/permissions/assign-to-role", {
        roleId: 2,
        permissionId: 3,
      });
      expect(mockedHttp.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors when assignment fails", async () => {
      mockedHttp.post.mockRejectedValue(new Error("Conflict"));

      await expect(assignPermissionToRole(2, 3)).rejects.toThrow("Conflict");
    });
  });

  describe("removePermissionFromRole", () => {
    it("should call DELETE /permissions/remove-from-role with roleId and permissionId in body", async () => {
      mockedHttp.delete.mockResolvedValue({ data: { deleted: true } });

      const result = await removePermissionFromRole(2, 3);

      expect(mockedHttp.delete).toHaveBeenCalledWith("/permissions/remove-from-role", {
        data: { roleId: 2, permissionId: 3 },
      });
      expect(mockedHttp.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ deleted: true });
    });

    it("should propagate errors when removal fails", async () => {
      mockedHttp.delete.mockRejectedValue(new Error("Not Found"));

      await expect(removePermissionFromRole(2, 999)).rejects.toThrow("Not Found");
    });
  });
});
