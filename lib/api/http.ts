import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/storage";
import type { TokenResponse } from "@/types/auth";

export interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface AuthTokensRefreshedDetail {
  accessToken: string;
  refreshToken: string;
}

export const AUTH_TOKENS_REFRESHED_EVENT = "gringotts:auth-tokens-refreshed";
export const AUTH_SESSION_CLEARED_EVENT = "gringotts:auth-session-cleared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://taller-nest-nestea.onrender.com/api";

const AUTH_LOGIN_URL = "/auth/login";
const AUTH_REFRESH_URL = "/auth/refresh";
const AUTH_LOGOUT_URL = "/auth/logout";

let pendingRefreshRequest: Promise<TokenResponse> | null = null;

function buildApiUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function notifyTokensRefreshed(tokens: AuthTokensRefreshedDetail): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AuthTokensRefreshedDetail>(AUTH_TOKENS_REFRESHED_EVENT, {
      detail: tokens,
    })
  );
}

function notifySessionCleared(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
}

function readTokenFromStorage(): string | null {
  const appToken = getAccessToken();

  if (appToken) {
    return appToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const directKeys = [
    "access_token",
    "accessToken",
    "token",
    "auth_token",
    "authToken",
  ];

  for (const key of directKeys) {
    const value = window.localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  const possibleStores = ["auth-storage", "authStore", "auth"];

  for (const key of possibleStores) {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as {
        state?: {
          accessToken?: string;
          access_token?: string;
          token?: string;
        };
        accessToken?: string;
        access_token?: string;
        token?: string;
      };

      const value =
        parsed.state?.accessToken ??
        parsed.state?.access_token ??
        parsed.state?.token ??
        parsed.accessToken ??
        parsed.access_token ??
        parsed.token ??
        null;

      if (value) {
        return value;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function setAuthorizationHeader(
  config: InternalAxiosRequestConfig,
  accessToken: string
): void {
  config.headers = config.headers ?? new AxiosHeaders();

  if (typeof config.headers.set === "function") {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
    return;
  }

  (config.headers as unknown as Record<string, string>).Authorization =
    `Bearer ${accessToken}`;
}

function isAuthEndpoint(requestUrl: string, endpoint: string): boolean {
  return requestUrl.includes(endpoint);
}

function shouldAttemptRefresh(
  status: number | undefined,
  requestUrl: string,
  originalRequest: RetryableRequestConfig | undefined
): boolean {
  if (status !== 401 || !originalRequest || originalRequest._retry) {
    return false;
  }

  return (
    !isAuthEndpoint(requestUrl, AUTH_LOGIN_URL) &&
    !isAuthEndpoint(requestUrl, AUTH_REFRESH_URL) &&
    !isAuthEndpoint(requestUrl, AUTH_LOGOUT_URL)
  );
}

async function refreshTokens(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    notifySessionCleared();
    throw new Error("No hay refresh token disponible.");
  }

  if (!pendingRefreshRequest) {
    pendingRefreshRequest = axios
      .post<TokenResponse>(
        buildApiUrl(AUTH_REFRESH_URL),
        { refreshToken },
        {
          timeout: 60000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        const refreshedSession = response.data;

        setTokens(
          refreshedSession.access_token,
          refreshedSession.refresh_token
        );

        notifyTokensRefreshed({
          accessToken: refreshedSession.access_token,
          refreshToken: refreshedSession.refresh_token,
        });

        return refreshedSession;
      })
      .catch((error) => {
        clearTokens();
        notifySessionCleared();
        throw error;
      })
      .finally(() => {
        pendingRefreshRequest = null;
      });
  }

  return pendingRefreshRequest;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = readTokenFromStorage();

  if (accessToken) {
    setAuthorizationHeader(config, accessToken);
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (shouldAttemptRefresh(status, requestUrl, originalRequest)) {
      try {
        const refreshedSession = await refreshTokens();

        if (!originalRequest) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        setAuthorizationHeader(originalRequest, refreshedSession.access_token);

        return http(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    if (
      status === 401 &&
      (requestUrl.includes(AUTH_REFRESH_URL) ||
        requestUrl.includes(AUTH_LOGIN_URL))
    ) {
      clearTokens();
      notifySessionCleared();
    }

    return Promise.reject(error);
  }
);

export function getApiErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.status ?? null;
  }

  return null;
}

function cleanApiMessage(value: string): string | null {
  const message = value.trim();

  if (!message) {
    return null;
  }

  const lower = message.toLowerCase();

  if (
    lower === "unauthorized" ||
    lower === "forbidden" ||
    lower === "bad request" ||
    lower === "not found" ||
    lower === "internal server error" ||
    lower.startsWith("request failed with status code")
  ) {
    return null;
  }

  return message;
}

function getStatusMessage(status: number | undefined, fallback: string): string {
  if (status === 400) {
    return "Revisa los datos ingresados e inténtalo nuevamente.";
  }

  if (status === 401) {
    return "Tu sesión no está activa. Inicia sesión nuevamente.";
  }

  if (status === 403) {
    return "No tienes permisos para realizar esta acción.";
  }

  if (status === 404) {
    return "No se encontró la información solicitada.";
  }

  if (status === 409) {
    return "No se pudo completar la acción porque ya existe un registro relacionado.";
  }

  if (status === 422) {
    return "No se pudo procesar la información ingresada.";
  }

  if (status && status >= 500) {
    return "El servicio no está disponible en este momento. Inténtalo nuevamente más tarde.";
  }

  return fallback;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado."
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const statusMessage = getStatusMessage(status, fallback);

    if (Array.isArray(message)) {
      const cleanMessages = message
        .map((item) => cleanApiMessage(item))
        .filter((item): item is string => Boolean(item));

      if (cleanMessages.length > 0) {
        return cleanMessages.join(" ");
      }

      return statusMessage;
    }

    if (typeof message === "string") {
      const cleanMessage = cleanApiMessage(message);

      if (cleanMessage) {
        return cleanMessage;
      }

      return statusMessage;
    }

    if (typeof error.response?.data?.error === "string") {
      const cleanMessage = cleanApiMessage(error.response.data.error);

      if (cleanMessage) {
        return cleanMessage;
      }

      return statusMessage;
    }

    const cleanErrorMessage =
      typeof error.message === "string" ? cleanApiMessage(error.message) : null;

    return cleanErrorMessage ?? statusMessage;
  }

  if (error instanceof Error) {
    return cleanApiMessage(error.message) ?? fallback;
  }

  return fallback;
}

export default http;
