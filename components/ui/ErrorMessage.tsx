"use client";

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#7B2E2E]/60 bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
      <span className="mt-0.5 shrink-0 text-[#E05555]" aria-hidden="true">
        ⚠
      </span>

      <p className="flex-1">{message}</p>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[#D6CCA8]/60 transition hover:text-[#F2E8D5]"
          aria-label="Cerrar mensaje"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
