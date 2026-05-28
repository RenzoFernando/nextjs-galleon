export type FormMode = "create" | "edit";

export interface UserForm {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

export const emptyUserForm: UserForm = { name: "", email: "", password: "", roleId: "" };

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateUserForm(form: UserForm, mode: FormMode): string | null {
  if (form.name.trim().length < 2) {
    return "El nombre debe tener al menos 2 caracteres.";
  }

  if (!isValidEmail(form.email)) {
    return "Ingresa un correo válido.";
  }

  if (!Number.isInteger(Number(form.roleId)) || Number(form.roleId) <= 0) {
    return "Selecciona un rol válido.";
  }

  if (mode === "create" && form.password.trim().length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (mode === "edit" && form.password.trim() && form.password.trim().length < 8) {
    return "La nueva contraseña debe tener al menos 8 caracteres.";
  }

  return null;
}
