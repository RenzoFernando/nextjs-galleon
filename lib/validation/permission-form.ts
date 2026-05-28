export interface PermForm {
  name: string;
  description: string;
}

export const emptyPermForm: PermForm = { name: "", description: "" };

export function validatePermissionForm(form: PermForm): string | null {
  if (form.name.trim().length < 2) {
    return "El nombre del permiso debe tener al menos 2 caracteres.";
  }

  if (form.name.trim().length > 80) {
    return "El nombre del permiso no debe superar 80 caracteres.";
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(form.name.trim())) {
    return "El nombre del permiso solo puede usar letras, números, guion o guion bajo.";
  }

  if (form.description.trim().length > 180) {
    return "La descripción no debe superar 180 caracteres.";
  }

  return null;
}
