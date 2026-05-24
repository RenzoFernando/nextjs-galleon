import { api } from "@/lib/api/http";
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from "@/types/category";
import type { DeleteResponse } from "@/types/vault";

export async function listCategories(vaultId: number): Promise<Category[]> {
  const response = await api.get<Category[]>(`/vaults/${vaultId}/categories`);
  return response.data;
}

export async function getCategory(vaultId: number, categoryId: number): Promise<Category> {
  const response = await api.get<Category>(`/vaults/${vaultId}/categories/${categoryId}`);
  return response.data;
}

export async function createCategory(vaultId: number, payload: CreateCategoryPayload): Promise<Category> {
  const response = await api.post<Category>(`/vaults/${vaultId}/categories`, payload);
  return response.data;
}

export async function updateCategory(
  vaultId: number,
  categoryId: number,
  payload: UpdateCategoryPayload,
): Promise<Category> {
  const response = await api.patch<Category>(`/vaults/${vaultId}/categories/${categoryId}`, payload);
  return response.data;
}

export async function deleteCategory(vaultId: number, categoryId: number): Promise<DeleteResponse> {
  const response = await api.delete<DeleteResponse>(`/vaults/${vaultId}/categories/${categoryId}`);
  return response.data;
}
