"use client";

import AppShell from "@/components/layout/AppShell";
import { VaultConfirmDelete } from "@/components/vaults/VaultConfirmDelete";
import { VaultEmptyState } from "@/components/vaults/VaultEmptyState";
import { VaultErrorMessage } from "@/components/vaults/VaultErrorMessage";
import { VaultLoadingState } from "@/components/vaults/VaultLoadingState";
import { VaultPageHeader } from "@/components/vaults/VaultPageHeader";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/http";
import { deleteVault, listVaults } from "@/lib/api/vaults.api";
import type { Vault } from "@/types/vault";

function vaultTypeLabel(type: Vault["type"]): string {
  const labels: Record<Vault["type"], string> = {
    personal: "Personal",
    shared: "Compartida",
    household: "Hogar",
  };

  return labels[type];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  async function loadVaults() {
    setLoading(true);
    setError(null);

    try {
      const data = await listVaults();
      setVaults(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError(null);

    try {
      await deleteVault(id);
      setVaults((current) => current.filter((vault) => vault.id !== id));
      setPendingDeleteId(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void loadVaults();
  }, []);

  return (
    <AppShell>
      <section className="flex w-full flex-col gap-8">
        <VaultPageHeader
          eyebrow="Gringotts"
          title="Bóvedas mágicas"
          description="Administra bóvedas personales, compartidas y del hogar con una estética sobria de banco mágico."
          actions={(
            <Link
              href="/vaults/new"
              className="inline-flex items-center justify-center rounded-full bg-[#7B2E2E] px-5 py-3 text-sm font-semibold text-[#F2E8D5] shadow-lg shadow-black/30 transition hover:bg-[#8f3a3a]"
            >
              Crear bóveda
            </Link>
          )}
        />

        <VaultErrorMessage message={error} />

        {loading ? <VaultLoadingState message="Cargando bóvedas..." /> : null}

        {!loading && vaults.length === 0 ? (
          <VaultEmptyState
            title="No hay bóvedas registradas"
            description="Crea la primera bóveda para comenzar a registrar categorías, comercios y movimientos."
            action={(
              <Link
                href="/vaults/new"
                className="inline-flex rounded-full bg-[#B39F84] px-5 py-3 text-sm font-semibold text-[#0C0C00] transition hover:bg-[#D6CCA8]"
              >
                Crear primera bóveda
              </Link>
            )}
          />
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {vaults.map((vault) => (
            <article
              key={vault.id}
              className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-[#B39F84]/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">{vault.baseCurrency}</p>
                  <h2 className="mt-2 font-serif text-2xl italic text-[#F2E8D5]">{vault.name}</h2>
                </div>
                <span className="rounded-full border border-[#B39F84]/30 px-3 py-1 text-xs text-[#D6CCA8]/80">
                  {vaultTypeLabel(vault.type)}
                </span>
              </div>

              <p className="mt-4 min-h-12 text-sm leading-6 text-[#D6CCA8]/75">
                {vault.description || "Sin descripción registrada."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-[#D6CCA8]/70">
                <div className="rounded-2xl bg-black/25 p-3">
                  <p className="uppercase tracking-[0.2em] text-[#B39F84]">Dueño</p>
                  <p className="mt-1">{vault.ownerUser?.name ?? `Usuario #${vault.ownerUserId}`}</p>
                </div>
                <div className="rounded-2xl bg-black/25 p-3">
                  <p className="uppercase tracking-[0.2em] text-[#B39F84]">Creada</p>
                  <p className="mt-1">{formatDate(vault.createdAt)}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/vaults/${vault.id}`}
                  className="rounded-full bg-[#B39F84] px-4 py-2 text-sm font-semibold text-[#0C0C00] transition hover:bg-[#D6CCA8]"
                >
                  Ver detalle
                </Link>
                <Link
                  href={`/vaults/${vault.id}/edit`}
                  className="rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(vault.id)}
                  className="rounded-full border border-[#7B2E2E]/70 px-4 py-2 text-sm font-semibold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25"
                >
                  Eliminar
                </button>
              </div>

              {pendingDeleteId === vault.id ? (
                <div className="mt-5">
                  <VaultConfirmDelete
                    title="¿Eliminar esta bóveda?"
                    confirmLabel="Sí, eliminar"
                    loading={deletingId === vault.id}
                    onConfirm={() => void handleDelete(vault.id)}
                    onCancel={() => setPendingDeleteId(null)}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
