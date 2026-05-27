"use client";

import Link from "next/link";
import { FiCreditCard, FiKey, FiLock, FiPlusCircle, FiShield, FiUser } from "react-icons/fi";
import { AppShell } from "@/components/layout/AppShell";
import { VaultErrorMessage } from "@/components/vaults/VaultErrorMessage";
import { VaultLoadingState } from "@/components/vaults/VaultLoadingState";
import { getUserPermissionNames } from "@/lib/auth/permission-guards";
import { getApiErrorMessage } from "@/lib/api/http";
import { listTransactions } from "@/lib/api/transactions.api";
import { listVaults } from "@/lib/api/vaults.api";
import { useAuthStore } from "@/store/auth.store";
import type { Transaction } from "@/types/transaction";
import type { Vault } from "@/types/vault";
import { useEffect, useMemo, useState } from "react";

type DashboardMovement = Transaction & {
  vaultName: string;
};

type DashboardStats = {
  vaults: number;
  personal: number;
  shared: number;
  household: number;
  transactions: number;
};

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

function formatShortDate(value?: string | null): string {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function getRoleLabel(roleName?: string | null): string {
  if (!roleName) {
    return "Sin rol";
  }

  const labels: Record<string, string> = {
    superadmin: "Superadmin",
    user: "Usuario",
  };

  return labels[roleName] ?? roleName;
}

function transactionTypeLabel(type: Transaction["type"]): string {
  const labels: Record<Transaction["type"], string> = {
    income: "Ingreso",
    expense: "Gasto",
    transfer: "Transferencia",
  };

  return labels[type];
}

function amountLabel(transaction: Transaction): string {
  return `${transaction.amountMinor.toLocaleString("es-CO")} ${transaction.currency}`;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [recentMovements, setRecentMovements] = useState<DashboardMovement[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    vaults: 0,
    personal: 0,
    shared: 0,
    household: 0,
    transactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const permissionNames = getUserPermissionNames(user);
  const isSuperadmin = hasRole("superadmin");

  const canAccessAdmin =
    isSuperadmin ||
    hasPermission("user_manage") ||
    hasPermission("user_read") ||
    hasPermission("role_read") ||
    hasPermission("permission_read");

  const visiblePermissions = useMemo(() => permissionNames.slice(0, 8), [permissionNames]);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const vaultData = await listVaults();
      const transactionResults = await Promise.all(
        vaultData.map(async (vault) => {
          const result = await listTransactions(vault.id, { page: 1, pageSize: 3 });
          return {
            vault,
            result,
          };
        }),
      );

      const movements = transactionResults
        .flatMap(({ vault, result }) =>
          result.data.map((transaction) => ({
            ...transaction,
            vaultName: vault.name,
          })),
        )
        .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
        .slice(0, 6);

      setVaults(vaultData);
      setRecentMovements(movements);
      setStats({
        vaults: vaultData.length,
        personal: vaultData.filter((vault) => vault.type === "personal").length,
        shared: vaultData.filter((vault) => vault.type === "shared").length,
        household: vaultData.filter((vault) => vault.type === "household").length,
        transactions: transactionResults.reduce((total, item) => total + item.result.meta.total, 0),
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <AppShell>
      <section className="space-y-8">
        <div className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-2xl shadow-black/30">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B39F84]">
                Inicio
              </p>
              <h1 className="mt-4 font-serif text-4xl italic text-[#F2E8D5]">
                Bienvenido, {user?.name ?? "usuario"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D6CCA8]/80">
                Consulta tus bóvedas, revisa movimientos recientes y accede rápidamente a las tareas principales.
              </p>
            </div>

            <div className="rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/50 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">
                Perfil
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
                {getRoleLabel(user?.role?.name)}
              </p>
              <p className="mt-1 truncate text-xs text-[#D6CCA8]/70">
                {user?.email ?? "Correo no disponible"}
              </p>
            </div>
          </div>
        </div>

        <VaultErrorMessage message={error} />

        {loading ? <VaultLoadingState message="Cargando resumen..." /> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-5 shadow-xl shadow-black/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B39F84] text-[#0C0C00]">
              <FiCreditCard className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#B39F84]">
              Bóvedas
            </p>
            <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
              {stats.vaults}
            </p>
            <p className="mt-1 text-sm text-[#D6CCA8]/70">
              Personales, compartidas y del hogar
            </p>
          </article>

          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-5 shadow-xl shadow-black/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1B251D] text-[#D6CCA8]">
              <FiShield className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#B39F84]">
              Rol
            </p>
            <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
              {getRoleLabel(user?.role?.name)}
            </p>
            <p className="mt-1 text-sm text-[#D6CCA8]/70">
              Acceso actual
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
              Acciones disponibles
            </p>
          </article>

          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-5 shadow-xl shadow-black/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7B2E2E] text-[#F2E8D5]">
              <FiLock className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#B39F84]">
              Desde
            </p>
            <p className="mt-2 text-lg font-semibold text-[#F2E8D5]">
              {formatDate(user?.createdAt)}
            </p>
            <p className="mt-1 text-sm text-[#D6CCA8]/70">
              Fecha de creación
            </p>
          </article>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
                  Bóvedas recientes
                </p>
                <h2 className="mt-2 font-serif text-2xl italic text-[#F2E8D5]">
                  Acceso directo
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {vaults.slice(0, 4).map((vault) => (
                <Link
                  key={vault.id}
                  href={`/vaults/${vault.id}`}
                  className="flex items-center justify-between rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 px-4 py-4 text-sm font-semibold text-[#F2E8D5] transition hover:border-[#B39F84]/50 hover:bg-[#B39F84]/10"
                >
                  <span>
                    {vault.name}
                    <span className="ml-2 text-xs font-normal text-[#D6CCA8]/60">
                      {vault.baseCurrency}
                    </span>
                  </span>
                  <span className="text-[#B39F84]">→</span>
                </Link>
              ))}

              {!loading && vaults.length === 0 ? (
                <div className="rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 p-4 text-sm leading-6 text-[#D6CCA8]/80">
                  Aún no tienes bóvedas registradas.
                </div>
              ) : null}
            </div>
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
                  Ver bóvedas
                </span>
                <span className="text-[#B39F84]">→</span>
              </Link>

              <Link
                href="/vaults/new"
                className="flex items-center justify-between rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 px-4 py-4 text-sm font-semibold text-[#F2E8D5] transition hover:border-[#B39F84]/50 hover:bg-[#B39F84]/10"
              >
                <span className="flex items-center gap-3">
                  <FiPlusCircle className="h-5 w-5 text-[#B39F84]" />
                  Crear bóveda
                </span>
                <span className="text-[#B39F84]">→</span>
              </Link>

              {canAccessAdmin ? (
                <Link
                  href="/admin/users"
                  className="flex items-center justify-between rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 px-4 py-4 text-sm font-semibold text-[#F2E8D5] transition hover:border-[#B39F84]/50 hover:bg-[#B39F84]/10"
                >
                  <span className="flex items-center gap-3">
                    <FiUser className="h-5 w-5 text-[#B39F84]" />
                    Administrar usuarios
                  </span>
                  <span className="text-[#B39F84]">→</span>
                </Link>
              ) : null}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-xl shadow-black/20">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
                Movimientos recientes
              </p>
              <div className="mt-6 divide-y divide-[#B39F84]/15">
                {recentMovements.map((movement) => (
                  <article key={`${movement.vaultId}-${movement.id}`} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#F2E8D5]">
                        {transactionTypeLabel(movement.type)} · {amountLabel(movement)}
                      </p>
                      <p className="mt-1 text-xs text-[#D6CCA8]/65">
                        {movement.vaultName} · {formatShortDate(movement.occurredAt)}
                      </p>
                    </div>
                    <Link href={`/vaults/${movement.vaultId}/transactions`} className="w-fit rounded-full border border-[#B39F84]/40 px-3 py-1 text-xs font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10">
                      Ver
                    </Link>
                  </article>
                ))}

                {!loading && recentMovements.length === 0 ? (
                  <div className="rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 p-4 text-sm leading-6 text-[#D6CCA8]/80">
                    No hay movimientos recientes para mostrar.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">
                Distribución
              </p>
              <div className="mt-5 grid gap-3 text-sm text-[#D6CCA8]/75">
                <div className="flex justify-between">
                  <span>Personales</span>
                  <span className="font-semibold text-[#F2E8D5]">{stats.personal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Compartidas</span>
                  <span className="font-semibold text-[#F2E8D5]">{stats.shared}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hogar</span>
                  <span className="font-semibold text-[#F2E8D5]">{stats.household}</span>
                </div>
                <div className="flex justify-between">
                  <span>Movimientos</span>
                  <span className="font-semibold text-[#F2E8D5]">{stats.transactions}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {visiblePermissions.length > 0 || isSuperadmin ? (
          <section className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
              Permisos disponibles
            </p>

            {isSuperadmin ? (
              <div className="mt-6 rounded-2xl border border-[#B39F84]/20 bg-[#0C0C00]/45 p-4 text-sm leading-6 text-[#D6CCA8]/80">
                Tienes acceso administrativo completo.
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-2">
                {visiblePermissions.map((permissionName) => (
                  <span
                    key={permissionName}
                    className="rounded-full border border-[#B39F84]/25 bg-[#0C0C00]/45 px-3 py-1 text-xs font-semibold text-[#D6CCA8]"
                  >
                    {permissionName}
                  </span>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
