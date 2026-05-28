export interface RoleForm {
  name: string;
  description: string;
}

export const emptyRoleForm: RoleForm = { name: "", description: "" };

export function validateRoleForm(form: RoleForm): string | null {
  if (form.name.trim().length < 2) {
    return "El nombre del rol debe tener al menos 2 caracteres.";
  }

  if (form.name.trim().length > 60) {
    return "El nombre del rol no debe superar 60 caracteres.";
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(form.name.trim())) {
    return "El nombre del rol solo puede usar letras, números, guion o guion bajo.";
  }

  if (form.description.trim().length > 180) {
    return "La descripción no debe superar 180 caracteres.";
  }

  return null;
}
