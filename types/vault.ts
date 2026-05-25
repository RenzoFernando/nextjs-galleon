export type CurrencyCode = "Galleon" | "Sickle" | "Knut";

export type VaultType = "personal" | "shared" | "household";

export type VaultPermission = "viewer" | "editor" | "admin" | "owner";

export type UserSummary = {
  id: number;
  name?: string;
  email?: string;
};

export type Vault = {
  id: number;
  name: string;
  description: string | null;
  type: VaultType;
  baseCurrency: CurrencyCode;
  ownerUserId: number;
  ownerUser?: UserSummary;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateVaultPayload = {
  name: string;
  description?: string;
  type: VaultType;
  baseCurrency: CurrencyCode;
};

export type UpdateVaultPayload = Partial<CreateVaultPayload>;

export type VaultMembership = {
  id: number;
  vaultId: number;
  userId: number;
  user?: UserSummary;
  permission: VaultPermission;
  createdAt: string;
  updatedAt: string;
};

export type CreateVaultMembershipPayload = {
  userId: number;
  permission: VaultPermission;
};

export type UpdateVaultMembershipPayload = {
  permission: VaultPermission;
};

export type DeleteResponse = {
  id: number;
  deleted: boolean;
};

