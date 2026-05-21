export type Merchant = {
  id: number;
  vaultId: number;
  name: string;
  location: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMerchantPayload = {
  name: string;
  location?: string;
  notes?: string;
};

export type UpdateMerchantPayload = {
  name?: string;
  location?: string | null;
  notes?: string | null;
};
