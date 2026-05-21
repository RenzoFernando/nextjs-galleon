import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken } from "@/lib/storage";

export interface ApiErrorResponse {
    message?: string | string[];
    error?: string;
    statusCode?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const http = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    headers: {
        "Content-Type": "application/json",
    },
});

http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = getAccessToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    }
);

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

        if (typeof error.message === "string") {
            return error.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}

export default http;