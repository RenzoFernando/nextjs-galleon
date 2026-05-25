type VaultConfirmDeleteProps = {
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function VaultConfirmDelete({
  title,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: VaultConfirmDeleteProps) {
  return (
    <div className="rounded-2xl border border-[#7B2E2E]/60 bg-[#2A1111] p-4 text-sm text-[#F2E8D5]">
      <p>{title}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className="rounded-full bg-[#7B2E2E] px-4 py-2 font-semibold text-[#F2E8D5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Procesando..." : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[#B39F84]/40 px-4 py-2 font-semibold text-[#D6CCA8] transition hover:bg-[#B39F84]/10"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
