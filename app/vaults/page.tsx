"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteVault, listVaults } from "@/lib/api/vaults.api";
import { getApiErrorMessage } from "@/lib/api/http";
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
    <main className="min-h-screen bg-[#0C0C00] px-6 py-8 text-[#D6CCA8]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-[#B39F84]/30 bg-[#19242E] p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Gringotts</p>
              <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5] md:text-5xl">Bóvedas mágicas</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D6CCA8]/80">
                Administra bóvedas personales, compartidas y del hogar con una estética sobria de banco mágico.
              </p>
            </div>
            <Link
              href="/vaults/new"
              className="inline-flex items-center justify-center rounded-full bg-[#7B2E2E] px-5 py-3 text-sm font-semibold text-[#F2E8D5] shadow-lg shadow-black/30 transition hover:bg-[#8f3a3a]"
            >
              Crear bóveda
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-[#B39F84]/20 bg-[#11180F] p-8 text-center text-[#B39F84]">
            Cargando bóvedas...
          </div>
        ) : null}

        {!loading && vaults.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#B39F84]/40 bg-[#11180F] p-10 text-center">
            <h2 className="font-serif text-2xl italic text-[#F2E8D5]">No hay bóvedas registradas</h2>
            <p className="mt-3 text-sm text-[#D6CCA8]/70">Crea la primera bóveda para comenzar a registrar categorías, comercios y movimientos.</p>
            <Link
              href="/vaults/new"
              className="mt-6 inline-flex rounded-full bg-[#B39F84] px-5 py-3 text-sm font-semibold text-[#0C0C00] transition hover:bg-[#D6CCA8]"
            >
              Crear primera bóveda
            </Link>
          </div>
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
                  <p className="mt-1">Usuario #{vault.ownerUserId}</p>
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
                <div className="mt-5 rounded-2xl border border-[#7B2E2E]/60 bg-[#2A1111] p-4 text-sm text-[#F2E8D5]">
                  <p>¿Eliminar esta bóveda?</p>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      disabled={deletingId === vault.id}
                      onClick={() => void handleDelete(vault.id)}
                      className="rounded-full bg-[#7B2E2E] px-4 py-2 font-semibold text-[#F2E8D5] disabled:opacity-60"
                    >
                      {deletingId === vault.id ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="rounded-full border border-[#B39F84]/40 px-4 py-2 font-semibold text-[#D6CCA8]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
