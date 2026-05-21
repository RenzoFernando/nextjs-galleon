"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/http";
import { getVault, updateVault } from "@/lib/api/vaults.api";
import type { CurrencyCode, Vault, VaultType } from "@/types/vault";

type VaultFormState = {
  name: string;
  description: string;
  type: VaultType;
  baseCurrency: CurrencyCode;
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function EditVaultPage() {
  const router = useRouter();
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [form, setForm] = useState<VaultFormState>({
    name: "",
    description: "",
    type: "personal",
    baseCurrency: "Galleon",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof VaultFormState>(key: K, value: VaultFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadVault() {
    if (!Number.isFinite(vaultId) || vaultId <= 0) {
      setError("El identificador de la bóveda no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getVault(vaultId);
      setVault(data);
      setForm({
        name: data.name,
        description: data.description ?? "",
        type: data.type,
        baseCurrency: data.baseCurrency,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    setSaving(true);

    try {
      await updateVault(vaultId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        baseCurrency: form.baseCurrency,
      });

      router.push(`/vaults/${vaultId}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadVault();
  }, [vaultId]);

  return (
    <main className="min-h-screen bg-[#0C0C00] px-6 py-8 text-[#D6CCA8]">
      <section className="mx-auto w-full max-w-4xl">
        <Link href={vault ? `/vaults/${vault.id}` : "/vaults"} className="inline-flex rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">
          Volver
        </Link>

        <div className="mt-6 rounded-3xl border border-[#B39F84]/30 bg-[#19242E] p-8 shadow-2xl shadow-black/40">
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Editar bóveda</p>
          <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5]">{vault?.name ?? "Cargando bóveda"}</h1>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-3xl border border-[#B39F84]/20 bg-[#11180F] p-8 text-center text-[#B39F84]">
            Cargando información...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-8 shadow-xl shadow-black/30">
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                Nombre
                <input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                Descripción
                <textarea
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  rows={5}
                  className="resize-none rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                  Tipo
                  <select
                    value={form.type}
                    onChange={(event) => setField("type", event.target.value as VaultType)}
                    className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
                  >
                    <option value="personal">Personal</option>
                    <option value="shared">Compartida</option>
                    <option value="household">Hogar</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                  Moneda base
                  <select
                    value={form.baseCurrency}
                    onChange={(event) => setField("baseCurrency", event.target.value as CurrencyCode)}
                    className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
                  >
                    <option value="Galleon">Galleon</option>
                    <option value="Sickle">Sickle</option>
                    <option value="Knut">Knut</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={saving} className="rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8] disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <Link href={`/vaults/${vaultId}`} className="rounded-full border border-[#B39F84]/40 px-6 py-3 text-center text-sm font-bold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">
                Cancelar
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
