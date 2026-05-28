"use client";

interface ErrorMessageProps {
  message: string | string[] | null;
  title?: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, title, onDismiss }: ErrorMessageProps) {
  if (!message || (Array.isArray(message) && message.length === 0)) {
    return null;
  }

  const normalizedMessage = Array.isArray(message) ? message.join(" ") : message;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 rounded-2xl border border-[#7B2E2E]/60 bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]"
    >
      <span className="mt-0.5 shrink-0 text-[#E05555]" aria-hidden="true">
        ⚠
      </span>

      <div className="flex-1">
        {title ? <p className="mb-1 font-semibold text-[#F2E8D5]">{title}</p> : null}

        <p className="leading-6 text-[#F2E8D5]/90">{normalizedMessage}</p>
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full px-2 text-[#D6CCA8]/60 transition hover:bg-[#F2E8D5]/10 hover:text-[#F2E8D5]"
          aria-label="Cerrar mensaje"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
