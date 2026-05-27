"use client";

interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
}

export function Loading({
  label = "Cargando…",
  fullScreen = false,
}: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-[#D6CCA8]/60">
      <svg
        className="h-8 w-8 animate-spin text-[#B39F84]"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>

      <p className="text-sm">{label}</p>
    </div>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0C0C00] px-6 text-[#D6CCA8]">
      <section className="rounded-3xl border border-[#B39F84]/30 bg-[#19242E] px-8 py-6 text-center shadow-2xl shadow-black/50">
        {content}
      </section>
    </main>
  );
}
