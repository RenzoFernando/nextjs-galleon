import { http } from "@/lib/api/http";
import type {
  CreateVaultMembershipPayload,
  DeleteResponse,
  UpdateVaultMembershipPayload,
  VaultMembership,
} from "@/types/vault";

export async function listVaultMembers(vaultId: number): Promise<VaultMembership[]> {
  const response = await http.get<VaultMembership[]>(`/vaults/${vaultId}/members`);
  return response.data;
}

export async function getVaultMember(
  vaultId: number,
  membershipId: number,
): Promise<VaultMembership> {
  const response = await http.get<VaultMembership>(`/vaults/${vaultId}/members/${membershipId}`);
  return response.data;
}

export async function createVaultMember(
  vaultId: number,
  payload: CreateVaultMembershipPayload,
): Promise<VaultMembership> {
  const response = await http.post<VaultMembership>(`/vaults/${vaultId}/members`, payload);
  return response.data;
}

export async function updateVaultMember(
  vaultId: number,
  membershipId: number,
  payload: UpdateVaultMembershipPayload,
): Promise<VaultMembership> {
  const response = await http.patch<VaultMembership>(
    `/vaults/${vaultId}/members/${membershipId}`,
    payload,
  );
  return response.data;
}

export async function deleteVaultMember(
  vaultId: number,
  membershipId: number,
): Promise<DeleteResponse> {
  const response = await http.delete<DeleteResponse>(`/vaults/${vaultId}/members/${membershipId}`);
  return response.data;
}
