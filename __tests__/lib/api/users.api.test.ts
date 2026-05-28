import { describe, it, expect, vi, beforeEach } from "vitest";
import { listUsers, getUser, createUser, updateUser, deleteUser } from "@/lib/api/users.api";

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

const mockUser = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  roleId: 2,
  role: { id: 2, name: "user", description: null },
  referredByUserId: null,
};

describe("Users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listUsers", () => {
    it("should call GET /users and return an array of users", async () => {
      const users = [mockUser];
      mockedHttp.get.mockResolvedValue({ data: users });

      const result = await listUsers();

      expect(mockedHttp.get).toHaveBeenCalledWith("/users");
      expect(mockedHttp.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    it("should return an empty array when there are no users", async () => {
      mockedHttp.get.mockResolvedValue({ data: [] });

      const result = await listUsers();

      expect(result).toEqual([]);
    });

    it("should propagate network errors", async () => {
      mockedHttp.get.mockRejectedValue(new Error("Network Error"));

      await expect(listUsers()).rejects.toThrow("Network Error");
    });
  });

  describe("getUser", () => {
    it("should call GET /users/:id and return the user", async () => {
      mockedHttp.get.mockResolvedValue({ data: mockUser });

      const result = await getUser(1);

      expect(mockedHttp.get).toHaveBeenCalledWith("/users/1");
      expect(result).toEqual(mockUser);
    });

    it("should propagate errors for non-existent user", async () => {
      mockedHttp.get.mockRejectedValue(new Error("Not Found"));

      await expect(getUser(999)).rejects.toThrow("Not Found");
    });
  });

  describe("createUser", () => {
    it("should call POST /users with the payload and return the created user", async () => {
      const payload = { name: "Jane Doe", email: "jane@example.com", roleId: 2 };
      const createdUser = { ...mockUser, id: 2, ...payload };
      mockedHttp.post.mockResolvedValue({ data: createdUser });

      const result = await createUser(payload);

      expect(mockedHttp.post).toHaveBeenCalledWith("/users", payload);
      expect(mockedHttp.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdUser);
    });

    it("should propagate validation errors", async () => {
      mockedHttp.post.mockRejectedValue(new Error("Bad Request"));

      await expect(createUser({})).rejects.toThrow("Bad Request");
    });
  });

  describe("updateUser", () => {
    it("should call PATCH /users/:id with the payload and return the updated user", async () => {
      const payload = { name: "John Updated" };
      const updatedUser = { ...mockUser, name: "John Updated" };
      mockedHttp.patch.mockResolvedValue({ data: updatedUser });

      const result = await updateUser(1, payload);

      expect(mockedHttp.patch).toHaveBeenCalledWith("/users/1", payload);
      expect(mockedHttp.patch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
    });

    it("should propagate errors on update failure", async () => {
      mockedHttp.patch.mockRejectedValue(new Error("Forbidden"));

      await expect(updateUser(1, { name: "X" })).rejects.toThrow("Forbidden");
    });
  });

  describe("deleteUser", () => {
    it("should call DELETE /users/:id and return deletion confirmation", async () => {
      mockedHttp.delete.mockResolvedValue({ data: { deleted: true } });

      const result = await deleteUser(1);

      expect(mockedHttp.delete).toHaveBeenCalledWith("/users/1");
      expect(mockedHttp.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ deleted: true });
    });

    it("should propagate errors on delete failure", async () => {
      mockedHttp.delete.mockRejectedValue(new Error("Conflict"));

      await expect(deleteUser(1)).rejects.toThrow("Conflict");
    });
  });
});
