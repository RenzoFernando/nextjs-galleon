"use client";

import AppShell from "@/components/layout/AppShell";
import { VaultErrorMessage } from "@/components/vaults/VaultErrorMessage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createVault } from "@/lib/api/vaults.api";
import { getApiErrorMessage } from "@/lib/api/http";
import type { CurrencyCode, VaultType } from "@/types/vault";

type VaultFormState = {
  name: string;
  description: string;
  type: VaultType;
  baseCurrency: CurrencyCode;
};

const initialState: VaultFormState = {
  name: "",
  description: "",
  type: "personal",
  baseCurrency: "Galleon",
};

export default function NewVaultPage() {
  const router = useRouter();
  const [form, setForm] = useState<VaultFormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof VaultFormState>(key: K, value: VaultFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
      const created = await createVault({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        baseCurrency: form.baseCurrency,
      });

      router.push(`/vaults/${created.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-3xl border border-[#B39F84]/30 bg-[#19242E] p-8 shadow-2xl shadow-black/40">
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Nueva bóveda</p>
          <h1 className="mt-4 font-serif text-4xl italic text-[#F2E8D5]">Abrir una cámara de seguridad mágica</h1>
          <p className="mt-5 text-sm leading-7 text-[#D6CCA8]/75">
            Define el nombre, tipo y moneda base. Después podrás administrar miembros, categorías, comercios y transacciones.
          </p>
          <Link
            href="/vaults"
            className="mt-8 inline-flex rounded-full border border-[#B39F84]/40 px-5 py-3 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10"
          >
            Volver a bóvedas
          </Link>
        </aside>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-8 shadow-xl shadow-black/30">
          <div className="mb-6">
            <VaultErrorMessage message={error} />
          </div>

          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
              Nombre
              <input
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/35 focus:border-[#B39F84]"
                placeholder="Bóveda Familiar Weasley"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
              Descripción
              <textarea
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                rows={5}
                className="resize-none rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/35 focus:border-[#B39F84]"
                placeholder="Bóveda compartida para gastos mágicos del grupo"
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
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8] disabled:opacity-60"
            >
              {saving ? "Creando bóveda..." : "Crear bóveda"}
            </button>
            <Link
              href="/vaults"
              className="rounded-full border border-[#B39F84]/40 px-6 py-3 text-center text-sm font-bold text-[#D6CCA8] transition hover:bg-[#B39F84]/10"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </AppShell>
  );
}

