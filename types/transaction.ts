import type { Category } from "@/types/category";
import type { Merchant } from "@/types/merchant";
import type { CurrencyCode, UserSummary } from "@/types/vault";

export type TransactionType = "expense" | "income" | "transfer";

export type Transaction = {
  id: number;
  vaultId: number;
  type: TransactionType;
  amountMinor: number;
  currency: CurrencyCode;
  occurredAt: string;
  categoryId: number | null;
  merchantId: number | null;
  linkedTransactionId: number | null;
  note: string | null;
  receiptUrl: string | null;
  createdByUserId: number;
  category?: Category | null;
  merchant?: Merchant | null;
  createdByUser?: UserSummary;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransactionPayload = {
  type: TransactionType;
  amountMinor: number;
  currency: CurrencyCode;
  occurredAt: string;
  categoryId?: number | null;
  merchantId?: number | null;
  linkedTransactionId?: number | null;
  note?: string;
  receiptUrl?: string;
};

export type UpdateTransactionPayload = {
  type?: TransactionType;
  amountMinor?: number;
  currency?: CurrencyCode;
  occurredAt?: string;
  categoryId?: number | null;
  merchantId?: number | null;
  linkedTransactionId?: number | null;
  note?: string | null;
  receiptUrl?: string | null;
};

export type TransactionFilters = {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: number;
  type?: TransactionType;
  q?: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedTransactions = {
  data: Transaction[];
  meta: PaginationMeta;
};
