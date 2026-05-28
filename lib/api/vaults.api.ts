import { http } from "@/lib/api/http";
import type { CreateVaultPayload, DeleteResponse, UpdateVaultPayload, Vault } from "@/types/vault";

export async function listVaults(): Promise<Vault[]> {
  const response = await http.get<Vault[]>("/vaults");
  return response.data;
}

export async function getVault(id: number): Promise<Vault> {
  const response = await http.get<Vault>(`/vaults/${id}`);
  return response.data;
}

export async function createVault(payload: CreateVaultPayload): Promise<Vault> {
  const response = await http.post<Vault>("/vaults", payload);
  return response.data;
}

export async function updateVault(id: number, payload: UpdateVaultPayload): Promise<Vault> {
  const response = await http.patch<Vault>(`/vaults/${id}`, payload);
  return response.data;
}

export async function deleteVault(id: number): Promise<DeleteResponse> {
  const response = await http.delete<DeleteResponse>(`/vaults/${id}`);
  return response.data;
}
