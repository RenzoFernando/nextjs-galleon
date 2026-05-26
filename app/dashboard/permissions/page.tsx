"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { listPermissions } from "@/lib/api/permissions.api";
import type { Permission } from "@/types/permission";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const data = await listPermissions();
        setPermissions(data);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPermissions();
  }, []);

  return (
    <AppShell>
      <section className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl italic text-[#F2E8D5]">Permisos</h1>
          <p className="mt-2 text-sm text-[#D6CCA8]/80">Listado de permisos del sistema.</p>
        </div>

        <div className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] shadow-xl shadow-black/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0C0C00]/50 text-[#B39F84]">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Nombre</th>
                  <th className="px-6 py-4 font-semibold">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B39F84]/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#D6CCA8]/50">
                      Cargando permisos...
                    </td>
                  </tr>
                ) : permissions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#D6CCA8]/50">
                      No se encontraron permisos.
                    </td>
                  </tr>
                ) : (
                  permissions.map((permission) => (
                    <tr key={permission.id} className="transition hover:bg-[#B39F84]/5">
                      <td className="px-6 py-4 text-[#D6CCA8]">{permission.id}</td>
                      <td className="px-6 py-4 font-medium text-[#F2E8D5]">
                        <span className="rounded-full border border-[#B39F84]/20 bg-[#0C0C00]/40 px-3 py-1 text-xs">
                          {permission.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#D6CCA8]">{permission.description ?? "N/A"}</td>
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
