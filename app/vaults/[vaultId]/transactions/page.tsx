"use client";

import AppShell from "@/components/layout/AppShell";
import { TransactionTypeBadge } from "@/components/vaults/TransactionTypeBadge";
import { VaultEmptyState } from "@/components/vaults/VaultEmptyState";
import { VaultErrorMessage } from "@/components/vaults/VaultErrorMessage";
import { VaultLoadingState } from "@/components/vaults/VaultLoadingState";
import { VaultPageHeader } from "@/components/vaults/VaultPageHeader";
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
  return Boolean(filters.q.trim() || filters.type || filters.categoryId || filters.dateFrom || filters.dateTo);
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
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

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
      setCategories(categoriesData);
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
    setEditingId(transaction.id);
    setEditForm(buildEditState(transaction));
  }

  async function handleUpdate(transaction: Transaction) {
    if (!editForm) {
      return;
    }

    setError(null);

    const amountMinor = Number(editForm.amountMinor);

    if (!Number.isInteger(amountMinor) || amountMinor < 1) {
      setError("El monto debe ser un entero mayor o igual a 1.");
      return;
    }

    if (!editForm.occurredAt) {
      setError("Selecciona la fecha de ocurrencia.");
      return;
    }

    try {
      const updated = await updateTransaction(vaultId, transaction.id, {
        type: editForm.type,
        amountMinor,
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
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleDelete(transactionId: number) {
    setError(null);

    try {
      await deleteTransaction(vaultId, transactionId);
      setTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
      setPendingDeleteId(null);
      setTotal((current) => Math.max(current - 1, 0));
    } catch (err) {
      setError(getApiErrorMessage(err));
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
            Nueva transacción
          </Link>
        </div>

        <VaultPageHeader
          eyebrow="Transacciones"
          title={vault?.name ?? "Bóveda"}
          description="Consulta, filtra, pagina, edita y elimina movimientos financieros mágicos."
        />

        <VaultErrorMessage message={error} />

        <form onSubmit={handleFilterSubmit} className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 lg:grid-cols-7 lg:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Buscar
            <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" placeholder="nota" />
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
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-7">
            <button type="submit" className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8]">
              Filtrar
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
            {filters.dateFrom ? <span className="rounded-full border border-[#B39F84]/30 px-3 py-1">Desde: {filters.dateFrom}</span> : null}
            {filters.dateTo ? <span className="rounded-full border border-[#B39F84]/30 px-3 py-1">Hasta: {filters.dateTo}</span> : null}
          </div>
        ) : null}

        <div className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-3 border-b border-[#B39F84]/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#D6CCA8]/75">{total} movimientos encontrados</p>
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

          {loading ? <VaultLoadingState message="Cargando transacciones..." /> : null}

          {!loading && transactions.length === 0 ? (
            <div className="py-5">
              <VaultEmptyState
                title="No hay transacciones"
                description="No existen movimientos que coincidan con los filtros actuales."
              />
            </div>
          ) : null}

          <div className="divide-y divide-[#B39F84]/15">
            {transactions.map((transaction) => (
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
                    <div className="flex gap-3 lg:col-span-4">
                      <button type="button" onClick={() => void handleUpdate(transaction)} className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00]">Guardar</button>
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
                  <div className="mt-4 rounded-2xl border border-[#7B2E2E]/60 bg-[#2A1111] p-4 text-sm text-[#F2E8D5]">
                    <p>¿Eliminar esta transacción?</p>
                    <div className="mt-3 flex gap-3">
                      <button type="button" onClick={() => void handleDelete(transaction.id)} className="rounded-full bg-[#7B2E2E] px-4 py-2 font-semibold">Eliminar</button>
                      <button type="button" onClick={() => setPendingDeleteId(null)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 font-semibold text-[#D6CCA8]">Cancelar</button>
                    </div>
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

