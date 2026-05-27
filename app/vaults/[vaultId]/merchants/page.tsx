"use client";

import AppShell from "@/components/layout/AppShell";
import { VaultConfirmDelete } from "@/components/vaults/VaultConfirmDelete";
import { VaultEmptyState } from "@/components/vaults/VaultEmptyState";
import { VaultErrorMessage } from "@/components/vaults/VaultErrorMessage";
import { VaultLoadingState } from "@/components/vaults/VaultLoadingState";
import { VaultSuccessMessage } from "@/components/vaults/VaultSuccessMessage";
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

type MerchantFilters = {
  q: string;
  field: "all" | "name" | "location" | "notes";
};

const initialForm: MerchantFormState = {
  name: "",
  location: "",
  notes: "",
};

const initialFilters: MerchantFilters = {
  q: "",
  field: "all",
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalize(value: string | null | undefined): string {
  return value?.toLowerCase().trim() ?? "";
}

function validateForm(form: MerchantFormState): string | null {
  if (form.name.trim().length < 2) {
    return "El nombre del comercio debe tener al menos 2 caracteres.";
  }

  if (form.name.trim().length > 80) {
    return "El nombre del comercio no debe superar 80 caracteres.";
  }

  if (form.location.trim().length > 100) {
    return "La ubicación no debe superar 100 caracteres.";
  }

  if (form.notes.trim().length > 180) {
    return "Las notas no deben superar 180 caracteres.";
  }

  return null;
}

function hasActiveFilters(filters: MerchantFilters): boolean {
  return Boolean(filters.q.trim() || filters.field !== "all");
}

export default function VaultMerchantsPage() {
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filters, setFilters] = useState<MerchantFilters>(initialFilters);
  const [form, setForm] = useState<MerchantFormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MerchantFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const filteredMerchants = useMemo(() => {
    const query = normalize(filters.q);

    if (!query) {
      return merchants;
    }

    return merchants.filter((merchant) => {
      if (filters.field === "name") {
        return normalize(merchant.name).includes(query);
      }

      if (filters.field === "location") {
        return normalize(merchant.location).includes(query);
      }

      if (filters.field === "notes") {
        return normalize(merchant.notes).includes(query);
      }

      return (
        normalize(merchant.name).includes(query) ||
        normalize(merchant.location).includes(query) ||
        normalize(merchant.notes).includes(query) ||
        String(merchant.id).includes(query)
      );
    });
  }, [filters, merchants]);

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
    setSuccess(null);

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
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
      setSuccess("El comercio fue creado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(merchant: Merchant) {
    setSuccess(null);
    setEditingId(merchant.id);
    setEditForm({
      name: merchant.name,
      location: merchant.location ?? "",
      notes: merchant.notes ?? "",
    });
  }

  async function handleUpdate(merchant: Merchant) {
    setError(null);
    setSuccess(null);

    const validationError = validateForm(editForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    setProcessingId(merchant.id);

    try {
      const updated = await updateMerchant(vaultId, merchant.id, {
        name: editForm.name.trim(),
        location: editForm.location.trim() || null,
        notes: editForm.notes.trim() || null,
      });
      setMerchants((current) => current.map((item) => (item.id === merchant.id ? updated : item)));
      setEditingId(null);
      setSuccess("El comercio fue actualizado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(merchantId: number) {
    setError(null);
    setSuccess(null);
    setProcessingId(merchantId);

    try {
      await deleteMerchant(vaultId, merchantId);
      setMerchants((current) => current.filter((merchant) => merchant.id !== merchantId));
      setPendingDeleteId(null);
      setSuccess("El comercio fue eliminado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  function clearFilters() {
    setFilters(initialFilters);
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
            Registra lugares, entidades o contactos asociados a los movimientos.
          </p>
        </header>

        <VaultErrorMessage message={error} />
        <VaultSuccessMessage message={success} />

        <form onSubmit={handleCreate} className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Nombre
            <input
              value={form.name}
              maxLength={80}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="Nombre del comercio"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Ubicación
            <input
              value={form.location}
              maxLength={100}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="Ubicación"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Notas
            <input
              value={form.notes}
              maxLength={180}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="Notas internas"
            />
          </label>

          <button type="submit" disabled={saving} className="rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8] disabled:opacity-60">
            {saving ? "Creando..." : "Crear"}
          </button>
        </form>

        <section className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Buscar
            <input
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/35 focus:border-[#B39F84]"
              placeholder="Nombre, ubicación, nota o ID"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Buscar en
            <select
              value={filters.field}
              onChange={(event) => setFilters((current) => ({ ...current, field: event.target.value as MerchantFilters["field"] }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
            >
              <option value="all">Todo</option>
              <option value="name">Nombre</option>
              <option value="location">Ubicación</option>
              <option value="notes">Notas</option>
            </select>
          </label>

          <button type="button" onClick={clearFilters} disabled={!hasActiveFilters(filters)} className="rounded-full border border-[#B39F84]/40 px-5 py-3 text-sm font-bold text-[#D6CCA8] transition hover:bg-[#B39F84]/10 disabled:cursor-not-allowed disabled:opacity-40">
            Limpiar
          </button>
        </section>

        <div className="text-sm text-[#D6CCA8]/75">
          {filteredMerchants.length} de {merchants.length} comercios visibles
        </div>

        {loading ? <VaultLoadingState message="Cargando comercios..." /> : null}

        {!loading && merchants.length === 0 ? (
          <VaultEmptyState title="No hay comercios registrados" description="Crea comercios para asociarlos a tus movimientos." />
        ) : null}

        {!loading && merchants.length > 0 && filteredMerchants.length === 0 ? (
          <VaultEmptyState title="Sin resultados" description="No hay comercios que coincidan con los filtros actuales." />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredMerchants.map((merchant) => (
            <article key={merchant.id} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/30">
              {editingId === merchant.id ? (
                <div className="grid gap-4">
                  <input value={editForm.name} maxLength={80} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                  <input value={editForm.location} maxLength={100} onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                  <textarea value={editForm.notes} maxLength={180} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="resize-none rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={processingId === merchant.id} onClick={() => void handleUpdate(merchant)} className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00] disabled:opacity-60">{processingId === merchant.id ? "Guardando..." : "Guardar"}</button>
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
                <div className="mt-4">
                  <VaultConfirmDelete
                    title="¿Eliminar este comercio?"
                    confirmLabel="Eliminar"
                    loading={processingId === merchant.id}
                    onConfirm={() => void handleDelete(merchant.id)}
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
