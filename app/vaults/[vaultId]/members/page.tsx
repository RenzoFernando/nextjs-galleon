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
import { createVaultMember, deleteVaultMember, listVaultMembers, updateVaultMember } from "@/lib/api/members.api";
import { getVault } from "@/lib/api/vaults.api";
import type { Vault, VaultMembership, VaultPermission } from "@/types/vault";

type MemberFormState = {
  userId: string;
  permission: Exclude<VaultPermission, "owner">;
};

type MemberFilters = {
  q: string;
  permission: "" | VaultPermission;
};

const initialForm: MemberFormState = {
  userId: "",
  permission: "viewer",
};

const initialFilters: MemberFilters = {
  q: "",
  permission: "",
};

function getParamValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function permissionLabel(permission: VaultPermission): string {
  const labels: Record<VaultPermission, string> = {
    viewer: "Lector",
    editor: "Editor",
    admin: "Administrador",
    owner: "Propietario",
  };

  return labels[permission];
}

function normalize(value: string | null | undefined): string {
  return value?.toLowerCase().trim() ?? "";
}

function hasActiveFilters(filters: MemberFilters): boolean {
  return Boolean(filters.q.trim() || filters.permission);
}

export default function VaultMembersPage() {
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [members, setMembers] = useState<VaultMembership[]>([]);
  const [form, setForm] = useState<MemberFormState>(initialForm);
  const [filters, setFilters] = useState<MemberFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const filteredMembers = useMemo(() => {
    const query = normalize(filters.q);

    return members.filter((member) => {
      const matchesQuery =
        !query ||
        normalize(member.user?.name).includes(query) ||
        normalize(member.user?.email).includes(query) ||
        String(member.userId).includes(query) ||
        String(member.id).includes(query);

      const matchesPermission = !filters.permission || member.permission === filters.permission;

      return matchesQuery && matchesPermission;
    });
  }, [filters, members]);

  async function loadData() {
    if (!Number.isFinite(vaultId) || vaultId <= 0) {
      setError("El identificador de la bóveda no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [vaultData, membersData] = await Promise.all([getVault(vaultId), listVaultMembers(vaultId)]);
      setVault(vaultData);
      setMembers(membersData);
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

    const userId = Number(form.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Ingresa un ID de usuario válido.");
      return;
    }

    if (vault?.ownerUserId === userId) {
      setError("El propietario ya tiene acceso completo a la bóveda.");
      return;
    }

    if (members.some((member) => member.userId === userId)) {
      setError("Este usuario ya pertenece a la bóveda.");
      return;
    }

    setSaving(true);

    try {
      const created = await createVaultMember(vaultId, { userId, permission: form.permission });
      setMembers((current) => [created, ...current]);
      setForm(initialForm);
      setSuccess("El miembro fue agregado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePermissionChange(member: VaultMembership, permission: Exclude<VaultPermission, "owner">) {
    if (member.permission === "owner") {
      return;
    }

    setError(null);
    setSuccess(null);
    setProcessingId(member.id);

    try {
      const updated = await updateVaultMember(vaultId, member.id, { permission });
      setMembers((current) => current.map((currentMember) => (currentMember.id === member.id ? updated : currentMember)));
      setSuccess("El permiso del miembro fue actualizado.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(member: VaultMembership) {
    if (member.permission === "owner") {
      setError("No se puede remover al propietario de la bóveda.");
      return;
    }

    setError(null);
    setSuccess(null);
    setProcessingId(member.id);

    try {
      await deleteVaultMember(vaultId, member.id);
      setMembers((current) => current.filter((currentMember) => currentMember.id !== member.id));
      setPendingDeleteId(null);
      setSuccess("El miembro fue removido correctamente.");
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
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Miembros</p>
          <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5]">{vault?.name ?? "Bóveda"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D6CCA8]/80">
            Agrega usuarios por ID y define qué pueden hacer dentro de la bóveda.
          </p>
        </header>

        <VaultErrorMessage message={error} />
        <VaultSuccessMessage message={success} />

        <form onSubmit={handleCreate} className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            ID del usuario
            <input
              type="number"
              min="1"
              value={form.userId}
              onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
              placeholder="2"
            />
            <span className="text-xs font-normal text-[#D6CCA8]/60">
              Cuando el módulo de usuarios esté listo, este campo puede reemplazarse por un selector.
            </span>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Permiso
            <select
              value={form.permission}
              onChange={(event) => setForm((current) => ({ ...current, permission: event.target.value as MemberFormState["permission"] }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
            >
              <option value="viewer">Lector</option>
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          <button type="submit" disabled={saving} className="rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8] disabled:opacity-60">
            {saving ? "Agregando..." : "Agregar miembro"}
          </button>
        </form>

        <section className="grid gap-4 rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-6 shadow-xl shadow-black/30 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Buscar
            <input
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/35 focus:border-[#B39F84]"
              placeholder="Nombre, correo, ID de usuario o membresía"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Permiso
            <select
              value={filters.permission}
              onChange={(event) => setFilters((current) => ({ ...current, permission: event.target.value as MemberFilters["permission"] }))}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition focus:border-[#B39F84]"
            >
              <option value="">Todos</option>
              <option value="viewer">Lector</option>
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
              <option value="owner">Propietario</option>
            </select>
          </label>

          <button type="button" onClick={clearFilters} disabled={!hasActiveFilters(filters)} className="rounded-full border border-[#B39F84]/40 px-5 py-3 text-sm font-bold text-[#D6CCA8] transition hover:bg-[#B39F84]/10 disabled:cursor-not-allowed disabled:opacity-40">
            Limpiar
          </button>
        </section>

        <div className="text-sm text-[#D6CCA8]/75">
          {filteredMembers.length} de {members.length} miembros visibles
        </div>

        {loading ? <VaultLoadingState message="Cargando miembros..." /> : null}

        {!loading && members.length === 0 ? (
          <VaultEmptyState title="No hay miembros adicionales" description="Agrega usuarios para compartir el acceso a esta bóveda." />
        ) : null}

        {!loading && members.length > 0 && filteredMembers.length === 0 ? (
          <VaultEmptyState title="Sin resultados" description="No hay miembros que coincidan con los filtros actuales." />
        ) : null}

        <div className="grid gap-4">
          {filteredMembers.map((member) => (
            <article key={member.id} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/30">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Membresía #{member.id}</p>
                  <h2 className="mt-2 text-xl font-semibold text-[#F2E8D5]">
                    {member.user?.name || member.user?.email || `Usuario #${member.userId}`}
                  </h2>
                  <p className="mt-1 text-sm text-[#D6CCA8]/70">
                    {member.user?.email ? `${member.user.email} · ` : ""}{permissionLabel(member.permission)}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={member.permission}
                    disabled={member.permission === "owner" || processingId === member.id}
                    onChange={(event) => void handlePermissionChange(member, event.target.value as Exclude<VaultPermission, "owner">)}
                    className="rounded-full border border-[#B39F84]/25 bg-black/30 px-4 py-2 text-sm text-[#F2E8D5] outline-none focus:border-[#B39F84] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {member.permission === "owner" ? <option value="owner">Propietario</option> : null}
                    <option value="viewer">Lector</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button
                    type="button"
                    disabled={member.permission === "owner"}
                    onClick={() => setPendingDeleteId(member.id)}
                    className="rounded-full border border-[#7B2E2E]/70 px-4 py-2 text-sm font-semibold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remover
                  </button>
                </div>
              </div>

              {pendingDeleteId === member.id ? (
                <div className="mt-4">
                  <VaultConfirmDelete
                    title="¿Remover este miembro de la bóveda?"
                    confirmLabel="Remover"
                    loading={processingId === member.id}
                    onConfirm={() => void handleDelete(member)}
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
