"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#B39F84] text-[#0C0C00] hover:bg-[#C4B394] disabled:bg-[#B39F84]/50",
  danger:
    "bg-[#7B2E2E] text-[#F2E8D5] hover:bg-[#943737] disabled:bg-[#7B2E2E]/50",
  ghost:
    "border border-[#B39F84]/30 text-[#D6CCA8] hover:bg-[#B39F84]/10 hover:text-[#F2E8D5] disabled:opacity-50",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#B39F84]/40 disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
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
          Procesando…
        </>
      ) : (
        children
      )}
    </button>
  );
}
