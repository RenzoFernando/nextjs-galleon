"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api/http";
import { listPermissions } from "@/lib/api/permissions.api";
import { assignPermissionToRole, removePermissionFromRole } from "@/lib/api/role-permissions.api";
import { createRole, deleteRole, getRole, listRoles, updateRole } from "@/lib/api/roles.api";
import { useAuthStore } from "@/store/auth.store";
import type { Permission } from "@/types/permission";
import type { Role } from "@/types/role";
import {
  validateRoleForm,
  emptyRoleForm as emptyForm,
  type RoleForm,
} from "@/lib/validation/role-form";

type FormMode = "create" | "edit";

export default function RolesPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAuthRole = useAuthStore((s) => s.hasRole);
  const isSuperadmin = hasAuthRole("superadmin");

  const canCreate = isSuperadmin || hasPermission("role_create");
  const canUpdate = isSuperadmin || hasPermission("role_update");
  const canDelete = isSuperadmin || hasPermission("role_delete");
  const canAssignPerms =
    isSuperadmin || hasPermission("permission_assign") || hasPermission("permission_remove");

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRUD modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Permissions management
  const [permsModalOpen, setPermsModalOpen] = useState(false);
  const [permsRole, setPermsRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [assignedPermIds, setAssignedPermIds] = useState<Set<number>>(new Set());
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsError, setPermsError] = useState<string | null>(null);
  const [togglingPerm, setTogglingPerm] = useState<number | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listRoles();
      setRoles(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudieron cargar los roles."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  /* ---- CRUD ---- */

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(role: Role) {
    setFormMode("edit");
    setEditingId(role.id);
    setForm({ name: role.name, description: role.description ?? "" });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setFormError(null);

    const validationError = validateRoleForm(form);

    if (validationError) {
      setFormError(validationError);
      setSaving(false);
      return;
    }

    try {
      const payload: Partial<Role> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };

      if (formMode === "create") {
        await createRole(payload);
      } else if (editingId !== null) {
        await updateRole(editingId, payload);
      }

      setModalOpen(false);
      await fetchRoles();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "No se pudo guardar el rol."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      await fetchRoles();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "No se pudo eliminar el rol."));
    } finally {
      setDeleting(false);
    }
  }

  /* ---- Permission assignment ---- */

  async function openPermsModal(role: Role) {
    setPermsRole(role);
    setPermsError(null);
    setPermsLoading(true);
    setPermsModalOpen(true);

    try {
      const [allPerms, fullRole] = await Promise.all([listPermissions(), getRole(role.id)]);
      setAllPermissions(allPerms);
      setAssignedPermIds(new Set(fullRole.rolePermissions?.map((rp) => rp.permissionId) ?? []));
    } catch (err) {
      setPermsError(getApiErrorMessage(err, "No se pudieron cargar los permisos."));
    } finally {
      setPermsLoading(false);
    }
  }

  async function togglePermission(permissionId: number) {
    if (!permsRole) return;
    setTogglingPerm(permissionId);
    setPermsError(null);

    try {
      if (assignedPermIds.has(permissionId)) {
        await removePermissionFromRole(permsRole.id, permissionId);
        setAssignedPermIds((prev) => {
          const next = new Set(prev);
          next.delete(permissionId);
          return next;
        });
      } else {
        await assignPermissionToRole(permsRole.id, permissionId);
        setAssignedPermIds((prev) => new Set(prev).add(permissionId));
      }
    } catch (err) {
      setPermsError(getApiErrorMessage(err, "Error al actualizar el permiso."));
    } finally {
      setTogglingPerm(null);
    }
  }

  return (
    <AppShell requiredPermissions={["role_read"]} requireAllPermissions={false}>
      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl italic text-[#F2E8D5]">Roles</h1>
            <p className="mt-1 text-sm text-[#D6CCA8]/80">Gestión de roles del sistema.</p>
          </div>
          {canCreate ? <Button onClick={openCreate}>+ Crear rol</Button> : null}
        </div>

        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {isLoading ? (
          <Loading label="Cargando roles…" />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#B39F84]/20 bg-[#19242E] shadow-xl shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0C0C00]/50 text-[#B39F84]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Descripción</th>
                    <th className="px-6 py-4 font-semibold">Permisos</th>
                    {canUpdate || canDelete || canAssignPerms ? (
                      <th className="px-6 py-4 text-right font-semibold">Acciones</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B39F84]/10">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#D6CCA8]/50">
                        No se encontraron roles.
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.id} className="transition hover:bg-[#B39F84]/5">
                        <td className="px-6 py-4 text-[#D6CCA8]">{role.id}</td>
                        <td className="px-6 py-4 font-medium text-[#F2E8D5]">{role.name}</td>
                        <td className="px-6 py-4 text-[#D6CCA8]">{role.description ?? "N/A"}</td>
                        <td className="px-6 py-4 text-[#D6CCA8]">
                          {role.rolePermissions?.length ?? 0} asignados
                        </td>
                        {canUpdate || canDelete || canAssignPerms ? (
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {canAssignPerms ? (
                                <Button variant="ghost" onClick={() => void openPermsModal(role)}>
                                  Permisos
                                </Button>
                              ) : null}
                              {canUpdate ? (
                                <Button variant="ghost" onClick={() => openEdit(role)}>
                                  Editar
                                </Button>
                              ) : null}
                              {canDelete ? (
                                <Button
                                  variant="danger"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setDeleteTarget(role);
                                  }}
                                >
                                  Eliminar
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={formMode === "create" ? "Crear rol" : "Editar rol"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-5"
        >
          <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />

          <div className="space-y-1">
            <label htmlFor="role-name" className="text-xs uppercase tracking-widest text-[#B39F84]">
              Nombre
            </label>
            <input
              id="role-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-[#B39F84]/30 bg-[#0C0C00]/50 px-4 py-2.5 text-sm text-[#F2E8D5] placeholder-[#D6CCA8]/40 outline-none focus:border-[#B39F84] focus:ring-1 focus:ring-[#B39F84]/40"
              placeholder="Nombre del rol"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="role-desc" className="text-xs uppercase tracking-widest text-[#B39F84]">
              Descripción
            </label>
            <input
              id="role-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-[#B39F84]/30 bg-[#0C0C00]/50 px-4 py-2.5 text-sm text-[#F2E8D5] placeholder-[#D6CCA8]/40 outline-none focus:border-[#B39F84] focus:ring-1 focus:ring-[#B39F84]/40"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)} type="button">
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {formMode === "create" ? "Crear" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
      >
        <div className="space-y-5">
          <ErrorMessage message={deleteError} onDismiss={() => setDeleteError(null)} />

          <p className="text-sm text-[#D6CCA8]">
            ¿Estás seguro de que deseas eliminar el rol{" "}
            <strong className="text-[#F2E8D5]">{deleteTarget?.name}</strong>? Esta acción no se
            puede deshacer.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Permissions management modal */}
      <Modal
        open={permsModalOpen}
        onClose={() => {
          setPermsModalOpen(false);
          void fetchRoles();
        }}
        title={`Permisos de "${permsRole?.name ?? ""}"`}
      >
        <div className="space-y-4">
          <ErrorMessage message={permsError} onDismiss={() => setPermsError(null)} />

          {permsLoading ? (
            <Loading label="Cargando permisos…" />
          ) : allPermissions.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#D6CCA8]/50">
              No hay permisos disponibles en el sistema.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {allPermissions.map((perm) => {
                const isAssigned = assignedPermIds.has(perm.id);
                const isToggling = togglingPerm === perm.id;

                return (
                  <button
                    key={perm.id}
                    type="button"
                    disabled={isToggling}
                    onClick={() => void togglePermission(perm.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
                      isAssigned
                        ? "border-[#B39F84]/40 bg-[#B39F84]/10 text-[#F2E8D5]"
                        : "border-[#B39F84]/15 bg-[#0C0C00]/30 text-[#D6CCA8]/70 hover:border-[#B39F84]/30 hover:bg-[#B39F84]/5",
                      isToggling ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-medium">{perm.name}</p>
                      {perm.description ? (
                        <p className="mt-0.5 text-xs text-[#D6CCA8]/50">{perm.description}</p>
                      ) : null}
                    </div>
                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        isAssigned
                          ? "bg-[#B39F84] text-[#0C0C00]"
                          : "border border-[#B39F84]/20 text-[#D6CCA8]/50",
                      ].join(" ")}
                    >
                      {isToggling ? "…" : isAssigned ? "Asignado" : "No asignado"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setPermsModalOpen(false);
                void fetchRoles();
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
