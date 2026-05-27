"use client";

import AppShell from "@/components/layout/AppShell";
import { TransactionTypeBadge } from "@/components/vaults/TransactionTypeBadge";
import { VaultConfirmDelete } from "@/components/vaults/VaultConfirmDelete";
import { VaultEmptyState } from "@/components/vaults/VaultEmptyState";
import { VaultErrorMessage } from "@/components/vaults/VaultErrorMessage";
import { VaultLoadingState } from "@/components/vaults/VaultLoadingState";
import { VaultPageHeader } from "@/components/vaults/VaultPageHeader";
import { VaultStatCard } from "@/components/vaults/VaultStatCard";
import { VaultSuccessMessage } from "@/components/vaults/VaultSuccessMessage";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { listCategories } from "@/lib/api/categories.api";
import { getApiErrorMessage } from "@/lib/api/http";
import { listMerchants } from "@/lib/api/merchants.api";
import { deleteTransaction, listTransactions, updateTransaction } from "@/lib/api/transactions.api";
import { getVault } from "@/lib/api/vaults.api";
import type { Category } from "@/types/category";
import type { Merchant } from "@/types/merchant";
import type { Transaction, TransactionFilters, TransactionType } from "@/types/transaction";
import type { CurrencyCode, Vault } from "@/types/vault";

type FilterState = {
  page: number;
  pageSize: number;
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  merchantId: string;
  type: "" | TransactionType;
  q: string;
};

type EditState = {
  type: TransactionType;
  amountMinor: string;
  currency: CurrencyCode;
  occurredAt: string;
  categoryId: string;
  merchantId: string;
  note: string;
  receiptUrl: string;
};

const initialFilters: FilterState = {
  page: 1,
  pageSize: 10,
  dateFrom: "",
  dateTo: "",
  categoryId: "",
  merchantId: "",
  type: "",
  q: "",
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function toInputDate(value: string): string {
  return value ? value.slice(0, 10) : "";
}

function toIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function transactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    income: "Ingreso",
    expense: "Gasto",
    transfer: "Transferencia",
  };

  return labels[type];
}

function amountLabel(transaction: Transaction): string {
  return `${transaction.amountMinor.toLocaleString("es-CO")} ${transaction.currency}`;
}

function filtersToParams(filters: FilterState): TransactionFilters {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    type: filters.type || undefined,
    q: filters.q.trim() || undefined,
  };
}

function hasActiveFilters(filters: FilterState): boolean {
  return Boolean(filters.q.trim() || filters.type || filters.categoryId || filters.merchantId || filters.dateFrom || filters.dateTo);
}

function buildEditState(transaction: Transaction): EditState {
  return {
    type: transaction.type,
    amountMinor: String(transaction.amountMinor),
    currency: transaction.currency,
    occurredAt: toInputDate(transaction.occurredAt),
    categoryId: transaction.categoryId ? String(transaction.categoryId) : "",
    merchantId: transaction.merchantId ? String(transaction.merchantId) : "",
    note: transaction.note ?? "",
    receiptUrl: transaction.receiptUrl ?? "",
  };
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateEditForm(form: EditState): string | null {
  const amountMinor = Number(form.amountMinor);

  if (!Number.isInteger(amountMinor) || amountMinor < 1) {
    return "El monto debe ser un número entero mayor o igual a 1.";
  }

  if (!form.occurredAt) {
    return "Selecciona la fecha del movimiento.";
  }

  if (form.receiptUrl.trim() && !isValidUrl(form.receiptUrl)) {
    return "La URL del comprobante debe empezar por http:// o https://.";
  }

  return null;
}

export default function VaultTransactionsPage() {
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const visibleTransactions = useMemo(() => {
    if (!filters.merchantId) {
      return transactions;
    }

    return transactions.filter((transaction) => String(transaction.merchantId ?? "") === filters.merchantId);
  }, [filters.merchantId, transactions]);

  const currentSummary = useMemo(() => {
    return visibleTransactions.reduce(
      (summary, transaction) => {
        if (transaction.type === "income") {
          return { ...summary, income: summary.income + transaction.amountMinor };
        }

        if (transaction.type === "expense") {
          return { ...summary, expense: summary.expense + transaction.amountMinor };
        }

        return { ...summary, transfer: summary.transfer + transaction.amountMinor };
      },
      { income: 0, expense: 0, transfer: 0 },
    );
  }, [visibleTransactions]);

  async function loadCatalogs() {
    if (!Number.isFinite(vaultId) || vaultId <= 0) {
      setError("El identificador de la bóveda no es válido.");
      setLoading(false);
      return;
    }

    try {
      const [vaultData, categoriesData, merchantsData] = await Promise.all([
        getVault(vaultId),
        listCategories(vaultId),
        listMerchants(vaultId),
      ]);
      setVault(vaultData);
      setCategories(categoriesData.filter((category) => !category.isArchived));
      setMerchants(merchantsData);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function loadTransactions(nextFilters = filters) {
    setLoading(true);
    setError(null);

    try {
      const data = await listTransactions(vaultId, filtersToParams(nextFilters));
      setTransactions(data.data);
      setTotalPages(Math.max(data.meta.totalPages, 1));
      setTotal(data.meta.total);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      setError("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    void loadTransactions(nextFilters);
  }

  function clearFilters() {
    const nextFilters = { ...initialFilters, pageSize: filters.pageSize };
    setFilters(nextFilters);
    void loadTransactions(nextFilters);
  }

  function setPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const nextFilters = { ...filters, page: nextPage };
    setFilters(nextFilters);
    void loadTransactions(nextFilters);
  }

  function startEdit(transaction: Transaction) {
    setSuccess(null);
    setEditingId(transaction.id);
    setEditForm(buildEditState(transaction));
  }

  async function handleUpdate(transaction: Transaction) {
    if (!editForm) {
      return;
    }

    setError(null);
    setSuccess(null);

    const validationError = validateEditForm(editForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSavingId(transaction.id);

    try {
      const updated = await updateTransaction(vaultId, transaction.id, {
        type: editForm.type,
        amountMinor: Number(editForm.amountMinor),
        currency: editForm.currency,
        occurredAt: toIsoDate(editForm.occurredAt),
        categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
        merchantId: editForm.merchantId ? Number(editForm.merchantId) : null,
        note: editForm.note.trim() || null,
        receiptUrl: editForm.receiptUrl.trim() || null,
      });
      setTransactions((current) => current.map((item) => (item.id === transaction.id ? updated : item)));
      setEditingId(null);
      setEditForm(null);
      setSuccess("El movimiento fue actualizado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(transactionId: number) {
    setError(null);
    setSuccess(null);
    setDeletingId(transactionId);

    try {
      await deleteTransaction(vaultId, transactionId);
      setTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
      setPendingDeleteId(null);
      setTotal((current) => Math.max(current - 1, 0));
      setSuccess("El movimiento fue eliminado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void loadCatalogs();
  }, [vaultId]);

  useEffect(() => {
    void loadTransactions(filters);
  }, [vaultId]);

  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link href={`/vaults/${vaultId}`} className="w-fit rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">
            Volver al detalle
          </Link>
          <Link href={`/vaults/${vaultId}/transactions/new`} className="w-fit rounded-full bg-[#B39F84] px-5 py-2 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8]">
            Nuevo movimiento
          </Link>
        </div>

        <VaultPageHeader
          eyebrow="Movimientos"
          title={vault?.name ?? "Bóveda"}
          description="Consulta, filtra, edita y elimina ingresos, gastos o transferencias."
        />

        <VaultErrorMessage message={error} />
        <VaultSuccessMessage message={success} />

        <div className="grid gap-4 md:grid-cols-4">
          <VaultStatCard label="Resultados" value={filters.merchantId ? visibleTransactions.length : total} description={filters.merchantId ? "En esta página" : "Total filtrado"} />
          <VaultStatCard label="Ingresos" value={`${currentSummary.income.toLocaleString("es-CO")} ${vault?.baseCurrency ?? ""}`.trim()} description="En la página actual" />
          <VaultStatCard label="Gastos" value={`${currentSummary.expense.toLocaleString("es-CO")} ${vault?.baseCurrency ?? ""}`.trim()} description="En la página actual" />
          <VaultStatCard label="Transferencias" value={`${currentSummary.transfer.toLocaleString("es-CO")} ${vault?.baseCurrency ?? ""}`.trim()} description="En la página actual" />
        </div>

        <form onSubmit={handleFilterSubmit} className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 lg:grid-cols-8 lg:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5] lg:col-span-2">
            Buscar
            <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" placeholder="Texto en nota" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Tipo
            <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as FilterState["type"] }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
              <option value="">Todos</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
              <option value="transfer">Transferencia</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Categoría
            <select value={filters.categoryId} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
              <option value="">Todas</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Comercio
            <select value={filters.merchantId} onChange={(event) => setFilters((current) => ({ ...current, merchantId: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
              <option value="">Todos</option>
              {merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Desde
            <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Hasta
            <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Tamaño
            <select value={filters.pageSize} onChange={(event) => setFilters((current) => ({ ...current, pageSize: Number(event.target.value), page: 1 }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-8">
            <button type="submit" className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8]">
              Aplicar filtros
            </button>
            <button type="button" onClick={clearFilters} disabled={!hasActiveFilters(filters)} className="rounded-full border border-[#B39F84]/40 px-5 py-3 text-sm font-bold text-[#D6CCA8] transition hover:bg-[#B39F84]/10 disabled:cursor-not-allowed disabled:opacity-40">
              Limpiar filtros
            </button>
          </div>
        </form>

        {hasActiveFilters(filters) ? (
          <div className="flex flex-wrap gap-2 text-xs text-[#D6CCA8]/75">
            {filters.q.trim() ? <span className="rounded-full border border-[#B39F84]/30 px-3 py-1">Búsqueda: {filters.q.trim()}</span> : null}
            {filters.type ? <span className="rounded-full border border-[#B39F84]/30 px-3 py-1">Tipo: {transactionTypeLabel(filters.type)}</span> : null}
            {filters.categoryId ? <span className="rounded-full border border-[#B39F84]/30 px-3 py-1">Categoría #{filters.categoryId}</span> : null}
            {filters.merchantId ? <span className="rounded-full border border-[#B39F84]/30 px-3 py-1">Comercio #{filters.merchantId}</span> : null}
            {filters.dateFrom ? <span className="rounded-full border border-[#B39F84]/30 px-3 py-1">Desde: {filters.dateFrom}</span> : null}
            {filters.dateTo ? <span className="rounded-full border border-[#B39F84]/30 px-3 py-1">Hasta: {filters.dateTo}</span> : null}
          </div>
        ) : null}

        <div className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-3 border-b border-[#B39F84]/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#D6CCA8]/75">{filters.merchantId ? visibleTransactions.length : total} movimientos encontrados</p>
            <div className="flex items-center gap-3">
              <button type="button" disabled={filters.page <= 1} onClick={() => setPage(filters.page - 1)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] disabled:opacity-40">
                Anterior
              </button>
              <span className="text-sm text-[#F2E8D5]">Página {filters.page} de {totalPages}</span>
              <button type="button" disabled={filters.page >= totalPages} onClick={() => setPage(filters.page + 1)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] disabled:opacity-40">
                Siguiente
              </button>
            </div>
          </div>

          {loading ? <VaultLoadingState message="Cargando movimientos..." /> : null}

          {!loading && visibleTransactions.length === 0 ? (
            <div className="py-5">
              <VaultEmptyState
                title="No hay movimientos"
                description="No existen movimientos que coincidan con los filtros actuales."
              />
            </div>
          ) : null}

          <div className="divide-y divide-[#B39F84]/15">
            {visibleTransactions.map((transaction) => (
              <article key={transaction.id} className="py-5">
                {editingId === transaction.id && editForm ? (
                  <div className="grid gap-4 lg:grid-cols-4">
                    <select value={editForm.type} onChange={(event) => setEditForm((current) => current ? { ...current, type: event.target.value as TransactionType } : current)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
                      <option value="income">Ingreso</option>
                      <option value="expense">Gasto</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                    <input type="number" min="1" value={editForm.amountMinor} onChange={(event) => setEditForm((current) => current ? { ...current, amountMinor: event.target.value } : current)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                    <select value={editForm.currency} onChange={(event) => setEditForm((current) => current ? { ...current, currency: event.target.value as CurrencyCode } : current)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
                      <option value="Galleon">Galleon</option>
                      <option value="Sickle">Sickle</option>
                      <option value="Knut">Knut</option>
                    </select>
                    <input type="date" value={editForm.occurredAt} onChange={(event) => setEditForm((current) => current ? { ...current, occurredAt: event.target.value } : current)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                    <select value={editForm.categoryId} onChange={(event) => setEditForm((current) => current ? { ...current, categoryId: event.target.value } : current)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
                      <option value="">Sin categoría</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    <select value={editForm.merchantId} onChange={(event) => setEditForm((current) => current ? { ...current, merchantId: event.target.value } : current)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
                      <option value="">Sin comercio</option>
                      {merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}
                    </select>
                    <input value={editForm.note} onChange={(event) => setEditForm((current) => current ? { ...current, note: event.target.value } : current)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" placeholder="Nota" />
                    <input value={editForm.receiptUrl} onChange={(event) => setEditForm((current) => current ? { ...current, receiptUrl: event.target.value } : current)} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" placeholder="URL comprobante" />
                    <div className="flex flex-wrap gap-3 lg:col-span-4">
                      <button type="button" disabled={savingId === transaction.id} onClick={() => void handleUpdate(transaction)} className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00] disabled:opacity-60">{savingId === transaction.id ? "Guardando..." : "Guardar"}</button>
                      <button type="button" onClick={() => { setEditingId(null); setEditForm(null); }} className="rounded-full border border-[#B39F84]/40 px-5 py-3 text-sm font-bold text-[#D6CCA8]">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <TransactionTypeBadge type={transaction.type} />
                        <span className="text-sm text-[#D6CCA8]/70">{new Date(transaction.occurredAt).toLocaleDateString("es-CO")}</span>
                      </div>
                      <h2 className="mt-3 font-serif text-2xl italic text-[#F2E8D5]">{amountLabel(transaction)}</h2>
                      <p className="mt-2 text-sm text-[#D6CCA8]/75">{transaction.note || "Sin nota"}</p>
                      <p className="mt-1 text-sm text-[#D6CCA8]/60">
                        Categoría: {transaction.category?.name ?? (transaction.categoryId ? `#${transaction.categoryId}` : "N/A")} · Comercio: {transaction.merchant?.name ?? (transaction.merchantId ? `#${transaction.merchantId}` : "N/A")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => startEdit(transaction)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">Editar</button>
                      <button type="button" onClick={() => setPendingDeleteId(transaction.id)} className="rounded-full border border-[#7B2E2E]/70 px-4 py-2 text-sm font-semibold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25">Eliminar</button>
                    </div>
                  </div>
                )}

                {pendingDeleteId === transaction.id ? (
                  <div className="mt-4">
                    <VaultConfirmDelete
                      title="¿Eliminar este movimiento?"
                      confirmLabel="Eliminar"
                      loading={deletingId === transaction.id}
                      onConfirm={() => void handleDelete(transaction.id)}
                      onCancel={() => setPendingDeleteId(null)}
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
