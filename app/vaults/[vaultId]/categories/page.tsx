"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/api/categories.api";
import { getApiErrorMessage } from "@/lib/api/http";
import { getVault } from "@/lib/api/vaults.api";
import type { Category, CategoryKind } from "@/types/category";
import type { Vault } from "@/types/vault";

type CategoryFormState = {
  name: string;
  kind: CategoryKind;
  colorTag: string;
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function kindLabel(kind: CategoryKind): string {
  const labels: Record<CategoryKind, string> = {
    income: "Ingreso",
    expense: "Gasto",
    transfer: "Transferencia",
  };

  return labels[kind];
}

const initialForm: CategoryFormState = {
  name: "",
  kind: "expense",
  colorTag: "#B39F84",
};

export default function VaultCategoriesPage() {
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(initialForm);
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
      const [vaultData, categoriesData] = await Promise.all([getVault(vaultId), listCategories(vaultId)]);
      setVault(vaultData);
      setCategories(categoriesData);
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
      setError("El nombre de la categoría debe tener al menos 2 caracteres.");
      return;
    }

    setSaving(true);

    try {
      const created = await createCategory(vaultId, {
        name: form.name.trim(),
        kind: form.kind,
        colorTag: form.colorTag || undefined,
      });
      setCategories((current) => [created, ...current]);
      setForm(initialForm);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      kind: category.kind,
      colorTag: category.colorTag ?? "#B39F84",
    });
  }

  async function handleUpdate(category: Category) {
    setError(null);

    if (editForm.name.trim().length < 2) {
      setError("El nombre de la categoría debe tener al menos 2 caracteres.");
      return;
    }

    try {
      const updated = await updateCategory(vaultId, category.id, {
        name: editForm.name.trim(),
        kind: editForm.kind,
        colorTag: editForm.colorTag || null,
      });
      setCategories((current) => current.map((item) => (item.id === category.id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleArchive(category: Category) {
    setError(null);

    try {
      const updated = await updateCategory(vaultId, category.id, { isArchived: !category.isArchived });
      setCategories((current) => current.map((item) => (item.id === category.id ? updated : item)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleDelete(categoryId: number) {
    setError(null);

    try {
      await deleteCategory(vaultId, categoryId);
      setCategories((current) => current.filter((category) => category.id !== categoryId));
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
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Categorías</p>
          <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5]">{vault?.name ?? "Bóveda"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D6CCA8]/80">
            Clasifica ingresos, gastos y transferencias con etiquetas visuales.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleCreate} className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 lg:grid-cols-[1fr_220px_150px_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="Materiales mágicos"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Tipo
            <select
              value={form.kind}
              onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as CategoryKind }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
            >
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
              <option value="transfer">Transferencia</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Color
            <input
              type="color"
              value={form.colorTag}
              onChange={(event) => setForm((current) => ({ ...current, colorTag: event.target.value }))}
              className="h-[50px] rounded-2xl border border-[#B39F84]/25 bg-black/30 px-3 py-2 outline-none transition focus:border-[#B39F84]"
            />
          </label>

          <button type="submit" disabled={saving} className="rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8] disabled:opacity-60">
            {saving ? "Creando..." : "Crear"}
          </button>
        </form>

        {loading ? (
          <div className="rounded-3xl border border-[#B39F84]/20 bg-[#11180F] p-8 text-center text-[#B39F84]">Cargando categorías...</div>
        ) : null}

        {!loading && categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#B39F84]/40 bg-[#11180F] p-8 text-center text-[#D6CCA8]/80">No hay categorías registradas.</div>
        ) : null}

        <div className="grid gap-4">
          {categories.map((category) => (
            <article key={category.id} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/30">
              {editingId === category.id ? (
                <div className="grid gap-4 lg:grid-cols-[1fr_200px_150px_auto_auto] lg:items-end">
                  <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                    Nombre
                    <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                    Tipo
                    <select value={editForm.kind} onChange={(event) => setEditForm((current) => ({ ...current, kind: event.target.value as CategoryKind }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]">
                      <option value="income">Ingreso</option>
                      <option value="expense">Gasto</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                    Color
                    <input type="color" value={editForm.colorTag} onChange={(event) => setEditForm((current) => ({ ...current, colorTag: event.target.value }))} className="h-[50px] rounded-2xl border border-[#B39F84]/25 bg-black/30 px-3 py-2 outline-none focus:border-[#B39F84]" />
                  </label>
                  <button type="button" onClick={() => void handleUpdate(category)} className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00]">Guardar</button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded-full border border-[#B39F84]/40 px-5 py-3 text-sm font-bold text-[#D6CCA8]">Cancelar</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="h-12 w-12 rounded-2xl border border-[#B39F84]/25" style={{ backgroundColor: category.colorTag ?? "#B39F84" }} />
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">{kindLabel(category.kind)}</p>
                      <h2 className="mt-1 text-xl font-semibold text-[#F2E8D5]">{category.name}</h2>
                      <p className="mt-1 text-sm text-[#D6CCA8]/70">{category.isArchived ? "Archivada" : "Activa"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => startEdit(category)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">Editar</button>
                    <button type="button" onClick={() => void handleArchive(category)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">{category.isArchived ? "Reactivar" : "Archivar"}</button>
                    <button type="button" onClick={() => setPendingDeleteId(category.id)} className="rounded-full border border-[#7B2E2E]/70 px-4 py-2 text-sm font-semibold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25">Eliminar</button>
                  </div>
                </div>
              )}

              {pendingDeleteId === category.id ? (
                <div className="mt-4 rounded-2xl border border-[#7B2E2E]/60 bg-[#2A1111] p-4 text-sm text-[#F2E8D5]">
                  <p>¿Eliminar esta categoría?</p>
                  <div className="mt-3 flex gap-3">
                    <button type="button" onClick={() => void handleDelete(category.id)} className="rounded-full bg-[#7B2E2E] px-4 py-2 font-semibold">Eliminar</button>
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

