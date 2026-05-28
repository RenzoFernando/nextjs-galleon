import { http } from "@/lib/api/http";
import type {
  CreateTransactionPayload,
  PaginatedTransactions,
  Transaction,
  TransactionFilters,
  UpdateTransactionPayload,
} from "@/types/transaction";
import type { DeleteResponse } from "@/types/vault";

export async function listTransactions(
  vaultId: number,
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> {
  const response = await http.get<PaginatedTransactions>(`/vaults/${vaultId}/transactions`, {
    params: filters,
  });
  return response.data;
}

export async function getTransaction(vaultId: number, transactionId: number): Promise<Transaction> {
  const response = await http.get<Transaction>(`/vaults/${vaultId}/transactions/${transactionId}`);
  return response.data;
}

export async function createTransaction(
  vaultId: number,
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  const response = await http.post<Transaction>(`/vaults/${vaultId}/transactions`, payload);
  return response.data;
}

export async function updateTransaction(
  vaultId: number,
  transactionId: number,
  payload: UpdateTransactionPayload,
): Promise<Transaction> {
  const response = await http.patch<Transaction>(
    `/vaults/${vaultId}/transactions/${transactionId}`,
    payload,
  );
  return response.data;
}

export async function deleteTransaction(
  vaultId: number,
  transactionId: number,
): Promise<DeleteResponse> {
  const response = await http.delete<DeleteResponse>(
    `/vaults/${vaultId}/transactions/${transactionId}`,
  );
  return response.data;
}
