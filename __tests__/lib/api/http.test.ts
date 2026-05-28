import { describe, it, expect } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { getApiErrorMessage, getApiErrorStatus, type ApiErrorResponse } from "@/lib/api/http";

function createAxiosError(
  status: number,
  data: ApiErrorResponse,
  message = "Request failed",
): AxiosError<ApiErrorResponse> {
  const error = new AxiosError<ApiErrorResponse>(message);
  error.response = {
    status,
    data,
    statusText: "",
    headers: {},
    config: {} as AxiosResponse["config"],
  };
  return error;
}

describe("HTTP Utilities", () => {
  describe("getApiErrorStatus", () => {
    it("should return the status code from an AxiosError", () => {
      const error = createAxiosError(404, {});
      expect(getApiErrorStatus(error)).toBe(404);
    });

    it("should return null for a non-Axios error", () => {
      expect(getApiErrorStatus(new Error("generic"))).toBeNull();
    });

    it("should return null for a non-Error value", () => {
      expect(getApiErrorStatus("string error")).toBeNull();
    });

    it("should return null when response is undefined", () => {
      const error = new AxiosError("No response");
      expect(getApiErrorStatus(error)).toBeNull();
    });
  });

  describe("getApiErrorMessage", () => {
    it("should return API string message when available and meaningful", () => {
      const error = createAxiosError(400, {
        message: "El email ya está registrado.",
      });
      expect(getApiErrorMessage(error)).toBe("El email ya está registrado.");
    });

    it("should return joined array messages when available", () => {
      const error = createAxiosError(400, {
        message: ["Campo nombre requerido.", "Campo email requerido."],
      });
      expect(getApiErrorMessage(error)).toBe("Campo nombre requerido. Campo email requerido.");
    });

    it("should filter out generic messages from array and return status message", () => {
      const error = createAxiosError(400, {
        message: ["Bad Request"],
      });
      expect(getApiErrorMessage(error)).toBe(
        "Revisa los datos ingresados e inténtalo nuevamente.",
      );
    });

    it("should return status-based message for 401", () => {
      const error = createAxiosError(401, { message: "Unauthorized" });
      expect(getApiErrorMessage(error)).toBe(
        "Tu sesión no está activa. Inicia sesión nuevamente.",
      );
    });

    it("should return status-based message for 403", () => {
      const error = createAxiosError(403, { message: "Forbidden" });
      expect(getApiErrorMessage(error)).toBe(
        "No tienes permisos para realizar esta acción.",
      );
    });

    it("should return status-based message for 404", () => {
      const error = createAxiosError(404, { message: "Not Found" });
      expect(getApiErrorMessage(error)).toBe(
        "No se encontró la información solicitada.",
      );
    });

    it("should return status-based message for 409", () => {
      const error = createAxiosError(409, { message: "Request failed with status code 409" });
      expect(getApiErrorMessage(error)).toBe(
        "No se pudo completar la acción porque ya existe un registro relacionado.",
      );
    });

    it("should return status-based message for 422", () => {
      const error = createAxiosError(422, { message: "Unauthorized" });
      expect(getApiErrorMessage(error)).toBe(
        "No se pudo procesar la información ingresada.",
      );
    });

    it("should return status-based message for 500+", () => {
      const error = createAxiosError(500, { message: "Internal Server Error" });
      expect(getApiErrorMessage(error)).toBe(
        "El servicio no está disponible en este momento. Inténtalo nuevamente más tarde.",
      );
    });

    it("should use error.error field when message is absent", () => {
      const error = createAxiosError(400, {
        error: "Token inválido.",
      });
      expect(getApiErrorMessage(error)).toBe("Token inválido.");
    });

    it("should return fallback for non-Axios error with generic message", () => {
      expect(getApiErrorMessage(new Error("Internal Server Error"), "Fallback")).toBe("Fallback");
    });

    it("should return default fallback when none is provided", () => {
      expect(getApiErrorMessage("unknown")).toBe("Ocurrió un error inesperado.");
    });

    it("should return fallback for Error with generic message", () => {
      const error = new Error("Request failed with status code 500");
      expect(getApiErrorMessage(error, "Custom fallback")).toBe("Custom fallback");
    });
  });
});
