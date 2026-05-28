import { describe, it, expect } from "vitest";
import {
  validateUserForm,
  isValidEmail,
  type UserForm,
  type FormMode,
} from "@/lib/validation/user-form";

describe("User Form Validation", () => {
  const validForm: UserForm = {
    name: "John Doe",
    email: "john@example.com",
    password: "securePassword123",
    roleId: "1",
  };

  describe("isValidEmail", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co")).toBe(true);
      expect(isValidEmail("user+tag@example.org")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("user")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user @domain.com")).toBe(false);
    });

    it("should trim whitespace before validation", () => {
      expect(isValidEmail("  user@example.com  ")).toBe(true);
    });
  });

  describe("validateUserForm – create mode", () => {
    const mode: FormMode = "create";

    it("should return null for a valid form", () => {
      expect(validateUserForm(validForm, mode)).toBeNull();
    });

    it("should reject name shorter than 2 characters", () => {
      const form = { ...validForm, name: "J" };
      expect(validateUserForm(form, mode)).toBe("El nombre debe tener al menos 2 caracteres.");
    });

    it("should reject empty name", () => {
      const form = { ...validForm, name: "" };
      expect(validateUserForm(form, mode)).toBe("El nombre debe tener al menos 2 caracteres.");
    });

    it("should reject name that is only whitespace", () => {
      const form = { ...validForm, name: "   " };
      expect(validateUserForm(form, mode)).toBe("El nombre debe tener al menos 2 caracteres.");
    });

    it("should reject invalid email", () => {
      const form = { ...validForm, email: "not-an-email" };
      expect(validateUserForm(form, mode)).toBe("Ingresa un correo válido.");
    });

    it("should reject invalid roleId (empty)", () => {
      const form = { ...validForm, roleId: "" };
      expect(validateUserForm(form, mode)).toBe("Selecciona un rol válido.");
    });

    it("should reject roleId of 0", () => {
      const form = { ...validForm, roleId: "0" };
      expect(validateUserForm(form, mode)).toBe("Selecciona un rol válido.");
    });

    it("should reject negative roleId", () => {
      const form = { ...validForm, roleId: "-1" };
      expect(validateUserForm(form, mode)).toBe("Selecciona un rol válido.");
    });

    it("should reject non-numeric roleId", () => {
      const form = { ...validForm, roleId: "abc" };
      expect(validateUserForm(form, mode)).toBe("Selecciona un rol válido.");
    });

    it("should reject password shorter than 8 characters in create mode", () => {
      const form = { ...validForm, password: "short" };
      expect(validateUserForm(form, mode)).toBe("La contraseña debe tener al menos 8 caracteres.");
    });

    it("should reject empty password in create mode", () => {
      const form = { ...validForm, password: "" };
      expect(validateUserForm(form, mode)).toBe("La contraseña debe tener al menos 8 caracteres.");
    });
  });

  describe("validateUserForm – edit mode", () => {
    const mode: FormMode = "edit";

    it("should return null when password is empty (no change)", () => {
      const form = { ...validForm, password: "" };
      expect(validateUserForm(form, mode)).toBeNull();
    });

    it("should return null when password is long enough", () => {
      const form = { ...validForm, password: "newPassword123" };
      expect(validateUserForm(form, mode)).toBeNull();
    });

    it("should reject short password when provided in edit mode", () => {
      const form = { ...validForm, password: "short" };
      expect(validateUserForm(form, mode)).toBe(
        "La nueva contraseña debe tener al menos 8 caracteres.",
      );
    });

    it("should still validate name in edit mode", () => {
      const form = { ...validForm, name: "A", password: "" };
      expect(validateUserForm(form, mode)).toBe("El nombre debe tener al menos 2 caracteres.");
    });

    it("should still validate email in edit mode", () => {
      const form = { ...validForm, email: "bad", password: "" };
      expect(validateUserForm(form, mode)).toBe("Ingresa un correo válido.");
    });
  });
});
