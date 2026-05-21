import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#0C0C00] px-6 py-10 text-[#D6CCA8]">
      <section className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-[#7B2E2E] bg-[#2A1111] p-8 text-center shadow-2xl shadow-black/40">
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Acceso restringido</p>
          <h1 className="mt-4 font-serif text-4xl italic text-[#F2E8D5]">No autorizado</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#D6CCA8]/80">
            No tienes permisos suficientes para entrar a esta sección.
          </p>
          <Link
            href="/vaults"
            className="mt-8 inline-flex rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8]"
          >
            Volver a bóvedas
          </Link>
        </div>
      </section>
    </main>
  );
}
