"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { listUsers } from "@/lib/api/users.api";
import type { User } from "@/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await listUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <AppShell>
      <section className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl italic text-[#F2E8D5]">Usuarios</h1>
          <p className="mt-2 text-sm text-[#D6CCA8]/80">Gestión de usuarios del sistema.</p>
        </div>

        <div className="rounded-3xl border border-[#B39F84]/20 bg-[#19242E] shadow-xl shadow-black/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0C0C00]/50 text-[#B39F84]">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Nombre</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B39F84]/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[#D6CCA8]/50">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[#D6CCA8]/50">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-[#B39F84]/5">
                      <td className="px-6 py-4 text-[#D6CCA8]">{user.id}</td>
                      <td className="px-6 py-4 font-medium text-[#F2E8D5]">{user.name}</td>
                      <td className="px-6 py-4 text-[#D6CCA8]">{user.email}</td>
                      <td className="px-6 py-4 text-[#D6CCA8]">
                        <span className="rounded-full border border-[#B39F84]/20 bg-[#0C0C00]/40 px-2 py-1 text-xs">
                          {user.role?.name ?? "N/A"}
                        </span>
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
