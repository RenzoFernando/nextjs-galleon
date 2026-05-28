"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getApiErrorMessage } from "@/lib/api/http";
import {
  FRONTEND_DEMO_SEED,
  runFrontendDemoSeed,
  type FrontendSeedResult,
  type SeedStepStatus,
} from "@/lib/seed/frontend-demo-seed";

const statusLabels: Record<SeedStepStatus, string> = {
  created: "Creado",
  exists: "Existente",
  updated: "Actualizado",
  assigned: "Asignado",
  skipped: "Omitido",
};

const statusClasses: Record<SeedStepStatus, string> = {
  created: "border-[#3F6F4A]/40 bg-[#3F6F4A]/15 text-[#CDE8C8]",
  exists: "border-[#B39F84]/30 bg-[#B39F84]/10 text-[#F2E8D5]",
  updated: "border-[#A9783F]/40 bg-[#A9783F]/15 text-[#F2D1A8]",
  assigned: "border-[#3F6F4A]/40 bg-[#3F6F4A]/15 text-[#CDE8C8]",
  skipped: "border-[#D6CCA8]/20 bg-[#D6CCA8]/10 text-[#D6CCA8]",
};

export default function AdminSeedPage() {
  const [result, setResult] = useState<FrontendSeedResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRunSeed() {
    setIsRunning(true);
    setError(null);

    try {
      const seedResult = await runFrontendDemoSeed();
      setResult(seedResult);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo ejecutar el seed desde el frontend."));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <AppShell allowedRoles={["superadmin"]}>
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl italic text-[#F2E8D5]">Seed frontend</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#D6CCA8]/80">
              Carga datos administrativos usando los endpoints existentes del backend, sin modificar
              archivos de NestJS ni depender del seed del servidor.
            </p>
          </div>

          <Button
            onClick={() => void handleRunSeed()}
            loading={isRunning}
            loadingText="Cargando seed…"
          >
            Ejecutar seed frontend
          </Button>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
              Datos que se cargan
            </p>

            <div className="mt-5 space-y-4 text-sm text-[#D6CCA8]">
              <div className="rounded-2xl border border-[#B39F84]/15 bg-[#0C0C00]/35 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Rol</p>
                <p className="mt-2 font-semibold text-[#F2E8D5]">{FRONTEND_DEMO_SEED.roleName}</p>
                <p className="mt-1 text-xs text-[#D6CCA8]/70">
                  {FRONTEND_DEMO_SEED.roleDescription}
                </p>
              </div>

              <div className="rounded-2xl border border-[#B39F84]/15 bg-[#0C0C00]/35 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Permiso</p>
                <p className="mt-2 font-semibold text-[#F2E8D5]">
                  {FRONTEND_DEMO_SEED.permissionName}
                </p>
                <p className="mt-1 text-xs text-[#D6CCA8]/70">
                  {FRONTEND_DEMO_SEED.permissionDescription}
                </p>
              </div>

              <div className="rounded-2xl border border-[#B39F84]/15 bg-[#0C0C00]/35 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">Usuario</p>
                <p className="mt-2 font-semibold text-[#F2E8D5]">{FRONTEND_DEMO_SEED.userName}</p>
                <dl className="mt-3 space-y-2 text-xs text-[#D6CCA8]/75">
                  <div className="flex justify-between gap-4">
                    <dt>Correo</dt>
                    <dd className="text-right font-semibold text-[#F2E8D5]">
                      {FRONTEND_DEMO_SEED.userEmail}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Contraseña</dt>
                    <dd className="text-right font-semibold text-[#F2E8D5]">
                      {FRONTEND_DEMO_SEED.userPassword}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] p-6 shadow-xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B39F84]">
                  Resultado
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#F2E8D5]">Estado de la carga</h2>
              </div>

              {result ? (
                <span className="rounded-full border border-[#3F6F4A]/40 bg-[#3F6F4A]/15 px-3 py-1 text-xs font-semibold text-[#CDE8C8]">
                  Seed ejecutado
                </span>
              ) : null}
            </div>

            {result ? (
              <div className="mt-6 space-y-3">
                {result.steps.map((step) => (
                  <div
                    key={`${step.label}-${step.detail}`}
                    className="rounded-2xl border border-[#B39F84]/15 bg-[#0C0C00]/30 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-[#F2E8D5]">{step.label}</p>
                      <span
                        className={[
                          "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          statusClasses[step.status],
                        ].join(" ")}
                      >
                        {statusLabels[step.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#D6CCA8]/75">{step.detail}</p>
                  </div>
                ))}

                <div className="rounded-2xl border border-[#B39F84]/15 bg-[#0C0C00]/35 p-4 text-sm text-[#D6CCA8]">
                  <p>
                    Usuario listo para iniciar sesión:{" "}
                    <span className="font-semibold text-[#F2E8D5]">{result.user.email}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[#B39F84]/15 bg-[#0C0C00]/30 p-6 text-sm leading-6 text-[#D6CCA8]/75">
                Ejecuta el seed para crear o actualizar el rol, el permiso y el usuario demo. El
                proceso es idempotente: si los datos ya existen, los reutiliza o los actualiza.
              </div>
            )}
          </article>
        </div>
      </section>
    </AppShell>
  );
}
