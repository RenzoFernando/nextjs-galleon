"use client";

import AppShell from "@/components/layout/AppShell";
import { TransactionTypeBadge } from "@/components/vaults/TransactionTypeBadge";
import { VaultConfirmDelete } from "@/components/vaults/VaultConfirmDelete";
import { VaultErrorMessage } from "@/components/vaults/VaultErrorMessage";
import { VaultLoadingState } from "@/components/vaults/VaultLoadingState";
import { VaultPageHeader } from "@/components/vaults/VaultPageHeader";
import { VaultStatCard } from "@/components/vaults/VaultStatCard";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listCategories } from "@/lib/api/categories.api";
import { getApiErrorMessage } from "@/lib/api/http";
import { listMerchants } from "@/lib/api/merchants.api";
import { listTransactions } from "@/lib/api/transactions.api";
import { deleteVault, getVault } from "@/lib/api/vaults.api";
import type { Transaction } from "@/types/transaction";
import type { CurrencyCode, Vault } from "@/types/vault";

type Summary = {
  categories: number;
  merchants: number;
  transactions: number;
  income: number;
  expense: number;
  transfer: number;
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatAmount(amount: number, currency?: CurrencyCode): string {
  return `${amount.toLocaleString("es-CO")} ${currency ?? ""}`.trim();
}

function vaultTypeLabel(type: Vault["type"]): string {
  const labels: Record<Vault["type"], string> = {
    personal: "Personal",
    shared: "Compartida",
    household: "Hogar",
  };

  return labels[type];
}

export default function VaultDetailPage() {
  const router = useRouter();
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [summary, setSummary] = useState<Summary>({
    categories: 0,
    merchants: 0,
    transactions: 0,
    income: 0,
    expense: 0,
    transfer: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(vaultId) || vaultId <= 0) {
      setError("El identificador de la bóveda no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [vaultData, categoriesData, merchantsData, transactionsData] = await Promise.all([
        getVault(vaultId),
        listCategories(vaultId),
        listMerchants(vaultId),
        listTransactions(vaultId, { page: 1, pageSize: 100 }),
      ]);

      const income = transactionsData.data
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amountMinor, 0);
      const expense = transactionsData.data
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amountMinor, 0);
      const transfer = transactionsData.data
        .filter((transaction) => transaction.type === "transfer")
        .reduce((total, transaction) => total + transaction.amountMinor, 0);

      setVault(vaultData);
      setSummary({
        categories: categoriesData.filter((category) => !category.isArchived).length,
        merchants: merchantsData.length,
        transactions: transactionsData.meta.total,
        income,
        expense,
        transfer,
      });
      setRecentTransactions(transactionsData.data.slice(0, 5));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [vaultId]);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      await deleteVault(vaultId);
      router.push("/vaults");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const balance = summary.income - summary.expense;

  return (
    <AppShell>
      <section className="flex w-full flex-col gap-6">
        <Link
          href="/vaults"
          className="w-fit rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10"
        >
          Volver a bóvedas
        </Link>

        <VaultErrorMessage message={error} />

        {loading ? <VaultLoadingState message="Cargando bóveda..." /> : null}

        {!loading && vault ? (
          <>
            <VaultPageHeader
              eyebrow={`Bóveda #${vault.id}`}
              title={vault.name}
              description={vault.description || "Sin descripción registrada."}
              actions={
                <>
                  <Link
                    href={`/vaults/${vault.id}/edit`}
                    className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8]"
                  >
                    Editar bóveda
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-full border border-[#7B2E2E]/70 px-5 py-3 text-sm font-bold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25"
                  >
                    Eliminar
                  </button>
                </>
              }
            />

            {confirmDelete ? (
              <VaultConfirmDelete
                title="¿Eliminar esta bóveda?"
                confirmLabel="Confirmar eliminación"
                loading={deleting}
                onConfirm={() => void handleDelete()}
                onCancel={() => setConfirmDelete(false)}
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
              <VaultStatCard label="Tipo" value={vaultTypeLabel(vault.type)} />
              <VaultStatCard label="Moneda" value={vault.baseCurrency} />
              <VaultStatCard
                label="Dueño"
                value={vault.ownerUser?.name ?? `#${vault.ownerUserId}`}
              />
              <VaultStatCard label="Creada" value={formatDate(vault.createdAt)} />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <VaultStatCard
                label="Balance"
                value={formatAmount(balance, vault.baseCurrency)}
                description="Ingresos menos gastos"
              />
              <VaultStatCard
                label="Ingresos"
                value={formatAmount(summary.income, vault.baseCurrency)}
                description="Movimientos de entrada"
              />
              <VaultStatCard
                label="Gastos"
                value={formatAmount(summary.expense, vault.baseCurrency)}
                description="Movimientos de salida"
              />
              <VaultStatCard
                label="Transferencias"
                value={formatAmount(summary.transfer, vault.baseCurrency)}
                description="Movimientos internos"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Link
                href={`/vaults/${vault.id}/members`}
                className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 transition hover:-translate-y-1 hover:border-[#B39F84]/70"
              >
                <p className="text-sm uppercase tracking-[0.25em] text-[#B39F84]">Miembros</p>
                <h2 className="mt-4 font-serif text-3xl italic text-[#F2E8D5]">Accesos</h2>
                <p className="mt-3 text-sm text-[#D6CCA8]/75">Usuarios y permisos internos.</p>
              </Link>
              <Link
                href={`/vaults/${vault.id}/categories`}
                className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 transition hover:-translate-y-1 hover:border-[#B39F84]/70"
              >
                <p className="text-sm uppercase tracking-[0.25em] text-[#B39F84]">Categorías</p>
                <h2 className="mt-4 font-serif text-3xl italic text-[#F2E8D5]">
                  {summary.categories}
                </h2>
                <p className="mt-3 text-sm text-[#D6CCA8]/75">Clasificación de movimientos.</p>
              </Link>
              <Link
                href={`/vaults/${vault.id}/merchants`}
                className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 transition hover:-translate-y-1 hover:border-[#B39F84]/70"
              >
                <p className="text-sm uppercase tracking-[0.25em] text-[#B39F84]">Comercios</p>
                <h2 className="mt-4 font-serif text-3xl italic text-[#F2E8D5]">
                  {summary.merchants}
                </h2>
                <p className="mt-3 text-sm text-[#D6CCA8]/75">Lugares y entidades asociadas.</p>
              </Link>
              <Link
                href={`/vaults/${vault.id}/transactions`}
                className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 transition hover:-translate-y-1 hover:border-[#B39F84]/70"
              >
                <p className="text-sm uppercase tracking-[0.25em] text-[#B39F84]">Movimientos</p>
                <h2 className="mt-4 font-serif text-3xl italic text-[#F2E8D5]">
                  {summary.transactions}
                </h2>
                <p className="mt-3 text-sm text-[#D6CCA8]/75">Ingresos, gastos y transferencias.</p>
              </Link>
            </div>

            <section className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">
                    Actividad reciente
                  </p>
                  <h2 className="mt-2 font-serif text-2xl italic text-[#F2E8D5]">
                    Últimos movimientos
                  </h2>
                </div>
                <Link
                  href={`/vaults/${vault.id}/transactions/new`}
                  className="w-fit rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8]"
                >
                  Nuevo movimiento
                </Link>
              </div>

              <div className="mt-6 divide-y divide-[#B39F84]/15">
                {recentTransactions.map((transaction) => (
                  <article
                    key={transaction.id}
                    className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <TransactionTypeBadge type={transaction.type} />
                        <span className="text-sm text-[#D6CCA8]/70">
                          {formatShortDate(transaction.occurredAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
                        {formatAmount(transaction.amountMinor, transaction.currency)}
                      </p>
                      <p className="mt-1 text-sm text-[#D6CCA8]/70">
                        {transaction.note || "Sin nota"}
                      </p>
                    </div>
                    <Link
                      href={`/vaults/${vault.id}/transactions`}
                      className="w-fit rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10"
                    >
                      Ver movimientos
                    </Link>
                  </article>
                ))}

                {recentTransactions.length === 0 ? (
                  <div className="rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 p-4 text-sm text-[#D6CCA8]/75">
                    Aún no hay movimientos registrados.
                  </div>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
