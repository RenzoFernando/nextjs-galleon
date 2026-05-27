import { redirect } from "next/navigation";

export default function DashboardRolesRedirectPage() {
  redirect("/admin/roles");
}
