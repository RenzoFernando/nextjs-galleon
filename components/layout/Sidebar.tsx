"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, useEffect, useState } from "react";
import {
  FiCreditCard,
  FiGrid,
  FiLock,
  FiLogOut,
  FiMoon,
  FiShield,
  FiSun,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles?: string[];
  permissions?: string[];
}

type ThemeMode = "dark" | "light";

const THEME_KEY = "gringotts_theme";

const mainItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: FiGrid,
  },
  {
    label: "Bóvedas",
    href: "/vaults",
    icon: FiCreditCard,
  },
];

const adminItems: NavItem[] = [
  {
    label: "Usuarios",
    href: "/admin/users",
    icon: FiUsers,
    roles: ["superadmin"],
    permissions: ["user_manage", "user_read"],
  },
  {
    label: "Roles",
    href: "/admin/roles",
    icon: FiShield,
    roles: ["superadmin"],
    permissions: ["role_create", "role_read", "role_update", "role_delete"],
  },
  {
    label: "Permisos",
    href: "/admin/permissions",
    icon: FiLock,
    roles: ["superadmin"],
    permissions: [
      "permission_create",
      "permission_read",
      "permission_update",
      "permission_delete",
      "permission_assign",
      "permission_remove",
    ],
  },
];

function getRoleLabel(roleName?: string | null): string {
  if (!roleName) {
    return "Sin rol";
  }

  const labels: Record<string, string> = {
    superadmin: "Superadmin",
    user: "Usuario",
    auditor: "Auditor",
  };

  return labels[roleName] ?? roleName;
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const theme = window.localStorage.getItem(THEME_KEY);

  return theme === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_KEY, theme);
}

function SidebarLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname();
  const Icon = item.icon;

  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={[
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        isActive
          ? "bg-[#B39F84] text-[#0C0C00]"
          : "text-[#D6CCA8] hover:bg-[#B39F84]/10 hover:text-[#F2E8D5]",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const visibleAdminItems = adminItems.filter((item) => {
    const hasAllowedRole = item.roles?.some((role) => hasRole(role)) ?? false;
    const hasAllowedPermission =
      item.permissions?.some((permission) => hasPermission(permission)) ?? false;

    return hasAllowedRole || hasAllowedPermission;
  });

  const canSeeAdminMenu = visibleAdminItems.length > 0;

  useEffect(() => {
    const storedTheme = getStoredTheme();

    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  function handleToggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  async function handleLogout() {
    await logout();
    onClose();
    router.replace("/login");
  }

  const ThemeIcon = theme === "dark" ? FiMoon : FiSun;

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        />
      ) : null}

      <aside
        className={[
          "gringotts-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#B39F84]/20 bg-[#19242E] px-5 py-6 shadow-2xl shadow-black/50 transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#B39F84]/35 bg-[#F2E8D5] p-1 shadow-lg shadow-black/25">
              <Image
                src="/logo.png"
                alt="Logo de Gringotts"
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
                Banco
              </p>
              <p className="font-serif text-2xl italic text-[#F2E8D5]">Gringotts</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#B39F84]/30 text-[#D6CCA8] transition hover:bg-[#B39F84]/10 lg:hidden"
            aria-label="Cerrar menú"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-[#B39F84]/20 bg-[#0C0C00]/45 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Cuenta</p>
          <p className="mt-2 truncate text-sm font-semibold text-[#F2E8D5]">
            {user?.name ?? "Usuario"}
          </p>
          <p className="mt-1 truncate text-xs text-[#D6CCA8]/70">
            {getRoleLabel(user?.role?.name)}
          </p>
          <p className="mt-1 truncate text-xs text-[#D6CCA8]/60">{user?.email ?? "Sin correo"}</p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-8">
          <section>
            <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#B39F84]/80">
              General
            </p>

            <div className="space-y-2">
              {mainItems.map((item) => (
                <SidebarLink key={item.href} item={item} onClose={onClose} />
              ))}
            </div>
          </section>

          {canSeeAdminMenu ? (
            <section>
              <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#B39F84]/80">
                Administración
              </p>

              <div className="space-y-2">
                {visibleAdminItems.map((item) => (
                  <SidebarLink key={item.href} item={item} onClose={onClose} />
                ))}
              </div>
            </section>
          ) : null}
        </nav>

        <section className="space-y-2 border-t border-[#B39F84]/15 pt-5">
          <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#B39F84]/80">
            Preferencias
          </p>

          <button
            type="button"
            onClick={handleToggleTheme}
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10 hover:text-[#F2E8D5]"
          >
            <span className="flex items-center gap-3">
              <ThemeIcon className="h-5 w-5" />
              <span>Tema</span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B39F84]">
              {theme === "dark" ? "Oscuro" : "Claro"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#7B2E2E]/25 hover:text-[#F2E8D5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiLogOut className="h-5 w-5" />
            <span>{isLoading ? "Saliendo..." : "Cerrar sesión"}</span>
          </button>
        </section>
      </aside>
    </>
  );
}
