"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { listRoles } from "@/lib/api/roles.api";
import type { Role } from "@/types/role";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const data = await listRoles();
        setRoles(data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRoles();
  }, []);

  return (
    <AppShell>
      <section className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl italic text-[#F2E8D5]">Roles</h1>
          <p className="mt-2 text-sm text-[#D6CCA8]/80">Gestión de roles del sistema.</p>
        </div>

        <div className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] shadow-xl shadow-black/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0C0C00]/50 text-[#B39F84]">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Nombre</th>
                  <th className="px-6 py-4 font-semibold">Descripción</th>
                  <th className="px-6 py-4 font-semibold">Permisos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B39F84]/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[#D6CCA8]/50">
                      Cargando roles...
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[#D6CCA8]/50">
                      No se encontraron roles.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="transition hover:bg-[#B39F84]/5">
                      <td className="px-6 py-4 text-[#D6CCA8]">{role.id}</td>
                      <td className="px-6 py-4 font-medium text-[#F2E8D5]">{role.name}</td>
                      <td className="px-6 py-4 text-[#D6CCA8]">{role.description ?? "N/A"}</td>
                      <td className="px-6 py-4 text-[#D6CCA8]">
                        {role.rolePermissions?.length ?? 0} asignados
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
