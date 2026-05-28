"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api/http";
import {
  createPermission,
  deletePermission,
  listPermissions,
  updatePermission,
} from "@/lib/api/permissions.api";
import { useAuthStore } from "@/store/auth.store";
import type { Permission } from "@/types/permission";
import {
  validatePermissionForm,
  emptyPermForm as emptyForm,
  type PermForm,
} from "@/lib/validation/permission-form";

type FormMode = "create" | "edit";

export default function PermissionsPage() {
  const hasPermissionCheck = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isSuperadmin = hasRole("superadmin");

  const canCreate = isSuperadmin || hasPermissionCheck("permission_create");
  const canUpdate = isSuperadmin || hasPermissionCheck("permission_update");
  const canDelete = isSuperadmin || hasPermissionCheck("permission_delete");

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PermForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPermissions();
      setPermissions(data);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudieron cargar los permisos."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPermissions();
  }, [fetchPermissions]);

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(perm: Permission) {
    setFormMode("edit");
    setEditingId(perm.id);
    setForm({ name: perm.name, description: perm.description ?? "" });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setFormError(null);

    const validationError = validatePermissionForm(form);

    if (validationError) {
      setFormError(validationError);
      setSaving(false);
      return;
    }

    try {
      const payload: Partial<Permission> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };

      if (formMode === "create") {
        await createPermission(payload);
      } else if (editingId !== null) {
        await updatePermission(editingId, payload);
      }

      setModalOpen(false);
      await fetchPermissions();
    } catch (err) {
      setFormError(
        getApiErrorMessage(err, "No se pudo guardar el permiso."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await deletePermission(deleteTarget.id);
      setDeleteTarget(null);
      await fetchPermissions();
    } catch (err) {
      setDeleteError(
        getApiErrorMessage(err, "No se pudo eliminar el permiso."),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell
      requiredPermissions={["permission_read"]}
      requireAllPermissions={false}
    >
      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl italic text-[#F2E8D5]">
              Permisos
            </h1>
            <p className="mt-1 text-sm text-[#D6CCA8]/80">
              Listado de permisos del sistema.
            </p>
          </div>
          {canCreate ? (
            <Button onClick={openCreate}>+ Crear permiso</Button>
          ) : null}
        </div>

        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {isLoading ? (
          <Loading label="Cargando permisos…" />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#B39F84]/20 bg-[#19242E] shadow-xl shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0C0C00]/50 text-[#B39F84]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Descripción</th>
                    {canUpdate || canDelete ? (
                      <th className="px-6 py-4 text-right font-semibold">
                        Acciones
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B39F84]/10">
                  {permissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-[#D6CCA8]/50"
                      >
                        No se encontraron permisos.
                      </td>
                    </tr>
                  ) : (
                    permissions.map((perm) => (
                      <tr
                        key={perm.id}
                        className="transition hover:bg-[#B39F84]/5"
                      >
                        <td className="px-6 py-4 text-[#D6CCA8]">{perm.id}</td>
                        <td className="px-6 py-4 font-medium text-[#F2E8D5]">
                          <span className="rounded-full border border-[#B39F84]/20 bg-[#0C0C00]/40 px-3 py-1 text-xs">
                            {perm.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#D6CCA8]">
                          {perm.description ?? "N/A"}
                        </td>
                        {canUpdate || canDelete ? (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canUpdate ? (
                                <Button
                                  variant="ghost"
                                  onClick={() => openEdit(perm)}
                                >
                                  Editar
                                </Button>
                              ) : null}
                              {canDelete ? (
                                <Button
                                  variant="danger"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setDeleteTarget(perm);
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
        title={formMode === "create" ? "Crear permiso" : "Editar permiso"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-5"
        >
          <ErrorMessage
            message={formError}
            onDismiss={() => setFormError(null)}
          />

          <div className="space-y-1">
            <label
              htmlFor="perm-name"
              className="text-xs uppercase tracking-widest text-[#B39F84]"
            >
              Nombre
            </label>
            <input
              id="perm-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-[#B39F84]/30 bg-[#0C0C00]/50 px-4 py-2.5 text-sm text-[#F2E8D5] placeholder-[#D6CCA8]/40 outline-none focus:border-[#B39F84] focus:ring-1 focus:ring-[#B39F84]/40"
              placeholder="nombre_del_permiso"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="perm-desc"
              className="text-xs uppercase tracking-widest text-[#B39F84]"
            >
              Descripción
            </label>
            <input
              id="perm-desc"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-xl border border-[#B39F84]/30 bg-[#0C0C00]/50 px-4 py-2.5 text-sm text-[#F2E8D5] placeholder-[#D6CCA8]/40 outline-none focus:border-[#B39F84] focus:ring-1 focus:ring-[#B39F84]/40"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              type="button"
            >
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
          <ErrorMessage
            message={deleteError}
            onDismiss={() => setDeleteError(null)}
          />

          <p className="text-sm text-[#D6CCA8]">
            ¿Estás seguro de que deseas eliminar el permiso{" "}
            <strong className="text-[#F2E8D5]">{deleteTarget?.name}</strong>?
            Esta acción no se puede deshacer.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}