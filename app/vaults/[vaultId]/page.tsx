"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { listCategories } from "@/lib/api/categories.api";
import { getApiErrorMessage } from "@/lib/api/http";
import { listMerchants } from "@/lib/api/merchants.api";
import { listTransactions } from "@/lib/api/transactions.api";
import { deleteVault, getVault } from "@/lib/api/vaults.api";
import type { Vault } from "@/types/vault";

type Summary = {
  categories: number;
  merchants: number;
  transactions: number;
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date(value));
}

export default function VaultDetailPage() {
  const router = useRouter();
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [summary, setSummary] = useState<Summary>({ categories: 0, merchants: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadDetail() {
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
        listTransactions(vaultId, { page: 1, pageSize: 1 }),
      ]);

      setVault(vaultData);
      setSummary({
        categories: categoriesData.length,
        merchants: merchantsData.length,
        transactions: transactionsData.meta.total,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

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
  }, [vaultId]);

  return (
    <main className="min-h-screen bg-[#0C0C00] px-6 py-8 text-[#D6CCA8]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link href="/vaults" className="w-fit rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">
          Volver a bóvedas
        </Link>

        {error ? (
          <div className="rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-[#B39F84]/20 bg-[#11180F] p-8 text-center text-[#B39F84]">
            Cargando detalle de bóveda...
          </div>
        ) : null}

        {!loading && vault ? (
          <>
            <header className="rounded-3xl border border-[#B39F84]/30 bg-[#19242E] p-8 shadow-2xl shadow-black/40">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Bóveda #{vault.id}</p>
                  <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5] md:text-5xl">{vault.name}</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#D6CCA8]/80">
                    {vault.description || "Esta bóveda aún no tiene descripción registrada."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/vaults/${vault.id}/edit`} className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8]">
                    Editar bóveda
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-full border border-[#7B2E2E]/70 px-5 py-3 text-sm font-bold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </header>

            {confirmDelete ? (
              <div className="rounded-3xl border border-[#7B2E2E]/60 bg-[#2A1111] p-5 text-[#F2E8D5]">
                <p className="font-semibold">Esta acción eliminará la bóveda mediante soft delete.</p>
                <div className="mt-4 flex gap-3">
                  <button type="button" disabled={deleting} onClick={() => void handleDelete()} className="rounded-full bg-[#7B2E2E] px-5 py-2 text-sm font-bold disabled:opacity-60">
                    {deleting ? "Eliminando..." : "Confirmar eliminación"}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full border border-[#B39F84]/40 px-5 py-2 text-sm font-bold text-[#D6CCA8]">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Tipo</p>
                <p className="mt-2 text-xl font-semibold text-[#F2E8D5]">{vault.type}</p>
              </div>
              <div className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Moneda</p>
                <p className="mt-2 text-xl font-semibold text-[#F2E8D5]">{vault.baseCurrency}</p>
              </div>
              <div className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Owner</p>
                <p className="mt-2 text-xl font-semibold text-[#F2E8D5]">#{vault.ownerUserId}</p>
              </div>
              <div className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Creación</p>
                <p className="mt-2 text-xl font-semibold text-[#F2E8D5]">{formatDate(vault.createdAt)}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Link href={`/vaults/${vault.id}/members`} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 transition hover:-translate-y-1 hover:border-[#B39F84]/70">
                <p className="text-sm uppercase tracking-[0.25em] text-[#B39F84]">Miembros</p>
                <h2 className="mt-4 font-serif text-3xl italic text-[#F2E8D5]">Accesos</h2>
                <p className="mt-3 text-sm text-[#D6CCA8]/75">Gestionar usuarios y permisos internos.</p>
              </Link>
              <Link href={`/vaults/${vault.id}/categories`} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 transition hover:-translate-y-1 hover:border-[#B39F84]/70">
                <p className="text-sm uppercase tracking-[0.25em] text-[#B39F84]">Categorías</p>
                <h2 className="mt-4 font-serif text-3xl italic text-[#F2E8D5]">{summary.categories}</h2>
                <p className="mt-3 text-sm text-[#D6CCA8]/75">Ingresos, gastos y transferencias.</p>
              </Link>
              <Link href={`/vaults/${vault.id}/merchants`} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 transition hover:-translate-y-1 hover:border-[#B39F84]/70">
                <p className="text-sm uppercase tracking-[0.25em] text-[#B39F84]">Comercios</p>
                <h2 className="mt-4 font-serif text-3xl italic text-[#F2E8D5]">{summary.merchants}</h2>
                <p className="mt-3 text-sm text-[#D6CCA8]/75">Entidades mágicas asociadas.</p>
              </Link>
              <Link href={`/vaults/${vault.id}/transactions`} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 transition hover:-translate-y-1 hover:border-[#B39F84]/70">
                <p className="text-sm uppercase tracking-[0.25em] text-[#B39F84]">Movimientos</p>
                <h2 className="mt-4 font-serif text-3xl italic text-[#F2E8D5]">{summary.transactions}</h2>
                <p className="mt-3 text-sm text-[#D6CCA8]/75">Transacciones filtrables y paginadas.</p>
              </Link>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
