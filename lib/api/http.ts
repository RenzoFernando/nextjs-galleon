import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken } from "@/lib/storage";

export interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://taller-nest-nestea.onrender.com/api";

function readTokenFromStorage(): string | null {
  const appToken = getAccessToken();

  if (appToken) {
    return appToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const directKeys = ["access_token", "accessToken", "token", "auth_token", "authToken"];

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

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = readTokenFromStorage();

  if (accessToken) {
    config.headers = config.headers ?? new AxiosHeaders();

    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      (config.headers as unknown as Record<string, string>).Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";

    if (status === 401 && !requestUrl.includes("/auth/login")) {
      clearTokens();
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado."
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string") {
      return message;
    }

    if (typeof error.response?.data?.error === "string") {
      return error.response.data.error;
    }

    if (error.response?.status === 401) {
      return "Tu sesión no está activa. Inicia sesión nuevamente.";
    }

    if (error.response?.status === 403) {
      return "No tienes permisos para realizar esta acción.";
    }

    if (typeof error.message === "string") {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export const api = http;

export default http;