"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requireAllPermissions?: boolean;
  redirectTo?: string;
  unauthorizedTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = true,
  redirectTo = "/login",
  unauthorizedTo = "/unauthorized",
}: ProtectedRouteProps) {
  const router = useRouter();

  const loadSession = useAuthStore((state) => state.loadSession);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const hasRequiredRole = useMemo(
    () =>
      !allowedRoles ||
      allowedRoles.length === 0 ||
      allowedRoles.some((role) => hasRole(role)),
    [allowedRoles, hasRole],
  );

  const hasRequiredPermissions = useMemo(
    () =>
      !requiredPermissions ||
      requiredPermissions.length === 0 ||
      (requireAllPermissions
        ? requiredPermissions.every((permission) => hasPermission(permission))
        : requiredPermissions.some((permission) => hasPermission(permission))),
    [hasPermission, requireAllPermissions, requiredPermissions],
  );

  useEffect(() => {
    if (!hasHydrated && !isLoading) {
      void loadSession();
    }
  }, [hasHydrated, isLoading, loadSession]);

  useEffect(() => {
    if (!hasHydrated || isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (!hasRequiredRole || !hasRequiredPermissions) {
      router.replace(unauthorizedTo);
    }
  }, [
    hasHydrated,
    hasRequiredPermissions,
    hasRequiredRole,
    isAuthenticated,
    isLoading,
    redirectTo,
    router,
    unauthorizedTo,
  ]);

  if (!hasHydrated || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0C0C00] px-6 text-[#D6CCA8]">
        <section className="rounded-3xl border border-[#B39F84]/30 bg-[#19242E] px-8 py-6 text-center shadow-2xl shadow-black/50">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
            Gringotts
          </p>
          <p className="mt-3 text-sm text-[#D6CCA8]/80">
            Validando sesión...
          </p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !hasRequiredRole || !hasRequiredPermissions) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
