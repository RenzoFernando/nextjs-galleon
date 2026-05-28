"use client";

import Image from "next/image";
import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useAuthStore } from "@/store/auth.store";

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

  const isSubmitDisabled = isLoading || !email.trim() || !password;

  useEffect(() => {
    if (!hasHydrated && !isLoading) {
      void loadSession();
    }
  }, [hasHydrated, isLoading, loadSession]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

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
    <main className="flex min-h-screen items-center justify-center bg-[#11180F] px-6 py-12 text-[#D6CCA8]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#B39F84]/25 bg-[#19242E]/95 p-8 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#B39F84]/45 bg-[#0C0C00] shadow-inner shadow-black/70">
            <Image
              src="/logo.png"
              alt="Logo de Gringotts"
              width={96}
              height={96}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#B39F84]">Gringotts</p>

          <h1 className="mt-4 font-serif text-4xl font-semibold italic tracking-tight text-[#F2E8D5]">
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
              onChange={(event) => {
                setEmail(event.target.value);

                if (error) {
                  clearError();
                }
              }}
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
              onChange={(event) => {
                setPassword(event.target.value);

                if (error) {
                  clearError();
                }
              }}
              required
              disabled={isLoading}
              className="rounded-2xl border border-[#B39F84]/25 bg-black/30 px-4 py-3 text-[#F2E8D5] outline-none transition placeholder:text-[#D6CCA8]/40 focus:border-[#B39F84] focus:ring-2 focus:ring-[#B39F84]/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="••••••••"
            />
          </label>

          <ErrorMessage title="No se pudo iniciar sesión" message={error} onDismiss={clearError} />

          <Button
            type="submit"
            loading={isLoading}
            loadingText="Ingresando..."
            disabled={isSubmitDisabled}
            className="w-full !bg-[#F2E8D5] py-3 text-base font-bold tracking-wide !text-[#0C0C00] shadow-lg shadow-black/30 hover:!bg-white disabled:!bg-[#B39F84]/45 disabled:!text-[#0C0C00]/60"
          >
            Ingresar
          </Button>
        </form>
      </section>
    </main>
  );
}
