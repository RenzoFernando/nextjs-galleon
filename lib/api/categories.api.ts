import { http } from "@/lib/api/http";
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from "@/types/category";
import type { DeleteResponse } from "@/types/vault";

export async function listCategories(vaultId: number): Promise<Category[]> {
  const response = await http.get<Category[]>(`/vaults/${vaultId}/categories`);
  return response.data;
}

export async function getCategory(vaultId: number, categoryId: number): Promise<Category> {
  const response = await http.get<Category>(`/vaults/${vaultId}/categories/${categoryId}`);
  return response.data;
}

export async function createCategory(vaultId: number, payload: CreateCategoryPayload): Promise<Category> {
  const response = await http.post<Category>(`/vaults/${vaultId}/categories`, payload);
  return response.data;
}

export async function updateCategory(
  vaultId: number,
  categoryId: number,
  payload: UpdateCategoryPayload,
): Promise<Category> {
  const response = await http.patch<Category>(`/vaults/${vaultId}/categories/${categoryId}`, payload);
  return response.data;
}

export async function deleteCategory(vaultId: number, categoryId: number): Promise<DeleteResponse> {
  const response = await http.delete<DeleteResponse>(`/vaults/${vaultId}/categories/${categoryId}`);
  return response.data;
}
