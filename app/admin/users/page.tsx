"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api/http";
import { listRoles } from "@/lib/api/roles.api";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "@/lib/api/users.api";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types/role";
import type { User } from "@/types/user";

type FormMode = "create" | "edit";

interface UserForm {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

const emptyForm: UserForm = { name: "", email: "", password: "", roleId: "" };

export default function UsersPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isSuperadmin = hasRole("superadmin");

  const canCreate =
    isSuperadmin ||
    hasPermission("user_create") ||
    hasPermission("user_manage");
  const canUpdate =
    isSuperadmin ||
    hasPermission("user_update") ||
    hasPermission("user_manage");
  const canDelete =
    isSuperadmin ||
    hasPermission("user_delete") ||
    hasPermission("user_manage");

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        listUsers(),
        listRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudieron cargar los usuarios."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setFormMode("edit");
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      roleId: String(user.roleId),
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setFormError(null);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        roleId: Number(form.roleId),
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (formMode === "create") {
        payload.password = form.password;
        await createUser(payload as Partial<User>);
      } else if (editingId !== null) {
        await updateUser(editingId, payload as Partial<User>);
      }

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "No se pudo guardar el usuario."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setDeleteError(
        getApiErrorMessage(err, "No se pudo eliminar el usuario."),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell
      requiredPermissions={["user_read", "user_manage"]}
      requireAllPermissions={false}
    >
      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl italic text-[#F2E8D5]">
              Usuarios
            </h1>
            <p className="mt-1 text-sm text-[#D6CCA8]/80">
              Gestión de usuarios del sistema.
            </p>
          </div>

          {canCreate ? (
            <Button onClick={openCreate}>+ Crear usuario</Button>
          ) : null}
        </div>

        {/* Error */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {/* Table */}
        {isLoading ? (
          <Loading label="Cargando usuarios…" />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#B39F84]/20 bg-[#19242E] shadow-xl shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0C0C00]/50 text-[#B39F84]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Rol</th>
                    {canUpdate || canDelete ? (
                      <th className="px-6 py-4 text-right font-semibold">
                        Acciones
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B39F84]/10">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-[#D6CCA8]/50"
                      >
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="transition hover:bg-[#B39F84]/5"
                      >
                        <td className="px-6 py-4 text-[#D6CCA8]">{user.id}</td>
                        <td className="px-6 py-4 font-medium text-[#F2E8D5]">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-[#D6CCA8]">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-[#D6CCA8]">
                          <span className="rounded-full border border-[#B39F84]/20 bg-[#0C0C00]/40 px-2 py-1 text-xs">
                            {user.role?.name ?? "N/A"}
                          </span>
                        </td>
                        {canUpdate || canDelete ? (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canUpdate ? (
                                <Button
                                  variant="ghost"
                                  onClick={() => openEdit(user)}
                                >
                                  Editar
                                </Button>
                              ) : null}
                              {canDelete ? (
                                <Button
                                  variant="danger"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setDeleteTarget(user);
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
        title={formMode === "create" ? "Crear usuario" : "Editar usuario"}
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
              htmlFor="user-name"
              className="text-xs uppercase tracking-widest text-[#B39F84]"
            >
              Nombre
            </label>
            <input
              id="user-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-[#B39F84]/30 bg-[#0C0C00]/50 px-4 py-2.5 text-sm text-[#F2E8D5] placeholder-[#D6CCA8]/40 outline-none focus:border-[#B39F84] focus:ring-1 focus:ring-[#B39F84]/40"
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="user-email"
              className="text-xs uppercase tracking-widest text-[#B39F84]"
            >
              Email
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-[#B39F84]/30 bg-[#0C0C00]/50 px-4 py-2.5 text-sm text-[#F2E8D5] placeholder-[#D6CCA8]/40 outline-none focus:border-[#B39F84] focus:ring-1 focus:ring-[#B39F84]/40"
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="user-password"
              className="text-xs uppercase tracking-widest text-[#B39F84]"
            >
              Contraseña{formMode === "edit" ? " (dejar vacío para no cambiar)" : ""}
            </label>
            <input
              id="user-password"
              type="password"
              required={formMode === "create"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-[#B39F84]/30 bg-[#0C0C00]/50 px-4 py-2.5 text-sm text-[#F2E8D5] placeholder-[#D6CCA8]/40 outline-none focus:border-[#B39F84] focus:ring-1 focus:ring-[#B39F84]/40"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="user-role"
              className="text-xs uppercase tracking-widest text-[#B39F84]"
            >
              Rol
            </label>
            <select
              id="user-role"
              required
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              className="w-full rounded-xl border border-[#B39F84]/30 bg-[#0C0C00]/50 px-4 py-2.5 text-sm text-[#F2E8D5] outline-none focus:border-[#B39F84] focus:ring-1 focus:ring-[#B39F84]/40"
            >
              <option value="">Seleccionar rol</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
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

      {/* Delete confirmation modal */}
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
            ¿Estás seguro de que deseas eliminar al usuario{" "}
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
