import { redirect } from "next/navigation";

export default function DashboardUsersRedirectPage() {
  redirect("/admin/users");
}
