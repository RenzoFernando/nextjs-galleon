"use client";

import { type ReactNode, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";

interface AppShellProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requireAllPermissions?: boolean;
}

export function AppShell({
  children,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = true,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedRoute
      allowedRoles={allowedRoles}
      requiredPermissions={requiredPermissions}
      requireAllPermissions={requireAllPermissions}
    >
      <div className="min-h-screen bg-[#0C0C00] text-[#D6CCA8]">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="min-h-screen lg:pl-72">
          <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AppShell;
