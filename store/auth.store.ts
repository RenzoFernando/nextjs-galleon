import { create } from "zustand";
import { authApi } from "@/lib/api/auth.api";
import { getApiErrorMessage } from "@/lib/api/http";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/storage";
import type { AuthStore, LoginRequest } from "@/types/auth";
import { hasPermission } from "@/lib/auth/permission-guards";
import { hasRole } from "@/lib/auth/role-guards";

const initialAuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,
  error: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialAuthState,

  async login(credentials: LoginRequest): Promise<void> {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await authApi.login(credentials);

      setTokens(response.access_token, response.refresh_token);

      set({
          user: response.user,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          isAuthenticated: true,
          isLoading: false,
          hasHydrated: true,
          error: null,
      });
    } catch (error) {
      clearTokens();

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        hasHydrated: true,
        error: getApiErrorMessage(error, "No se pudo iniciar sesión."),
      });

      throw error;
    }
  },

  async logout(): Promise<void> {
    const currentRefreshToken = get().refreshToken ?? getRefreshToken();

    set({
      isLoading: true,
      error: null,
    });

    try {
      if (currentRefreshToken) {
        await authApi.logout(currentRefreshToken);
      }
    } catch {
      // Aunque el backend falle al revocar el refresh token,
      // el frontend debe limpiar la sesión local.
    } finally {
      clearTokens();

      set({
        ...initialAuthState,
        hasHydrated: true,
      });
    }
  },

  async loadSession(): Promise<void> {
    const storedAccessToken = getAccessToken();
    const storedRefreshToken = getRefreshToken();

    if (!storedAccessToken || !storedRefreshToken) {
      clearTokens();

      set({
        ...initialAuthState,
        hasHydrated: true,
      });

      return;
    }

    set({
      accessToken: storedAccessToken,
      refreshToken: storedRefreshToken,
      isLoading: true,
      error: null,
    });

    try {
      const user = await authApi.getMe();

      set({
        user,
        accessToken: storedAccessToken,
        refreshToken: storedRefreshToken,
        isAuthenticated: true,
        isLoading: false,
        hasHydrated: true,
        error: null,
      });
    } catch {
      try {
        const refreshedSession = await authApi.refresh(storedRefreshToken);

        setTokens(
          refreshedSession.access_token,
          refreshedSession.refresh_token
        );

        set({
          user: refreshedSession.user,
          accessToken: refreshedSession.access_token,
          refreshToken: refreshedSession.refresh_token,
          isAuthenticated: true,
          isLoading: false,
          hasHydrated: true,
          error: null,
        });
      } catch (refreshError) {
        clearTokens();

        set({
          ...initialAuthState,
          hasHydrated: true,
          error: getApiErrorMessage(
            refreshError,
            "Tu sesión expiró. Inicia sesión nuevamente."
          ),
        });
      }
    }
  },

  async fetchMe(): Promise<void> {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const user = await authApi.getMe();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        hasHydrated: true,
        error: null,
      });
    } catch (error) {
      clearTokens();

      set({
        ...initialAuthState,
        hasHydrated: true,
        error: getApiErrorMessage(
          error,
          "No se pudo obtener el usuario autenticado."
        ),
      });

      throw error;
    }
  },

  clearError(): void {
    set({
      error: null,
    });
  },

  hasRole(roleName: string): boolean {
    return hasRole(get().user, roleName);
  },

  hasPermission(permissionName: string): boolean {
    return hasPermission(get().user, permissionName);
  },
}));

export { hasPermission, hasRole };