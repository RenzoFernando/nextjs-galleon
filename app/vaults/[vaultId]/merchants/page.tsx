"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/http";
import { createMerchant, deleteMerchant, listMerchants, updateMerchant } from "@/lib/api/merchants.api";
import { getVault } from "@/lib/api/vaults.api";
import type { Merchant } from "@/types/merchant";
import type { Vault } from "@/types/vault";

type MerchantFormState = {
  name: string;
  location: string;
  notes: string;
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const initialForm: MerchantFormState = {
  name: "",
  location: "",
  notes: "",
};

export default function VaultMerchantsPage() {
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [form, setForm] = useState<MerchantFormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MerchantFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  async function loadData() {
    if (!Number.isFinite(vaultId) || vaultId <= 0) {
      setError("El identificador de la bóveda no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [vaultData, merchantsData] = await Promise.all([getVault(vaultId), listMerchants(vaultId)]);
      setVault(vaultData);
      setMerchants(merchantsData);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) {
      setError("El nombre del comercio debe tener al menos 2 caracteres.");
      return;
    }

    setSaving(true);

    try {
      const created = await createMerchant(vaultId, {
        name: form.name.trim(),
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setMerchants((current) => [created, ...current]);
      setForm(initialForm);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(merchant: Merchant) {
    setEditingId(merchant.id);
    setEditForm({
      name: merchant.name,
      location: merchant.location ?? "",
      notes: merchant.notes ?? "",
    });
  }

  async function handleUpdate(merchant: Merchant) {
    setError(null);

    if (editForm.name.trim().length < 2) {
      setError("El nombre del comercio debe tener al menos 2 caracteres.");
      return;
    }

    try {
      const updated = await updateMerchant(vaultId, merchant.id, {
        name: editForm.name.trim(),
        location: editForm.location.trim() || null,
        notes: editForm.notes.trim() || null,
      });
      setMerchants((current) => current.map((item) => (item.id === merchant.id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleDelete(merchantId: number) {
    setError(null);

    try {
      await deleteMerchant(vaultId, merchantId);
      setMerchants((current) => current.filter((merchant) => merchant.id !== merchantId));
      setPendingDeleteId(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  useEffect(() => {
    void loadData();
  }, [vaultId]);

  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link href={`/vaults/${vaultId}`} className="w-fit rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">
          Volver al detalle
        </Link>

        <header className="rounded-3xl border border-[#B39F84]/30 bg-[#19242E] p-8 shadow-2xl shadow-black/40">
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Comercios</p>
          <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5]">{vault?.name ?? "Bóveda"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D6CCA8]/80">
            Registra comercios, entidades o lugares mágicos asociados a los movimientos.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleCreate} className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="Gringotts Wizarding Bank"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Ubicación
            <input
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="Diagon Alley"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Notas
            <input
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="Entidad financiera mágica"
            />
          </label>

          <button type="submit" disabled={saving} className="rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8] disabled:opacity-60">
            {saving ? "Creando..." : "Crear"}
          </button>
        </form>

        {loading ? (
          <div className="rounded-3xl border border-[#B39F84]/20 bg-[#11180F] p-8 text-center text-[#B39F84]">Cargando comercios...</div>
        ) : null}

        {!loading && merchants.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#B39F84]/40 bg-[#11180F] p-8 text-center text-[#D6CCA8]/80">No hay comercios registrados.</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {merchants.map((merchant) => (
            <article key={merchant.id} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/30">
              {editingId === merchant.id ? (
                <div className="grid gap-4">
                  <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                  <input value={editForm.location} onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                  <textarea value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="resize-none rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => void handleUpdate(merchant)} className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00]">Guardar</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-full border border-[#B39F84]/40 px-5 py-3 text-sm font-bold text-[#D6CCA8]">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Comercio #{merchant.id}</p>
                    <h2 className="mt-2 font-serif text-2xl italic text-[#F2E8D5]">{merchant.name}</h2>
                    <p className="mt-3 text-sm text-[#D6CCA8]/75">{merchant.location || "Sin ubicación registrada."}</p>
                    <p className="mt-2 text-sm leading-6 text-[#D6CCA8]/65">{merchant.notes || "Sin notas registradas."}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => startEdit(merchant)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">Editar</button>
                    <button type="button" onClick={() => setPendingDeleteId(merchant.id)} className="rounded-full border border-[#7B2E2E]/70 px-4 py-2 text-sm font-semibold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25">Eliminar</button>
                  </div>
                </div>
              )}

              {pendingDeleteId === merchant.id ? (
                <div className="mt-4 rounded-2xl border border-[#7B2E2E]/60 bg-[#2A1111] p-4 text-sm text-[#F2E8D5]">
                  <p>¿Eliminar este comercio?</p>
                  <div className="mt-3 flex gap-3">
                    <button type="button" onClick={() => void handleDelete(merchant.id)} className="rounded-full bg-[#7B2E2E] px-4 py-2 font-semibold">Eliminar</button>
                    <button type="button" onClick={() => setPendingDeleteId(null)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 font-semibold text-[#D6CCA8]">Cancelar</button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

