import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0C0C00] px-6 py-10 text-[#D6CCA8]">
      <section className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-[#B39F84]/30 bg-[#19242E] p-8 text-center shadow-2xl shadow-black/40">
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">Gringotts</p>
          <h1 className="mt-4 font-serif text-4xl italic text-[#F2E8D5]">Inicio de sesión</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#D6CCA8]/80">
            Esta ruta queda reservada para la integración de autenticación. Mientras tanto, usa el token manual en localStorage para probar las bóvedas.
          </p>
          <Link
            href="/vaults"
            className="mt-8 inline-flex rounded-full bg-[#B39F84] px-6 py-3 text-sm font-bold text-[#0C0C00] transition hover:bg-[#D6CCA8]"
          >
            Ir a bóvedas
          </Link>
        </div>
      </section>
    </main>
  );
}
