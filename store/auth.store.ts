import { create } from "zustand";
import { authApi } from "@/lib/api/auth.api";
import {
  AUTH_SESSION_CLEARED_EVENT,
  AUTH_TOKENS_REFRESHED_EVENT,
  getApiErrorMessage,
  type AuthTokensRefreshedDetail,
} from "@/lib/api/http";
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

let pendingLoadSession: Promise<void> | null = null;

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
    const currentRefreshToken = getRefreshToken() ?? get().refreshToken;

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
    if (pendingLoadSession) {
      return pendingLoadSession;
    }

    pendingLoadSession = (async () => {
      const currentState = get();

      if (currentState.hasHydrated && !currentState.isLoading) {
        return;
      }

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

          setTokens(refreshedSession.access_token, refreshedSession.refresh_token);

          const refreshedUser = refreshedSession.user ?? (await authApi.getMe());

          set({
            user: refreshedUser,
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
            error: getApiErrorMessage(refreshError, "Tu sesión expiró. Inicia sesión nuevamente."),
          });
        }
      }
    })();

    try {
      await pendingLoadSession;
    } finally {
      pendingLoadSession = null;

      if (get().isLoading) {
        set({
          isLoading: false,
          hasHydrated: true,
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
        error: getApiErrorMessage(error, "No se pudo obtener el usuario autenticado."),
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

declare global {
  interface Window {
    __gringottsAuthStoreListenersRegistered?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__gringottsAuthStoreListenersRegistered) {
  window.__gringottsAuthStoreListenersRegistered = true;

  window.addEventListener(AUTH_TOKENS_REFRESHED_EVENT, (event) => {
    const { accessToken, refreshToken } = (event as CustomEvent<AuthTokensRefreshedDetail>).detail;

    useAuthStore.setState({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      hasHydrated: true,
      error: null,
    });
  });

  window.addEventListener(AUTH_SESSION_CLEARED_EVENT, () => {
    useAuthStore.setState({
      ...initialAuthState,
      hasHydrated: true,
      error: "Tu sesión expiró. Inicia sesión nuevamente.",
    });
  });
}
