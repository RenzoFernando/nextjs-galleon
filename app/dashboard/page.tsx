"use client";

import Link from "next/link";
import { FiCreditCard, FiKey, FiLock, FiShield, FiUser } from "react-icons/fi";
import { AppShell } from "@/components/layout/AppShell";
import { getUserPermissionNames } from "@/lib/auth/permission-guards";
import { useAuthStore } from "@/store/auth.store";

function formatDate(value?: string | null): string {
  if (!value) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const permissionNames = getUserPermissionNames(user);
  const isSuperadmin = hasRole("superadmin");

  const canAccessAdmin =
    isSuperadmin ||
    hasPermission("user_manage") ||
    hasPermission("user_read") ||
    hasPermission("role_read") ||
    hasPermission("permission_read");

  return (
    <AppShell>
      <section className="space-y-8">
        <div className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-2xl shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B39F84]">
            Resumen de sesión
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <h1 className="font-serif text-4xl italic text-[#F2E8D5]">
                Bienvenido, {user?.name ?? "usuario"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D6CCA8]/80">
                Esta pantalla confirma que la autenticación, el estado global,
                los roles y los permisos ya están conectados correctamente con
                el frontend.
              </p>
            </div>

            <div className="rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/50 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">
                Estado
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
                Sesión activa
              </p>
              <p className="mt-1 text-xs text-[#D6CCA8]/70">
                Autenticado mediante JWT
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-5 shadow-xl shadow-black/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B39F84] text-[#0C0C00]">
              <FiUser className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#B39F84]">
              Usuario
            </p>
            <p className="mt-2 truncate text-lg font-semibold text-[#F2E8D5]">
              {user?.name ?? "No disponible"}
            </p>
            <p className="mt-1 truncate text-sm text-[#D6CCA8]/70">
              {user?.email ?? "Sin correo"}
            </p>
          </article>

          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-5 shadow-xl shadow-black/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1B251D] text-[#D6CCA8]">
              <FiShield className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#B39F84]">
              Rol global
            </p>
            <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
              {user?.role?.name ?? "Sin rol"}
            </p>
            <p className="mt-1 text-sm text-[#D6CCA8]/70">
              ID de rol: {user?.roleId ?? "N/A"}
            </p>
          </article>

          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-5 shadow-xl shadow-black/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0C0C00] text-[#B39F84]">
              <FiKey className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#B39F84]">
              Permisos
            </p>
            <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
              {isSuperadmin ? "Acceso total" : permissionNames.length}
            </p>
            <p className="mt-1 text-sm text-[#D6CCA8]/70">
              Heredados desde el rol
            </p>
          </article>

          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-5 shadow-xl shadow-black/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7B2E2E] text-[#F2E8D5]">
              <FiLock className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#B39F84]">
              Creación
            </p>
            <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
              {formatDate(user?.createdAt)}
            </p>
            <p className="mt-1 text-sm text-[#D6CCA8]/70">
              Fecha del usuario
            </p>
          </article>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
                  Permisos globales
                </p>
                <h2 className="mt-2 font-serif text-2xl italic text-[#F2E8D5]">
                  Autorización heredada
                </h2>
              </div>
            </div>

            {isSuperadmin ? (
              <div className="mt-6 rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 p-4 text-sm leading-6 text-[#D6CCA8]/80">
                El usuario tiene rol <strong>superadmin</strong>, por lo que se
                considera autorizado para todas las acciones administrativas del
                frontend.
              </div>
            ) : permissionNames.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {permissionNames.map((permissionName) => (
                  <span
                    key={permissionName}
                    className="rounded-full border border-[#B39F84]/25 bg-[#0C0C00]/45 px-3 py-1 text-xs font-semibold text-[#D6CCA8]"
                  >
                    {permissionName}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 p-4 text-sm leading-6 text-[#D6CCA8]/80">
                No se encontraron permisos globales asociados al rol actual.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
              Accesos rápidos
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/vaults"
                className="flex items-center justify-between rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 px-4 py-4 text-sm font-semibold text-[#F2E8D5] transition hover:border-[#B39F84]/50 hover:bg-[#B39F84]/10"
              >
                <span className="flex items-center gap-3">
                  <FiCreditCard className="h-5 w-5 text-[#B39F84]" />
                  Ir a bóvedas
                </span>
                <span className="text-[#B39F84]">→</span>
              </Link>

              {canAccessAdmin ? (
                <Link
                  href="/admin/users"
                  className="flex items-center justify-between rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 px-4 py-4 text-sm font-semibold text-[#F2E8D5] transition hover:border-[#B39F84]/50 hover:bg-[#B39F84]/10"
                >
                  <span className="flex items-center gap-3">
                    <FiShield className="h-5 w-5 text-[#B39F84]" />
                    Ir a administración
                  </span>
                  <span className="text-[#B39F84]">→</span>
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}