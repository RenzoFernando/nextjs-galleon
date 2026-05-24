export type CategoryKind = "income" | "expense" | "transfer";

export type Category = {
  id: number;
  vaultId: number;
  name: string;
  kind: CategoryKind;
  colorTag: string | null;
  isArchived: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryPayload = {
  name: string;
  kind: CategoryKind;
  colorTag?: string;
};

export type UpdateCategoryPayload = {
  name?: string;
  kind?: CategoryKind;
  colorTag?: string | null;
  isArchived?: boolean;
};
