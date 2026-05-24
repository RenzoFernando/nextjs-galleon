"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import Image from "next/image";

export function LoginForm() {
  const router = useRouter();

  const login = useAuthStore((state) => state.login);
  const loadSession = useAuthStore((state) => state.loadSession);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const error = useAuthStore((state) => state.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    try {
      await login({
        email: email.trim(),
        password,
      });

      router.replace("/dashboard");
    } catch {
      // El store ya guarda el mensaje de error.
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#283629] px-6 py-12 text-[#D6CCA8]">
      <section className="w-full max-w-md rounded-3xl border border-[#B39F84]/30 bg-[#19242E] p-8 shadow-2xl shadow-black/50">
        <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#B39F84]/35 bg-[#B39F84]/70 shadow-inner shadow-black/60">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#0C0C00]/70">
                    <Image
                        src="/logo.png"
                        alt="Logo de Gringotts"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                    />
                </span>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B39F84]">
                Gringotts
            </p>

            <h1 className="mt-4 font-serif text-4xl italic text-[#F2E8D5]">
                Iniciar sesión
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#D6CCA8]/80">
                Accede a tu bóveda y administra tus movimientos financieros.
            </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]" htmlFor="email">
            Correo electrónico
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/40 focus:border-[#B39F84] focus:ring-2 focus:ring-[#B39F84]/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="usuario@correo.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#F2E8D5]" htmlFor="password">
            Contraseña
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isLoading}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/40 focus:border-[#B39F84] focus:ring-2 focus:ring-[#B39F84]/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-4 py-3 text-sm leading-6 text-[#F2E8D5]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#6b3433] px-6 py-3 text-sm font-bold text-[#D6CCA8] transition hover:bg-[#692524] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

      </section>
    </main>
  );
}