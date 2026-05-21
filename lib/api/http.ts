import axios, { AxiosHeaders } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://taller-nest-nestea.onrender.com/api";

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function readTokenFromStorage(): string | null {
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

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = readTokenFromStorage();

  if (token) {
    config.headers = config.headers ?? new AxiosHeaders();

    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as unknown as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const payload = error.response?.data;

    if (Array.isArray(payload?.message)) {
      return payload.message.join(" ");
    }

    if (payload?.message) {
      return payload.message;
    }

    if (payload?.error) {
      return payload.error;
    }

    if (error.response?.status === 401) {
      return "Tu sesión no está activa. Inicia sesión o pega un access_token válido en localStorage.";
    }

    if (error.response?.status === 403) {
      return "No tienes permisos para realizar esta acción.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}
