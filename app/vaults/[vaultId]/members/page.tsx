"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/http";
import { createVaultMember, deleteVaultMember, listVaultMembers, updateVaultMember } from "@/lib/api/members.api";
import { getVault } from "@/lib/api/vaults.api";
import type { Vault, VaultMembership, VaultPermission } from "@/types/vault";

type MemberFormState = {
  userId: string;
  permission: VaultPermission;
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

export default function VaultMembersPage() {
  const params = useParams<{ vaultId: string }>();
  const vaultId = useMemo(() => Number(getParamValue(params.vaultId)), [params.vaultId]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [members, setMembers] = useState<VaultMembership[]>([]);
  const [form, setForm] = useState<MemberFormState>({ userId: "", permission: "viewer" });
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

    const userId = Number(form.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Ingresa un ID de usuario válido.");
      return;
    }

    setSaving(true);

    try {
      const created = await createVaultMember(vaultId, { userId, permission: form.permission });
      setMembers((current) => [created, ...current]);
      setForm({ userId: "", permission: "viewer" });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePermissionChange(membershipId: number, permission: VaultPermission) {
    setError(null);

    try {
      const updated = await updateVaultMember(vaultId, membershipId, { permission });
      setMembers((current) => current.map((member) => (member.id === membershipId ? updated : member)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleDelete(membershipId: number) {
    setError(null);

    try {
      await deleteVaultMember(vaultId, membershipId);
      setMembers((current) => current.filter((member) => member.id !== membershipId));
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
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Miembros</p>
          <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5]">{vault?.name ?? "Bóveda"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D6CCA8]/80">
            Agrega usuarios por ID y define su permiso interno dentro de esta bóveda.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
            {error}
          </div>
        ) : null}

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
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]">
            Permiso
            <select
              value={form.permission}
              onChange={(event) => setForm((current) => ({ ...current, permission: event.target.value as VaultPermission }))}
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

        {loading ? (
          <div className="rounded-3xl border border-[#B39F84]/20 bg-[#11180F] p-8 text-center text-[#B39F84]">
            Cargando miembros...
          </div>
        ) : null}

        {!loading && members.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#B39F84]/40 bg-[#11180F] p-8 text-center text-[#D6CCA8]/80">
            No hay miembros adicionales registrados en esta bóveda.
          </div>
        ) : null}

        <div className="grid gap-4">
          {members.map((member) => (
            <article key={member.id} className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/30">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Membresía #{member.id}</p>
                  <h2 className="mt-2 text-xl font-semibold text-[#F2E8D5]">
                    {member.user?.name || member.user?.email || `Usuario #${member.userId}`}
                  </h2>
                  <p className="mt-1 text-sm text-[#D6CCA8]/70">Permiso actual: {permissionLabel(member.permission)}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={member.permission}
                    onChange={(event) => void handlePermissionChange(member.id, event.target.value as VaultPermission)}
                    className="rounded-full border border-[#B39F84]/25 bg-black/30 px-4 py-2 text-sm text-[#F2E8D5] outline-none focus:border-[#B39F84]"
                  >
                    <option value="viewer">Lector</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(member.id)}
                    className="rounded-full border border-[#7B2E2E]/70 px-4 py-2 text-sm font-semibold text-[#F2B8B8] transition hover:bg-[#7B2E2E]/25"
                  >
                    Remover
                  </button>
                </div>
              </div>

              {pendingDeleteId === member.id ? (
                <div className="mt-4 rounded-2xl border border-[#7B2E2E]/60 bg-[#2A1111] p-4 text-sm text-[#F2E8D5]">
                  <p>¿Remover este miembro de la bóveda?</p>
                  <div className="mt-3 flex gap-3">
                    <button type="button" onClick={() => void handleDelete(member.id)} className="rounded-full bg-[#7B2E2E] px-4 py-2 font-semibold">
                      Remover
                    </button>
                    <button type="button" onClick={() => setPendingDeleteId(null)} className="rounded-full border border-[#B39F84]/40 px-4 py-2 font-semibold text-[#D6CCA8]">
                      Cancelar
                    </button>
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

