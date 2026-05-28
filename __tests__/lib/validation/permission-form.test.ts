import { describe, it, expect } from "vitest";
import { validatePermissionForm, type PermForm } from "@/lib/validation/permission-form";

describe("Permission Form Validation", () => {
  const validForm: PermForm = {
    name: "user_read",
    description: "Allows reading user data",
  };

  it("should return null for a valid form", () => {
    expect(validatePermissionForm(validForm)).toBeNull();
  });

  it("should return null for form with empty description", () => {
    expect(validatePermissionForm({ ...validForm, description: "" })).toBeNull();
  });

  it("should return null for name with hyphens and underscores", () => {
    expect(validatePermissionForm({ ...validForm, name: "vault-manage_v2" })).toBeNull();
  });

  describe("name validation", () => {
    it("should reject name shorter than 2 characters", () => {
      const form = { ...validForm, name: "a" };
      expect(validatePermissionForm(form)).toBe(
        "El nombre del permiso debe tener al menos 2 caracteres.",
      );
    });

    it("should reject empty name", () => {
      const form = { ...validForm, name: "" };
      expect(validatePermissionForm(form)).toBe(
        "El nombre del permiso debe tener al menos 2 caracteres.",
      );
    });

    it("should reject name that is only whitespace", () => {
      const form = { ...validForm, name: "   " };
      expect(validatePermissionForm(form)).toBe(
        "El nombre del permiso debe tener al menos 2 caracteres.",
      );
    });

    it("should reject name longer than 80 characters", () => {
      const form = { ...validForm, name: "a".repeat(81) };
      expect(validatePermissionForm(form)).toBe(
        "El nombre del permiso no debe superar 80 caracteres.",
      );
    });

    it("should accept name exactly 80 characters", () => {
      const form = { ...validForm, name: "a".repeat(80) };
      expect(validatePermissionForm(form)).toBeNull();
    });

    it("should accept name exactly 2 characters", () => {
      const form = { ...validForm, name: "ab" };
      expect(validatePermissionForm(form)).toBeNull();
    });

    it("should reject name with spaces", () => {
      const form = { ...validForm, name: "user read" };
      expect(validatePermissionForm(form)).toBe(
        "El nombre del permiso solo puede usar letras, números, guion o guion bajo.",
      );
    });

    it("should reject name with special characters", () => {
      const form = { ...validForm, name: "perm@read" };
      expect(validatePermissionForm(form)).toBe(
        "El nombre del permiso solo puede usar letras, números, guion o guion bajo.",
      );
    });
  });

  describe("description validation", () => {
    it("should reject description longer than 180 characters", () => {
      const form = { ...validForm, description: "a".repeat(181) };
      expect(validatePermissionForm(form)).toBe(
        "La descripción no debe superar 180 caracteres.",
      );
    });

    it("should accept description exactly 180 characters", () => {
      const form = { ...validForm, description: "a".repeat(180) };
      expect(validatePermissionForm(form)).toBeNull();
    });
  });
});
