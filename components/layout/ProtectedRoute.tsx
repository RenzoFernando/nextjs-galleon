"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/Loading";
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
    () => !allowedRoles || allowedRoles.length === 0 || allowedRoles.some((role) => hasRole(role)),
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

  const isAuthorized = hasRequiredRole && hasRequiredPermissions;

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

    if (!isAuthorized) {
      router.replace(unauthorizedTo);
    }
  }, [hasHydrated, isAuthenticated, isAuthorized, isLoading, redirectTo, router, unauthorizedTo]);

  if (!hasHydrated || isLoading) {
    return <Loading fullScreen label="Validando sesión..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAuthorized) {
    return <Loading fullScreen label="Verificando permisos..." />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
