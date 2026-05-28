import { describe, it, expect } from "vitest";
import { validateRoleForm, type RoleForm } from "@/lib/validation/role-form";

describe("Role Form Validation", () => {
  const validForm: RoleForm = {
    name: "editor",
    description: "Can edit content",
  };

  it("should return null for a valid form", () => {
    expect(validateRoleForm(validForm)).toBeNull();
  });

  it("should return null for form with empty description", () => {
    expect(validateRoleForm({ ...validForm, description: "" })).toBeNull();
  });

  it("should return null for name with hyphens and underscores", () => {
    expect(validateRoleForm({ ...validForm, name: "content-editor_v2" })).toBeNull();
  });

  describe("name validation", () => {
    it("should reject name shorter than 2 characters", () => {
      const form = { ...validForm, name: "a" };
      expect(validateRoleForm(form)).toBe("El nombre del rol debe tener al menos 2 caracteres.");
    });

    it("should reject empty name", () => {
      const form = { ...validForm, name: "" };
      expect(validateRoleForm(form)).toBe("El nombre del rol debe tener al menos 2 caracteres.");
    });

    it("should reject name that is only whitespace", () => {
      const form = { ...validForm, name: "   " };
      expect(validateRoleForm(form)).toBe("El nombre del rol debe tener al menos 2 caracteres.");
    });

    it("should reject name longer than 60 characters", () => {
      const form = { ...validForm, name: "a".repeat(61) };
      expect(validateRoleForm(form)).toBe("El nombre del rol no debe superar 60 caracteres.");
    });

    it("should accept name exactly 60 characters", () => {
      const form = { ...validForm, name: "a".repeat(60) };
      expect(validateRoleForm(form)).toBeNull();
    });

    it("should accept name exactly 2 characters", () => {
      const form = { ...validForm, name: "ab" };
      expect(validateRoleForm(form)).toBeNull();
    });

    it("should reject name with spaces", () => {
      const form = { ...validForm, name: "my role" };
      expect(validateRoleForm(form)).toBe(
        "El nombre del rol solo puede usar letras, números, guion o guion bajo.",
      );
    });

    it("should reject name with special characters", () => {
      const form = { ...validForm, name: "role@admin" };
      expect(validateRoleForm(form)).toBe(
        "El nombre del rol solo puede usar letras, números, guion o guion bajo.",
      );
    });

    it("should reject name with dots", () => {
      const form = { ...validForm, name: "role.admin" };
      expect(validateRoleForm(form)).toBe(
        "El nombre del rol solo puede usar letras, números, guion o guion bajo.",
      );
    });
  });

  describe("description validation", () => {
    it("should reject description longer than 180 characters", () => {
      const form = { ...validForm, description: "a".repeat(181) };
      expect(validateRoleForm(form)).toBe("La descripción no debe superar 180 caracteres.");
    });

    it("should accept description exactly 180 characters", () => {
      const form = { ...validForm, description: "a".repeat(180) };
      expect(validateRoleForm(form)).toBeNull();
    });
  });
});
