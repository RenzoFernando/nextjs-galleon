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

type CategoryFilters = {
  q: string;
  kind: "" | CategoryKind;
  status: "all" | "active" | "archived";
};

const initialForm: CategoryFormState = {
  name: "",
  kind: "expense",
  colorTag: "#B39F84",
};

const initialFilters: CategoryFilters = {
  q: "",
  kind: "",
  status: "active",
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

function normalize(value: string | null | undefined): string {
  return value?.toLowerCase().trim() ?? "";
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function validateForm(form: CategoryFormState): string | null {
  if (form.name.trim().length < 2) {
    return "El nombre de la categoría debe tener al menos 2 caracteres.";
  }

  if (form.name.trim().length > 60) {
    return "El nombre de la categoría no debe superar 60 caracteres.";
  }

  if (form.colorTag && !isValidHexColor(form.colorTag)) {
    return "El color debe estar en formato hexadecimal.";
  }

  return null;
}

function hasActiveFilters(filters: CategoryFilters): boolean {
  return Boolean(filters.q.trim() || filters.kind || filters.status !== "active");
}

export default function VaultCategoriesPage() {
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<CategoryFilters>(initialFilters);
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const filteredCategories = useMemo(() => {
    const query = normalize(filters.q);

    return categories.filter((category) => {
      const matchesQuery =
        !query ||
        normalize(category.name).includes(query) ||
        normalize(category.colorTag).includes(query) ||
        String(category.id).includes(query);

      const matchesKind = !filters.kind || category.kind === filters.kind;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && !category.isArchived) ||
        (filters.status === "archived" && category.isArchived);

      return matchesQuery && matchesKind && matchesStatus;
    });
  }, [categories, filters]);

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
    setSuccess(null);

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
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
      setSuccess("La categoría fue creada correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: Category) {
    setSuccess(null);
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      kind: category.kind,
      colorTag: category.colorTag ?? "#B39F84",
    });
  }

  async function handleUpdate(category: Category) {
    setError(null);
    setSuccess(null);

    const validationError = validateForm(editForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    setProcessingId(category.id);

    try {
      const updated = await updateCategory(vaultId, category.id, {
        name: editForm.name.trim(),
        kind: editForm.kind,
        colorTag: editForm.colorTag || null,
      });
      setCategories((current) => current.map((item) => (item.id === category.id ? updated : item)));
      setEditingId(null);
      setSuccess("La categoría fue actualizada correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleArchive(category: Category) {
    setError(null);
    setSuccess(null);
    setProcessingId(category.id);

    try {
      const updated = await updateCategory(vaultId, category.id, { isArchived: !category.isArchived });
      setCategories((current) => current.map((item) => (item.id === category.id ? updated : item)));
      setSuccess(category.isArchived ? "La categoría fue reactivada." : "La categoría fue archivada.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(categoryId: number) {
    setError(null);
    setSuccess(null);
    setProcessingId(categoryId);

    try {
      await deleteCategory(vaultId, categoryId);
      setCategories((current) => current.filter((category) => category.id !== categoryId));
      setPendingDeleteId(null);
      setSuccess("La categoría fue eliminada correctamente.");
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
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Categorías</p>
          <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5]">{vault?.name ?? "Bóveda"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D6CCA8]/80">
            Organiza ingresos, gastos y transferencias para consultar tus movimientos con mayor claridad.
          </p>
        </header>

        <VaultErrorMessage message={error} />
        <VaultSuccessMessage message={success} />

        <form onSubmit={handleCreate} className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 lg:grid-cols-[1fr_220px_150px_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Nombre
            <input
              value={form.name}
              maxLength={60}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="Materiales"
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

        <section className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Buscar
            <input
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/35 focus:border-[#B39F84]"
              placeholder="Nombre, color o ID"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Tipo
            <select
              value={filters.kind}
              onChange={(event) => setFilters((current) => ({ ...current, kind: event.target.value as CategoryFilters["kind"] }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
            >
              <option value="">Todos</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
              <option value="transfer">Transferencia</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Estado
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as CategoryFilters["status"] }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
            >
              <option value="active">Activas</option>
              <option value="archived">Archivadas</option>
              <option value="all">Todas</option>
            </select>
          </label>

          <button type="button" onClick={clearFilters} disabled={!hasActiveFilters(filters)} className="rounded-full border border-[#B39F84]/40 px-5 py-3 text-sm font-bold text-[#D6CCA8] transition hover:bg-[#B39F84]/10 disabled:cursor-not-allowed disabled:opacity-40">
            Limpiar
          </button>
        </section>

        <div className="text-sm text-[#D6CCA8]/75">
          {filteredCategories.length} de {categories.length} categorías visibles
        </div>

        {loading ? <VaultLoadingState message="Cargando categorías..." /> : null}

        {!loading && categories.length === 0 ? (
          <VaultEmptyState title="No hay categorías registradas" description="Crea categorías para clasificar tus movimientos." />
        ) : null}

        {!loading && categories.length > 0 && filteredCategories.length === 0 ? (
          <VaultEmptyState title="Sin resultados" description="No hay categorías que coincidan con los filtros actuales." />
        ) : null}

        <div className="grid gap-4">
          {filteredCategories.map((category) => (
            <article key={category.id} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/30">
              {editingId === category.id ? (
                <div className="grid gap-4 lg:grid-cols-[1fr_200px_150px_auto_auto] lg:items-end">
                  <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
                    Nombre
                    <input value={editForm.name} maxLength={60} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none focus:border-[#B39F84]" />
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
                  <button type="button" disabled={processingId === category.id} onClick={() => void handleUpdate(category)} className="rounded-full bg-[#B39F84] px-5 py-3 text-sm font-bold text-[#0C0C00] disabled:opacity-60">{processingId === category.id ? "Guardando..." : "Guardar"}</button>
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
                    <button type="button" disabled={processingId === category.id} onClick={() => void handleArchive(category)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10 disabled:opacity-60">{category.isArchived ? "Reactivar" : "Archivar"}</button>
                    <button type="button" onClick={() => setPendingDeleteId(category.id)} className="rounded-full border border-[#7B2E2E]/70 px-4 py-2 text-sm font-semibold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25">Eliminar</button>
                  </div>
                </div>
              )}

              {pendingDeleteId === category.id ? (
                <div className="mt-4">
                  <VaultConfirmDelete
                    title="¿Eliminar esta categoría?"
                    confirmLabel="Eliminar"
                    loading={processingId === category.id}
                    onConfirm={() => void handleDelete(category.id)}
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
