import { redirect } from "next/navigation";

export default function DashboardPermissionsRedirectPage() {
  redirect("/admin/permissions");
}
