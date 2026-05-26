import { api } from "@/lib/api/http";
import type { User } from "@/types/user";

export async function listUsers(): Promise<User[]> {
  const response = await api.get<User[]>("/users");
  return response.data;
}

export async function getUser(userId: number): Promise<User> {
  const response = await api.get<User>(`/users/${userId}`);
  return response.data;
}

export async function createUser(payload: Partial<User>): Promise<User> {
  const response = await api.post<User>("/users", payload);
  return response.data;
}

export async function updateUser(userId: number, payload: Partial<User>): Promise<User> {
  const response = await api.patch<User>(`/users/${userId}`, payload);
  return response.data;
}

export async function deleteUser(userId: number): Promise<{ deleted: boolean }> {
  const response = await api.delete<{ deleted: boolean }>(`/users/${userId}`);
  return response.data;
}
