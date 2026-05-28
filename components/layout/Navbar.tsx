"use client";

import { useRouter } from "next/navigation";
import { FiLogOut, FiMenu } from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";

interface NavbarProps {
  onOpenSidebar: () => void;
}

function getInitials(name?: string | null): string {
  if (!name) {
    return "U";
  }

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
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

export function Navbar({ onOpenSidebar }: NavbarProps) {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#B39F84]/20 bg-[#0C0C00]/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#B39F84]/30 text-[#D6CCA8] transition hover:bg-[#B39F84]/10 lg:hidden"
            aria-label="Abrir menú"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
              Gringotts
            </p>
            <h1 className="mt-1 font-serif text-2xl italic text-[#F2E8D5]">
              Bóvedas y movimientos
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[#F2E8D5]">{user?.name ?? "Usuario"}</p>
            <p className="text-xs text-[#D6CCA8]/70">{getRoleLabel(user?.role?.name)}</p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#B39F84]/35 bg-[#19242E] text-sm font-bold text-[#F2E8D5]">
            {getInitials(user?.name)}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[#B39F84]/30 px-4 text-sm font-semibold text-[#D6CCA8] transition hover:bg-[#7B2E2E]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiLogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{isLoading ? "Saliendo..." : "Salir"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
