import { http } from "@/lib/api/http";
import type { CreateMerchantPayload, Merchant, UpdateMerchantPayload } from "@/types/merchant";
import type { DeleteResponse } from "@/types/vault";

export async function listMerchants(vaultId: number): Promise<Merchant[]> {
  const response = await http.get<Merchant[]>(`/vaults/${vaultId}/merchants`);
  return response.data;
}

export async function getMerchant(vaultId: number, merchantId: number): Promise<Merchant> {
  const response = await http.get<Merchant>(`/vaults/${vaultId}/merchants/${merchantId}`);
  return response.data;
}

export async function createMerchant(vaultId: number, payload: CreateMerchantPayload): Promise<Merchant> {
  const response = await http.post<Merchant>(`/vaults/${vaultId}/merchants`, payload);
  return response.data;
}

export async function updateMerchant(
  vaultId: number,
  merchantId: number,
  payload: UpdateMerchantPayload,
): Promise<Merchant> {
  const response = await http.patch<Merchant>(`/vaults/${vaultId}/merchants/${merchantId}`, payload);
  return response.data;
}

export async function deleteMerchant(vaultId: number, merchantId: number): Promise<DeleteResponse> {
  const response = await http.delete<DeleteResponse>(`/vaults/${vaultId}/merchants/${merchantId}`);
  return response.data;
}
